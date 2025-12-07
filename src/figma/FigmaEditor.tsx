/**
 * FigmaEditor - Main Figma-level Design Editor Integration
 * Brings together all components: Toolbar, LayerPanel, PropertyPanel, TimelinePanel, Canvas
 */

import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Core systems
import { SceneGraph, BaseNode, FrameNode, RectangleNode, TextNode } from '../core/SceneGraph';
import { ComponentSystem } from '../core/ComponentSystem';
import { VectorEngine } from '../core/VectorEngine';
import { LayoutEngine } from '../core/AutoLayout';
import { AnimationTimeline } from '../core/AnimationTimeline';
import { CollaborationManager } from '../core/CollaborationSystem';
import { PluginManager } from '../core/PluginAPI';
import { ExportManager } from '../core/ExportSystem';
import { PrototypingEngine } from '../core/PrototypingEngine';
import { CanvasRenderer } from '../core/CanvasRenderer';

// UI Components
import { Toolbar, ToolType } from './Toolbar';
import { LayerPanel, LayerNode } from './LayerPanel';
import { PropertyPanel, PropertyPanelNode } from './PropertyPanel';
import { TimelinePanel, AnimationLayer } from './TimelinePanel';
import { DevModePanel } from './DevModePanel';

// ============ Types ============

export interface EditorState {
  // Core systems
  sceneGraph: SceneGraph;
  componentSystem: ComponentSystem;
  vectorEngine: VectorEngine;
  layoutEngine: LayoutEngine;
  animationTimeline: AnimationTimeline;
  collaborationManager: CollaborationManager | null;
  pluginManager: PluginManager;
  exportManager: ExportManager;
  prototypingEngine: PrototypingEngine;
  canvasRenderer: CanvasRenderer;
  
  // UI State
  activeTool: ToolType;
  selectedNodeIds: string[];
  zoom: number;
  panX: number;
  panY: number;
  canUndo: boolean;
  canRedo: boolean;
  
  // Panel visibility
  showLayers: boolean;
  showProperties: boolean;
  showTimeline: boolean;
  showDevMode: boolean;
  
  // Mode
  mode: 'design' | 'prototype' | 'dev';
  
  // Actions
  setActiveTool: (tool: ToolType) => void;
  setSelectedNodes: (ids: string[]) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  togglePanel: (panel: 'layers' | 'properties' | 'timeline' | 'devMode') => void;
  setMode: (mode: 'design' | 'prototype' | 'dev') => void;
  
  // Node operations
  createNode: (type: string, props: any) => string;
  updateNode: (id: string, updates: any) => void;
  deleteNodes: (ids: string[]) => void;
  duplicateNodes: (ids: string[]) => string[];
  
  // History
  undo: () => void;
  redo: () => void;
  
  // Collaboration
  initCollaboration: (roomId: string, userId: string) => void;
  
  // Export
  exportSelection: (format: string) => Promise<void>;
}

// ============ Editor Store ============

export const useEditorStore = create<EditorState>()(
  subscribeWithSelector((set, get) => {
    // Initialize core systems
    const sceneGraph = new SceneGraph();
    const componentSystem = new ComponentSystem(sceneGraph);
    const vectorEngine = new VectorEngine();
    const layoutEngine = new LayoutEngine(sceneGraph);
    const animationTimeline = new AnimationTimeline(sceneGraph);
    const pluginManager = new PluginManager(sceneGraph);
    const exportManager = new ExportManager(sceneGraph);
    const prototypingEngine = new PrototypingEngine(sceneGraph);
    const canvasRenderer = new CanvasRenderer(sceneGraph);
    
    return {
      // Core systems
      sceneGraph,
      componentSystem,
      vectorEngine,
      layoutEngine,
      animationTimeline,
      collaborationManager: null,
      pluginManager,
      exportManager,
      prototypingEngine,
      canvasRenderer,
      
      // UI State
      activeTool: 'select',
      selectedNodeIds: [],
      zoom: 1,
      panX: 0,
      panY: 0,
      canUndo: false,
      canRedo: false,
      
      // Panel visibility
      showLayers: true,
      showProperties: true,
      showTimeline: false,
      showDevMode: false,
      
      // Mode
      mode: 'design',
      
      // Actions
      setActiveTool: (tool) => set({ activeTool: tool }),
      
      setSelectedNodes: (ids) => set({ selectedNodeIds: ids }),
      
      setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(zoom, 64)) }),
      
      setPan: (x, y) => set({ panX: x, panY: y }),
      
      togglePanel: (panel) => {
        set((state) => {
          switch (panel) {
            case 'layers': return { showLayers: !state.showLayers };
            case 'properties': return { showProperties: !state.showProperties };
            case 'timeline': return { showTimeline: !state.showTimeline };
            case 'devMode': return { showDevMode: !state.showDevMode };
            default: return state;
          }
        });
      },
      
      setMode: (mode) => set({ mode }),
      
      createNode: (type, props) => {
        const { sceneGraph } = get();
        const node = sceneGraph.createNode(type as any, props);
        return node.id;
      },
      
      updateNode: (id, updates) => {
        const { sceneGraph } = get();
        const node = sceneGraph.findNode(id);
        if (node) {
          Object.assign(node, updates);
        }
      },
      
      deleteNodes: (ids) => {
        const { sceneGraph } = get();
        ids.forEach(id => sceneGraph.deleteNode(id));
        set({ selectedNodeIds: [] });
      },
      
      duplicateNodes: (ids) => {
        const { sceneGraph } = get();
        const newIds: string[] = [];
        ids.forEach(id => {
          const node = sceneGraph.findNode(id);
          if (node) {
            const clone = sceneGraph.cloneNode(node);
            newIds.push(clone.id);
          }
        });
        return newIds;
      },
      
      undo: () => {
        // History system would be implemented here
        console.log('Undo');
      },
      
      redo: () => {
        // History system would be implemented here
        console.log('Redo');
      },
      
      initCollaboration: (roomId, userId) => {
        const { sceneGraph } = get();
        const collabManager = new CollaborationManager(sceneGraph, roomId, userId);
        set({ collaborationManager: collabManager });
      },
      
      exportSelection: async (format) => {
        const { exportManager, selectedNodeIds, sceneGraph } = get();
        const nodes = selectedNodeIds.map(id => sceneGraph.findNode(id)).filter(Boolean) as BaseNode[];
        
        if (nodes.length === 0) return;
        
        const exportConfig: any = {
          format: format as any,
          scale: 1,
          quality: 1,
        };
        
        for (const node of nodes) {
          await exportManager.exportNode(node, exportConfig);
        }
      },
    };
  })
);

// ============ Canvas View ============

interface CanvasViewProps {
  zoom: number;
  panX: number;
  panY: number;
  activeTool: ToolType;
  selectedNodeIds: string[];
  sceneGraph: SceneGraph;
  canvasRenderer: CanvasRenderer;
  onSelectionChange: (ids: string[]) => void;
  onZoomChange: (zoom: number) => void;
  onPanChange: (x: number, y: number) => void;
  onNodeCreate: (type: string, props: any) => void;
}

const CanvasView = memo<CanvasViewProps>(({
  zoom,
  panX,
  panY,
  activeTool,
  selectedNodeIds,
  sceneGraph,
  canvasRenderer,
  onSelectionChange,
  onZoomChange,
  onPanChange,
  onNodeCreate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);

  // Initialize renderer
  useEffect(() => {
    if (canvasRef.current) {
      canvasRenderer.initialize(canvasRef.current);
      canvasRenderer.startRenderLoop();
      
      return () => {
        canvasRenderer.stopRenderLoop();
      };
    }
  }, [canvasRenderer]);

  // Update viewport
  useEffect(() => {
    canvasRenderer.setViewport(panX, panY, zoom);
  }, [panX, panY, zoom, canvasRenderer]);

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const canvasX = (e.clientX - rect.left - panX) / zoom;
    const canvasY = (e.clientY - rect.top - panY) / zoom;
    
    if (activeTool === 'hand' || e.button === 1 || (e.button === 0 && e.spaceKey)) {
      setIsPanning(true);
      setDrawStart({ x: e.clientX, y: e.clientY });
    } else if (activeTool === 'select') {
      // Hit test
      const hitNode = canvasRenderer.hitTest(canvasX, canvasY);
      if (hitNode) {
        if (e.shiftKey) {
          const newSelection = selectedNodeIds.includes(hitNode.id)
            ? selectedNodeIds.filter(id => id !== hitNode.id)
            : [...selectedNodeIds, hitNode.id];
          onSelectionChange(newSelection);
        } else {
          onSelectionChange([hitNode.id]);
        }
      } else {
        onSelectionChange([]);
      }
    } else if (['rectangle', 'ellipse', 'frame', 'text'].includes(activeTool)) {
      setIsDrawing(true);
      setDrawStart({ x: canvasX, y: canvasY });
    }
  }, [activeTool, selectedNodeIds, zoom, panX, panY, canvasRenderer, onSelectionChange]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && drawStart) {
      const dx = e.clientX - drawStart.x;
      const dy = e.clientY - drawStart.y;
      onPanChange(panX + dx, panY + dy);
      setDrawStart({ x: e.clientX, y: e.clientY });
    } else if (isDrawing && drawStart) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const canvasX = (e.clientX - rect.left - panX) / zoom;
      const canvasY = (e.clientY - rect.top - panY) / zoom;
      
      // Preview drawing (would be implemented with temp overlay)
      console.log('Drawing from', drawStart, 'to', { x: canvasX, y: canvasY });
    }
  }, [isPanning, isDrawing, drawStart, panX, panY, zoom, onPanChange]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isDrawing && drawStart) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const canvasX = (e.clientX - rect.left - panX) / zoom;
      const canvasY = (e.clientY - rect.top - panY) / zoom;
      
      const width = Math.abs(canvasX - drawStart.x);
      const height = Math.abs(canvasY - drawStart.y);
      const x = Math.min(drawStart.x, canvasX);
      const y = Math.min(drawStart.y, canvasY);
      
      if (width > 5 && height > 5) {
        onNodeCreate(activeTool, {
          name: activeTool.charAt(0).toUpperCase() + activeTool.slice(1),
          x, y, width, height,
        });
      }
    }
    
    setIsPanning(false);
    setIsDrawing(false);
    setDrawStart(null);
  }, [isDrawing, drawStart, panX, panY, zoom, activeTool, onNodeCreate]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      onZoomChange(zoom * delta);
    } else {
      // Pan
      onPanChange(panX - e.deltaX, panY - e.deltaY);
    }
  }, [zoom, panX, panY, onZoomChange, onPanChange]);

  return (
    <div
      ref={containerRef}
      className="canvas-view"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : activeTool === 'hand' ? 'grab' : 'default' }}
    >
      <canvas
        ref={canvasRef}
        className="canvas-view__canvas"
        width={1920}
        height={1080}
      />
      
      {/* Grid overlay */}
      <div className="canvas-view__grid" />
      
      {/* Selection overlay */}
      {selectedNodeIds.length > 0 && (
        <div className="canvas-view__selection">
          {/* Selection handles would be rendered here */}
        </div>
      )}
    </div>
  );
});

CanvasView.displayName = 'CanvasView';

// ============ Main Figma Editor ============

export interface FigmaEditorProps {
  roomId?: string;
  userId?: string;
  initialDocument?: any;
  onSave?: (document: any) => void;
  className?: string;
}

export const FigmaEditor: React.FC<FigmaEditorProps> = memo(({
  roomId,
  userId,
  initialDocument,
  onSave,
  className = '',
}) => {
  const {
    sceneGraph,
    canvasRenderer,
    activeTool,
    selectedNodeIds,
    zoom,
    panX,
    panY,
    canUndo,
    canRedo,
    showLayers,
    showProperties,
    showTimeline,
    showDevMode,
    mode,
    setActiveTool,
    setSelectedNodes,
    setZoom,
    setPan,
    togglePanel,
    setMode,
    createNode,
    updateNode,
    deleteNodes,
    undo,
    redo,
    initCollaboration,
    exportSelection,
  } = useEditorStore();

  // Initialize collaboration if roomId provided
  useEffect(() => {
    if (roomId && userId) {
      initCollaboration(roomId, userId);
    }
  }, [roomId, userId, initCollaboration]);

  // Convert scene graph to layer panel format
  const layerPanelNodes: LayerNode[] = useMemo(() => {
    const convertNode = (node: BaseNode, depth: number): LayerNode => ({
      id: node.id,
      name: node.name,
      type: node.type,
      visible: node.visible,
      locked: node.locked,
      expanded: true,
      depth,
      parentId: node.parentId,
      childIds: node.childIds,
      isComponent: false,
      isInstance: false,
      hasAutoLayout: false,
      hasMask: false,
    });
    
    const result: LayerNode[] = [];
    const rootNode = sceneGraph.getRoot();
    
    const traverse = (node: BaseNode, depth: number) => {
      result.push(convertNode(node, depth));
      node.childIds.forEach(childId => {
        const child = sceneGraph.findNode(childId);
        if (child) traverse(child, depth + 1);
      });
    };
    
    if (rootNode) traverse(rootNode, 0);
    return result;
  }, [sceneGraph]);

  // Convert selected nodes to property panel format
  const propertyPanelNodes: PropertyPanelNode[] = useMemo(() => {
    return selectedNodeIds.map(id => {
      const node = sceneGraph.findNode(id);
      if (!node) return null;
      
      return {
        id: node.id,
        name: node.name,
        type: node.type,
        x: node.x || 0,
        y: node.y || 0,
        width: node.width || 0,
        height: node.height || 0,
        rotation: node.rotation || 0,
        fills: [],
        strokes: [],
        effects: [],
        opacity: node.opacity || 1,
        blendMode: node.blendMode || 'NORMAL',
      } as PropertyPanelNode;
    }).filter(Boolean) as PropertyPanelNode[];
  }, [selectedNodeIds, sceneGraph]);

  // Animation layers (mock for now)
  const animationLayers: AnimationLayer[] = useMemo(() => {
    return selectedNodeIds.map(id => {
      const node = sceneGraph.findNode(id);
      if (!node) return null;
      
      return {
        id: node.id,
        nodeId: node.id,
        nodeName: node.name,
        tracks: [],
        expanded: true,
      } as AnimationLayer;
    }).filter(Boolean) as AnimationLayer[];
  }, [selectedNodeIds, sceneGraph]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (isMod && e.key === 's') {
        e.preventDefault();
        onSave?.(sceneGraph.serialize());
      } else if (isMod && e.key === 'd') {
        e.preventDefault();
        // Duplicate
      } else if (isMod && e.key === 'g') {
        e.preventDefault();
        // Group
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.length > 0) {
          e.preventDefault();
          deleteNodes(selectedNodeIds);
        }
      } else if (isMod && e.key === 'a') {
        e.preventDefault();
        // Select all
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, undo, redo, deleteNodes, onSave, sceneGraph]);

  const handleZoomIn = () => setZoom(zoom * 1.2);
  const handleZoomOut = () => setZoom(zoom / 1.2);
  const handleZoomFit = () => {
    setZoom(1);
    setPan(0, 0);
  };

  return (
    <div className={`figma-editor figma-editor--${mode} ${className}`}>
      {/* Top Toolbar */}
      <div className="figma-editor__toolbar">
        <Toolbar
          zoom={zoom}
          canUndo={canUndo}
          canRedo={canRedo}
          onZoomChange={setZoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomFit={handleZoomFit}
          onUndo={undo}
          onRedo={redo}
          onToolChange={setActiveTool}
        />
      </div>

      {/* Main Content */}
      <div className="figma-editor__content">
        {/* Left Sidebar - Layers */}
        {showLayers && (
          <div className="figma-editor__panel figma-editor__panel--left">
            <LayerPanel
              onSelectionChange={setSelectedNodes}
              onLayerReorder={(draggedIds, targetId, position) => {
                console.log('Reorder:', draggedIds, targetId, position);
              }}
              onLayerVisibilityChange={(id, visible) => {
                updateNode(id, { visible });
              }}
              onLayerLockChange={(id, locked) => {
                updateNode(id, { locked });
              }}
              onLayerRename={(id, name) => {
                updateNode(id, { name });
              }}
              onLayerDelete={deleteNodes}
            />
          </div>
        )}

        {/* Canvas */}
        <div className="figma-editor__canvas-container">
          <CanvasView
            zoom={zoom}
            panX={panX}
            panY={panY}
            activeTool={activeTool}
            selectedNodeIds={selectedNodeIds}
            sceneGraph={sceneGraph}
            canvasRenderer={canvasRenderer}
            onSelectionChange={setSelectedNodes}
            onZoomChange={setZoom}
            onPanChange={setPan}
            onNodeCreate={(type, props) => {
              const id = createNode(type, props);
              setSelectedNodes([id]);
            }}
          />
        </div>

        {/* Right Sidebar - Properties / Dev Mode */}
        {(showProperties || showDevMode) && (
          <div className="figma-editor__panel figma-editor__panel--right">
            {mode === 'dev' || showDevMode ? (
              <DevModePanel
                selectedNodes={propertyPanelNodes}
                onExport={(format) => exportSelection(format)}
              />
            ) : (
              <PropertyPanel
                nodes={propertyPanelNodes}
                onPropertyChange={(nodeId, property, value) => {
                  updateNode(nodeId, { [property]: value });
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom Panel - Timeline */}
      {showTimeline && (
        <div className="figma-editor__panel figma-editor__panel--bottom">
          <TimelinePanel
            layers={animationLayers}
            onKeyframeAdd={(trackId, keyframe) => {
              console.log('Add keyframe:', trackId, keyframe);
            }}
            onKeyframeRemove={(keyframeId) => {
              console.log('Remove keyframe:', keyframeId);
            }}
            onKeyframeUpdate={(keyframeId, updates) => {
              console.log('Update keyframe:', keyframeId, updates);
            }}
          />
        </div>
      )}

      {/* Mode Tabs */}
      <div className="figma-editor__mode-tabs">
        <button
          className={`figma-editor__mode-tab ${mode === 'design' ? 'figma-editor__mode-tab--active' : ''}`}
          onClick={() => setMode('design')}
        >
          Design
        </button>
        <button
          className={`figma-editor__mode-tab ${mode === 'prototype' ? 'figma-editor__mode-tab--active' : ''}`}
          onClick={() => setMode('prototype')}
        >
          Prototype
        </button>
        <button
          className={`figma-editor__mode-tab ${mode === 'dev' ? 'figma-editor__mode-tab--active' : ''}`}
          onClick={() => setMode('dev')}
        >
          Dev Mode
        </button>
      </div>
    </div>
  );
});

FigmaEditor.displayName = 'FigmaEditor';

// ============ Styles ============

export const figmaEditorStyles = `
.figma-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: var(--bg-primary, #1a1a1a);
  color: var(--text-primary, #ffffff);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

.figma-editor__toolbar {
  flex-shrink: 0;
  z-index: 100;
}

.figma-editor__content {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.figma-editor__panel {
  flex-shrink: 0;
  background: var(--bg-secondary, #1e1e1e);
  border: 1px solid var(--border-color, #333);
  overflow: hidden;
}

.figma-editor__panel--left {
  width: 280px;
  border-left: none;
  border-top: none;
  border-bottom: none;
}

.figma-editor__panel--right {
  width: 320px;
  border-right: none;
  border-top: none;
  border-bottom: none;
}

.figma-editor__panel--bottom {
  height: 250px;
  border-left: none;
  border-right: none;
  border-bottom: none;
}

.figma-editor__canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--canvas-bg, #2a2a2a);
}

.canvas-view {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.canvas-view__canvas {
  width: 100%;
  height: 100%;
  image-rendering: crisp-edges;
}

.canvas-view__grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.canvas-view__selection {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.figma-editor__mode-tabs {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  background: var(--bg-secondary, #1e1e1e);
  border: 1px solid var(--border-color, #333);
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
  z-index: 50;
}

.figma-editor__mode-tab {
  padding: 6px 16px;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary, #888);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.figma-editor__mode-tab:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.05));
  color: var(--text-primary, #fff);
}

.figma-editor__mode-tab--active {
  background: var(--bg-active, #3b82f6);
  color: white;
}

/* Dark theme variables */
:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #1e1e1e;
  --bg-tertiary: #252525;
  --bg-hover: rgba(255, 255, 255, 0.05);
  --bg-active: #3b82f6;
  --bg-selected: rgba(59, 130, 246, 0.3);
  
  --text-primary: #ffffff;
  --text-secondary: #888888;
  --text-tertiary: #666666;
  
  --border-color: #333333;
  --focus-color: #3b82f6;
  --accent-color: #3b82f6;
  --accent-color-bright: #60a5fa;
  
  --canvas-bg: #2a2a2a;
  --toolbar-bg: #2c2c2c;
  --input-bg: #2a2a2a;
  --menu-bg: #2a2a2a;
  
  --drop-color: #3b82f6;
  --drop-bg: rgba(59, 130, 246, 0.2);
}
`;

export default FigmaEditor;
