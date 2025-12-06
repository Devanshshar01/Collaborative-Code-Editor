/**
 * Figma-like Design Editor
 * A comprehensive design tool with Figma-style interface and features
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';

// Sub-components
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import LayersPanel from './LayersPanel';
import TopBar from './TopBar';
import ContextMenu from './ContextMenu';
import ColorPicker from './ColorPicker';
import { useCanvasStore } from './store';
import { useHistory } from './hooks/useHistory';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useClipboard } from './hooks/useClipboard';
import './styles.css';

const FigmaCanvas = ({
    roomId,
    userId,
    userName,
    isAdmin = false,
    onExport,
    onSave,
    collaborative = true,
}) => {
    const canvasRef = useRef(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [showColorPicker, setShowColorPicker] = useState(null);
    const [showLayers, setShowLayers] = useState(true);
    const [showProperties, setShowProperties] = useState(true);
    
    // Canvas store
    const {
        elements,
        selectedIds,
        tool,
        zoom,
        pan,
        setTool,
        setZoom,
        setPan,
        addElement,
        updateElement,
        deleteElements,
        selectElements,
        clearSelection,
        groupElements,
        ungroupElements,
        bringToFront,
        sendToBack,
        bringForward,
        sendBackward,
        duplicateElements,
        lockElements,
        unlockElements,
        toggleVisibility,
    } = useCanvasStore();

    // History for undo/redo
    const { undo, redo, canUndo, canRedo } = useHistory();

    // Clipboard operations
    const { copy, cut, paste } = useClipboard();

    // Keyboard shortcuts
    useKeyboardShortcuts({
        undo,
        redo,
        copy,
        cut,
        paste,
        deleteElements,
        selectAll: () => selectElements(elements.map(e => e.id)),
        clearSelection,
        groupElements,
        ungroupElements,
        bringToFront,
        sendToBack,
        duplicateElements,
        setTool,
    });

    // Handle context menu
    const handleContextMenu = useCallback((e, elementId) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            elementId,
        });
    }, []);

    // Close context menu
    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Handle zoom
    const handleZoom = useCallback((delta, centerX, centerY) => {
        const newZoom = Math.max(0.1, Math.min(10, zoom + delta));
        setZoom(newZoom);
    }, [zoom, setZoom]);

    // Handle pan
    const handlePan = useCallback((dx, dy) => {
        setPan({ x: pan.x + dx, y: pan.y + dy });
    }, [pan, setPan]);

    // Export functions
    const handleExportPNG = useCallback(async () => {
        if (canvasRef.current) {
            const dataUrl = await canvasRef.current.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `design-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        }
    }, []);

    const handleExportSVG = useCallback(() => {
        if (canvasRef.current) {
            const svgData = canvasRef.current.toSVG();
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `design-${Date.now()}.svg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }
    }, []);

    const handleExportJSON = useCallback(() => {
        const data = JSON.stringify({ elements, zoom, pan }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `design-${Date.now()}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }, [elements, zoom, pan]);

    return (
        <div className="figma-editor" onClick={closeContextMenu}>
            {/* Top Bar - File menu, zoom controls, share */}
            <TopBar
                zoom={zoom}
                onZoomChange={setZoom}
                onExportPNG={handleExportPNG}
                onExportSVG={handleExportSVG}
                onExportJSON={handleExportJSON}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
                fileName="Untitled"
                userName={userName}
                collaborative={collaborative}
            />

            <div className="figma-main">
                {/* Left Toolbar - Tools */}
                <Toolbar
                    activeTool={tool}
                    onToolChange={setTool}
                />

                {/* Left Panel - Layers */}
                {showLayers && (
                    <LayersPanel
                        elements={elements}
                        selectedIds={selectedIds}
                        onSelect={selectElements}
                        onToggleVisibility={toggleVisibility}
                        onLock={lockElements}
                        onUnlock={unlockElements}
                        onReorder={(id, direction) => {
                            if (direction === 'up') bringForward([id]);
                            else sendBackward([id]);
                        }}
                        onDelete={(id) => deleteElements([id])}
                        onDuplicate={(id) => duplicateElements([id])}
                    />
                )}

                {/* Main Canvas */}
                <Canvas
                    ref={canvasRef}
                    elements={elements}
                    selectedIds={selectedIds}
                    tool={tool}
                    zoom={zoom}
                    pan={pan}
                    onZoom={handleZoom}
                    onPan={handlePan}
                    onAddElement={addElement}
                    onUpdateElement={updateElement}
                    onSelectElements={selectElements}
                    onClearSelection={clearSelection}
                    onContextMenu={handleContextMenu}
                />

                {/* Right Panel - Properties */}
                {showProperties && (
                    <PropertiesPanel
                        elements={elements}
                        selectedIds={selectedIds}
                        onUpdateElement={updateElement}
                        onShowColorPicker={setShowColorPicker}
                    />
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    elementId={contextMenu.elementId}
                    onClose={closeContextMenu}
                    onCopy={() => copy(contextMenu.elementId)}
                    onCut={() => cut(contextMenu.elementId)}
                    onPaste={paste}
                    onDuplicate={() => duplicateElements([contextMenu.elementId])}
                    onDelete={() => deleteElements([contextMenu.elementId])}
                    onBringToFront={() => bringToFront([contextMenu.elementId])}
                    onSendToBack={() => sendToBack([contextMenu.elementId])}
                    onGroup={() => groupElements(selectedIds)}
                    onUngroup={() => ungroupElements([contextMenu.elementId])}
                    onLock={() => lockElements([contextMenu.elementId])}
                />
            )}

            {/* Color Picker Modal */}
            {showColorPicker && (
                <ColorPicker
                    color={showColorPicker.color}
                    onChange={(color) => {
                        showColorPicker.onChange(color);
                    }}
                    onClose={() => setShowColorPicker(null)}
                    position={showColorPicker.position}
                />
            )}
        </div>
    );
};

export default FigmaCanvas;
