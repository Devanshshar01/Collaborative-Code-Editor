/**
 * Whiteboard Socket - Real-time sync events for collaborative whiteboard
 * Handles all socket.io events for the enhanced whiteboard
 */

import { useWhiteboardStore } from './whiteboardStore';

// ============ Socket Event Types ============

export const WhiteboardEvents = {
    // Element operations
    OBJECT_CREATED: 'whiteboard:object-created',
    OBJECT_MODIFIED: 'whiteboard:object-modified',
    OBJECT_DELETED: 'whiteboard:object-deleted',
    OBJECTS_BATCH_UPDATE: 'whiteboard:objects-batch-update',
    
    // Selection
    SELECTION_CHANGED: 'whiteboard:selection-changed',
    
    // Cursor/Viewport
    CURSOR_MOVED: 'whiteboard:cursor-moved',
    VIEWPORT_CHANGED: 'whiteboard:viewport-changed',
    
    // History
    UNDO: 'whiteboard:undo',
    REDO: 'whiteboard:redo',
    
    // State sync
    REQUEST_STATE: 'whiteboard:request-state',
    STATE_SYNC: 'whiteboard:state-sync',
    
    // User presence
    USER_JOINED: 'whiteboard:user-joined',
    USER_LEFT: 'whiteboard:user-left',
};

// ============ Throttle Utility ============

const throttle = (fn, delay) => {
    let lastCall = 0;
    let timeout = null;
    
    return (...args) => {
        const now = Date.now();
        const remaining = delay - (now - lastCall);
        
        if (remaining <= 0) {
            lastCall = now;
            fn(...args);
        } else if (!timeout) {
            timeout = setTimeout(() => {
                lastCall = Date.now();
                timeout = null;
                fn(...args);
            }, remaining);
        }
    };
};

// ============ Whiteboard Socket Manager ============

export class WhiteboardSocket {
    constructor(socket, roomId, userId, userName, userColor) {
        this.socket = socket;
        this.roomId = roomId;
        this.userId = userId;
        this.userName = userName;
        this.userColor = userColor;
        this.isConnected = false;
        this.pendingUpdates = [];
        this.updateBatchTimeout = null;
        
        // Throttled methods
        this.emitCursorThrottled = throttle(this.emitCursor.bind(this), 50);
        this.emitViewportThrottled = throttle(this.emitViewport.bind(this), 100);
        this.emitObjectModifiedThrottled = throttle(this.emitObjectModified.bind(this), 100);
    }
    
    // ============ Connection ============
    
    connect() {
        if (!this.socket) {
            console.error('Socket not provided');
            return;
        }
        
        this.setupListeners();
        this.requestState();
        this.isConnected = true;
        
        // Announce presence
        this.socket.emit(WhiteboardEvents.USER_JOINED, {
            roomId: this.roomId,
            userId: this.userId,
            userName: this.userName,
            userColor: this.userColor,
        });
        
        console.log('[WhiteboardSocket] Connected to room:', this.roomId);
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.emit(WhiteboardEvents.USER_LEFT, {
                roomId: this.roomId,
                userId: this.userId,
            });
            
            this.removeListeners();
        }
        
        this.isConnected = false;
        console.log('[WhiteboardSocket] Disconnected from room:', this.roomId);
    }
    
    // ============ Event Listeners ============
    
    setupListeners() {
        const socket = this.socket;
        
        // Object events
        socket.on(WhiteboardEvents.OBJECT_CREATED, this.handleObjectCreated.bind(this));
        socket.on(WhiteboardEvents.OBJECT_MODIFIED, this.handleObjectModified.bind(this));
        socket.on(WhiteboardEvents.OBJECT_DELETED, this.handleObjectDeleted.bind(this));
        socket.on(WhiteboardEvents.OBJECTS_BATCH_UPDATE, this.handleBatchUpdate.bind(this));
        
        // Selection events
        socket.on(WhiteboardEvents.SELECTION_CHANGED, this.handleSelectionChanged.bind(this));
        
        // Cursor/Viewport events
        socket.on(WhiteboardEvents.CURSOR_MOVED, this.handleCursorMoved.bind(this));
        socket.on(WhiteboardEvents.VIEWPORT_CHANGED, this.handleViewportChanged.bind(this));
        
        // State sync
        socket.on(WhiteboardEvents.STATE_SYNC, this.handleStateSync.bind(this));
        
        // User presence
        socket.on(WhiteboardEvents.USER_JOINED, this.handleUserJoined.bind(this));
        socket.on(WhiteboardEvents.USER_LEFT, this.handleUserLeft.bind(this));
    }
    
    removeListeners() {
        const socket = this.socket;
        
        socket.off(WhiteboardEvents.OBJECT_CREATED);
        socket.off(WhiteboardEvents.OBJECT_MODIFIED);
        socket.off(WhiteboardEvents.OBJECT_DELETED);
        socket.off(WhiteboardEvents.OBJECTS_BATCH_UPDATE);
        socket.off(WhiteboardEvents.SELECTION_CHANGED);
        socket.off(WhiteboardEvents.CURSOR_MOVED);
        socket.off(WhiteboardEvents.VIEWPORT_CHANGED);
        socket.off(WhiteboardEvents.STATE_SYNC);
        socket.off(WhiteboardEvents.USER_JOINED);
        socket.off(WhiteboardEvents.USER_LEFT);
    }
    
    // ============ Event Handlers ============
    
    handleObjectCreated(data) {
        if (data.userId === this.userId) return;
        
        const store = useWhiteboardStore.getState();
        const exists = store.elements.find(el => el.id === data.element.id);
        
        if (!exists) {
            store.addElement(data.element);
            console.log('[WhiteboardSocket] Object created by remote user:', data.element.id);
        }
    }
    
    handleObjectModified(data) {
        if (data.userId === this.userId) return;
        
        const store = useWhiteboardStore.getState();
        store.updateElement(data.elementId, data.changes);
        console.log('[WhiteboardSocket] Object modified by remote user:', data.elementId);
    }
    
    handleObjectDeleted(data) {
        if (data.userId === this.userId) return;
        
        const store = useWhiteboardStore.getState();
        store.deleteElements(data.elementIds);
        console.log('[WhiteboardSocket] Objects deleted by remote user:', data.elementIds);
    }
    
    handleBatchUpdate(data) {
        if (data.userId === this.userId) return;
        
        const store = useWhiteboardStore.getState();
        store.updateElements(data.updates);
        console.log('[WhiteboardSocket] Batch update from remote user:', data.updates.length, 'objects');
    }
    
    handleSelectionChanged(data) {
        if (data.userId === this.userId) return;
        
        const store = useWhiteboardStore.getState();
        store.setRemoteSelection(data.userId, data.selectedIds);
    }
    
    handleCursorMoved(data) {
        if (data.userId === this.userId) return;
        
        const store = useWhiteboardStore.getState();
        store.setRemoteCursors({
            ...store.remoteCursors,
            [data.userId]: {
                x: data.x,
                y: data.y,
                name: data.userName,
                color: data.userColor,
            },
        });
    }
    
    handleViewportChanged(data) {
        if (data.userId === this.userId) return;
        
        const store = useWhiteboardStore.getState();
        store.setRemoteViewport(data.userId, {
            zoom: data.zoom,
            panX: data.panX,
            panY: data.panY,
        });
    }
    
    handleStateSync(data) {
        const store = useWhiteboardStore.getState();
        store.setElements(data.elements, true);
        console.log('[WhiteboardSocket] State synced:', data.elements.length, 'elements');
    }
    
    handleUserJoined(data) {
        if (data.userId === this.userId) return;
        
        console.log('[WhiteboardSocket] User joined:', data.userName);
        
        // If we have state, share it with the new user
        const store = useWhiteboardStore.getState();
        if (store.elements.length > 0) {
            this.socket.emit(WhiteboardEvents.STATE_SYNC, {
                roomId: this.roomId,
                elements: store.elements,
                targetUserId: data.userId,
            });
        }
    }
    
    handleUserLeft(data) {
        if (data.userId === this.userId) return;
        
        const store = useWhiteboardStore.getState();
        
        // Remove remote cursor
        const newCursors = { ...store.remoteCursors };
        delete newCursors[data.userId];
        store.setRemoteCursors(newCursors);
        
        // Remove remote selection
        store.removeRemoteSelection(data.userId);
        
        console.log('[WhiteboardSocket] User left:', data.userId);
    }
    
    // ============ Emit Methods ============
    
    requestState() {
        this.socket.emit(WhiteboardEvents.REQUEST_STATE, {
            roomId: this.roomId,
            userId: this.userId,
        });
    }
    
    emitObjectCreated(element) {
        if (!this.isConnected) return;
        
        this.socket.emit(WhiteboardEvents.OBJECT_CREATED, {
            roomId: this.roomId,
            userId: this.userId,
            element,
        });
    }
    
    emitObjectModified(elementId, changes) {
        if (!this.isConnected) return;
        
        this.socket.emit(WhiteboardEvents.OBJECT_MODIFIED, {
            roomId: this.roomId,
            userId: this.userId,
            elementId,
            changes,
        });
    }
    
    emitObjectDeleted(elementIds) {
        if (!this.isConnected) return;
        
        this.socket.emit(WhiteboardEvents.OBJECT_DELETED, {
            roomId: this.roomId,
            userId: this.userId,
            elementIds,
        });
    }
    
    emitBatchUpdate(updates) {
        if (!this.isConnected) return;
        
        this.socket.emit(WhiteboardEvents.OBJECTS_BATCH_UPDATE, {
            roomId: this.roomId,
            userId: this.userId,
            updates,
        });
    }
    
    emitSelectionChanged(selectedIds) {
        if (!this.isConnected) return;
        
        this.socket.emit(WhiteboardEvents.SELECTION_CHANGED, {
            roomId: this.roomId,
            userId: this.userId,
            selectedIds,
        });
    }
    
    emitCursor(x, y) {
        if (!this.isConnected) return;
        
        this.socket.emit(WhiteboardEvents.CURSOR_MOVED, {
            roomId: this.roomId,
            userId: this.userId,
            userName: this.userName,
            userColor: this.userColor,
            x,
            y,
        });
    }
    
    emitViewport(zoom, panX, panY) {
        if (!this.isConnected) return;
        
        this.socket.emit(WhiteboardEvents.VIEWPORT_CHANGED, {
            roomId: this.roomId,
            userId: this.userId,
            zoom,
            panX,
            panY,
        });
    }
    
    emitUndo() {
        if (!this.isConnected) return;
        
        this.socket.emit(WhiteboardEvents.UNDO, {
            roomId: this.roomId,
            userId: this.userId,
        });
    }
    
    emitRedo() {
        if (!this.isConnected) return;
        
        this.socket.emit(WhiteboardEvents.REDO, {
            roomId: this.roomId,
            userId: this.userId,
        });
    }
    
    // ============ Batched Updates ============
    
    queueUpdate(elementId, changes) {
        this.pendingUpdates.push({ id: elementId, changes });
        
        if (!this.updateBatchTimeout) {
            this.updateBatchTimeout = setTimeout(() => {
                this.flushUpdates();
            }, 50);
        }
    }
    
    flushUpdates() {
        if (this.pendingUpdates.length > 0) {
            this.emitBatchUpdate(this.pendingUpdates);
            this.pendingUpdates = [];
        }
        this.updateBatchTimeout = null;
    }
}

// ============ Hook ============

export const createWhiteboardSocket = (socket, roomId, userId, userName, userColor) => {
    return new WhiteboardSocket(socket, roomId, userId, userName, userColor);
};

export default WhiteboardSocket;
