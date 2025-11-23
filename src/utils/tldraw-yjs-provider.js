import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import YjsWebSocketProvider from './yjs-provider';

/**
 * TLDraw Yjs Provider
 * Handles real-time synchronization of TLDraw whiteboard state using Yjs
 */
export class TLDrawYjsProvider {
    constructor(roomId, userId, options = {}) {
        this.roomId = roomId;
        this.userId = userId;
        this.options = {
            serverUrl: import.meta.env.VITE_YJS_URL || 'ws://localhost:1234',
            enablePersistence: true,
            maxShapes: 10000, // Limit for performance
            ...options
        };

        // Initialize Yjs document
        this.ydoc = new Y.Doc();

        // TLDraw state structures
        this.yShapes = this.ydoc.getMap('shapes');
        this.yBindings = this.ydoc.getMap('bindings');
        this.yAssets = this.ydoc.getMap('assets');
        this.yPageStates = this.ydoc.getMap('pageStates');
        this.yDocumentState = this.ydoc.getMap('documentState');

        // Awareness for cursor positions and user presence
        this.awareness = null;

        // Providers
        this.websocketProvider = null;
        this.indexeddbProvider = null;

        this.isConnected = false;
        this.isSynced = false;

        // Callbacks
        this.onConnect = options.onConnect || (() => {
        });
        this.onDisconnect = options.onDisconnect || (() => {
        });
        this.onSync = options.onSync || (() => {
        });
        this.onError = options.onError || (() => {
        });

        // Initialize providers
        this.initializeProviders();
    }

    async initializeProviders() {
        try {
            // IndexedDB persistence for offline support
            if (this.options.enablePersistence) {
                this.indexeddbProvider = new IndexeddbPersistence(
                    `tldraw-${this.roomId}`,
                    this.ydoc
                );

                await this.indexeddbProvider.whenSynced;
                console.log('📱 IndexedDB persistence initialized');
            }

            // WebSocket provider for real-time sync
            this.websocketProvider = new YjsWebSocketProvider(this.ydoc, {
                roomId: this.roomId,
                userId: this.userId,
                serverUrl: this.options.serverUrl,
                onConnect: () => {
                    this.isConnected = true;
                    this.onConnect();
                },
                onDisconnect: () => {
                    this.isConnected = false;
                    this.onDisconnect();
                },
                onError: this.onError
            });

            this.awareness = this.websocketProvider.getAwareness();

            // Set user info for awareness
            this.awareness.setLocalStateField('user', {
                id: this.userId,
                name: this.options.userName || 'Anonymous',
                color: this.generateUserColor(),
                cursor: null
            });

            // Monitor sync status
            this.ydoc.on('sync', () => {
                this.isSynced = true;
                this.onSync();
            });

            console.log('🎨 TLDraw Yjs provider initialized');

        } catch (error) {
            console.error('Failed to initialize TLDraw Yjs provider:', error);
            this.onError(error);
        }
    }

    /**
     * Convert TLDraw store to Yjs format
     */
    syncTLDrawToYjs(store) {
        if (!store) return;

        const storeSnapshot = store.getSnapshot();

        // Sync shapes
        const shapes = storeSnapshot.store || {};
        this.ydoc.transact(() => {
            // Clear existing shapes to prevent conflicts
            this.yShapes.clear();

            // Add current shapes
            Object.entries(shapes).forEach(([id, shape]) => {
                if (shape.typeName === 'shape') {
                    this.yShapes.set(id, this.sanitizeShape(shape));
                }
            });
        });
    }

    /**
     * Convert Yjs format to TLDraw store
     */
    syncYjsToTLDraw(store) {
        if (!store) {
            console.warn('TLDraw store not available for sync');
            return;
        }

        try {
            const shapes = {};
            const bindings = {};
            const assets = {};

            // Get shapes from Yjs
            this.yShapes.forEach((shape, id) => {
                if (shape && typeof shape === 'object') {
                    shapes[id] = shape;
                }
            });

            this.yBindings.forEach((binding, id) => {
                if (binding && typeof binding === 'object') {
                    bindings[id] = binding;
                }
            });

            this.yAssets.forEach((asset, id) => {
                if (asset && typeof asset === 'object') {
                    assets[id] = asset;
                }
            });

            // Apply to TLDraw store
            store.loadSnapshot({
                store: {
                    ...shapes,
                    ...bindings,
                    ...assets
                },
                schema: store.schema
            });

            console.log(`📊 Synced ${Object.keys(shapes).length} shapes from Yjs to TLDraw`);
        } catch (error) {
            console.error('Error syncing Yjs to TLDraw:', error);
        }
    }

    /**
     * Handle TLDraw store changes
     */
    handleStoreChange(store, changes) {
        if (!this.isConnected || !store) {
            console.log('Skipping store change - not connected or no store');
            return;
        }

        try {
            // Batch changes for efficiency
            this.ydoc.transact(() => {
                // Handle added records
                Object.entries(changes.added || {}).forEach(([id, record]) => {
                    if (!record || typeof record !== 'object') return;

                    if (record.typeName === 'shape') {
                        this.yShapes.set(id, this.sanitizeShape(record));
                    } else if (record.typeName === 'binding') {
                        this.yBindings.set(id, record);
                    } else if (record.typeName === 'asset') {
                        this.yAssets.set(id, record);
                    }
                });

                // Handle updated records
                Object.entries(changes.updated || {}).forEach(([id, [from, to]]) => {
                    if (!to || typeof to !== 'object') return;

                    if (to.typeName === 'shape') {
                        this.yShapes.set(id, this.sanitizeShape(to));
                    } else if (to.typeName === 'binding') {
                        this.yBindings.set(id, to);
                    } else if (to.typeName === 'asset') {
                        this.yAssets.set(id, to);
                    }
                });

                // Handle removed records
                Object.keys(changes.removed || {}).forEach(id => {
                    if (this.yShapes.has(id)) {
                        this.yShapes.delete(id);
                    } else if (this.yBindings.has(id)) {
                        this.yBindings.delete(id);
                    } else if (this.yAssets.has(id)) {
                        this.yAssets.delete(id);
                    }
                });
            });

            // Check shape limit for performance
            if (this.yShapes.size > this.options.maxShapes) {
                console.warn(`Shape limit exceeded (${this.yShapes.size}/${this.options.maxShapes}) - optimizing`);
                this.optimizeShapes();
            }
        } catch (error) {
            console.error('Error handling store change:', error);
        }
    }

    /**
     * Optimize shapes for large diagrams
     */
    optimizeShapes() {
        const shapesArray = Array.from(this.yShapes.entries());

        // Sort by last modified (if available) or creation time
        shapesArray.sort((a, b) => {
            const aTime = a[1].meta?.lastModified || a[1].meta?.created || 0;
            const bTime = b[1].meta?.lastModified || b[1].meta?.created || 0;
            return aTime - bTime;
        });

        // Keep only the most recent shapes
        const toKeep = shapesArray.slice(-this.options.maxShapes);

        this.ydoc.transact(() => {
            this.yShapes.clear();
            toKeep.forEach(([id, shape]) => {
                this.yShapes.set(id, shape);
            });
        });

        console.log(`Optimized shapes: ${shapesArray.length} → ${toKeep.length}`);
    }

    /**
     * Sanitize shape data for Yjs storage
     */
    sanitizeShape(shape) {
        if (!shape || typeof shape !== 'object') {
            console.warn('Invalid shape data:', shape);
            return null;
        }

        try {
            // Remove non-serializable properties and add metadata
            const sanitized = {
                ...shape,
                meta: {
                    ...shape.meta,
                    lastModified: Date.now(),
                    modifiedBy: this.userId
                }
            };

            // Remove circular references and functions
            return JSON.parse(JSON.stringify(sanitized));
        } catch (error) {
            console.error('Error sanitizing shape:', error);
            return null;
        }
    }

    /**
     * Clear all whiteboard content (admin only)
     */
    clearWhiteboard(isAdmin = false) {
        if (!isAdmin) {
            console.warn('Clear whiteboard requires admin privileges');
            return false;
        }

        this.ydoc.transact(() => {
            this.yShapes.clear();
            this.yBindings.clear();
            this.yAssets.clear();
        });

        console.log('🧹 Whiteboard cleared by admin');
        return true;
    }

    /**
     * Export whiteboard data for PNG/PDF generation
     */
    exportWhiteboardData() {
        const shapes = {};
        const bindings = {};
        const assets = {};

        this.yShapes.forEach((shape, id) => {
            shapes[id] = shape;
        });

        this.yBindings.forEach((binding, id) => {
            bindings[id] = binding;
        });

        this.yAssets.forEach((asset, id) => {
            assets[id] = asset;
        });

        return {
            shapes,
            bindings,
            assets,
            metadata: {
                exportedAt: new Date().toISOString(),
                roomId: this.roomId,
                shapeCount: Object.keys(shapes).length
            }
        };
    }

    /**
     * Get whiteboard statistics
     */
    getStats() {
        return {
            connected: this.isConnected,
            synced: this.isSynced,
            shapes: this.yShapes.size,
            bindings: this.yBindings.size,
            assets: this.yAssets.size,
            users: this.awareness ? this.awareness.getStates().size : 0
        };
    }

    /**
     * Update user cursor position
     */
    updateCursor(cursor) {
        if (this.awareness) {
            this.awareness.setLocalStateField('cursor', cursor);
        }
    }

    /**
     * Get online users
     */
    getOnlineUsers() {
        if (!this.awareness) return [];

        const users = [];
        this.awareness.getStates().forEach((state, clientId) => {
            if (state.user && clientId !== this.awareness.clientID) {
                users.push({
                    id: clientId,
                    ...state.user
                });
            }
        });

        return users;
    }

    /**
     * Generate user color for cursor/selection
     */
    generateUserColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7'
        ];

        // Generate deterministic color based on user ID
        const hash = this.userId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);

        return colors[Math.abs(hash) % colors.length];
    }

    /**
     * Add event listeners
     */
    on(event, callback) {
        switch (event) {
            case 'shapes-change':
                this.yShapes.observe(callback);
                break;
            case 'bindings-change':
                this.yBindings.observe(callback);
                break;
            case 'assets-change':
                this.yAssets.observe(callback);
                break;
            case 'awareness-change':
                if (this.awareness) {
                    this.awareness.on('change', callback);
                }
                break;
        }
    }

    /**
     * Remove event listeners
     */
    off(event, callback) {
        switch (event) {
            case 'shapes-change':
                this.yShapes.unobserve(callback);
                break;
            case 'bindings-change':
                this.yBindings.unobserve(callback);
                break;
            case 'assets-change':
                this.yAssets.unobserve(callback);
                break;
            case 'awareness-change':
                if (this.awareness) {
                    this.awareness.off('change', callback);
                }
                break;
        }
    }

    /**
     * Cleanup and disconnect
     */
    destroy() {
        console.log('🧹 Destroying TLDraw Yjs provider');

        if (this.websocketProvider) {
            this.websocketProvider.destroy();
        }

        if (this.indexeddbProvider) {
            this.indexeddbProvider.destroy();
        }

        this.ydoc.destroy();

        this.isConnected = false;
        this.isSynced = false;
    }
}

export default TLDrawYjsProvider;