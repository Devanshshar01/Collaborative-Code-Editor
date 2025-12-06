/**
 * Workspace Store (Zustand)
 * Manages file tree, workspace roots, git status, and selection state
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Git status types
export const GitStatus = {
    UNTRACKED: 'U',
    MODIFIED: 'M',
    ADDED: 'A',
    DELETED: 'D',
    RENAMED: 'R',
    COPIED: 'C',
    IGNORED: '!',
    CONFLICT: 'C',
};

// File/Folder node structure
const createNode = (id, name, type, parentId = null) => ({
    id,
    name,
    type, // 'file' | 'folder' | 'root'
    parentId,
    children: type !== 'file' ? [] : undefined,
    expanded: type === 'root',
    selected: false,
    gitStatus: null,
    gitBlame: null,
    isRenaming: false,
    isNew: false,
    path: '',
});

export const useWorkspaceStore = create(
    subscribeWithSelector((set, get) => ({
        // State
        roots: [], // WorkspaceRoot[]
        nodes: new Map(), // Map<id, FileNode>
        activeFileId: null,
        selectedIds: new Set(),
        expandedIds: new Set(['root']),
        gitStatus: new Map(), // Map<path, GitStatus>
        gitBlame: new Map(), // Map<path, BlameInfo[]>
        clipboard: null, // { action: 'copy'|'cut', ids: string[] }
        searchQuery: '',
        searchResults: [],
        isSearching: false,
        recentFiles: [],
        dragState: null, // { sourceId, targetId, position }
        
        // Computed
        get flattenedTree() {
            return get().getFlattenedTree();
        },

        // Actions
        
        // Initialize workspace
        initWorkspace: (rootPath, name = 'Workspace') => {
            const rootId = 'root';
            const rootNode = {
                ...createNode(rootId, name, 'root'),
                path: rootPath,
                expanded: true,
            };
            
            set({
                roots: [{ id: rootId, path: rootPath, name }],
                nodes: new Map([[rootId, rootNode]]),
                expandedIds: new Set([rootId]),
            });
        },

        // Add workspace root (multi-root support)
        addWorkspaceRoot: (path, name) => {
            const id = `root-${Date.now()}`;
            const rootNode = {
                ...createNode(id, name, 'root'),
                path,
                expanded: true,
            };
            
            set(state => ({
                roots: [...state.roots, { id, path, name }],
                nodes: new Map([...state.nodes, [id, rootNode]]),
                expandedIds: new Set([...state.expandedIds, id]),
            }));
            
            return id;
        },

        // Remove workspace root
        removeWorkspaceRoot: (rootId) => {
            set(state => {
                const newRoots = state.roots.filter(r => r.id !== rootId);
                const newNodes = new Map(state.nodes);
                
                // Remove all nodes under this root
                const removeChildren = (nodeId) => {
                    const node = newNodes.get(nodeId);
                    if (node?.children) {
                        node.children.forEach(removeChildren);
                    }
                    newNodes.delete(nodeId);
                };
                removeChildren(rootId);
                
                return { roots: newRoots, nodes: newNodes };
            });
        },

        // Set file tree from external data
        setFileTree: (treeData, rootId = 'root') => {
            const nodes = new Map(get().nodes);
            const expandedIds = new Set(get().expandedIds);
            
            const processNode = (data, parentId, parentPath = '') => {
                const path = parentPath ? `${parentPath}/${data.name}` : data.name;
                const node = {
                    ...createNode(data.id || `${parentId}-${data.name}`, data.name, data.type, parentId),
                    path,
                    content: data.content,
                    gitStatus: data.gitStatus || null,
                    expanded: expandedIds.has(data.id),
                };
                
                nodes.set(node.id, node);
                
                if (data.children && data.type === 'folder') {
                    node.children = data.children.map(child => {
                        const childNode = processNode(child, node.id, path);
                        return childNode.id;
                    });
                }
                
                // Add to parent's children
                const parent = nodes.get(parentId);
                if (parent && parent.children && !parent.children.includes(node.id)) {
                    parent.children.push(node.id);
                }
                
                return node;
            };
            
            // Process tree data
            if (Array.isArray(treeData)) {
                treeData.forEach(item => processNode(item, rootId));
            } else if (treeData) {
                processNode(treeData, rootId);
            }
            
            set({ nodes });
        },

        // Add node
        addNode: (parentId, name, type, content = '') => {
            const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const parent = get().nodes.get(parentId);
            
            if (!parent) return null;
            
            const path = parent.path ? `${parent.path}/${name}` : name;
            const node = {
                ...createNode(id, name, type, parentId),
                path,
                content: type === 'file' ? content : undefined,
                isNew: true,
                isRenaming: true,
            };
            
            set(state => {
                const newNodes = new Map(state.nodes);
                newNodes.set(id, node);
                
                // Update parent's children
                const parentNode = newNodes.get(parentId);
                if (parentNode) {
                    parentNode.children = [...(parentNode.children || []), id];
                    newNodes.set(parentId, parentNode);
                }
                
                // Auto-expand parent
                const newExpanded = new Set(state.expandedIds);
                newExpanded.add(parentId);
                
                return { 
                    nodes: newNodes, 
                    expandedIds: newExpanded,
                    activeFileId: type === 'file' ? id : state.activeFileId,
                };
            });
            
            return id;
        },

        // Remove node
        removeNode: (nodeId) => {
            set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(nodeId);
                
                if (!node) return state;
                
                // Remove from parent's children
                if (node.parentId) {
                    const parent = newNodes.get(node.parentId);
                    if (parent) {
                        parent.children = parent.children.filter(id => id !== nodeId);
                        newNodes.set(node.parentId, parent);
                    }
                }
                
                // Recursively remove children
                const removeChildren = (id) => {
                    const n = newNodes.get(id);
                    if (n?.children) {
                        n.children.forEach(removeChildren);
                    }
                    newNodes.delete(id);
                };
                removeChildren(nodeId);
                
                // Clear selection if removed
                const newSelected = new Set(state.selectedIds);
                newSelected.delete(nodeId);
                
                return {
                    nodes: newNodes,
                    selectedIds: newSelected,
                    activeFileId: state.activeFileId === nodeId ? null : state.activeFileId,
                };
            });
        },

        // Rename node
        renameNode: (nodeId, newName) => {
            set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(nodeId);
                
                if (!node) return state;
                
                // Update path for node and all children
                const oldPath = node.path;
                const newPath = node.parentId 
                    ? `${newNodes.get(node.parentId)?.path || ''}/${newName}`
                    : newName;
                
                const updatePaths = (id, basePath) => {
                    const n = newNodes.get(id);
                    if (!n) return;
                    
                    const parts = n.path.split('/');
                    parts[parts.indexOf(node.name)] = newName;
                    n.path = parts.join('/');
                    
                    if (n.children) {
                        n.children.forEach(childId => updatePaths(childId, n.path));
                    }
                    newNodes.set(id, n);
                };
                
                node.name = newName;
                node.path = newPath;
                node.isRenaming = false;
                node.isNew = false;
                newNodes.set(nodeId, node);
                
                if (node.children) {
                    node.children.forEach(childId => {
                        const child = newNodes.get(childId);
                        if (child) {
                            child.path = `${newPath}/${child.name}`;
                            newNodes.set(childId, child);
                        }
                    });
                }
                
                return { nodes: newNodes };
            });
        },

        // Move node (drag & drop)
        moveNode: (nodeId, newParentId, index = -1) => {
            set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(nodeId);
                const oldParent = newNodes.get(node?.parentId);
                const newParent = newNodes.get(newParentId);
                
                if (!node || !newParent || newParent.type === 'file') return state;
                
                // Remove from old parent
                if (oldParent) {
                    oldParent.children = oldParent.children.filter(id => id !== nodeId);
                    newNodes.set(oldParent.id, oldParent);
                }
                
                // Add to new parent
                if (index >= 0 && index < newParent.children.length) {
                    newParent.children.splice(index, 0, nodeId);
                } else {
                    newParent.children.push(nodeId);
                }
                newNodes.set(newParentId, newParent);
                
                // Update node's parent and path
                node.parentId = newParentId;
                node.path = `${newParent.path}/${node.name}`;
                newNodes.set(nodeId, node);
                
                return { nodes: newNodes };
            });
        },

        // Toggle expansion
        toggleExpanded: (nodeId) => {
            set(state => {
                const newExpanded = new Set(state.expandedIds);
                if (newExpanded.has(nodeId)) {
                    newExpanded.delete(nodeId);
                } else {
                    newExpanded.add(nodeId);
                }
                return { expandedIds: newExpanded };
            });
        },

        // Expand node
        expandNode: (nodeId) => {
            set(state => ({
                expandedIds: new Set([...state.expandedIds, nodeId]),
            }));
        },

        // Collapse node
        collapseNode: (nodeId) => {
            set(state => {
                const newExpanded = new Set(state.expandedIds);
                newExpanded.delete(nodeId);
                return { expandedIds: newExpanded };
            });
        },

        // Expand all
        expandAll: () => {
            set(state => {
                const allIds = new Set();
                state.nodes.forEach((node, id) => {
                    if (node.type !== 'file') {
                        allIds.add(id);
                    }
                });
                return { expandedIds: allIds };
            });
        },

        // Collapse all
        collapseAll: () => {
            set(state => ({
                expandedIds: new Set(state.roots.map(r => r.id)),
            }));
        },

        // Select node
        selectNode: (nodeId, multi = false, range = false) => {
            set(state => {
                const newSelected = multi ? new Set(state.selectedIds) : new Set();
                
                if (multi && newSelected.has(nodeId)) {
                    newSelected.delete(nodeId);
                } else {
                    newSelected.add(nodeId);
                }
                
                const node = state.nodes.get(nodeId);
                
                return {
                    selectedIds: newSelected,
                    activeFileId: node?.type === 'file' ? nodeId : state.activeFileId,
                };
            });
        },

        // Clear selection
        clearSelection: () => {
            set({ selectedIds: new Set() });
        },

        // Set active file
        setActiveFile: (fileId) => {
            const node = get().nodes.get(fileId);
            if (node?.type === 'file') {
                set(state => ({
                    activeFileId: fileId,
                    recentFiles: [fileId, ...state.recentFiles.filter(id => id !== fileId)].slice(0, 20),
                }));
            }
        },

        // Start renaming
        startRenaming: (nodeId) => {
            set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(nodeId);
                if (node) {
                    node.isRenaming = true;
                    newNodes.set(nodeId, node);
                }
                return { nodes: newNodes };
            });
        },

        // Stop renaming
        stopRenaming: (nodeId) => {
            set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(nodeId);
                if (node) {
                    node.isRenaming = false;
                    newNodes.set(nodeId, node);
                }
                return { nodes: newNodes };
            });
        },

        // Copy to clipboard
        copyToClipboard: (nodeIds) => {
            set({ clipboard: { action: 'copy', ids: Array.from(nodeIds) } });
        },

        // Cut to clipboard
        cutToClipboard: (nodeIds) => {
            set({ clipboard: { action: 'cut', ids: Array.from(nodeIds) } });
        },

        // Paste from clipboard
        pasteFromClipboard: (targetId) => {
            const { clipboard, nodes } = get();
            if (!clipboard || clipboard.ids.length === 0) return;
            
            const target = nodes.get(targetId);
            const parentId = target?.type === 'file' ? target.parentId : targetId;
            
            clipboard.ids.forEach(id => {
                const node = nodes.get(id);
                if (!node) return;
                
                if (clipboard.action === 'cut') {
                    get().moveNode(id, parentId);
                } else {
                    // Deep copy
                    const copyNode = (srcId, destParentId) => {
                        const src = nodes.get(srcId);
                        if (!src) return;
                        
                        const newId = get().addNode(destParentId, `${src.name} copy`, src.type, src.content);
                        
                        if (src.children) {
                            src.children.forEach(childId => copyNode(childId, newId));
                        }
                    };
                    copyNode(id, parentId);
                }
            });
            
            if (clipboard.action === 'cut') {
                set({ clipboard: null });
            }
        },

        // Update git status
        updateGitStatus: (statusMap) => {
            set(state => {
                const newNodes = new Map(state.nodes);
                
                statusMap.forEach((status, path) => {
                    newNodes.forEach((node, id) => {
                        if (node.path === path) {
                            node.gitStatus = status;
                            newNodes.set(id, node);
                        }
                    });
                });
                
                return { nodes: newNodes, gitStatus: new Map(statusMap) };
            });
        },

        // Set drag state
        setDragState: (state) => {
            set({ dragState: state });
        },

        // Search files
        searchFiles: async (query) => {
            if (!query.trim()) {
                set({ searchQuery: '', searchResults: [], isSearching: false });
                return;
            }
            
            set({ searchQuery: query, isSearching: true });
            
            const { nodes } = get();
            const results = [];
            const lowerQuery = query.toLowerCase();
            
            nodes.forEach((node, id) => {
                if (node.type === 'file' && node.name.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        id,
                        name: node.name,
                        path: node.path,
                        score: node.name.toLowerCase().startsWith(lowerQuery) ? 2 : 1,
                    });
                }
            });
            
            // Sort by score then name
            results.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
            
            set({ searchResults: results.slice(0, 50), isSearching: false });
        },

        // Get flattened tree for virtualization
        getFlattenedTree: () => {
            const { nodes, expandedIds, roots } = get();
            const result = [];
            
            const flatten = (nodeId, depth = 0) => {
                const node = nodes.get(nodeId);
                if (!node) return;
                
                result.push({ ...node, depth });
                
                if (node.children && expandedIds.has(nodeId)) {
                    // Sort: folders first, then alphabetically
                    const sortedChildren = [...node.children].sort((a, b) => {
                        const nodeA = nodes.get(a);
                        const nodeB = nodes.get(b);
                        if (!nodeA || !nodeB) return 0;
                        if (nodeA.type !== nodeB.type) {
                            return nodeA.type === 'folder' ? -1 : 1;
                        }
                        return nodeA.name.localeCompare(nodeB.name);
                    });
                    
                    sortedChildren.forEach(childId => flatten(childId, depth + 1));
                }
            };
            
            roots.forEach(root => flatten(root.id));
            
            return result;
        },

        // Get node by path
        getNodeByPath: (path) => {
            const { nodes } = get();
            for (const [id, node] of nodes) {
                if (node.path === path) return node;
            }
            return null;
        },

        // Get children of node
        getChildren: (nodeId) => {
            const { nodes } = get();
            const node = nodes.get(nodeId);
            if (!node?.children) return [];
            return node.children.map(id => nodes.get(id)).filter(Boolean);
        },

        // Get parent chain (for breadcrumbs)
        getParentChain: (nodeId) => {
            const { nodes } = get();
            const chain = [];
            let current = nodes.get(nodeId);
            
            while (current) {
                chain.unshift(current);
                current = current.parentId ? nodes.get(current.parentId) : null;
            }
            
            return chain;
        },
    }))
);

export default useWorkspaceStore;
