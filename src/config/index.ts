import {ServerOptions} from "socket.io";

const allowedOrigins: string[] = [
    'http://localhost:3000',
    'http://localhost:3001',
];

export const corsOptions: ServerOptions["cors"] = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true
};

export const SERVER_PORT = process.env.PORT || 4000;
export const HEARTBEAT_INTERVAL = 30000;
export const HEARTBEAT_TIMEOUT = 15000;
