# 🚀 Real-Time Collaborative Code Editor

A production-ready collaborative code editor with video conferencing, powered by Yjs CRDT, Socket.IO, and WebRTC.

## ✨ Features

### Code Collaboration

- **Real-time editing** with Yjs CRDT (Conflict-free Replicated Data Types)
- **Multi-user cursors** with unique colors
- **Syntax highlighting** for JavaScript, Python, and Java
- **Undo/redo** functionality
- **Offline editing** with eventual consistency
- **MongoDB persistence** with automatic snapshots every 5 minutes

### Video Conferencing

- **Peer-to-peer video calls** using WebRTC (mesh topology)
- **Support for 2-6 participants** per session
- **Audio mute/unmute** controls
- **Video enable/disable** controls
- **Screen sharing** capability
- **Connection status** indicators

### 🆕 Secure Code Execution System

- **Execute code in sandboxed Docker containers** with comprehensive security
- **Multi-language support**: Python, JavaScript, TypeScript, Java, C++, C, Go, HTML, CSS
- **RESTful API** endpoint: `POST /api/execute`
- **Security features**: Network isolation, read-only filesystem, resource limits, timeout enforcement
- **Resource limits**: 5-second timeout, 256MB memory, 50 process limit
- **Returns**: stdout, stderr, execution time, exit code

**Quick Start for Code Execution**:

1. Build Docker images: `cd docker && ./build-images.sh`
2. Server already running at `http://localhost:4000/api/execute`
3. See `CODE_EXECUTION_SUMMARY.md` for complete guide

**Documentation**:

- **Quick Start**: `EXECUTION_QUICKSTART.md` - Get running in 5 minutes
- **Complete Guide**: `CODE_EXECUTION_README.md` - Full documentation
- **Architecture**: `EXECUTION_ARCHITECTURE.md` - Security & design details

### Architecture

- **Socket.IO** for room management and signaling
- **Yjs WebSocket Server** for CRDT synchronization
- **MongoDB** for document persistence
- **Redis-ready** for horizontal scaling (optional)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v16 or higher)
   ```bash
   node --version
   ```

2. **MongoDB** (v4.4 or higher)
    - [Download MongoDB](https://www.mongodb.com/try/download/community)
    - Or use Docker:
      ```bash
      docker run -d -p 27017:27017 --name mongodb mongo:latest
      ```

3. **npm** or **yarn**
   ```bash
   npm --version
   ```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

The `.env` file is already created with default local settings. Review it if needed:

```bash
# View the configuration
cat .env
```

Key settings:

- **PORT=4000** - Socket.IO server
- **YJS_PORT=1234** - Yjs WebSocket server
- **MONGODB_URI** - MongoDB connection string

### 3. Start MongoDB

Make sure MongoDB is running:

```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# If using Docker
docker start mongodb
```

### 4. Build the TypeScript Code

```bash
npm run build
```

### 5. Start the Servers

**Option A: Development Mode (with hot reload)**

```bash
npm run dev:yjs
```

**Option B: Production Mode**

```bash
npm run start:yjs
```

The application will start:

- **Socket.IO Server**: http://localhost:4000
- **Yjs WebSocket Server**: ws://localhost:1234
- **Health Check**: http://localhost:4000/health

### 6. Test the Application

Open your browser and navigate to your React application. For testing collaboration:

1. **Open multiple browser windows** with the same room URL
2. **Start typing** in the code editor - changes sync in real-time
3. **Click "Show Video"** to enable video conferencing
4. **Use controls** to mute/unmute, toggle video, or share screen

## 📁 Project Structure

```
collaborative-editor-server/
├── src/
│   ├── components/         # React components
│   │   ├── CodeEditor.jsx  # Collaborative code editor
│   │   └── VideoCall.jsx   # WebRTC video conferencing
│   ├── config/             # Configuration files
│   │   ├── index.ts        # Server config
│   │   └── webrtc.ts       # STUN/TURN config
│   ├── core/               # Core server logic
│   │   ├── socket.ts       # Socket.IO with WebRTC signaling
│   │   ├── room-manager.ts # Room state management
│   │   └── yjs-websocket-server.ts # Yjs CRDT server
│   ├── db/                 # Database layer
│   │   └── mongodb.ts      # MongoDB persistence
│   ├── hooks/              # React hooks
│   │   └── useSocket.ts    # Socket.IO hook
│   ├── types/              # TypeScript types
│   │   ├── index.ts        # General types
│   │   └── video.ts        # WebRTC types
│   ├── utils/              # Utilities
│   │   └── yjs-provider.ts # Yjs WebSocket provider
│   ├── App.jsx             # Main React app
│   ├── server.ts           # Basic Socket.IO server
│   └── server-yjs.ts       # Full server with Yjs
├── .env                    # Environment variables
├── .env.example            # Environment template
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── README.md               # This file
```

## 🧪 Testing the Features

### Test Real-Time Collaboration

1. Open the app in **two browser windows**
2. Join the same room (use `?room=test-room` in URL)
3. Type in one window - see changes in the other instantly
4. Try **undo/redo** - each user has their own history
5. Go **offline** in one window - continue editing
6. Come back **online** - changes sync automatically

### Test Video Conferencing

1. Click **"Show Video"** button in the header
2. Allow **camera and microphone** access
3. Open another browser window and join the same room
4. You should see both video streams
5. Test **mute/unmute** button
6. Test **video on/off** button
7. Test **screen sharing**

### Test Offline Editing

1. Open DevTools → Network tab
2. Set to **"Offline"** mode
3. Continue editing code
4. Re-enable **"Online"** mode
5. Changes sync automatically

## 🔧 Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB status
mongosh --eval "db.serverStatus()"

# Restart MongoDB (if using Docker)
docker restart mongodb
```

### Port Already in Use

If ports 4000 or 1234 are in use, update `.env`:

```bash
PORT=5000
YJS_PORT=2345
```

### WebRTC Not Connecting

1. Check browser console for errors
2. Ensure **HTTPS** for production (WebRTC requires secure context)
3. Try different STUN servers in `.env`:
   ```
   STUN_SERVER_URLS=stun:stun.stunprotocol.org:3478
   ```

### Video Not Showing

1. Grant **camera/microphone permissions** in browser
2. Check browser console for media errors
3. Try a different browser (Chrome/Firefox recommended)

## 🌐 Testing Across Network

To test with other devices on your local network:

1. Find your local IP:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. Update `.env` with your IP:
   ```
   REACT_APP_SOCKET_URL=http://192.168.1.100:4000
   REACT_APP_YJS_URL=ws://192.168.1.100:1234
   ```

3. Access from other device: `http://192.168.1.100:3000`

## 📊 Monitoring

### Check Server Health

```bash
curl http://localhost:4000/health
```

Response:

```json
{
  "status": "healthy",
  "services": {
    "socketio": "running",
    "yjs": "running"
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### MongoDB Data

```bash
# Connect to MongoDB
mongosh

# Switch to database
use collaborative_editor

# View documents
db.document_snapshots.find().pretty()
db.document_metadata.find().pretty()
```

## 🎯 Next Steps

1. **Add Authentication** - Implement JWT authentication
2. **Scale with Redis** - Add Redis pub/sub for multi-server setup
3. **Deploy to Cloud** - Deploy to AWS, Azure, or Google Cloud
4. **Add More Languages** - Extend CodeMirror language support
5. **Recording** - Add video recording capability

## 🐛 Known Issues

1. **Screen sharing** requires HTTPS in production
2. **WebRTC mesh** topology limits to 6 participants (use SFU for more)
3. **MongoDB** required for persistence (Redis cache optional)

## 📝 License

ISC

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 💬 Support

For issues and questions, please open a GitHub issue.

---

**Built with**: React, Socket.IO, Yjs, CodeMirror 6, WebRTC, MongoDB