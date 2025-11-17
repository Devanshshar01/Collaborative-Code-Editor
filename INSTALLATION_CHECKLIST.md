# Installation Checklist

Complete checklist for setting up the collaborative code editor with code execution system.

## Prerequisites Checklist

- [ ] **Node.js 18+** installed (`node --version`)
- [ ] **npm** installed (`npm --version`)
- [ ] **Docker Desktop** installed and running (`docker --version`)
- [ ] **MongoDB** installed or Docker MongoDB running (`mongosh --eval "db.version()"`)
- [ ] **Git** installed (if cloning repository)

## Main System Installation

### Step 1: Install Dependencies

```bash
npm install
```

- [ ] All npm packages installed successfully
- [ ] No vulnerability warnings (or addressed)

### Step 2: Environment Configuration

```bash
# Check .env file exists
ls .env
```

- [ ] `.env` file exists with correct configuration
- [ ] MongoDB URI is correct
- [ ] Ports are available (4000, 1234)

### Step 3: MongoDB Setup

```bash
# Test MongoDB connection
mongosh --eval "db.version()"
```

- [ ] MongoDB is running
- [ ] Can connect to MongoDB
- [ ] Database `collaborative_editor` is accessible

### Step 4: Build TypeScript

```bash
npm run build
```

- [ ] TypeScript compiled successfully
- [ ] `dist/` directory created
- [ ] No compilation errors

### Step 5: Test Main Server

```bash
npm start
```

- [ ] Server starts on port 4000
- [ ] Socket.IO initialized
- [ ] No startup errors

Expected output:

```
Server is running on port 4000
```

## Code Execution System Installation

### Step 6: Build Docker Images

```bash
cd docker

# Linux/Mac
chmod +x build-images.sh
./build-images.sh

# Windows PowerShell
.\build-images.ps1

# OR use Docker Compose
docker-compose build
```

- [ ] Python executor image built (`code-executor-python`)
- [ ] Node.js executor image built (`code-executor-node`)
- [ ] Java executor image built (`code-executor-java`)
- [ ] C++ executor image built (`code-executor-cpp`)
- [ ] C executor image built (`code-executor-c`)
- [ ] Go executor image built (`code-executor-go`)

Verify images:

```bash
docker images | grep code-executor
```

Expected output:

```
code-executor-python   latest   ...
code-executor-node     latest   ...
code-executor-java     latest   ...
code-executor-cpp      latest   ...
code-executor-c        latest   ...
code-executor-go       latest   ...
```

### Step 7: Test Code Execution API

Start server (if not already running):

```bash
npm start
```

Test endpoints:

**Health Check:**

```bash
curl http://localhost:4000/api/health
```

- [ ] Returns `{"status":"ok",...}`

**Supported Languages:**

```bash
curl http://localhost:4000/api/languages
```

- [ ] Returns list of 9 languages

**Python Execution:**

```bash
curl -X POST http://localhost:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"Hello World!\")","language":"python"}'
```

- [ ] Returns `{"stdout":"Hello World!\n","stderr":"","exitCode":0}`

**JavaScript Execution:**

```bash
curl -X POST http://localhost:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"console.log(\"Hello World!\")","language":"javascript"}'
```

- [ ] Returns successful output

### Step 8: Run Comprehensive Tests (Optional)

```bash
# Linux/Mac
chmod +x test-execution.sh
./test-execution.sh
```

- [ ] All language tests pass
- [ ] Python test passed
- [ ] JavaScript test passed
- [ ] TypeScript test passed
- [ ] Java test passed
- [ ] C++ test passed
- [ ] C test passed
- [ ] Go test passed
- [ ] HTML test passed
- [ ] CSS test passed
- [ ] Error handling test passed

## Verification Checklist

### Main System

- [ ] Server running on port 4000
- [ ] Yjs server running on port 1234
- [ ] MongoDB connected
- [ ] WebSocket connections work
- [ ] Can create/join rooms
- [ ] Real-time editing works
- [ ] Multiple cursors visible
- [ ] Video conferencing works (if testing)

### Code Execution System

- [ ] All 6 Docker images exist
- [ ] `/api/execute` endpoint responds
- [ ] `/api/languages` endpoint responds
- [ ] `/api/health` endpoint responds
- [ ] Can execute Python code
- [ ] Can execute JavaScript code
- [ ] Can execute compiled languages (Java, C, C++, Go)
- [ ] Timeout enforcement works
- [ ] Memory limits enforced
- [ ] Error handling works

### Security Verification

- [ ] Docker containers are isolated
- [ ] No network access from containers
- [ ] Containers run as non-root user
- [ ] Read-only filesystem (except /tmp)
- [ ] Resource limits applied
- [ ] Containers auto-cleanup after execution

## Troubleshooting

### Common Issues

#### MongoDB Connection Failed

```bash
# Check MongoDB status
mongosh --eval "db.serverStatus()"

# Restart MongoDB (Docker)
docker restart mongodb
```

- [ ] Issue resolved

#### Port Already in Use

```bash
# Change port in .env
PORT=5000
YJS_PORT=2345
```

- [ ] Issue resolved

#### Docker Images Not Found

```bash
# Rebuild images
cd docker
./build-images.sh
```

- [ ] Issue resolved

#### Docker Not Running

```bash
# Start Docker Desktop
# Verify: docker ps
```

- [ ] Issue resolved

#### Build Errors

```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

- [ ] Issue resolved

## Post-Installation

### Development Mode

```bash
npm run dev:yjs
```

- [ ] Hot reload works
- [ ] Code changes reflected immediately

### Production Mode

```bash
npm run build
npm run start:yjs
```

- [ ] Production build works
- [ ] Server stable under load

## Optional Enhancements

### Enable HTTPS (Production)

- [ ] SSL certificate installed
- [ ] HTTPS configured
- [ ] WebRTC works over HTTPS

### Add Authentication

- [ ] JWT authentication implemented
- [ ] User management system
- [ ] Protected endpoints

### Add Rate Limiting

- [ ] Rate limiting middleware installed
- [ ] Limits configured per endpoint
- [ ] Tested with high load

### Monitoring

- [ ] Logging system configured
- [ ] Metrics collection enabled
- [ ] Alerts configured

## Documentation Review

Have you read:

- [ ] `README.md` - Main project documentation
- [ ] `CODE_EXECUTION_SUMMARY.md` - Quick overview of execution system
- [ ] `EXECUTION_QUICKSTART.md` - 5-minute quick start
- [ ] `CODE_EXECUTION_README.md` - Complete execution guide
- [ ] `EXECUTION_ARCHITECTURE.md` - Security and architecture details

## Final Verification

### Quick System Test

1. **Start Server:**
   ```bash
   npm start
   ```
    - [ ] Server running

2. **Test Collaboration:**
    - [ ] Open app in two browser windows
    - [ ] Join same room
    - [ ] Type in one window, see in other
    - [ ] Multi-user cursors visible

3. **Test Code Execution:**
   ```bash
   curl -X POST http://localhost:4000/api/execute \
     -H "Content-Type: application/json" \
     -d '{"code":"print(2+2)","language":"python"}'
   ```
    - [ ] Returns `{"stdout":"4\n",...}`

4. **Test Video (Optional):**
    - [ ] Click "Show Video"
    - [ ] Camera/mic permissions granted
    - [ ] Video stream visible

## Success Criteria

All checkboxes should be checked ✅

If any issues remain:

1. Check the troubleshooting section
2. Review relevant documentation
3. Check server logs for errors
4. Verify Docker is running
5. Verify MongoDB is running

## Next Steps

After successful installation:

1. **Customize**: Modify settings in `src/config/execution.ts`
2. **Integrate**: Connect frontend to execution API
3. **Secure**: Add authentication and rate limiting
4. **Monitor**: Set up logging and metrics
5. **Deploy**: Prepare for production deployment

## Support

If you encounter issues:

- Check logs: `npm start` output
- Check Docker: `docker ps` and `docker logs`
- Check MongoDB: `mongosh`
- Review documentation files
- Check GitHub issues (if applicable)

---

**Installation Date**: _______________
**Installed By**: _______________
**Environment**: Development / Staging / Production
**Status**: ✅ Complete / ⚠️ Partial / ❌ Failed
