import {User, Room} from '../types';

interface UserSession {
    user: User;
    roomId: string;
}

export class RoomManager {
    private readonly rooms: Map<string, Room>;
    private readonly socketIdToSession: Map<string, UserSession>;

    constructor() {
        this.rooms = new Map<string, Room>();
        this.socketIdToSession = new Map<string, UserSession>();
    }

    public joinRoom(socketId: string, roomId: string, user: User): Room {
        this.socketIdToSession.set(socketId, {user, roomId});

        let room = this.rooms.get(roomId);
        if (!room) {
            room = {id: roomId, users: [], code: '// Welcome to your collaborative coding session!\n'};
            this.rooms.set(roomId, room);
        }

        const userExists = room.users.some(u => u.id === user.id);
        if (!userExists) {
            room.users.push(user);
        }

        return room;
    }

    public leaveRoom(socketId: string): {
        room: Room | undefined,
        userId: string | undefined,
        roomId: string | undefined
    } {
        const session = this.socketIdToSession.get(socketId);
        if (!session) {
            return {room: undefined, userId: undefined, roomId: undefined};
        }

        const {roomId, user} = session;
        const room = this.rooms.get(roomId);

        this.socketIdToSession.delete(socketId);

        if (room) {
            room.users = room.users.filter(u => u.id !== user.id);
            if (room.users.length === 0) {
                this.rooms.delete(roomId);
                console.log(`Room ${roomId} is now empty and has been removed.`);
            }
            return {room, userId: user.id, roomId};
        }

        return {room: undefined, userId: user.id, roomId};
    }

    public getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    public updateCode(roomId: string, code: string): Room | undefined {
        const room = this.rooms.get(roomId);
        if (room) {
            room.code = code;
        }
        return room;
    }
}