import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/bin/utils';

const port = 1234;

console.log('Starting Yjs WebSocket server...');

const wss = new WebSocketServer({ port });

wss.on('connection', (ws, req) => {
    console.log('New connection established');
    setupWSConnection(ws, req);
});

console.log(`Yjs WebSocket server is running on ws://localhost:${port}`);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down Yjs server...');
    wss.close(() => {
        console.log('Yjs server shut down successfully');
        process.exit(0);
    });
});
