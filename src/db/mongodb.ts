import {MongoClient, Db, Collection} from 'mongodb';
import * as Y from 'yjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'collaborative_editor';

export interface DocumentSnapshot {
    roomId: string;
    documentState: Buffer;
    version: number;
    timestamp: Date;
    lastModifiedBy?: string;
}

export interface DocumentMetadata {
    roomId: string;
    createdAt: Date;
    lastModified: Date;
    version: number;
    participants: string[];
}

class MongoDBService {
    private client: MongoClient | null = null;
    private db: Db | null = null;
    private snapshots: Collection<DocumentSnapshot> | null = null;
    private metadata: Collection<DocumentMetadata> | null = null;

    async connect(): Promise<void> {
        try {
            this.client = new MongoClient(MONGODB_URI);
            await this.client.connect();
            this.db = this.client.db(DB_NAME);

            // Initialize collections
            this.snapshots = this.db.collection<DocumentSnapshot>('document_snapshots');
            this.metadata = this.db.collection<DocumentMetadata>('document_metadata');

            // Create indexes for efficient querying
            await this.snapshots.createIndex({roomId: 1, timestamp: -1});
            await this.metadata.createIndex({roomId: 1}, {unique: true});

            console.log('MongoDB connected successfully');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }

    async saveSnapshot(roomId: string, ydoc: Y.Doc, userId?: string): Promise<void> {
        if (!this.snapshots || !this.metadata) {
            throw new Error('MongoDB not connected');
        }

        try {
            // Encode the Y.Doc state
            const documentState = Y.encodeStateAsUpdate(ydoc);

            // Get or create metadata
            const existingMeta = await this.metadata.findOne({roomId});
            const version = existingMeta ? existingMeta.version + 1 : 1;

            // Save snapshot
            const snapshot: DocumentSnapshot = {
                roomId,
                documentState: Buffer.from(documentState),
                version,
                timestamp: new Date(),
                lastModifiedBy: userId
            };

            await this.snapshots.insertOne(snapshot);

            // Update metadata
            if (existingMeta) {
                await this.metadata.updateOne(
                    {roomId},
                    {
                        $set: {
                            lastModified: new Date(),
                            version
                        },
                        $addToSet: {participants: userId}
                    }
                );
            } else {
                const newMetadata: DocumentMetadata = {
                    roomId,
                    createdAt: new Date(),
                    lastModified: new Date(),
                    version: 1,
                    participants: userId ? [userId] : []
                };
                await this.metadata.insertOne(newMetadata);
            }

            console.log(`Snapshot saved for room ${roomId}, version ${version}`);
        } catch (error) {
            console.error('Error saving snapshot:', error);
            throw error;
        }
    }

    async loadLatestSnapshot(roomId: string): Promise<Buffer | null> {
        if (!this.snapshots) {
            throw new Error('MongoDB not connected');
        }

        try {
            const snapshot = await this.snapshots.findOne(
                {roomId},
                {sort: {timestamp: -1}}
            );

            if (snapshot) {
                console.log(`Loaded snapshot for room ${roomId}, version ${snapshot.version}`);
                return snapshot.documentState;
            }

            return null;
        } catch (error) {
            console.error('Error loading snapshot:', error);
            throw error;
        }
    }

    async cleanOldSnapshots(roomId: string, keepLast: number = 10): Promise<void> {
        if (!this.snapshots) {
            throw new Error('MongoDB not connected');
        }

        try {
            // Get all snapshots for the room, sorted by timestamp
            const allSnapshots = await this.snapshots
                .find({roomId})
                .sort({timestamp: -1})
                .toArray();

            if (allSnapshots.length > keepLast) {
                const toDelete = allSnapshots.slice(keepLast);
                const deleteIds = toDelete.map(s => s._id);

                await this.snapshots.deleteMany({_id: {$in: deleteIds}});
                console.log(`Cleaned ${toDelete.length} old snapshots for room ${roomId}`);
            }
        } catch (error) {
            console.error('Error cleaning old snapshots:', error);
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            console.log('MongoDB disconnected');
        }
    }
}

export default new MongoDBService();