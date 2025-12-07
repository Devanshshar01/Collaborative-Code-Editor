/**
 * EnhancedLayersPanel - Layer hierarchy with drag-drop
 * Multi-select, context menu, thumbnails, blend mode indicators
 */

import React, { useState, useCallback, useRef } from 'react';
import { useWhiteboardStore, ElementType, BlendMode } from './whiteboardStore';

// ============ Icon Components ============

const EyeIcon = ({ visible }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={visible ? '#888' : '#444'} strokeWidth="2">
        {visible ? (
            <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
            </>
        ) : (
            <>
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
            </>
        )}
    </svg>
);

const LockIcon = ({ locked }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={locked ? '#ff6b6b' : '#444'} strokeWidth="2">
        {locked ? (
            <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
            </>
        ) : (
            <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 019.9-1" />
            </>
        )}
    </svg>
);

const getTypeIcon = (type) => {
    const icons = {
        [ElementType.RECTANGLE]: '□',
        [ElementType.ELLIPSE]: '○',
        [ElementType.LINE]: '╱',
        [ElementType.ARROW]: '→',
        [ElementType.PATH]: '〰',
        [ElementType.BEZIER]: '⌢',
        [ElementType.POLYGON]: '⬡',
        [ElementType.STAR]: '★',
        [ElementType.TEXT]: 'T',
        [ElementType.IMAGE]: '🖼',
        [ElementType.FRAME]: '▢',
        [ElementType.GROUP]: '⊞',
        [ElementType.CONNECTOR]: '⟿',
    };
    return icons[type] || '?';
};

// ============ Layer Item Component ============

const LayerItem = ({
    element,
    isSelected,
    isHovered,
    isDragging,
    onSelect,
    onToggleVisibility,
    onToggleLock,
    onRename,
    onContextMenu,
    onDragStart,
    onDragOver,
    onDrop,
    depth = 0,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(element.name);
    const inputRef = useRef(null);
    
    const handleDoubleClick = () => {
        setIsEditing(true);
        setEditName(element.name);
        setTimeout(() => inputRef.current?.select(), 0);
    };
    
    const handleNameSubmit = () => {
        setIsEditing(false);
        if (editName.trim() !== element.name) {
            onRename(element.id, editName.trim() || element.name);
        }
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleNameSubmit();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditName(element.name);
        }
    };
    
    return (
        <div
            draggable={!isEditing}
            onDragStart={(e) => onDragStart(e, element.id)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, element.id)}
            onClick={(e) => onSelect(element.id, e.shiftKey, e.ctrlKey || e.metaKey)}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => onContextMenu(e, element)}
            style={{
                ...styles.layerItem,
                paddingLeft: 8 + depth * 16,
                background: isSelected ? 'rgba(13, 153, 255, 0.2)' : isHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                borderLeft: isSelected ? '2px solid #0d99ff' : '2px solid transparent',
                opacity: isDragging ? 0.5 : 1,
            }}
        >
            {/* Type icon */}
            <span style={styles.typeIcon}>{getTypeIcon(element.type)}</span>
            
            {/* Thumbnail */}
            <div style={styles.thumbnail}>
                <div
                    style={{
                        ...styles.thumbPreview,
                        background: element.fill?.color || '#666',
                        borderRadius: element.type === ElementType.ELLIPSE ? '50%' : 2,
                    }}
                />
            </div>
            
            {/* Name */}
            <div style={styles.nameContainer}>
                {isEditing ? (
                    <input
                        ref={inputRef}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleNameSubmit}
                        onKeyDown={handleKeyDown}
                        style={styles.nameInput}
                        autoFocus
                    />
                ) : (
                    <span style={styles.name}>{element.name}</span>
                )}
                
                {/* Blend mode indicator */}
                {element.blendMode && element.blendMode !== BlendMode.NORMAL && (
                    <span style={styles.blendBadge}>
                        {element.blendMode.split('-').map(w => w[0]).join('')}
                    </span>
                )}
            </div>
            
            {/* Actions */}
            <div style={styles.actions}>
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleLock(element.id); }}
                    style={styles.actionBtn}
                    title={element.locked ? 'Unlock' : 'Lock'}
                >
                    <LockIcon locked={element.locked} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleVisibility(element.id); }}
                    style={styles.actionBtn}
                    title={element.visible ? 'Hide' : 'Show'}
                >
                    <EyeIcon visible={element.visible} />
                </button>
            </div>
        </div>
    );
};

// ============ Context Menu Component ============

const ContextMenu = ({ x, y, element, onClose, onAction }) => {
    const menuRef = useRef(null);
    
    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    
    const menuItems = [
        { label: 'Rename', action: 'rename', shortcut: 'F2' },
        { label: 'Duplicate', action: 'duplicate', shortcut: 'Ctrl+D' },
        { type: 'divider' },
        { label: element?.locked ? 'Unlock' : 'Lock', action: 'toggleLock', shortcut: 'Ctrl+L' },
        { label: element?.visible ? 'Hide' : 'Show', action: 'toggleVisibility', shortcut: 'Ctrl+H' },
        { type: 'divider' },
        { label: 'Bring to Front', action: 'bringToFront', shortcut: ']' },
        { label: 'Bring Forward', action: 'bringForward', shortcut: 'Ctrl+]' },
        { label: 'Send Backward', action: 'sendBackward', shortcut: 'Ctrl+[' },
        { label: 'Send to Back', action: 'sendToBack', shortcut: '[' },
        { type: 'divider' },
        { label: 'Group', action: 'group', shortcut: 'Ctrl+G' },
        { label: 'Ungroup', action: 'ungroup', shortcut: 'Ctrl+Shift+G' },
        { type: 'divider' },
        { label: 'Delete', action: 'delete', shortcut: 'Del', danger: true },
    ];
    
    return (
        <div
            ref={menuRef}
            style={{ ...styles.contextMenu, left: x, top: y }}
        >
            {menuItems.map((item, i) => {
                if (item.type === 'divider') {
                    return <div key={i} style={styles.menuDivider} />;
                }
                return (
                    <button
                        key={i}
                        onClick={() => { onAction(item.action); onClose(); }}
                        style={{
                            ...styles.menuItem,
                            color: item.danger ? '#ff6b6b' : '#fff',
                        }}
                    >
                        <span>{item.label}</span>
                        <span style={styles.shortcut}>{item.shortcut}</span>
                    </button>
                );
            })}
        </div>
    );
};

// ============ Main Component ============

export const EnhancedLayersPanel = ({ className = '' }) => {
    const {
        elements,
        selectedIds,
        hoveredId,
        selectElements,
        addToSelection,
        toggleSelection,
        setHoveredId,
        updateElement,
        deleteElements,
        bringToFront,
        bringForward,
        sendBackward,
        sendToBack,
        groupElements,
        ungroupElements,
        duplicateElements,
    } = useWhiteboardStore();
    
    const [draggedId, setDraggedId] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Filter elements based on search
    const filteredElements = elements.filter(el =>
        el.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Reverse order for display (top layer first)
    const displayElements = [...filteredElements].reverse();
    
    const handleSelect = useCallback((id, shift, ctrl) => {
        if (ctrl) {
            toggleSelection(id);
        } else if (shift && selectedIds.length > 0) {
            const lastSelected = selectedIds[selectedIds.length - 1];
            const lastIndex = elements.findIndex(el => el.id === lastSelected);
            const currentIndex = elements.findIndex(el => el.id === id);
            const start = Math.min(lastIndex, currentIndex);
            const end = Math.max(lastIndex, currentIndex);
            const rangeIds = elements.slice(start, end + 1).map(el => el.id);
            selectElements([...new Set([...selectedIds, ...rangeIds])]);
        } else {
            selectElements([id]);
        }
    }, [elements, selectedIds, selectElements, toggleSelection]);
    
    const handleToggleVisibility = useCallback((id) => {
        const element = elements.find(el => el.id === id);
        if (element) {
            updateElement(id, { visible: !element.visible });
        }
    }, [elements, updateElement]);
    
    const handleToggleLock = useCallback((id) => {
        const element = elements.find(el => el.id === id);
        if (element) {
            updateElement(id, { locked: !element.locked });
        }
    }, [elements, updateElement]);
    
    const handleRename = useCallback((id, name) => {
        updateElement(id, { name });
    }, [updateElement]);
    
    const handleContextMenu = useCallback((e, element) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, element });
    }, []);
    
    const handleContextAction = useCallback((action) => {
        const element = contextMenu?.element;
        if (!element) return;
        
        switch (action) {
            case 'rename':
                // Trigger rename mode - handled in LayerItem
                break;
            case 'duplicate':
                selectElements([element.id]);
                duplicateElements();
                break;
            case 'toggleLock':
                handleToggleLock(element.id);
                break;
            case 'toggleVisibility':
                handleToggleVisibility(element.id);
                break;
            case 'bringToFront':
                selectElements([element.id]);
                bringToFront();
                break;
            case 'bringForward':
                selectElements([element.id]);
                bringForward();
                break;
            case 'sendBackward':
                selectElements([element.id]);
                sendBackward();
                break;
            case 'sendToBack':
                selectElements([element.id]);
                sendToBack();
                break;
            case 'group':
                groupElements(selectedIds.length > 1 ? selectedIds : [element.id]);
                break;
            case 'ungroup':
                ungroupElements([element.id]);
                break;
            case 'delete':
                deleteElements([element.id]);
                break;
        }
    }, [contextMenu, selectedIds, selectElements, duplicateElements, handleToggleLock, handleToggleVisibility, bringToFront, bringForward, sendBackward, sendToBack, groupElements, ungroupElements, deleteElements]);
    
    const handleDragStart = useCallback((e, id) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    }, []);
    
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);
    
    const handleDrop = useCallback((e, targetId) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;
        
        const sourceIndex = elements.findIndex(el => el.id === draggedId);
        const targetIndex = elements.findIndex(el => el.id === targetId);
        
        if (sourceIndex === -1 || targetIndex === -1) return;
        
        const newElements = [...elements];
        const [removed] = newElements.splice(sourceIndex, 1);
        newElements.splice(targetIndex, 0, removed);
        
        useWhiteboardStore.getState().setElements(newElements);
        setDraggedId(null);
    }, [draggedId, elements]);
    
    return (
        <div className={className} style={styles.panel}>
            {/* Header */}
            <div style={styles.header}>
                <span style={styles.title}>Layers</span>
                <span style={styles.count}>{elements.length}</span>
            </div>
            
            {/* Search */}
            <div style={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Search layers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        style={styles.clearSearch}
                    >
                        ×
                    </button>
                )}
            </div>
            
            {/* Layer list */}
            <div style={styles.layerList}>
                {displayElements.length === 0 ? (
                    <div style={styles.emptyState}>
                        {searchQuery ? 'No matching layers' : 'No layers yet'}
                    </div>
                ) : (
                    displayElements.map(element => (
                        <LayerItem
                            key={element.id}
                            element={element}
                            isSelected={selectedIds.includes(element.id)}
                            isHovered={hoveredId === element.id}
                            isDragging={draggedId === element.id}
                            onSelect={handleSelect}
                            onToggleVisibility={handleToggleVisibility}
                            onToggleLock={handleToggleLock}
                            onRename={handleRename}
                            onContextMenu={handleContextMenu}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        />
                    ))
                )}
            </div>
            
            {/* Footer with quick actions */}
            <div style={styles.footer}>
                <button
                    onClick={() => selectElements(elements.filter(e => e.visible && !e.locked).map(e => e.id))}
                    style={styles.footerBtn}
                    title="Select All"
                >
                    ☑
                </button>
                <button
                    onClick={() => elements.forEach(el => updateElement(el.id, { visible: true }))}
                    style={styles.footerBtn}
                    title="Show All"
                >
                    👁
                </button>
                <button
                    onClick={() => elements.forEach(el => updateElement(el.id, { locked: false }))}
                    style={styles.footerBtn}
                    title="Unlock All"
                >
                    🔓
                </button>
            </div>
            
            {/* Context menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    element={contextMenu.element}
                    onClose={() => setContextMenu(null)}
                    onAction={handleContextAction}
                />
            )}
        </div>
    );
};

// ============ Styles ============

const styles = {
    panel: {
        width: 240,
        height: '100%',
        background: '#252525',
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        color: '#fff',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #333',
    },
    title: {
        fontWeight: 600,
        fontSize: 13,
    },
    count: {
        background: '#444',
        padding: '2px 8px',
        borderRadius: 10,
        fontSize: 11,
        color: '#888',
    },
    searchContainer: {
        position: 'relative',
        padding: '8px 12px',
        borderBottom: '1px solid #333',
    },
    searchInput: {
        width: '100%',
        padding: '8px 28px 8px 12px',
        background: '#333',
        border: 'none',
        borderRadius: 6,
        color: '#fff',
        fontSize: 12,
        outline: 'none',
    },
    clearSearch: {
        position: 'absolute',
        right: 20,
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: '#666',
        fontSize: 16,
        cursor: 'pointer',
        padding: 0,
    },
    layerList: {
        flex: 1,
        overflowY: 'auto',
    },
    emptyState: {
        padding: 24,
        textAlign: 'center',
        color: '#666',
    },
    layerItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        cursor: 'pointer',
        borderBottom: '1px solid #2a2a2a',
        transition: 'background 0.1s',
    },
    typeIcon: {
        width: 16,
        textAlign: 'center',
        fontSize: 12,
        color: '#666',
    },
    thumbnail: {
        width: 24,
        height: 24,
        background: '#333',
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    thumbPreview: {
        width: 16,
        height: 16,
    },
    nameContainer: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        minWidth: 0,
    },
    name: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    nameInput: {
        flex: 1,
        background: '#333',
        border: '1px solid #0d99ff',
        borderRadius: 3,
        padding: '2px 6px',
        color: '#fff',
        fontSize: 12,
        outline: 'none',
    },
    blendBadge: {
        padding: '1px 4px',
        background: '#444',
        borderRadius: 2,
        fontSize: 9,
        color: '#888',
        textTransform: 'uppercase',
    },
    actions: {
        display: 'flex',
        gap: 2,
    },
    actionBtn: {
        width: 22,
        height: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        borderRadius: 3,
        cursor: 'pointer',
        opacity: 0.6,
        transition: 'opacity 0.2s',
    },
    footer: {
        display: 'flex',
        gap: 4,
        padding: '8px 12px',
        borderTop: '1px solid #333',
    },
    footerBtn: {
        flex: 1,
        padding: '6px 0',
        background: '#333',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 12,
    },
    contextMenu: {
        position: 'fixed',
        background: '#2a2a2a',
        border: '1px solid #444',
        borderRadius: 6,
        padding: '4px 0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        zIndex: 1000,
        minWidth: 180,
    },
    menuItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        padding: '8px 16px',
        background: 'none',
        border: 'none',
        color: '#fff',
        fontSize: 12,
        cursor: 'pointer',
        textAlign: 'left',
    },
    shortcut: {
        color: '#666',
        fontSize: 11,
    },
    menuDivider: {
        height: 1,
        background: '#444',
        margin: '4px 0',
    },
};

export default EnhancedLayersPanel;
