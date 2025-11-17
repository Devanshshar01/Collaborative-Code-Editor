import mongoose, {Schema, Document, Model} from 'mongoose';

// Participant interface
export interface IParticipant {
    userId: string;
    username: string;
    role: 'host' | 'editor' | 'viewer';
    joinedAt: Date;
    lastActive: Date;
}

// Room interface
export interface IRoom extends Document {
    roomId: string;
    name: string;
    createdBy: {
        userId: string;
        username: string;
    };
    participants: IParticipant[];
    code: {
        content: string;
        language: string;
        lastModifiedBy: string;
        lastModifiedAt: Date;
    };
    whiteboard: {
        snapshot: string; // JSON string of whiteboard state
        lastModifiedBy: string;
        lastModifiedAt: Date;
    };
    settings: {
        isPublic: boolean;
        maxParticipants: number;
        allowGuests: boolean;
        requireApproval: boolean;
    };
    createdAt: Date;
    expiresAt: Date;
    isActive: boolean;
    lastActivity: Date;

    // Virtual properties
    isExpired?: boolean;
    timeRemaining?: number;
    participantCount?: number;

    // Instance methods
    isHost(userId: string): boolean;

    isParticipant(userId: string): boolean;

    canEdit(userId: string): boolean;

    addParticipant(userId: string, username: string, role?: 'host' | 'editor' | 'viewer'): boolean;

    removeParticipant(userId: string): boolean;

    updateParticipantActivity(userId: string): void;
}

// Interface for Room Model with static methods
export interface IRoomModel extends Model<IRoom> {
    findByRoomId(roomId: string): Promise<IRoom | null>;

    findByUserId(userId: string): Promise<IRoom[]>;

    findPublicRooms(limit?: number): Promise<IRoom[]>;
}

// Participant sub-schema
const ParticipantSchema = new Schema<IParticipant>({
    userId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 50
    },
    role: {
        type: String,
        enum: ['host', 'editor', 'viewer'],
        default: 'editor',
        required: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {_id: false});

// Main Room schema
const RoomSchema = new Schema<IRoom>({
    roomId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
        minlength: 8,
        maxlength: 50
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100,
        default: 'Untitled Room'
    },
    createdBy: {
        userId: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true,
            trim: true
        }
    },
    participants: {
        type: [ParticipantSchema],
        default: [],
        validate: {
            validator: function (participants: IParticipant[]) {
                // Ensure at least one host exists
                return participants.some(p => p.role === 'host');
            },
            message: 'Room must have at least one host'
        }
    },
    code: {
        content: {
            type: String,
            default: ''
        },
        language: {
            type: String,
            default: 'python',
            enum: ['python', 'javascript', 'typescript', 'java', 'cpp', 'c', 'go', 'html', 'css']
        },
        lastModifiedBy: {
            type: String,
            default: ''
        },
        lastModifiedAt: {
            type: Date,
            default: Date.now
        }
    },
    whiteboard: {
        snapshot: {
            type: String,
            default: '{}' // Empty JSON object
        },
        lastModifiedBy: {
            type: String,
            default: ''
        },
        lastModifiedAt: {
            type: Date,
            default: Date.now
        }
    },
    settings: {
        isPublic: {
            type: Boolean,
            default: false
        },
        maxParticipants: {
            type: Number,
            default: 10,
            min: 1,
            max: 50
        },
        allowGuests: {
            type: Boolean,
            default: true
        },
        requireApproval: {
            type: Boolean,
            default: false
        }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'rooms'
});

// Indexes for performance
RoomSchema.index({roomId: 1}, {unique: true});
RoomSchema.index({expiresAt: 1});
RoomSchema.index({'createdBy.userId': 1});
RoomSchema.index({'participants.userId': 1});
RoomSchema.index({createdAt: -1});
RoomSchema.index({isActive: 1, expiresAt: 1});

// Compound index for common queries
RoomSchema.index({isActive: 1, 'settings.isPublic': 1, expiresAt: 1});

// TTL index - MongoDB will automatically delete expired documents
RoomSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

// Instance methods
RoomSchema.methods.isHost = function (userId: string): boolean {
    return this.participants.some(
        (p: IParticipant) => p.userId === userId && p.role === 'host'
    );
};

RoomSchema.methods.isParticipant = function (userId: string): boolean {
    return this.participants.some((p: IParticipant) => p.userId === userId);
};

RoomSchema.methods.canEdit = function (userId: string): boolean {
    const participant = this.participants.find((p: IParticipant) => p.userId === userId);
    return participant ? ['host', 'editor'].includes(participant.role) : false;
};

RoomSchema.methods.addParticipant = function (
    userId: string,
    username: string,
    role: 'host' | 'editor' | 'viewer' = 'editor'
): boolean {
    // Check if already participant
    if (this.isParticipant(userId)) {
        return false;
    }

    // Check max participants
    if (this.participants.length >= this.settings.maxParticipants) {
        throw new Error('Room is full');
    }

    this.participants.push({
        userId,
        username,
        role,
        joinedAt: new Date(),
        lastActive: new Date()
    });

    this.lastActivity = new Date();
    return true;
};

RoomSchema.methods.removeParticipant = function (userId: string): boolean {
    const initialLength = this.participants.length;
    this.participants = this.participants.filter((p: IParticipant) => p.userId !== userId);

    if (this.participants.length < initialLength) {
        this.lastActivity = new Date();
        return true;
    }
    return false;
};

RoomSchema.methods.updateParticipantActivity = function (userId: string): void {
    const participant = this.participants.find((p: IParticipant) => p.userId === userId);
    if (participant) {
        participant.lastActive = new Date();
        this.lastActivity = new Date();
    }
};

// Static methods
RoomSchema.statics.findByRoomId = function (roomId: string) {
    return this.findOne({roomId, isActive: true});
};

RoomSchema.statics.findByUserId = function (userId: string) {
    return this.find({
        'participants.userId': userId,
        isActive: true,
        expiresAt: {$gt: new Date()}
    }).sort({lastActivity: -1});
};

RoomSchema.statics.findPublicRooms = function (limit: number = 20) {
    return this.find({
        'settings.isPublic': true,
        isActive: true,
        expiresAt: {$gt: new Date()}
    })
        .sort({lastActivity: -1})
        .limit(limit);
};

// Pre-save middleware
RoomSchema.pre<IRoom>('save', function (this: IRoom, next: () => void) {
    // Ensure expiresAt is set
    if (!this.expiresAt) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7); // 7 days from now
        this.expiresAt = expirationDate;
    }

    // Update lastActivity
    this.lastActivity = new Date();

    next();
});

// Virtual for checking if expired
RoomSchema.virtual('isExpired').get(function (this: IRoom) {
    return this.expiresAt < new Date();
});

// Virtual for time remaining
RoomSchema.virtual('timeRemaining').get(function (this: IRoom) {
    const now = new Date().getTime();
    const expires = this.expiresAt.getTime();
    return Math.max(0, expires - now);
});

// Virtual for participant count
RoomSchema.virtual('participantCount').get(function (this: IRoom) {
    return this.participants.length;
});

// Ensure virtuals are included in JSON
RoomSchema.set('toJSON', {virtuals: true});
RoomSchema.set('toObject', {virtuals: true});

// Export model with proper typing
export const Room = mongoose.model<IRoom, IRoomModel>('Room', RoomSchema);
