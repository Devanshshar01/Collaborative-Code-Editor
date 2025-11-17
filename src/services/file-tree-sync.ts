import * as Y from 'yjs';
import {Room} from '../db/schemas/room.schema';
import {FileTreeManager, FileTreeData} from '../utils/file-tree-manager';

export class FileTreeSync {
    private roomId: string;
    private fileTreeManager: FileTreeManager;
    private syncInterval: NodeJS.Timeout | null = null;
    private lastSyncTime: number = 0;
    private isDirty: boolean = false;

    constructor(roomId: string, ydoc: Y.Doc) {
        this.roomId = roomId;
        this.fileTreeManager = new FileTreeManager(ydoc);
    }

    /**
     * Start auto-sync to MongoDB every 10 seconds
     */
    startAutoSync(): void {
        if (this.syncInterval) {
            return; // Already syncing
        }

        // Mark as dirty when file tree changes
        const filesMap = this.fileTreeManager['ydoc'].getMap('files');
        filesMap.observe(() => {
            this.isDirty = true;
        });

        // Sync every 10 seconds if dirty
        this.syncInterval = setInterval(async () => {
            if (this.isDirty) {
                await this.syncToMongoDB();
            }
        }, 10000); // 10 seconds

        console.log(`File tree auto-sync started for room: ${this.roomId}`);
    }

    /**
     * Stop auto-sync
     */
    stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log(`File tree auto-sync stopped for room: ${this.roomId}`);
    }

    /**
     * Sync file tree to MongoDB
     */
    async syncToMongoDB(): Promise<boolean> {
        try {
            const fileTreeData = this.fileTreeManager.getFileTreeData();

            // Find room and update
            const room = await Room.findByRoomId(this.roomId);
            if (!room) {
                console.error(`Room not found: ${this.roomId}`);
                return false;
            }

            // Serialize file tree data
            const serializedData = JSON.stringify(fileTreeData);

            // Update room's whiteboard snapshot (or create a new field for file tree)
            // For now, we'll add it to the whiteboard field as fileTree
            const whiteboardData = JSON.parse(room.whiteboard.snapshot || '{}');
            whiteboardData.fileTree = fileTreeData;

            room.whiteboard.snapshot = JSON.stringify(whiteboardData);
            room.whiteboard.lastModifiedAt = new Date();
            room.lastActivity = new Date();

            await room.save();

            this.lastSyncTime = Date.now();
            this.isDirty = false;

            console.log(`File tree synced to MongoDB for room: ${this.roomId}`);
            return true;
        } catch (error) {
            console.error('Error syncing file tree to MongoDB:', error);
            return false;
        }
    }

    /**
     * Load file tree from MongoDB
     */
    async loadFromMongoDB(): Promise<boolean> {
        try {
            const room = await Room.findByRoomId(this.roomId);
            if (!room) {
                console.error(`Room not found: ${this.roomId}`);
                return false;
            }

            // Parse whiteboard snapshot
            const whiteboardData = JSON.parse(room.whiteboard.snapshot || '{}');
            const fileTreeData: FileTreeData | undefined = whiteboardData.fileTree;

            if (fileTreeData && fileTreeData.files) {
                this.fileTreeManager.loadFileTreeData(fileTreeData);
                console.log(`File tree loaded from MongoDB for room: ${this.roomId}`);
                return true;
            } else {
                // Initialize with default structure
                this.fileTreeManager.initialize();
                console.log(`No file tree found, initialized default for room: ${this.roomId}`);
                return true;
            }
        } catch (error) {
            console.error('Error loading file tree from MongoDB:', error);
            return false;
        }
    }

    /**
     * Force sync immediately
     */
    async forceSync(): Promise<boolean> {
        this.isDirty = true;
        return await this.syncToMongoDB();
    }

    /**
     * Get file tree manager
     */
    getFileTreeManager(): FileTreeManager {
        return this.fileTreeManager;
    }

    /**
     * Get last sync time
     */
    getLastSyncTime(): number {
        return this.lastSyncTime;
    }

    /**
     * Check if changes are pending sync
     */
    hasPendingChanges(): boolean {
        return this.isDirty;
    }
}

/**
 * Create and initialize file tree sync for a room
 */
export async function createFileTreeSync(roomId: string, ydoc: Y.Doc): Promise<FileTreeSync> {
    const sync = new FileTreeSync(roomId, ydoc);
    await sync.loadFromMongoDB();
    sync.startAutoSync();
    return sync;
}

/**
 * Global registry of active syncs
 */
const activeSyncs = new Map<string, FileTreeSync>();

/**
 * Get or create file tree sync for a room
 */
export async function getFileTreeSync(roomId: string, ydoc: Y.Doc): Promise<FileTreeSync> {
    if (activeSyncs.has(roomId)) {
        return activeSyncs.get(roomId)!;
    }

    const sync = await createFileTreeSync(roomId, ydoc);
    activeSyncs.set(roomId, sync);
    return sync;
}

/**
 * Remove file tree sync for a room
 */
export function removeFileTreeSync(roomId: string): void {
    const sync = activeSyncs.get(roomId);
    if (sync) {
        sync.stopAutoSync();
        activeSyncs.delete(roomId);
    }
}

/**
 * Stop all active syncs
 */
export function stopAllSyncs(): void {
    activeSyncs.forEach(sync => sync.stopAutoSync());
    activeSyncs.clear();
}
