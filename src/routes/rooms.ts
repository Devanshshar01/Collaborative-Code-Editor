import {Router, Request, Response} from 'express';
import {nanoid} from 'nanoid';
import {Room, IRoom, IParticipant} from '../db/schemas/room.schema';

const router = Router();

/**
 * POST /api/rooms/create
 * Create a new room with unique ID
 */
router.post('/create', async (req: Request, res: Response) => {
    try {
        const {
            name,
            userId,
            username,
            language = 'python',
            isPublic = false,
            maxParticipants = 10,
            allowGuests = true
        } = req.body;

        // Validation
        if (!userId || !username) {
            return res.status(400).json({
                error: 'userId and username are required'
            });
        }

        if (name && (name.length < 1 || name.length > 100)) {
            return res.status(400).json({
                error: 'Room name must be between 1 and 100 characters'
            });
        }

        if (maxParticipants < 1 || maxParticipants > 50) {
            return res.status(400).json({
                error: 'maxParticipants must be between 1 and 50'
            });
        }

        // Generate unique room ID
        const roomId = nanoid(12); // 12 character unique ID

        // Calculate expiration date (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create room
        const room = new Room({
            roomId,
            name: name || `${username}'s Room`,
            createdBy: {
                userId,
                username
            },
            participants: [{
                userId,
                username,
                role: 'host',
                joinedAt: new Date(),
                lastActive: new Date()
            }],
            code: {
                content: '',
                language,
                lastModifiedBy: userId,
                lastModifiedAt: new Date()
            },
            whiteboard: {
                snapshot: '{}',
                lastModifiedBy: userId,
                lastModifiedAt: new Date()
            },
            settings: {
                isPublic,
                maxParticipants,
                allowGuests,
                requireApproval: false
            },
            expiresAt,
            isActive: true
        });

        await room.save();

        res.status(201).json({
            message: 'Room created successfully',
            room: {
                roomId: room.roomId,
                name: room.name,
                createdBy: room.createdBy,
                participants: room.participants,
                settings: room.settings,
                createdAt: room.createdAt,
                expiresAt: room.expiresAt
            }
        });

    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({
            error: 'Failed to create room',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * GET /api/rooms/:roomId
 * Get room data by ID
 */
router.get('/:roomId', async (req: Request, res: Response) => {
    try {
        const {roomId} = req.params;
        const {userId} = req.query;

        // Validation
        if (!roomId) {
            return res.status(400).json({
                error: 'roomId is required'
            });
        }

        // Find room
        const room = await Room.findByRoomId(roomId);

        if (!room) {
            return res.status(404).json({
                error: 'Room not found or has expired'
            });
        }

        // Check if room is expired
        if (room.expiresAt < new Date()) {
            return res.status(410).json({
                error: 'Room has expired'
            });
        }

        // Check access permissions
        if (!room.settings.isPublic && userId) {
            const isParticipant = room.isParticipant(userId as string);

            if (!isParticipant) {
                return res.status(403).json({
                    error: 'Access denied. Room is private.',
                    roomId: room.roomId,
                    isPublic: false
                });
            }
        }

        // Update participant activity if userId provided
        if (userId && room.isParticipant(userId as string)) {
            room.updateParticipantActivity(userId as string);
            await room.save();
        }

        // Return room data
        res.status(200).json({
            room: {
                roomId: room.roomId,
                name: room.name,
                createdBy: room.createdBy,
                participants: room.participants,
                code: room.code,
                whiteboard: room.whiteboard,
                settings: room.settings,
                createdAt: room.createdAt,
                expiresAt: room.expiresAt,
                isActive: room.isActive,
                lastActivity: room.lastActivity,
                participantCount: room.participantCount,
                timeRemaining: room.timeRemaining
            }
        });

    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({
            error: 'Failed to fetch room',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * POST /api/rooms/:roomId/join
 * Join an existing room
 */
router.post('/:roomId/join', async (req: Request, res: Response) => {
    try {
        const {roomId} = req.params;
        const {userId, username, role = 'editor'} = req.body;

        // Validation
        if (!userId || !username) {
            return res.status(400).json({
                error: 'userId and username are required'
            });
        }

        // Find room
        const room = await Room.findByRoomId(roomId);

        if (!room) {
            return res.status(404).json({
                error: 'Room not found'
            });
        }

        // Check if expired
        if (room.expiresAt < new Date()) {
            return res.status(410).json({
                error: 'Room has expired'
            });
        }

        // Check if already a participant
        if (room.isParticipant(userId)) {
            return res.status(200).json({
                message: 'Already a participant',
                room: {
                    roomId: room.roomId,
                    role: room.participants.find((p: IParticipant) => p.userId === userId)?.role
                }
            });
        }

        // Check if room is full
        if (room.participants.length >= room.settings.maxParticipants) {
            return res.status(403).json({
                error: 'Room is full'
            });
        }

        // Check if guests are allowed
        if (!room.settings.allowGuests && !room.isParticipant(userId)) {
            return res.status(403).json({
                error: 'Room does not allow guests'
            });
        }

        // Add participant
        room.addParticipant(userId, username, role);
        await room.save();

        res.status(200).json({
            message: 'Joined room successfully',
            room: {
                roomId: room.roomId,
                name: room.name,
                participants: room.participants,
                role: role
            }
        });

    } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).json({
            error: 'Failed to join room',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * POST /api/rooms/:roomId/leave
 * Leave a room
 */
router.post('/:roomId/leave', async (req: Request, res: Response) => {
    try {
        const {roomId} = req.params;
        const {userId} = req.body;

        // Validation
        if (!userId) {
            return res.status(400).json({
                error: 'userId is required'
            });
        }

        // Find room
        const room = await Room.findByRoomId(roomId);

        if (!room) {
            return res.status(404).json({
                error: 'Room not found'
            });
        }

        // Check if participant
        if (!room.isParticipant(userId)) {
            return res.status(400).json({
                error: 'Not a participant in this room'
            });
        }

        // Check if host is leaving
        if (room.isHost(userId)) {
            // If last host, transfer host to another participant or delete room
            const hosts = room.participants.filter((p: IParticipant) => p.role === 'host');
            if (hosts.length === 1) {
                // Transfer host to first editor
                const nextHost = room.participants.find((p: IParticipant) => p.role === 'editor');
                if (nextHost) {
                    nextHost.role = 'host';
                } else {
                    // No other participants, deactivate room
                    room.isActive = false;
                }
            }
        }

        // Remove participant
        room.removeParticipant(userId);

        // If no participants left, deactivate room
        if (room.participants.length === 0) {
            room.isActive = false;
        }

        await room.save();

        res.status(200).json({
            message: 'Left room successfully',
            roomId: room.roomId
        });

    } catch (error) {
        console.error('Error leaving room:', error);
        res.status(500).json({
            error: 'Failed to leave room',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * PUT /api/rooms/:roomId/code
 * Update room code
 */
router.put('/:roomId/code', async (req: Request, res: Response) => {
    try {
        const {roomId} = req.params;
        const {userId, code, language} = req.body;

        // Validation
        if (!userId) {
            return res.status(400).json({
                error: 'userId is required'
            });
        }

        // Find room
        const room = await Room.findByRoomId(roomId);

        if (!room) {
            return res.status(404).json({
                error: 'Room not found'
            });
        }

        // Check if user can edit
        if (!room.canEdit(userId)) {
            return res.status(403).json({
                error: 'You do not have permission to edit code in this room'
            });
        }

        // Update code
        if (code !== undefined) {
            room.code.content = code;
            room.code.lastModifiedBy = userId;
            room.code.lastModifiedAt = new Date();
        }

        if (language) {
            room.code.language = language;
        }

        room.updateParticipantActivity(userId);
        await room.save();

        res.status(200).json({
            message: 'Code updated successfully',
            code: room.code
        });

    } catch (error) {
        console.error('Error updating code:', error);
        res.status(500).json({
            error: 'Failed to update code',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * PUT /api/rooms/:roomId/whiteboard
 * Update whiteboard snapshot
 */
router.put('/:roomId/whiteboard', async (req: Request, res: Response) => {
    try {
        const {roomId} = req.params;
        const {userId, snapshot} = req.body;

        // Validation
        if (!userId) {
            return res.status(400).json({
                error: 'userId is required'
            });
        }

        if (!snapshot) {
            return res.status(400).json({
                error: 'snapshot is required'
            });
        }

        // Find room
        const room = await Room.findByRoomId(roomId);

        if (!room) {
            return res.status(404).json({
                error: 'Room not found'
            });
        }

        // Check if user can edit
        if (!room.canEdit(userId)) {
            return res.status(403).json({
                error: 'You do not have permission to edit whiteboard in this room'
            });
        }

        // Update whiteboard
        room.whiteboard.snapshot = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);
        room.whiteboard.lastModifiedBy = userId;
        room.whiteboard.lastModifiedAt = new Date();

        room.updateParticipantActivity(userId);
        await room.save();

        res.status(200).json({
            message: 'Whiteboard updated successfully',
            whiteboard: room.whiteboard
        });

    } catch (error) {
        console.error('Error updating whiteboard:', error);
        res.status(500).json({
            error: 'Failed to update whiteboard',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * DELETE /api/rooms/:roomId
 * Delete a room (admin/host only)
 */
router.delete('/:roomId', async (req: Request, res: Response) => {
    try {
        const {roomId} = req.params;
        const {userId, isAdmin = false} = req.body;

        // Validation
        if (!userId) {
            return res.status(400).json({
                error: 'userId is required'
            });
        }

        // Find room
        const room = await Room.findByRoomId(roomId);

        if (!room) {
            return res.status(404).json({
                error: 'Room not found'
            });
        }

        // Check permissions - must be host or admin
        if (!isAdmin && !room.isHost(userId)) {
            return res.status(403).json({
                error: 'Only room host or admin can delete the room'
            });
        }

        // Soft delete - mark as inactive
        room.isActive = false;
        await room.save();

        // Optional: hard delete
        // await Room.deleteOne({ roomId });

        res.status(200).json({
            message: 'Room deleted successfully',
            roomId: room.roomId
        });

    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({
            error: 'Failed to delete room',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * GET /api/rooms/user/:userId
 * Get all rooms for a user
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const {userId} = req.params;

        if (!userId) {
            return res.status(400).json({
                error: 'userId is required'
            });
        }

        const rooms = await Room.findByUserId(userId);

        res.status(200).json({
            rooms: rooms.map((room: IRoom) => ({
                roomId: room.roomId,
                name: room.name,
                createdBy: room.createdBy,
                participantCount: room.participantCount,
                role: room.participants.find((p: IParticipant) => p.userId === userId)?.role,
                lastActivity: room.lastActivity,
                expiresAt: room.expiresAt,
                timeRemaining: room.timeRemaining
            })),
            count: rooms.length
        });

    } catch (error) {
        console.error('Error fetching user rooms:', error);
        res.status(500).json({
            error: 'Failed to fetch rooms',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * GET /api/rooms/public/list
 * Get list of public rooms
 */
router.get('/public/list', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;

        const rooms = await Room.findPublicRooms(Math.min(limit, 50));

        res.status(200).json({
            rooms: rooms.map((room: IRoom) => ({
                roomId: room.roomId,
                name: room.name,
                createdBy: room.createdBy,
                participantCount: room.participantCount,
                maxParticipants: room.settings.maxParticipants,
                lastActivity: room.lastActivity,
                language: room.code.language
            })),
            count: rooms.length
        });

    } catch (error) {
        console.error('Error fetching public rooms:', error);
        res.status(500).json({
            error: 'Failed to fetch public rooms',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * PUT /api/rooms/:roomId/settings
 * Update room settings (host only)
 */
router.put('/:roomId/settings', async (req: Request, res: Response) => {
    try {
        const {roomId} = req.params;
        const {userId, settings} = req.body;

        // Validation
        if (!userId) {
            return res.status(400).json({
                error: 'userId is required'
            });
        }

        // Find room
        const room = await Room.findByRoomId(roomId);

        if (!room) {
            return res.status(404).json({
                error: 'Room not found'
            });
        }

        // Check if user is host
        if (!room.isHost(userId)) {
            return res.status(403).json({
                error: 'Only room host can update settings'
            });
        }

        // Update settings
        if (settings.isPublic !== undefined) {
            room.settings.isPublic = settings.isPublic;
        }
        if (settings.maxParticipants) {
            room.settings.maxParticipants = Math.min(Math.max(settings.maxParticipants, 1), 50);
        }
        if (settings.allowGuests !== undefined) {
            room.settings.allowGuests = settings.allowGuests;
        }
        if (settings.requireApproval !== undefined) {
            room.settings.requireApproval = settings.requireApproval;
        }

        await room.save();

        res.status(200).json({
            message: 'Settings updated successfully',
            settings: room.settings
        });

    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            error: 'Failed to update settings',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
