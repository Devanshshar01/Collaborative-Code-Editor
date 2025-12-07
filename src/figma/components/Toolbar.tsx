/**
 * Toolbar - Full Figma-level Toolbar
 * Tool selection, shape tools, text, pen, hand, zoom, comment tools
 */

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============ Types ============

export type ToolType =
  | 'select'
  | 'scale'
  | 'frame'
  | 'slice'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'polygon'
  | 'star'
  | 'image'
  | 'text'
  | 'pen'
  | 'pencil'
  | 'hand'
  | 'comment';

export type ShapeToolType = 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'polygon' | 'star';

export interface ToolConfig {
  // Shape options
  cornerRadius?: number;
  strokeWeight?: number;
  fillColor?: string;
  strokeColor?: string;
  
  // Polygon/Star options
  pointCount?: number;
  innerRadius?: number;
  
  // Text options
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  
  // Frame options
  framePreset?: string;
  
  // Line options
  arrowStart?: boolean;
  arrowEnd?: boolean;
}

// ============ Tool Store ============

interface ToolbarState {
  activeTool: ToolType;
  previousTool: ToolType;
  config: ToolConfig;
  isDrawing: boolean;
  shapeSubmenu: ShapeToolType;
  showShapeSubmenu: boolean;
  
  // Actions
  setTool: (tool: ToolType) => void;
  setPreviousTool: () => void;
  setConfig: (config: Partial<ToolConfig>) => void;
  setIsDrawing: (drawing: boolean) => void;
  setShapeSubmenu: (shape: ShapeToolType) => void;
  toggleShapeSubmenu: () => void;
  closeShapeSubmenu: () => void;
}

export const useToolbarStore = create<ToolbarState>()(
  subscribeWithSelector((set, get) => ({
    activeTool: 'select',
    previousTool: 'select',
    config: {
      cornerRadius: 0,
      strokeWeight: 1,
      fillColor: '#000000',
      strokeColor: '#000000',
      pointCount: 5,
      innerRadius: 0.5,
      fontSize: 16,
      fontFamily: 'Inter',
      fontWeight: 400,
      arrowStart: false,
      arrowEnd: true,
    },
    isDrawing: false,
    shapeSubmenu: 'rectangle',
    showShapeSubmenu: false,

    setTool: (tool) => {
      const current = get().activeTool;
      set({
        activeTool: tool,
        previousTool: current,
        showShapeSubmenu: false,
      });
    },

    setPreviousTool: () => {
      const prev = get().previousTool;
      set({
        activeTool: prev,
        previousTool: prev,
      });
    },

    setConfig: (config) => {
      set((state) => ({
        config: { ...state.config, ...config },
      }));
    },

    setIsDrawing: (drawing) => set({ isDrawing: drawing }),

    setShapeSubmenu: (shape) => {
      set({
        shapeSubmenu: shape,
        activeTool: shape,
        showShapeSubmenu: false,
      });
    },

    toggleShapeSubmenu: () => {
      set((state) => ({ showShapeSubmenu: !state.showShapeSubmenu }));
    },

    closeShapeSubmenu: () => set({ showShapeSubmenu: false }),
  }))
);

// ============ Icons ============

const Icons = {
  Select: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 2l12 9-5.5.5L8 17 6.5 14 4 2z"/>
    </svg>
  ),
  Scale: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 3h4v2H5v2H3V3zm10 0h4v4h-2V5h-2V3zM3 13v4h4v-2H5v-2H3zm14 0v4h-4v-2h2v-2h2z"/>
    </svg>
  ),
  Frame: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 3h4v1H4v3H3V3zm10 0h4v4h-1V4h-3V3zM3 13v4h4v-1H4v-3H3zm14 0v4h-4v-1h3v-3h1zM6 6h8v8H6V6zm1 1v6h6V7H7z"/>
    </svg>
  ),
  Slice: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 3h14v14H3V3zm1 1v12h12V4H4zm2 2h2v2H6V6zm4 0h4v2h-4V6zm-4 4h2v2H6v-2zm4 0h4v2h-4v-2z"/>
    </svg>
  ),
  Rectangle: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 4h14v12H3V4zm1 1v10h12V5H4z"/>
    </svg>
  ),
  Ellipse: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <ellipse cx="10" cy="10" rx="7" ry="6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  Line: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 17L17 3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  Arrow: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 17L17 3m0 0v8m0-8h-8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  Polygon: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <polygon points="10,2 18,8 15,17 5,17 2,8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  Star: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <polygon points="10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  Image: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 4h14v12H3V4zm1 1v8l3-3 2 2 4-4 3 3V5H4zm3 2a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
    </svg>
  ),
  Text: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 4h12v3h-1V5H10.5v10H12v1H8v-1h1.5V5H5v2H4V4z"/>
    </svg>
  ),
  Pen: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 3L3 17h14L10 3zm0 3l4.5 9h-9L10 6z"/>
    </svg>
  ),
  Pencil: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M15 3l2 2-10 10-3 1 1-3L15 3zm-1 2l1 1-8 8-1-1 8-8z"/>
    </svg>
  ),
  Hand: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 3c.5 0 1 .5 1 1v5h1V5c0-.5.5-1 1-1s1 .5 1 1v5h1V6c0-.5.5-1 1-1s1 .5 1 1v8c0 3-2 4-4 4H9c-3 0-5-2-5-5V9c0-.5.5-1 1-1s1 .5 1 1v2h1V4c0-.5.5-1 1-1s1 .5 1 1v5h1V4c0-.5.5-1 1-1z"/>
    </svg>
  ),
  Comment: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 4h14v10H7l-4 3v-3H3V4zm1 1v7h1v2l2-2h9V5H4z"/>
    </svg>
  ),
  ZoomIn: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M8 3a5 5 0 014 8l5 5-1 1-5-5a5 5 0 11-3-9zm0 1a4 4 0 100 8 4 4 0 000-8zm0 1v2h2v1H8v2H7V8H5V7h2V5h1z"/>
    </svg>
  ),
  ZoomOut: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M8 3a5 5 0 014 8l5 5-1 1-5-5a5 5 0 11-3-9zm0 1a4 4 0 100 8 4 4 0 000-8zm-3 4h6v1H5V8z"/>
    </svg>
  ),
  ZoomFit: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 3h4v1H4v3H3V3zm10 0h4v4h-1V4h-3V3zM3 13v4h4v-1H4v-3H3zm14 0v4h-4v-1h3v-3h1zM7 7h6v6H7V7z"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <path d="M2 3.5l3 3 3-3"/>
    </svg>
  ),
  Undo: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 5l-3 3 3 3M1 8h10a4 4 0 010 8H8"/>
    </svg>
  ),
  Redo: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M12 5l3 3-3 3M15 8H5a4 4 0 000 8h3"/>
    </svg>
  ),
};

// ============ Tool Button ============

interface ToolButtonProps {
  tool: ToolType;
  icon: React.FC;
  label: string;
  shortcut?: string;
  isActive: boolean;
  onClick: () => void;
  hasSubmenu?: boolean;
  onSubmenuClick?: () => void;
}

const ToolButton = memo<ToolButtonProps>(({
  tool,
  icon: Icon,
  label,
  shortcut,
  isActive,
  onClick,
  hasSubmenu,
  onSubmenuClick,
}) => {
  return (
    <div className="toolbar__button-container">
      <button
        className={`toolbar__button ${isActive ? 'toolbar__button--active' : ''}`}
        onClick={onClick}
        title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
        aria-label={label}
        aria-pressed={isActive}
      >
        <Icon />
      </button>
      {hasSubmenu && (
        <button
          className="toolbar__submenu-trigger"
          onClick={(e) => {
            e.stopPropagation();
            onSubmenuClick?.();
          }}
          aria-label="More options"
        >
          <Icons.ChevronDown />
        </button>
      )}
    </div>
  );
});

ToolButton.displayName = 'ToolButton';

// ============ Shape Submenu ============

interface ShapeSubmenuProps {
  currentShape: ShapeToolType;
  onSelect: (shape: ShapeToolType) => void;
  onClose: () => void;
}

const ShapeSubmenu: React.FC<ShapeSubmenuProps> = ({ currentShape, onSelect, onClose }) => {
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

  const shapes: { type: ShapeToolType; icon: React.FC; label: string; shortcut: string }[] = [
    { type: 'rectangle', icon: Icons.Rectangle, label: 'Rectangle', shortcut: 'R' },
    { type: 'ellipse', icon: Icons.Ellipse, label: 'Ellipse', shortcut: 'O' },
    { type: 'line', icon: Icons.Line, label: 'Line', shortcut: 'L' },
    { type: 'arrow', icon: Icons.Arrow, label: 'Arrow', shortcut: 'Shift+L' },
    { type: 'polygon', icon: Icons.Polygon, label: 'Polygon', shortcut: '' },
    { type: 'star', icon: Icons.Star, label: 'Star', shortcut: '' },
  ];

  return (
    <div ref={menuRef} className="toolbar__submenu">
      {shapes.map(({ type, icon: Icon, label, shortcut }) => (
        <button
          key={type}
          className={`toolbar__submenu-item ${currentShape === type ? 'toolbar__submenu-item--active' : ''}`}
          onClick={() => onSelect(type)}
        >
          <Icon />
          <span className="toolbar__submenu-label">{label}</span>
          {shortcut && <span className="toolbar__submenu-shortcut">{shortcut}</span>}
        </button>
      ))}
    </div>
  );
};

// ============ Tool Options Panel ============

interface ToolOptionsPanelProps {
  tool: ToolType;
  config: ToolConfig;
  onConfigChange: (config: Partial<ToolConfig>) => void;
}

const ToolOptionsPanel: React.FC<ToolOptionsPanelProps> = ({ tool, config, onConfigChange }) => {
  const renderOptions = () => {
    switch (tool) {
      case 'rectangle':
        return (
          <div className="tool-options">
            <label className="tool-options__field">
              <span>Corner Radius</span>
              <input
                type="number"
                value={config.cornerRadius}
                onChange={(e) => onConfigChange({ cornerRadius: Number(e.target.value) })}
                min={0}
              />
            </label>
          </div>
        );
      
      case 'polygon':
        return (
          <div className="tool-options">
            <label className="tool-options__field">
              <span>Points</span>
              <input
                type="number"
                value={config.pointCount}
                onChange={(e) => onConfigChange({ pointCount: Number(e.target.value) })}
                min={3}
                max={20}
              />
            </label>
          </div>
        );
      
      case 'star':
        return (
          <div className="tool-options">
            <label className="tool-options__field">
              <span>Points</span>
              <input
                type="number"
                value={config.pointCount}
                onChange={(e) => onConfigChange({ pointCount: Number(e.target.value) })}
                min={3}
                max={20}
              />
            </label>
            <label className="tool-options__field">
              <span>Inner Radius</span>
              <input
                type="range"
                value={config.innerRadius}
                onChange={(e) => onConfigChange({ innerRadius: Number(e.target.value) })}
                min={0.1}
                max={0.9}
                step={0.1}
              />
            </label>
          </div>
        );
      
      case 'text':
        return (
          <div className="tool-options">
            <label className="tool-options__field">
              <span>Font Size</span>
              <input
                type="number"
                value={config.fontSize}
                onChange={(e) => onConfigChange({ fontSize: Number(e.target.value) })}
                min={1}
              />
            </label>
            <label className="tool-options__field">
              <span>Font Family</span>
              <select
                value={config.fontFamily}
                onChange={(e) => onConfigChange({ fontFamily: e.target.value })}
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Poppins">Poppins</option>
                <option value="SF Pro">SF Pro</option>
              </select>
            </label>
          </div>
        );
      
      case 'line':
      case 'arrow':
        return (
          <div className="tool-options">
            <label className="tool-options__field tool-options__field--checkbox">
              <input
                type="checkbox"
                checked={config.arrowStart}
                onChange={(e) => onConfigChange({ arrowStart: e.target.checked })}
              />
              <span>Arrow Start</span>
            </label>
            <label className="tool-options__field tool-options__field--checkbox">
              <input
                type="checkbox"
                checked={config.arrowEnd}
                onChange={(e) => onConfigChange({ arrowEnd: e.target.checked })}
              />
              <span>Arrow End</span>
            </label>
          </div>
        );
      
      default:
        return null;
    }
  };

  const options = renderOptions();
  if (!options) return null;

  return <div className="toolbar__options">{options}</div>;
};

// ============ Zoom Controls ============

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoomChange: (zoom: number) => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoomChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(Math.round(zoom * 100)));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    setEditValue(String(Math.round(zoom * 100)));
    setIsEditing(true);
  };

  const handleFinishEdit = () => {
    setIsEditing(false);
    const value = parseInt(editValue, 10);
    if (!isNaN(value) && value > 0 && value <= 6400) {
      onZoomChange(value / 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const zoomPresets = [
.25, 0.5, 0.75, 1, 1.5, 2, 4];

  return (
    <div className="zoom-controls">
      <button
        className="zoom-controls__button"
        onClick={onZoomOut}
        title="Zoom Out (−)"
      >
        <Icons.ZoomOut />
      </button>
      
      <div className="zoom-controls__value-container">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="zoom-controls__input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleFinishEdit}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <button
            className="zoom-controls__value"
            onClick={handleStartEdit}
            title="Click to edit zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
        )}
        
        <div className="zoom-controls__presets">
          {zoomPresets.map((preset) => (
            <button
              key={preset}
              className="zoom-controls__preset"
              onClick={() => onZoomChange(preset)}
            >
              {Math.round(preset * 100)}%
            </button>
          ))}
        </div>
      </div>
      
      <button
        className="zoom-controls__button"
        onClick={onZoomIn}
        title="Zoom In (+)"
      >
        <Icons.ZoomIn />
      </button>
      
      <button
        className="zoom-controls__button"
        onClick={onZoomFit}
        title="Zoom to Fit"
      >
        <Icons.ZoomFit />
      </button>
    </div>
  );
};

// ============ Main Toolbar ============

export interface ToolbarProps {
  className?: string;
  zoom?: number;
  canUndo?: boolean;
  canRedo?: boolean;
  onZoomChange?: (zoom: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomFit?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onToolChange?: (tool: ToolType) => void;
}

export const Toolbar: React.FC<ToolbarProps> = memo(({
  className = '',
  zoom = 1,
  canUndo = false,
  canRedo = false,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onUndo,
  onRedo,
  onToolChange,
}) => {
  const {
    activeTool,
    config,
    shapeSubmenu,
    showShapeSubmenu,
    setTool,
    setConfig,
    setShapeSubmenu,
    toggleShapeSubmenu,
    closeShapeSubmenu,
  } = useToolbarStore();

  const handleToolChange = useCallback((tool: ToolType) => {
    setTool(tool);
    onToolChange?.(tool);
  }, [setTool, onToolChange]);

  const handleShapeSelect = useCallback((shape: ShapeToolType) => {
    setShapeSubmenu(shape);
    onToolChange?.(shape);
  }, [setShapeSubmenu, onToolChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      const shift = e.shiftKey;

      switch (key) {
        case 'v':
          handleToolChange('select');
          break;
        case 'k':
          handleToolChange('scale');
          break;
        case 'f':
          handleToolChange('frame');
          break;
        case 's':
          if (!e.metaKey && !e.ctrlKey) {
            handleToolChange('slice');
          }
          break;
        case 'r':
          handleShapeSelect('rectangle');
          break;
        case 'o':
          handleShapeSelect('ellipse');
          break;
        case 'l':
          handleShapeSelect(shift ? 'arrow' : 'line');
          break;
        case 't':
          handleToolChange('text');
          break;
        case 'p':
          handleToolChange('pen');
          break;
        case 'h':
          handleToolChange('hand');
          break;
        case 'c':
          if (!e.metaKey && !e.ctrlKey) {
            handleToolChange('comment');
          }
          break;
        case ' ':
          e.preventDefault();
          handleToolChange('hand');
          break;
        case 'escape':
          handleToolChange('select');
          closeShapeSubmenu();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Return to select after releasing space (hand tool)
      if (e.key === ' ') {
        handleToolChange('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleToolChange, handleShapeSelect, closeShapeSubmenu]);

  const getActiveShapeIcon = () => {
    switch (shapeSubmenu) {
      case 'rectangle': return Icons.Rectangle;
      case 'ellipse': return Icons.Ellipse;
      case 'line': return Icons.Line;
      case 'arrow': return Icons.Arrow;
      case 'polygon': return Icons.Polygon;
      case 'star': return Icons.Star;
      default: return Icons.Rectangle;
    }
  };

  const isShapeTool = ['rectangle', 'ellipse', 'line', 'arrow', 'polygon', 'star'].includes(activeTool);

  return (
    <div className={`toolbar ${className}`}>
      {/* Left Section - Tools */}
      <div className="toolbar__section toolbar__section--left">
        {/* Undo/Redo */}
        <div className="toolbar__group">
          <button
            className="toolbar__button toolbar__button--small"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (⌘Z)"
          >
            <Icons.Undo />
          </button>
          <button
            className="toolbar__button toolbar__button--small"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (⌘⇧Z)"
          >
            <Icons.Redo />
          </button>
        </div>

        <div className="toolbar__divider" />

        {/* Selection Tools */}
        <div className="toolbar__group">
          <ToolButton
            tool="select"
            icon={Icons.Select}
            label="Move"
            shortcut="V"
            isActive={activeTool === 'select'}
            onClick={() => handleToolChange('select')}
          />
          <ToolButton
            tool="scale"
            icon={Icons.Scale}
            label="Scale"
            shortcut="K"
            isActive={activeTool === 'scale'}
            onClick={() => handleToolChange('scale')}
          />
        </div>

        <div className="toolbar__divider" />

        {/* Frame & Slice */}
        <div className="toolbar__group">
          <ToolButton
            tool="frame"
            icon={Icons.Frame}
            label="Frame"
            shortcut="F"
            isActive={activeTool === 'frame'}
            onClick={() => handleToolChange('frame')}
          />
          <ToolButton
            tool="slice"
            icon={Icons.Slice}
            label="Slice"
            shortcut="S"
            isActive={activeTool === 'slice'}
            onClick={() => handleToolChange('slice')}
          />
        </div>

        <div className="toolbar__divider" />

        {/* Shape Tools */}
        <div className="toolbar__group toolbar__group--shapes">
          <ToolButton
            tool={shapeSubmenu}
            icon={getActiveShapeIcon()}
            label={shapeSubmenu.charAt(0).toUpperCase() + shapeSubmenu.slice(1)}
            isActive={isShapeTool}
            onClick={() => handleToolChange(shapeSubmenu)}
            hasSubmenu
            onSubmenuClick={toggleShapeSubmenu}
          />
          {showShapeSubmenu && (
            <ShapeSubmenu
              currentShape={shapeSubmenu}
              onSelect={handleShapeSelect}
              onClose={closeShapeSubmenu}
            />
          )}
        </div>

        <div className="toolbar__divider" />

        {/* Drawing Tools */}
        <div className="toolbar__group">
          <ToolButton
            tool="pen"
            icon={Icons.Pen}
            label="Pen"
            shortcut="P"
            isActive={activeTool === 'pen'}
            onClick={() => handleToolChange('pen')}
          />
          <ToolButton
            tool="pencil"
            icon={Icons.Pencil}
            label="Pencil"
            shortcut="⇧P"
            isActive={activeTool === 'pencil'}
            onClick={() => handleToolChange('pencil')}
          />
        </div>

        <div className="toolbar__divider" />

        {/* Text & Image */}
        <div className="toolbar__group">
          <ToolButton
            tool="text"
            icon={Icons.Text}
            label="Text"
            shortcut="T"
            isActive={activeTool === 'text'}
            onClick={() => handleToolChange('text')}
          />
          <ToolButton
            tool="image"
            icon={Icons.Image}
            label="Image"
            isActive={activeTool === 'image'}
            onClick={() => handleToolChange('image')}
          />
        </div>

        <div className="toolbar__divider" />

        {/* Hand & Comment */}
        <div className="toolbar__group">
          <ToolButton
            tool="hand"
            icon={Icons.Hand}
            label="Hand"
            shortcut="H"
            isActive={activeTool === 'hand'}
            onClick={() => handleToolChange('hand')}
          />
          <ToolButton
            tool="comment"
            icon={Icons.Comment}
            label="Comment"
            shortcut="C"
            isActive={activeTool === 'comment'}
            onClick={() => handleToolChange('comment')}
          />
        </div>
      </div>

      {/* Center Section - Tool Options */}
      <div className="toolbar__section toolbar__section--center">
        <ToolOptionsPanel
          tool={activeTool}
          config={config}
          onConfigChange={setConfig}
        />
      </div>

      {/* Right Section - Zoom */}
      <div className="toolbar__section toolbar__section--right">
        <ZoomControls
          zoom={zoom}
          onZoomIn={onZoomIn || (() => {})}
          onZoomOut={onZoomOut || (() => {})}
          onZoomFit={onZoomFit || (() => {})}
          onZoomChange={onZoomChange || (() => {})}
        />
      </div>
    </div>
  );
});

Toolbar.displayName = 'Toolbar';

// ============ Styles ============

export const toolbarStyles = `
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 12px;
  background: var(--toolbar-bg, #2c2c2c);
  border-bottom: 1px solid var(--border-color, #1a1a1a);
  user-select: none;
}

.toolbar__section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar__section--left {
  flex: 1;
}

.toolbar__section--center {
  flex: 0;
}

.toolbar__section--right {
  flex: 1;
  justify-content: flex-end;
}

.toolbar__group {
  display: flex;
  align-items: center;
  gap: 2px;
  position: relative;
}

.toolbar__divider {
  width: 1px;
  height: 24px;
  background: var(--border-color, #444);
  margin: 0 8px;
}

.toolbar__button-container {
  display: flex;
  align-items: center;
  position: relative;
}

.toolbar__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary, #888);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.toolbar__button:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #fff);
}

.toolbar__button--active {
  background: var(--bg-active, #3b82f6) !important;
  color: white !important;
}

.toolbar__button--small {
  width: 28px;
  height: 28px;
}

.toolbar__button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.toolbar__submenu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 32px;
  padding: 0;
  background: none;
  border: none;
  color: var(--text-secondary, #888);
  cursor: pointer;
  margin-left: -4px;
}

.toolbar__submenu-trigger:hover {
  color: var(--text-primary, #fff);
}

.toolbar__submenu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 180px;
  background: var(--menu-bg, #2a2a2a);
  border: 1px solid var(--border-color, #444);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  padding: 4px;
  z-index: 1000;
}

.toolbar__submenu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-primary, #fff);
  cursor: pointer;
  font-size: 12px;
  text-align: left;
}

.toolbar__submenu-item:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
}

.toolbar__submenu-item--active {
  background: var(--bg-active, rgba(59, 130, 246, 0.2));
}

.toolbar__submenu-label {
  flex: 1;
}

.toolbar__submenu-shortcut {
  color: var(--text-secondary, #888);
  font-size: 11px;
}

.toolbar__options {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
}

.tool-options {
  display: flex;
  align-items: center;
  gap: 16px;
}

.tool-options__field {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary, #888);
}

.tool-options__field input[type="number"],
.tool-options__field select {
  width: 60px;
  padding: 4px 8px;
  background: var(--input-bg, #1a1a1a);
  border: 1px solid var(--border-color, #444);
  border-radius: 4px;
  color: var(--text-primary, #fff);
  font-size: 12px;
}

.tool-options__field input[type="range"] {
  width: 80px;
}

.tool-options__field--checkbox {
  cursor: pointer;
}

.tool-options__field--checkbox input {
  margin: 0;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.zoom-controls__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary, #888);
  cursor: pointer;
}

.zoom-controls__button:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #fff);
}

.zoom-controls__value-container {
  position: relative;
}

.zoom-controls__value {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  height: 28px;
  padding: 0 8px;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-primary, #fff);
  font-size: 12px;
  cursor: pointer;
}

.zoom-controls__value:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
}

.zoom-controls__input {
  width: 50px;
  height: 28px;
  padding: 0 8px;
  background: var(--input-bg, #1a1a1a);
  border: 1px solid var(--focus-color, #3b82f6);
  border-radius: 4px;
  color: var(--text-primary, #fff);
  font-size: 12px;
  text-align: center;
  outline: none;
}

.zoom-controls__presets {
  display: none;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 4px;
  background: var(--menu-bg, #2a2a2a);
  border: 1px solid var(--border-color, #444);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 4px;
  z-index: 1000;
}

.zoom-controls__value-container:hover .zoom-controls__presets {
  display: block;
}

.zoom-controls__preset {
  display: block;
  width: 100%;
  padding: 6px 12px;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-primary, #fff);
  font-size: 12px;
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
}

.zoom-controls__preset:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
}
`;

export default Toolbar;
