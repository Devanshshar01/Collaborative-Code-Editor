/**
 * Workspace Manager Component  
 * VS Code-style multi-root workspace support
 */

import React, { useState, useCallback } from 'react';
import {
    FolderPlus,
    FolderMinus,
    Settings,
    Save,
    FolderOpen,
    Folder,
    ChevronRight,
    ChevronDown,
    X,
    Plus,
    MoreVertical,
} from 'lucide-react';
import clsx from 'clsx';
import { useWorkspaceStore } from '../stores/workspaceStore';

const WorkspaceRoot = ({
    root,
    isExpanded,
    onToggle,
    onRemove,
    onSettings,
}) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="border-b border-[#3c3c3c] last:border-b-0">
            <div
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#2a2d2e] group"
                onClick={onToggle}
            >
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#858585]" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-[#858585]" />
                )}
                <FolderOpen className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-[#cccccc] flex-1 truncate font-medium">
                    {root.name}
                </span>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1 hover:bg-[#3c3c3c] rounded"
                    >
                        <MoreVertical className="w-4 h-4 text-[#858585]" />
                    </button>
                </div>
            </div>

            {/* Dropdown menu */}
            {showMenu && (
                <div 
                    className="absolute right-2 mt-1 w-48 bg-[#252526] border border-[#454545] 
                             rounded shadow-lg py-1 z-50"
                >
                    <button
                        onClick={() => {
                            onSettings(root);
                            setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs 
                                 hover:bg-[#094771] transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        Folder Settings
                    </button>
                    <div className="h-px bg-[#454545] my-1" />
                    <button
                        onClick={() => {
                            onRemove(root.id);
                            setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs 
                                 text-red-400 hover:bg-[#094771] transition-colors"
                    >
                        <FolderMinus className="w-4 h-4" />
                        Remove from Workspace
                    </button>
                </div>
            )}

            {isExpanded && (
                <div className="px-3 py-2 text-xs text-[#858585]">
                    {root.path}
                </div>
            )}
        </div>
    );
};

const WorkspaceManager = ({
    isOpen,
    onClose,
    onAddFolder,
}) => {
    const [expandedRoots, setExpandedRoots] = useState(new Set());
    
    const { roots, addWorkspaceRoot, removeWorkspaceRoot } = useWorkspaceStore();

    const toggleRoot = (rootId) => {
        setExpandedRoots(prev => {
            const next = new Set(prev);
            if (next.has(rootId)) {
                next.delete(rootId);
            } else {
                next.add(rootId);
            }
            return next;
        });
    };

    const handleAddFolder = useCallback(() => {
        // In a real app, this would open a folder picker
        // For now, we'll simulate it
        const folderName = prompt('Enter folder name:');
        if (folderName) {
            addWorkspaceRoot(`/${folderName}`, folderName);
        }
    }, [addWorkspaceRoot]);

    const handleRemoveRoot = useCallback((rootId) => {
        if (roots.length > 1) {
            if (window.confirm('Remove this folder from the workspace?')) {
                removeWorkspaceRoot(rootId);
            }
        } else {
            alert('Cannot remove the last folder from the workspace');
        }
    }, [roots, removeWorkspaceRoot]);

    const handleSaveWorkspace = useCallback(() => {
        const workspaceConfig = {
            folders: roots.map(r => ({ path: r.path, name: r.name })),
            settings: {},
        };
        
        const blob = new Blob([JSON.stringify(workspaceConfig, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'workspace.code-workspace';
        a.click();
        URL.revokeObjectURL(url);
    }, [roots]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-lg bg-[#252526] border border-[#454545] 
                          rounded-lg shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#454545]">
                    <span className="text-sm font-medium text-[#cccccc]">
                        Workspace Folders
                    </span>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-[#3c3c3c] rounded"
                    >
                        <X className="w-4 h-4 text-[#858585]" />
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[400px] overflow-auto">
                    {roots.length > 0 ? (
                        roots.map((root) => (
                            <WorkspaceRoot
                                key={root.id}
                                root={root}
                                isExpanded={expandedRoots.has(root.id)}
                                onToggle={() => toggleRoot(root.id)}
                                onRemove={handleRemoveRoot}
                                onSettings={() => {}}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-[#858585]">
                            <Folder className="w-12 h-12 mb-3 opacity-50" />
                            <span className="text-sm">No folders in workspace</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#454545]">
                    <button
                        onClick={handleAddFolder}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#0e639c] 
                                 hover:bg-[#1177bb] rounded text-white transition-colors"
                    >
                        <FolderPlus className="w-4 h-4" />
                        Add Folder
                    </button>
                    <button
                        onClick={handleSaveWorkspace}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs 
                                 hover:bg-[#3c3c3c] rounded text-[#cccccc] transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Save Workspace As...
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceManager;
