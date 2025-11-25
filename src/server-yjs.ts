import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import { initializeSocket } from './core/socket';
import YjsWebSocketServer from './core/yjs-websocket-server';
import { SERVER_PORT } from './config';
import { FileService } from './services/files';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const fileService = new FileService();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Socket.IO for room management and terminal
initializeSocket(server);

// Initialize Yjs WebSocket server for CRDT synchronization
const yjsPort = parseInt(process.env.YJS_PORT || '1234');
const yjsServer = new YjsWebSocketServer(yjsPort);

// File System Routes
app.get('/api/files', (req, res) => fileService.listFiles(req, res));
app.get('/api/files/content', (req, res) => fileService.readFile(req, res));
app.post('/api/files', (req, res) => fileService.createFile(req, res));
app.put('/api/files', (req, res) => fileService.saveFile(req, res));
app.delete('/api/files', (req, res) => fileService.deleteFile(req, res));
app.put('/api/files/rename', (req, res) => fileService.renameFile(req, res));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        services: {
            socketio: 'running',
            yjs: 'running',
            files: 'running'
        },
        timestamp: new Date().toISOString()
    });
});

// Document info endpoint
app.get('/api/rooms/:roomId/info', async (req, res) => {
    try {
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
            console.log(`File Service available at http://localhost:${SERVER_PORT}/api/files`);
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