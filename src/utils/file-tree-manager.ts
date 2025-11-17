import * as Y from 'yjs';

export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    parentId: string | null;
    path: string;
    createdAt: number;
    modifiedAt: number;
    children?: string[];
}

export interface FileTreeData {
    files: { [id: string]: FileNode };
    rootId: string;
}

export class FileTreeManager {
    private ydoc: Y.Doc;
    private filesMap: Y.Map<any>;
    private fileContents: Y.Map<Y.Text>;

    constructor(ydoc: Y.Doc) {
        this.ydoc = ydoc;
        this.filesMap = ydoc.getMap('files');
        this.fileContents = ydoc.getMap('fileContents');
    }

    /**
     * Initialize file tree with root folder
     */
    initialize(): void {
        if (!this.filesMap.has('root')) {
            const root: FileNode = {
                id: 'root',
                name: 'Project',
                type: 'folder',
                parentId: null,
                path: '/',
                createdAt: Date.now(),
                modifiedAt: Date.now(),
                children: []
            };
            this.filesMap.set('root', root);
        }
    }

    /**
     * Sanitize filename to remove special characters
     */
    sanitizeFilename(filename: string): string {
        // Remove leading/trailing whitespace
        filename = filename.trim();

        // Replace invalid characters with underscore
        filename = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

        // Remove multiple consecutive dots (except for extension)
        filename = filename.replace(/\.{2,}/g, '.');

        // Remove leading/trailing dots
        filename = filename.replace(/^\.+|\.+$/g, '');

        // Ensure filename is not empty
        if (filename.length === 0) {
            filename = 'untitled';
        }

        // Limit length
        if (filename.length > 255) {
            filename = filename.substring(0, 255);
        }

        return filename;
    }

    /**
     * Check if filename already exists in parent folder
     */
    fileExists(parentId: string, filename: string): boolean {
        const parent = this.filesMap.get(parentId) as FileNode;
        if (!parent || parent.type !== 'folder' || !parent.children) {
            return false;
        }

        return parent.children.some(childId => {
            const child = this.filesMap.get(childId) as FileNode;
            return child && child.name === filename;
        });
    }

    /**
     * Generate unique filename by appending number
     */
    generateUniqueFilename(parentId: string, filename: string): string {
        const sanitized = this.sanitizeFilename(filename);

        if (!this.fileExists(parentId, sanitized)) {
            return sanitized;
        }

        // Extract name and extension
        const lastDotIndex = sanitized.lastIndexOf('.');
        const name = lastDotIndex > 0 ? sanitized.substring(0, lastDotIndex) : sanitized;
        const ext = lastDotIndex > 0 ? sanitized.substring(lastDotIndex) : '';

        // Try appending numbers
        let counter = 1;
        let uniqueName = `${name}_${counter}${ext}`;

        while (this.fileExists(parentId, uniqueName)) {
            counter++;
            uniqueName = `${name}_${counter}${ext}`;
        }

        return uniqueName;
    }

    /**
     * Build full path for a file
     */
    buildPath(parentId: string, filename: string): string {
        if (parentId === 'root') {
            return `/${filename}`;
        }

        const parent = this.filesMap.get(parentId) as FileNode;
        if (!parent) {
            return `/${filename}`;
        }

        return `${parent.path}/${filename}`;
    }

    /**
     * Create a new file
     */
    createFile(parentId: string, filename: string, content: string = ''): string | null {
        const parent = this.filesMap.get(parentId) as FileNode;

        if (!parent || parent.type !== 'folder') {
            throw new Error('Parent must be a folder');
        }

        // Generate unique filename
        const uniqueFilename = this.generateUniqueFilename(parentId, filename);
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create file node
        const file: FileNode = {
            id: fileId,
            name: uniqueFilename,
            type: 'file',
            parentId,
            path: this.buildPath(parentId, uniqueFilename),
            createdAt: Date.now(),
            modifiedAt: Date.now()
        };

        // Add file to tree
        this.filesMap.set(fileId, file);

        // Create Y.Text for file content
        const ytext = new Y.Text();
        ytext.insert(0, content);
        this.fileContents.set(fileId, ytext);

        // Update parent's children
        const updatedParent = {...parent};
        updatedParent.children = [...(parent.children || []), fileId];
        updatedParent.modifiedAt = Date.now();
        this.filesMap.set(parentId, updatedParent);

        return fileId;
    }

    /**
     * Create a new folder
     */
    createFolder(parentId: string, folderName: string): string | null {
        const parent = this.filesMap.get(parentId) as FileNode;

        if (!parent || parent.type !== 'folder') {
            throw new Error('Parent must be a folder');
        }

        // Generate unique folder name
        const uniqueFolderName = this.generateUniqueFilename(parentId, folderName);
        const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create folder node
        const folder: FileNode = {
            id: folderId,
            name: uniqueFolderName,
            type: 'folder',
            parentId,
            path: this.buildPath(parentId, uniqueFolderName),
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            children: []
        };

        // Add folder to tree
        this.filesMap.set(folderId, folder);

        // Update parent's children
        const updatedParent = {...parent};
        updatedParent.children = [...(parent.children || []), folderId];
        updatedParent.modifiedAt = Date.now();
        this.filesMap.set(parentId, updatedParent);

        return folderId;
    }

    /**
     * Delete a file or folder
     */
    deleteNode(nodeId: string): boolean {
        if (nodeId === 'root') {
            throw new Error('Cannot delete root folder');
        }

        const node = this.filesMap.get(nodeId) as FileNode;
        if (!node) {
            return false;
        }

        // If folder, delete all children recursively
        if (node.type === 'folder' && node.children) {
            for (const childId of node.children) {
                this.deleteNode(childId);
            }
        }

        // Delete file content if it's a file
        if (node.type === 'file') {
            this.fileContents.delete(nodeId);
        }

        // Remove from parent's children
        if (node.parentId) {
            const parent = this.filesMap.get(node.parentId) as FileNode;
            if (parent && parent.children) {
                const updatedParent = {...parent};
                updatedParent.children = parent.children.filter(id => id !== nodeId);
                updatedParent.modifiedAt = Date.now();
                this.filesMap.set(node.parentId, updatedParent);
            }
        }

        // Delete the node
        this.filesMap.delete(nodeId);

        return true;
    }

    /**
     * Rename a file or folder
     */
    renameNode(nodeId: string, newName: string): boolean {
        if (nodeId === 'root') {
            throw new Error('Cannot rename root folder');
        }

        const node = this.filesMap.get(nodeId) as FileNode;
        if (!node) {
            return false;
        }

        // Generate unique name in parent
        const uniqueName = this.generateUniqueFilename(node.parentId!, newName);

        // Update node
        const updatedNode = {...node};
        updatedNode.name = uniqueName;
        updatedNode.path = this.buildPath(node.parentId!, uniqueName);
        updatedNode.modifiedAt = Date.now();
        this.filesMap.set(nodeId, updatedNode);

        // Update paths of all children if it's a folder
        if (node.type === 'folder' && node.children) {
            this.updateChildrenPaths(nodeId, updatedNode.path);
        }

        return true;
    }

    /**
     * Update paths of all children recursively
     */
    private updateChildrenPaths(folderId: string, newPath: string): void {
        const folder = this.filesMap.get(folderId) as FileNode;
        if (!folder || folder.type !== 'folder' || !folder.children) {
            return;
        }

        for (const childId of folder.children) {
            const child = this.filesMap.get(childId) as FileNode;
            if (child) {
                const updatedChild = {...child};
                updatedChild.path = `${newPath}/${child.name}`;
                this.filesMap.set(childId, updatedChild);

                if (child.type === 'folder') {
                    this.updateChildrenPaths(childId, updatedChild.path);
                }
            }
        }
    }

    /**
     * Move a file or folder to a new parent
     */
    moveNode(nodeId: string, newParentId: string): boolean {
        if (nodeId === 'root') {
            throw new Error('Cannot move root folder');
        }

        const node = this.filesMap.get(nodeId) as FileNode;
        const newParent = this.filesMap.get(newParentId) as FileNode;

        if (!node || !newParent || newParent.type !== 'folder') {
            return false;
        }

        // Check if moving to descendant (would create cycle)
        if (this.isDescendant(nodeId, newParentId)) {
            throw new Error('Cannot move folder into its own descendant');
        }

        // Remove from old parent
        if (node.parentId) {
            const oldParent = this.filesMap.get(node.parentId) as FileNode;
            if (oldParent && oldParent.children) {
                const updatedOldParent = {...oldParent};
                updatedOldParent.children = oldParent.children.filter(id => id !== nodeId);
                updatedOldParent.modifiedAt = Date.now();
                this.filesMap.set(node.parentId, updatedOldParent);
            }
        }

        // Generate unique name in new parent
        const uniqueName = this.generateUniqueFilename(newParentId, node.name);

        // Update node
        const updatedNode = {...node};
        updatedNode.parentId = newParentId;
        updatedNode.name = uniqueName;
        updatedNode.path = this.buildPath(newParentId, uniqueName);
        updatedNode.modifiedAt = Date.now();
        this.filesMap.set(nodeId, updatedNode);

        // Add to new parent
        const updatedNewParent = {...newParent};
        updatedNewParent.children = [...(newParent.children || []), nodeId];
        updatedNewParent.modifiedAt = Date.now();
        this.filesMap.set(newParentId, updatedNewParent);

        // Update paths of children if folder
        if (node.type === 'folder') {
            this.updateChildrenPaths(nodeId, updatedNode.path);
        }

        return true;
    }

    /**
     * Check if target is a descendant of node
     */
    private isDescendant(nodeId: string, targetId: string): boolean {
        const target = this.filesMap.get(targetId) as FileNode;
        if (!target) {
            return false;
        }

        if (target.parentId === nodeId) {
            return true;
        }

        if (target.parentId) {
            return this.isDescendant(nodeId, target.parentId);
        }

        return false;
    }

    /**
     * Get file content
     */
    getFileContent(fileId: string): Y.Text | null {
        return this.fileContents.get(fileId) || null;
    }

    /**
     * Get file tree data for serialization
     */
    getFileTreeData(): FileTreeData {
        const files: { [id: string]: FileNode } = {};

        this.filesMap.forEach((value, key) => {
            files[key] = value as FileNode;
        });

        return {
            files,
            rootId: 'root'
        };
    }

    /**
     * Load file tree from data
     */
    loadFileTreeData(data: FileTreeData): void {
        // Clear existing data
        this.filesMap.clear();
        this.fileContents.clear();

        // Load files
        Object.entries(data.files).forEach(([id, node]) => {
            this.filesMap.set(id, node);

            // Create Y.Text for files
            if (node.type === 'file' && !this.fileContents.has(id)) {
                const ytext = new Y.Text();
                this.fileContents.set(id, ytext);
            }
        });
    }

    /**
     * Get all file IDs in order
     */
    getAllFileIds(): string[] {
        const fileIds: string[] = [];

        const traverse = (nodeId: string) => {
            const node = this.filesMap.get(nodeId) as FileNode;
            if (!node) return;

            if (node.type === 'file') {
                fileIds.push(nodeId);
            }

            if (node.type === 'folder' && node.children) {
                node.children.forEach(childId => traverse(childId));
            }
        };

        traverse('root');
        return fileIds;
    }

    /**
     * Search files by name
     */
    searchFiles(query: string): FileNode[] {
        const results: FileNode[] = [];
        const lowerQuery = query.toLowerCase();

        this.filesMap.forEach((value) => {
            const node = value as FileNode;
            if (node.type === 'file' && node.name.toLowerCase().includes(lowerQuery)) {
                results.push(node);
            }
        });

        return results;
    }
}
