/**
 * Figma Canvas Store - Zustand state management
 * Manages all canvas state: elements, selection, tools, viewport
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';

// Element types
export const ElementType = {
    FRAME: 'frame',
    RECTANGLE: 'rectangle',
    ELLIPSE: 'ellipse',
    POLYGON: 'polygon',
    STAR: 'star',
    LINE: 'line',
    ARROW: 'arrow',
    PATH: 'path',
    TEXT: 'text',
    IMAGE: 'image',
    GROUP: 'group',
    COMPONENT: 'component',
    INSTANCE: 'instance',
};

// Tool types
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
    TEXT: 'text',
    HAND: 'hand',
    ZOOM: 'zoom',
    COMMENT: 'comment',
    SLICE: 'slice',
};

// Default element properties
const defaultElementProps = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: { type: 'solid', color: '#D9D9D9' },
    stroke: { color: '#000000', width: 0, style: 'solid' },
    cornerRadius: 0,
    shadow: null,
    blur: null,
    constraints: { horizontal: 'left', vertical: 'top' },
};

// Create element factory
export const createElement = (type, props = {}) => ({
    id: nanoid(),
    type,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${Date.now() % 1000}`,
    ...defaultElementProps,
    ...props,
    createdAt: Date.now(),
    updatedAt: Date.now(),
});

// Main store
export const useCanvasStore = create(
    subscribeWithSelector((set, get) => ({
        // State
        elements: [],
        selectedIds: [],
        hoveredId: null,
        tool: ToolType.SELECT,
        zoom: 1,
        pan: { x: 0, y: 0 },
        gridEnabled: true,
        snapEnabled: true,
        rulersEnabled: true,
        guides: [],
        clipboard: [],
        
        // History for collaborative sync
        version: 0,

        // Tool actions
        setTool: (tool) => set({ tool }),
        
        // Viewport actions
        setZoom: (zoom) => set({ zoom: Math.max(0.02, Math.min(256, zoom)) }),
        setPan: (pan) => set({ pan }),
        resetViewport: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),
        fitToScreen: () => {
            const { elements } = get();
            if (elements.length === 0) return;
            
            // Calculate bounding box of all elements
            const bounds = elements.reduce((acc, el) => ({
                minX: Math.min(acc.minX, el.x),
                minY: Math.min(acc.minY, el.y),
                maxX: Math.max(acc.maxX, el.x + (el.width || 0)),
                maxY: Math.max(acc.maxY, el.y + (el.height || 0)),
            }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
            
            // Calculate zoom to fit
            const padding = 100;
            const viewWidth = window.innerWidth - 300; // Account for panels
            const viewHeight = window.innerHeight - 60;
            const contentWidth = bounds.maxX - bounds.minX + padding * 2;
            const contentHeight = bounds.maxY - bounds.minY + padding * 2;
            const zoom = Math.min(viewWidth / contentWidth, viewHeight / contentHeight, 1);
            
            set({
                zoom,
                pan: {
                    x: -bounds.minX * zoom + (viewWidth - contentWidth * zoom) / 2 + padding * zoom,
                    y: -bounds.minY * zoom + (viewHeight - contentHeight * zoom) / 2 + padding * zoom,
                },
            });
        },

        // Selection actions
        selectElements: (ids) => set({ selectedIds: ids }),
        addToSelection: (id) => set((state) => ({
            selectedIds: state.selectedIds.includes(id) 
                ? state.selectedIds 
                : [...state.selectedIds, id]
        })),
        removeFromSelection: (id) => set((state) => ({
            selectedIds: state.selectedIds.filter(i => i !== id)
        })),
        clearSelection: () => set({ selectedIds: [] }),
        selectAll: () => set((state) => ({ 
            selectedIds: state.elements.filter(e => !e.locked).map(e => e.id) 
        })),
        setHoveredId: (id) => set({ hoveredId: id }),

        // Element CRUD actions
        addElement: (element) => set((state) => ({
            elements: [...state.elements, element],
            selectedIds: [element.id],
            version: state.version + 1,
        })),
        
        addElements: (newElements) => set((state) => ({
            elements: [...state.elements, ...newElements],
            selectedIds: newElements.map(e => e.id),
            version: state.version + 1,
        })),

        updateElement: (id, updates) => set((state) => ({
            elements: state.elements.map(el => 
                el.id === id 
                    ? { ...el, ...updates, updatedAt: Date.now() }
                    : el
            ),
            version: state.version + 1,
        })),

        updateElements: (updates) => set((state) => ({
            elements: state.elements.map(el => {
                const update = updates.find(u => u.id === el.id);
                return update 
                    ? { ...el, ...update.changes, updatedAt: Date.now() }
                    : el;
            }),
            version: state.version + 1,
        })),

        deleteElements: (ids) => set((state) => ({
            elements: state.elements.filter(el => !ids.includes(el.id)),
            selectedIds: state.selectedIds.filter(id => !ids.includes(id)),
            version: state.version + 1,
        })),

        // Ordering actions
        bringToFront: (ids) => set((state) => {
            const selected = state.elements.filter(el => ids.includes(el.id));
            const others = state.elements.filter(el => !ids.includes(el.id));
            return {
                elements: [...others, ...selected],
                version: state.version + 1,
            };
        }),

        sendToBack: (ids) => set((state) => {
            const selected = state.elements.filter(el => ids.includes(el.id));
            const others = state.elements.filter(el => !ids.includes(el.id));
            return {
                elements: [...selected, ...others],
                version: state.version + 1,
            };
        }),

        bringForward: (ids) => set((state) => {
            const elements = [...state.elements];
            ids.forEach(id => {
                const index = elements.findIndex(el => el.id === id);
                if (index < elements.length - 1) {
                    [elements[index], elements[index + 1]] = [elements[index + 1], elements[index]];
                }
            });
            return { elements, version: state.version + 1 };
        }),

        sendBackward: (ids) => set((state) => {
            const elements = [...state.elements];
            ids.forEach(id => {
                const index = elements.findIndex(el => el.id === id);
                if (index > 0) {
                    [elements[index], elements[index - 1]] = [elements[index - 1], elements[index]];
                }
            });
            return { elements, version: state.version + 1 };
        }),

        // Grouping actions
        groupElements: (ids) => {
            if (ids.length < 2) return;
            
            const { elements } = get();
            const toGroup = elements.filter(el => ids.includes(el.id));
            
            // Calculate group bounds
            const bounds = toGroup.reduce((acc, el) => ({
                minX: Math.min(acc.minX, el.x),
                minY: Math.min(acc.minY, el.y),
                maxX: Math.max(acc.maxX, el.x + (el.width || 0)),
                maxY: Math.max(acc.maxY, el.y + (el.height || 0)),
            }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

            // Create group element
            const group = createElement(ElementType.GROUP, {
                x: bounds.minX,
                y: bounds.minY,
                width: bounds.maxX - bounds.minX,
                height: bounds.maxY - bounds.minY,
                children: toGroup.map(el => ({
                    ...el,
                    x: el.x - bounds.minX,
                    y: el.y - bounds.minY,
                })),
            });

            set((state) => ({
                elements: [
                    ...state.elements.filter(el => !ids.includes(el.id)),
                    group,
                ],
                selectedIds: [group.id],
                version: state.version + 1,
            }));
        },

        ungroupElements: (ids) => set((state) => {
            const newElements = [];
            const groupIds = [];

            state.elements.forEach(el => {
                if (ids.includes(el.id) && el.type === ElementType.GROUP && el.children) {
                    groupIds.push(el.id);
                    el.children.forEach(child => {
                        newElements.push({
                            ...child,
                            id: nanoid(),
                            x: el.x + child.x,
                            y: el.y + child.y,
                        });
                    });
                }
            });

            return {
                elements: [
                    ...state.elements.filter(el => !groupIds.includes(el.id)),
                    ...newElements,
                ],
                selectedIds: newElements.map(e => e.id),
                version: state.version + 1,
            };
        }),

        // Duplicate actions
        duplicateElements: (ids) => set((state) => {
            const toDuplicate = state.elements.filter(el => ids.includes(el.id));
            const duplicated = toDuplicate.map(el => ({
                ...el,
                id: nanoid(),
                name: `${el.name} copy`,
                x: el.x + 20,
                y: el.y + 20,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }));

            return {
                elements: [...state.elements, ...duplicated],
                selectedIds: duplicated.map(e => e.id),
                version: state.version + 1,
            };
        }),

        // Lock/Visibility actions
        lockElements: (ids) => set((state) => ({
            elements: state.elements.map(el => 
                ids.includes(el.id) ? { ...el, locked: true } : el
            ),
            version: state.version + 1,
        })),

        unlockElements: (ids) => set((state) => ({
            elements: state.elements.map(el => 
                ids.includes(el.id) ? { ...el, locked: false } : el
            ),
            version: state.version + 1,
        })),

        toggleVisibility: (id) => set((state) => ({
            elements: state.elements.map(el => 
                el.id === id ? { ...el, visible: !el.visible } : el
            ),
            version: state.version + 1,
        })),

        // Clipboard actions
        setClipboard: (elements) => set({ clipboard: elements }),

        // Grid/Snap/Rulers toggles
        toggleGrid: () => set((state) => ({ gridEnabled: !state.gridEnabled })),
        toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
        toggleRulers: () => set((state) => ({ rulersEnabled: !state.rulersEnabled })),

        // Guides
        addGuide: (guide) => set((state) => ({
            guides: [...state.guides, { id: nanoid(), ...guide }],
        })),
        removeGuide: (id) => set((state) => ({
            guides: state.guides.filter(g => g.id !== id),
        })),
        clearGuides: () => set({ guides: [] }),

        // Bulk operations
        setElements: (elements) => set({ elements, version: get().version + 1 }),
        clearCanvas: () => set({ 
            elements: [], 
            selectedIds: [], 
            version: get().version + 1 
        }),

        // Get helpers
        getElementById: (id) => get().elements.find(el => el.id === id),
        getSelectedElements: () => {
            const { elements, selectedIds } = get();
            return elements.filter(el => selectedIds.includes(el.id));
        },
    }))
);

// Selector hooks for optimization
export const useSelectedElements = () => useCanvasStore(
    (state) => state.elements.filter(el => state.selectedIds.includes(el.id))
);

export const useTool = () => useCanvasStore((state) => state.tool);
export const useZoom = () => useCanvasStore((state) => state.zoom);
export const usePan = () => useCanvasStore((state) => state.pan);
export const useElements = () => useCanvasStore((state) => state.elements);
export const useSelectedIds = () => useCanvasStore((state) => state.selectedIds);
