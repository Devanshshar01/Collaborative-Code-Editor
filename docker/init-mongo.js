// MongoDB initialization script
// This script runs when the MongoDB container is first created

db = db.getSiblingDB('collaborative_editor');

// Create collections with validation
db.createCollection('rooms', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['roomId', 'name', 'createdAt'],
      properties: {
        roomId: {
          bsonType: 'string',
          description: 'Unique room identifier'
        },
        name: {
          bsonType: 'string',
          description: 'Room name'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Room creation timestamp'
        },
        lastAccessed: {
          bsonType: 'date',
          description: 'Last access timestamp'
        },
        participants: {
          bsonType: 'array',
          description: 'Array of participant user IDs'
        },
        settings: {
          bsonType: 'object',
          description: 'Room settings'
        }
      }
    }
  }
});

db.createCollection('files', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['roomId', 'path', 'content'],
      properties: {
        roomId: {
          bsonType: 'string',
          description: 'Associated room ID'
        },
        path: {
          bsonType: 'string',
          description: 'File path within the room'
        },
        content: {
          bsonType: 'string',
          description: 'File content'
        },
        language: {
          bsonType: 'string',
          description: 'Programming language'
        },
        lastModified: {
          bsonType: 'date',
          description: 'Last modification timestamp'
        },
        lastModifiedBy: {
          bsonType: 'string',
          description: 'User ID of last modifier'
        }
      }
    }
  }
});

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email'],
      properties: {
        email: {
          bsonType: 'string',
          description: 'User email address'
        },
        name: {
          bsonType: 'string',
          description: 'User display name'
        },
        avatarUrl: {
          bsonType: 'string',
          description: 'User avatar URL'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Account creation timestamp'
        },
        lastLogin: {
          bsonType: 'date',
          description: 'Last login timestamp'
        }
      }
    }
  }
});

db.createCollection('whiteboards', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['roomId'],
      properties: {
        roomId: {
          bsonType: 'string',
          description: 'Associated room ID'
        },
        shapes: {
          bsonType: 'array',
          description: 'Array of whiteboard shapes'
        },
        lastModified: {
          bsonType: 'date',
          description: 'Last modification timestamp'
        }
      }
    }
  }
});

db.createCollection('chat_messages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['roomId', 'userId', 'content', 'timestamp'],
      properties: {
        roomId: {
          bsonType: 'string',
          description: 'Associated room ID'
        },
        userId: {
          bsonType: 'string',
          description: 'Sender user ID'
        },
        content: {
          bsonType: 'string',
          description: 'Message content'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Message timestamp'
        },
        type: {
          enum: ['text', 'code', 'system'],
          description: 'Message type'
        }
      }
    }
  }
});

// Create indexes
db.rooms.createIndex({ roomId: 1 }, { unique: true });
db.rooms.createIndex({ createdAt: -1 });
db.rooms.createIndex({ lastAccessed: -1 });

db.files.createIndex({ roomId: 1, path: 1 }, { unique: true });
db.files.createIndex({ roomId: 1 });
db.files.createIndex({ lastModified: -1 });

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

db.whiteboards.createIndex({ roomId: 1 }, { unique: true });

db.chat_messages.createIndex({ roomId: 1, timestamp: -1 });
db.chat_messages.createIndex({ roomId: 1 });

print('MongoDB initialization completed successfully!');
print('Collections created: rooms, files, users, whiteboards, chat_messages');
print('Indexes created for optimal query performance');
