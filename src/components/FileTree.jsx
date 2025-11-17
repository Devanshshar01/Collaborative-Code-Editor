import React, {useState, useEffect, useCallback, useRef} from 'react';
import './FileTree.css';

const FileTree = ({fileTreeManager, activeFileId, onFileSelect, onFileTreeChange}) => {
    const [fileTree, setFileTree] = useState({});
    const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
    const [contextMenu, setContextMenu] = useState(null);
    const [renamingNode, setRenamingNode] = useState(null);
    const [draggedNode, setDraggedNode] = useState(null);
    const [dropTarget, setDropTarget] = useState(null);
    const inputRef = useRef(null);

    // Load file tree
    const loadFileTree = useCallback(() => {
        if (!fileTreeManager) return;

        const data = fileTreeManager.getFileTreeData();
        setFileTree(data.files);

        if (onFileTreeChange) {
            onFileTreeChange(data);
        }
    }, [fileTreeManager, onFileTreeChange]);

    // Initialize and subscribe to changes
    useEffect(() => {
        if (!fileTreeManager) return;

        fileTreeManager.initialize();
        loadFileTree();

        // Subscribe to Yjs changes
        const filesMap = fileTreeManager.ydoc.getMap('files');
        const observer = () => {
            loadFileTree();
        };

        filesMap.observe(observer);

        return () => {
            filesMap.unobserve(observer);
        };
    }, [fileTreeManager, loadFileTree]);

    // Focus input when renaming
    useEffect(() => {
        if (renamingNode && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [renamingNode]);

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // Toggle folder expansion
    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    // Create new file
    const handleCreateFile = (parentId) => {
        try {
            const fileId = fileTreeManager.createFile(parentId, 'untitled.txt', '');
            if (fileId && onFileSelect) {
                onFileSelect(fileId);
            }
            setExpandedFolders(prev => new Set([...prev, parentId]));
            setContextMenu(null);

            // Start renaming the new file
            setTimeout(() => setRenamingNode(fileId), 100);
        } catch (error) {
            console.error('Error creating file:', error);
            alert(error.message);
        }
    };

    // Create new folder
    const handleCreateFolder = (parentId) => {
        try {
            const folderId = fileTreeManager.createFolder(parentId, 'New Folder');
            setExpandedFolders(prev => new Set([...prev, parentId, folderId]));
            setContextMenu(null);

            // Start renaming the new folder
            setTimeout(() => setRenamingNode(folderId), 100);
        } catch (error) {
            console.error('Error creating folder:', error);
            alert(error.message);
        }
    };

    // Delete node
    const handleDelete = (nodeId) => {
        const node = fileTree[nodeId];
        if (!node) return;

        const confirmMessage = node.type === 'folder'
            ? `Delete folder "${node.name}" and all its contents?`
            : `Delete file "${node.name}"?`;

        if (window.confirm(confirmMessage)) {
            try {
                fileTreeManager.deleteNode(nodeId);
                setContextMenu(null);

                // If deleted file was active, clear selection
                if (nodeId === activeFileId && onFileSelect) {
                    onFileSelect(null);
                }
            } catch (error) {
                console.error('Error deleting node:', error);
                alert(error.message);
            }
        }
    };

    // Start renaming
    const handleStartRename = (nodeId) => {
        setRenamingNode(nodeId);
        setContextMenu(null);
    };

    // Complete renaming
    const handleRename = (nodeId, newName) => {
        if (!newName || newName.trim() === '') {
            setRenamingNode(null);
            return;
        }

        try {
            fileTreeManager.renameNode(nodeId, newName);
            setRenamingNode(null);
        } catch (error) {
            console.error('Error renaming node:', error);
            alert(error.message);
        }
    };

    // Context menu
    const handleContextMenu = (e, nodeId) => {
        e.preventDefault();
        e.stopPropagation();

        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            nodeId
        });
    };

    // Drag and drop handlers
    const handleDragStart = (e, nodeId) => {
        setDraggedNode(nodeId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', nodeId);
    };

    const handleDragOver = (e, nodeId) => {
        e.preventDefault();
        e.stopPropagation();

        const node = fileTree[nodeId];
        if (node && node.type === 'folder' && nodeId !== draggedNode) {
            e.dataTransfer.dropEffect = 'move';
            setDropTarget(nodeId);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDropTarget(null);
    };

    const handleDrop = (e, targetId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedNode || draggedNode === targetId) {
            setDraggedNode(null);
            setDropTarget(null);
            return;
        }

        try {
            fileTreeManager.moveNode(draggedNode, targetId);
            setExpandedFolders(prev => new Set([...prev, targetId]));
        } catch (error) {
            console.error('Error moving node:', error);
            alert(error.message);
        } finally {
            setDraggedNode(null);
            setDropTarget(null);
        }
    };

    const handleDragEnd = () => {
        setDraggedNode(null);
        setDropTarget(null);
    };

    // Get file icon based on extension
    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            js: '📜',
            jsx: '⚛️',
            ts: '📘',
            tsx: '⚛️',
            py: '🐍',
            java: '☕',
            cpp: '⚙️',
            c: '⚙️',
            go: '🐹',
            html: '🌐',
            css: '🎨',
            json: '📋',
            md: '📝',
            txt: '📄'
        };
        return icons[ext] || '📄';
    };

    // Render file/folder node
    const renderNode = (nodeId, depth = 0) => {
        const node = fileTree[nodeId];
        if (!node) return null;

        const isExpanded = expandedFolders.has(nodeId);
        const isActive = nodeId === activeFileId;
        const isRenaming = nodeId === renamingNode;
        const isDragging = nodeId === draggedNode;
        const isDropTarget = nodeId === dropTarget;

        return (
            <div key={nodeId} className="file-tree-node">
                <div
                    className={`node-content ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''}`}
                    style={{paddingLeft: `${depth * 20 + 8}px`}}
                    draggable={nodeId !== 'root'}
                    onDragStart={(e) => handleDragStart(e, nodeId)}
                    onDragOver={(e) => handleDragOver(e, nodeId)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, nodeId)}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                        if (node.type === 'file' && onFileSelect) {
                            onFileSelect(nodeId);
                        } else if (node.type === 'folder') {
                            toggleFolder(nodeId);
                        }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, nodeId)}
                >
                    {node.type === 'folder' && (
                        <span className="folder-arrow" onClick={(e) => {
                            e.stopPropagation();
                            toggleFolder(nodeId);
                        }}>
              {isExpanded ? '▼' : '▶'}
            </span>
                    )}

                    <span className="node-icon">
            {node.type === 'folder' ? (isExpanded ? '📂' : '📁') : getFileIcon(node.name)}
          </span>

                    {isRenaming ? (
                        <input
                            ref={inputRef}
                            type="text"
                            className="rename-input"
                            defaultValue={node.name}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) => handleRename(nodeId, e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleRename(nodeId, e.target.value);
                                } else if (e.key === 'Escape') {
                                    setRenamingNode(null);
                                }
                                e.stopPropagation();
                            }}
                        />
                    ) : (
                        <span className="node-name" title={node.path}>
              {node.name}
            </span>
                    )}
                </div>

                {node.type === 'folder' && isExpanded && node.children && (
                    <div className="node-children">
                        {node.children.map(childId => renderNode(childId, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="file-tree">
            <div className="file-tree-header">
                <h3>Files</h3>
                <div className="header-actions">
                    <button
                        className="icon-button"
                        onClick={() => handleCreateFile('root')}
                        title="New File"
                    >
                        📄+
                    </button>
                    <button
                        className="icon-button"
                        onClick={() => handleCreateFolder('root')}
                        title="New Folder"
                    >
                        📁+
                    </button>
                </div>
            </div>

            <div className="file-tree-content">
                {fileTree.root ? renderNode('root') : (
                    <div className="empty-state">
                        <p>No files yet</p>
                        <button onClick={() => handleCreateFile('root')}>
                            Create your first file
                        </button>
                    </div>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="context-menu"
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {fileTree[contextMenu.nodeId]?.type === 'folder' && (
                        <>
                            <div className="context-menu-item" onClick={() => handleCreateFile(contextMenu.nodeId)}>
                                📄 New File
                            </div>
                            <div className="context-menu-item" onClick={() => handleCreateFolder(contextMenu.nodeId)}>
                                📁 New Folder
                            </div>
                            <div className="context-menu-divider"></div>
                        </>
                    )}

                    {contextMenu.nodeId !== 'root' && (
                        <>
                            <div className="context-menu-item" onClick={() => handleStartRename(contextMenu.nodeId)}>
                                ✏️ Rename
                            </div>
                            <div className="context-menu-item danger" onClick={() => handleDelete(contextMenu.nodeId)}>
                                🗑️ Delete
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileTree;
