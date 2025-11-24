import React, { useState, useRef } from 'react';
import {
    Upload,
    Download,
    FolderPlus,
    FilePlus,
    Trash2,
    File,
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    MoreVertical,
    Edit3,
    Check,
    X as XIcon,
    Archive
} from 'lucide-react';
import clsx from 'clsx';

const FileManager = ({ files, onFileClick, onCreateFile, onCreateFolder, onDeleteFile, onRenameFile }) => {
    const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
    const [selectedFile, setSelectedFile] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [renaming, setRenaming] = useState(null);
    const [newName, setNewName] = useState('');
    const fileInputRef = useRef(null);

    const toggleFolder = (path) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedFolders(newExpanded);
    };

    const handleFileClick = (file) => {
        setSelectedFile(file.path);
        onFileClick?.(file);
    };

    const handleContextMenu = (e, file) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, file });
    };

    const handleRename = (file) => {
        setRenaming(file.path);
        setNewName(file.name);
        setContextMenu(null);
    };

    const handleRenameSubmit = () => {
        if (newName.trim() && renaming) {
            onRenameFile?.(renaming, newName.trim());
            setRenaming(null);
            setNewName('');
        }
    };

    const handleUpload = async (event) => {
        const files = Array.from(event.target.files);
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onCreateFile?.({
                    name: file.name,
                    content: e.target.result,
                    type: 'file'
                });
            };
            reader.readAsText(file);
        }
        event.target.value = '';
    };

    const handleDownloadProject = () => {
        // Create a simple text representation of all files
        const content = JSON.stringify(files, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadFile = (file) => {
        const blob = new Blob([file.content || ''], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        setContextMenu(null);
    };

    const renderFileTree = (items, parentPath = '') => {
        if (!Array.isArray(items)) return null;

        return items.map((item) => {
            const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;
            const isExpanded = expandedFolders.has(fullPath);
            const isSelected = selectedFile === fullPath;
            const isRenaming = renaming === fullPath;

            return (
                <div key={fullPath}>
                    <div
                        className={clsx(
                            'flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-white/5 rounded text-xs transition-colors group',
                            isSelected && 'bg-primary/10 text-primary'
                        )}
                        onClick={() => {
                            if (item.type === 'folder') {
                                toggleFolder(fullPath);
                            } else {
                                handleFileClick({ ...item, path: fullPath });
                            }
                        }}
                        onContextMenu={(e) => handleContextMenu(e, { ...item, path: fullPath })}
                        style={{ paddingLeft: `${(parentPath.split('/').length) * 12 + 8}px` }}
                    >
                        {item.type === 'folder' ? (
                            <>
                                {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                                ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                                )}
                                {isExpanded ? (
                                    <FolderOpen className="w-4 h-4 text-yellow-500 shrink-0" />
                                ) : (
                                    <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
                                )}
                            </>
                        ) : (
                            <>
                                <span className="w-3.5" />
                                <File className="w-4 h-4 text-blue-400 shrink-0" />
                            </>
                        )}

                        {isRenaming ? (
                            <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameSubmit();
                                        if (e.key === 'Escape') setRenaming(null);
                                    }}
                                    className="flex-1 bg-background-secondary border border-primary px-2 py-0.5 rounded text-xs focus:outline-none"
                                    autoFocus
                                />
                                <button onClick={handleRenameSubmit} className="p-0.5 hover:bg-white/10 rounded">
                                    <Check className="w-3 h-3 text-green-500" />
                                </button>
                                <button onClick={() => setRenaming(null)} className="p-0.5 hover:bg-white/10 rounded">
                                    <XIcon className="w-3 h-3 text-red-500" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="flex-1 truncate text-text-primary">{item.name}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleContextMenu(e, { ...item, path: fullPath });
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded shrink-0"
                                >
                                    <MoreVertical className="w-3.5 h-3.5 text-text-secondary" />
                                </button>
                            </>
                        )}
                    </div>

                    {item.type === 'folder' && isExpanded && item.children && (
                        <div>{renderFileTree(item.children, fullPath)}</div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="flex flex-col h-full bg-surface border-r border-white/5">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-surface-light/30">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Files</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-text-secondary hover:text-white"
                        title="Upload Files"
                    >
                        <Upload className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={handleDownloadProject}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-text-secondary hover:text-white"
                        title="Download Project"
                    >
                        <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onCreateFile?.({ name: 'untitled.txt', content: '', type: 'file' })}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-text-secondary hover:text-white"
                        title="New File"
                    >
                        <FilePlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onCreateFolder?.({ name: 'new-folder', type: 'folder', children: [] })}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-text-secondary hover:text-white"
                        title="New Folder"
                    >
                        <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                {renderFileTree(files)}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleUpload}
                className="hidden"
                accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.html,.css,.json,.md,.txt"
            />

            {/* Context Menu */}
            {contextMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setContextMenu(null)}
                    />
                    <div
                        className="fixed z-50 bg-surface border border-white/10 rounded-lg shadow-2xl py-1 min-w-[180px] animate-fade-in"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button
                            onClick={() => {
                                handleFileClick(contextMenu.file);
                                setContextMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-xs text-text-primary hover:bg-white/5 transition-colors"
                        >
                            <File className="w-3.5 h-3.5" />
                            Open
                        </button>
                        <button
                            onClick={() => handleRename(contextMenu.file)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-xs text-text-primary hover:bg-white/5 transition-colors"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            Rename
                        </button>
                        {contextMenu.file.type === 'file' && (
                            <button
                                onClick={() => handleDownloadFile(contextMenu.file)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-xs text-text-primary hover:bg-white/5 transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download
                            </button>
                        )}
                        <div className="h-px bg-white/10 my-1" />
                        <button
                            onClick={() => {
                                onDeleteFile?.(contextMenu.file.path);
                                setContextMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default FileManager;
