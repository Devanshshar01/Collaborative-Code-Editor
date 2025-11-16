export interface User {
    id: string;
    name: string;
}

export interface Room {
    id: string;
    users: User[];
    code: string;
}

export interface CodeChange {
    roomId: string;
    newCode: string;
}

export interface JoinRoomData {
    roomId: string;
    user: User;
}

export interface LeaveRoomData {
    roomId: string;
    userId: string;
}
