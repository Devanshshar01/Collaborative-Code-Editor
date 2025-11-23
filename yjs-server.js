const WebSocket = require('ws');
const Y = require('yjs');

const port = 1234;

console.log('Starting simple Yjs WebSocket server...');

const wss = new WebSocket.Server({ port });

// Store Y.Docs for each room
const docs = new Map();

wss.on('connection', (ws) => {
    console.log('New connection established');
    let currentDoc = null;
    let docName = null;

    ws.on('message', (message) => {
        try {
            const data = new Uint8Array(message);

            // Simple protocol: first byte is message type
            // 0 = sync step 1, 1 = sync step 2, 2 = update
            const messageType = data[0];

            if (messageType === 0) {
                // Sync request - get or create doc
                const roomId = Buffer.from(data.slice(1)).toString('utf8');
                docName = roomId;

                if (!docs.has(roomId)) {
                    docs.set(roomId, new Y.Doc());
                    console.log(`Created new document for room: ${roomId}`);
                }

                currentDoc = docs.get(roomId);

                // Send current state
                const state = Y.encodeStateAsUpdate(currentDoc);
                const response = new Uint8Array(state.length + 1);
                response[0] = 1; // Sync response
                response.set(state, 1);
                ws.send(response);
            } else if (messageType === 2 && currentDoc) {
                // Apply update and broadcast to others
                const update = data.slice(1);
                Y.applyUpdate(currentDoc, update);

                // Broadcast to all clients in the same room
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(message);
                    }
                });
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Connection closed');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

console.log(`✓ Yjs WebSocket server is running on ws://localhost:${port}`);
console.log(`✓ Ready to accept connections`);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down Yjs server...');
    wss.close(() => {
        console.log('Server shut down successfully');
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});
