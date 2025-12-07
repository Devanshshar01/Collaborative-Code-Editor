/**
 * LayerPanel - Full Figma-level Layer Management
 * Tree view, visibility/lock controls, drag reordering, search, multi-select
 */

import React, { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============ Types ============

export interface LayerNode {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  expanded: boolean;
  depth: number;
  parentId: string | null;
  childIds: string[];
  isComponent: boolean;
  isInstance: boolean;
  componentName?: string;
  hasAutoLayout: boolean;
  hasMask: boolean;
  thumbnailUrl?: string;
}

export interface DragState {
  isDragging: boolean;
  draggedIds: string[];
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
}

// ============ Layer Store ============

interface LayerPanelState {
  // Layer data
  layers: Map<string, LayerNode>;
  rootIds: string[];
  
  // Selection
  selectedIds: Set<string>;
  focusedId: string | null;
  lastSelectedId: string | null;
  
  // UI State
  searchQuery: string;
  expandedIds: Set<string>;
  
  // Drag state
  dragState: DragState;
  
  // Actions
  setLayers: (layers: LayerNode[]) => void;
  selectLayer: (id: string, additive: boolean, range: boolean) => void;
  clearSelection: () => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  toggleExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setSearchQuery: (query: string) => void;
  renameLayer: (id: string, newName: string) => void;
  
  // Drag operations
  startDrag: (ids: string[]) => void;
  updateDropTarget: (targetId: string | null, position: 'before' | 'after' | 'inside' | null) => void;
  endDrag: () => { draggedIds: string[]; targetId: string | null; position: string | null };
  cancelDrag: () => void;
  
  // Clipboard
  copyLayers: () => LayerNode[];
  deleteLayers: () => string[];
}

export const useLayerPanelStore = create<LayerPanelState>()(
  subscribeWithSelector((set, get) => ({
    layers: new Map(),
    rootIds: [],
    selectedIds: new Set(),
    focusedId: null,
    lastSelectedId: null,
    searchQuery: '',
    expandedIds: new Set(),
    dragState: {
      isDragging: false,
      draggedIds: [],
      dropTargetId: null,
      dropPosition: null,
    },

    setLayers: (layerList) => {
      const layers = new Map<string, LayerNode>();
      const rootIds: string[] = [];
      const expandedIds = new Set(get().expandedIds);

      for (const layer of layerList) {
        layers.set(layer.id, layer);
        if (!layer.parentId) {
          rootIds.push(layer.id);
        }
        // Auto-expand frames/groups by default
        if (layer.childIds.length > 0 && !expandedIds.has(layer.id)) {
          expandedIds.add(layer.id);
        }
      }

      set({ layers, rootIds, expandedIds });
    },

    selectLayer: (id, additive, range) => {
      set((state) => {
        const newSelection = new Set(additive ? state.selectedIds : []);
        
        if (range && state.lastSelectedId) {
          // Range selection - select all between last and current
          const flatList = getFlatLayerList(state.layers, state.rootIds, state.expandedIds);
          const lastIndex = flatList.findIndex(l => l.id === state.lastSelectedId);
          const currentIndex = flatList.findIndex(l => l.id === id);
          
          if (lastIndex !== -1 && currentIndex !== -1) {
            const start = Math.min(lastIndex, currentIndex);
            const end = Math.max(lastIndex, currentIndex);
            for (let i = start; i <= end; i++) {
              newSelection.add(flatList[i].id);
            }
          }
        } else if (additive && newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
        }

        return {
          selectedIds: newSelection,
          focusedId: id,
          lastSelectedId: id,
        };
      });
    },

    clearSelection: () => set({ selectedIds: new Set(), focusedId: null }),

    toggleVisibility: (id) => {
      set((state) => {
        const layers = new Map(state.layers);
        const layer = layers.get(id);
        if (layer) {
          layers.set(id, { ...layer, visible: !layer.visible });
        }
        return { layers };
      });
    },

    toggleLock: (id) => {
      set((state) => {
        const layers = new Map(state.layers);
        const layer = layers.get(id);
        if (layer) {
          layers.set(id, { ...layer, locked: !layer.locked });
        }
        return { layers };
      });
    },

    toggleExpanded: (id) => {
      set((state) => {
        const expandedIds = new Set(state.expandedIds);
        if (expandedIds.has(id)) {
          expandedIds.delete(id);
        } else {
          expandedIds.add(id);
        }
        return { expandedIds };
      });
    },

    expandAll: () => {
      set((state) => {
        const expandedIds = new Set<string>();
        state.layers.forEach((layer, id) => {
          if (layer.childIds.length > 0) {
            expandedIds.add(id);
          }
        });
        return { expandedIds };
      });
    },

    collapseAll: () => set({ expandedIds: new Set() }),

    setSearchQuery: (query) => set({ searchQuery: query }),

    renameLayer: (id, newName) => {
      set((state) => {
        const layers = new Map(state.layers);
        const layer = layers.get(id);
        if (layer) {
          layers.set(id, { ...layer, name: newName });
        }
        return { layers };
      });
    },

    startDrag: (ids) => {
      set({
        dragState: {
          isDragging: true,
          draggedIds: ids,
          dropTargetId: null,
          dropPosition: null,
        },
      });
    },

    updateDropTarget: (targetId, position) => {
      set((state) => ({
        dragState: {
          ...state.dragState,
          dropTargetId: targetId,
          dropPosition: position,
        },
      }));
    },

    endDrag: () => {
      const { dragState } = get();
      const result = {
        draggedIds: dragState.draggedIds,
        targetId: dragState.dropTargetId,
        position: dragState.dropPosition,
      };
      
      set({
        dragState: {
          isDragging: false,
          draggedIds: [],
          dropTargetId: null,
          dropPosition: null,
        },
      });
      
      return result;
    },

    cancelDrag: () => {
      set({
        dragState: {
          isDragging: false,
          draggedIds: [],
          dropTargetId: null,
          dropPosition: null,
        },
      });
    },

    copyLayers: () => {
      const { selectedIds, layers } = get();
      return Array.from(selectedIds).map(id => layers.get(id)!).filter(Boolean);
    },

    deleteLayers: () => {
      const { selectedIds } = get();
      const ids = Array.from(selectedIds);
      set({ selectedIds: new Set() });
      return ids;
    },
  }))
);

// ============ Helper Functions ============

function getFlatLayerList(
  layers: Map<string, LayerNode>,
  rootIds: string[],
  expandedIds: Set<string>
): LayerNode[] {
  const result: LayerNode[] = [];
  
  function traverse(ids: string[]) {
    for (const id of ids) {
      const layer = layers.get(id);
      if (!layer) continue;
      
      result.push(layer);
      
      if (layer.childIds.length > 0 && expandedIds.has(id)) {
        traverse(layer.childIds);
      }
    }
  }
  
  traverse(rootIds);
  return result;
}

function matchesSearch(layer: LayerNode, query: string): boolean {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  return (
    layer.name.toLowerCase().includes(lowerQuery) ||
    layer.type.toLowerCase().includes(lowerQuery) ||
    (layer.componentName?.toLowerCase().includes(lowerQuery) ?? false)
  );
}

// ============ Icons ============

const Icons = {
  Frame: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2h3v1H3v2H2V2zm9 0h3v3h-1V3h-2V2zM3 11v2h2v1H2v-3h1zm10 0v3h-3v-1h2v-2h1zM4 4h8v8H4V4zm1 1v6h6V5H5z"/>
    </svg>
  ),
  Group: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 3h5v1H2v8h12V4h-4V3h5v10H1V3z"/>
    </svg>
  ),
  Rectangle: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 3h12v10H2V3zm1 1v8h10V4H3z"/>
    </svg>
  ),
  Ellipse: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <ellipse cx="8" cy="8" rx="6" ry="5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  Text: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 3h10v2h-1V4H8.5v8H10v1H6v-1h1.5V4H4v1H3V3z"/>
    </svg>
  ),
  Vector: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 3L8 13l5-10H3zm2.5 1h5L8 10 5.5 4z"/>
    </svg>
  ),
  Component: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1l2.5 2.5L8 6 5.5 3.5 8 1zm-5 5L5.5 8.5 3 11 .5 8.5 3 6zm10 0l2.5 2.5L13 11l-2.5-2.5L13 6zM8 10l2.5 2.5L8 15l-2.5-2.5L8 10z" fill="#9747FF"/>
    </svg>
  ),
  Instance: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2l6 6-6 6-6-6 6-6zm0 1.5L3.5 8 8 12.5 12.5 8 8 3.5z" fill="#9747FF"/>
    </svg>
  ),
  Image: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 3h12v10H2V3zm1 1v6.5l2.5-2.5L8 10.5l2.5-2.5L13 10.5V4H3zm7 2a1 1 0 110 2 1 1 0 010-2z"/>
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M7 3C3.5 3 1 7 1 7s2.5 4 6 4 6-4 6-4-2.5-4-6-4zm0 6.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
    </svg>
  ),
  EyeOff: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M2 2l10 10M7 4c2 0 4.5 2 5.5 3-.3.3-.7.7-1.2 1.1M7 10c-2 0-4.5-2-5.5-3 .3-.3.7-.7 1.2-1.1M5.5 7a1.5 1.5 0 003 0"/>
    </svg>
  ),
  Lock: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M4 5V4a3 3 0 016 0v1h1v6H3V5h1zm1 0h4V4a2 2 0 00-4 0v1z"/>
    </svg>
  ),
  Unlock: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M10 4a3 3 0 00-6 0v1H3v6h8V5h-1V4zm-1 1H5V4a2 2 0 014 0v1z"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M4.5 2l4 4-4 4"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M2 4.5l4 4 4-4"/>
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M10 6a4 4 0 11-8 0 4 4 0 018 0zm-1.5 3.5L12 13"/>
    </svg>
  ),
  AutoLayout: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M1 2h4v3H1V2zm6 0h4v3H7V2zM1 7h4v3H1V7zm6 0h4v3H7V7z"/>
    </svg>
  ),
  Mask: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeDasharray="2 1"/>
    </svg>
  ),
};

function getNodeIcon(type: string, isComponent: boolean, isInstance: boolean) {
  if (isComponent) return Icons.Component;
  if (isInstance) return Icons.Instance;
  
  switch (type) {
    case 'FRAME': return Icons.Frame;
    case 'GROUP': return Icons.Group;
    case 'RECTANGLE': return Icons.Rectangle;
    case 'ELLIPSE': return Icons.Ellipse;
    case 'TEXT': return Icons.Text;
    case 'VECTOR': return Icons.Vector;
    case 'IMAGE': return Icons.Image;
    default: return Icons.Rectangle;
  }
}

// ============ Layer Row Component ============

interface LayerRowProps {
  layer: LayerNode;
  isSelected: boolean;
  isFocused: boolean;
  isDropTarget: boolean;
  dropPosition: 'before' | 'after' | 'inside' | null;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onToggleExpand: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDragStart: (id: string, e: React.DragEvent) => void;
  onDragOver: (id: string, e: React.DragEvent) => void;
  onDragLeave: (id: string) => void;
  onDrop: (id: string, e: React.DragEvent) => void;
  onDoubleClick: (id: string) => void;
}

const LayerRow = memo<LayerRowProps>(({
  layer,
  isSelected,
  isFocused,
  isDropTarget,
  dropPosition,
  onSelect,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
  onRename,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDoubleClick,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(layer.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const NodeIcon = getNodeIcon(layer.type, layer.isComponent, layer.isInstance);
  const hasChildren = layer.childIds.length > 0;
  const expanded = useLayerPanelStore(state => state.expandedIds.has(layer.id));

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartRename = useCallback(() => {
    setEditValue(layer.name);
    setIsEditing(true);
  }, [layer.name]);

  const handleFinishRename = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== layer.name) {
      onRename(layer.id, editValue.trim());
    }
  }, [editValue, layer.id, layer.name, onRename]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(layer.name);
    }
  }, [handleFinishRename, layer.name]);

  const handleDoubleClickInternal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick(layer.id);
    handleStartRename();
  }, [layer.id, onDoubleClick, handleStartRename]);

  const dropIndicatorClass = isDropTarget
    ? dropPosition === 'before'
      ? 'layer-row--drop-before'
      : dropPosition === 'after'
      ? 'layer-row--drop-after'
      : 'layer-row--drop-inside'
    : '';

  return (
    <div
      ref={rowRef}
      className={`layer-row ${isSelected ? 'layer-row--selected' : ''} ${isFocused ? 'layer-row--focused' : ''} ${dropIndicatorClass}`}
      style={{
        paddingLeft: `${8 + layer.depth * 16}px`,
        opacity: layer.visible ? 1 : 0.5,
      }}
      onClick={(e) => onSelect(layer.id, e)}
      onDoubleClick={handleDoubleClickInternal}
      draggable={!isEditing && !layer.locked}
      onDragStart={(e) => onDragStart(layer.id, e)}
      onDragOver={(e) => onDragOver(layer.id, e)}
      onDragLeave={() => onDragLeave(layer.id)}
      onDrop={(e) => onDrop(layer.id, e)}
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-level={layer.depth + 1}
      tabIndex={isFocused ? 0 : -1}
    >
      {/* Expand/Collapse */}
      <button
        className="layer-row__expand"
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) onToggleExpand(layer.id);
        }}
        style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
        aria-label={expanded ? 'Collapse' : 'Expand'}
      >
        {expanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
      </button>

      {/* Icon */}
      <span className="layer-row__icon">
        <NodeIcon />
      </span>

      {/* Badges */}
      {layer.hasAutoLayout && (
        <span className="layer-row__badge layer-row__badge--auto-layout" title="Auto Layout">
          <Icons.AutoLayout />
        </span>
      )}
      {layer.hasMask && (
        <span className="layer-row__badge layer-row__badge--mask" title="Mask">
          <Icons.Mask />
        </span>
      )}

      {/* Name */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="layer-row__input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleFinishRename}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="layer-row__name" title={layer.name}>
          {layer.name}
        </span>
      )}

      {/* Component tag */}
      {layer.isInstance && layer.componentName && (
        <span className="layer-row__component-tag" title={`Instance of ${layer.componentName}`}>
          ◇
        </span>
      )}

      {/* Actions */}
      <div className="layer-row__actions">
        <button
          className="layer-row__action"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock(layer.id);
          }}
          title={layer.locked ? 'Unlock' : 'Lock'}
        >
          {layer.locked ? <Icons.Lock /> : <Icons.Unlock />}
        </button>
        <button
          className="layer-row__action"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(layer.id);
          }}
          title={layer.visible ? 'Hide' : 'Show'}
        >
          {layer.visible ? <Icons.Eye /> : <Icons.EyeOff />}
        </button>
      </div>
    </div>
  );
});

LayerRow.displayName = 'LayerRow';

// ============ Main Layer Panel ============

export interface LayerPanelProps {
  className?: string;
  onSelectionChange?: (selectedIds: string[]) => void;
  onLayerReorder?: (draggedIds: string[], targetId: string, position: string) => void;
  onLayerVisibilityChange?: (id: string, visible: boolean) => void;
  onLayerLockChange?: (id: string, locked: boolean) => void;
  onLayerRename?: (id: string, name: string) => void;
  onLayerDelete?: (ids: string[]) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = memo(({
  className = '',
  onSelectionChange,
  onLayerReorder,
  onLayerVisibilityChange,
  onLayerLockChange,
  onLayerRename,
  onLayerDelete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  const {
    layers,
    rootIds,
    selectedIds,
    focusedId,
    searchQuery,
    expandedIds,
    dragState,
    selectLayer,
    clearSelection,
    toggleVisibility,
    toggleLock,
    toggleExpanded,
    expandAll,
    collapseAll,
    setSearchQuery,
    renameLayer,
    startDrag,
    updateDropTarget,
    endDrag,
    cancelDrag,
    deleteLayers,
  } = useLayerPanelStore();

  // Flat list of visible layers
  const visibleLayers = useMemo(() => {
    const allLayers = getFlatLayerList(layers, rootIds, expandedIds);
    if (!searchQuery) return allLayers;
    
    // Filter by search, but also include parents of matching layers
    const matchingIds = new Set<string>();
    
    for (const layer of allLayers) {
      if (matchesSearch(layer, searchQuery)) {
        matchingIds.add(layer.id);
        // Add all ancestors
        let parentId = layer.parentId;
        while (parentId) {
          matchingIds.add(parentId);
          const parent = layers.get(parentId);
          parentId = parent?.parentId ?? null;
        }
      }
    }
    
    return allLayers.filter(l => matchingIds.has(l.id));
  }, [layers, rootIds, expandedIds, searchQuery]);

  // Handle selection changes
  useEffect(() => {
    onSelectionChange?.(Array.from(selectedIds));
  }, [selectedIds, onSelectionChange]);

  // Select handler with modifiers
  const handleSelect = useCallback((id: string, e: React.MouseEvent) => {
    selectLayer(id, e.metaKey || e.ctrlKey, e.shiftKey);
  }, [selectLayer]);

  // Rename handler
  const handleRename = useCallback((id: string, name: string) => {
    renameLayer(id, name);
    onLayerRename?.(id, name);
  }, [renameLayer, onLayerRename]);

  // Visibility handler
  const handleToggleVisibility = useCallback((id: string) => {
    const layer = layers.get(id);
    if (layer) {
      toggleVisibility(id);
      onLayerVisibilityChange?.(id, !layer.visible);
    }
  }, [layers, toggleVisibility, onLayerVisibilityChange]);

  // Lock handler
  const handleToggleLock = useCallback((id: string) => {
    const layer = layers.get(id);
    if (layer) {
      toggleLock(id);
      onLayerLockChange?.(id, !layer.locked);
    }
  }, [layers, toggleLock, onLayerLockChange]);

  // Drag and drop handlers
  const handleDragStart = useCallback((id: string, e: React.DragEvent) => {
    const ids = selectedIds.has(id) ? Array.from(selectedIds) : [id];
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-layer-ids', JSON.stringify(ids));
    
    // Create drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'layer-drag-preview';
    dragImage.textContent = ids.length === 1 
      ? layers.get(ids[0])?.name || 'Layer'
      : `${ids.length} layers`;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => dragImage.remove(), 0);
    
    startDrag(ids);
  }, [selectedIds, layers, startDrag]);

  const handleDragOver = useCallback((id: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Don't allow dropping on dragged items
    if (dragState.draggedIds.includes(id)) {
      updateDropTarget(null, null);
      return;
    }
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    const layer = layers.get(id);
    const canHaveChildren = layer?.type === 'FRAME' || layer?.type === 'GROUP' || layer?.type === 'COMPONENT';
    
    let position: 'before' | 'after' | 'inside';
    if (y < height * 0.25) {
      position = 'before';
    } else if (y > height * 0.75) {
      position = 'after';
    } else if (canHaveChildren) {
      position = 'inside';
    } else if (y < height * 0.5) {
      position = 'before';
    } else {
      position = 'after';
    }
    
    updateDropTarget(id, position);
  }, [dragState.draggedIds, layers, updateDropTarget]);

  const handleDragLeave = useCallback((id: string) => {
    if (dragState.dropTargetId === id) {
      updateDropTarget(null, null);
    }
  }, [dragState.dropTargetId, updateDropTarget]);

  const handleDrop = useCallback((id: string, e: React.DragEvent) => {
    e.preventDefault();
    
    const result = endDrag();
    if (result.targetId && result.position && result.draggedIds.length > 0) {
      onLayerReorder?.(result.draggedIds, result.targetId, result.position);
    }
  }, [endDrag, onLayerReorder]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!focusedId) return;
    
    const currentIndex = visibleLayers.findIndex(l => l.id === focusedId);
    if (currentIndex === -1) return;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          selectLayer(visibleLayers[currentIndex - 1].id, e.shiftKey, false);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < visibleLayers.length - 1) {
          selectLayer(visibleLayers[currentIndex + 1].id, e.shiftKey, false);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        const layer = layers.get(focusedId);
        if (layer?.childIds.length && !expandedIds.has(focusedId)) {
          toggleExpanded(focusedId);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (expandedIds.has(focusedId)) {
          toggleExpanded(focusedId);
        } else {
          const layer = layers.get(focusedId);
          if (layer?.parentId) {
            selectLayer(layer.parentId, false, false);
          }
        }
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        const deleted = deleteLayers();
        onLayerDelete?.(deleted);
        break;
      case 'Escape':
        clearSelection();
        cancelDrag();
        break;
    }
  }, [focusedId, visibleLayers, layers, expandedIds, selectLayer, toggleExpanded, deleteLayers, clearSelection, cancelDrag, onLayerDelete]);

  // Context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuPos(null);
  }, []);

  // Double click to focus in canvas
  const handleDoubleClick = useCallback((id: string) => {
    // This would trigger focusing the layer in the canvas
    // Implementation depends on canvas integration
  }, []);

  return (
    <div
      ref={containerRef}
      className={`layer-panel ${className}`}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
      onClick={() => closeContextMenu()}
    >
      {/* Header */}
      <div className="layer-panel__header">
        <h3 className="layer-panel__title">Layers</h3>
        <div className="layer-panel__header-actions">
          <button
            className="layer-panel__action-btn"
            onClick={collapseAll}
            title="Collapse All"
          >
            ⊟
          </button>
          <button
            className="layer-panel__action-btn"
            onClick={expandAll}
            title="Expand All"
          >
            ⊞
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="layer-panel__search">
        <Icons.Search />
        <input
          type="text"
          placeholder="Search layers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="layer-panel__search-input"
        />
        {searchQuery && (
          <button
            className="layer-panel__search-clear"
            onClick={() => setSearchQuery('')}
          >
            ×
          </button>
        )}
      </div>

      {/* Layer List */}
      <div 
        className="layer-panel__list"
        role="tree"
        aria-label="Layer tree"
      >
        {visibleLayers.length === 0 ? (
          <div className="layer-panel__empty">
            {searchQuery ? 'No layers match your search' : 'No layers yet'}
          </div>
        ) : (
          visibleLayers.map((layer) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              isSelected={selectedIds.has(layer.id)}
              isFocused={focusedId === layer.id}
              isDropTarget={dragState.dropTargetId === layer.id}
              dropPosition={dragState.dropTargetId === layer.id ? dragState.dropPosition : null}
              onSelect={handleSelect}
              onToggleExpand={toggleExpanded}
              onToggleVisibility={handleToggleVisibility}
              onToggleLock={handleToggleLock}
              onRename={handleRename}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDoubleClick={handleDoubleClick}
            />
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenuPos && (
        <LayerContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          selectedCount={selectedIds.size}
          onClose={closeContextMenu}
          onDelete={() => {
            const deleted = deleteLayers();
            onLayerDelete?.(deleted);
            closeContextMenu();
          }}
          onDuplicate={() => {
            // Implement duplicate
            closeContextMenu();
          }}
          onGroup={() => {
            // Implement group
            closeContextMenu();
          }}
          onUngroup={() => {
            // Implement ungroup
            closeContextMenu();
          }}
          onBringToFront={() => {
            // Implement bring to front
            closeContextMenu();
          }}
          onSendToBack={() => {
            // Implement send to back
            closeContextMenu();
          }}
        />
      )}
    </div>
  );
});

LayerPanel.displayName = 'LayerPanel';

// ============ Context Menu ============

interface LayerContextMenuProps {
  x: number;
  y: number;
  selectedCount: number;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

const LayerContextMenu: React.FC<LayerContextMenuProps> = ({
  x,
  y,
  selectedCount,
  onClose,
  onDelete,
  onDuplicate,
  onGroup,
  onUngroup,
  onBringToFront,
  onSendToBack,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (selectedCount === 0) return null;

  return (
    <div
      ref={menuRef}
      className="layer-context-menu"
      style={{ left: x, top: y }}
    >
      <button className="layer-context-menu__item" onClick={onDuplicate}>
        Duplicate
        <span className="layer-context-menu__shortcut">⌘D</span>
      </button>
      <button className="layer-context-menu__item" onClick={onDelete}>
        Delete
        <span className="layer-context-menu__shortcut">⌫</span>
      </button>
      <div className="layer-context-menu__divider" />
      {selectedCount > 1 && (
        <button className="layer-context-menu__item" onClick={onGroup}>
          Group Selection
          <span className="layer-context-menu__shortcut">⌘G</span>
        </button>
      )}
      <button className="layer-context-menu__item" onClick={onUngroup}>
        Ungroup
        <span className="layer-context-menu__shortcut">⇧⌘G</span>
      </button>
      <div className="layer-context-menu__divider" />
      <button className="layer-context-menu__item" onClick={onBringToFront}>
        Bring to Front
        <span className="layer-context-menu__shortcut">⌘]</span>
      </button>
      <button className="layer-context-menu__item" onClick={onSendToBack}>
        Send to Back
        <span className="layer-context-menu__shortcut">⌘[</span>
      </button>
    </div>
  );
};

// ============ Styles ============

export const layerPanelStyles = `
.layer-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary, #1e1e1e);
  color: var(--text-primary, #ffffff);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  user-select: none;
}

.layer-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--border-color, #333);
}

.layer-panel__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.layer-panel__header-actions {
  display: flex;
  gap: 4px;
}

.layer-panel__action-btn {
  background: none;
  border: none;
  color: var(--text-secondary, #888);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  font-size: 14px;
}

.layer-panel__action-btn:hover {
  background: var(--bg-hover, #333);
  color: var(--text-primary, #fff);
}

.layer-panel__search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color, #333);
}

.layer-panel__search svg {
  color: var(--text-secondary, #888);
  flex-shrink: 0;
}

.layer-panel__search-input {
  flex: 1;
  background: none;
  border: none;
  color: var(--text-primary, #fff);
  font-size: 12px;
  outline: none;
}

.layer-panel__search-input::placeholder {
  color: var(--text-secondary, #888);
}

.layer-panel__search-clear {
  background: none;
  border: none;
  color: var(--text-secondary, #888);
  cursor: pointer;
  padding: 2px 6px;
  font-size: 14px;
}

.layer-panel__list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.layer-panel__empty {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary, #888);
}

.layer-row {
  display: flex;
  align-items: center;
  height: 28px;
  padding-right: 8px;
  cursor: pointer;
  position: relative;
}

.layer-row:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.05));
}

.layer-row--selected {
  background: var(--bg-selected, rgba(59, 130, 246, 0.3)) !important;
}

.layer-row--focused {
  outline: 1px solid var(--focus-color, #3b82f6);
  outline-offset: -1px;
}

.layer-row--drop-before::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--drop-color, #3b82f6);
}

.layer-row--drop-after::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--drop-color, #3b82f6);
}

.layer-row--drop-inside {
  background: var(--drop-bg, rgba(59, 130, 246, 0.2)) !important;
  outline: 1px dashed var(--drop-color, #3b82f6);
}

.layer-row__expand {
  background: none;
  border: none;
  color: var(--text-secondary, #888);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.layer-row__expand:hover {
  color: var(--text-primary, #fff);
}

.layer-row__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  color: var(--text-secondary, #888);
  flex-shrink: 0;
}

.layer-row__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  margin-right: 4px;
  color: var(--text-tertiary, #666);
}

.layer-row__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-row__input {
  flex: 1;
  background: var(--input-bg, #2a2a2a);
  border: 1px solid var(--focus-color, #3b82f6);
  color: var(--text-primary, #fff);
  padding: 2px 4px;
  font-size: 12px;
  border-radius: 2px;
  outline: none;
}

.layer-row__component-tag {
  color: #9747ff;
  margin-left: 4px;
  font-size: 10px;
}

.layer-row__actions {
  display: none;
  gap: 2px;
  margin-left: auto;
}

.layer-row:hover .layer-row__actions {
  display: flex;
}

.layer-row__action {
  background: none;
  border: none;
  color: var(--text-secondary, #888);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

.layer-row__action:hover {
  background: var(--bg-hover, #333);
  color: var(--text-primary, #fff);
}

.layer-drag-preview {
  position: absolute;
  top: -1000px;
  left: -1000px;
  padding: 4px 8px;
  background: var(--bg-selected, #3b82f6);
  color: white;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
}

.layer-context-menu {
  position: fixed;
  min-width: 180px;
  background: var(--menu-bg, #2a2a2a);
  border: 1px solid var(--border-color, #444);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 4px 0;
  z-index: 1000;
}

.layer-context-menu__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  color: var(--text-primary, #fff);
  cursor: pointer;
  text-align: left;
  font-size: 12px;
}

.layer-context-menu__item:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
}

.layer-context-menu__shortcut {
  color: var(--text-secondary, #888);
  font-size: 11px;
}

.layer-context-menu__divider {
  height: 1px;
  background: var(--border-color, #444);
  margin: 4px 0;
}
`;

export default LayerPanel;
