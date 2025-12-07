/**
 * Enhanced Whiteboard Store - Zustand with undo/redo
 * Full Figma-level state management with history, collaboration, and performance optimizations
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';

// ============ Types ============

export const ElementType = {
    FRAME: 'frame',
    RECTANGLE: 'rectangle',
    ELLIPSE: 'ellipse',
    POLYGON: 'polygon',
    STAR: 'star',
    LINE: 'line',
    ARROW: 'arrow',
    PATH: 'path',
    BEZIER: 'bezier',
    CONNECTOR: 'connector',
    TEXT: 'text',
    IMAGE: 'image',
    GROUP: 'group',
    COMPONENT: 'component',
    INSTANCE: 'instance',
};

export const ToolType = {
    SELECT: 'select',
    FRAME: 'frame',
    RECTANGLE: 'rectangle',
    ELLIPSE: 'ellipse',
    POLYGON: 'polygon',
    STAR: 'star',
    LINE: 'line',
    ARROW: 'arrow',
    PEN: 'pen',
    PENCIL: 'pencil',
    BEZIER: 'bezier',
    CONNECTOR: 'connector',
    TEXT: 'text',
    IMAGE: 'image',
    HAND: 'hand',
    ZOOM: 'zoom',
    ERASER: 'eraser',
    EYEDROPPER: 'eyedropper',
    COMMENT: 'comment',
    SLICE: 'slice',
};

export const BlendMode = {
    NORMAL: 'normal',
    MULTIPLY: 'multiply',
    SCREEN: 'screen',
    OVERLAY: 'overlay',
    DARKEN: 'darken',
    LIGHTEN: 'lighten',
    COLOR_DODGE: 'color-dodge',
    COLOR_BURN: 'color-burn',
    HARD_LIGHT: 'hard-light',
    SOFT_LIGHT: 'soft-light',
    DIFFERENCE: 'difference',
    EXCLUSION: 'exclusion',
    HUE: 'hue',
    SATURATION: 'saturation',
    COLOR: 'color',
    LUMINOSITY: 'luminosity',
};

export const FillType = {
    NONE: 'none',
    SOLID: 'solid',
    LINEAR_GRADIENT: 'linear-gradient',
    RADIAL_GRADIENT: 'radial-gradient',
    IMAGE: 'image',
};

export const StrokeStyle = {
    SOLID: 'solid',
    DASHED: 'dashed',
    DOTTED: 'dotted',
};

// ============ Default Properties ============

const defaultFill = {
    type: FillType.SOLID,
    color: '#D9D9D9',
    opacity: 1,
};

const defaultStroke = {
    color: '#000000',
    width: 0,
    style: StrokeStyle.SOLID,
    cap: 'round',
    join: 'round',
};

const defaultShadow = {
    enabled: false,
    type: 'drop',
    color: 'rgba(0,0,0,0.25)',
    offsetX: 0,
    offsetY: 4,
    blur: 8,
    spread: 0,
};

const defaultBlur = {
    enabled: false,
    type: 'layer',
    amount: 0,
};

const defaultElementProps = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: { ...defaultFill },
    stroke: { ...defaultStroke },
    cornerRadius: 0,
    shadow: { ...defaultShadow },
    blur: { ...defaultBlur },
    blendMode: BlendMode.NORMAL,
    constraints: { horizontal: 'left', vertical: 'top' },
    effects: [],
};

// ============ Element Factory ============

export const createElement = (type, props = {}) => ({
    id: nanoid(),
    type,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${Date.now() % 1000}`,
    ...defaultElementProps,
    ...props,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: props.userId || 'unknown',
    lastModifiedBy: props.userId || 'unknown',
});

export const createRectangle = (x, y, width, height, props = {}) => 
    createElement(ElementType.RECTANGLE, { x, y, width, height, ...props });

export const createEllipse = (x, y, width, height, props = {}) => 
    createElement(ElementType.ELLIPSE, { x, y, width, height, ...props });

export const createLine = (x1, y1, x2, y2, props = {}) => 
    createElement(ElementType.LINE, { 
        x: x1, y: y1, width: x2 - x1, height: y2 - y1,
        stroke: { ...defaultStroke, width: 2 },
        ...props 
    });

export const createPath = (points, props = {}) => 
    createElement(ElementType.PATH, {
        points,
        stroke: { ...defaultStroke, width: 2 },
        fill: { type: FillType.NONE },
        ...props,
    });

export const createBezier = (points, props = {}) => 
    createElement(ElementType.BEZIER, {
        points,
        closed: false,
        stroke: { ...defaultStroke, width: 2 },
        fill: { type: FillType.NONE },
        ...props,
    });

export const createConnector = (startId, endId, props = {}) => 
    createElement(ElementType.CONNECTOR, {
        startElementId: startId,
        endElementId: endId,
        startAnchor: 'auto',
        endAnchor: 'auto',
        routingMode: 'auto',
        waypoints: [],
        stroke: { ...defaultStroke, width: 2 },
        fill: { type: FillType.NONE },
        endMarker: 'arrow',
        startMarker: 'none',
        ...props,
    });

export const createText = (x, y, text, props = {}) => 
    createElement(ElementType.TEXT, {
        x, y,
        width: 200,
        height: 24,
        text: text || 'Text',
        fontFamily: 'Inter, sans-serif',
        fontSize: 16,
        fontWeight: 400,
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        verticalAlign: 'top',
        lineHeight: 1.4,
        letterSpacing: 0,
        fill: { type: FillType.SOLID, color: '#000000', opacity: 1 },
        stroke: { ...defaultStroke, width: 0 },
        ...props,
    });

export const createImage = (x, y, width, height, src, props = {}) => 
    createElement(ElementType.IMAGE, {
        x, y, width, height,
        src,
        fit: 'cover',
        ...props,
    });

// ============ History System ============

const MAX_HISTORY_LENGTH = 100;

const createHistoryEntry = (elements, description) => ({
    elements: JSON.parse(JSON.stringify(elements)),
    timestamp: Date.now(),
    description,
});

// ============ Spatial Index for Performance ============

class SpatialIndex {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    getCellKey(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }

    insert(element) {
        const { x, y, width = 0, height = 0 } = element;
        const minCx = Math.floor(x / this.cellSize);
        const minCy = Math.floor(y / this.cellSize);
        const maxCx = Math.floor((x + width) / this.cellSize);
        const maxCy = Math.floor((y + height) / this.cellSize);

        for (let cx = minCx; cx <= maxCx; cx++) {
            for (let cy = minCy; cy <= maxCy; cy++) {
                const key = `${cx},${cy}`;
                if (!this.grid.has(key)) {
                    this.grid.set(key, new Set());
                }
                this.grid.get(key).add(element.id);
            }
        }
    }

    remove(element) {
        for (const [, ids] of this.grid) {
            ids.delete(element.id);
        }
    }

    query(bounds) {
        const { x, y, width, height } = bounds;
        const minCx = Math.floor(x / this.cellSize);
        const minCy = Math.floor(y / this.cellSize);
        const maxCx = Math.floor((x + width) / this.cellSize);
        const maxCy = Math.floor((y + height) / this.cellSize);

        const result = new Set();
        for (let cx = minCx; cx <= maxCx; cx++) {
            for (let cy = minCy; cy <= maxCy; cy++) {
                const key = `${cx},${cy}`;
                const ids = this.grid.get(key);
                if (ids) {
                    for (const id of ids) {
                        result.add(id);
                    }
                }
            }
        }
        return result;
    }

    rebuild(elements) {
        this.grid.clear();
        elements.forEach(el => this.insert(el));
    }
}

// ============ Main Store ============

export const useWhiteboardStore = create(
    subscribeWithSelector((set, get) => ({
        // ============ State ============
        
        elements: [],
        selectedIds: [],
        hoveredId: null,
        
        tool: ToolType.SELECT,
        toolOptions: {
            strokeColor: '#000000',
            strokeWidth: 2,
            fillColor: '#D9D9D9',
            fontSize: 16,
            fontFamily: 'Inter, sans-serif',
        },
        
        zoom: 1,
        panX: 0,
        panY: 0,
        
        gridEnabled: true,
        snapEnabled: true,
        rulersEnabled: true,
        snapToObjects: true,
        showMeasurements: true,
        backgroundColor: '#1e1e1e',
        
        guides: [],
        
        history: [],
        historyIndex: -1,
        isUndoing: false,
        
        clipboard: [],
        
        remoteCursors: {},
        remoteSelections: {},
        remoteViewports: {},
        version: 0,
        
        spatialIndex: new SpatialIndex(),
        viewportBounds: { x: 0, y: 0, width: 1920, height: 1080 },
        
        isDrawing: false,
        isDragging: false,
        isPanning: false,
        currentDrawing: null,

        // ============ Tool Actions ============
        
        setTool: (tool) => set({ tool }),
        setCurrentTool: (tool) => set({ tool }),
        
        setToolOption: (key, value) => set((state) => ({
            toolOptions: { ...state.toolOptions, [key]: value },
        })),
        
        // ============ Viewport Actions ============
        
        setViewport: ({ panX, panY, zoom: newZoom }) => {
            const updates = {};
            if (panX !== undefined) updates.panX = panX;
            if (panY !== undefined) updates.panY = panY;
            if (newZoom !== undefined) updates.zoom = Math.max(0.02, Math.min(256, newZoom));
            set(updates);
            get().updateViewportBounds();
        },
        
        setZoom: (zoom) => {
            const newZoom = Math.max(0.02, Math.min(256, zoom));
            set({ zoom: newZoom });
            get().updateViewportBounds();
        },
        
        zoomIn: () => get().setZoom(get().zoom * 1.2),
        zoomOut: () => get().setZoom(get().zoom / 1.2),
        zoomTo100: () => set({ zoom: 1 }),
        
        zoomToFit: () => {
            const { elements } = get();
            if (elements.length === 0) return;
            
            const bounds = elements.reduce((acc, el) => ({
                minX: Math.min(acc.minX, el.x),
                minY: Math.min(acc.minY, el.y),
                maxX: Math.max(acc.maxX, el.x + (el.width || 0)),
                maxY: Math.max(acc.maxY, el.y + (el.height || 0)),
            }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
            
            const padding = 100;
            const viewWidth = window.innerWidth - 300;
            const viewHeight = window.innerHeight - 100;
            const contentWidth = bounds.maxX - bounds.minX + padding * 2;
            const contentHeight = bounds.maxY - bounds.minY + padding * 2;
            const zoom = Math.min(viewWidth / contentWidth, viewHeight / contentHeight, 1);
            
            set({
                zoom,
                panX: -bounds.minX * zoom + (viewWidth - contentWidth * zoom) / 2 + padding * zoom,
                panY: -bounds.minY * zoom + (viewHeight - contentHeight * zoom) / 2 + padding * zoom,
            });
        },
        
        setPan: (x, y) => {
            set({ panX: x, panY: y });
            get().updateViewportBounds();
        },
        
        resetViewport: () => set({ zoom: 1, panX: 0, panY: 0 }),
        
        updateViewportBounds: () => {
            const { zoom, panX, panY } = get();
            const width = window.innerWidth;
            const height = window.innerHeight;
            set({
                viewportBounds: {
                    x: -panX / zoom,
                    y: -panY / zoom,
                    width: width / zoom,
                    height: height / zoom,
                },
            });
        },

        // ============ Selection Actions ============
        
        selectElements: (ids) => set({ selectedIds: ids }),
        
        addToSelection: (id) => set((state) => ({
            selectedIds: state.selectedIds.includes(id) 
                ? state.selectedIds 
                : [...state.selectedIds, id],
        })),
        
        removeFromSelection: (id) => set((state) => ({
            selectedIds: state.selectedIds.filter(i => i !== id),
        })),
        
        toggleSelection: (id) => set((state) => ({
            selectedIds: state.selectedIds.includes(id)
                ? state.selectedIds.filter(i => i !== id)
                : [...state.selectedIds, id],
        })),
        
        clearSelection: () => set({ selectedIds: [] }),
        
        selectAll: () => set((state) => ({
            selectedIds: state.elements.filter(e => !e.locked && e.visible).map(e => e.id),
        })),
        
        setHoveredId: (id) => set({ hoveredId: id }),

        // ============ Element CRUD ============
        
        addElement: (element) => {
            set((state) => ({
                elements: [...state.elements, element],
                selectedIds: [element.id],
                version: state.version + 1,
            }));
            get().spatialIndex.insert(element);
            get().pushHistory('Add element');
        },
        
        addElements: (newElements) => {
            set((state) => ({
                elements: [...state.elements, ...newElements],
                selectedIds: newElements.map(e => e.id),
                version: state.version + 1,
            }));
            newElements.forEach(el => get().spatialIndex.insert(el));
            get().pushHistory('Add elements');
        },

        updateElement: (id, updates) => {
            const element = get().elements.find(el => el.id === id);
            if (element) get().spatialIndex.remove(element);
            
            set((state) => ({
                elements: state.elements.map(el => 
                    el.id === id 
                        ? { ...el, ...updates, updatedAt: Date.now() }
                        : el
                ),
                version: state.version + 1,
            }));
            
            const updated = get().elements.find(el => el.id === id);
            if (updated) get().spatialIndex.insert(updated);
        },

        updateElements: (updates) => {
            updates.forEach(u => {
                const element = get().elements.find(el => el.id === u.id);
                if (element) get().spatialIndex.remove(element);
            });
            
            set((state) => ({
                elements: state.elements.map(el => {
                    const update = updates.find(u => u.id === el.id);
                    return update 
                        ? { ...el, ...update.changes, updatedAt: Date.now() }
                        : el;
                }),
                version: state.version + 1,
            }));
            
            updates.forEach(u => {
                const updated = get().elements.find(el => el.id === u.id);
                if (updated) get().spatialIndex.insert(updated);
            });
        },
        
        updateSelectedElements: (updates) => {
            const { selectedIds } = get();
            get().updateElements(selectedIds.map(id => ({ id, changes: updates })));
        },

        deleteElements: (ids) => {
            ids.forEach(id => {
                const element = get().elements.find(el => el.id === id);
                if (element) get().spatialIndex.remove(element);
            });
            
            set((state) => ({
                elements: state.elements.filter(el => !ids.includes(el.id)),
                selectedIds: state.selectedIds.filter(id => !ids.includes(id)),
                version: state.version + 1,
            }));
            get().pushHistory('Delete elements');
        },
        
        deleteSelectedElements: () => {
            get().deleteElements(get().selectedIds);
        },

        // ============ Ordering ============
        
        bringToFront: () => {
            const { elements, selectedIds } = get();
            const selected = elements.filter(el => selectedIds.includes(el.id));
            const others = elements.filter(el => !selectedIds.includes(el.id));
            set({ elements: [...others, ...selected], version: get().version + 1 });
            get().pushHistory('Bring to front');
        },

        sendToBack: () => {
            const { elements, selectedIds } = get();
            const selected = elements.filter(el => selectedIds.includes(el.id));
            const others = elements.filter(el => !selectedIds.includes(el.id));
            set({ elements: [...selected, ...others], version: get().version + 1 });
            get().pushHistory('Send to back');
        },

        bringForward: () => {
            const { elements, selectedIds } = get();
            if (selectedIds.length === 0) return;
            
            const newElements = [...elements];
            for (let i = newElements.length - 2; i >= 0; i--) {
                if (selectedIds.includes(newElements[i].id) && !selectedIds.includes(newElements[i + 1].id)) {
                    [newElements[i], newElements[i + 1]] = [newElements[i + 1], newElements[i]];
                }
            }
            set({ elements: newElements, version: get().version + 1 });
        },

        sendBackward: () => {
            const { elements, selectedIds } = get();
            if (selectedIds.length === 0) return;
            
            const newElements = [...elements];
            for (let i = 1; i < newElements.length; i++) {
                if (selectedIds.includes(newElements[i].id) && !selectedIds.includes(newElements[i - 1].id)) {
                    [newElements[i], newElements[i - 1]] = [newElements[i - 1], newElements[i]];
                }
            }
            set({ elements: newElements, version: get().version + 1 });
        },

        // ============ Grouping ============
        
        groupElements: (ids) => {
            const { elements } = get();
            const toGroup = elements.filter(el => ids.includes(el.id));
            if (toGroup.length < 2) return;
            
            const bounds = toGroup.reduce((acc, el) => ({
                minX: Math.min(acc.minX, el.x),
                minY: Math.min(acc.minY, el.y),
                maxX: Math.max(acc.maxX, el.x + (el.width || 0)),
                maxY: Math.max(acc.maxY, el.y + (el.height || 0)),
            }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
            
            const group = createElement(ElementType.GROUP, {
                x: bounds.minX,
                y: bounds.minY,
                width: bounds.maxX - bounds.minX,
                height: bounds.maxY - bounds.minY,
                children: ids,
            });
            
            const remaining = elements.filter(el => !ids.includes(el.id));
            const childElements = toGroup.map(el => ({
                ...el,
                parentId: group.id,
                x: el.x - bounds.minX,
                y: el.y - bounds.minY,
            }));
            
            set({
                elements: [...remaining, ...childElements, group],
                selectedIds: [group.id],
                version: get().version + 1,
            });
            get().pushHistory('Group elements');
        },

        ungroupElements: (ids) => {
            const { elements } = get();
            const groups = elements.filter(el => ids.includes(el.id) && el.type === ElementType.GROUP);
            if (groups.length === 0) return;
            
            let newElements = [...elements];
            const ungroupedIds = [];
            
            groups.forEach(group => {
                const children = newElements.filter(el => el.parentId === group.id);
                children.forEach(child => {
                    child.x += group.x;
                    child.y += group.y;
                    delete child.parentId;
                    ungroupedIds.push(child.id);
                });
                newElements = newElements.filter(el => el.id !== group.id);
            });
            
            set({
                elements: newElements,
                selectedIds: ungroupedIds,
                version: get().version + 1,
            });
            get().pushHistory('Ungroup elements');
        },

        // ============ Alignment ============
        
        alignElements: (alignment) => {
            const { elements, selectedIds } = get();
            if (selectedIds.length < 2) return;
            
            const selected = elements.filter(el => selectedIds.includes(el.id));
            const bounds = selected.reduce((acc, el) => ({
                minX: Math.min(acc.minX, el.x),
                minY: Math.min(acc.minY, el.y),
                maxX: Math.max(acc.maxX, el.x + (el.width || 0)),
                maxY: Math.max(acc.maxY, el.y + (el.height || 0)),
            }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
            
            const updates = selected.map(el => {
                let newX = el.x, newY = el.y;
                switch (alignment) {
                    case 'left': newX = bounds.minX; break;
                    case 'center': newX = bounds.minX + (bounds.maxX - bounds.minX) / 2 - (el.width || 0) / 2; break;
                    case 'right': newX = bounds.maxX - (el.width || 0); break;
                    case 'top': newY = bounds.minY; break;
                    case 'middle': newY = bounds.minY + (bounds.maxY - bounds.minY) / 2 - (el.height || 0) / 2; break;
                    case 'bottom': newY = bounds.maxY - (el.height || 0); break;
                }
                return { id: el.id, changes: { x: newX, y: newY } };
            });
            
            get().updateElements(updates);
            get().pushHistory(`Align ${alignment}`);
        },

        distributeElements: (direction) => {
            const { elements, selectedIds } = get();
            if (selectedIds.length < 3) return;
            
            const selected = elements
                .filter(el => selectedIds.includes(el.id))
                .sort((a, b) => direction === 'horizontal' ? a.x - b.x : a.y - b.y);
            
            const first = selected[0];
            const last = selected[selected.length - 1];
            
            const totalSize = selected.reduce((sum, el) => 
                sum + (direction === 'horizontal' ? el.width || 0 : el.height || 0), 0);
            
            const totalSpace = direction === 'horizontal'
                ? (last.x + (last.width || 0)) - first.x
                : (last.y + (last.height || 0)) - first.y;
            
            const gap = (totalSpace - totalSize) / (selected.length - 1);
            
            let currentPos = direction === 'horizontal' ? first.x : first.y;
            
            const updates = selected.map(el => {
                const update = { id: el.id, changes: direction === 'horizontal' ? { x: currentPos } : { y: currentPos } };
                currentPos += (direction === 'horizontal' ? el.width || 0 : el.height || 0) + gap;
                return update;
            });
            
            get().updateElements(updates);
            get().pushHistory(`Distribute ${direction}`);
        },

        // ============ Transform ============
        
        flipHorizontal: () => {
            const { elements, selectedIds } = get();
            const selected = elements.filter(el => selectedIds.includes(el.id));
            if (selected.length === 0) return;
            
            const bounds = selected.reduce((acc, el) => ({
                minX: Math.min(acc.minX, el.x),
                maxX: Math.max(acc.maxX, el.x + (el.width || 0)),
            }), { minX: Infinity, maxX: -Infinity });
            
            const centerX = (bounds.minX + bounds.maxX) / 2;
            
            const updates = selected.map(el => ({
                id: el.id,
                changes: { x: centerX * 2 - el.x - (el.width || 0) }
            }));
            
            get().updateElements(updates);
            get().pushHistory('Flip horizontal');
        },
        
        flipVertical: () => {
            const { elements, selectedIds } = get();
            const selected = elements.filter(el => selectedIds.includes(el.id));
            if (selected.length === 0) return;
            
            const bounds = selected.reduce((acc, el) => ({
                minY: Math.min(acc.minY, el.y),
                maxY: Math.max(acc.maxY, el.y + (el.height || 0)),
            }), { minY: Infinity, maxY: -Infinity });
            
            const centerY = (bounds.minY + bounds.maxY) / 2;
            
            const updates = selected.map(el => ({
                id: el.id,
                changes: { y: centerY * 2 - el.y - (el.height || 0) }
            }));
            
            get().updateElements(updates);
            get().pushHistory('Flip vertical');
        },

        // ============ Clipboard ============
        
        copyElements: () => {
            const { elements, selectedIds } = get();
            const toCopy = elements.filter(el => selectedIds.includes(el.id));
            set({ clipboard: JSON.parse(JSON.stringify(toCopy)) });
        },
        
        cutElements: () => {
            get().copyElements();
            get().deleteSelectedElements();
        },
        
        pasteElements: () => {
            const { clipboard } = get();
            if (clipboard.length === 0) return;
            
            const offset = 20;
            const newElements = clipboard.map(el => ({
                ...el,
                id: nanoid(),
                x: el.x + offset,
                y: el.y + offset,
                name: `${el.name} copy`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }));
            
            get().addElements(newElements);
        },
        
        duplicateElements: () => {
            const { elements, selectedIds } = get();
            if (selectedIds.length === 0) return;
            
            const toDuplicate = elements.filter(el => selectedIds.includes(el.id));
            const offset = 20;
            
            const newElements = toDuplicate.map(el => ({
                ...el,
                id: nanoid(),
                x: el.x + offset,
                y: el.y + offset,
                name: `${el.name} copy`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }));
            
            get().addElements(newElements);
        },

        // ============ History (Undo/Redo) ============
        
        pushHistory: (description) => {
            const { elements, history, historyIndex, isUndoing } = get();
            if (isUndoing) return;
            
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(createHistoryEntry(elements, description));
            
            if (newHistory.length > MAX_HISTORY_LENGTH) {
                newHistory.shift();
            }
            
            set({
                history: newHistory,
                historyIndex: newHistory.length - 1,
            });
        },

        undo: () => {
            const { history, historyIndex } = get();
            if (historyIndex <= 0) return;
            
            set({ isUndoing: true });
            const entry = history[historyIndex - 1];
            set({
                elements: JSON.parse(JSON.stringify(entry.elements)),
                historyIndex: historyIndex - 1,
                selectedIds: [],
            });
            get().spatialIndex.rebuild(get().elements);
            set({ isUndoing: false });
        },

        redo: () => {
            const { history, historyIndex } = get();
            if (historyIndex >= history.length - 1) return;
            
            set({ isUndoing: true });
            const entry = history[historyIndex + 1];
            set({
                elements: JSON.parse(JSON.stringify(entry.elements)),
                historyIndex: historyIndex + 1,
                selectedIds: [],
            });
            get().spatialIndex.rebuild(get().elements);
            set({ isUndoing: false });
        },

        canUndo: () => get().historyIndex > 0,
        canRedo: () => get().historyIndex < get().history.length - 1,

        // ============ Guides ============
        
        setGuides: (guides) => set({ guides }),
        
        addGuide: (guide) => set((state) => ({
            guides: [...state.guides, { id: nanoid(), ...guide }],
        })),
        
        removeGuide: (id) => set((state) => ({
            guides: state.guides.filter(g => g.id !== id),
        })),

        // ============ Collaboration ============
        
        setRemoteCursors: (cursors) => set({ remoteCursors: cursors }),
        setRemoteSelections: (selections) => set({ remoteSelections: selections }),
        
        setRemoteSelection: (userId, selectedIds) => set((state) => ({
            remoteSelections: { ...state.remoteSelections, [userId]: selectedIds },
        })),
        
        removeRemoteSelection: (userId) => set((state) => {
            const { [userId]: _, ...rest } = state.remoteSelections;
            return { remoteSelections: rest };
        }),
        
        setRemoteViewport: (userId, viewport) => set((state) => ({
            remoteViewports: { ...state.remoteViewports, [userId]: viewport },
        })),

        // ============ Bulk Operations ============
        
        setElements: (elements, skipHistory = false) => {
            set({ elements, version: get().version + 1 });
            get().spatialIndex.rebuild(elements);
            if (!skipHistory) get().pushHistory('Set elements');
        },
        
        clearCanvas: () => {
            set({ elements: [], selectedIds: [], version: get().version + 1 });
            get().spatialIndex.rebuild([]);
            get().pushHistory('Clear canvas');
        },

        // ============ Query Helpers ============
        
        getElementById: (id) => get().elements.find(el => el.id === id),
        
        getSelectedElements: () => {
            const { elements, selectedIds } = get();
            return elements.filter(el => selectedIds.includes(el.id));
        },
        
        getVisibleElements: () => {
            const { elements, viewportBounds, spatialIndex } = get();
            const visibleIds = spatialIndex.query(viewportBounds);
            return elements.filter(el => el.visible && visibleIds.has(el.id));
        },
        
        getElementAtPoint: (x, y) => {
            const { elements } = get();
            return [...elements].reverse().find(el => {
                if (!el.visible || el.locked) return false;
                return x >= el.x && x <= el.x + (el.width || 0) &&
                       y >= el.y && y <= el.y + (el.height || 0);
            });
        },
        
        getElementsInBounds: (bounds) => {
            const { elements } = get();
            return elements.filter(el => {
                if (!el.visible) return false;
                return el.x < bounds.x + bounds.width &&
                       el.x + (el.width || 0) > bounds.x &&
                       el.y < bounds.y + bounds.height &&
                       el.y + (el.height || 0) > bounds.y;
            });
        },
        
        getSelectionBounds: () => {
            const selected = get().getSelectedElements();
            if (selected.length === 0) return null;
            
            return selected.reduce((acc, el) => ({
                x: Math.min(acc.x, el.x),
                y: Math.min(acc.y, el.y),
                width: Math.max(acc.x + acc.width, el.x + (el.width || 0)) - Math.min(acc.x, el.x),
                height: Math.max(acc.y + acc.height, el.y + (el.height || 0)) - Math.min(acc.y, el.y),
            }), { 
                x: selected[0].x, 
                y: selected[0].y, 
                width: selected[0].width || 0, 
                height: selected[0].height || 0,
            });
        },

        // ============ Drawing State ============
        
        setIsDrawing: (isDrawing) => set({ isDrawing }),
        setIsDragging: (isDragging) => set({ isDragging }),
        setIsPanning: (isPanning) => set({ isPanning }),
        setCurrentDrawing: (currentDrawing) => set({ currentDrawing }),
    }))
);

// ============ Selector Hooks ============

export const useSelectedElements = () => useWhiteboardStore(
    (state) => state.elements.filter(el => state.selectedIds.includes(el.id))
);

export const useTool = () => useWhiteboardStore((state) => state.tool);
export const useZoom = () => useWhiteboardStore((state) => state.zoom);
export const useElements = () => useWhiteboardStore((state) => state.elements);
export const useSelectedIds = () => useWhiteboardStore((state) => state.selectedIds);
export const useGridEnabled = () => useWhiteboardStore((state) => state.gridEnabled);
export const useSnapEnabled = () => useWhiteboardStore((state) => state.snapEnabled);
export const useRulersEnabled = () => useWhiteboardStore((state) => state.rulersEnabled);
export const useCanUndo = () => useWhiteboardStore((state) => state.historyIndex > 0);
export const useCanRedo = () => useWhiteboardStore((state) => state.historyIndex < state.history.length - 1);
