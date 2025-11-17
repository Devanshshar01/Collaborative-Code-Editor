# Collaborative Code Editor - Complete Documentation

> **Complete guide for setup, features, testing, and deployment**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Features Overview](#features-overview)
3. [Installation](#installation)
4. [Code Execution System](#code-execution-system)
5. [Room Management](#room-management)
6. [Multi-File Editing](#multi-file-editing)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [API Reference](#api-reference)

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop
- MongoDB (optional, for room persistence)

### 1. Installation

```bash
# Clone repository
git clone https://github.com/Devanshshar01/Collaborative-Code-Editor.git
cd Collaborative-Code-Editor

# Install dependencies
npm install

# Build Docker images for code execution
cd docker && ./build-images.sh  # or build-images.ps1 on Windows
```

### 2. Start Server

```bash
# Development mode
npm run dev

# Production mode
npm run build && npm start
```

Server runs on **http://localhost:4000**

### 3. Run Tests

```bash
# All tests
npm test

# Specific test suites
npm run test:unit          # Unit tests (~5s)
npm run test:integration   # Integration tests (~18s)
npm run test:e2e          # E2E tests (~45s)
npm run test:load         # Load tests (~10min)
```

---

## Features Overview

### 🚀 Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Real-time Collaboration** | Multiple users edit code simultaneously with Yjs CRDT | ✅ |
| **Code Execution** | Run code in 9 languages (Python, JS, TS, Java, C++, C, Go, HTML, CSS) | ✅ |
| **Video Conferencing** | WebRTC-based video/audio calls with screen sharing | ✅ |
| **Whiteboard** | Collaborative drawing with tldraw | ✅ |
| **Chat System** | Real-time messaging with typing indicators | ✅ |
| **Room Management** | Persistent rooms with MongoDB, auto-expire after 7 days | ✅ |
| **Multi-File Editing** | File tree with create/delete/switch | ✅ |
| **Syntax Highlighting** | CodeMirror with theme support | ✅ |
| **Cursor Sync** | See other users' cursors in real-time | ✅ |

### 🔒 Security Features

- Docker container isolation for code execution
- Network access blocked for executed code
- Read-only filesystem (except /tmp)
- Resource limits: 5s timeout, 256MB memory
- Input validation and sanitization
- Role-based access control (host/editor/viewer)

---

## Installation

### System Requirements

- **OS**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 5GB free space
- **Docker**: 20.10+ (for code execution)

### Detailed Setup

#### 1. Install Node.js

```bash
# macOS (using Homebrew)
brew install node

# Windows (using Chocolatey)
choco install nodejs

# Linux
sudo apt install nodejs npm
```

#### 2. Install Docker

- **Windows/Mac**: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**:
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  ```

#### 3. Install MongoDB (Optional)

For persistent room storage:

```bash
# macOS
brew install mongodb-community

# Windows
choco install mongodb

# Linux
sudo apt install mongodb
```

#### 4. Build Docker Images

```bash
cd docker

# Linux/Mac
chmod +x build-images.sh
./build-images.sh

# Windows PowerShell
.\build-images.ps1
```

This builds 6 Docker images:

- `code-executor-python`
- `code-executor-node`
- `code-executor-java`
- `code-executor-cpp`
- `code-executor-c`
- `code-executor-go`

#### 5. Configure Environment

Create `.env` file:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/collaborative-editor
NODE_ENV=development
```

---

## Code Execution System

### Supported Languages

| Language | Version | Compiler/Runtime |
|----------|---------|------------------|
| Python | 3.11 | CPython |
| JavaScript | ES2023 | Node.js 20 |
| TypeScript | 5.3 | tsc + Node.js |
| Java | 17 | OpenJDK |
| C++ | GCC 13 | g++ |
| C | GCC 13 | gcc |
| Go | 1.21 | go |
| HTML | - | Browser rendering |
| CSS | - | Browser rendering |

### API Usage

#### Execute Code

```http
POST /api/execute
Content-Type: application/json

{
  "code": "print('Hello, World!')",
  "language": "python",
  "input": "optional stdin input"
}
```

**Response**:

```json
{
  "success": true,
  "stdout": "Hello, World!\n",
  "stderr": "",
  "exitCode": 0,
  "executionTime": 234,
  "timeout": false
}
```

### Security Implementation

**Docker Isolation**:

```bash
docker run \
  --rm \
  --network none \                    # No network access
  --read-only \                       # Read-only root filesystem
  --tmpfs /tmp:rw,noexec,nosuid \    # Writable /tmp only
  --memory=256m \                     # Memory limit
  --cpus=0.5 \                        # CPU limit
  --pids-limit=50 \                   # Process limit
  --cap-drop=ALL \                    # Drop all capabilities
  --security-opt=no-new-privileges \  # Prevent privilege escalation
  code-executor-python
```

### Usage Example

**React Component**:

```jsx
import CodeRunner from './components/CodeRunner';

function App() {
  const [code, setCode] = useState('print("Hello!")');
  
  return (
    <CodeRunner 
      code={code} 
      language="python"
      input=""
    />
  );
}
```

**Output**: Terminal-style display with syntax highlighting, execution time, and error handling.

---

## Room Management

### Database Schema

**MongoDB Collection: `rooms`**

```typescript
{
  roomId: string;           // Unique ID (nanoid)
  name: string;
  createdBy: string;
  participants: [{
    userId: string;
    username: string;
    role: 'host' | 'editor' | 'viewer';
    joinedAt: Date;
  }];
  code: {
    content: string;
    language: string;
  };
  fileTree: object;         // Multi-file structure
  whiteboard: object;       // Whiteboard snapshot
  settings: {
    isPublic: boolean;
    maxParticipants: number;
  };
  createdAt: Date;
  expiresAt: Date;          // Auto-delete after 7 days
  lastActivity: Date;
  isActive: boolean;
}
```

### API Endpoints

#### Create Room

```http
POST /api/rooms/create
Content-Type: application/json

{
  "userId": "user123",
  "username": "John",
  "name": "My Coding Room"
}
```

#### Join Room

```http
POST /api/rooms/:roomId/join

{
  "userId": "user456",
  "username": "Jane",
  "role": "editor"
}
```

#### Get Room Details

```http
GET /api/rooms/:roomId
```

#### Update Code

```http
PUT /api/rooms/:roomId/code

{
  "userId": "user123",
  "code": {
    "content": "console.log('updated');",
    "language": "javascript"
  }
}
```

#### Leave Room

```http
POST /api/rooms/:roomId/leave

{
  "userId": "user123"
}
```

#### Delete Room (Host Only)

```http
DELETE /api/rooms/:roomId?userId=user123
```

### Role-Based Access Control

| Action | Host | Editor | Viewer |
|--------|------|--------|--------|
| Edit code | ✅ | ✅ | ❌ |
| Edit whiteboard | ✅ | ✅ | ❌ |
| Send chat | ✅ | ✅ | ✅ |
| Change settings | ✅ | ❌ | ❌ |
| Kick users | ✅ | ❌ | ❌ |
| Delete room | ✅ | ❌ | ❌ |

---

## Multi-File Editing

### Features

- Create files and folders
- Delete files
- Switch between files
- Drag-and-drop reordering (optional)
- Auto-save to MongoDB every 10s
- Load file tree on room join

### File Tree Structure

```typescript
{
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;        // For files
  language?: string;       // For files
  children?: FileNode[];   // For folders
  expanded?: boolean;      // For folders
}
```

### Usage

```jsx
import FileTree from './components/FileTree';
import { useFileTree } from './hooks/useFileTree';

function Editor() {
  const {
    fileTree,
    activeFileId,
    createFile,
    deleteFile,
    selectFile,
    updateFileContent
  } = useFileTree(roomId, ydoc);
  
  return (
    <FileTree
      fileTree={fileTree}
      activeFileId={activeFileId}
      onCreateFile={createFile}
      onDeleteFile={deleteFile}
      onSelectFile={selectFile}
    />
  );
}
```

---

## Testing

### Test Suite Overview

| Test Type | Framework | Tests | Duration |
|-----------|-----------|-------|----------|
| **Unit** | Jest | 19 | ~5s |
| **Integration** | Supertest | 23 | ~18s |
| **E2E** | Playwright | 14 | ~45s |
| **Load** | Artillery | 5 scenarios | ~10min |

**Total**: 56 tests + 5 load scenarios

### Running Tests

```bash
# All tests with coverage
npm test

# Individual test suites
npm run test:unit          # WebSocket handlers
npm run test:integration   # Code execution API
npm run test:e2e          # Collaborative editing
npm run test:load         # Performance testing

# Watch mode
npm run test:watch

# Specific test
npm test -- socket-handlers.test.ts
```

### Unit Tests (Jest)

**Coverage**: WebSocket event handlers

- Room management (join, leave, code sync)
- WebRTC signaling (offer, answer, ICE)
- Chat messaging
- Heartbeat mechanism
- Error handling

**Example**:

```typescript
it('should sync code changes between users', (done) => {
  const roomId = 'test-room';
  const newCode = 'console.log("test");';
  
  clientSocket2.on('code-updated', (code) => {
    expect(code).toBe(newCode);
    done();
  });
  
  clientSocket1.emit('code-change', { roomId, newCode });
});
```

### Integration Tests (Supertest)

**Coverage**: Code execution API

- 9 programming languages
- Security enforcement (timeout, memory, network)
- Input validation
- Error handling

**Example**:

```typescript
it('should execute Python code', async () => {
  const response = await request(app)
    .post('/api/execute')
    .send({
      code: 'print("Hello!")',
      language: 'python'
    })
    .expect(200);
  
  expect(response.body.stdout).toContain('Hello!');
  expect(response.body.exitCode).toBe(0);
});
```

### E2E Tests (Playwright)

**Coverage**: Real user interactions

- 2 users join same room
- Real-time code synchronization
- Cursor synchronization
- Video call functionality
- Screen sharing

**Example**:

```typescript
test('User 1 types, User 2 sees changes', async () => {
  await page1.goto(`/room/${roomId}`);
  await page2.goto(`/room/${roomId}`);
  
  await page1.type('[data-testid="editor"]', 'Hello!');
  
  const text = await page2.textContent('[data-testid="editor"]');
  expect(text).toContain('Hello!');
});
```

### Load Tests (Artillery)

**Coverage**: Performance under load

- 50 concurrent rooms
- Room creation/joining
- Code execution stress test
- WebSocket message throughput
- WebRTC signaling

**Performance Thresholds**:

- Max error rate: 5%
- p95 response time: <2000ms
- p99 response time: <3000ms

---

## Troubleshooting

### Common Issues

#### 1. Docker Container Fails to Start

```bash
# Check Docker is running
docker ps

# Rebuild images
cd docker
./build-images.sh --no-cache

# Check logs
docker logs [container-id]
```

#### 2. Code Execution Timeout

**Problem**: Code takes longer than 5 seconds

**Solution**:

- Optimize code
- Check Docker resource limits
- Increase timeout in `src/config/execution.ts`:
  ```typescript
  export const EXECUTION_TIMEOUT = 10000; // 10 seconds
  ```

#### 3. WebSocket Connection Fails

```bash
# Check server is running
curl http://localhost:4000

# Check firewall
# Windows
netsh advfirewall firewall add rule name="Node" dir=in action=allow program="C:\Program Files\nodejs\node.exe"

# Linux
sudo ufw allow 4000
```

#### 4. MongoDB Connection Error

```bash
# Check MongoDB is running
mongod --version

# Start MongoDB
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongodb

# Windows
net start MongoDB
```

#### 5. Test Failures

```bash
# Install Playwright browsers
npx playwright install --with-deps

# Clear Jest cache
npm test -- --clearCache

# Run tests with verbose output
npm test -- --verbose
```

#### 6. Port Already in Use

```bash
# Find process using port 4000
# Windows
netstat -ano | findstr :4000

# Linux/Mac
lsof -i :4000

# Kill process
# Windows
taskkill /PID [PID] /F

# Linux/Mac
kill -9 [PID]
```

---

## API Reference

### WebSocket Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `{ roomId, user }` | Join a room |
| `code-change` | `{ roomId, newCode }` | Update code |
| `chat-message` | `{ roomId, text, ... }` | Send message |
| `typing-indicator` | `{ roomId, isTyping }` | Typing status |
| `webrtc:offer` | `{ roomId, targetSocketId, data }` | WebRTC offer |
| `webrtc:answer` | `{ roomId, targetSocketId, data }` | WebRTC answer |
| `webrtc:ice-candidate` | `{ roomId, targetSocketId, data }` | ICE candidate |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room-joined` | `{ id, users }` | Room joined successfully |
| `user-joined` | `[users]` | User joined room |
| `user-left` | `[users]` | User left room |
| `code-updated` | `string` | Code changed |
| `chat-message` | `{ text, userName, ... }` | New message |
| `user-typing` | `{ userName, isTyping }` | Typing indicator |
| `heartbeat` | `{ timestamp }` | Keep-alive |

### REST API

#### Code Execution

```
POST /api/execute
```

**Request**:

```json
{
  "code": "string (required)",
  "language": "python|javascript|typescript|java|cpp|c|go",
  "input": "string (optional)"
}
```

**Response**:

```json
{
  "success": boolean,
  "stdout": string,
  "stderr": string,
  "exitCode": number,
  "executionTime": number,
  "timeout": boolean
}
```

#### Room Management

```
POST   /api/rooms/create
GET    /api/rooms/:roomId
POST   /api/rooms/:roomId/join
POST   /api/rooms/:roomId/leave
PUT    /api/rooms/:roomId/code
PUT    /api/rooms/:roomId/whiteboard
PUT    /api/rooms/:roomId/settings
DELETE /api/rooms/:roomId
GET    /api/rooms/user/:userId
GET    /api/rooms/public/list
```

---

## Architecture

### System Design

```
┌─────────────┐
│   Client    │ (React + CodeMirror + Yjs)
└──────┬──────┘
       │
       │ WebSocket (Socket.IO)
       │
┌──────▼──────────────────────────┐
│     Node.js Server              │
│  ┌──────────┐  ┌─────────────┐ │
│  │ Socket.IO│  │ Express API │ │
│  └────┬─────┘  └──────┬──────┘ │
│       │               │         │
│  ┌────▼───────────────▼──────┐ │
│  │   Yjs CRDT Server         │ │
│  └───────────────────────────┘ │
└──────┬───────────────┬─────────┘
       │               │
       │               ▼
       │        ┌─────────────┐
       │        │  MongoDB    │
       │        └─────────────┘
       │
       ▼
┌──────────────┐
│    Docker    │ (Code Execution)
└──────────────┘
```

### Technology Stack

**Frontend**:

- React 18
- CodeMirror 6
- Yjs (CRDT)
- Socket.IO Client
- Simple-Peer (WebRTC)
- tldraw (Whiteboard)

**Backend**:

- Node.js 20
- Express
- Socket.IO
- TypeScript
- MongoDB + Mongoose

**Infrastructure**:

- Docker (code execution)
- Yjs WebSocket Server
- WebRTC Signaling Server

---

## Performance

### Benchmarks

- **Room Join**: <100ms
- **Code Sync**: <50ms (local network)
- **Code Execution**: 200ms - 5s (depends on code)
- **Video Call**: <500ms connection time
- **Concurrent Users**: 50+ per room
- **Concurrent Rooms**: 100+ (tested with load testing)

### Optimization Tips

1. **Code Execution**: Use connection pooling for Docker
2. **WebSocket**: Enable compression
3. **MongoDB**: Add indexes on `roomId`, `userId`
4. **React**: Use `React.memo` for components
5. **Yjs**: Use `y-indexeddb` for offline persistence

---

## Contributing

Contributions welcome! Please follow these guidelines:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Development Workflow

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## License

MIT License - see LICENSE file for details

---

## Support

- **GitHub Issues**: [Report bugs](https://github.com/Devanshshar01/Collaborative-Code-Editor/issues)
- **Documentation**: This file
- **Email**: [Your email]

---

**Built with ❤️ using modern web technologies**
