/**
 * VS Code-style File Explorer Component
 * Features: Virtualized tree, drag/drop, multi-select, git status, context menus
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    FolderOpen,
    FileCode,
    FileJson,
    FileText,
    Image,
    FileType,
    Settings,
    Package,
    Code2,
    Braces,
    Hash,
    Database,
    Globe,
    Cog,
    GitBranch,
    Plus,
    Trash2,
    Edit3,
    Copy,
    Scissors,
    Clipboard,
    RefreshCw,
    Search,
    FolderPlus,
    FilePlus,
    MoreHorizontal,
    X,
} from 'lucide-react';
import clsx from 'clsx';
import { useWorkspaceStore, GitStatus } from '../stores/workspaceStore';
import ContextMenu from './ContextMenu';

// File icon mapping based on extension
const getFileIcon = (name, isFolder, isExpanded) => {
    if (isFolder) {
        return isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-500" />
        ) : (
            <Folder className="w-4 h-4 text-yellow-500" />
        );
    }

    const ext = name.split('.').pop()?.toLowerCase();
    
    const iconMap = {
        // JavaScript/TypeScript
        js: <FileCode className="w-4 h-4 text-yellow-400" />,
        jsx: <FileCode className="w-4 h-4 text-[#61DAFB]" />,
        ts: <FileCode className="w-4 h-4 text-blue-500" />,
        tsx: <FileCode className="w-4 h-4 text-blue-400" />,
        
        // Web
        html: <Globe className="w-4 h-4 text-orange-500" />,
        htm: <Globe className="w-4 h-4 text-orange-500" />,
        css: <Hash className="w-4 h-4 text-blue-500" />,
        scss: <Hash className="w-4 h-4 text-pink-400" />,
        less: <Hash className="w-4 h-4 text-blue-400" />,
        
        // Data
        json: <Braces className="w-4 h-4 text-yellow-500" />,
        yaml: <FileText className="w-4 h-4 text-red-400" />,
        yml: <FileText className="w-4 h-4 text-red-400" />,
        xml: <FileText className="w-4 h-4 text-orange-400" />,
        csv: <Database className="w-4 h-4 text-green-500" />,
        sql: <Database className="w-4 h-4 text-blue-400" />,
        
        // Programming
        py: <FileCode className="w-4 h-4 text-yellow-500" />,
        java: <FileCode className="w-4 h-4 text-red-500" />,
        cpp: <FileCode className="w-4 h-4 text-blue-500" />,
        c: <FileCode className="w-4 h-4 text-blue-400" />,
        h: <FileCode className="w-4 h-4 text-purple-400" />,
        go: <FileCode className="w-4 h-4 text-cyan-400" />,
        rs: <FileCode className="w-4 h-4 text-orange-500" />,
        rb: <FileCode className="w-4 h-4 text-red-500" />,
        php: <FileCode className="w-4 h-4 text-purple-500" />,
        swift: <FileCode className="w-4 h-4 text-orange-400" />,
        kt: <FileCode className="w-4 h-4 text-purple-400" />,
        
        // Config
        gitignore: <GitBranch className="w-4 h-4 text-orange-500" />,
        env: <Cog className="w-4 h-4 text-yellow-500" />,
        config: <Settings className="w-4 h-4 text-gray-400" />,
        toml: <Settings className="w-4 h-4 text-gray-400" />,
        ini: <Settings className="w-4 h-4 text-gray-400" />,
        
        // Documentation
        md: <FileText className="w-4 h-4 text-blue-400" />,
        txt: <FileText className="w-4 h-4 text-gray-400" />,
        pdf: <FileType className="w-4 h-4 text-red-500" />,
        doc: <FileType className="w-4 h-4 text-blue-500" />,
        docx: <FileType className="w-4 h-4 text-blue-500" />,
        
        // Images
        png: <Image className="w-4 h-4 text-purple-400" />,
        jpg: <Image className="w-4 h-4 text-purple-400" />,
        jpeg: <Image className="w-4 h-4 text-purple-400" />,
        gif: <Image className="w-4 h-4 text-purple-400" />,
        svg: <Image className="w-4 h-4 text-orange-400" />,
        ico: <Image className="w-4 h-4 text-yellow-400" />,
        
        // Package
        'package.json': <Package className="w-4 h-4 text-green-500" />,
        'package-lock.json': <Package className="w-4 h-4 text-red-400" />,
        'yarn.lock': <Package className="w-4 h-4 text-blue-400" />,
    };

    // Check full filename first
    if (iconMap[name.toLowerCase()]) {
        return iconMap[name.toLowerCase()];
    }

    return iconMap[ext] || <File className="w-4 h-4 text-gray-400" />;
};

// Git status badge
const GitStatusBadge = ({ status }) => {
    if (!status) return null;

    const statusConfig = {
        [GitStatus.MODIFIED]: { color: 'text-yellow-500', label: 'M' },
        [GitStatus.ADDED]: { color: 'text-green-500', label: 'A' },
        [GitStatus.DELETED]: { color: 'text-red-500', label: 'D' },
        [GitStatus.UNTRACKED]: { color: 'text-green-400', label: 'U' },
        [GitStatus.RENAMED]: { color: 'text-blue-400', label: 'R' },
        [GitStatus.CONFLICT]: { color: 'text-red-600', label: '!' },
    };

    const config = statusConfig[status] || { color: 'text-gray-400', label: '?' };

    return (
        <span className={clsx('text-[10px] font-bold ml-auto', config.color)}>
            {config.label}
        </span>
    );
};

// Single tree node component
const TreeNode = React.memo(({
    node,
    depth,
    isSelected,
    isActive,
    isDragOver,
    onToggle,
    onSelect,
    onDoubleClick,
    onContextMenu,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onRename,
    onRenameComplete,
}) => {
    const [editName, setEditName] = useState(node.name);
    const inputRef = useRef(null);
    const isExpanded = node.type !== 'file' && node.expanded;

    useEffect(() => {
        if (node.isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [node.isRenaming]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onRenameComplete(node.id, editName);
        } else if (e.key === 'Escape') {
            setEditName(node.name);
            onRenameComplete(node.id, node.name);
        }
    };

    return (
        <div
            className={clsx(
                'flex items-center gap-1 px-2 py-[3px] cursor-pointer select-none group',
                'hover:bg-[#2a2d2e] transition-colors duration-75',
                isSelected && 'bg-[#094771]',
                isActive && !isSelected && 'bg-[#37373d]',
                isDragOver && 'bg-[#383b3d] border-t border-blue-500'
            )}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={(e) => onSelect(node.id, e.ctrlKey, e.shiftKey)}
            onDoubleClick={() => onDoubleClick(node)}
            onContextMenu={(e) => onContextMenu(e, node)}
            draggable
            onDragStart={(e) => onDragStart(e, node)}
            onDragOver={(e) => onDragOver(e, node)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, node)}
        >
            {/* Expand/collapse arrow */}
            {node.type !== 'file' ? (
                <button
                    className="p-0.5 hover:bg-[#3c3c3c] rounded"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(node.id);
                    }}
                >
                    {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#858585]" />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#858585]" />
                    )}
                </button>
            ) : (
                <span className="w-4" />
            )}

            {/* File/Folder icon */}
            {getFileIcon(node.name, node.type === 'folder', isExpanded)}

            {/* Name or rename input */}
            {node.isRenaming ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => onRenameComplete(node.id, editName)}
                    className="flex-1 bg-[#3c3c3c] text-[#cccccc] text-xs px-1 py-0.5 
                             border border-[#007acc] outline-none rounded"
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span className={clsx(
                    'text-xs truncate flex-1',
                    node.gitStatus ? 'text-[#cccccc]' : 'text-[#cccccc]'
                )}>
                    {node.name}
                </span>
            )}

            {/* Git status */}
            <GitStatusBadge status={node.gitStatus} />
        </div>
    );
});

TreeNode.displayName = 'TreeNode';

// Main File Explorer component
const FileExplorer = ({
    fileTreeManager,
    files = [],
    onFileSelect,
    onFileOpen,
    onCreateFile,
    onCreateFolder,
    onRename,
    onDelete,
    className,
}) => {
    const parentRef = useRef(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    
    // Zustand store
    const {
        nodes,
        roots,
        activeFileId,
        selectedIds,
        expandedIds,
        setFileTree,
        addNode,
        removeNode,
        renameNode,
        moveNode,
        toggleExpanded,
        selectNode,
        setActiveFile,
        startRenaming,
        stopRenaming,
        copyToClipboard,
        cutToClipboard,
        pasteFromClipboard,
        expandAll,
        collapseAll,
        getFlattenedTree,
        initWorkspace,
    } = useWorkspaceStore();

    // Initialize from files prop (simple array format)
    useEffect(() => {
        if (files && files.length > 0 && !fileTreeManager) {
            initWorkspace('/', 'EXPLORER');
            
            // Convert simple file tree to our format
            const processNode = (node, parentId = 'root', depth = 0) => {
                const id = node.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const path = node.path || node.name;
                
                addNode(parentId, node.name, node.type || 'file', node.content || '', path);
                
                if (node.children && Array.isArray(node.children)) {
                    node.children.forEach(child => processNode(child, id, depth + 1));
                }
            };

            // Clear existing and rebuild
            files.forEach(node => processNode(node));
        }
    }, [files]);

    // Initialize from fileTreeManager
    useEffect(() => {
        if (!fileTreeManager) {
            // Initialize empty workspace if no files either
            if (!files || files.length === 0) {
                initWorkspace('/', 'Workspace');
            }
            return;
        }

        const loadTree = () => {
            const data = fileTreeManager.getFileTreeData();
            initWorkspace('/', 'EXPLORER');
            
            // Convert fileTreeManager data to our format
            const convertNode = (nodeData, parentId) => {
                const id = nodeData.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                return {
                    id,
                    name: nodeData.name,
                    type: nodeData.type,
                    parentId,
                    content: nodeData.content,
                    path: nodeData.path || nodeData.name,
                    children: nodeData.children?.map(child => convertNode(child, id)) || [],
                };
            };

            if (data.files) {
                Object.entries(data.files).forEach(([id, file]) => {
                    if (file.parentId === 'root' || !file.parentId) {
                        setFileTree(file, 'root');
                    }
                });
            }
        };

        loadTree();

        // Subscribe to changes
        const filesMap = fileTreeManager.ydoc?.getMap('files');
        if (filesMap) {
            const observer = () => loadTree();
            filesMap.observe(observer);
            return () => filesMap.unobserve(observer);
        }
    }, [fileTreeManager, initWorkspace, setFileTree]);

    // Get flattened tree for virtualization
    const flatTree = useMemo(() => getFlattenedTree(), [nodes, expandedIds, roots]);

    // Virtual list
    const virtualizer = useVirtualizer({
        count: flatTree.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 22,
        overscan: 10,
    });

    // Handlers
    const handleToggle = useCallback((nodeId) => {
        toggleExpanded(nodeId);
    }, [toggleExpanded]);

    const handleSelect = useCallback((nodeId, multi, range) => {
        selectNode(nodeId, multi, range);
    }, [selectNode]);

    const handleDoubleClick = useCallback((node) => {
        if (node.type === 'file') {
            setActiveFile(node.id);
            onFileOpen?.(node);
            onFileSelect?.(node);
        } else {
            toggleExpanded(node.id);
        }
    }, [setActiveFile, toggleExpanded, onFileOpen, onFileSelect]);

    const handleContextMenu = useCallback((e, node) => {
        e.preventDefault();
        selectNode(node.id, false, false);
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            node,
        });
    }, [selectNode]);

    const handleDragStart = useCallback((e, node) => {
        e.dataTransfer.setData('text/plain', node.id);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e, node) => {
        e.preventDefault();
        if (node.type !== 'file') {
            setDragOverId(node.id);
        }
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOverId(null);
    }, []);

    const handleDrop = useCallback((e, targetNode) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData('text/plain');
        
        if (sourceId && sourceId !== targetNode.id) {
            const targetId = targetNode.type === 'file' ? targetNode.parentId : targetNode.id;
            moveNode(sourceId, targetId);
        }
        
        setDragOverId(null);
    }, [moveNode]);

    const handleRenameComplete = useCallback((nodeId, newName) => {
        const node = nodes.get(nodeId);
        const oldPath = node?.path;
        
        if (newName && newName.trim()) {
            renameNode(nodeId, newName.trim());
            
            // Calculate new path
            if (oldPath) {
                const pathParts = oldPath.split('/');
                pathParts[pathParts.length - 1] = newName.trim();
                const newPath = pathParts.join('/');
                onRename?.(oldPath, newPath);
            }
        }
        stopRenaming(nodeId);
    }, [renameNode, stopRenaming, nodes, onRename]);

    // Context menu actions
    const handleNewFile = useCallback(() => {
        const parentId = contextMenu?.node?.type === 'folder' 
            ? contextMenu.node.id 
            : contextMenu?.node?.parentId || 'root';
        
        const parentNode = nodes.get(parentId);
        const parentPath = parentNode?.path || '';
        
        const newId = addNode(parentId, 'untitled.txt', 'file', '');
        if (newId) {
            startRenaming(newId);
            onCreateFile?.(parentPath, 'untitled.txt');
        }
        setContextMenu(null);
    }, [contextMenu, addNode, startRenaming, nodes, onCreateFile]);

    const handleNewFolder = useCallback(() => {
        const parentId = contextMenu?.node?.type === 'folder'
            ? contextMenu.node.id
            : contextMenu?.node?.parentId || 'root';
        
        const parentNode = nodes.get(parentId);
        const parentPath = parentNode?.path || '';
        
        const newId = addNode(parentId, 'New Folder', 'folder');
        if (newId) {
            startRenaming(newId);
            onCreateFolder?.(parentPath, 'New Folder');
        }
        setContextMenu(null);
    }, [contextMenu, addNode, startRenaming, nodes, onCreateFolder]);

    const handleDelete = useCallback(() => {
        if (contextMenu?.node) {
            const confirmMsg = contextMenu.node.type === 'folder'
                ? `Delete folder "${contextMenu.node.name}" and all contents?`
                : `Delete "${contextMenu.node.name}"?`;
            
            if (window.confirm(confirmMsg)) {
                removeNode(contextMenu.node.id);
                onDelete?.(contextMenu.node.path);
            }
        }
        setContextMenu(null);
    }, [contextMenu, removeNode, onDelete]);

    const handleRename = useCallback(() => {
        if (contextMenu?.node) {
            startRenaming(contextMenu.node.id);
        }
        setContextMenu(null);
    }, [contextMenu, startRenaming]);

    const handleCopy = useCallback(() => {
        if (contextMenu?.node) {
            copyToClipboard(new Set([contextMenu.node.id]));
        }
        setContextMenu(null);
    }, [contextMenu, copyToClipboard]);

    const handleCut = useCallback(() => {
        if (contextMenu?.node) {
            cutToClipboard(new Set([contextMenu.node.id]));
        }
        setContextMenu(null);
    }, [contextMenu, cutToClipboard]);

    const handlePaste = useCallback(() => {
        if (contextMenu?.node) {
            pasteFromClipboard(contextMenu.node.id);
        }
        setContextMenu(null);
    }, [contextMenu, pasteFromClipboard]);

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2' && selectedIds.size === 1) {
                const nodeId = Array.from(selectedIds)[0];
                startRenaming(nodeId);
            } else if (e.key === 'Delete' && selectedIds.size > 0) {
                // Delete selected items
                if (window.confirm(`Delete ${selectedIds.size} item(s)?`)) {
                    selectedIds.forEach(id => removeNode(id));
                }
            } else if (e.ctrlKey && e.key === 'c') {
                copyToClipboard(selectedIds);
            } else if (e.ctrlKey && e.key === 'x') {
                cutToClipboard(selectedIds);
            } else if (e.ctrlKey && e.key === 'v') {
                const targetId = selectedIds.size === 1 
                    ? Array.from(selectedIds)[0] 
                    : 'root';
                pasteFromClipboard(targetId);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, startRenaming, removeNode, copyToClipboard, cutToClipboard, pasteFromClipboard]);

    const contextMenuItems = [
        { icon: FilePlus, label: 'New File', action: handleNewFile, shortcut: 'Ctrl+N' },
        { icon: FolderPlus, label: 'New Folder', action: handleNewFolder },
        { type: 'separator' },
        { icon: Edit3, label: 'Rename', action: handleRename, shortcut: 'F2' },
        { icon: Trash2, label: 'Delete', action: handleDelete, shortcut: 'Delete', danger: true },
        { type: 'separator' },
        { icon: Copy, label: 'Copy', action: handleCopy, shortcut: 'Ctrl+C' },
        { icon: Scissors, label: 'Cut', action: handleCut, shortcut: 'Ctrl+X' },
        { icon: Clipboard, label: 'Paste', action: handlePaste, shortcut: 'Ctrl+V' },
    ];

    return (
        <div className={clsx('flex flex-col h-full bg-[#252526]', className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 text-[11px] font-medium 
                          text-[#bbbbbb] uppercase tracking-wider border-b border-[#3c3c3c]">
                <span>Explorer</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handleNewFile()}
                        className="p-1 hover:bg-[#3c3c3c] rounded"
                        title="New File"
                    >
                        <FilePlus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleNewFolder()}
                        className="p-1 hover:bg-[#3c3c3c] rounded"
                        title="New Folder"
                    >
                        <FolderPlus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={collapseAll}
                        className="p-1 hover:bg-[#3c3c3c] rounded"
                        title="Collapse All"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* File Tree */}
            <div 
                ref={parentRef}
                className="flex-1 overflow-auto"
                style={{ height: '100%' }}
            >
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                        const node = flatTree[virtualRow.index];
                        if (!node) return null;

                        return (
                            <div
                                key={node.id}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <TreeNode
                                    node={{ ...node, expanded: expandedIds.has(node.id) }}
                                    depth={node.depth}
                                    isSelected={selectedIds.has(node.id)}
                                    isActive={activeFileId === node.id}
                                    isDragOver={dragOverId === node.id}
                                    onToggle={handleToggle}
                                    onSelect={handleSelect}
                                    onDoubleClick={handleDoubleClick}
                                    onContextMenu={handleContextMenu}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onRename={startRenaming}
                                    onRenameComplete={handleRenameComplete}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Empty state */}
            {flatTree.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-[#858585] text-sm p-4">
                    <Folder className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-center">No files yet</p>
                    <p className="text-xs text-center mt-1">
                        Create a new file or folder to get started
                    </p>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={contextMenuItems}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};

export default FileExplorer;
