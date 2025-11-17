# Testing Quick Reference

Quick commands and examples for running the test suite.

## 🚀 Quick Start

```bash
# Install dependencies (first time only)
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 📋 Test Commands

### Run All Tests

```bash
npm test                    # All tests with coverage
npm run test:all           # Unit + Integration + E2E (no load)
```

### Run by Type

```bash
npm run test:unit          # WebSocket handlers
npm run test:integration   # Code execution API
npm run test:e2e          # Collaborative editing (Playwright)
npm run test:load         # Performance/load testing (Artillery)
```

### Watch Mode

```bash
npm run test:watch        # Auto-rerun on file changes
```

---

## 🧪 Unit Tests (Jest)

**File**: `tests/unit/socket-handlers.test.ts`  
**Coverage**: WebSocket events, room management, WebRTC signaling

```bash
# Run all unit tests
npm run test:unit

# Run specific suite
npm test -- --testNamePattern="Room Management"

# Verbose output
npm test -- --verbose tests/unit/

# Single test file
npm test -- socket-handlers.test.ts
```

**Test Categories**:

- Room Management (5 tests)
- WebRTC Signaling (8 tests)
- Chat Messaging (2 tests)
- Heartbeat (2 tests)
- Error Handling (2 tests)

---

## 🔗 Integration Tests (Supertest)

**File**: `tests/integration/code-execution.test.ts`  
**Coverage**: Code execution API for 9 languages

```bash
# Run all integration tests
npm run test:integration

# Test specific language
npm test -- --testNamePattern="Python Execution"

# Skip slow tests
npm test -- --testNamePattern="(?!timeout)"
```

**Test Categories**:

- Language Execution (Python, JS, TS, Java, C++, C, Go)
- Security & Resource Limits (4 tests)
- Input Validation (4 tests)
- Edge Cases (3 tests)

**Prerequisites**: Docker images must be built

```bash
cd docker && ./build-images.sh
```

---

## 🌐 E2E Tests (Playwright)

**File**: `tests/e2e/collaborative-editing.spec.ts`  
**Coverage**: Real user interactions, collaborative editing, video calls

```bash
# Run all E2E tests
npm run test:e2e

# Specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Specific test
npx playwright test --grep "cursor synchronization"

# View report
npx playwright show-report
```

**Test Categories**:

- Collaborative Editing (7 tests)
- Video Call Functionality (7 tests)

**Prerequisites**: Playwright browsers

```bash
npx playwright install --with-deps
```

---

## ⚡ Load Tests (Artillery)

**File**: `tests/load/artillery-config.yml`  
**Coverage**: 50 concurrent rooms, performance benchmarks

```bash
# Run full load test (~10 minutes)
npm run test:load

# Quick test (1 minute)
artillery quick --duration 60 --rate 10 http://localhost:4000

# With output report
artillery run tests/load/artillery-config.yml --output report.json

# Generate HTML report
artillery report report.json --output report.html

# Debug mode
DEBUG=* artillery run tests/load/artillery-config.yml
```

**Test Scenarios**:

1. Room creation & joining (30%)
2. Code execution (25%)
3. Collaborative editing (45%)
4. Room management (10%)
5. WebRTC signaling (15%)

**Performance Thresholds**:

- Max error rate: 5%
- p95 response time: <2000ms
- p99 response time: <3000ms

---

## 🎯 Common Test Patterns

### Run Specific Test

```bash
# By file name
npm test -- socket-handlers

# By test name pattern
npm test -- --testNamePattern="should join room"

# By describe block
npm test -- --testNamePattern="Room Management"
```

### Coverage Reports

```bash
# Generate coverage
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html

# Coverage summary only
npm test -- --coverage --coverageReporters=text-summary
```

### Debugging Tests

```bash
# Jest verbose
npm test -- --verbose

# Run single test with logs
npm test -- --testNamePattern="specific test" --verbose

# No coverage (faster)
npm test -- --coverage=false
```

---

## 🐛 Troubleshooting

### Tests Timing Out

```bash
# Increase timeout (in test file)
jest.setTimeout(30000);

# Or per test
it('test', async () => { ... }, 10000);
```

### Port Already in Use

```bash
# Kill process on port
npx kill-port 4000

# Use different port
PORT=4001 npm run dev
```

### Docker Issues

```bash
# Check Docker is running
docker ps

# Rebuild images
cd docker && ./build-images.sh --no-cache

# Clean up containers
docker container prune -f
```

### Playwright Issues

```bash
# Reinstall browsers
npx playwright install --with-deps

# Clear cache
rm -rf ~/.cache/ms-playwright
npx playwright install
```

### Artillery Issues

```bash
# Increase file descriptors (Linux)
ulimit -n 65536

# Check server is accessible
curl http://localhost:4000

# Test WebSocket connection
wscat -c ws://localhost:4000
```

---

## 📊 Test Statistics

| Test Type | File | Tests | Lines | Duration |
|-----------|------|-------|-------|----------|
| Unit | socket-handlers.test.ts | 19 | 357 | ~5s |
| Integration | code-execution.test.ts | 23 | 381 | ~18s |
| E2E | collaborative-editing.spec.ts | 14 | 387 | ~45s |
| Load | artillery-config.yml | 5 scenarios | 295 | ~10m |

**Total**: 56 tests + 5 load scenarios = ~1,551 lines of test code

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure all tests pass:

```bash
# 1. Unit tests
npm run test:unit
# ✓ All 19 tests should pass

# 2. Integration tests (requires Docker)
cd docker && ./build-images.sh
npm run test:integration
# ✓ All 23 tests should pass

# 3. E2E tests (requires Playwright)
npx playwright install --with-deps
npm run test:e2e
# ✓ All 14 tests should pass

# 4. Load tests (optional, takes ~10 min)
npm run test:load
# ✓ Error rate <5%, p95 <2s

# 5. Check coverage
npm test -- --coverage
# ✓ Coverage >80%
```

---

## 🔧 CI/CD Integration

### GitHub Actions

```yaml
- name: Run Tests
  run: |
    npm install
    npm run test:unit
    npm run test:integration
    npx playwright install --with-deps
    npm run test:e2e
```

### GitLab CI

```yaml
test:
  script:
    - npm install
    - npm test
    - npm run test:e2e
  coverage: '/Statements\s+:\s+(\d+\.\d+)%/'
```

---

## 📚 Documentation

- **Full Guide**: `TESTING_GUIDE.md` (730 lines)
- **Quick Reference**: This file
- **Jest Config**: `package.json` (jest section)
- **Playwright Config**: `playwright.config.ts`
- **Artillery Config**: `tests/load/artillery-config.yml`

---

## 🎓 Best Practices

1. **Run tests before committing**: `npm test`
2. **Fix failing tests immediately**: Don't accumulate tech debt
3. **Keep tests fast**: Mock slow operations
4. **Use descriptive test names**: Explain what's being tested
5. **Test edge cases**: Don't just test happy paths
6. **Update tests with code**: Keep in sync
7. **Review test coverage**: Aim for >80%

---

## 🆘 Getting Help

```bash
# Jest help
npm test -- --help

# Playwright help
npx playwright test --help

# Artillery help
artillery --help

# View test files
ls -la tests/
```

**Need more details?** See `TESTING_GUIDE.md`

---

**Quick Test**: Run `npm test` to verify everything works! 🚀
