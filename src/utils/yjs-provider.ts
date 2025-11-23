import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';

// Message types matching the server
const messageSync = 0;
const messageAwareness = 1;
const messageAuth = 2;
const messageError = 3;

export interface YjsProviderOptions {
    roomId: string;
    userId: string;
    serverUrl?: string;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
    onVersionConflict?: (localVersion: number, serverVersion: number) => void;
    maxReconnectAttempts?: number;
    reconnectInterval?: number;
}

export class YjsWebSocketProvider {
    private doc: Y.Doc;
    private awareness: awarenessProtocol.Awareness;
    private ws: WebSocket | null = null;
    private options: Required<YjsProviderOptions>;
    private reconnectAttempts: number = 0;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isDestroyed: boolean = false;
    private synced: boolean = false;
    private localVersion: number = 0;
    private serverVersion: number = 0;

    constructor(doc: Y.Doc, options: YjsProviderOptions) {
        this.doc = doc;
        this.awareness = new awarenessProtocol.Awareness(doc);

        // Set default options
        this.options = {
            serverUrl: import.meta.env.VITE_YJS_URL || 'ws://localhost:1234',
            onConnect: () => {
            },
            onDisconnect: () => {
            },
            onError: () => {
            },
            onVersionConflict: () => {
            },
            maxReconnectAttempts: 10,
            reconnectInterval: 1000,
            ...options
        };

        this.connect();
        this.setupDocumentListeners();
    }

    private connect(): void {
        if (this.isDestroyed) return;

        try {
            this.ws = new WebSocket(this.options.serverUrl);
            this.ws.binaryType = 'arraybuffer';

            this.ws.onopen = () => {
                console.log('YjsProvider: WebSocket connected');
                this.reconnectAttempts = 0;
                this.authenticate();
                this.options.onConnect();
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(new Uint8Array(event.data));
            };

            this.ws.onerror = (error) => {
                console.error('YjsProvider: WebSocket error', error);
                this.options.onError(new Error('WebSocket connection error'));
            };

            this.ws.onclose = () => {
                console.log('YjsProvider: WebSocket disconnected');
                this.synced = false;
                this.options.onDisconnect();
                this.reconnect();
            };
        } catch (error) {
            console.error('YjsProvider: Failed to create WebSocket', error);
            this.reconnect();
        }
    }

    private authenticate(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageAuth);
        encoding.writeVarString(encoder, JSON.stringify({
            userId: this.options.userId,
            roomId: this.options.roomId
        }));

        this.send(encoding.toUint8Array(encoder));
    }

    private handleMessage(data: Uint8Array): void {
        try {
            const decoder = decoding.createDecoder(data);
            const messageType = decoding.readVarUint(decoder);
            const encoder = encoding.createEncoder();

            switch (messageType) {
                case messageSync:
                    this.handleSyncMessage(decoder, encoder);
                    break;

                case messageAwareness:
                    this.handleAwarenessMessage(decoder);
                    break;

                case messageError:
                    this.handleErrorMessage(decoder);
                    break;

                default:
                    console.warn('YjsProvider: Unknown message type', messageType);
            }
        } catch (error) {
            console.error('YjsProvider: Error handling message', error);
            this.options.onError(new Error('Failed to process server message'));
        }
    }

    private handleSyncMessage(decoder: any, encoder: any): void {
        encoding.writeVarUint(encoder, messageSync);

        const syncMessageType = syncProtocol.readSyncMessage(
            decoder,
            encoder,
            this.doc,
            this
        );

        // Check for version conflicts
        if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
            this.synced = true;
            this.checkVersionConflict();
        }

        if (encoding.length(encoder) > 1) {
            this.send(encoding.toUint8Array(encoder));
        }
    }

    private handleAwarenessMessage(decoder: any): void {
        try {
            const update = decoding.readVarUint8Array(decoder);
            awarenessProtocol.applyAwarenessUpdate(
                this.awareness,
                update,
                this
            );
        } catch (error) {
            console.error('YjsProvider: Error applying awareness update', error);
        }
    }

    private handleErrorMessage(decoder: any): void {
        const errorMessage = decoding.readVarString(decoder);
        console.error('YjsProvider: Server error', errorMessage);
        this.options.onError(new Error(errorMessage));
    }

    private setupDocumentListeners(): void {
        // Listen for local document updates
        this.doc.on('update', (update: Uint8Array, origin: any) => {
            if (origin !== this && this.ws && this.ws.readyState === WebSocket.OPEN) {
                const encoder = encoding.createEncoder();
                encoding.writeVarUint(encoder, messageSync);
                syncProtocol.writeUpdate(encoder, update);
                this.send(encoding.toUint8Array(encoder));
                this.localVersion++;
            }
        });

        // Listen for awareness updates
        this.awareness.on('update', ({ added, updated, removed }: any, origin: any) => {
            if (origin !== this && this.ws && this.ws.readyState === WebSocket.OPEN) {
                const changedClients = added.concat(updated, removed);
                const encoder = encoding.createEncoder();
                encoding.writeVarUint(encoder, messageAwareness);
                encoding.writeVarUint8Array(encoder,
                    awarenessProtocol.encodeAwarenessUpdate(
                        this.awareness,
                        changedClients
                    )
                );
                this.send(encoding.toUint8Array(encoder));
            }
        });
    }

    private checkVersionConflict(): void {
        // Simple version conflict detection
        // In a production system, this would be more sophisticated
        if (Math.abs(this.localVersion - this.serverVersion) > 10) {
            console.warn('YjsProvider: Potential version conflict detected');
            this.options.onVersionConflict(this.localVersion, this.serverVersion);
        }
    }

    private send(data: Uint8Array): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(data);
            } catch (error) {
                console.error('YjsProvider: Failed to send message', error);
                this.options.onError(new Error('Failed to send message to server'));
            }
        }
    }

    private reconnect(): void {
        if (this.isDestroyed) return;

        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            console.error('YjsProvider: Max reconnection attempts reached');
            this.options.onError(new Error('Unable to reconnect to server'));
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(
            this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
            30000 // Max 30 seconds
        );

        console.log(`YjsProvider: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, delay);
    }

    public getAwareness(): awarenessProtocol.Awareness {
        return this.awareness;
    }

    public isSynced(): boolean {
        return this.synced;
    }

    public setAwarenessField(field: string, value: any): void {
        this.awareness.setLocalStateField(field, value);
    }

    public destroy(): void {
        this.isDestroyed = true;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.awareness.destroy();
        console.log('YjsProvider: Provider destroyed');
    }
}

export default YjsWebSocketProvider;