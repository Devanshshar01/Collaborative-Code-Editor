/**
 * Resizable Layout Component
 * VS Code-style layout with draggable, resizable panels
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { 
  PanelLeftClose, 
  PanelRightClose, 
  PanelBottomClose,
  Maximize2,
  Minimize2,
  GripVertical,
  GripHorizontal 
} from 'lucide-react';

// Layout presets
export const LayoutPresets = {
  DEFAULT: { left: 250, right: 300, bottom: 200, leftCollapsed: false, rightCollapsed: false, bottomCollapsed: true },
  FOCUSED: { left: 0, right: 0, bottom: 0, leftCollapsed: true, rightCollapsed: true, bottomCollapsed: true },
  SPLIT: { left: 250, right: 400, bottom: 250, leftCollapsed: false, rightCollapsed: false, bottomCollapsed: false },
  MINIMAL: { left: 48, right: 0, bottom: 0, leftCollapsed: false, rightCollapsed: true, bottomCollapsed: true },
};

// Resizer component
const Resizer = ({ 
  direction = 'vertical', 
  onResize, 
  onDoubleClick,
  minSize = 100,
  maxSize = 800,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const resizerRef = useRef(null);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = direction === 'vertical' ? e.clientX : e.clientY;
    startSizeRef.current = 0; // Will be set by parent
    
    document.body.style.cursor = direction === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const currentPos = direction === 'vertical' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      onResize?.(delta);
      startPosRef.current = currentPos;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, onResize]);

  return (
    <div
      ref={resizerRef}
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
      className={clsx(
        'group flex items-center justify-center transition-colors',
        direction === 'vertical' 
          ? 'w-1 cursor-col-resize hover:bg-blue-500' 
          : 'h-1 cursor-row-resize hover:bg-blue-500',
        isDragging && 'bg-blue-500'
      )}
    >
      {direction === 'vertical' ? (
        <GripVertical className="w-3 h-6 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      ) : (
        <GripHorizontal className="w-6 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
};

// Panel Header component
const PanelHeader = ({ title, icon: Icon, onCollapse, onMaximize, collapsed, maximized }) => (
  <div className="flex items-center justify-between px-3 py-2 bg-gray-900/50 border-b border-white/5">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</span>
    </div>
    <div className="flex items-center gap-1">
      {onMaximize && (
        <button
          onClick={onMaximize}
          className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
          title={maximized ? "Restore" : "Maximize"}
        >
          {maximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </button>
      )}
      {onCollapse && (
        <button
          onClick={onCollapse}
          className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <PanelLeftClose className="w-3 h-3" />
        </button>
      )}
    </div>
  </div>
);

// Main ResizableLayout component
const ResizableLayout = ({
  leftPanel,
  centerPanel,
  rightPanel,
  bottomPanel,
  leftPanelTitle = 'Explorer',
  rightPanelTitle = 'Properties',
  bottomPanelTitle = 'Terminal',
  leftPanelIcon,
  rightPanelIcon,
  bottomPanelIcon,
  defaultLayout = LayoutPresets.DEFAULT,
  onLayoutChange,
  persistKey = 'app-layout',
}) => {
  // Load layout from localStorage or use default
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem(persistKey);
    return saved ? { ...defaultLayout, ...JSON.parse(saved) } : defaultLayout;
  });

  const [maximizedPanel, setMaximizedPanel] = useState(null);

  // Save layout to localStorage
  useEffect(() => {
    localStorage.setItem(persistKey, JSON.stringify(layout));
    onLayoutChange?.(layout);
  }, [layout, persistKey, onLayoutChange]);

  // Update layout
  const updateLayout = useCallback((updates) => {
    setLayout(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle resize
  const handleLeftResize = useCallback((delta) => {
    setLayout(prev => ({
      ...prev,
      left: Math.max(48, Math.min(600, prev.left + delta))
    }));
  }, []);

  const handleRightResize = useCallback((delta) => {
    setLayout(prev => ({
      ...prev,
      right: Math.max(200, Math.min(600, prev.right - delta))
    }));
  }, []);

  const handleBottomResize = useCallback((delta) => {
    setLayout(prev => ({
      ...prev,
      bottom: Math.max(100, Math.min(500, prev.bottom - delta))
    }));
  }, []);

  // Toggle panels
  const toggleLeftPanel = useCallback(() => {
    setLayout(prev => ({ ...prev, leftCollapsed: !prev.leftCollapsed }));
  }, []);

  const toggleRightPanel = useCallback(() => {
    setLayout(prev => ({ ...prev, rightCollapsed: !prev.rightCollapsed }));
  }, []);

  const toggleBottomPanel = useCallback(() => {
    setLayout(prev => ({ ...prev, bottomCollapsed: !prev.bottomCollapsed }));
  }, []);

  // Double click to collapse/expand
  const handleLeftDoubleClick = useCallback(() => {
    setLayout(prev => ({
      ...prev,
      left: prev.leftCollapsed ? 250 : 48,
      leftCollapsed: !prev.leftCollapsed
    }));
  }, []);

  const handleRightDoubleClick = useCallback(() => {
    toggleRightPanel();
  }, [toggleRightPanel]);

  const handleBottomDoubleClick = useCallback(() => {
    toggleBottomPanel();
  }, [toggleBottomPanel]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b') {
          e.preventDefault();
          toggleLeftPanel();
        } else if (e.key === 'j') {
          e.preventDefault();
          toggleBottomPanel();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleLeftPanel, toggleBottomPanel]);

  // If a panel is maximized, show only that panel
  if (maximizedPanel) {
    const PanelContent = maximizedPanel === 'left' ? leftPanel :
                         maximizedPanel === 'right' ? rightPanel :
                         maximizedPanel === 'bottom' ? bottomPanel : centerPanel;
    
    return (
      <div className="flex flex-col h-full w-full">
        <PanelHeader
          title={maximizedPanel === 'left' ? leftPanelTitle :
                 maximizedPanel === 'right' ? rightPanelTitle :
                 maximizedPanel === 'bottom' ? bottomPanelTitle : 'Editor'}
          onMaximize={() => setMaximizedPanel(null)}
          maximized={true}
        />
        <div className="flex-1 overflow-hidden">
          {PanelContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Main horizontal layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        {leftPanel && (
          <>
            <div
              className={clsx(
                'flex flex-col bg-gray-900 border-r border-white/5 overflow-hidden transition-all duration-200',
                layout.leftCollapsed && 'w-12'
              )}
              style={{ width: layout.leftCollapsed ? 48 : layout.left }}
            >
              {!layout.leftCollapsed && (
                <>
                  <PanelHeader
                    title={leftPanelTitle}
                    icon={leftPanelIcon}
                    onCollapse={toggleLeftPanel}
                    onMaximize={() => setMaximizedPanel('left')}
                    collapsed={layout.leftCollapsed}
                  />
                  <div className="flex-1 overflow-hidden">
                    {leftPanel}
                  </div>
                </>
              )}
              {layout.leftCollapsed && (
                <button
                  onClick={toggleLeftPanel}
                  className="p-3 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                  title="Expand sidebar"
                >
                  <PanelLeftClose className="w-5 h-5 rotate-180" />
                </button>
              )}
            </div>

            {/* Left Resizer */}
            {!layout.leftCollapsed && (
              <Resizer
                direction="vertical"
                onResize={handleLeftResize}
                onDoubleClick={handleLeftDoubleClick}
              />
            )}
          </>
        )}

        {/* Center + Right Panel container */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {/* Center Panel (Editor) */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
              {centerPanel}
            </div>

            {/* Right Resizer */}
            {rightPanel && !layout.rightCollapsed && (
              <Resizer
                direction="vertical"
                onResize={handleRightResize}
                onDoubleClick={handleRightDoubleClick}
              />
            )}

            {/* Right Panel */}
            {rightPanel && !layout.rightCollapsed && (
              <div
                className="flex flex-col bg-gray-900 border-l border-white/5 overflow-hidden"
                style={{ width: layout.right }}
              >
                <PanelHeader
                  title={rightPanelTitle}
                  icon={rightPanelIcon}
                  onCollapse={toggleRightPanel}
                  onMaximize={() => setMaximizedPanel('right')}
                />
                <div className="flex-1 overflow-hidden">
                  {rightPanel}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Resizer */}
          {bottomPanel && !layout.bottomCollapsed && (
            <Resizer
              direction="horizontal"
              onResize={handleBottomResize}
              onDoubleClick={handleBottomDoubleClick}
            />
          )}

          {/* Bottom Panel */}
          {bottomPanel && !layout.bottomCollapsed && (
            <div
              className="flex flex-col bg-gray-900 border-t border-white/5 overflow-hidden"
              style={{ height: layout.bottom }}
            >
              <PanelHeader
                title={bottomPanelTitle}
                icon={bottomPanelIcon}
                onCollapse={toggleBottomPanel}
                onMaximize={() => setMaximizedPanel('bottom')}
              />
              <div className="flex-1 overflow-hidden">
                {bottomPanel}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsed bottom panel indicator */}
      {bottomPanel && layout.bottomCollapsed && (
        <div className="h-6 bg-gray-900 border-t border-white/5 flex items-center px-2">
          <button
            onClick={toggleBottomPanel}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
          >
            <PanelBottomClose className="w-3 h-3 rotate-180" />
            <span>{bottomPanelTitle}</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Panel toggle buttons for toolbar
export const PanelToggleButtons = ({ 
  leftCollapsed, 
  rightCollapsed, 
  bottomCollapsed,
  onToggleLeft,
  onToggleRight,
  onToggleBottom,
}) => (
  <div className="flex items-center gap-1">
    <button
      onClick={onToggleLeft}
      className={clsx(
        'p-1.5 rounded transition-colors',
        leftCollapsed 
          ? 'text-gray-500 hover:text-white hover:bg-white/10' 
          : 'text-blue-400 bg-blue-500/20'
      )}
      title="Toggle Sidebar (Ctrl+B)"
    >
      <PanelLeftClose className="w-4 h-4" />
    </button>
    <button
      onClick={onToggleBottom}
      className={clsx(
        'p-1.5 rounded transition-colors',
        bottomCollapsed 
          ? 'text-gray-500 hover:text-white hover:bg-white/10' 
          : 'text-blue-400 bg-blue-500/20'
      )}
      title="Toggle Panel (Ctrl+J)"
    >
      <PanelBottomClose className="w-4 h-4" />
    </button>
    <button
      onClick={onToggleRight}
      className={clsx(
        'p-1.5 rounded transition-colors',
        rightCollapsed 
          ? 'text-gray-500 hover:text-white hover:bg-white/10' 
          : 'text-blue-400 bg-blue-500/20'
      )}
      title="Toggle Secondary Sidebar"
    >
      <PanelRightClose className="w-4 h-4" />
    </button>
  </div>
);

export default ResizableLayout;
