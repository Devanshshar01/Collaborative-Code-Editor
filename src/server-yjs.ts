import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { initializeSocket } from './core/socket';
import YjsWebSocketServer from './core/yjs-websocket-server';
import { SERVER_PORT } from './config';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO for room management
initializeSocket(server);

// Initialize Yjs WebSocket server for CRDT synchronization
const yjsPort = parseInt(process.env.YJS_PORT || '1234');
const yjsServer = new YjsWebSocketServer(yjsPort);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        services: {
            socketio: 'running',
            yjs: 'running'
        },
        timestamp: new Date().toISOString()
    });
});

// Document info endpoint
app.get('/api/rooms/:roomId/info', async (req, res) => {
    try {
        // This endpoint could be extended to provide document metadata
        res.json({
            roomId: req.params.roomId,
            message: 'Document info endpoint'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get document info' });
    }
});

// Start servers
async function startServers() {
    try {
        // Start Yjs WebSocket server
        await yjsServer.start();

        // Start HTTP/Socket.IO server
        server.listen(SERVER_PORT, () => {
            console.log(`Main server running on port ${SERVER_PORT}`);
            console.log(`Socket.IO available at http://localhost:${SERVER_PORT}`);
            console.log(`Yjs WebSocket server running on port ${yjsPort}`);
        });
    } catch (error) {
        console.error('Failed to start servers:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down servers...');

    try {
        // Stop Yjs server (will save all documents)
        await yjsServer.stop();

        // Close HTTP server
        server.close(() => {
            console.log('Servers shut down successfully');
            process.exit(0);
        });

        // Force exit after 10 seconds
        setTimeout(() => {
            console.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the servers
startServers();