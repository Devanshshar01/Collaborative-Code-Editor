/**
 * Whiteboard Yjs Integration - CRDT integration for conflict-free sync
 * Uses Yjs for real-time collaborative editing of whiteboard elements
 */

import * as Y from 'yjs';
import { useWhiteboardStore } from './whiteboardStore';

// ============ Yjs Document Structure ============
// 
// whiteboardDoc.getMap('elements') - Map of element ID -> element data
// whiteboardDoc.getArray('order') - Array of element IDs (z-order)
// whiteboardDoc.getMap('awareness') - User awareness (cursors, selections)

// ============ Whiteboard Yjs Manager ============

export class WhiteboardYjs {
    constructor(doc, awareness, roomId, userId, userName, userColor) {
        this.doc = doc;
        this.awareness = awareness;
        this.roomId = roomId;
        this.userId = userId;
        this.userName = userName;
        this.userColor = userColor;
        
        // Yjs shared types
        this.elementsMap = doc.getMap('whiteboard-elements');
        this.orderArray = doc.getArray('whiteboard-order');
        this.metaMap = doc.getMap('whiteboard-meta');
        
        // Flags
        this.isSyncing = false;
        this.isInitialized = false;
        
        // Unsubscribe functions
        this.unsubscribers = [];
    }
    
    // ============ Initialization ============
    
    init() {
        this.setupYjsObservers();
        this.setupStoreSubscriptions();
        this.setupAwareness();
        this.syncFromYjs();
        this.isInitialized = true;
        
        console.log('[WhiteboardYjs] Initialized');
    }
    
    destroy() {
        // Remove observers
        this.elementsMap.unobserve(this.handleElementsChange);
        this.orderArray.unobserve(this.handleOrderChange);
        
        // Remove awareness
        if (this.awareness) {
            this.awareness.setLocalState(null);
        }
        
        // Unsubscribe from store
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        
        this.isInitialized = false;
        console.log('[WhiteboardYjs] Destroyed');
    }
    
    // ============ Yjs Observers ============
    
    setupYjsObservers() {
        this.handleElementsChange = this.handleElementsChange.bind(this);
        this.handleOrderChange = this.handleOrderChange.bind(this);
        
        this.elementsMap.observe(this.handleElementsChange);
        this.orderArray.observe(this.handleOrderChange);
    }
    
    handleElementsChange(event, transaction) {
        // Skip if this change came from our own update
        if (transaction.local) return;
        
        this.isSyncing = true;
        
        const store = useWhiteboardStore.getState();
        let newElements = [...store.elements];
        let hasChanges = false;
        
        event.changes.keys.forEach((change, key) => {
            if (change.action === 'add' || change.action === 'update') {
                const elementData = this.elementsMap.get(key);
                if (elementData) {
                    const element = JSON.parse(JSON.stringify(elementData));
                    const existingIndex = newElements.findIndex(el => el.id === key);
                    
                    if (existingIndex >= 0) {
                        newElements[existingIndex] = { ...newElements[existingIndex], ...element };
                    } else {
                        newElements.push(element);
                    }
                    hasChanges = true;
                }
            } else if (change.action === 'delete') {
                newElements = newElements.filter(el => el.id !== key);
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            store.setElements(newElements, true);
        }
        
        this.isSyncing = false;
    }
    
    handleOrderChange(event, transaction) {
        if (transaction.local) return;
        
        this.isSyncing = true;
        
        const store = useWhiteboardStore.getState();
        const order = this.orderArray.toArray();
        
        // Reorder elements based on order array
        const orderedElements = order
            .map(id => store.elements.find(el => el.id === id))
            .filter(Boolean);
        
        // Add any elements not in order array at the end
        const missingElements = store.elements.filter(
            el => !order.includes(el.id)
        );
        
        if (orderedElements.length > 0 || missingElements.length > 0) {
            store.setElements([...orderedElements, ...missingElements], true);
        }
        
        this.isSyncing = false;
    }
    
    // ============ Store Subscriptions ============
    
    setupStoreSubscriptions() {
        // Subscribe to elements changes
        const unsubElements = useWhiteboardStore.subscribe(
            state => state.elements,
            (elements, prevElements) => {
                if (this.isSyncing) return;
                this.syncToYjs(elements, prevElements);
            }
        );
        
        // Subscribe to selection changes
        const unsubSelection = useWhiteboardStore.subscribe(
            state => state.selectedIds,
            (selectedIds) => {
                this.updateAwarenessSelection(selectedIds);
            }
        );
        
        this.unsubscribers.push(unsubElements, unsubSelection);
    }
    
    syncToYjs(elements, prevElements) {
        this.doc.transact(() => {
            // Find added elements
            const addedElements = elements.filter(
                el => !prevElements.find(prev => prev.id === el.id)
            );
            
            // Find modified elements
            const modifiedElements = elements.filter(el => {
                const prev = prevElements.find(p => p.id === el.id);
                return prev && JSON.stringify(el) !== JSON.stringify(prev);
            });
            
            // Find deleted elements
            const deletedIds = prevElements
                .filter(prev => !elements.find(el => el.id === prev.id))
                .map(el => el.id);
            
            // Apply changes to Yjs
            addedElements.forEach(el => {
                this.elementsMap.set(el.id, JSON.parse(JSON.stringify(el)));
                // Add to order array if not present
                if (!this.orderArray.toArray().includes(el.id)) {
                    this.orderArray.push([el.id]);
                }
            });
            
            modifiedElements.forEach(el => {
                this.elementsMap.set(el.id, JSON.parse(JSON.stringify(el)));
            });
            
            deletedIds.forEach(id => {
                this.elementsMap.delete(id);
                // Remove from order array
                const orderIndex = this.orderArray.toArray().indexOf(id);
                if (orderIndex >= 0) {
                    this.orderArray.delete(orderIndex, 1);
                }
            });
            
            // Update order if it changed
            const currentOrder = elements.map(el => el.id);
            const yjsOrder = this.orderArray.toArray();
            
            if (JSON.stringify(currentOrder) !== JSON.stringify(yjsOrder)) {
                // Clear and rebuild order array
                this.orderArray.delete(0, this.orderArray.length);
                this.orderArray.push(currentOrder);
            }
        });
    }
    
    syncFromYjs() {
        const elements = [];
        const order = this.orderArray.toArray();
        
        // Get elements in order
        order.forEach(id => {
            const elementData = this.elementsMap.get(id);
            if (elementData) {
                elements.push(JSON.parse(JSON.stringify(elementData)));
            }
        });
        
        // Get any elements not in order array
        this.elementsMap.forEach((value, key) => {
            if (!order.includes(key)) {
                elements.push(JSON.parse(JSON.stringify(value)));
            }
        });
        
        if (elements.length > 0) {
            this.isSyncing = true;
            useWhiteboardStore.getState().setElements(elements, true);
            this.isSyncing = false;
            console.log('[WhiteboardYjs] Synced from Yjs:', elements.length, 'elements');
        }
    }
    
    // ============ Awareness (Cursors & Selections) ============
    
    setupAwareness() {
        if (!this.awareness) return;
        
        // Set initial awareness state
        this.awareness.setLocalStateField('whiteboard', {
            cursor: null,
            selection: [],
            user: {
                id: this.userId,
                name: this.userName,
                color: this.userColor,
            },
        });
        
        // Listen for awareness changes
        this.awareness.on('change', this.handleAwarenessChange.bind(this));
    }
    
    handleAwarenessChange() {
        const store = useWhiteboardStore.getState();
        const cursors = {};
        const selections = {};
        
        this.awareness.getStates().forEach((state, clientId) => {
            if (clientId === this.awareness.clientID) return;
            
            const whiteboardState = state.whiteboard;
            if (!whiteboardState?.user) return;
            
            const { cursor, selection, user } = whiteboardState;
            
            if (cursor) {
                cursors[user.id] = {
                    x: cursor.x,
                    y: cursor.y,
                    name: user.name,
                    color: user.color,
                };
            }
            
            if (selection && selection.length > 0) {
                selections[user.id] = selection;
            }
        });
        
        store.setRemoteCursors(cursors);
        Object.entries(selections).forEach(([userId, selectedIds]) => {
            store.setRemoteSelection(userId, selectedIds);
        });
    }
    
    updateAwarenessCursor(x, y) {
        if (!this.awareness) return;
        
        this.awareness.setLocalStateField('whiteboard', {
            ...this.awareness.getLocalState()?.whiteboard,
            cursor: { x, y },
        });
    }
    
    updateAwarenessSelection(selectedIds) {
        if (!this.awareness) return;
        
        this.awareness.setLocalStateField('whiteboard', {
            ...this.awareness.getLocalState()?.whiteboard,
            selection: selectedIds,
        });
    }
    
    clearAwarenessCursor() {
        if (!this.awareness) return;
        
        this.awareness.setLocalStateField('whiteboard', {
            ...this.awareness.getLocalState()?.whiteboard,
            cursor: null,
        });
    }
    
    // ============ Element Operations ============
    
    addElement(element) {
        this.doc.transact(() => {
            this.elementsMap.set(element.id, JSON.parse(JSON.stringify(element)));
            this.orderArray.push([element.id]);
        });
    }
    
    updateElement(id, changes) {
        const existing = this.elementsMap.get(id);
        if (existing) {
            const updated = { ...JSON.parse(JSON.stringify(existing)), ...changes };
            this.elementsMap.set(id, updated);
        }
    }
    
    deleteElement(id) {
        this.doc.transact(() => {
            this.elementsMap.delete(id);
            const orderIndex = this.orderArray.toArray().indexOf(id);
            if (orderIndex >= 0) {
                this.orderArray.delete(orderIndex, 1);
            }
        });
    }
    
    deleteElements(ids) {
        this.doc.transact(() => {
            ids.forEach(id => {
                this.elementsMap.delete(id);
                const orderIndex = this.orderArray.toArray().indexOf(id);
                if (orderIndex >= 0) {
                    this.orderArray.delete(orderIndex, 1);
                }
            });
        });
    }
    
    moveElement(id, newIndex) {
        this.doc.transact(() => {
            const currentIndex = this.orderArray.toArray().indexOf(id);
            if (currentIndex >= 0 && currentIndex !== newIndex) {
                this.orderArray.delete(currentIndex, 1);
                this.orderArray.insert(newIndex, [id]);
            }
        });
    }
    
    // ============ Undo/Redo ============
    
    // Note: For proper collaborative undo/redo, you would use Y.UndoManager
    // This is a simplified version that syncs with the local store
    
    createUndoManager() {
        const undoManager = new Y.UndoManager([this.elementsMap, this.orderArray], {
            trackedOrigins: new Set([this.doc.clientID]),
        });
        
        return {
            undo: () => undoManager.undo(),
            redo: () => undoManager.redo(),
            canUndo: () => undoManager.canUndo(),
            canRedo: () => undoManager.canRedo(),
        };
    }
}

// ============ Factory Function ============

export const createWhiteboardYjs = (doc, awareness, roomId, userId, userName, userColor) => {
    const whiteboardYjs = new WhiteboardYjs(doc, awareness, roomId, userId, userName, userColor);
    return whiteboardYjs;
};

export default WhiteboardYjs;
