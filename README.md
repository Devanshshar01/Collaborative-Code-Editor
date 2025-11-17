# 🚀 Collaborative Code Editor

> Real-time collaborative coding platform with video calls, code execution, and whiteboard

[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## ✨ Features

- 🤝 **Real-time Collaboration** - Multiple users, live cursor tracking (Yjs CRDT)
- 💻 **Code Execution** - Run code in 9 languages with Docker sandboxing
- 🎥 **Video Conferencing** - WebRTC video/audio calls + screen sharing
- 🎨 **Collaborative Whiteboard** - Draw together with tldraw
- 💬 **Live Chat** - Messaging with typing indicators
- 📁 **Multi-File Editing** - File tree with create/delete/switch
- 🔒 **Secure** - Docker isolation, resource limits, role-based access
- 📦 **Room Persistence** - MongoDB storage, auto-expire (7 days)
- 🧪 **Fully Tested** - 56 tests (Unit, Integration, E2E, Load)

---

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/Devanshshar01/Collaborative-Code-Editor.git
cd Collaborative-Code-Editor

# 2. Install dependencies
npm install

# 3. Build Docker images (for code execution)
cd docker && ./build-images.sh  # or build-images.ps1 on Windows

# 4. Start server
npm run dev

# Server runs on http://localhost:4000
```

---

## 📚 Documentation

For complete documentation, see **[DOCS.md](DOCS.md)**

Quick links:

- [Installation Guide](DOCS.md#installation)
- [Code Execution](DOCS.md#code-execution-system)
- [Room Management](DOCS.md#room-management)
- [Testing](DOCS.md#testing)
- [API Reference](DOCS.md#api-reference)
- [Troubleshooting](DOCS.md#troubleshooting)

---

## 🛠️ Tech Stack

**Frontend**: React, CodeMirror 6, Yjs, Socket.IO Client, Simple-Peer, tldraw  
**Backend**: Node.js, Express, Socket.IO, TypeScript, MongoDB, Mongoose  
**Infrastructure**: Docker, WebRTC, Yjs WebSocket Server  
**Testing**: Jest, Supertest, Playwright, Artillery

---

## 🧪 Testing

```bash
npm test                  # All tests with coverage
npm run test:unit         # Unit tests (19 tests, ~5s)
npm run test:integration  # Integration tests (23 tests, ~18s)
npm run test:e2e         # E2E tests (14 tests, ~45s)
npm run test:load        # Load tests (5 scenarios, ~10min)
```

**Total Coverage**: 56 tests + 5 load scenarios

---

## 🎯 Supported Languages

| Language   | Version | Status |
|------------|---------|--------|
| Python     | 3.11    | ✅      |
| JavaScript | Node 20 | ✅      |
| TypeScript | 5.3     | ✅      |
| Java       | 17      | ✅      |
| C++        | GCC 13  | ✅      |
| C          | GCC 13  | ✅      |
| Go         | 1.21    | ✅      |
| HTML       | -       | ✅      |
| CSS        | -       | ✅      |

---

## 📖 API Endpoints

### Code Execution

```http
POST /api/execute
```

### Room Management

```http
POST   /api/rooms/create
GET    /api/rooms/:roomId
POST   /api/rooms/:roomId/join
DELETE /api/rooms/:roomId
```

See [API Reference](DOCS.md#api-reference) for complete documentation.

---

## 🏗️ Architecture

```
Client (React + Yjs)
    ↓
WebSocket (Socket.IO)
    ↓
Node.js Server
    ├→ MongoDB (Rooms)
    └→ Docker (Code Execution)
```

---

## 🔒 Security

- **Docker Isolation**: Network disabled, read-only filesystem
- **Resource Limits**: 5s timeout, 256MB memory, CPU throttling
- **Access Control**: Host/Editor/Viewer roles
- **Input Validation**: Sanitized inputs, size limits
- **No Privilege Escalation**: All capabilities dropped

---

## 📊 Performance

- **Room Join**: <100ms
- **Code Sync**: <50ms
- **Code Execution**: 200ms-5s
- **Concurrent Users**: 50+ per room
- **Concurrent Rooms**: 100+ tested

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push: `git push origin feature/name`
5. Open Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file

---

## 🔗 Links

- **Documentation**: [DOCS.md](DOCS.md)
- **GitHub**: [Repository](https://github.com/Devanshshar01/Collaborative-Code-Editor)
- **Issues**: [Report Bugs](https://github.com/Devanshshar01/Collaborative-Code-Editor/issues)

---

<div align="center">

**Built with ❤️ using modern web technologies**

[⭐ Star this repo](https://github.com/Devanshshar01/Collaborative-Code-Editor) | [🐛 Report Bug](https://github.com/Devanshshar01/Collaborative-Code-Editor/issues) | [💡 Request Feature](https://github.com/Devanshshar01/Collaborative-Code-Editor/issues)

</div>
