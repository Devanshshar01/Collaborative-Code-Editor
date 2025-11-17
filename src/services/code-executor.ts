import {spawn, ChildProcess} from 'child_process';
import {ExecutionRequest, ExecutionResult, Language} from '../types/execution';
import {LANGUAGE_CONFIGS, DOCKER_SECURITY_OPTS, MAX_CODE_SIZE} from '../config/execution';
import * as crypto from 'crypto';

export class CodeExecutor {
    /**
     * Execute code in a secure Docker container
     */
    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        const startTime = Date.now();

        // Validate input
        this.validateRequest(request);

        const config = LANGUAGE_CONFIGS[request.language];
        if (!config) {
            throw new Error(`Unsupported language: ${request.language}`);
        }

        try {
            // For compiled languages, compile first then execute
            if (config.compileCommand) {
                const compileResult = await this.runInContainer(
                    request.code,
                    request.language,
                    config.compileCommand,
                    '',
                    config.timeout / 2 // Give half time for compilation
                );

                if (compileResult.exitCode !== 0) {
                    return {
                        stdout: compileResult.stdout,
                        stderr: `Compilation Error:\n${compileResult.stderr}`,
                        executionTime: Date.now() - startTime,
                        exitCode: compileResult.exitCode
                    };
                }
            }

            // Execute the code
            const result = await this.runInContainer(
                request.code,
                request.language,
                config.executeCommand,
                request.input || '',
                config.timeout
            );

            return {
                ...result,
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                stdout: '',
                stderr: '',
                executionTime: Date.now() - startTime,
                exitCode: -1,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Run code in a Docker container with security restrictions
     */
    private async runInContainer(
        code: string,
        language: Language,
        command: string,
        input: string,
        timeout: number
    ): Promise<ExecutionResult> {
        const config = LANGUAGE_CONFIGS[language];
        const containerId = this.generateContainerId();

        // Determine filename based on language
        let filename = `code.${config.fileExtension}`;
        if (language === Language.JAVA) {
            filename = 'Main.java'; // Java requires class name to match filename
        }

        // Build Docker run command with security options
        const dockerArgs = [
            'run',
            '--rm',
            '--name', containerId,
            `-m=${config.memoryLimit}`,
            ...DOCKER_SECURITY_OPTS,
            '-i', // Interactive for stdin
            config.image,
            'sh', '-c',
            `echo "${this.escapeCode(code)}" > /tmp/${filename} && ${command}`
        ];

        return new Promise((resolve) => {
            let stdout = '';
            let stderr = '';
            let isTimeout = false;
            let exitCode = 0;

            const process: ChildProcess = spawn('docker', dockerArgs, {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            // Set up timeout
            const timeoutId = setTimeout(() => {
                isTimeout = true;
                // Kill the container
                spawn('docker', ['kill', containerId]);
                process.kill('SIGKILL');
            }, timeout);

            // Handle stdout
            if (process.stdout) {
                process.stdout.on('data', (data) => {
                    stdout += data.toString();
                    // Limit output size to prevent memory issues
                    if (stdout.length > 1000000) { // 1MB limit
                        process.kill('SIGKILL');
                        stderr += '\nOutput limit exceeded';
                    }
                });
            }

            // Handle stderr
            if (process.stderr) {
                process.stderr.on('data', (data) => {
                    stderr += data.toString();
                    if (stderr.length > 1000000) { // 1MB limit
                        process.kill('SIGKILL');
                    }
                });
            }

            // Write input to stdin if provided
            if (input && process.stdin) {
                process.stdin.write(input);
                process.stdin.end();
            }

            // Handle process exit
            process.on('close', (code) => {
                clearTimeout(timeoutId);
                exitCode = code || 0;

                if (isTimeout) {
                    resolve({
                        stdout: stdout.trim(),
                        stderr: 'Execution timeout exceeded (5 seconds)',
                        executionTime: timeout,
                        exitCode: 124 // Standard timeout exit code
                    });
                } else {
                    resolve({
                        stdout: stdout.trim(),
                        stderr: stderr.trim(),
                        executionTime: 0, // Will be calculated by caller
                        exitCode
                    });
                }
            });

            // Handle process error
            process.on('error', (error) => {
                clearTimeout(timeoutId);
                resolve({
                    stdout: stdout.trim(),
                    stderr: `Process error: ${error.message}`,
                    executionTime: 0,
                    exitCode: -1
                });
            });
        });
    }

    /**
     * Validate execution request
     */
    private validateRequest(request: ExecutionRequest): void {
        if (!request.code || typeof request.code !== 'string') {
            throw new Error('Code must be a non-empty string');
        }

        if (request.code.length > MAX_CODE_SIZE) {
            throw new Error(`Code size exceeds maximum limit of ${MAX_CODE_SIZE} bytes`);
        }

        if (!Object.values(Language).includes(request.language)) {
            throw new Error(`Invalid language: ${request.language}`);
        }

        // Check for potentially dangerous patterns (basic validation)
        const dangerousPatterns = [
            /eval\s*\(/i,
            /exec\s*\(/i,
            /system\s*\(/i,
            /__import__\s*\(\s*['"]os['"]\s*\)/i,
            /subprocess/i
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(request.code)) {
                console.warn(`Potentially dangerous code pattern detected: ${pattern}`);
                // Log but don't block - Docker provides the actual security
            }
        }
    }

    /**
     * Escape code for shell injection prevention
     */
    private escapeCode(code: string): string {
        return code
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\$/g, '\\$')
            .replace(/`/g, '\\`')
            .replace(/!/g, '\\!');
    }

    /**
     * Generate unique container ID
     */
    private generateContainerId(): string {
        return `code-exec-${crypto.randomBytes(8).toString('hex')}`;
    }
}

export const codeExecutor = new CodeExecutor();
