# Secure Code Execution System

A production-ready, secure code execution system that runs untrusted code in isolated Docker containers with
comprehensive security measures.

## Features

- **Multi-Language Support**: Python, JavaScript, TypeScript, Java, C++, C, Go, HTML, CSS
- **Docker Sandboxing**: Complete isolation using Docker containers
- **Security Hardening**:
    - No network access for executed code
    - Read-only filesystem (except `/tmp`)
    - Resource limits via cgroups
    - Non-root user execution
    - Capability dropping
    - Process limits
- **Resource Constraints**:
    - 5-second execution timeout
    - 256MB memory limit
    - 1MB output limit
    - CPU throttling
- **RESTful API**: Simple POST endpoint for code execution

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/execute
       │ { code, language, input }
       ▼
┌─────────────────────────────┐
│   Express API Server        │
│  (src/routes/execution.ts)  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│   Code Executor Service     │
│ (src/services/code-executor)│
└──────────┬──────────────────┘
           │ child_process.spawn
           ▼
┌─────────────────────────────┐
│   Docker Container          │
│  - Network isolated         │
│  - Read-only FS             │
│  - Memory limited           │
│  - Non-root user            │
│  - Timeout enforced         │
└─────────────────────────────┘
```

## Installation

### Prerequisites

- Docker installed and running
- Node.js 18+ and npm
- TypeScript

### 1. Build Docker Images

Navigate to the `docker` directory and build all execution containers:

**Linux/Mac:**

```bash
cd docker
chmod +x build-images.sh
./build-images.sh
```

**Windows (PowerShell):**

```powershell
cd docker
.\build-images.ps1
```

This will create the following Docker images:

- `code-executor-python` - Python 3.11
- `code-executor-node` - Node.js 20 with TypeScript
- `code-executor-java` - OpenJDK 17
- `code-executor-cpp` - GCC 13 (C++)
- `code-executor-c` - GCC 13 (C)
- `code-executor-go` - Go 1.21

### 2. Install Dependencies

```bash
npm install
```

### 3. Build TypeScript

```bash
npm run build
```

### 4. Start Server

```bash
npm start
```

The server will start on port 4000 (configurable via `PORT` environment variable).

## API Usage

### POST /api/execute

Execute code in a secure sandbox.

**Request Body:**

```json
{
  "code": "print('Hello, World!')",
  "language": "python",
  "input": "optional stdin input"
}
```

**Supported Languages:**

- `python` - Python 3.11
- `javascript` - Node.js 20
- `typescript` - TypeScript 5.3
- `java` - Java 17
- `cpp` - C++ (GCC 13)
- `c` - C (GCC 13)
- `go` - Go 1.21
- `html` - HTML (returns content)
- `css` - CSS (returns content)

**Response:**

```json
{
  "stdout": "Hello, World!\n",
  "stderr": "",
  "executionTime": 145,
  "exitCode": 0
}
```

**Error Response:**

```json
{
  "stdout": "",
  "stderr": "Compilation Error:\n...",
  "executionTime": 89,
  "exitCode": 1,
  "error": "optional error message"
}
```

### GET /api/languages

Get list of supported languages.

**Response:**

```json
{
  "languages": [
    "python",
    "javascript",
    "typescript",
    "java",
    "cpp",
    "c",
    "go",
    "html",
    "css"
  ]
}
```

### GET /api/health

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "service": "code-execution",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Usage Examples

### Python

```bash
curl -X POST http://localhost:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello from Python!\")\nprint(2 + 2)",
    "language": "python"
  }'
```

### JavaScript

```bash
curl -X POST http://localhost:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "console.log(\"Hello from JavaScript!\");\nconsole.log(2 + 2);",
    "language": "javascript"
  }'
```

### C++

```bash
curl -X POST http://localhost:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "#include <iostream>\nint main() {\n  std::cout << \"Hello from C++!\" << std::endl;\n  return 0;\n}",
    "language": "cpp"
  }'
```

### Java

```bash
curl -X POST http://localhost:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello from Java!\");\n  }\n}",
    "language": "java"
  }'
```

### With Input

```bash
curl -X POST http://localhost:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "name = input(\"Enter name: \")\nprint(f\"Hello, {name}!\")",
    "language": "python",
    "input": "Alice"
  }'
```

## Security Features

### 1. Network Isolation

- `--network=none`: Containers have no network access
- Cannot make external requests or download malicious code

### 2. Filesystem Security

- `--read-only`: Root filesystem is read-only
- `--tmpfs=/tmp`: Only `/tmp` is writable (limited to 64MB)
- `noexec,nosuid`: `/tmp` cannot execute binaries or setuid

### 3. Resource Limits

- **Memory**: 256MB hard limit via `--memory`
- **CPU**: Throttled via `--cpu-shares`
- **Processes**: Maximum 50 processes via `--pids-limit`
- **Time**: 5-second execution timeout
- **Output**: 1MB stdout/stderr limit

### 4. Privilege Restriction

- `--cap-drop=ALL`: Drops all Linux capabilities
- `--security-opt=no-new-privileges`: Prevents privilege escalation
- Non-root user (`coderunner`) inside containers
- No sudo or privileged operations available

### 5. Input Validation

- Code size limit: 50KB maximum
- Language validation against enum
- Shell injection prevention via escaping
- Pattern detection for dangerous code (logged)

### 6. Container Isolation

- Each execution gets a unique container ID
- Containers are automatically removed after execution (`--rm`)
- Timeout kills both process and container
- No container reuse to prevent data leakage

## Configuration

Edit `src/config/execution.ts` to customize:

```typescript
export const EXECUTION_TIMEOUT = 5000; // 5 seconds
export const MEMORY_LIMIT = '256m';
export const MAX_CODE_SIZE = 50000; // 50KB
```

## Monitoring & Logs

The service logs:

- Execution requests
- Timeout events
- Security warnings (dangerous patterns detected)
- Container errors
- API errors

Example log output:

```
Execution error: Error message
Potentially dangerous code pattern detected: /eval\s*\(/i
```

## Testing

Test the system with sample code:

```bash
# Python test
curl -X POST http://localhost:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"for i in range(5): print(i)","language":"python"}'

# Timeout test (should fail after 5s)
curl -X POST http://localhost:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"import time\ntime.sleep(10)\nprint(\"done\")","language":"python"}'

# Memory test (should fail)
curl -X POST http://localhost:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"a = [0] * (10**8)\nprint(\"done\")","language":"python"}'
```

## Troubleshooting

### Docker not found

```
Error: spawn docker ENOENT
```

**Solution**: Install Docker and ensure it's in your PATH

### Image not found

```
Error: Unable to find image 'code-executor-python:latest'
```

**Solution**: Run the build script to create images

### Permission denied

```
Error: docker: permission denied
```

**Solution**: Add your user to the docker group or run with appropriate permissions

### Timeout issues

If executions are timing out too quickly, adjust `EXECUTION_TIMEOUT` in `src/config/execution.ts`

## Performance

- **Cold start**: ~100-200ms (first execution with image pull)
- **Warm start**: ~50-100ms (subsequent executions)
- **Compilation overhead**:
    - Java: +500-1000ms
    - C/C++: +200-500ms
    - Go: +300-600ms
    - TypeScript: +200-400ms

## Limitations

1. **No persistent storage**: Each execution is isolated
2. **No external dependencies**: Cannot install packages during execution
3. **No GUI**: Terminal/console applications only
4. **No multi-file projects**: Single file execution only
5. **No internet**: Network is disabled for security

## Production Considerations

For production deployment:

1. **Rate Limiting**: Add rate limiting to prevent abuse
2. **Authentication**: Implement API authentication
3. **Queue System**: Use job queue (Bull, RabbitMQ) for high load
4. **Monitoring**: Add Prometheus/Grafana for metrics
5. **Logging**: Use structured logging (Winston, Pino)
6. **Caching**: Cache Docker images on all nodes
7. **Load Balancing**: Distribute across multiple servers
8. **Resource Scaling**: Adjust limits based on your infrastructure

## License

ISC

## Contributing

Contributions welcome! Please ensure all security measures are maintained.
