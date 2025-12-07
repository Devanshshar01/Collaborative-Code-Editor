/**
 * EnhancedToolbar - Toolbar with flyout menus
 * All tools, keyboard shortcuts, tooltips
 */

import React, { useState, useRef, useEffect } from 'react';
import { useWhiteboardStore, ToolType } from './whiteboardStore';

// ============ Tool Definitions ============

const TOOLS = [
    {
        id: ToolType.SELECT,
        icon: '⬚',
        label: 'Select',
        shortcut: 'V',
        group: 'selection',
    },
    {
        id: ToolType.FRAME,
        icon: '▢',
        label: 'Frame',
        shortcut: 'F',
        group: 'shapes',
    },
    {
        id: ToolType.RECTANGLE,
        icon: '□',
        label: 'Rectangle',
        shortcut: 'R',
        group: 'shapes',
        flyout: [
            { id: ToolType.RECTANGLE, icon: '□', label: 'Rectangle', shortcut: 'R' },
            { id: ToolType.ELLIPSE, icon: '○', label: 'Ellipse', shortcut: 'O' },
            { id: ToolType.POLYGON, icon: '⬡', label: 'Polygon', shortcut: 'Shift+P' },
            { id: ToolType.STAR, icon: '★', label: 'Star', shortcut: 'Shift+S' },
        ],
    },
    {
        id: ToolType.LINE,
        icon: '╱',
        label: 'Line',
        shortcut: 'L',
        group: 'draw',
        flyout: [
            { id: ToolType.LINE, icon: '╱', label: 'Line', shortcut: 'L' },
            { id: ToolType.ARROW, icon: '→', label: 'Arrow', shortcut: 'Shift+L' },
            { id: ToolType.CONNECTOR, icon: '⟿', label: 'Connector', shortcut: 'C' },
        ],
    },
    {
        id: ToolType.PEN,
        icon: '✎',
        label: 'Pen',
        shortcut: 'P',
        group: 'draw',
        flyout: [
            { id: ToolType.PEN, icon: '✎', label: 'Pen', shortcut: 'P' },
            { id: ToolType.PENCIL, icon: '✏', label: 'Pencil', shortcut: 'Shift+P' },
            { id: ToolType.BEZIER, icon: '⌢', label: 'Bezier', shortcut: 'B' },
        ],
    },
    {
        id: ToolType.TEXT,
        icon: 'T',
        label: 'Text',
        shortcut: 'T',
        group: 'content',
    },
    {
        id: ToolType.IMAGE,
        icon: '🖼',
        label: 'Image',
        shortcut: 'Shift+I',
        group: 'content',
    },
    {
        id: ToolType.HAND,
        icon: '✋',
        label: 'Hand',
        shortcut: 'H',
        group: 'navigation',
    },
    {
        id: ToolType.ZOOM,
        icon: '🔍',
        label: 'Zoom',
        shortcut: 'Z',
        group: 'navigation',
    },
    {
        id: ToolType.ERASER,
        icon: '⌫',
        label: 'Eraser',
        shortcut: 'E',
        group: 'edit',
    },
    {
        id: ToolType.EYEDROPPER,
        icon: '💧',
        label: 'Eyedropper',
        shortcut: 'I',
        group: 'edit',
    },
    {
        id: ToolType.COMMENT,
        icon: '💬',
        label: 'Comment',
        shortcut: 'Shift+C',
        group: 'collab',
    },
];

// ============ Flyout Menu Component ============

const FlyoutMenu = ({ items, onSelect, onClose }) => {
    const menuRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    
    return (
        <div ref={menuRef} style={styles.flyout}>
            {items.map(item => (
                <button
                    key={item.id}
                    onClick={() => { onSelect(item.id); onClose(); }}
                    style={styles.flyoutItem}
                >
                    <span style={styles.flyoutIcon}>{item.icon}</span>
                    <span style={styles.flyoutLabel}>{item.label}</span>
                    <span style={styles.flyoutShortcut}>{item.shortcut}</span>
                </button>
            ))}
        </div>
    );
};

// ============ Tool Button Component ============

const ToolButton = ({ tool, isActive, onClick, onFlyoutOpen }) => {
    const [showFlyout, setShowFlyout] = useState(false);
    const timeoutRef = useRef(null);
    
    const handleMouseDown = () => {
        if (tool.flyout) {
            timeoutRef.current = setTimeout(() => {
                setShowFlyout(true);
                onFlyoutOpen?.();
            }, 300);
        }
    };
    
    const handleMouseUp = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (!showFlyout) {
            onClick(tool.id);
        }
    };
    
    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };
    
    return (
        <div style={styles.toolWrapper}>
            <button
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={{
                    ...styles.toolBtn,
                    ...(isActive ? styles.toolBtnActive : {}),
                }}
                title={`${tool.label} (${tool.shortcut})`}
            >
                <span style={styles.toolIcon}>{tool.icon}</span>
                {tool.flyout && <span style={styles.flyoutIndicator}>▾</span>}
            </button>
            {showFlyout && tool.flyout && (
                <FlyoutMenu
                    items={tool.flyout}
                    onSelect={onClick}
                    onClose={() => setShowFlyout(false)}
                />
            )}
        </div>
    );
};

// ============ Zoom Controls ============

const ZoomControls = () => {
    const { zoom, zoomIn, zoomOut, zoomTo100, zoomToFit } = useWhiteboardStore();
    
    return (
        <div style={styles.zoomControls}>
            <button onClick={zoomOut} style={styles.zoomBtn} title="Zoom Out (-)">
                −
            </button>
            <button onClick={zoomTo100} style={styles.zoomValue} title="Reset to 100%">
                {Math.round(zoom * 100)}%
            </button>
            <button onClick={zoomIn} style={styles.zoomBtn} title="Zoom In (+)">
                +
            </button>
            <button onClick={zoomToFit} style={styles.zoomBtn} title="Zoom to Fit">
                ⤡
            </button>
        </div>
    );
};

// ============ Quick Actions ============

const QuickActions = () => {
    const { 
        undo, redo, canUndo, canRedo,
        gridEnabled, snapEnabled, rulersEnabled,
    } = useWhiteboardStore();
    
    const toggleGrid = () => useWhiteboardStore.setState({ gridEnabled: !gridEnabled });
    const toggleSnap = () => useWhiteboardStore.setState({ snapEnabled: !snapEnabled });
    const toggleRulers = () => useWhiteboardStore.setState({ rulersEnabled: !rulersEnabled });
    
    return (
        <div style={styles.quickActions}>
            <button
                onClick={undo}
                disabled={!canUndo()}
                style={{ ...styles.actionBtn, opacity: canUndo() ? 1 : 0.3 }}
                title="Undo (Ctrl+Z)"
            >
                ↩
            </button>
            <button
                onClick={redo}
                disabled={!canRedo()}
                style={{ ...styles.actionBtn, opacity: canRedo() ? 1 : 0.3 }}
                title="Redo (Ctrl+Shift+Z)"
            >
                ↪
            </button>
            <div style={styles.separator} />
            <button
                onClick={toggleGrid}
                style={{
                    ...styles.actionBtn,
                    ...(gridEnabled ? styles.actionBtnActive : {}),
                }}
                title="Toggle Grid (Ctrl+G)"
            >
                ⊞
            </button>
            <button
                onClick={toggleSnap}
                style={{
                    ...styles.actionBtn,
                    ...(snapEnabled ? styles.actionBtnActive : {}),
                }}
                title="Toggle Snap (Ctrl+;)"
            >
                ◫
            </button>
            <button
                onClick={toggleRulers}
                style={{
                    ...styles.actionBtn,
                    ...(rulersEnabled ? styles.actionBtnActive : {}),
                }}
                title="Toggle Rulers (Ctrl+R)"
            >
                📏
            </button>
        </div>
    );
};

// ============ Main Component ============

export const EnhancedToolbar = ({ orientation = 'vertical', className = '' }) => {
    const { tool, setTool } = useWhiteboardStore();
    
    const handleToolSelect = (toolId) => {
        setTool(toolId);
    };
    
    const isVertical = orientation === 'vertical';
    
    // Group tools by category
    const toolGroups = {
        selection: TOOLS.filter(t => t.group === 'selection'),
        shapes: TOOLS.filter(t => t.group === 'shapes'),
        draw: TOOLS.filter(t => t.group === 'draw'),
        content: TOOLS.filter(t => t.group === 'content'),
        navigation: TOOLS.filter(t => t.group === 'navigation'),
        edit: TOOLS.filter(t => t.group === 'edit'),
        collab: TOOLS.filter(t => t.group === 'collab'),
    };
    
    return (
        <div 
            className={className} 
            style={{
                ...styles.toolbar,
                ...(isVertical ? styles.vertical : styles.horizontal),
            }}
        >
            {/* Main tools */}
            <div style={{
                ...styles.toolsContainer,
                flexDirection: isVertical ? 'column' : 'row',
            }}>
                {Object.entries(toolGroups).map(([group, tools], i) => (
                    <React.Fragment key={group}>
                        {i > 0 && <div style={isVertical ? styles.separatorH : styles.separatorV} />}
                        {tools.map(t => (
                            <ToolButton
                                key={t.id}
                                tool={t}
                                isActive={tool === t.id || (t.flyout && t.flyout.some(f => f.id === tool))}
                                onClick={handleToolSelect}
                            />
                        ))}
                    </React.Fragment>
                ))}
            </div>
            
            {/* Bottom section with zoom and actions */}
            {isVertical && (
                <div style={styles.bottomSection}>
                    <div style={styles.separatorH} />
                    <QuickActions />
                    <div style={styles.separatorH} />
                    <ZoomControls />
                </div>
            )}
        </div>
    );
};

// ============ Horizontal Toolbar (Top Bar) ============

export const EnhancedTopBar = ({ roomName, userName, onShare, onExport }) => {
    const { zoom, zoomIn, zoomOut, zoomTo100 } = useWhiteboardStore();
    
    return (
        <div style={styles.topBar}>
            {/* Left section - Room info */}
            <div style={styles.topBarSection}>
                <span style={styles.roomName}>{roomName || 'Untitled'}</span>
            </div>
            
            {/* Center section - Quick tools */}
            <div style={styles.topBarCenter}>
                <QuickActions />
            </div>
            
            {/* Right section - Actions */}
            <div style={styles.topBarSection}>
                <ZoomControls />
                <div style={styles.separator} />
                <button onClick={onShare} style={styles.topBarBtn}>
                    Share
                </button>
                <button onClick={onExport} style={styles.topBarBtnPrimary}>
                    Export
                </button>
            </div>
        </div>
    );
};

// ============ Styles ============

const styles = {
    toolbar: {
        background: '#252525',
        display: 'flex',
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        userSelect: 'none',
    },
    vertical: {
        flexDirection: 'column',
        width: 48,
        height: '100%',
        borderRight: '1px solid #333',
        padding: '8px 0',
    },
    horizontal: {
        flexDirection: 'row',
        height: 48,
        width: '100%',
        borderBottom: '1px solid #333',
        padding: '0 8px',
        alignItems: 'center',
    },
    toolsContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: '0 4px',
    },
    toolWrapper: {
        position: 'relative',
    },
    toolBtn: {
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        color: '#888',
        fontSize: 16,
        transition: 'all 0.15s',
        position: 'relative',
    },
    toolBtnActive: {
        background: 'rgba(13, 153, 255, 0.2)',
        color: '#0d99ff',
    },
    toolIcon: {
        fontSize: 18,
    },
    flyoutIndicator: {
        position: 'absolute',
        right: 2,
        bottom: 2,
        fontSize: 6,
        color: '#666',
    },
    flyout: {
        position: 'absolute',
        left: '100%',
        top: 0,
        marginLeft: 4,
        background: '#2a2a2a',
        border: '1px solid #444',
        borderRadius: 8,
        padding: 4,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        zIndex: 100,
        minWidth: 160,
    },
    flyoutItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '8px 12px',
        background: 'none',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        color: '#fff',
        fontSize: 12,
        textAlign: 'left',
    },
    flyoutIcon: {
        width: 20,
        textAlign: 'center',
    },
    flyoutLabel: {
        flex: 1,
    },
    flyoutShortcut: {
        color: '#666',
        fontSize: 11,
    },
    separatorH: {
        height: 1,
        background: '#333',
        margin: '6px 8px',
    },
    separatorV: {
        width: 1,
        height: 24,
        background: '#333',
        margin: '0 8px',
    },
    separator: {
        width: 1,
        height: 24,
        background: '#444',
        margin: '0 8px',
    },
    bottomSection: {
        marginTop: 'auto',
        display: 'flex',
        flexDirection: 'column',
    },
    quickActions: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        padding: '4px 0',
    },
    actionBtn: {
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        color: '#888',
        fontSize: 14,
    },
    actionBtnActive: {
        color: '#0d99ff',
        background: 'rgba(13, 153, 255, 0.15)',
    },
    zoomControls: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        padding: '4px 0',
    },
    zoomBtn: {
        width: 32,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#333',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        color: '#888',
        fontSize: 14,
    },
    zoomValue: {
        width: 44,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#fff',
        fontSize: 11,
    },
    // Top bar styles
    topBar: {
        height: 48,
        background: '#252525',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontFamily: 'Inter, sans-serif',
    },
    topBarSection: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    topBarCenter: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
    },
    roomName: {
        fontWeight: 600,
        color: '#fff',
        fontSize: 14,
    },
    topBarBtn: {
        padding: '6px 12px',
        background: '#333',
        border: 'none',
        borderRadius: 6,
        color: '#fff',
        fontSize: 12,
        cursor: 'pointer',
    },
    topBarBtnPrimary: {
        padding: '6px 16px',
        background: '#0d99ff',
        border: 'none',
        borderRadius: 6,
        color: '#fff',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
    },
};

export default EnhancedToolbar;
