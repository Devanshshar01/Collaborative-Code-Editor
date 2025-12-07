/**
 * Figma Editor - Main Export File
 * Complete Figma-level design editor with all features
 */

// Main Editor Component
export { FigmaEditor, useEditorStore, figmaEditorStyles } from './FigmaEditor';
export type { FigmaEditorProps, EditorState } from './FigmaEditor';

// UI Components
export { Toolbar, useToolbarStore, toolbarStyles } from './components/Toolbar';
export type { ToolbarProps, ToolType, ToolConfig } from './components/Toolbar';

export { LayerPanel, useLayerPanelStore, layerPanelStyles } from './components/LayerPanel';
export type { LayerPanelProps, LayerNode } from './components/LayerPanel';

export { PropertyPanel, usePropertyPanelStore, propertyPanelStyles } from './components/PropertyPanel';
export type { PropertyPanelProps, PropertyPanelNode } from './components/PropertyPanel';

export { TimelinePanel, useTimelineStore, timelinePanelStyles } from './components/TimelinePanel';
export type { TimelinePanelProps, AnimationLayer, Keyframe } from './components/TimelinePanel';

export { DevModePanel } from './components/DevModePanel';

// Core Systems
export { SceneGraph } from './core/SceneGraph';
export type { BaseNode, FrameNode, VectorNode, TextNode, GroupNode } from './core/SceneGraph';

export { ComponentSystem } from './core/ComponentSystem';
export type { Component, ComponentInstance, ComponentVariant } from './core/ComponentSystem';

export { VectorEngine } from './core/VectorEngine';
export type { VectorPath, PathCommand, BooleanOperation } from './core/VectorEngine';

export { LayoutEngine, useAutoLayoutStore } from './core/AutoLayout';
export type { AutoLayoutNode, LayoutConstraints } from './core/AutoLayout';

export { AnimationTimeline } from './core/AnimationTimeline';
export type { Animation, AnimationKeyframe } from './core/AnimationTimeline';

export { CollaborationManager } from './core/CollaborationSystem';
export type { Comment, CollaborationCursor } from './core/CollaborationSystem';

export { PluginManager } from './core/PluginAPI';
export type { Plugin, PluginCapability } from './core/PluginAPI';

export { ExportManager, useExportStore } from './core/ExportSystem';
export type { ExportConfig, ExportFormat } from './core/ExportSystem';

export { PrototypingEngine, usePrototypeStore } from './core/PrototypingEngine';
export type { PrototypeFlow, Interaction, Hotspot } from './core/PrototypingEngine';

export { CanvasRenderer } from './core/CanvasRenderer';
export type { RenderNode, RenderConfig } from './core/CanvasRenderer';

// Combined Styles
export const figmaStyles = `
  ${figmaEditorStyles}
  ${toolbarStyles}
  ${layerPanelStyles}
  ${propertyPanelStyles}
  ${timelinePanelStyles}
`;

// Version
export const VERSION = '1.0.0';

// Feature flags
export const FEATURES = {
  sceneGraph: true,
  components: true,
  vectorEditing: true,
  autoLayout: true,
  animation: true,
  collaboration: true,
  plugins: true,
  export: true,
  prototyping: true,
  devMode: true,
  webglRendering: true,
  smartAnimate: true,
  constraints: true,
  variants: true,
  realTimeSync: true,
  versionHistory: true,
  comments: true,
  multiplayerCursors: true,
};
