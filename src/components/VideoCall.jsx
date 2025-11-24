import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
import { SIGNALING_EVENTS } from '../types/video';
import SimplePeer from 'simple-peer';
import WebRTCDebugger from '../utils/webrtc-debug';
import { DEFAULT_WEBRTC_CONFIG, TURN_ONLY_CONFIG, WebRTCUtils, WebRTCErrorCodes } from '../config/webrtc';
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, AlertCircle, Activity, Download, Users } from 'lucide-react';
import clsx from 'clsx';

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
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 60, max: 120 }
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

    const localStreamRef = useRef(null);
    const isMutedRef = useRef(false);
    const isVideoEnabledRef = useRef(true);
    const retryAttemptsRef = useRef(new Map());
    const createPeerRef = useRef(null);

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
        retryAttemptsRef.current.delete(peerId);

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
                log(`🛑 Stopped ${track.kind} track`, { id: track.id });
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
        const currentRetries = retryAttemptsRef.current.get(peerId) || 0;
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

        retryAttemptsRef.current.set(peerId, currentRetries + 1);

        // Clean up existing peer
        cleanupPeer(peerId);

        // Wait before retry
        setTimeout(() => {
            if (createPeerRef.current) {
                createPeerRef.current(peerId, initiator, metadata, useTurnOnly);
            }
        }, PEER_CONNECTION_RETRY_DELAY);
    }, [logError, log, cleanupPeer]);

    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;

        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
            log(`🎤 Audio track ${track.enabled ? 'enabled' : 'disabled'}`);
        });

        const newMutedState = !audioTracks[0]?.enabled;
        setIsMuted(newMutedState);
        isMutedRef.current = newMutedState;

        // Debug audio echo if unmuting
        if (!newMutedState && debuggerRef.current) {
            const remoteStreams = new Map();
            peers.forEach(peer => {
                if (peer.stream) {
                    remoteStreams.set(peer.peerId, peer.stream);
                }
            });
            debuggerRef.current.debugAudioEcho(stream, remoteStreams);
        }

        socketRef.current?.emit(audioTracks[0]?.enabled ? SIGNALING_EVENTS.UNMUTE : SIGNALING_EVENTS.MUTE, {
            roomId,
            metadata: {
                socketId: socketRef.current?.id,
                userId,
                userName,
                audioEnabled: audioTracks[0]?.enabled ?? true,
                videoEnabled: isVideoEnabledRef.current
            }
        });
    }, [roomId, userId, userName, log, peers]);

    const toggleVideo = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;

        const videoTracks = stream.getVideoTracks();
        videoTracks.forEach(track => {
            track.enabled = !track.enabled;
            log(`📹 Video track ${track.enabled ? 'enabled' : 'disabled'}`);
        });

        const newVideoState = videoTracks[0]?.enabled ?? false;
        setIsVideoEnabled(newVideoState);
        isVideoEnabledRef.current = newVideoState;

        socketRef.current?.emit(newVideoState ? SIGNALING_EVENTS.VIDEO_ON : SIGNALING_EVENTS.VIDEO_OFF, {
            roomId,
            metadata: {
                socketId: socketRef.current?.id,
                userId,
                userName,
                audioEnabled: !isMutedRef.current,
                videoEnabled: newVideoState
            }
        });
    }, [roomId, userId, userName, log]);

    const startScreenShare = useCallback(async () => {
        if (!navigator.mediaDevices?.getDisplayMedia) {
            const error = new Error('Screen sharing is not supported in this browser.');
            onError?.(error);
            return;
        }

        try {
            log('🖥️ Starting screen share');
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
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

            socketRef.current?.emit(SIGNALING_EVENTS.SCREEN_SHARE_ON, { roomId });
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

        socketRef.current?.emit(SIGNALING_EVENTS.SCREEN_SHARE_OFF, { roomId });
    }, [localStream, roomId, log, stopStreamTracks]);

    const handleIncomingSignal = useCallback((fromSocketId, signal, metadata) => {
        const peer = peersRef.current[fromSocketId];
        if (peer) {
            try {
                peer.signal(signal);
                if (metadata) {
                    setPeers(prev => prev.map(p => p.peerId === fromSocketId ? { ...p, metadata } : p));
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
        const stream = localStreamRef.current;
        if (!stream) {
            logError('Cannot create peer without local stream');
            return null;
        }

        log(`🤝 Creating ${initiator ? 'initiator' : 'receiver'} peer for ${targetSocketId}${useTurnOnly ? ' (TURN only)' : ''}`);

        const config = useTurnOnly ? TURN_ONLY_CONFIG : DEFAULT_WEBRTC_CONFIG;

        const peer = new SimplePeer({
            initiator,
            trickle: true,
            stream: stream,
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
                    data: { signal }
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
                            audioEnabled: !isMutedRef.current,
                            videoEnabled: isVideoEnabledRef.current
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
            retryAttemptsRef.current.delete(targetSocketId);
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
                    metadata: metadata || { userName: 'Participant', audioEnabled: true, videoEnabled: true }
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
    }, [cleanupPeer, roomId, userId, userName, log, logError, retryPeerConnection]);

    // Update createPeerRef whenever createPeer changes
    useEffect(() => {
        createPeerRef.current = createPeer;
    }, [createPeer]);

    // Initialize media and socket connection
    useEffect(() => {
        log('🚀 Initializing VideoCall component');

        // Initialize Socket.IO connection
        socketRef.current = io(serverUrl, { transports: ['websocket'] });
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
                localStreamRef.current = stream;

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    log('📺 Local video element configured');
                }

                socket.emit('join-room', { roomId, user: { id: userId, name: userName } });
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
            log(`👥 Users joined room`, { userCount: users.length });
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

        socket.on('webrtc-peer-metadata', ({ fromSocketId, metadata }) => {
            log(`📋 Received metadata from ${fromSocketId}`, metadata);
            setPeers(prev => prev.map(peer => peer.peerId === fromSocketId ? { ...peer, metadata } : peer));
        });

        socket.on(SIGNALING_EVENTS.OFFER, ({ fromSocketId, data }) => {
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

        socket.on(SIGNALING_EVENTS.ANSWER, ({ fromSocketId, data }) => {
            log(`📥 Received ANSWER from ${fromSocketId}`);
            handleIncomingSignal(fromSocketId, data.signal, data.metadata);
        });

        socket.on(SIGNALING_EVENTS.ICE_CANDIDATE, ({ fromSocketId, data }) => {
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
            stopStreamTracks(localStreamRef.current);
            cleanupAllPeers();

            // Clear all timeouts
            connectionTimeouts.current.forEach(timeout => clearTimeout(timeout));
            connectionTimeouts.current.clear();

            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, serverUrl, userId, userName]);

    // Debug panel component
    const DebugPanel = () => {
        if (!enableDebugMode) return null;

        return (
            <div className="absolute top-2 right-2 bg-surface-dark/90 text-white p-3 rounded-lg text-xs max-w-xs z-50 backdrop-blur-sm border border-white/10 shadow-xl">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                    <Activity className="w-3 h-3 text-primary" />
                    <strong className="font-medium">Debug Info</strong>
                </div>
                <div className="space-y-1 font-mono opacity-80">
                    <div>Peers: {Object.keys(peersRef.current).length}</div>
                    <div>Errors: {connectionErrors.length}</div>
                    {Array.from(iceConnectionStates.entries()).map(([peerId, state]) => (
                        <div key={peerId} className="flex justify-between">
                            <span>{peerId.slice(0, 8)}:</span>
                            <span className={clsx({
                                'text-green-400': state === 'connected',
                                'text-yellow-400': state === 'checking',
                                'text-red-400': state === 'failed' || state === 'disconnected'
                            })}>{state}</span>
                        </div>
                    ))}
                </div>
                {debuggerRef.current && (
                    <button
                        onClick={() => debuggerRef.current.exportDebugReport()}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
                    >
                        <Download className="w-3 h-3" />
                        Export Report
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="relative h-full flex flex-col bg-background-secondary overflow-hidden">
            <DebugPanel />

            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                    {/* Local Video */}
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-white/5 group">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-100 transition-opacity">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/5">
                                    <span className="text-xs font-medium text-white">{userName} (You)</span>
                                </div>
                                <div className="flex gap-1">
                                    {isMuted && <div className="p-1 rounded bg-red-500/80 text-white"><MicOff className="w-3 h-3" /></div>}
                                    {!isVideoEnabled && <div className="p-1 rounded bg-red-500/80 text-white"><VideoOff className="w-3 h-3" /></div>}
                                    {isScreenSharing && <div className="p-1 rounded bg-blue-500/80 text-white"><Monitor className="w-3 h-3" /></div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Remote Peers */}
                    {peers.map(peer => (
                        <div key={peer.peerId} className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-white/5 group">
                            <video
                                data-peer-id={peer.peerId}
                                autoPlay
                                playsInline
                                ref={video => {
                                    if (video && peer.stream) {
                                        video.srcObject = peer.stream;
                                    }
                                }}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-100 transition-opacity">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/5">
                                            <span className="text-xs font-medium text-white">{peer.metadata?.userName || 'Participant'}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {!peer.metadata?.audioEnabled && <div className="p-1 rounded bg-red-500/80 text-white"><MicOff className="w-3 h-3" /></div>}
                                            {!peer.metadata?.videoEnabled && <div className="p-1 rounded bg-red-500/80 text-white"><VideoOff className="w-3 h-3" /></div>}
                                        </div>
                                    </div>
                                    <div className={clsx(
                                        "w-2 h-2 rounded-full",
                                        iceConnectionStates.get(peer.peerId) === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                                            iceConnectionStates.get(peer.peerId) === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                                    )} title={`Connection: ${iceConnectionStates.get(peer.peerId)}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="p-4 bg-surface border-t border-white/5 backdrop-blur-md">
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={toggleMute}
                        className={clsx(
                            "p-4 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg",
                            isMuted
                                ? "bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-500/20"
                                : "bg-surface-light hover:bg-white/10 text-white border border-white/10"
                        )}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={clsx(
                            "p-4 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg",
                            !isVideoEnabled
                                ? "bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-500/20"
                                : "bg-surface-light hover:bg-white/10 text-white border border-white/10"
                        )}
                        title={isVideoEnabled ? "Turn Video Off" : "Turn Video On"}
                    >
                        {!isVideoEnabled ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                    </button>

                    <button
                        onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                        className={clsx(
                            "p-4 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg",
                            isScreenSharing
                                ? "bg-blue-500 hover:bg-blue-600 text-white ring-4 ring-blue-500/20"
                                : "bg-surface-light hover:bg-white/10 text-white border border-white/10"
                        )}
                        title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                    >
                        {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Error Notifications */}
            {connectionErrors.length > 0 && (
                <div className="absolute bottom-24 left-4 max-w-sm space-y-2 z-50">
                    {connectionErrors.slice(-3).map((err, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-red-500/90 backdrop-blur-md text-white rounded-lg shadow-xl border border-red-400/50 animate-slide-in">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Connection Error</p>
                                <p className="text-xs opacity-90 truncate">{err.error}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VideoCall;
