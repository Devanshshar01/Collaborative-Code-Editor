import {useState, useEffect, useCallback} from 'react';
import * as Y from 'yjs';
import {FileTreeManager} from '../utils/file-tree-manager';
import {getFileTreeSync, removeFileTreeSync} from '../services/file-tree-sync';

export function useFileTree(roomId: string | null, ydoc: Y.Doc | null) {
    const [fileTreeManager, setFileTreeManager] = useState<FileTreeManager | null>(null);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize file tree
    useEffect(() => {
        if (!roomId || !ydoc) {
            setIsLoading(false);
            return;
        }

        let isCancelled = false;

        async function initialize() {
            try {
                setIsLoading(true);
                setError(null);

                // Get or create file tree sync
                // TypeGuard: roomId and ydoc are non-null (checked above)
                const sync = await getFileTreeSync(roomId!, ydoc!);
                const manager = sync.getFileTreeManager();

                if (!isCancelled) {
                    setFileTreeManager(manager);

                    // Select first file if available
                    const fileIds = manager.getAllFileIds();
                    if (fileIds.length > 0) {
                        setActiveFileId(fileIds[0]);
                    }
                }
            } catch (err) {
                if (!isCancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to initialize file tree');
                    console.error('File tree initialization error:', err);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        }

        initialize();

        return () => {
            isCancelled = true;
            if (roomId) {
                // Note: Don't remove sync here as it might be used by other components
                // removeFileTreeSync(roomId);
            }
        };
    }, [roomId, ydoc]);

    // Get active file content
    const getActiveFileContent = useCallback((): Y.Text | null => {
        if (!fileTreeManager || !activeFileId) {
            return null;
        }
        return fileTreeManager.getFileContent(activeFileId);
    }, [fileTreeManager, activeFileId]);

    // Create file
    const createFile = useCallback((parentId: string, filename: string, content: string = ''): string | null => {
        if (!fileTreeManager) {
            console.error('File tree manager not initialized');
            return null;
        }

        try {
            const fileId = fileTreeManager.createFile(parentId, filename, content);
            if (fileId) {
                setActiveFileId(fileId);
            }
            return fileId;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create file');
            return null;
        }
    }, [fileTreeManager]);

    // Create folder
    const createFolder = useCallback((parentId: string, folderName: string): string | null => {
        if (!fileTreeManager) {
            console.error('File tree manager not initialized');
            return null;
        }

        try {
            return fileTreeManager.createFolder(parentId, folderName);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create folder');
            return null;
        }
    }, [fileTreeManager]);

    // Delete node
    const deleteNode = useCallback((nodeId: string): boolean => {
        if (!fileTreeManager) {
            console.error('File tree manager not initialized');
            return false;
        }

        try {
            const result = fileTreeManager.deleteNode(nodeId);

            // If deleted file was active, clear selection
            if (nodeId === activeFileId) {
                const fileIds = fileTreeManager.getAllFileIds();
                setActiveFileId(fileIds.length > 0 ? fileIds[0] : null);
            }

            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete node');
            return false;
        }
    }, [fileTreeManager, activeFileId]);

    // Rename node
    const renameNode = useCallback((nodeId: string, newName: string): boolean => {
        if (!fileTreeManager) {
            console.error('File tree manager not initialized');
            return false;
        }

        try {
            return fileTreeManager.renameNode(nodeId, newName);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to rename node');
            return false;
        }
    }, [fileTreeManager]);

    // Move node
    const moveNode = useCallback((nodeId: string, newParentId: string): boolean => {
        if (!fileTreeManager) {
            console.error('File tree manager not initialized');
            return false;
        }

        try {
            return fileTreeManager.moveNode(nodeId, newParentId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to move node');
            return false;
        }
    }, [fileTreeManager]);

    // Search files
    const searchFiles = useCallback((query: string) => {
        if (!fileTreeManager) {
            return [];
        }
        return fileTreeManager.searchFiles(query);
    }, [fileTreeManager]);

    return {
        fileTreeManager,
        activeFileId,
        setActiveFileId,
        getActiveFileContent,
        createFile,
        createFolder,
        deleteNode,
        renameNode,
        moveNode,
        searchFiles,
        isLoading,
        error
    };
}
