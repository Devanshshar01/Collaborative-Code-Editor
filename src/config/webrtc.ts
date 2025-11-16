export interface IceServerConfig {
    urls: string | string[];
    username?: string;
    credential?: string;
}

export interface WebRTCConfig {
    iceServers: IceServerConfig[];
    iceCandidatePoolSize?: number;
    bundlePolicy?: 'balanced' | 'max-compat' | 'max-bundle';
    rtcpMuxPolicy?: 'negotiate' | 'require';
    iceTransportPolicy?: 'all' | 'relay';
}

const defaultIceServers: IceServerConfig[] = [];

// Add STUN servers (free, public servers)
if (process.env.STUN_SERVER_URLS) {
    const stunUrls = process.env.STUN_SERVER_URLS.split(',').map(url => url.trim()).filter(Boolean);
    defaultIceServers.push({urls: stunUrls});
} else {
    // Default public STUN servers
    defaultIceServers.push({
        urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun3.l.google.com:19302',
            'stun:stun4.l.google.com:19302'
        ]
    });
}

// Add TURN servers if configured
if (process.env.TURN_SERVER_URL && process.env.TURN_SERVER_USERNAME && process.env.TURN_SERVER_CREDENTIAL) {
    const turnUrls = process.env.TURN_SERVER_URL.split(',').map(url => url.trim()).filter(Boolean);
    defaultIceServers.push({
        urls: turnUrls,
        username: process.env.TURN_SERVER_USERNAME,
        credential: process.env.TURN_SERVER_CREDENTIAL
    });
    console.log('✅ TURN server configured for WebRTC relay');
} else {
    console.warn('⚠️ No TURN server configured. Users behind restrictive NATs may fail to connect.');
    console.warn('   Add TURN_SERVER_URL, TURN_SERVER_USERNAME, and TURN_SERVER_CREDENTIAL to .env');
}

// Production TURN server recommendations
if (process.env.NODE_ENV === 'production' && !process.env.TURN_SERVER_URL) {
    console.warn('⚠️ Production deployment without TURN server detected!');
    console.warn('   Consider using services like:');
    console.warn('   • Twilio Network Traversal Service');
    console.warn('   • Xirsys');
    console.warn('   • coturn (self-hosted)');
}

export const ICE_SERVERS: IceServerConfig[] = defaultIceServers;

// Default WebRTC configuration
export const DEFAULT_WEBRTC_CONFIG: WebRTCConfig = {
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all' // Use 'relay' to force TURN usage
};

// TURN-only configuration for fallback
export const TURN_ONLY_CONFIG: WebRTCConfig = {
    iceServers: ICE_SERVERS.filter(server =>
        (typeof server.urls === 'string' && server.urls.startsWith('turn:')) ||
        (Array.isArray(server.urls) && server.urls.some(url => url.startsWith('turn:')))
    ),
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'relay' // Force relay connections only
};

// Utility functions for WebRTC debugging
export const WebRTCUtils = {
    // Test ICE server connectivity
    async testIceServers(servers: IceServerConfig[] = ICE_SERVERS): Promise<TestResult[]> {
        const results: TestResult[] = [];

        for (const server of servers) {
            const urls = Array.isArray(server.urls) ? server.urls : [server.urls];

            for (const url of urls) {
                try {
                    const result = await this.testSingleIceServer(url, server.username, server.credential);
                    results.push(result);
                } catch (error) {
                    results.push({
                        url,
                        success: false,
                        error: error instanceof Error ? error.message : String(error),
                        type: this.getServerType(url)
                    });
                }
            }
        }

        return results;
    },

    async testSingleIceServer(url: string, username?: string, credential?: string): Promise<TestResult> {
        return new Promise((resolve) => {
            const pc = new RTCPeerConnection({
                iceServers: [{urls: url, username, credential}]
            });

            let resolved = false;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    pc.close();
                    resolve({
                        url,
                        success: false,
                        error: 'Timeout',
                        type: this.getServerType(url)
                    });
                }
            }, 5000);

            pc.onicecandidate = (event) => {
                if (event.candidate && !resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    pc.close();
                    resolve({
                        url,
                        success: true,
                        candidate: event.candidate.candidate,
                        type: this.getServerType(url)
                    });
                }
            };

            pc.onicecandidateerror = (event) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    pc.close();
                    resolve({
                        url,
                        success: false,
                        error: `ICE candidate error: ${event.errorText}`,
                        type: this.getServerType(url)
                    });
                }
            };

            // Create a dummy data channel to trigger ICE gathering
            pc.createDataChannel('test');
            pc.createOffer().then(offer => pc.setLocalDescription(offer));
        });
    },

    getServerType(url: string): 'stun' | 'turn' | 'turns' {
        if (url.startsWith('stun:')) return 'stun';
        if (url.startsWith('turn:')) return 'turn';
        if (url.startsWith('turns:')) return 'turns';
        return 'stun';
    },

    // Generate recommended TURN server configuration
    generateTurnConfig(): string {
        return `
# Add these to your .env file for TURN server support:
TURN_SERVER_URL=turn:your-turn-server.com:3478
TURN_SERVER_USERNAME=your-username
TURN_SERVER_CREDENTIAL=your-credential

# For multiple TURN servers:
# TURN_SERVER_URL=turn:server1.com:3478,turns:server1.com:5349

# Free TURN server options:
# 1. Twilio Network Traversal Service (paid)
# 2. Xirsys (has free tier)
# 3. Self-hosted coturn server
        `.trim();
    },

    // Log WebRTC configuration for debugging
    logConfiguration(): void {
        console.group('🔧 WebRTC Configuration');
        console.log('ICE Servers:', ICE_SERVERS);
        console.log('STUN servers:', ICE_SERVERS.filter(s =>
            (typeof s.urls === 'string' && s.urls.startsWith('stun:')) ||
            (Array.isArray(s.urls) && s.urls.some(url => url.startsWith('stun:')))
        ).length);
        console.log('TURN servers:', ICE_SERVERS.filter(s =>
            (typeof s.urls === 'string' && (s.urls.startsWith('turn:') || s.urls.startsWith('turns:'))) ||
            (Array.isArray(s.urls) && s.urls.some(url => url.startsWith('turn:') || url.startsWith('turns:')))
        ).length);
        console.log('Default Config:', DEFAULT_WEBRTC_CONFIG);
        console.groupEnd();
    }
};

interface TestResult {
    url: string;
    success: boolean;
    error?: string;
    candidate?: string;
    type: 'stun' | 'turn' | 'turns';
}

// Enhanced error handling for WebRTC
export class WebRTCError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: any
    ) {
        super(message);
        this.name = 'WebRTCError';
    }
}

// Common WebRTC error codes
export const WebRTCErrorCodes = {
    ICE_CONNECTION_FAILED: 'ICE_CONNECTION_FAILED',
    ICE_GATHERING_TIMEOUT: 'ICE_GATHERING_TIMEOUT',
    PEER_CONNECTION_FAILED: 'PEER_CONNECTION_FAILED',
    MEDIA_ACCESS_DENIED: 'MEDIA_ACCESS_DENIED',
    SIGNALING_ERROR: 'SIGNALING_ERROR',
    TURN_SERVER_UNAVAILABLE: 'TURN_SERVER_UNAVAILABLE'
} as const;
