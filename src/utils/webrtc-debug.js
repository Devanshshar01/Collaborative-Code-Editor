// WebRTC Debug Utility for troubleshooting common issues
export class WebRTCDebugger {
    constructor(roomId, userId) {
        this.roomId = roomId;
        this.userId = userId;
        this.connectionStates = new Map();
        this.iceGatheringLog = new Map();
        this.streamLog = new Map();

        this.startTime = Date.now();
        this.log('🚀 WebRTC Debugger initialized');
    }

    log(message, data = null) {
        const timestamp = Date.now() - this.startTime;
        const prefix = `[WebRTC-${this.userId}][${timestamp}ms]`;

        if (data) {
            console.log(`${prefix} ${message}`, data);
        } else {
            console.log(`${prefix} ${message}`);
        }
    }

    warn(message, data = null) {
        const timestamp = Date.now() - this.startTime;
        const prefix = `[WebRTC-${this.userId}][${timestamp}ms]`;

        if (data) {
            console.warn(`${prefix} ⚠️ ${message}`, data);
        } else {
            console.warn(`${prefix} ⚠️ ${message}`);
        }
    }

    error(message, error = null) {
        const timestamp = Date.now() - this.startTime;
        const prefix = `[WebRTC-${this.userId}][${timestamp}ms]`;

        if (error) {
            console.error(`${prefix} ❌ ${message}`, error);
        } else {
            console.error(`${prefix} ❌ ${message}`);
        }
    }

    // Debug ICE connection issues
    debugIceConnection(peerId, peer) {
        this.log(`🧊 Setting up ICE debugging for peer ${peerId}`);

        let iceConnectionLog = {
            state: 'new',
            candidates: [],
            failureCount: 0,
            lastStateChange: Date.now()
        };

        this.connectionStates.set(peerId, iceConnectionLog);

        // Monitor ICE connection state
        peer.on('iceStateChange', (state) => {
            iceConnectionLog.state = state;
            iceConnectionLog.lastStateChange = Date.now();

            this.log(`🧊 ICE state changed for ${peerId}: ${state}`);

            switch (state) {
                case 'checking':
                    this.log(`🔍 ICE checking candidates for ${peerId}`);
                    break;
                case 'connected':
                    this.log(`✅ ICE connected for ${peerId}`);
                    break;
                case 'completed':
                    this.log(`🎉 ICE completed for ${peerId}`);
                    break;
                case 'failed':
                    iceConnectionLog.failureCount++;
                    this.error(`ICE connection failed for ${peerId}`, {
                        failureCount: iceConnectionLog.failureCount,
                        candidates: iceConnectionLog.candidates.length,
                        duration: Date.now() - this.startTime
                    });
                    this.suggestIceFixes(peerId, iceConnectionLog);
                    break;
                case 'disconnected':
                    this.warn(`ICE disconnected for ${peerId} - may reconnect automatically`);
                    break;
                case 'closed':
                    this.log(`🔒 ICE connection closed for ${peerId}`);
                    break;
            }
        });

        // Monitor ICE gathering
        peer.on('iceGatheringStateChange', (state) => {
            this.log(`🧊 ICE gathering state for ${peerId}: ${state}`);

            if (state === 'complete') {
                const candidateCount = iceConnectionLog.candidates.length;
                this.log(`🧊 ICE gathering completed for ${peerId} with ${candidateCount} candidates`);

                if (candidateCount === 0) {
                    this.error(`No ICE candidates gathered for ${peerId} - check network configuration`);
                }
            }
        });

        // Log ICE candidates
        const originalAddIceCandidate = peer.addIceCandidate?.bind(peer);
        if (originalAddIceCandidate) {
            peer.addIceCandidate = (candidate) => {
                iceConnectionLog.candidates.push({
                    candidate: candidate.candidate,
                    timestamp: Date.now(),
                    type: this.parseIceCandidateType(candidate.candidate)
                });

                this.log(`🧊 ICE candidate for ${peerId}:`, {
                    type: this.parseIceCandidateType(candidate.candidate),
                    candidate: candidate.candidate
                });

                return originalAddIceCandidate(candidate);
            };
        }
    }

    // Debug video stream issues
    debugVideoStream(peerId, stream, videoElement) {
        this.log(`📹 Debugging video stream for ${peerId}`);

        const streamInfo = {
            streamId: stream.id,
            tracks: {
                video: stream.getVideoTracks(),
                audio: stream.getAudioTracks()
            },
            element: videoElement,
            timestamp: Date.now()
        };

        this.streamLog.set(peerId, streamInfo);

        // Check video tracks
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length === 0) {
            this.error(`No video tracks found in stream for ${peerId}`);
        } else {
            videoTracks.forEach((track, index) => {
                this.log(`📹 Video track ${index} for ${peerId}:`, {
                    id: track.id,
                    kind: track.kind,
                    enabled: track.enabled,
                    muted: track.muted,
                    readyState: track.readyState,
                    settings: track.getSettings?.(),
                    constraints: track.getConstraints?.()
                });

                // Monitor track state changes
                track.onended = () => {
                    this.warn(`Video track ended for ${peerId}`);
                };

                track.onmute = () => {
                    this.warn(`Video track muted for ${peerId}`);
                };

                track.onunmute = () => {
                    this.log(`📹 Video track unmuted for ${peerId}`);
                };
            });
        }

        // Monitor video element
        if (videoElement) {
            this.debugVideoElement(peerId, videoElement, stream);
        } else {
            this.error(`Video element not provided for ${peerId}`);
        }
    }

    debugVideoElement(peerId, videoElement, stream) {
        this.log(`📺 Setting up video element debugging for ${peerId}`);

        // Check if stream is properly set
        if (videoElement.srcObject !== stream) {
            this.warn(`Video element srcObject mismatch for ${peerId}`);
            videoElement.srcObject = stream;
        }

        // Monitor video element events
        const events = ['loadstart', 'loadeddata', 'canplay', 'playing', 'error', 'stalled', 'waiting'];

        events.forEach(eventName => {
            videoElement.addEventListener(eventName, (event) => {
                this.log(`📺 Video element ${eventName} for ${peerId}:`, {
                    currentTime: videoElement.currentTime,
                    duration: videoElement.duration,
                    readyState: videoElement.readyState,
                    networkState: videoElement.networkState,
                    videoWidth: videoElement.videoWidth,
                    videoHeight: videoElement.videoHeight
                });
            }, {once: eventName === 'error' ? false : true});
        });

        // Check for autoplay issues
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                this.error(`Video autoplay failed for ${peerId}`, error);
                this.suggestVideoFixes(peerId, error);
            });
        }

        // Monitor video dimensions
        setTimeout(() => {
            if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
                this.error(`Video dimensions are 0x0 for ${peerId} - stream may not be rendering`);
                this.checkVideoStreamHealth(peerId, stream, videoElement);
            }
        }, 3000);
    }

    // Debug audio echo issues
    debugAudioEcho(localStream, remoteStreams) {
        this.log(`🎤 Debugging audio echo issues`);

        // Check local audio settings
        const localAudioTracks = localStream.getAudioTracks();
        localAudioTracks.forEach((track, index) => {
            const settings = track.getSettings();
            this.log(`🎤 Local audio track ${index}:`, {
                echoCancellation: settings.echoCancellation,
                noiseSuppression: settings.noiseSuppression,
                autoGainControl: settings.autoGainControl,
                sampleRate: settings.sampleRate,
                channelCount: settings.channelCount
            });

            if (!settings.echoCancellation) {
                this.warn(`Echo cancellation disabled on local audio track ${index}`);
            }
            if (!settings.noiseSuppression) {
                this.warn(`Noise suppression disabled on local audio track ${index}`);
            }
        });

        // Check for potential echo sources
        const localVideoElements = document.querySelectorAll('video[muted]');
        const unmutedLocalVideos = document.querySelectorAll('video:not([muted])');

        if (unmutedLocalVideos.length > 0) {
            this.error(`Found ${unmutedLocalVideos.length} unmuted local video elements - this will cause echo!`);
        }

        // Monitor audio levels
        this.monitorAudioLevels(localStream, 'local');

        remoteStreams.forEach((stream, peerId) => {
            this.monitorAudioLevels(stream, `remote-${peerId}`);
        });
    }

    monitorAudioLevels(stream, source) {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const mediaSource = audioContext.createMediaStreamSource(stream);

        mediaSource.connect(analyser);
        analyser.fftSize = 256;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let silentCount = 0;
        let loudCount = 0;

        const checkLevels = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((sum, value) => sum + value) / bufferLength;

            if (average < 1) {
                silentCount++;
                if (silentCount > 50) { // 5 seconds of silence
                    this.warn(`${source} audio appears to be silent for extended period`);
                    silentCount = 0;
                }
            } else if (average > 200) {
                loudCount++;
                if (loudCount > 10) { // Consistently loud
                    this.warn(`${source} audio levels very high - possible echo or feedback`);
                    loudCount = 0;
                }
            }
        };

        const intervalId = setInterval(checkLevels, 100);

        // Cleanup after 30 seconds
        setTimeout(() => {
            clearInterval(intervalId);
            audioContext.close();
        }, 30000);
    }

    // Suggest fixes for common issues
    suggestIceFixes(peerId, iceLog) {
        this.log(`💡 ICE troubleshooting suggestions for ${peerId}:`);

        const suggestions = [];

        if (iceLog.candidates.length === 0) {
            suggestions.push('No ICE candidates - check if user is behind restrictive firewall');
            suggestions.push('Try enabling TURN server in configuration');
        }

        if (iceLog.failureCount > 2) {
            suggestions.push('Multiple ICE failures - network may be unstable');
            suggestions.push('Consider using TURN server for relay connection');
        }

        const hasRelay = iceLog.candidates.some(c => c.type === 'relay');
        if (!hasRelay) {
            suggestions.push('No relay candidates found - TURN server may not be configured');
        }

        suggestions.forEach(suggestion => this.log(`   • ${suggestion}`));

        return suggestions;
    }

    suggestVideoFixes(peerId, error) {
        this.log(`💡 Video troubleshooting suggestions for ${peerId}:`);

        const suggestions = [];

        if (error.name === 'NotAllowedError') {
            suggestions.push('User denied camera/microphone access');
            suggestions.push('Check browser permissions');
        } else if (error.name === 'AbortError') {
            suggestions.push('Video playback was aborted - try user interaction');
            suggestions.push('Add muted and playsInline attributes');
        } else if (error.message.includes('play()')) {
            suggestions.push('Autoplay blocked - require user gesture');
            suggestions.push('Add click handler to start video playback');
        }

        suggestions.forEach(suggestion => this.log(`   • ${suggestion}`));

        return suggestions;
    }

    checkVideoStreamHealth(peerId, stream, videoElement) {
        this.log(`🔍 Performing video stream health check for ${peerId}`);

        const issues = [];

        // Check stream tracks
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length === 0) {
            issues.push('No video tracks in stream');
        } else {
            videoTracks.forEach(track => {
                if (track.readyState === 'ended') {
                    issues.push('Video track has ended');
                }
                if (track.muted) {
                    issues.push('Video track is muted');
                }
                if (!track.enabled) {
                    issues.push('Video track is disabled');
                }
            });
        }

        // Check video element
        if (videoElement.readyState === 0) {
            issues.push('Video element has no data');
        }
        if (videoElement.networkState === 3) {
            issues.push('Video network error');
        }
        if (videoElement.videoWidth === 0) {
            issues.push('Video width is 0');
        }

        if (issues.length > 0) {
            this.error(`Video stream health issues for ${peerId}:`, issues);
        } else {
            this.log(`✅ Video stream health check passed for ${peerId}`);
        }

        return issues;
    }

    parseIceCandidateType(candidateString) {
        if (candidateString.includes('typ host')) return 'host';
        if (candidateString.includes('typ srflx')) return 'srflx';
        if (candidateString.includes('typ relay')) return 'relay';
        if (candidateString.includes('typ prflx')) return 'prflx';
        return 'unknown';
    }

    // Generate comprehensive debug report
    generateDebugReport() {
        const report = {
            timestamp: new Date().toISOString(),
            roomId: this.roomId,
            userId: this.userId,
            sessionDuration: Date.now() - this.startTime,
            connections: {},
            streams: {},
            summary: {
                totalConnections: this.connectionStates.size,
                failedConnections: 0,
                activeStreams: this.streamLog.size
            }
        };

        // Connection states
        this.connectionStates.forEach((state, peerId) => {
            report.connections[peerId] = {
                state: state.state,
                candidates: state.candidates.length,
                candidateTypes: state.candidates.reduce((types, c) => {
                    types[c.type] = (types[c.type] || 0) + 1;
                    return types;
                }, {}),
                failureCount: state.failureCount,
                duration: Date.now() - state.lastStateChange
            };

            if (state.failureCount > 0) {
                report.summary.failedConnections++;
            }
        });

        // Stream states
        this.streamLog.forEach((stream, peerId) => {
            report.streams[peerId] = {
                streamId: stream.streamId,
                videoTracks: stream.tracks.video.length,
                audioTracks: stream.tracks.audio.length,
                hasElement: !!stream.element,
                duration: Date.now() - stream.timestamp
            };
        });

        this.log('📊 Debug Report Generated:', report);
        return report;
    }

    // Export debug report for sharing
    exportDebugReport() {
        const report = this.generateDebugReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `webrtc-debug-${this.roomId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        this.log('📊 Debug report exported successfully');
    }
}

export default WebRTCDebugger;