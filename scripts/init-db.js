/**
 * MongoDB Database Initialization Script
 * 
 * This script initializes the MongoDB database with:
 * - Required collections
 * - Indexes for optimal query performance
 * - Initial seed data (optional)
 * 
 * Usage: node scripts/init-db.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collaborative_editor';

async function initializeDatabase() {
  console.log('🔄 Initializing MongoDB database...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Create collections
    const collections = ['rooms', 'files', 'users', 'whiteboards', 'chat_messages', 'sessions'];
    
    for (const collectionName of collections) {
      const existingCollections = await db.listCollections({ name: collectionName }).toArray();
      if (existingCollections.length === 0) {
        await db.createCollection(collectionName);
        console.log(`  ✅ Created collection: ${collectionName}`);
      } else {
        console.log(`  ⏭️  Collection exists: ${collectionName}`);
      }
    }

    // Create indexes
    console.log('\n📊 Creating indexes...');

    // Rooms indexes
    await db.collection('rooms').createIndex({ roomId: 1 }, { unique: true });
    await db.collection('rooms').createIndex({ createdAt: -1 });
    await db.collection('rooms').createIndex({ lastAccessed: -1 });
    console.log('  ✅ Rooms indexes created');

    // Files indexes
    await db.collection('files').createIndex({ roomId: 1, path: 1 }, { unique: true });
    await db.collection('files').createIndex({ roomId: 1 });
    await db.collection('files').createIndex({ lastModified: -1 });
    console.log('  ✅ Files indexes created');

    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ createdAt: -1 });
    console.log('  ✅ Users indexes created');

    // Whiteboards indexes
    await db.collection('whiteboards').createIndex({ roomId: 1 }, { unique: true });
    console.log('  ✅ Whiteboards indexes created');

    // Chat messages indexes
    await db.collection('chat_messages').createIndex({ roomId: 1, timestamp: -1 });
    await db.collection('chat_messages').createIndex({ roomId: 1 });
    console.log('  ✅ Chat messages indexes created');

    // Sessions indexes (for authentication)
    await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('  ✅ Sessions indexes created');

    console.log('\n✅ Database initialization completed successfully!\n');

    // Print database stats
    const stats = await db.stats();
    console.log('📈 Database Statistics:');
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Indexes: ${stats.indexes}`);
    console.log(`   Data Size: ${(stats.dataSize / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

initializeDatabase();
