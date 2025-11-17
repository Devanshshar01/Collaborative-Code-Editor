import request from 'supertest';
import express from 'express';
import {createServer} from 'http';
import executionRouter from '../../src/routes/execution';
import {Language} from '../../src/types/execution';

describe('Code Execution API - Integration Tests', () => {
    let app: express.Application;
    let server: any;

    beforeAll(() => {
        app = express();
        app.use(express.json({limit: '1mb'}));
        app.use('/api', executionRouter);
        server = createServer(app);
    });

    afterAll((done) => {
        if (server) {
            server.close(done);
        } else {
            done();
        }
    });

    describe('POST /api/execute', () => {
        describe('Python Execution', () => {
            it('should execute valid Python code', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'print("Hello, World!")',
                        language: Language.PYTHON
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.stdout).toContain('Hello, World!');
                expect(response.body.stderr).toBe('');
                expect(response.body.exitCode).toBe(0);
                expect(response.body.executionTime).toBeDefined();
                expect(response.body.executionTime).toBeLessThan(5000);
            });

            it('should handle Python syntax errors', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'print("Missing parenthesis"',
                        language: Language.PYTHON
                    })
                    .expect(200);

                expect(response.body.success).toBe(false);
                expect(response.body.stderr).toContain('SyntaxError');
                expect(response.body.exitCode).not.toBe(0);
            });

            it('should handle Python runtime errors', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'x = 1 / 0',
                        language: Language.PYTHON
                    })
                    .expect(200);

                expect(response.body.success).toBe(false);
                expect(response.body.stderr).toContain('ZeroDivisionError');
            });

            it('should handle Python input', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'name = input("Enter name: ")\nprint(f"Hello, {name}!")',
                        language: Language.PYTHON,
                        input: 'Alice'
                    })
                    .expect(200);

                expect(response.body.stdout).toContain('Hello, Alice!');
            });
        });

        describe('JavaScript Execution', () => {
            it('should execute valid JavaScript code', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'console.log("Hello, JavaScript!");',
                        language: Language.JAVASCRIPT
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.stdout).toContain('Hello, JavaScript!');
                expect(response.body.exitCode).toBe(0);
            });

            it('should handle JavaScript errors', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'throw new Error("Test error");',
                        language: Language.JAVASCRIPT
                    })
                    .expect(200);

                expect(response.body.success).toBe(false);
                expect(response.body.stderr).toContain('Error: Test error');
            });
        });

        describe('TypeScript Execution', () => {
            it('should compile and execute TypeScript', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'const greeting: string = "Hello, TypeScript!";\nconsole.log(greeting);',
                        language: Language.TYPESCRIPT
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.stdout).toContain('Hello, TypeScript!');
            });

            it('should catch TypeScript type errors', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'const num: number = "string";',
                        language: Language.TYPESCRIPT
                    })
                    .expect(200);

                expect(response.body.success).toBe(false);
                expect(response.body.stderr).toBeDefined();
            });
        });

        describe('Java Execution', () => {
            it('should compile and execute Java code', async () => {
                const javaCode = `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}`;
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: javaCode,
                        language: Language.JAVA
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.stdout).toContain('Hello, Java!');
            });

            it('should handle Java compilation errors', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'public class Main { invalid syntax }',
                        language: Language.JAVA
                    })
                    .expect(200);

                expect(response.body.success).toBe(false);
                expect(response.body.stderr).toBeDefined();
            });
        });

        describe('C++ Execution', () => {
            it('should compile and execute C++ code', async () => {
                const cppCode = `
#include <iostream>
int main() {
    std::cout << "Hello, C++!" << std::endl;
    return 0;
}`;
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: cppCode,
                        language: Language.CPP
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.stdout).toContain('Hello, C++!');
            });
        });

        describe('C Execution', () => {
            it('should compile and execute C code', async () => {
                const cCode = `
#include <stdio.h>
int main() {
    printf("Hello, C!\\n");
    return 0;
}`;
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: cCode,
                        language: Language.C
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.stdout).toContain('Hello, C!');
            });
        });

        describe('Go Execution', () => {
            it('should compile and execute Go code', async () => {
                const goCode = `
package main
import "fmt"
func main() {
    fmt.Println("Hello, Go!")
}`;
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: goCode,
                        language: Language.GO
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.stdout).toContain('Hello, Go!');
            });
        });

        describe('Security & Resource Limits', () => {
            it('should timeout long-running code', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'import time\ntime.sleep(10)',
                        language: Language.PYTHON
                    })
                    .expect(200);

                expect(response.body.timeout).toBe(true);
                expect(response.body.executionTime).toBeGreaterThanOrEqual(5000);
            }, 10000);

            it('should enforce memory limits', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'data = [0] * (1024 * 1024 * 300)',
                        language: Language.PYTHON
                    })
                    .expect(200);

                expect(response.body.success).toBe(false);
            });

            it('should prevent network access', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'import urllib.request\nurllib.request.urlopen("http://google.com")',
                        language: Language.PYTHON
                    })
                    .expect(200);

                expect(response.body.success).toBe(false);
                expect(response.body.stderr).toBeDefined();
            });

            it('should prevent file system access outside /tmp', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'with open("/etc/passwd", "r") as f: print(f.read())',
                        language: Language.PYTHON
                    })
                    .expect(200);

                expect(response.body.success).toBe(false);
                expect(response.body.stderr).toContain('Permission denied');
            });
        });

        describe('Input Validation', () => {
            it('should reject missing code', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        language: Language.PYTHON
                    })
                    .expect(400);

                expect(response.body.error).toBeDefined();
            });

            it('should reject missing language', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'print("test")'
                    })
                    .expect(400);

                expect(response.body.error).toBeDefined();
            });

            it('should reject invalid language', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'print("test")',
                        language: 'invalid-lang'
                    })
                    .expect(400);

                expect(response.body.error).toContain('language');
            });

            it('should reject code exceeding size limit', async () => {
                const largeCode = 'x = 1\n'.repeat(100000);
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: largeCode,
                        language: Language.PYTHON
                    })
                    .expect(400);

                expect(response.body.error).toContain('too large');
            });
        });

        describe('Edge Cases', () => {
            it('should handle empty code', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: '',
                        language: Language.PYTHON
                    })
                    .expect(400);

                expect(response.body.error).toBeDefined();
            });

            it('should handle code with special characters', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'print("Special chars: ñ, ü, 中文, 🚀")',
                        language: Language.PYTHON
                    })
                    .expect(200);

                expect(response.body.stdout).toContain('Special chars');
            });

            it('should handle multi-line output', async () => {
                const response = await request(app)
                    .post('/api/execute')
                    .send({
                        code: 'for i in range(5):\n    print(f"Line {i}")',
                        language: Language.PYTHON
                    })
                    .expect(200);

                expect(response.body.stdout.split('\n').length).toBeGreaterThan(1);
            });
        });
    });
});
