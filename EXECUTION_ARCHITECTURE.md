# Code Execution System - Architecture & Security

## System Overview

The secure code execution system provides a sandboxed environment for running untrusted code across multiple programming
languages. The system prioritizes security, isolation, and resource control.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  (Frontend, API Clients, CLI Tools, Test Scripts)          │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/HTTPS
                           │ JSON Payload
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Express.js Server (src/server.ts)                  │   │
│  │  - Body parsing (1MB limit)                         │   │
│  │  - CORS handling                                     │   │
│  │  - Request routing                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   ROUTE HANDLER LAYER                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Execution Router (src/routes/execution.ts)         │   │
│  │  - Input validation                                  │   │
│  │  - Language enum checking                            │   │
│  │  - Error handling                                    │   │
│  │  - Response formatting                               │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Code Executor (src/services/code-executor.ts)      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  1. Validate Request                         │   │   │
│  │  │     - Check code size (max 50KB)             │   │   │
│  │  │     - Validate language                      │   │   │
│  │  │     - Pattern detection                      │   │   │
│  │  │     - Shell injection prevention             │   │   │
│  │  │                                               │   │   │
│  │  │  2. Compilation (if needed)                  │   │   │
│  │  │     - Java, C, C++, Go, TypeScript           │   │   │
│  │  │     - 50% of timeout allocated               │   │   │
│  │  │     - Return errors immediately              │   │   │
│  │  │                                               │   │   │
│  │  │  3. Execution                                 │   │   │
│  │  │     - Spawn Docker container                 │   │   │
│  │  │     - Apply security restrictions            │   │   │
│  │  │     - Monitor resource usage                 │   │   │
│  │  │     - Enforce timeout                        │   │   │
│  │  │                                               │   │   │
│  │  │  4. Output Collection                        │   │   │
│  │  │     - Capture stdout/stderr                  │   │   │
│  │  │     - Limit output size (1MB)                │   │   │
│  │  │     - Calculate execution time               │   │   │
│  │  │     - Get exit code                          │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ child_process.spawn
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   CONTAINER ORCHESTRATION                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Docker Engine                                       │   │
│  │  - Container creation                                │   │
│  │  - Resource isolation (cgroups)                      │   │
│  │  - Network isolation                                 │   │
│  │  - Filesystem restrictions                           │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXECUTION CONTAINERS                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Python     │  │  JavaScript  │  │     Java     │     │
│  │   Container  │  │   Container  │  │   Container  │ ... │
│  │              │  │              │  │              │     │
│  │  - Python    │  │  - Node.js   │  │  - OpenJDK   │     │
│  │    3.11      │  │    20        │  │    17        │     │
│  │  - Alpine    │  │  - TypeScript│  │  - Alpine    │     │
│  │  - Non-root  │  │  - Alpine    │  │  - Non-root  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     C++      │  │      C       │  │      Go      │     │
│  │   Container  │  │   Container  │  │   Container  │     │
│  │              │  │              │  │              │     │
│  │  - GCC 13    │  │  - GCC 13    │  │  - Go 1.21   │     │
│  │  - Alpine    │  │  - Alpine    │  │  - Alpine    │     │
│  │  - Non-root  │  │  - Non-root  │  │  - Non-root  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Security Model

### Defense in Depth Strategy

The system implements multiple layers of security to prevent malicious code execution:

#### Layer 1: Input Validation

```typescript
// Before execution
- Code size limit: 50KB max
- Language whitelist validation
- Request body size limit: 1MB
- Type checking
- Pattern detection (logged warnings)
```

#### Layer 2: Code Sanitization

```typescript
// Shell injection prevention
- Escape special characters: \ " $ ` !
- No direct shell execution
- Parameterized commands
```

#### Layer 3: Container Isolation

```dockerfile
# Network Isolation
--network=none                      # No network access at all

# Filesystem Security
--read-only                         # Root FS is read-only
--tmpfs=/tmp:rw,noexec,nosuid      # /tmp writeable but restricted
  - size=64m                        # Limited to 64MB
  - noexec                          # Cannot execute binaries
  - nosuid                          # No setuid bits

# Privilege Dropping
--cap-drop=ALL                      # Drop all Linux capabilities
--security-opt=no-new-privileges   # Prevent privilege escalation
USER coderunner                     # Non-root user inside container
```

#### Layer 4: Resource Limits

```dockerfile
# Memory
--memory=256m                       # Hard memory limit

# CPU
--cpu-shares=512                    # CPU weight (relative)

# Processes
--pids-limit=50                     # Max 50 processes

# Time
Timeout: 5000ms                     # Hard kill after 5s

# Output
Max stdout/stderr: 1MB each         # Prevent memory exhaustion
```

#### Layer 5: Runtime Monitoring

```typescript
// During execution
- Timeout enforcement with SIGKILL
- Output size monitoring
- Container auto-cleanup (--rm)
- Unique container IDs (no reuse)
- Process spawn monitoring
```

## Data Flow

### Request Flow

```
1. Client Request
   ├─→ POST /api/execute
   └─→ Body: { code, language, input? }

2. API Gateway
   ├─→ Parse JSON (1MB limit)
   ├─→ Route to execution handler
   └─→ Apply CORS

3. Route Handler
   ├─→ Validate request body
   ├─→ Check required fields
   ├─→ Validate language enum
   └─→ Forward to executor service

4. Code Executor Service
   ├─→ Validate code size
   ├─→ Sanitize input
   ├─→ Select language config
   ├─→ Compile if needed
   └─→ Execute in container

5. Docker Container
   ├─→ Create isolated environment
   ├─→ Apply security restrictions
   ├─→ Run code
   ├─→ Capture output
   └─→ Auto-cleanup

6. Response
   ├─→ Format results
   ├─→ Include timing
   └─→ Return to client
```

### Compilation Flow (Java, C, C++, Go, TypeScript)

```
1. Write source code to /tmp/{filename}
2. Run compiler in container
3. Check compilation exit code
4. If failed:
   └─→ Return compilation errors immediately
5. If succeeded:
   └─→ Execute compiled binary
```

## Language Configurations

### Python

```typescript
{
  image: 'code-executor-python',
  runtime: 'Python 3.11',
  base: 'python:3.11-alpine',
  extension: '.py',
  execution: 'Direct interpretation'
}
```

### JavaScript/TypeScript

```typescript
{
  image: 'code-executor-node',
  runtime: 'Node.js 20',
  base: 'node:20-alpine',
  extensions: '.js, .ts',
  execution: 'Direct (JS) / Compiled (TS)'
}
```

### Java

```typescript
{
  image: 'code-executor-java',
  runtime: 'OpenJDK 17',
  base: 'openjdk:17-alpine',
  extension: '.java',
  execution: 'Compiled then executed',
  note: 'Class must be named "Main"'
}
```

### C/C++

```typescript
{
  image: 'code-executor-c / code-executor-cpp',
  runtime: 'GCC 13',
  base: 'gcc:13-alpine',
  extensions: '.c, .cpp',
  execution: 'Compiled then executed'
}
```

### Go

```typescript
{
  image: 'code-executor-go',
  runtime: 'Go 1.21',
  base: 'golang:1.21-alpine',
  extension: '.go',
  execution: 'Compiled then executed',
  note: 'Package must be "main"'
}
```

## Performance Characteristics

### Execution Timing

```
Total Time = Validation + (Compilation?) + Execution + Overhead

Cold Start (first run):
├─→ Validation: ~1-5ms
├─→ Container spawn: ~100-200ms
├─→ Compilation: 0-1000ms (language dependent)
├─→ Execution: User code time
└─→ Cleanup: ~50ms

Warm Start (cached images):
├─→ Validation: ~1-5ms
├─→ Container spawn: ~50-100ms
├─→ Compilation: 0-1000ms
├─→ Execution: User code time
└─→ Cleanup: ~20ms
```

### Resource Usage per Execution

```
Memory: 256MB max per container
CPU: Shared, throttled via cgroups
Disk: 64MB in /tmp (tmpfs)
Network: None (disabled)
Processes: 50 max
```

## Security Considerations

### What's Prevented

✅ **Network attacks**

- No outbound connections
- Cannot download malicious code
- Cannot communicate with external services

✅ **Filesystem attacks**

- Cannot modify system files
- Cannot read sensitive host data
- Limited /tmp space

✅ **Resource exhaustion**

- Memory bombs limited to 256MB
- CPU usage throttled
- Process fork bombs limited to 50
- Infinite loops killed at 5s

✅ **Privilege escalation**

- No capabilities
- Non-root user
- No new privileges allowed

✅ **Container escape**

- Read-only root FS
- Restricted syscalls
- No privileged operations

### What's NOT Prevented (Inherent Limitations)

⚠️ **Logical bugs in user code**

- Incorrect algorithms
- Logic errors
- Non-malicious infinite loops

⚠️ **Compilation errors**

- Syntax errors
- Type errors
- Import errors

⚠️ **Resource limits within bounds**

- Using 200MB memory (within 256MB)
- Running for 4.5s (within 5s)
- Creating 40 processes (within 50)

## Monitoring & Observability

### Logged Events

```
✓ Execution requests (language, code size)
✓ Timeout events
✓ Container errors
✓ Compilation failures
✓ Security warnings (dangerous patterns)
✓ API errors
✓ Resource limit violations
```

### Metrics to Monitor

```
- Execution count by language
- Average execution time
- Timeout rate
- Error rate
- Container spawn time
- Memory usage patterns
- CPU usage patterns
```

## Scaling Considerations

### Horizontal Scaling

```
Load Balancer
├─→ Node 1 (Docker host)
├─→ Node 2 (Docker host)
├─→ Node 3 (Docker host)
└─→ Node N (Docker host)

Each node runs:
- Express API server
- Docker daemon
- Pre-pulled images
```

### Vertical Scaling

```
Adjust per-container limits:
- Memory: 256MB → 512MB
- CPU shares: 512 → 1024
- Timeout: 5s → 10s
- Processes: 50 → 100
```

### Queue-Based Architecture (High Load)

```
Client → API → Queue (Redis/RabbitMQ) → Workers → Docker
         └─→ Job ID                      ├─→ Result Cache
                                         └─→ Webhook/SSE
```

## Deployment Options

### Development

```
Single server:
- Node.js + Docker on localhost
- Direct execution
- Hot reload enabled
```

### Production

```
Multi-tier:
- Load balancer (nginx/ALB)
- Multiple API servers
- Shared Redis for coordination
- Centralized logging (ELK/Loki)
- Metrics (Prometheus/Grafana)
- Container orchestration (Kubernetes/Swarm)
```

## Future Enhancements

### Potential Improvements

1. **Language Support**
    - Rust, Swift, Kotlin, Ruby, PHP
    - Multi-file projects
    - Package installation (sandboxed)

2. **Security**
    - Seccomp profiles
    - AppArmor/SELinux policies
    - Rootless containers
    - Hardware isolation (VMs)

3. **Features**
    - Real-time execution streaming
    - Debugging support
    - Code analysis/linting
    - Performance profiling

4. **Scalability**
    - Kubernetes deployment
    - Auto-scaling based on load
    - Global edge deployment
    - Container pooling/warming

## Threat Model

### Threats Considered

| Threat | Mitigation |
|--------|------------|
| Malicious code execution | Container isolation |
| Resource exhaustion | Hard limits (memory, CPU, time) |
| Network attacks | Network disabled |
| Filesystem tampering | Read-only FS |
| Privilege escalation | Capability dropping, non-root |
| Container escape | Multiple security layers |
| Data exfiltration | No network, isolated containers |
| DDoS | Rate limiting (future), timeouts |

### Security Assumptions

1. Docker daemon is secure and up-to-date
2. Host OS is hardened
3. API server has proper authentication (production)
4. Docker socket is not exposed to containers
5. Images are from trusted sources

## Conclusion

This architecture provides a robust, secure, and scalable solution for executing untrusted code. The multi-layered
security approach ensures that even if one layer is compromised, additional safeguards prevent system-wide impact.

The system is designed to be:

- **Secure**: Multiple isolation layers
- **Performant**: Fast container startup
- **Scalable**: Stateless design
- **Maintainable**: Clear separation of concerns
- **Observable**: Comprehensive logging
