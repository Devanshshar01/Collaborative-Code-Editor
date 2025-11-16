# ⚡ Quick Start Guide

Get your collaborative code editor running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js v16+ installed
- [ ] MongoDB installed and running
- [ ] Terminal/Command Prompt open

## 🚀 Start in 3 Steps

### Option 1: Automatic (Recommended)

**For Windows (PowerShell):**

```powershell
.\start-local.ps1
```

**For Mac/Linux:**

```bash
chmod +x start-local.sh
./start-local.sh
```

### Option 2: Manual

**Step 1: Install dependencies**

```bash
npm install
```

**Step 2: Build the project**

```bash
npm run build
```

**Step 3: Start the server**

```bash
npm run dev:yjs
```

## ✅ Verify It's Working

### 1. Check Server Status

Open your browser and visit:

```
http://localhost:4000/health
```

You should see:

```json
{
  "status": "healthy",
  "services": {
    "socketio": "running",
    "yjs": "running"
  }
}
```

### 2. Test the Application

Since this is a backend server, you'll need a React frontend to test the full functionality. Here's what to do:

**Quick Test with curl:**

```bash
# Test Socket.IO server
curl http://localhost:4000

# Test health endpoint
curl http://localhost:4000/health
```

## 🎮 Testing Features

### Test Real-Time Collaboration

1. You'll need to integrate this backend with a React frontend
2. The frontend should use the components in `src/components/`:
    - `CodeEditor.jsx` - For collaborative editing
    - `VideoCall.jsx` - For video conferencing
    - `App.jsx` - Main application layout

3. In your React app, set these environment variables:
   ```
   REACT_APP_SOCKET_URL=http://localhost:4000
   REACT_APP_YJS_URL=ws://localhost:1234
   ```

### Test from Multiple Windows

1. Open the same room URL in 2+ browser tabs
2. Start typing in the code editor
3. Watch changes sync in real-time
4. Enable video to test WebRTC

## 🔧 Common Issues & Fixes

### Issue: MongoDB not running

**Fix (Windows):**

```powershell
net start MongoDB
```

**Fix (Mac with Homebrew):**

```bash
brew services start mongodb-community
```

**Fix (Docker):**

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Issue: Port 4000 already in use

**Fix:** Update `.env` file:

```
PORT=5000
```

Then restart the server.

### Issue: TypeScript build errors

**Fix:** Clear and rebuild:

```bash
rm -rf dist
npm run build
```

### Issue: Module not found errors

**Fix:** Reinstall dependencies:

```bash
rm -rf node_modules
npm install
```

## 📱 Testing on Mobile/Other Devices

1. Find your computer's local IP address:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig | grep "inet "
   ```

2. Update `.env` with your IP (e.g., `192.168.1.100`):
   ```
   REACT_APP_SOCKET_URL=http://192.168.1.100:4000
   REACT_APP_YJS_URL=ws://192.168.1.100:1234
   ```

3. Access from mobile: `http://192.168.1.100:3000`

## 🎯 What You Get

When the server is running, you have:

✅ **Socket.IO Server** (port 4000)

- Room management
- WebRTC signaling
- User presence tracking

✅ **Yjs WebSocket Server** (port 1234)

- CRDT synchronization
- Real-time document merging
- Conflict-free editing

✅ **MongoDB Integration**

- Document persistence
- Automatic snapshots every 5 minutes
- Edit history

✅ **WebRTC Support**

- P2P video calls
- Audio/video controls
- Screen sharing

## 📚 Next Steps

1. **Read the full README.md** for detailed documentation
2. **Integrate with React** frontend
3. **Test all features** (editing, video, screen share)
4. **Deploy to production** (see README for deployment guide)

## 🆘 Need Help?

- Check the logs in your terminal
- Review `README.md` for troubleshooting
- Ensure all prerequisites are installed
- Check browser console for frontend errors

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ Terminal shows "Server running on port 4000"
2. ✅ Terminal shows "Yjs WebSocket server running on port 1234"
3. ✅ `/health` endpoint returns `status: "healthy"`
4. ✅ MongoDB connection established
5. ✅ No error messages in terminal

Happy coding! 🚀