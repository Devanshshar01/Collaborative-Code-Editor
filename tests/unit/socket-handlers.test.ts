import {Server as SocketServer, Socket} from 'socket.io';
import {createServer} from 'http';
import {io as ioClient, Socket as ClientSocket} from 'socket.io-client';
import {initializeSocket} from '../../src/core/socket';
import {SIGNALING_EVENTS} from '../../src/types/video';

describe('WebSocket Event Handlers - Unit Tests', () => {
    let httpServer: any;
    let ioServer: SocketServer;
    let clientSocket1: ClientSocket;
    let clientSocket2: ClientSocket;
    let serverAddress: string;

    beforeAll((done) => {
        httpServer = createServer();
        ioServer = initializeSocket(httpServer);

        httpServer.listen(() => {
            const port = (httpServer.address() as any).port;
            serverAddress = `http://localhost:${port}`;
            done();
        });
    });

    afterAll((done) => {
        ioServer.close();
        httpServer.close(done);
    });

    beforeEach((done) => {
        clientSocket1 = ioClient(serverAddress, {
            transports: ['websocket'],
            forceNew: true
        });

        clientSocket2 = ioClient(serverAddress, {
            transports: ['websocket'],
            forceNew: true
        });

        let connectedCount = 0;
        const checkDone = () => {
            connectedCount++;
            if (connectedCount === 2) done();
        };

        clientSocket1.on('connect', checkDone);
        clientSocket2.on('connect', checkDone);
    });

    afterEach(() => {
        if (clientSocket1.connected) clientSocket1.disconnect();
        if (clientSocket2.connected) clientSocket2.disconnect();
    });

    describe('Room Management', () => {
        it('should allow a user to join a room', (done) => {
            const roomId = 'test-room-1';
            const user = {id: 'user1', name: 'Alice'};

            clientSocket1.on('room-joined', (room) => {
                expect(room).toBeDefined();
                expect(room.id).toBe(roomId);
                expect(room.users).toHaveLength(1);
                expect(room.users[0].name).toBe('Alice');
                done();
            });

            clientSocket1.emit('join-room', {roomId, user});
        });

        it('should notify other users when someone joins', (done) => {
            const roomId = 'test-room-2';
            const user1 = {id: 'user1', name: 'Alice'};
            const user2 = {id: 'user2', name: 'Bob'};

            clientSocket1.on('room-joined', () => {
                // First user joined, now second user joins
                clientSocket2.emit('join-room', {roomId, user: user2});
            });

            clientSocket1.on('user-joined', (users) => {
                expect(users).toHaveLength(2);
                expect(users.find((u: any) => u.name === 'Bob')).toBeDefined();
                done();
            });

            clientSocket1.emit('join-room', {roomId, user: user1});
        });

        it('should handle code changes in a room', (done) => {
            const roomId = 'test-room-3';
            const user = {id: 'user1', name: 'Alice'};
            const newCode = 'console.log("Hello World");';

            clientSocket2.on('code-updated', (code) => {
                expect(code).toBe(newCode);
                done();
            });

            clientSocket1.on('room-joined', () => {
                clientSocket2.on('room-joined', () => {
                    // Both in room, now emit code change
                    clientSocket1.emit('code-change', {roomId, newCode});
                });
                clientSocket2.emit('join-room', {roomId, user: {id: 'user2', name: 'Bob'}});
            });

            clientSocket1.emit('join-room', {roomId, user});
        });

        it('should notify when a user disconnects', (done) => {
            const roomId = 'test-room-4';

            clientSocket2.on('user-left', (users) => {
                expect(users).toHaveLength(1);
                done();
            });

            clientSocket1.on('room-joined', () => {
                clientSocket2.on('room-joined', () => {
                    // Both in room, now disconnect first user
                    clientSocket1.disconnect();
                });
                clientSocket2.emit('join-room', {
                    roomId,
                    user: {id: 'user2', name: 'Bob'}
                });
            });

            clientSocket1.emit('join-room', {
                roomId,
                user: {id: 'user1', name: 'Alice'}
            });
        });
    });

    describe('WebRTC Signaling', () => {
        const roomId = 'webrtc-room';

        beforeEach((done) => {
            let joinedCount = 0;
            const checkBothJoined = () => {
                joinedCount++;
                if (joinedCount === 2) done();
            };

            clientSocket1.on('room-joined', checkBothJoined);
            clientSocket2.on('room-joined', checkBothJoined);

            clientSocket1.emit('join-room', {
                roomId,
                user: {id: 'user1', name: 'Alice'}
            });
            clientSocket2.emit('join-room', {
                roomId,
                user: {id: 'user2', name: 'Bob'}
            });
        });

        it('should forward WebRTC offer', (done) => {
            const offerData = {type: 'offer', sdp: 'mock-sdp'};

            clientSocket2.on(SIGNALING_EVENTS.OFFER, (payload) => {
                expect(payload.data).toEqual(offerData);
                expect(payload.fromSocketId).toBe(clientSocket1.id);
                done();
            });

            clientSocket1.emit(SIGNALING_EVENTS.OFFER, {
                roomId,
                targetSocketId: clientSocket2.id,
                data: offerData
            });
        });

        it('should forward WebRTC answer', (done) => {
            const answerData = {type: 'answer', sdp: 'mock-sdp'};

            clientSocket1.on(SIGNALING_EVENTS.ANSWER, (payload) => {
                expect(payload.data).toEqual(answerData);
                expect(payload.fromSocketId).toBe(clientSocket2.id);
                done();
            });

            clientSocket2.emit(SIGNALING_EVENTS.ANSWER, {
                roomId,
                targetSocketId: clientSocket1.id,
                data: answerData
            });
        });

        it('should forward ICE candidates', (done) => {
            const iceCandidate = {
                candidate: 'mock-candidate',
                sdpMLineIndex: 0
            };

            clientSocket2.on(SIGNALING_EVENTS.ICE_CANDIDATE, (payload) => {
                expect(payload.data).toEqual(iceCandidate);
                done();
            });

            clientSocket1.emit(SIGNALING_EVENTS.ICE_CANDIDATE, {
                roomId,
                targetSocketId: clientSocket2.id,
                data: iceCandidate
            });
        });

        it('should broadcast mute/unmute events', (done) => {
            clientSocket2.on(SIGNALING_EVENTS.MUTE, (payload) => {
                expect(payload.fromSocketId).toBe(clientSocket1.id);
                expect(payload.roomId).toBe(roomId);
                done();
            });

            clientSocket1.emit(SIGNALING_EVENTS.MUTE, {roomId});
        });

        it('should broadcast video on/off events', (done) => {
            clientSocket2.on(SIGNALING_EVENTS.VIDEO_OFF, (payload) => {
                expect(payload.fromSocketId).toBe(clientSocket1.id);
                done();
            });

            clientSocket1.emit(SIGNALING_EVENTS.VIDEO_OFF, {roomId});
        });

        it('should broadcast screen share events', (done) => {
            clientSocket2.on(SIGNALING_EVENTS.SCREEN_SHARE_ON, (payload) => {
                expect(payload.fromSocketId).toBe(clientSocket1.id);
                done();
            });

            clientSocket1.emit(SIGNALING_EVENTS.SCREEN_SHARE_ON, {roomId});
        });

        it('should broadcast WebRTC metadata', (done) => {
            const metadata = {
                audio: true,
                video: true,
                screen: false
            };

            clientSocket2.on('webrtc-peer-metadata', (payload) => {
                expect(payload.metadata.audio).toBe(true);
                expect(payload.metadata.socketId).toBe(clientSocket1.id);
                done();
            });

            clientSocket1.emit('webrtc-metadata', {roomId, metadata});
        });
    });

    describe('Chat Messaging', () => {
        const roomId = 'chat-room';

        beforeEach((done) => {
            let joinedCount = 0;
            const checkBothJoined = () => {
                joinedCount++;
                if (joinedCount === 2) done();
            };

            clientSocket1.on('room-joined', checkBothJoined);
            clientSocket2.on('room-joined', checkBothJoined);

            clientSocket1.emit('join-room', {
                roomId,
                user: {id: 'user1', name: 'Alice'}
            });
            clientSocket2.emit('join-room', {
                roomId,
                user: {id: 'user2', name: 'Bob'}
            });
        });

        it('should broadcast chat messages to other users', (done) => {
            const message = {
                roomId,
                userId: 'user1',
                userName: 'Alice',
                text: 'Hello, Bob!',
                timestamp: Date.now()
            };

            clientSocket2.on('chat-message', (receivedMessage) => {
                expect(receivedMessage.text).toBe('Hello, Bob!');
                expect(receivedMessage.userName).toBe('Alice');
                expect(receivedMessage.type).toBe('received');
                done();
            });

            clientSocket1.emit('chat-message', message);
        });

        it('should broadcast typing indicators', (done) => {
            const typingData = {
                roomId,
                userName: 'Alice',
                isTyping: true
            };

            clientSocket2.on('user-typing', (data) => {
                expect(data.userName).toBe('Alice');
                expect(data.isTyping).toBe(true);
                done();
            });

            clientSocket1.emit('typing-indicator', typingData);
        });
    });

    describe('Heartbeat Mechanism', () => {
        it('should send heartbeat to clients', (done) => {
            clientSocket1.on('heartbeat', (data) => {
                expect(data.timestamp).toBeDefined();
                expect(typeof data.timestamp).toBe('number');
                done();
            });
        });

        it('should accept heartbeat acknowledgments', (done) => {
            clientSocket1.on('heartbeat', () => {
                clientSocket1.emit('heartbeat-ack');
                // If no error, test passes
                setTimeout(done, 100);
            });
        });
    });

    describe('Error Handling', () => {
        it('should emit error on invalid room join', (done) => {
            clientSocket1.on('error', (message) => {
                expect(message).toBeDefined();
                done();
            });

            // Emit invalid data (missing required fields)
            clientSocket1.emit('join-room', {roomId: null});
        });

        it('should handle code update in non-existent room', (done) => {
            clientSocket1.on('error', (message) => {
                expect(message).toContain('Could not update code');
                done();
            });

            clientSocket1.emit('code-change', {
                roomId: 'non-existent-room',
                newCode: 'test'
            });
        });
    });
});
