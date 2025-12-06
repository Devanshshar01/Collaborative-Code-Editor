/**
 * Figma-style Toolbar Component
 * Left-side tool selection panel matching Figma's design
 */

import React, { useState, useCallback } from 'react';
import { ToolType } from './store';
import clsx from 'clsx';

// Tool icons as SVG components (matching Figma's icons)
const icons = {
    select: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 3l14 9-6.5 1.5L11 20l-1.5-5.5L3 13l2-10z"/>
        </svg>
    ),
    frame: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 3v18M19 3v18M3 5h18M3 19h18"/>
        </svg>
    ),
    rectangle: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
        </svg>
    ),
    ellipse: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="12" rx="9" ry="9"/>
        </svg>
    ),
    polygon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12,2 22,20 2,20"/>
        </svg>
    ),
    star: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
        </svg>
    ),
    line: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="19" x2="19" y2="5"/>
        </svg>
    ),
    arrow: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="19" x2="19" y2="5"/>
            <polyline points="12,5 19,5 19,12"/>
        </svg>
    ),
    pen: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18"/>
            <path d="M2 2l7.586 7.586"/>
        </svg>
    ),
    pencil: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
    ),
    text: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 4h14v3h-2V6H13v12h2v2H9v-2h2V6H7v1H5V4z"/>
        </svg>
    ),
    hand: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3v7h5v2h-5v9h-2v-9H6v-2h5V3h2z"/>
            <path d="M7 4v3H5V4h2zm10 0v3h-2V4h2zM7 17v3H5v-3h2zm10 0v3h-2v-3h2z"/>
        </svg>
    ),
    comment: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
    ),
};

// Tool groups matching Figma's organization
const toolGroups = [
    {
        id: 'selection',
        tools: [
            { id: ToolType.SELECT, label: 'Move', shortcut: 'V', icon: 'select' },
            { id: ToolType.FRAME, label: 'Frame', shortcut: 'F', icon: 'frame' },
        ],
    },
    {
        id: 'shapes',
        tools: [
            { id: ToolType.RECTANGLE, label: 'Rectangle', shortcut: 'R', icon: 'rectangle' },
            { id: ToolType.ELLIPSE, label: 'Ellipse', shortcut: 'O', icon: 'ellipse' },
            { id: ToolType.POLYGON, label: 'Polygon', shortcut: null, icon: 'polygon' },
            { id: ToolType.STAR, label: 'Star', shortcut: null, icon: 'star' },
            { id: ToolType.LINE, label: 'Line', shortcut: 'L', icon: 'line' },
            { id: ToolType.ARROW, label: 'Arrow', shortcut: 'Shift+L', icon: 'arrow' },
        ],
    },
    {
        id: 'drawing',
        tools: [
            { id: ToolType.PEN, label: 'Pen', shortcut: 'P', icon: 'pen' },
            { id: ToolType.PENCIL, label: 'Pencil', shortcut: 'Shift+P', icon: 'pencil' },
        ],
    },
    {
        id: 'text',
        tools: [
            { id: ToolType.TEXT, label: 'Text', shortcut: 'T', icon: 'text' },
        ],
    },
    {
        id: 'navigation',
        tools: [
            { id: ToolType.HAND, label: 'Hand', shortcut: 'H', icon: 'hand' },
            { id: ToolType.COMMENT, label: 'Comment', shortcut: 'C', icon: 'comment' },
        ],
    },
];

// Expandable tool button with dropdown
const ToolButton = ({ tool, isActive, onClick, expanded, onExpand, subTools }) => {
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <div 
            className="figma-tool-wrapper"
            onMouseEnter={() => subTools && setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
        >
            <button
                className={clsx(
                    'figma-tool-button',
                    isActive && 'active',
                    subTools && 'has-dropdown'
                )}
                onClick={() => onClick(tool.id)}
                title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
            >
                {icons[tool.icon]}
                {subTools && (
                    <span className="figma-tool-dropdown-indicator">
                        <svg width="6" height="6" viewBox="0 0 6 6">
                            <path d="M0 0L6 0L3 6Z" fill="currentColor"/>
                        </svg>
                    </span>
                )}
            </button>

            {/* Dropdown for shape variants */}
            {showDropdown && subTools && (
                <div className="figma-tool-dropdown">
                    {subTools.map(subTool => (
                        <button
                            key={subTool.id}
                            className={clsx(
                                'figma-tool-dropdown-item',
                                isActive && subTool.id === tool.id && 'active'
                            )}
                            onClick={() => {
                                onClick(subTool.id);
                                setShowDropdown(false);
                            }}
                        >
                            {icons[subTool.icon]}
                            <span>{subTool.label}</span>
                            {subTool.shortcut && (
                                <span className="figma-tool-shortcut">{subTool.shortcut}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const Toolbar = ({ activeTool, onToolChange }) => {
    // Track which shape tool variant is selected
    const [activeShapeTool, setActiveShapeTool] = useState(ToolType.RECTANGLE);
    const [activeDrawTool, setActiveDrawTool] = useState(ToolType.PEN);

    const handleToolClick = useCallback((toolId) => {
        // Update variant tracking
        if ([ToolType.RECTANGLE, ToolType.ELLIPSE, ToolType.POLYGON, ToolType.STAR, ToolType.LINE, ToolType.ARROW].includes(toolId)) {
            setActiveShapeTool(toolId);
        } else if ([ToolType.PEN, ToolType.PENCIL].includes(toolId)) {
            setActiveDrawTool(toolId);
        }
        onToolChange(toolId);
    }, [onToolChange]);

    // Get the display tool for a group (shows the active variant)
    const getDisplayTool = (group) => {
        if (group.id === 'shapes') {
            return group.tools.find(t => t.id === activeShapeTool) || group.tools[0];
        }
        if (group.id === 'drawing') {
            return group.tools.find(t => t.id === activeDrawTool) || group.tools[0];
        }
        return group.tools[0];
    };

    return (
        <div className="figma-toolbar">
            {toolGroups.map((group, index) => (
                <React.Fragment key={group.id}>
                    {index > 0 && <div className="figma-toolbar-divider" />}
                    
                    {group.tools.length === 1 ? (
                        <ToolButton
                            tool={group.tools[0]}
                            isActive={activeTool === group.tools[0].id}
                            onClick={handleToolClick}
                        />
                    ) : (
                        <ToolButton
                            tool={getDisplayTool(group)}
                            isActive={group.tools.some(t => t.id === activeTool)}
                            onClick={handleToolClick}
                            subTools={group.tools}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default Toolbar;
