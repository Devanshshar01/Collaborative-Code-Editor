import express from 'express';
import http from 'http';
import {initializeSocket} from './core/socket';
import {SERVER_PORT} from './config';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

app.get('/', (req, res) => {
    res.send('<h1>WebSocket Server is running</h1>');
});

server.listen(SERVER_PORT, () => {
    console.log(`Server is running on port ${SERVER_PORT}`);
});
