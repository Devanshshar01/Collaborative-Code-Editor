/**
 * Context Menu Component
 * Right-click menu for elements
 */

import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

const ContextMenu = ({
    x,
    y,
    elementId,
    onClose,
    onCopy,
    onCut,
    onPaste,
    onDuplicate,
    onDelete,
    onBringToFront,
    onSendToBack,
    onGroup,
    onUngroup,
    onLock,
}) => {
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    // Close on escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Adjust position to stay in viewport
    const adjustedX = Math.min(x, window.innerWidth - 200);
    const adjustedY = Math.min(y, window.innerHeight - 400);

    const menuItems = [
        { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', onClick: onCopy },
        { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X', onClick: onCut },
        { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V', onClick: onPaste },
        { id: 'duplicate', label: 'Duplicate', shortcut: 'Ctrl+D', onClick: onDuplicate },
        { type: 'separator' },
        { id: 'delete', label: 'Delete', shortcut: 'Del', onClick: onDelete },
        { type: 'separator' },
        { id: 'group', label: 'Group selection', shortcut: 'Ctrl+G', onClick: onGroup },
        { id: 'ungroup', label: 'Ungroup', shortcut: 'Ctrl+Shift+G', onClick: onUngroup },
        { type: 'separator' },
        { id: 'bring-front', label: 'Bring to front', shortcut: ']', onClick: onBringToFront },
        { id: 'send-back', label: 'Send to back', shortcut: '[', onClick: onSendToBack },
        { type: 'separator' },
        { id: 'lock', label: 'Lock', shortcut: 'Ctrl+Shift+L', onClick: onLock },
    ];

    return (
        <div
            ref={menuRef}
            className="figma-context-menu"
            style={{ left: adjustedX, top: adjustedY }}
        >
            {menuItems.map((item, index) => {
                if (item.type === 'separator') {
                    return <div key={index} className="figma-context-separator" />;
                }
                
                return (
                    <button
                        key={item.id}
                        className="figma-context-item"
                        onClick={() => {
                            item.onClick?.();
                            onClose();
                        }}
                    >
                        <span>{item.label}</span>
                        {item.shortcut && (
                            <span className="figma-context-shortcut">{item.shortcut}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default ContextMenu;
