import WebSocket, {WebSocketServer} from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as map from 'lib0/map';
import mongoDBService from '../db/mongodb';

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;

// Message types for Yjs protocol
const messageSync = 0;
const messageAwareness = 1;
const messageAuth = 2;
const messageError = 3;

interface WSSharedDoc {
    name: string;
    ydoc: Y.Doc;
    awareness: awarenessProtocol.Awareness;
    conns: Map<WebSocket, Set<number>>;
    snapshotTimer?: NodeJS.Timeout;
    lastSnapshotTime: Date;
}

interface AuthMessage {
    userId: string;
    roomId: string;
    token?: string;
}

export class YjsWebSocketServer {
    private wss: WebSocketServer | null = null;
    private docs: Map<string, WSSharedDoc> = new Map();
    private port: number;
    private snapshotInterval: number = 5 * 60 * 1000; // 5 minutes

    constructor(port: number = 1234) {
        this.port = port;
    }

    async start(): Promise<void> {
        // Connect to MongoDB
        await mongoDBService.connect();

        // Create WebSocket server
        this.wss = new WebSocketServer({port: this.port});

        this.wss.on('connection', (conn: WebSocket, req) => {
            console.log('New WebSocket connection');
            this.setupConnection(conn, req);
        });

        console.log(`Yjs WebSocket server running on port ${this.port}`);
    }

    private setupConnection(conn: WebSocket, req: any): void {
        conn.binaryType = 'arraybuffer';

        // Track which documents this connection is syncing
        const syncedDocs = new Set<WSSharedDoc>();
        let userId: string | null = null;
        let isAuthenticated = false;

        // Message handler
        conn.on('message', async (message: ArrayBuffer) => {
            try {
                const encoder = encoding.createEncoder();
                const decoder = decoding.createDecoder(new Uint8Array(message));
                const messageType = decoding.readVarUint(decoder);

                switch (messageType) {
                    case messageAuth:
                        // Handle authentication
                        const authData = JSON.parse(decoding.readVarString(decoder)) as AuthMessage;
                        userId = authData.userId;
                        isAuthenticated = true;

                        // Get or create document
                        const doc = await this.getOrCreateDocument(authData.roomId);
                        syncedDocs.add(doc);

                        // Add connection to document
                        doc.conns.set(conn, new Set());

                        // Send initial sync
                        this.sendSyncStep1(conn, doc);

                        // Setup awareness
                        const awarenessStates = doc.awareness.getStates();
                        if (awarenessStates.size > 0) {
                            encoding.writeVarUint(encoder, messageAwareness);
                            encoding.writeVarUint8Array(encoder,
                                awarenessProtocol.encodeAwarenessUpdate(
                                    doc.awareness,
                                    Array.from(awarenessStates.keys())
                                )
                            );
                            this.send(doc, conn, encoding.toUint8Array(encoder));
                        }

                        console.log(`User ${userId} authenticated for room ${authData.roomId}`);
                        break;

                    case messageSync:
                        if (!isAuthenticated) {
                            this.sendError(conn, 'Not authenticated');
                            return;
                        }

                        // Handle sync messages
                        encoding.writeVarUint(encoder, messageSync);
                        const syncMessageType = syncProtocol.readSyncMessage(
                            decoder,
                            encoder,
                            syncedDocs.values().next().value?.ydoc || new Y.Doc(),
                            null
                        );

                        if (encoding.length(encoder) > 1) {
                            syncedDocs.forEach(doc => {
                                this.send(doc, conn, encoding.toUint8Array(encoder));
                            });
                        }
                        break;

                    case messageAwareness:
                        if (!isAuthenticated) {
                            this.sendError(conn, 'Not authenticated');
                            return;
                        }

                        // Handle awareness updates
                        const update = decoding.readVarUint8Array(decoder);
                        syncedDocs.forEach(doc => {
                            awarenessProtocol.applyAwarenessUpdate(
                                doc.awareness,
                                update,
                                conn as any
                            );
                        });
                        break;

                    default:
                        console.warn('Unknown message type:', messageType);
                }
            } catch (error) {
                console.error('Error processing message:', error);
                this.sendError(conn, 'Failed to process message');
            }
        });

        // Handle connection close
        conn.on('close', () => {
            syncedDocs.forEach(doc => {
                if (doc.conns.has(conn)) {
                    const controlledIds = doc.conns.get(conn)!;
                    doc.conns.delete(conn);

                    // Remove awareness states
                    awarenessProtocol.removeAwarenessStates(
                        doc.awareness,
                        Array.from(controlledIds),
                        null
                    );

                    // Check if document should be persisted
                    if (doc.conns.size === 0) {
                        this.persistDocument(doc);
                    }
                }
            });

            console.log(`Connection closed for user ${userId}`);
        });

        // Handle errors
        conn.on('error', (err) => {
            console.error('WebSocket error:', err);
        });

        // Ping/pong for keeping connection alive
        const pingInterval = setInterval(() => {
            if (conn.readyState === wsReadyStateOpen) {
                conn.ping();
            } else {
                clearInterval(pingInterval);
            }
        }, 30000);
    }

    private async getOrCreateDocument(roomId: string): Promise<WSSharedDoc> {
        // Check if document already exists in memory
        let doc = this.docs.get(roomId);

        if (!doc) {
            // Create new document
            const ydoc = new Y.Doc();
            const awareness = new awarenessProtocol.Awareness(ydoc);

            // Try to load from database
            try {
                const snapshot = await mongoDBService.loadLatestSnapshot(roomId);
                if (snapshot) {
                    Y.applyUpdate(ydoc, snapshot);
                    console.log(`Loaded document ${roomId} from database`);
                }
            } catch (error) {
                console.error(`Error loading document ${roomId}:`, error);
            }

            doc = {
                name: roomId,
                ydoc,
                awareness,
                conns: new Map(),
                lastSnapshotTime: new Date()
            };

            // Setup update handler
            ydoc.on('update', (update: Uint8Array, origin: any) => {
                const encoder = encoding.createEncoder();
                encoding.writeVarUint(encoder, messageSync);
                syncProtocol.writeUpdate(encoder, update);
                const message = encoding.toUint8Array(encoder);

                doc!.conns.forEach((_, conn) => {
                    if (origin !== conn) {
                        this.send(doc!, conn, message);
                    }
                });
            });

            // Setup awareness update handler
            awareness.on('update', ({added, updated, removed}: any, origin: any) => {
                const changedClients = added.concat(updated, removed);
                const encoder = encoding.createEncoder();
                encoding.writeVarUint(encoder, messageAwareness);
                encoding.writeVarUint8Array(encoder,
                    awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
                );
                const message = encoding.toUint8Array(encoder);

                doc!.conns.forEach((_, conn) => {
                    if (origin !== conn) {
                        this.send(doc!, conn, message);
                    }
                });
            });

            // Setup periodic snapshot
            doc.snapshotTimer = setInterval(() => {
                this.createSnapshot(doc!);
            }, this.snapshotInterval);

            this.docs.set(roomId, doc);
        }

        return doc;
    }

    private sendSyncStep1(conn: WebSocket, doc: WSSharedDoc): void {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.writeSyncStep1(encoder, doc.ydoc);
        this.send(doc, conn, encoding.toUint8Array(encoder));
    }

    private send(doc: WSSharedDoc, conn: WebSocket, message: Uint8Array): void {
        if (conn.readyState !== wsReadyStateConnecting &&
            conn.readyState !== wsReadyStateOpen) {
            doc.conns.delete(conn);
            return;
        }

        try {
            conn.send(message, (err) => {
                if (err) {
                    doc.conns.delete(conn);
                    console.error('Send error:', err);
                }
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            doc.conns.delete(conn);
        }
    }

    private sendError(conn: WebSocket, message: string): void {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageError);
        encoding.writeVarString(encoder, message);

        try {
            conn.send(encoding.toUint8Array(encoder));
        } catch (error) {
            console.error('Failed to send error message:', error);
        }
    }

    private async createSnapshot(doc: WSSharedDoc): Promise<void> {
        const now = new Date();
        const timeSinceLastSnapshot = now.getTime() - doc.lastSnapshotTime.getTime();

        // Only create snapshot if enough time has passed
        if (timeSinceLastSnapshot < this.snapshotInterval) {
            return;
        }

        try {
            await mongoDBService.saveSnapshot(doc.name, doc.ydoc);
            doc.lastSnapshotTime = now;

            // Clean old snapshots
            await mongoDBService.cleanOldSnapshots(doc.name);
        } catch (error) {
            console.error('Error creating snapshot:', error);
        }
    }

    private async persistDocument(doc: WSSharedDoc): Promise<void> {
        // Clear snapshot timer
        if (doc.snapshotTimer) {
            clearInterval(doc.snapshotTimer);
        }

        // Save final state
        try {
            await mongoDBService.saveSnapshot(doc.name, doc.ydoc);
            console.log(`Document ${doc.name} persisted to database`);
        } catch (error) {
            console.error('Error persisting document:', error);
        }

        // Remove from memory after a delay (in case of quick reconnection)
        setTimeout(() => {
            if (doc.conns.size === 0) {
                this.docs.delete(doc.name);
                console.log(`Document ${doc.name} removed from memory`);
            }
        }, 60000); // Keep in memory for 1 minute
    }

    async stop(): Promise<void> {
        // Save all documents
        for (const doc of this.docs.values()) {
            await this.persistDocument(doc);
        }

        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
        }

        // Disconnect from MongoDB
        await mongoDBService.disconnect();

        console.log('Yjs WebSocket server stopped');
    }
}

export default YjsWebSocketServer;