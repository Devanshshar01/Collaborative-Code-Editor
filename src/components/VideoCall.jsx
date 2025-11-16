import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import io from 'socket.io-client';
import {SIGNALING_EVENTS} from '../types/video';
import SimplePeer from 'simple-peer';
import WebRTCDebugger from '../utils/webrtc-debug';
import {DEFAULT_WEBRTC_CONFIG, TURN_ONLY_CONFIG, WebRTCUtils, WebRTCErrorCodes} from '../config/webrtc';

const MAX_PARTICIPANTS = 6;
const ICE_CONNECTION_TIMEOUT = 30000; // 30 seconds
const PEER_CONNECTION_RETRY_DELAY = 2000; // 2 seconds

const mediaConstraints = {
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000
    },
    video: {
        width: {ideal: 1280},
        height: {ideal: 720},
        frameRate: {ideal: 60, max: 120}
    }
};

const VideoCall = ({
                       roomId,
                       userId,
                       userName,
                       serverUrl,
                       stunServers,
                       onParticipantsChange,
                       onError,
                       enableDebugMode = true
                   }) => {
    const [peers, setPeers] = useState([]);
    const [localStream, setLocalStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [connectionErrors, setConnectionErrors] = useState([]);
    const [iceConnectionStates, setIceConnectionStates] = useState(new Map());
    const [retryAttempts, setRetryAttempts] = useState(new Map());

    const socketRef = useRef(null);
    const peersRef = useRef({});
    const localVideoRef = useRef(null);
    const screenShareStreamRef = useRef(null);
    const pendingIceCandidatesRef = useRef({});
    const debuggerRef = useRef(null);
    const connectionTimeouts = useRef(new Map());

    // Initialize debugger
    useEffect(() => {
        if (enableDebugMode && roomId && userId) {
            debuggerRef.current = new WebRTCDebugger(roomId, userId);
            WebRTCUtils.logConfiguration();
        }
    }, [roomId, userId, enableDebugMode]);

    const iceServers = useMemo(() => {
        return stunServers || DEFAULT_WEBRTC_CONFIG.iceServers;
    }, [stunServers]);

    const log = useCallback((message, data = null) => {
        if (debuggerRef.current) {
            debuggerRef.current.log(message, data);
        }
    }, []);

    const logError = useCallback((message, error = null) => {
        if (debuggerRef.current) {
            debuggerRef.current.error(message, error);
        }
        console.error(`[VideoCall] ${message}`, error);
    }, []);

    const cleanupPeer = useCallback((peerId) => {
        log(`🧹 Cleaning up peer ${peerId}`);

        const peer = peersRef.current[peerId];
        if (peer) {
            peer.destroy();
            delete peersRef.current[peerId];
            setPeers(prev => prev.filter(p => p.peerId !== peerId));
            onParticipantsChange?.(Object.keys(peersRef.current));
        }

        // Clear connection timeout
        if (connectionTimeouts.current.has(peerId)) {
            clearTimeout(connectionTimeouts.current.get(peerId));
            connectionTimeouts.current.delete(peerId);
        }

        // Clear retry attempts
        setRetryAttempts(prev => {
            const newAttempts = new Map(prev);
            newAttempts.delete(peerId);
            return newAttempts;
        });

        // Clear ICE connection state
        setIceConnectionStates(prev => {
            const newStates = new Map(prev);
            newStates.delete(peerId);
            return newStates;
        });

        // Clear pending ICE candidates
        delete pendingIceCandidatesRef.current[peerId];
    }, [log, onParticipantsChange]);

    const cleanupAllPeers = useCallback(() => {
        log('🧹 Cleaning up all peers');
        Object.keys(peersRef.current).forEach(peerId => cleanupPeer(peerId));
        setPeers([]);
        onParticipantsChange?.([]);
    }, [cleanupPeer, log, onParticipantsChange]);

    const stopStreamTracks = useCallback((stream) => {
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                log(`🛑 Stopped ${track.kind} track`, {id: track.id});
            });
        }
    }, [log]);

    const handleMediaError = useCallback((error, context = 'media') => {
        logError(`Media error in ${context}`, error);

        let userMessage = 'Media access error';

        if (error.name === 'NotAllowedError') {
            userMessage = 'Camera/microphone access denied. Please check browser permissions.';
        } else if (error.name === 'NotFoundError') {
            userMessage = 'No camera or microphone found. Please connect a device.';
        } else if (error.name === 'OverconstrainedError') {
            userMessage = 'Camera settings not supported. Trying with default settings.';
        }

        onError?.(new Error(userMessage));
    }, [logError, onError]);

    const retryPeerConnection = useCallback(async (peerId, initiator, metadata, useTurnOnly = false) => {
        const currentRetries = retryAttempts.get(peerId) || 0;
        const maxRetries = useTurnOnly ? 2 : 3;

        if (currentRetries >= maxRetries) {
            logError(`Max retry attempts reached for peer ${peerId}`);
            setConnectionErrors(prev => [...prev, {
                peerId,
                error: `Failed to connect after ${maxRetries} attempts`,
                timestamp: Date.now()
            }]);
            return;
        }

        log(`🔄 Retrying connection to ${peerId} (attempt ${currentRetries + 1}/${maxRetries})${useTurnOnly ? ' with TURN only' : ''}`);

        setRetryAttempts(prev => new Map(prev).set(peerId, currentRetries + 1));

        // Clean up existing peer
        cleanupPeer(peerId);

        // Wait before retry
        setTimeout(() => {
            createPeer(peerId, initiator, metadata, useTurnOnly);
        }, PEER_CONNECTION_RETRY_DELAY);
    }, [retryAttempts, logError, log, cleanupPeer]);

    const toggleMute = useCallback(() => {
        if (!localStream) return;
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
            log(`🎤 Audio track ${track.enabled ? 'enabled' : 'disabled'}`);
        });

        const newMutedState = !audioTracks[0]?.enabled;
        setIsMuted(newMutedState);

        // Debug audio echo if unmuting
        if (!newMutedState && debuggerRef.current) {
            const remoteStreams = new Map();
            peers.forEach(peer => {
                if (peer.stream) {
                    remoteStreams.set(peer.peerId, peer.stream);
                }
            });
            debuggerRef.current.debugAudioEcho(localStream, remoteStreams);
        }

        socketRef.current?.emit(audioTracks[0]?.enabled ? SIGNALING_EVENTS.UNMUTE : SIGNALING_EVENTS.MUTE, {
            roomId,
            metadata: {
                socketId: socketRef.current?.id,
                userId,
                userName,
                audioEnabled: audioTracks[0]?.enabled ?? true,
                videoEnabled: isVideoEnabled
            }
        });
    }, [localStream, roomId, userId, userName, isVideoEnabled, log, peers]);

    const toggleVideo = useCallback(() => {
        if (!localStream) return;
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach(track => {
            track.enabled = !track.enabled;
            log(`📹 Video track ${track.enabled ? 'enabled' : 'disabled'}`);
        });

        const newVideoState = videoTracks[0]?.enabled ?? false;
        setIsVideoEnabled(newVideoState);

        socketRef.current?.emit(newVideoState ? SIGNALING_EVENTS.VIDEO_ON : SIGNALING_EVENTS.VIDEO_OFF, {
            roomId,
            metadata: {
                socketId: socketRef.current?.id,
                userId,
                userName,
                audioEnabled: !isMuted,
                videoEnabled: newVideoState
            }
        });
    }, [isMuted, localStream, roomId, userId, userName, log]);

    const startScreenShare = useCallback(async () => {
        if (!navigator.mediaDevices?.getDisplayMedia) {
            const error = new Error('Screen sharing is not supported in this browser.');
            onError?.(error);
            return;
        }

        try {
            log('🖥️ Starting screen share');
            const screenStream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: false});
            screenShareStreamRef.current = screenStream;
            setIsScreenSharing(true);

            Object.values(peersRef.current).forEach(peer => {
                log(`🖥️ Adding screen share stream to peer ${peer._id || 'unknown'}`);
                peer.addStream(screenStream);
            });

            screenStream.getVideoTracks()[0].onended = () => {
                log('🖥️ Screen share ended by user');
                stopScreenShare();
            };

            socketRef.current?.emit(SIGNALING_EVENTS.SCREEN_SHARE_ON, {roomId});
        } catch (error) {
            logError('Screen share failed', error);
            handleMediaError(error, 'screen-share');
        }
    }, [log, logError, handleMediaError, onError, roomId]);

    const stopScreenShare = useCallback(() => {
        const screenStream = screenShareStreamRef.current;
        if (!screenStream) return;

        log('🖥️ Stopping screen share');

        Object.values(peersRef.current).forEach(peer => {
            if (screenStream) {
                peer.removeStream(screenStream);
            }
            if (localStream) {
                peer.addStream(localStream);
            }
        });

        stopStreamTracks(screenStream);
        screenShareStreamRef.current = null;
        setIsScreenSharing(false);

        socketRef.current?.emit(SIGNALING_EVENTS.SCREEN_SHARE_OFF, {roomId});
    }, [localStream, roomId, log, stopStreamTracks]);

    const handleIncomingSignal = useCallback((fromSocketId, signal, metadata) => {
        const peer = peersRef.current[fromSocketId];
        if (peer) {
            try {
                peer.signal(signal);
                if (metadata) {
                    setPeers(prev => prev.map(p => p.peerId === fromSocketId ? {...p, metadata} : p));
                    onParticipantsChange?.(Object.keys(peersRef.current));
                }
            } catch (error) {
                logError(`Failed to handle signal from ${fromSocketId}`, error);
            }
        } else {
            log(`📦 Queuing signal for unknown peer ${fromSocketId}`);
            if (!pendingIceCandidatesRef.current[fromSocketId]) {
                pendingIceCandidatesRef.current[fromSocketId] = [];
            }
            pendingIceCandidatesRef.current[fromSocketId].push(signal);
        }
    }, [log, logError, onParticipantsChange]);

    const createPeer = useCallback((targetSocketId, initiator, metadata, useTurnOnly = false) => {
        if (!localStream) {
            logError('Cannot create peer without local stream');
            return null;
        }

        log(`🤝 Creating ${initiator ? 'initiator' : 'receiver'} peer for ${targetSocketId}${useTurnOnly ? ' (TURN only)' : ''}`);

        const config = useTurnOnly ? TURN_ONLY_CONFIG : DEFAULT_WEBRTC_CONFIG;

        const peer = new SimplePeer({
            initiator,
            trickle: true,
            stream: localStream,
            config: {
                iceServers: config.iceServers,
                iceCandidatePoolSize: config.iceCandidatePoolSize,
                bundlePolicy: config.bundlePolicy,
                rtcpMuxPolicy: config.rtcpMuxPolicy,
                iceTransportPolicy: config.iceTransportPolicy
            }
        });

        // Set up comprehensive debugging
        if (debuggerRef.current) {
            debuggerRef.current.debugIceConnection(targetSocketId, peer);
        }

        // Track ICE connection state
        let iceConnectionState = 'new';
        const updateIceState = (newState) => {
            iceConnectionState = newState;
            setIceConnectionStates(prev => new Map(prev).set(targetSocketId, newState));
            log(`🧊 ICE state for ${targetSocketId}: ${newState}`);
        };

        // Set connection timeout
        const timeout = setTimeout(() => {
            if (iceConnectionState !== 'connected' && iceConnectionState !== 'completed') {
                logError(`Connection timeout for peer ${targetSocketId}`);
                if (!useTurnOnly && TURN_ONLY_CONFIG.iceServers.length > 0) {
                    retryPeerConnection(targetSocketId, initiator, metadata, true);
                } else {
                    cleanupPeer(targetSocketId);
                }
            }
        }, ICE_CONNECTION_TIMEOUT);

        connectionTimeouts.current.set(targetSocketId, timeout);

        peer.on('signal', signal => {
            const event = initiator ? SIGNALING_EVENTS.OFFER : SIGNALING_EVENTS.ANSWER;
            if (signal.type === 'candidate') {
                log(`🧊 Sending ICE candidate for ${targetSocketId}`, {
                    candidate: signal.candidate
                });
                socketRef.current?.emit(SIGNALING_EVENTS.ICE_CANDIDATE, {
                    roomId,
                    targetSocketId,
                    data: {signal}
                });
            } else {
                log(`📡 Sending ${signal.type} to ${targetSocketId}`);
                socketRef.current?.emit(event, {
                    roomId,
                    targetSocketId,
                    data: {
                        signal,
                        metadata: {
                            socketId: socketRef.current?.id,
                            userId,
                            userName,
                            audioEnabled: !isMuted,
                            videoEnabled: isVideoEnabled
                        }
                    }
                });
            }
        });

        peer.on('connect', () => {
            log(`✅ Peer connected: ${targetSocketId}`);
            updateIceState('connected');

            // Clear timeout
            if (connectionTimeouts.current.has(targetSocketId)) {
                clearTimeout(connectionTimeouts.current.get(targetSocketId));
                connectionTimeouts.current.delete(targetSocketId);
            }

            // Clear retry attempts
            setRetryAttempts(prev => {
                const newAttempts = new Map(prev);
                newAttempts.delete(targetSocketId);
                return newAttempts;
            });
        });

        peer.on('stream', stream => {
            log(`📹 Received stream from ${targetSocketId}`, {
                streamId: stream.id,
                videoTracks: stream.getVideoTracks().length,
                audioTracks: stream.getAudioTracks().length
            });

            // Debug video stream
            if (debuggerRef.current) {
                // We'll set up video element debugging when the video ref is ready
                setTimeout(() => {
                    const videoElement = document.querySelector(`video[data-peer-id="${targetSocketId}"]`);
                    if (videoElement) {
                        debuggerRef.current.debugVideoStream(targetSocketId, stream, videoElement);
                    }
                }, 100);
            }

            setPeers(prev => {
                const existing = prev.find(p => p.peerId === targetSocketId);
                const newPeer = {
                    peerId: targetSocketId,
                    stream,
                    metadata: metadata || {userName: 'Participant', audioEnabled: true, videoEnabled: true}
                };
                if (existing) {
                    return prev.map(p => p.peerId === targetSocketId ? {
                        ...p,
                        stream,
                        metadata: metadata || p.metadata
                    } : p);
                }
                return [...prev, newPeer];
            });
        });

        peer.on('error', error => {
            logError(`Peer error for ${targetSocketId}`, error);

            updateIceState('failed');
            setConnectionErrors(prev => [...prev, {
                peerId: targetSocketId,
                error: error.message,
                timestamp: Date.now()
            }]);

            // Retry with TURN if this was a regular connection attempt
            if (!useTurnOnly && TURN_ONLY_CONFIG.iceServers.length > 0) {
                retryPeerConnection(targetSocketId, initiator, metadata, true);
            } else {
                cleanupPeer(targetSocketId);
            }
        });

        peer.on('close', () => {
            log(`🔒 Peer connection closed: ${targetSocketId}`);
            updateIceState('closed');
            cleanupPeer(targetSocketId);
        });

        // Handle ICE connection state changes
        if (peer._pc) {
            peer._pc.oniceconnectionstatechange = () => {
                const state = peer._pc.iceConnectionState;
                updateIceState(state);

                if (state === 'failed') {
                    if (!useTurnOnly && TURN_ONLY_CONFIG.iceServers.length > 0) {
                        retryPeerConnection(targetSocketId, initiator, metadata, true);
                    } else {
                        cleanupPeer(targetSocketId);
                    }
                }
            };
        }

        peersRef.current[targetSocketId] = peer;
        return peer;
    }, [cleanupPeer, isMuted, isVideoEnabled, localStream, roomId, userId, userName, log, logError, retryPeerConnection]);

    // Initialize media and socket connection
    useEffect(() => {
        log('🚀 Initializing VideoCall component');

        // Initialize Socket.IO connection
        socketRef.current = io(serverUrl, {transports: ['websocket']});
        const socket = socketRef.current;

        const initializeMedia = async () => {
            try {
                log('🎥 Requesting user media', mediaConstraints);
                const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

                log('✅ User media obtained', {
                    streamId: stream.id,
                    videoTracks: stream.getVideoTracks().length,
                    audioTracks: stream.getAudioTracks().length
                });

                setLocalStream(stream);

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    log('📺 Local video element configured');
                }

                socket.emit('join-room', {roomId, user: {id: userId, name: userName}});
                socket.emit('webrtc-metadata', {
                    roomId,
                    metadata: {
                        socketId: socket.id,
                        userId,
                        userName,
                        audioEnabled: true,
                        videoEnabled: true
                    }
                });

            } catch (error) {
                logError('Failed to initialize media', error);
                handleMediaError(error, 'initialization');
            }
        };

        initializeMedia();

        // Socket event handlers
        socket.on('user-joined', users => {
            log(`👥 Users joined room`, {userCount: users.length});
            users.slice(0, MAX_PARTICIPANTS).forEach(user => {
                const socketId = user.id;
                if (socketId !== socket.id && !peersRef.current[socketId]) {
                    createPeer(socketId, true, {
                        userId: user.id,
                        userName: user.name,
                        audioEnabled: true,
                        videoEnabled: true
                    });
                }
            });
        });

        socket.on('webrtc-peer-metadata', ({fromSocketId, metadata}) => {
            log(`📋 Received metadata from ${fromSocketId}`, metadata);
            setPeers(prev => prev.map(peer => peer.peerId === fromSocketId ? {...peer, metadata} : peer));
        });

        socket.on(SIGNALING_EVENTS.OFFER, ({fromSocketId, data}) => {
            log(`📥 Received OFFER from ${fromSocketId}`);
            const peer = createPeer(fromSocketId, false, data.metadata);
            if (peer) {
                peer.signal(data.signal);
                // Process any queued ICE candidates
                if (pendingIceCandidatesRef.current[fromSocketId]) {
                    log(`📦 Processing ${pendingIceCandidatesRef.current[fromSocketId].length} queued candidates for ${fromSocketId}`);
                    pendingIceCandidatesRef.current[fromSocketId].forEach(candidate => peer.signal(candidate));
                    delete pendingIceCandidatesRef.current[fromSocketId];
                }
            }
        });

        socket.on(SIGNALING_EVENTS.ANSWER, ({fromSocketId, data}) => {
            log(`📥 Received ANSWER from ${fromSocketId}`);
            handleIncomingSignal(fromSocketId, data.signal, data.metadata);
        });

        socket.on(SIGNALING_EVENTS.ICE_CANDIDATE, ({fromSocketId, data}) => {
            log(`🧊 Received ICE candidate from ${fromSocketId}`);
            const peer = peersRef.current[fromSocketId];
            if (peer) {
                peer.signal(data.signal);
            } else {
                log(`📦 Queuing ICE candidate for ${fromSocketId}`);
                if (!pendingIceCandidatesRef.current[fromSocketId]) {
                    pendingIceCandidatesRef.current[fromSocketId] = [];
                }
                pendingIceCandidatesRef.current[fromSocketId].push(data.signal);
            }
        });

        socket.on('user-left', (users) => {
            log(`👋 User left room, cleaning up connections`);
            // Clean up peers that are no longer in the room
            const remainingUserIds = users.map(u => u.id);
            Object.keys(peersRef.current).forEach(peerId => {
                if (!remainingUserIds.includes(peerId)) {
                    cleanupPeer(peerId);
                }
            });
        });

        return () => {
            log('🧹 VideoCall component cleanup');
            stopScreenShare();
            stopStreamTracks(localStream);
            cleanupAllPeers();

            // Clear all timeouts
            connectionTimeouts.current.forEach(timeout => clearTimeout(timeout));
            connectionTimeouts.current.clear();

            socket.disconnect();
        };
    }, [cleanupAllPeers, createPeer, handleIncomingSignal, handleMediaError, localStream, log, logError, onError, roomId, serverUrl, stopScreenShare, stopStreamTracks, userId, userName]);

    // Debug panel component
    const DebugPanel = () => {
        if (!enableDebugMode) return null;

        return (
            <div className="debug-panel" style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '10px',
                borderRadius: '5px',
                fontSize: '12px',
                maxWidth: '300px',
                zIndex: 1000
            }}>
                <div><strong>🔧 Debug Info</strong></div>
                <div>Peers: {Object.keys(peersRef.current).length}</div>
                <div>Errors: {connectionErrors.length}</div>
                {Array.from(iceConnectionStates.entries()).map(([peerId, state]) => (
                    <div key={peerId}>
                        {peerId.slice(0, 8)}: {state}
                    </div>
                ))}
                {debuggerRef.current && (
                    <button
                        onClick={() => debuggerRef.current.exportDebugReport()}
                        style={{
                            marginTop: '5px',
                            padding: '2px 5px',
                            fontSize: '10px',
                            background: 'transparent',
                            border: '1px solid white',
                            color: 'white',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                    >
                        Export Debug Report
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="video-call-container" style={{position: 'relative', height: '100%'}}>
            <DebugPanel/>

            <div className="video-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px',
                padding: '10px',
                height: 'calc(100% - 80px)'
            }}>
                <div className="video-tile local" style={{
                    position: 'relative',
                    background: '#000',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                    <div className="participant-name" style={{
                        position: 'absolute',
                        bottom: '5px',
                        left: '5px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                    }}>
                        {userName} (You)
                        {isMuted && <span> 🔇</span>}
                        {!isVideoEnabled && <span> 📹</span>}
                        {isScreenSharing && <span> 🖥️</span>}
                    </div>
                </div>

                {peers.map(peer => (
                    <div key={peer.peerId} className="video-tile remote" style={{
                        position: 'relative',
                        background: '#000',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}>
                        <video
                            data-peer-id={peer.peerId}
                            autoPlay
                            playsInline
                            ref={video => {
                                if (video && peer.stream) {
                                    video.srcObject = peer.stream;
                                }
                            }}
                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                        />
                        <div className="participant-name" style={{
                            position: 'absolute',
                            bottom: '5px',
                            left: '5px',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                        }}>
                            {peer.metadata?.userName || 'Participant'}
                            {!peer.metadata?.audioEnabled && <span> 🔇</span>}
                            {!peer.metadata?.videoEnabled && <span> 📹</span>}
                            <span style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                marginLeft: '5px',
                                backgroundColor:
                                    iceConnectionStates.get(peer.peerId) === 'connected' ? '#4caf50' :
                                        iceConnectionStates.get(peer.peerId) === 'checking' ? '#ff9800' : '#f44336'
                            }}/>
                        </div>
                    </div>
                ))}
            </div>

            <div className="controls" style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                padding: '20px',
                background: 'rgba(0,0,0,0.1)',
                borderTop: '1px solid #333'
            }}>
                <button
                    onClick={toggleMute}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '25px',
                        border: 'none',
                        background: isMuted ? '#f44336' : '#4caf50',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {isMuted ? '🔇 Unmute' : '🎤 Mute'}
                </button>

                <button
                    onClick={toggleVideo}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '25px',
                        border: 'none',
                        background: isVideoEnabled ? '#4caf50' : '#f44336',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {isVideoEnabled ? '📹 Video On' : '📹 Video Off'}
                </button>

                <button
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '25px',
                        border: 'none',
                        background: isScreenSharing ? '#ff9800' : '#2196f3',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {isScreenSharing ? '🖥️ Stop Sharing' : '🖥️ Share Screen'}
                </button>
            </div>

            {connectionErrors.length > 0 && (
                <div className="connection-errors" style={{
                    position: 'absolute',
                    bottom: '100px',
                    left: '10px',
                    background: 'rgba(244, 67, 54, 0.9)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    maxWidth: '300px'
                }}>
                    <div><strong>⚠️ Connection Issues:</strong></div>
                    {connectionErrors.slice(-3).map((error, index) => (
                        <div key={index}>
                            {error.peerId.slice(0, 8)}: {error.error}
                        </div>
                    ))}
                    <button
                        onClick={() => setConnectionErrors([])}
                        style={{
                            marginTop: '5px',
                            padding: '2px 5px',
                            fontSize: '10px',
                            background: 'transparent',
                            border: '1px solid white',
                            color: 'white',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                    >
                        Clear
                    </button>
                </div>
            )}
        </div>
    );
};

export default VideoCall;
