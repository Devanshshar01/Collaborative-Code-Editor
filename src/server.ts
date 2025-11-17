import express from 'express';
import http from 'http';
import {initializeSocket} from './core/socket';
import {SERVER_PORT} from './config';
import executionRouter from './routes/execution';
import roomRouter from './routes/rooms';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json({limit: '1mb'}));
app.use(express.urlencoded({extended: true, limit: '1mb'}));

// Initialize Socket.IO
initializeSocket(server);

// Routes
app.get('/', (req, res) => {
    res.send('<h1>WebSocket Server is running</h1>');
});

app.use('/api', executionRouter);
app.use('/api/rooms', roomRouter);

server.listen(SERVER_PORT, () => {
    console.log(`Server is running on port ${SERVER_PORT}`);
});
