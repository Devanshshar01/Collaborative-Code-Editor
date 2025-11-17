# Testing Guide - Collaborative Code Editor

Comprehensive test suite covering unit tests, integration tests, E2E tests, and load testing.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Prerequisites](#prerequisites)
4. [Running Tests](#running-tests)
5. [Unit Tests](#unit-tests)
6. [Integration Tests](#integration-tests)
7. [E2E Tests](#e2e-tests)
8. [Load Tests](#load-tests)
9. [CI/CD Integration](#cicd-integration)
10. [Writing Tests](#writing-tests)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The test suite provides comprehensive coverage of all system components:

- **Unit Tests**: WebSocket event handlers, room management logic
- **Integration Tests**: Code execution API, REST endpoints
- **E2E Tests**: Collaborative editing, cursor sync, video calls
- **Load Tests**: 50 concurrent rooms, performance benchmarks

### Test Statistics

- **Total Test Files**: 4
- **Test Coverage Target**: 80%
- **Performance Thresholds**: p95 < 2s, p99 < 3s
- **Load Test Duration**: ~10 minutes
- **E2E Test Browsers**: Chrome, Firefox, Safari

---

## Test Structure

```
tests/
├── setup.ts                              # Jest configuration
├── unit/
│   └── socket-handlers.test.ts          # WebSocket event tests (357 lines)
├── integration/
│   └── code-execution.test.ts           # API integration tests (381 lines)
├── e2e/
│   └── collaborative-editing.spec.ts    # Playwright E2E tests (387 lines)
└── load/
    ├── artillery-config.yml             # Load test config (295 lines)
    └── artillery-processor.js           # Custom load test logic (131 lines)
```

---

## Prerequisites

### Install Dependencies

```bash
# Install all testing dependencies
npm install --save-dev

# Or install individually
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev supertest @types/supertest
npm install --save-dev @playwright/test
npm install --save-dev artillery
```

### Install Playwright Browsers

```bash
npx playwright install
```

### Docker Setup (for integration tests)

```bash
# Build Docker images for code execution
cd docker
./build-images.sh  # Linux/Mac
# or
./build-images.ps1  # Windows
```

### Start Required Services

```bash
# Terminal 1: Start MongoDB (if using)
mongod

# Terminal 2: Start server
npm run dev

# Terminal 3: Run tests
npm test
```

---

## Running Tests

### All Tests

```bash
# Run all test suites with coverage
npm test

# Run all tests without coverage
npm test -- --coverage=false
```

### Individual Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# Load tests only
npm run test:load

# All except load tests
npm run test:all
```

### Watch Mode

```bash
# Run tests in watch mode (auto-rerun on changes)
npm run test:watch
```

### Specific Test Files

```bash
# Run specific test file
npm test -- socket-handlers.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="WebSocket"
```

---

## Unit Tests

### WebSocket Event Handlers (`socket-handlers.test.ts`)

Tests all WebSocket events with real socket connections.

#### Test Coverage

**Room Management (5 tests)**

- ✅ Join room
- ✅ Multiple users join
- ✅ Code change synchronization
- ✅ User disconnect notification
- ✅ Error handling

**WebRTC Signaling (8 tests)**

- ✅ Offer forwarding
- ✅ Answer forwarding
- ✅ ICE candidate exchange
- ✅ Mute/unmute events
- ✅ Video on/off events
- ✅ Screen share events
- ✅ Metadata broadcasting
- ✅ Multi-peer connections

**Chat Messaging (2 tests)**

- ✅ Message broadcasting
- ✅ Typing indicators

**Heartbeat (2 tests)**

- ✅ Heartbeat emission
- ✅ Acknowledgment handling

**Error Handling (2 tests)**

- ✅ Invalid room join
- ✅ Non-existent room update

#### Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run with verbose output
npm test -- --verbose tests/unit/

# Run specific test suite
npm test -- --testNamePattern="Room Management"
```

#### Example Output

```
PASS  tests/unit/socket-handlers.test.ts
  WebSocket Event Handlers - Unit Tests
    Room Management
      ✓ should allow a user to join a room (45ms)
      ✓ should notify other users when someone joins (89ms)
      ✓ should handle code changes in a room (112ms)
    WebRTC Signaling
      ✓ should forward WebRTC offer (34ms)
      ✓ should forward ICE candidates (28ms)

Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Time:        5.234s
```

---

## Integration Tests

### Code Execution API (`code-execution.test.ts`)

Tests the secure code execution system across all supported languages.

#### Test Coverage

**Language Execution (7 language suites)**

- ✅ Python (4 tests)
- ✅ JavaScript (2 tests)
- ✅ TypeScript (2 tests)
- ✅ Java (2 tests)
- ✅ C++ (1 test)
- ✅ C (1 test)
- ✅ Go (1 test)

**Security & Resource Limits (4 tests)**

- ✅ Timeout enforcement (5s limit)
- ✅ Memory limit enforcement (256MB)
- ✅ Network access prevention
- ✅ Filesystem access control

**Input Validation (4 tests)**

- ✅ Missing code rejection
- ✅ Missing language rejection
- ✅ Invalid language rejection
- ✅ Size limit enforcement

**Edge Cases (3 tests)**

- ✅ Empty code handling
- ✅ Special characters support
- ✅ Multi-line output

#### Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run with Docker containers (required)
# Ensure Docker images are built first
cd docker && ./build-images.sh

# Run specific language tests
npm test -- --testNamePattern="Python Execution"
```

#### Example Output

```
PASS  tests/integration/code-execution.test.ts
  Code Execution API - Integration Tests
    POST /api/execute
      Python Execution
        ✓ should execute valid Python code (234ms)
        ✓ should handle Python syntax errors (156ms)
      Security & Resource Limits
        ✓ should timeout long-running code (5012ms)
        ✓ should prevent network access (445ms)

Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
Time:        18.456s
```

---

## E2E Tests

### Collaborative Editing (`collaborative-editing.spec.ts`)

End-to-end tests using Playwright to simulate real user interactions.

#### Test Coverage

**Collaborative Editing (7 tests)**

- ✅ Two users join same room
- ✅ Real-time code synchronization
- ✅ Bidirectional editing
- ✅ Cursor synchronization
- ✅ Deletion synchronization
- ✅ Undo/redo synchronization
- ✅ Multiple concurrent editors

**Video Call Functionality (7 tests)**

- ✅ Video call initiation
- ✅ Audio mute/unmute
- ✅ Video on/off toggle
- ✅ Screen sharing
- ✅ Multiple participants
- ✅ Video + editing simultaneous
- ✅ Connection persistence

#### Running E2E Tests

```bash
# Run all E2E tests (default: Chromium)
npm run test:e2e

# Run on specific browser
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run in headed mode (see browser)
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Run specific test
npx playwright test --grep "cursor synchronization"
```

#### Configuration

E2E tests use `playwright.config.ts`:

```typescript
- Base URL: http://localhost:3000
- Timeout: 15s per action, 30s navigation
- Browsers: Chrome, Firefox, Safari
- Screenshots: On failure
- Video: On failure
- Fake media streams: Enabled
```

#### Example Output

```
Running 14 tests using 1 worker

  ✓ [chromium] › collaborative-editing.spec.ts:36:5 › Two users join the same room (2s)
  ✓ [chromium] › collaborative-editing.spec.ts:58:5 › User 1 types and User 2 sees changes (3s)
  ✓ [chromium] › collaborative-editing.spec.ts:245:5 › Users can initiate video call (5s)

  14 passed (45s)

To open last HTML report run:
  npx playwright show-report
```

---

## Load Tests

### Artillery Configuration (`artillery-config.yml`)

Simulates 50 concurrent rooms with realistic user behavior.

#### Test Phases

1. **Warm-up** (60s): 5 users/sec
2. **Ramp-up** (120s): 10-25 users/sec
3. **Sustained Load** (300s): 25 users/sec (50 rooms)
4. **Peak Load** (60s): 50 users/sec
5. **Cool-down** (30s): 5 users/sec

**Total Duration**: ~10 minutes

#### Test Scenarios

**1. Room Creation & Joining (30% weight)**

- Create room with nanoid
- Join room
- Get room details

**2. Code Execution (25% weight)**

- Execute Python code
- Execute JavaScript code
- Execute Go code
- 3 iterations per user

**3. Collaborative Editing (45% weight)**

- WebSocket connection
- Join random room (1-50)
- 5 code changes per user
- Chat messages
- Typing indicators

**4. Room Management (10% weight)**

- CRUD operations
- Join/leave
- Code updates
- Settings changes

**5. WebRTC Signaling (15% weight)**

- Offer/answer exchange
- ICE candidates
- Media state changes

#### Running Load Tests

```bash
# Run full load test suite
npm run test:load

# Run with verbose output
artillery run tests/load/artillery-config.yml --output report.json

# Generate HTML report
artillery report report.json --output report.html

# Quick test (reduced duration)
artillery quick --duration 60 --rate 10 http://localhost:4000
```

#### Performance Thresholds

```yaml
- Max Error Rate: 5%
- p95 Response Time: < 2000ms
- p99 Response Time: < 3000ms
```

#### Metrics Collected

- **HTTP Metrics**: Response times, status codes, throughput
- **WebSocket Metrics**: Connection success, message latency
- **Custom Metrics**: Code execution time, room operations
- **Resource Usage**: CPU, memory, connections

#### Example Output

```
Summary report @ 14:32:15(+0000)
──────────────────────────────────────────────────────────────

Scenarios launched:   1250
Scenarios completed:  1245
Requests completed:   8734

Response time (msec):
  min: 12
  max: 1834
  median: 245
  p95: 892
  p99: 1456

Scenario duration (msec):
  min: 1205
  max: 12456
  median: 8234
  p95: 11023
  p99: 11890

Errors:
  ECONNREFUSED: 5 (0.06%)

Codes:
  200: 8729
  400: 5
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build Docker images
        run: cd docker && ./build-images.sh
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Writing Tests

### Unit Test Template

```typescript
import { Server as SocketServer } from 'socket.io';
import { io as ioClient } from 'socket.io-client';

describe('My Feature', () => {
    let clientSocket: ClientSocket;
    
    beforeEach((done) => {
        clientSocket = ioClient(serverAddress);
        clientSocket.on('connect', done);
    });
    
    afterEach(() => {
        clientSocket.disconnect();
    });
    
    it('should do something', (done) => {
        clientSocket.on('event', (data) => {
            expect(data).toBeDefined();
            done();
        });
        
        clientSocket.emit('trigger', { payload: 'test' });
    });
});
```

### Integration Test Template

```typescript
import request from 'supertest';
import app from '../src/server';

describe('POST /api/endpoint', () => {
    it('should return success', async () => {
        const response = await request(app)
            .post('/api/endpoint')
            .send({ data: 'test' })
            .expect(200);
        
        expect(response.body.success).toBe(true);
    });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test('User can perform action', async ({ page }) => {
    await page.goto('/room/test-room');
    
    await page.waitForSelector('[data-testid="element"]');
    await page.click('[data-testid="button"]');
    
    await expect(page.locator('[data-testid="result"]'))
        .toBeVisible();
});
```

---

## Troubleshooting

### Common Issues

#### 1. Jest Tests Timing Out

```bash
# Increase timeout in jest.config.js
jest.setTimeout(30000);

# Or per test
it('test', async () => { ... }, 10000);
```

#### 2. Playwright Browser Not Found

```bash
# Reinstall browsers
npx playwright install --with-deps
```

#### 3. Docker Container Not Starting

```bash
# Check Docker is running
docker ps

# Rebuild images
cd docker
./build-images.sh --no-cache
```

#### 4. Load Test Connection Errors

```bash
# Increase system limits (Linux)
ulimit -n 65536

# Check server is running
curl http://localhost:4000
```

#### 5. Port Already in Use

```bash
# Kill process on port 4000
npx kill-port 4000

# Or use different port
PORT=4001 npm run dev
```

### Debug Mode

```bash
# Jest verbose
npm test -- --verbose

# Playwright debug
PWDEBUG=1 npx playwright test

# Artillery debug
DEBUG=* artillery run tests/load/artillery-config.yml
```

---

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Use `beforeEach` to reset state
- Clean up resources in `afterEach`

### 2. Realistic Data

- Use realistic test data
- Simulate actual user behavior
- Test edge cases

### 3. Assertions

- Use specific assertions
- Test positive and negative cases
- Verify error messages

### 4. Performance

- Keep tests fast (<5s per test)
- Use parallel execution
- Mock slow operations

### 5. Maintenance

- Update tests with code changes
- Remove flaky tests
- Keep test data minimal

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Artillery Documentation](https://www.artillery.io/docs)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

---

## Summary

✅ **Unit Tests**: 19 tests covering WebSocket events  
✅ **Integration Tests**: 23 tests covering code execution  
✅ **E2E Tests**: 14 tests covering collaborative editing  
✅ **Load Tests**: 5 scenarios simulating 50 concurrent rooms

**Total Test Coverage**: ~1,551 lines of test code across 4 files

Run `npm test` to execute the complete test suite!
