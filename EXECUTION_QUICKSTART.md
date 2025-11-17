# Code Execution System - Quick Start Guide

Get the secure code execution system up and running in 5 minutes!

## Prerequisites

- ✅ Docker Desktop installed and running
- ✅ Node.js 18+ installed
- ✅ Git Bash (Windows) or Terminal (Mac/Linux)

## Quick Setup

### Step 1: Build Docker Images (5-10 minutes)

```bash
cd docker
```

**Windows (PowerShell):**

```powershell
.\build-images.ps1
```

**Mac/Linux:**

```bash
chmod +x build-images.sh
./build-images.sh
```

**OR use Docker Compose:**

```bash
docker-compose build
```

### Step 2: Install Dependencies

```bash
cd ..
npm install
```

### Step 3: Build TypeScript

```bash
npm run build
```

### Step 4: Start Server

```bash
npm start
```

Server will be running at `http://localhost:4000`

## Test It Out!

### Option 1: Using cURL

**Python:**

```bash
curl -X POST http://localhost:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"Hello World!\")\nprint(2 + 2)","language":"python"}'
```

**JavaScript:**

```bash
curl -X POST http://localhost:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"console.log(\"Hello World!\")","language":"javascript"}'
```

### Option 2: Using PowerShell

```powershell
$body = @{
    code = "print('Hello from Python!')"
    language = "python"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/execute" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Option 3: Run Test Suite

**Linux/Mac:**

```bash
chmod +x test-execution.sh
./test-execution.sh
```

### Option 4: Using Postman or Thunder Client

**Endpoint:** `POST http://localhost:4000/api/execute`

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "code": "print('Hello, World!')",
  "language": "python",
  "input": ""
}
```

## Example Requests

### Python with Input

```json
{
  "code": "name = input('Enter name: ')\nprint(f'Hello, {name}!')",
  "language": "python",
  "input": "Alice"
}
```

### JavaScript

```json
{
  "code": "const numbers = [1, 2, 3, 4, 5];\nconst sum = numbers.reduce((a, b) => a + b, 0);\nconsole.log('Sum:', sum);",
  "language": "javascript"
}
```

### C++

```json
{
  "code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello from C++!\" << endl;\n    return 0;\n}",
  "language": "cpp"
}
```

### Java

```json
{
  "code": "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello from Java!\");\n    }\n}",
  "language": "java"
}
```

### Go

```json
{
  "code": "package main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Hello from Go!\")\n}",
  "language": "go"
}
```

### TypeScript

```json
{
  "code": "interface Person {\n    name: string;\n    age: number;\n}\n\nconst person: Person = { name: 'Alice', age: 30 };\nconsole.log(person);",
  "language": "typescript"
}
```

## Expected Response Format

```json
{
  "stdout": "Hello, World!\n",
  "stderr": "",
  "executionTime": 125,
  "exitCode": 0
}
```

## Supported Languages

- `python` - Python 3.11
- `javascript` - Node.js 20
- `typescript` - TypeScript 5.3
- `java` - Java 17
- `cpp` - C++ (GCC 13)
- `c` - C (GCC 13)
- `go` - Go 1.21
- `html` - HTML
- `css` - CSS

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/execute` | POST | Execute code |
| `/api/languages` | GET | List supported languages |
| `/api/health` | GET | Health check |

## Common Issues

### "Docker not found"

- Make sure Docker Desktop is running
- Verify with: `docker --version`

### "Image not found"

- Run the build script first: `cd docker && ./build-images.sh`
- Verify images: `docker images | grep code-executor`

### "Port 4000 already in use"

- Change port: `PORT=5000 npm start`
- Or stop the process using port 4000

### Compilation errors

- Check your code syntax
- For Java, class name must be `Main`
- For Go, package must be `main`

## Development Mode

Run in development mode with auto-reload:

```bash
npm run dev
```

## What's Next?

1. **Integration**: Integrate with your frontend application
2. **Security**: Add authentication and rate limiting
3. **Scaling**: Set up load balancing for production
4. **Monitoring**: Add logging and metrics

## Resources

- Full Documentation: See `CODE_EXECUTION_README.md`
- API Examples: See `test-execution.sh`
- Security Details: See security section in main README

## Need Help?

Common debugging steps:

1. Check if Docker is running: `docker ps`
2. Check if images exist: `docker images | grep code-executor`
3. Check server logs for errors
4. Verify request body format (valid JSON)
5. Test with simple code first (e.g., `print('test')`)

## License

ISC
