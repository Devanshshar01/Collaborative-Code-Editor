/**
 * Figma-style Layers Panel
 * Left sidebar for layer management
 */

import React, { useState, useCallback } from 'react';
import { ElementType } from './store';
import clsx from 'clsx';

// Element type icons
const typeIcons = {
    [ElementType.FRAME]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
            <path d="M2 0v12M10 0v12M0 2h12M0 10h12" strokeWidth="1"/>
        </svg>
    ),
    [ElementType.RECTANGLE]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
            <rect x="1" y="1" width="10" height="10" strokeWidth="1"/>
        </svg>
    ),
    [ElementType.ELLIPSE]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
            <ellipse cx="6" cy="6" rx="5" ry="5" strokeWidth="1"/>
        </svg>
    ),
    [ElementType.POLYGON]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
            <polygon points="6,1 11,10 1,10" strokeWidth="1"/>
        </svg>
    ),
    [ElementType.STAR]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
            <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9 3,11 3.5,7.5 1,5 4.5,4.5" strokeWidth="1"/>
        </svg>
    ),
    [ElementType.LINE]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
            <line x1="1" y1="11" x2="11" y2="1" strokeWidth="1"/>
        </svg>
    ),
    [ElementType.PATH]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
            <path d="M1 11 Q6 1, 11 6" strokeWidth="1"/>
        </svg>
    ),
    [ElementType.TEXT]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <text x="3" y="10" fontSize="10" fontWeight="bold">T</text>
        </svg>
    ),
    [ElementType.GROUP]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
            <rect x="1" y="1" width="6" height="6" strokeWidth="1"/>
            <rect x="5" y="5" width="6" height="6" strokeWidth="1"/>
        </svg>
    ),
    [ElementType.COMPONENT]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
            <polygon points="6,1 11,6 6,11 1,6" strokeWidth="1"/>
        </svg>
    ),
    [ElementType.IMAGE]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
            <rect x="1" y="1" width="10" height="10" strokeWidth="1"/>
            <circle cx="4" cy="4" r="1" fill="currentColor"/>
            <path d="M1 9 L4 6 L7 8 L11 4" strokeWidth="1"/>
        </svg>
    ),
};

// Layer item component
const LayerItem = ({
    element,
    depth = 0,
    isSelected,
    onSelect,
    onToggleVisibility,
    onLock,
    onUnlock,
    onRename,
    onContextMenu,
    expanded,
    onToggleExpand,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(element.name);
    const hasChildren = element.children && element.children.length > 0;

    const handleDoubleClick = useCallback((e) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditName(element.name);
    }, [element.name]);

    const handleNameSubmit = useCallback(() => {
        if (editName.trim()) {
            onRename?.(element.id, editName.trim());
        }
        setIsEditing(false);
    }, [element.id, editName, onRename]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            handleNameSubmit();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditName(element.name);
        }
    }, [handleNameSubmit, element.name]);

    return (
        <>
            <div
                className={clsx(
                    'figma-layer-item',
                    isSelected && 'selected',
                    element.locked && 'locked',
                    !element.visible && 'hidden'
                )}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(element.id, e.shiftKey, e.ctrlKey || e.metaKey);
                }}
                onDoubleClick={handleDoubleClick}
                onContextMenu={(e) => onContextMenu?.(e, element.id)}
            >
                {/* Expand/collapse for groups */}
                {hasChildren && (
                    <button 
                        className="figma-layer-expand"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand?.(element.id);
                        }}
                    >
                        <svg 
                            width="8" height="8" viewBox="0 0 8 8"
                            style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
                        >
                            <path d="M2 1l4 3-4 3V1z" fill="currentColor"/>
                        </svg>
                    </button>
                )}

                {/* Type icon */}
                <span className="figma-layer-icon">
                    {typeIcons[element.type] || typeIcons[ElementType.RECTANGLE]}
                </span>

                {/* Name */}
                {isEditing ? (
                    <input
                        className="figma-layer-name-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleNameSubmit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className="figma-layer-name">{element.name}</span>
                )}

                {/* Actions */}
                <div className="figma-layer-actions">
                    {/* Lock button */}
                    <button
                        className={clsx('figma-layer-action', element.locked && 'active')}
                        onClick={(e) => {
                            e.stopPropagation();
                            element.locked ? onUnlock?.(element.id) : onLock?.(element.id);
                        }}
                        title={element.locked ? 'Unlock' : 'Lock'}
                    >
                        {element.locked ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                <path d="M9 5V4a3 3 0 0 0-6 0v1H2v6h8V5H9zM4 4a2 2 0 0 1 4 0v1H4V4z"/>
                            </svg>
                        ) : (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                <path d="M9 5V4a3 3 0 0 0-5.9-.7l.9.4A2 2 0 0 1 8 4v1H2v6h8V5H9z"/>
                            </svg>
                        )}
                    </button>

                    {/* Visibility button */}
                    <button
                        className={clsx('figma-layer-action', !element.visible && 'active')}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility?.(element.id);
                        }}
                        title={element.visible ? 'Hide' : 'Show'}
                    >
                        {element.visible ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                <path d="M6 3C3 3 1 6 1 6s2 3 5 3 5-3 5-3-2-3-5-3zm0 5a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
                            </svg>
                        ) : (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                <path d="M10.7 1.3L1.3 10.7l.7.7 2.2-2.2c.5.2 1.1.3 1.8.3 3 0 5-3 5-3s-.6-.9-1.7-1.7l2-2-.6-.8zM6 8a2 2 0 0 1-1.7-3l-.9.9C2.3 6.5 2 7 2 7s1.5 2 4 2c.4 0 .8-.1 1.2-.2L6 8z"/>
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Children */}
            {hasChildren && expanded && element.children.map(child => (
                <LayerItem
                    key={child.id}
                    element={child}
                    depth={depth + 1}
                    isSelected={false}
                    onSelect={onSelect}
                    onToggleVisibility={onToggleVisibility}
                    onLock={onLock}
                    onUnlock={onUnlock}
                    onRename={onRename}
                    onContextMenu={onContextMenu}
                />
            ))}
        </>
    );
};

// Main Layers Panel
const LayersPanel = ({
    elements,
    selectedIds,
    onSelect,
    onToggleVisibility,
    onLock,
    onUnlock,
    onReorder,
    onDelete,
    onDuplicate,
    onRename,
}) => {
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [contextMenu, setContextMenu] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Toggle expand/collapse
    const handleToggleExpand = useCallback((id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // Handle selection
    const handleSelect = useCallback((id, shift, ctrl) => {
        if (shift || ctrl) {
            // Multi-select
            if (selectedIds.includes(id)) {
                onSelect(selectedIds.filter(i => i !== id));
            } else {
                onSelect([...selectedIds, id]);
            }
        } else {
            onSelect([id]);
        }
    }, [selectedIds, onSelect]);

    // Handle context menu
    const handleContextMenu = useCallback((e, id) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            elementId: id,
        });
    }, []);

    // Filter elements by search
    const filteredElements = searchQuery 
        ? elements.filter(el => el.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : elements;

    // Reverse to show top layer first (like Figma)
    const reversedElements = [...filteredElements].reverse();

    return (
        <div className="figma-layers-panel">
            {/* Header */}
            <div className="figma-layers-header">
                <span>Layers</span>
                <div className="figma-layers-header-actions">
                    <button className="figma-layers-action" title="Assets">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="figma-layers-search">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M5 1a4 4 0 1 0 2.5 7.1l2.7 2.7.7-.7-2.7-2.7A4 4 0 0 0 5 1zm0 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
                </svg>
                <input
                    type="text"
                    placeholder="Search layers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="figma-layers-search-input"
                />
            </div>

            {/* Page/Frame tabs */}
            <div className="figma-layers-tabs">
                <button className="figma-layers-tab active">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M2 1h8v2H2V1zm0 4h8v6H2V5z"/>
                    </svg>
                    Page 1
                </button>
            </div>

            {/* Layer list */}
            <div className="figma-layers-list">
                {reversedElements.length === 0 ? (
                    <div className="figma-layers-empty">
                        <p>No layers yet</p>
                        <span>Create a shape to get started</span>
                    </div>
                ) : (
                    reversedElements.map(element => (
                        <LayerItem
                            key={element.id}
                            element={element}
                            isSelected={selectedIds.includes(element.id)}
                            onSelect={handleSelect}
                            onToggleVisibility={onToggleVisibility}
                            onLock={(id) => onLock([id])}
                            onUnlock={(id) => onUnlock([id])}
                            onRename={(id, name) => onRename?.(id, { name })}
                            onContextMenu={handleContextMenu}
                            expanded={expandedIds.has(element.id)}
                            onToggleExpand={handleToggleExpand}
                        />
                    ))
                )}
            </div>

            {/* Context menu */}
            {contextMenu && (
                <div 
                    className="figma-layers-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={() => setContextMenu(null)}
                >
                    <button onClick={() => onDuplicate?.(contextMenu.elementId)}>
                        Duplicate
                    </button>
                    <button onClick={() => onDelete?.(contextMenu.elementId)}>
                        Delete
                    </button>
                    <div className="figma-context-divider" />
                    <button onClick={() => onReorder?.(contextMenu.elementId, 'up')}>
                        Bring Forward
                    </button>
                    <button onClick={() => onReorder?.(contextMenu.elementId, 'down')}>
                        Send Backward
                    </button>
                </div>
            )}
        </div>
    );
};

export default LayersPanel;
