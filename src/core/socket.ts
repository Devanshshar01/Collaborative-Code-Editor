import {Server, Socket} from 'socket.io';
import {RoomManager} from './room-manager';
import {CodeChange, JoinRoomData} from '../types';
import {ParticipantMetadata, SIGNALING_EVENTS} from '../types/video';

export function initializeSocket(server: any) {
    const io = new Server(server, {
        cors: { // Your CORS settings here
            origin: "*",
        }
    });

    const roomManager = new RoomManager();

    io.on('connection', (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('join-room', (data: JoinRoomData) => {
            try {
                socket.join(data.roomId);
                const room = roomManager.joinRoom(socket.id, data.roomId, data.user);

                socket.emit('room-joined', room);
                io.to(data.roomId).emit('user-joined', room.users);

                console.log(`${data.user.name} joined room ${data.roomId}`);
            } catch (error) {
                console.error(`Error joining room: ${error instanceof Error ? error.message : 'Unknown error'}`);
                socket.emit('error', 'Could not join room');
            }
        });

        socket.on('code-change', (data: CodeChange) => {
            try {
                const room = roomManager.updateCode(data.roomId, data.newCode);
                if (room) {
                    socket.to(data.roomId).emit('code-updated', data.newCode);
                }
            } catch (error) {
                console.error(`Error updating code: ${error instanceof Error ? error.message : 'Unknown error'}`);
                socket.emit('error', 'Could not update code');
            }
        });

        socket.on('disconnect', () => {
            try {
                const {room, userId, roomId} = roomManager.leaveRoom(socket.id);
                if (room && userId && roomId) {
                    io.to(roomId).emit('user-left', room.users);
                    console.log(`User ${userId} left room ${roomId}`);
                }
            } catch (error) {
                console.error(`Error on disconnect: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            console.log(`Socket disconnected: ${socket.id}`);
        });

        /**
         * WebRTC signaling events
         */
        const forwardToRoomParticipant = (event: string, payload: {
            roomId: string;
            targetSocketId: string;
            data: any
        }) => {
            try {
                const {roomId, targetSocketId, data} = payload;
                if (!roomId || !targetSocketId) {
                    return;
                }
                io.to(targetSocketId).emit(event, {
                    fromSocketId: socket.id,
                    roomId,
                    data
                });
            } catch (error) {
                console.error(`Error forwarding ${event}:`, error);
            }
        };

        socket.on(SIGNALING_EVENTS.OFFER, (payload) => {
            forwardToRoomParticipant(SIGNALING_EVENTS.OFFER, payload);
        });

        socket.on(SIGNALING_EVENTS.ANSWER, (payload) => {
            forwardToRoomParticipant(SIGNALING_EVENTS.ANSWER, payload);
        });

        socket.on(SIGNALING_EVENTS.ICE_CANDIDATE, (payload) => {
            forwardToRoomParticipant(SIGNALING_EVENTS.ICE_CANDIDATE, payload);
        });

        socket.on('webrtc-metadata', (payload: { roomId: string; metadata: ParticipantMetadata }) => {
            try {
                const {roomId, metadata} = payload;
                const enrichedMetadata = {
                    ...metadata,
                    socketId: socket.id
                };
                socket.to(roomId).emit('webrtc-peer-metadata', {
                    fromSocketId: socket.id,
                    metadata: enrichedMetadata
                });
            } catch (error) {
                console.error('Error broadcasting WebRTC metadata:', error);
            }
        });

        socket.on(SIGNALING_EVENTS.MUTE, (payload) => {
            socket.to(payload.roomId).emit(SIGNALING_EVENTS.MUTE, {
                fromSocketId: socket.id,
                ...payload
            });
        });

        socket.on(SIGNALING_EVENTS.UNMUTE, (payload) => {
            socket.to(payload.roomId).emit(SIGNALING_EVENTS.UNMUTE, {
                fromSocketId: socket.id,
                ...payload
            });
        });

        socket.on(SIGNALING_EVENTS.VIDEO_OFF, (payload) => {
            socket.to(payload.roomId).emit(SIGNALING_EVENTS.VIDEO_OFF, {
                fromSocketId: socket.id,
                ...payload
            });
        });

        socket.on(SIGNALING_EVENTS.VIDEO_ON, (payload) => {
            socket.to(payload.roomId).emit(SIGNALING_EVENTS.VIDEO_ON, {
                fromSocketId: socket.id,
                ...payload
            });
        });

        socket.on(SIGNALING_EVENTS.SCREEN_SHARE_ON, (payload) => {
            socket.to(payload.roomId).emit(SIGNALING_EVENTS.SCREEN_SHARE_ON, {
                fromSocketId: socket.id,
                ...payload
            });
        });

        socket.on(SIGNALING_EVENTS.SCREEN_SHARE_OFF, (payload) => {
            socket.to(payload.roomId).emit(SIGNALING_EVENTS.SCREEN_SHARE_OFF, {
                fromSocketId: socket.id,
                ...payload
            });
        });

        /**
         * Chat messaging events
         */
        socket.on('chat-message', (message: {
            roomId: string;
            userId: string;
            userName: string;
            text: string;
            timestamp: number;
        }) => {
            try {
                // Broadcast message to all users in the room except sender
                socket.to(message.roomId).emit('chat-message', {
                    ...message,
                    type: 'received'
                });

                console.log(`Chat message from ${message.userName} in room ${message.roomId}`);
            } catch (error) {
                console.error('Error broadcasting chat message:', error);
            }
        });

        socket.on('typing-indicator', (data: { roomId: string; userName: string; isTyping: boolean }) => {
            try {
                socket.to(data.roomId).emit('user-typing', data);
            } catch (error) {
                console.error('Error broadcasting typing indicator:', error);
            }
        });

        // Heartbeat mechanism
        const heartbeatInterval = setInterval(() => {
            socket.emit('heartbeat', {timestamp: Date.now()});
        }, 30000);

        socket.on('heartbeat-ack', () => {
            // Client is alive
        });

        socket.on('error', (err) => {
            console.error("Socket.IO error:", err);
        });
    });

    return io;
}
