import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Room } from '../types';

// Use environment variable for server URL, with a fallback for local development
const SERVER_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:4000';
const MAX_RETRIES = 5;

/**
 * The return type of the useSocket hook.
 */
interface UseSocketReturn {
    isConnected: boolean;
    users: User[];
    code: string;
    socket: Socket | null;
    joinRoom: (roomId: string, user: User) => void;
    leaveRoom: () => void;
    sendCodeChange: (newCode: string) => void;
}

/**
 * A custom React hook to manage a Socket.IO connection for the collaborative editor.
 */
export const useSocket = (): UseSocketReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [code, setCode] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    // Use refs to store socket and roomId to avoid re-renders
    const socketRef = useRef<Socket | null>(null);
    const roomIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Initialize the socket connection
        const socket = io(SERVER_URL, {
            reconnection: true,
            reconnectionAttempts: MAX_RETRIES, // Retry up to 5 times
            reconnectionDelay: 1000,          // Start with a 1s delay
            reconnectionDelayMax: 5000,       // Max delay of 5s (exponential backoff)
            autoConnect: true,
        });

        socketRef.current = socket;

        // --- Event Handlers ---
        const handleConnect = () => {
            console.log('Socket connected successfully');
            setIsConnected(true);
            setRetryCount(0); // Reset retry count on successful connection
        };

        const handleDisconnect = (reason: Socket.DisconnectReason) => {
            console.log(`Socket disconnected: ${reason}`);
            setIsConnected(false);
            // Reset state on disconnect
            setUsers([]);
            setCode('');
        };

        const handleConnectError = (error: Error) => {
            console.error(`Socket connection error: ${error.message}`);
            setRetryCount(prev => prev + 1);
        };

        // --- Register Listeners ---
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);

        // Custom application events
        socket.on('room-joined', (room: Room) => {
            console.log('Joined room and received initial state:', room);
            setUsers(room.users);
            setCode(room.code);
        });

        socket.on('user-joined', (currentUsers: User[]) => {
            console.log('A user joined. Updated user list:', currentUsers);
            setUsers(currentUsers);
        });

        socket.on('user-left', (currentUsers: User[]) => {
            console.log('A user left. Updated user list:', currentUsers);
            setUsers(currentUsers);
        });

        socket.on('code-updated', (newCode: string) => {
            setCode(newCode);
        });

        socket.on('error', (errorMessage: string) => {
            console.error('Received error from server:', errorMessage);
        });

        // --- Cleanup Logic ---
        // This function is returned from useEffect and runs when the component unmounts
        return () => {
            // Remove all event listeners to prevent memory leaks
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleConnectError);
            socket.off('room-joined');
            socket.off('user-joined');
            socket.off('user-left');
            socket.off('code-updated');
            socket.off('error');

            // Disconnect the socket
            socket.disconnect();
            console.log('Socket disconnected on component unmount');
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // --- Exposed Methods ---
    const joinRoom = (roomId: string, user: User) => {
        if (socketRef.current?.connected) {
            roomIdRef.current = roomId; // Store roomId for later use
            socketRef.current.emit('join-room', { roomId, user });
        } else {
            console.error('Socket not connected. Cannot join room.');
        }
    };

    const leaveRoom = () => {
        if (socketRef.current && roomIdRef.current) {
            // In the server implementation, disconnect is sufficient to trigger leave.
            // A specific 'leave-room' event could be added for more granular control.
            socketRef.current.disconnect();
            roomIdRef.current = null;
        }
    };

    const sendCodeChange = (newCode: string) => {
        if (socketRef.current?.connected && roomIdRef.current) {
            socketRef.current.emit('code-change', {
                roomId: roomIdRef.current,
                newCode
            });
        }
    };

    return { isConnected, users, code, socket: socketRef.current, joinRoom, leaveRoom, sendCodeChange };
};
