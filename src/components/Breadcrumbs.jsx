/**
 * Breadcrumbs Component
 * VS Code-style navigation breadcrumbs showing file path
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    Home,
} from 'lucide-react';
import clsx from 'clsx';
import { useWorkspaceStore } from '../stores/workspaceStore';

const BreadcrumbDropdown = ({ items, onSelect, onClose, position }) => {
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 min-w-[200px] max-h-[300px] overflow-auto
                     bg-[#252526] border border-[#454545] rounded shadow-lg py-1"
            style={{ left: position.x, top: position.y }}
        >
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => {
                        onSelect(item);
                        onClose();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs
                             hover:bg-[#094771] transition-colors"
                >
                    {item.type === 'folder' ? (
                        <Folder className="w-4 h-4 text-yellow-500" />
                    ) : (
                        <File className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-[#cccccc] truncate">{item.name}</span>
                </button>
            ))}
            {items.length === 0 && (
                <div className="px-3 py-2 text-xs text-[#858585]">
                    No items
                </div>
            )}
        </div>
    );
};

const BreadcrumbItem = ({ 
    node, 
    isLast, 
    siblings = [],
    onNavigate,
    onSiblingSelect,
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
    const itemRef = useRef(null);

    const handleClick = () => {
        if (node.type === 'file') {
            onNavigate(node);
        } else {
            // Toggle dropdown for folders
            if (itemRef.current) {
                const rect = itemRef.current.getBoundingClientRect();
                setDropdownPosition({ x: rect.left, y: rect.bottom });
            }
            setShowDropdown(!showDropdown);
        }
    };

    const handleChevronClick = (e) => {
        e.stopPropagation();
        if (itemRef.current) {
            const rect = itemRef.current.getBoundingClientRect();
            setDropdownPosition({ x: rect.left, y: rect.bottom });
        }
        setShowDropdown(!showDropdown);
    };

    return (
        <div className="flex items-center" ref={itemRef}>
            <button
                onClick={handleClick}
                className={clsx(
                    'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
                    'hover:bg-[#3c3c3c] transition-colors',
                    isLast ? 'text-[#cccccc]' : 'text-[#858585]'
                )}
            >
                {node.type === 'root' && <Home className="w-3.5 h-3.5" />}
                <span className="max-w-[150px] truncate">{node.name}</span>
            </button>
            
            {!isLast && (
                <button
                    onClick={handleChevronClick}
                    className="p-0.5 hover:bg-[#3c3c3c] rounded"
                >
                    <ChevronRight className="w-3 h-3 text-[#858585]" />
                </button>
            )}

            {showDropdown && siblings.length > 0 && (
                <BreadcrumbDropdown
                    items={siblings}
                    onSelect={onSiblingSelect}
                    onClose={() => setShowDropdown(false)}
                    position={dropdownPosition}
                />
            )}
        </div>
    );
};

const Breadcrumbs = ({ 
    fileId,
    onNavigate,
    className,
}) => {
    const { nodes, getParentChain, getChildren } = useWorkspaceStore();
    
    // Get breadcrumb chain
    const chain = fileId ? getParentChain(fileId) : [];
    
    if (chain.length === 0) {
        return (
            <div className={clsx(
                'flex items-center h-6 px-3 bg-[#1e1e1e] border-b border-[#3c3c3c]',
                className
            )}>
                <span className="text-xs text-[#858585]">No file selected</span>
            </div>
        );
    }

    return (
        <div className={clsx(
            'flex items-center h-6 px-2 bg-[#1e1e1e] border-b border-[#3c3c3c] overflow-x-auto',
            className
        )}>
            <div className="flex items-center min-w-0">
                {chain.map((node, index) => {
                    const isLast = index === chain.length - 1;
                    const siblings = node.parentId 
                        ? getChildren(node.parentId) 
                        : [];

                    return (
                        <BreadcrumbItem
                            key={node.id}
                            node={node}
                            isLast={isLast}
                            siblings={siblings}
                            onNavigate={onNavigate}
                            onSiblingSelect={onNavigate}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default Breadcrumbs;
