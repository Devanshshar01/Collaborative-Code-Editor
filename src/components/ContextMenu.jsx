/**
 * Context Menu Component
 * VS Code-style right-click context menu
 */

import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

const ContextMenu = ({ x, y, items, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Adjust position to keep menu in viewport
    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let adjustedX = x;
            let adjustedY = y;

            if (x + rect.width > viewportWidth) {
                adjustedX = viewportWidth - rect.width - 10;
            }

            if (y + rect.height > viewportHeight) {
                adjustedY = viewportHeight - rect.height - 10;
            }

            menuRef.current.style.left = `${adjustedX}px`;
            menuRef.current.style.top = `${adjustedY}px`;
        }
    }, [x, y]);

    return (
        <div
            ref={menuRef}
            className="fixed z-50 min-w-[180px] bg-[#252526] border border-[#454545] 
                     rounded shadow-lg py-1"
            style={{ left: x, top: y }}
        >
            {items.map((item, index) => {
                if (item.type === 'separator') {
                    return (
                        <div
                            key={`sep-${index}`}
                            className="h-px bg-[#454545] my-1"
                        />
                    );
                }

                const Icon = item.icon;

                return (
                    <button
                        key={item.label}
                        onClick={() => {
                            item.action?.();
                            onClose();
                        }}
                        disabled={item.disabled}
                        className={clsx(
                            'w-full flex items-center gap-3 px-3 py-1.5 text-left text-xs',
                            'hover:bg-[#094771] transition-colors',
                            item.disabled && 'opacity-50 cursor-not-allowed',
                            item.danger && 'text-red-400 hover:text-red-300'
                        )}
                    >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && (
                            <span className="text-[#858585] text-[10px]">
                                {item.shortcut}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default ContextMenu;
