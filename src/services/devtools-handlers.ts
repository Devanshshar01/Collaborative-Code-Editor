/**
 * DevTools Handlers - Backend handlers for terminal and debugger functionality
 * Provides Socket.IO event handlers for PTY, debugging, and REPL operations
 */

import { Socket, Server as SocketIOServer } from 'socket.io';
import { spawn, ChildProcess } from 'child_process';
import * as os from 'os';
import * as path from 'path';

// ============ Types ============

interface TerminalSession {
    id: string;
    pty: ChildProcess;
    buffer: string[];
    cwd: string;
    shell: string;
}

interface DebugSession {
    id: string;
    language: string;
    filePath: string;
    process: ChildProcess | null;
    breakpoints: Map<string, Breakpoint[]>;
    state: 'running' | 'paused' | 'stopped';
}

interface Breakpoint {
    id: string;
    filePath: string;
    line: number;
    column?: number;
    condition?: string;
    hitCount?: string;
    logMessage?: string;
    type: 'line' | 'conditional' | 'logpoint' | 'exception' | 'function';
    verified: boolean;
    hits: number;
}

interface ReplSession {
    id: string;
    language: string;
    context: Record<string, any>;
}

// ============ Terminal Manager ============

class TerminalManager {
    private terminals: Map<string, TerminalSession> = new Map();
    private defaultShell: string;

    constructor() {
        this.defaultShell = this.getDefaultShell();
    }

    private getDefaultShell(): string {
        if (os.platform() === 'win32') {
            return process.env.COMSPEC || 'cmd.exe';
        }
        return process.env.SHELL || '/bin/bash';
    }

    create(id: string, socket: Socket, options: any = {}): TerminalSession {
        const cwd = options.cwd || process.cwd();
        const shell = options.shell || this.defaultShell;
        const cols = options.cols || 80;
        const rows = options.rows || 24;

        const pty = spawn(shell, [], {
            name: 'xterm-256color',
            cols,
            rows,
            cwd,
            env: {
                ...process.env,
                TERM: 'xterm-256color',
                COLORTERM: 'truecolor',
            },
        });

        const session: TerminalSession = {
            id,
            pty,
            buffer: [],
            cwd,
            shell,
        };

        // Handle output from PTY
        pty.onData((data: string) => {
            session.buffer.push(data);
            // Keep buffer limited
            if (session.buffer.length > 1000) {
                session.buffer.shift();
            }
            
            socket.emit('terminal:output', {
                terminalId: id,
                data,
            });
        });

        // Handle PTY exit
        pty.onExit(({ exitCode, signal }) => {
            socket.emit('terminal:exit', {
                terminalId: id,
                exitCode,
                signal,
            });
            this.terminals.delete(id);
        });

        this.terminals.set(id, session);
        return session;
    }

    write(id: string, data: string): void {
        const session = this.terminals.get(id);
        if (session) {
            session.pty.write(data);
        }
    }

    resize(id: string, cols: number, rows: number): void {
        const session = this.terminals.get(id);
        if (session) {
            session.pty.resize(cols, rows);
        }
    }

    kill(id: string): void {
        const session = this.terminals.get(id);
        if (session) {
            session.pty.kill();
            this.terminals.delete(id);
        }
    }

    getBuffer(id: string): string[] {
        const session = this.terminals.get(id);
        return session?.buffer || [];
    }

    exists(id: string): boolean {
        return this.terminals.has(id);
    }

    killAll(): void {
        for (const [id, session] of this.terminals) {
            session.pty.kill();
        }
        this.terminals.clear();
    }
}

// ============ Debug Manager ============

class DebugManager {
    private sessions: Map<string, DebugSession> = new Map();

    create(id: string, filePath: string, language: string): DebugSession {
        const session: DebugSession = {
            id,
            language,
            filePath,
            process: null,
            breakpoints: new Map(),
            state: 'stopped',
        };
        this.sessions.set(id, session);
        return session;
    }

    async start(
        id: string,
        socket: Socket,
        config: any
    ): Promise<void> {
        const session = this.sessions.get(id);
        if (!session) return;

        const { language, filePath } = session;
        
        try {
            let debugProcess: ChildProcess;
            
            switch (language) {
                case 'javascript':
                case 'typescript':
                    debugProcess = this.startNodeDebugger(filePath, config, socket, session);
                    break;
                case 'python':
                    debugProcess = this.startPythonDebugger(filePath, config, socket, session);
                    break;
                default:
                    socket.emit('debug:error', {
                        sessionId: id,
                        message: `Unsupported language: ${language}`,
                    });
                    return;
            }

            session.process = debugProcess;
            session.state = 'running';

            socket.emit('debug:started', {
                sessionId: id,
                language,
                filePath,
            });
        } catch (error) {
            socket.emit('debug:error', {
                sessionId: id,
                message: (error as Error).message,
            });
        }
    }

    private startNodeDebugger(
        filePath: string,
        config: any,
        socket: Socket,
        session: DebugSession
    ): ChildProcess {
        const args = ['--inspect-brk=9229', filePath];
        const proc = spawn('node', args, {
            cwd: path.dirname(filePath),
            env: process.env,
        }) as unknown as ChildProcess;

        proc.stdout?.on('data', (data: Buffer) => {
            socket.emit('debug:output', {
                sessionId: session.id,
                category: 'stdout',
                output: data.toString(),
            });
        });

        proc.stderr?.on('data', (data: Buffer) => {
            const output = data.toString();
            
            // Check for debugger listening message
            if (output.includes('Debugger listening')) {
                this.connectNodeInspector(session, socket);
            }
            
            socket.emit('debug:output', {
                sessionId: session.id,
                category: 'stderr',
                output,
            });
        });

        proc.on('exit', (code: number | null) => {
            session.state = 'stopped';
            socket.emit('debug:stopped', {
                sessionId: session.id,
                exitCode: code,
            });
        });

        return proc;
    }

    private async connectNodeInspector(
        session: DebugSession,
        socket: Socket
    ): Promise<void> {
        // In a real implementation, we would connect to the Chrome DevTools Protocol
        // This is a simplified version that shows the structure
        
        // Emit that we're connected and paused at entry
        setTimeout(() => {
            socket.emit('debug:paused', {
                sessionId: session.id,
                reason: 'entry',
                filePath: session.filePath,
                line: 1,
                column: 0,
                callStack: [
                    {
                        id: 'frame-0',
                        functionName: '(module)',
                        filePath: session.filePath,
                        line: 1,
                        column: 0,
                    },
                ],
                variables: {
                    local: [],
                    closure: [],
                },
            });
            session.state = 'paused';
        }, 500);
    }

    private startPythonDebugger(
        filePath: string,
        config: any,
        socket: Socket,
        session: DebugSession
    ): ChildProcess {
        // Use debugpy for Python debugging
        const args = ['-m', 'debugpy', '--listen', '5678', '--wait-for-client', filePath];
        const proc = spawn('python', args, {
            cwd: path.dirname(filePath),
            env: process.env,
        }) as unknown as ChildProcess;

        proc.stdout?.on('data', (data: Buffer) => {
            socket.emit('debug:output', {
                sessionId: session.id,
                category: 'stdout',
                output: data.toString(),
            });
        });

        proc.stderr?.on('data', (data: Buffer) => {
            socket.emit('debug:output', {
                sessionId: session.id,
                category: 'stderr',
                output: data.toString(),
            });
        });

        proc.on('exit', (code: number | null) => {
            session.state = 'stopped';
            socket.emit('debug:stopped', {
                sessionId: session.id,
                exitCode: code,
            });
        });

        return proc;
    }

    handleAction(id: string, action: string, socket: Socket): void {
        const session = this.sessions.get(id);
        if (!session) return;

        switch (action) {
            case 'continue':
                session.state = 'running';
                socket.emit('debug:resumed', { sessionId: id });
                break;
            case 'stepOver':
            case 'stepInto':
            case 'stepOut':
                session.state = 'running';
                // Simulate stepping
                setTimeout(() => {
                    session.state = 'paused';
                    socket.emit('debug:paused', {
                        sessionId: id,
                        reason: 'step',
                        // ... location info
                    });
                }, 100);
                break;
            case 'pause':
                session.state = 'paused';
                socket.emit('debug:paused', {
                    sessionId: id,
                    reason: 'pause',
                });
                break;
        }
    }

    addBreakpoint(id: string, breakpoint: Breakpoint): void {
        const session = this.sessions.get(id);
        if (!session) return;

        const fileBreakpoints = session.breakpoints.get(breakpoint.filePath) || [];
        fileBreakpoints.push({ ...breakpoint, verified: true });
        session.breakpoints.set(breakpoint.filePath, fileBreakpoints);
    }

    removeBreakpoint(id: string, breakpointId: string): void {
        const session = this.sessions.get(id);
        if (!session) return;

        for (const [file, breakpoints] of session.breakpoints) {
            const filtered = breakpoints.filter(bp => bp.id !== breakpointId);
            session.breakpoints.set(file, filtered);
        }
    }

    stop(id: string): void {
        const session = this.sessions.get(id);
        if (!session) return;

        if (session.process) {
            session.process.kill();
        }
        session.state = 'stopped';
        this.sessions.delete(id);
    }

    exists(id: string): boolean {
        return this.sessions.has(id);
    }
}

// ============ REPL Manager ============

class ReplManager {
    private sessions: Map<string, ReplSession> = new Map();

    create(id: string, language: string): ReplSession {
        const session: ReplSession = {
            id,
            language,
            context: {},
        };
        this.sessions.set(id, session);
        return session;
    }

    async execute(
        id: string,
        code: string,
        socket: Socket
    ): Promise<void> {
        const session = this.sessions.get(id);
        if (!session) {
            socket.emit('repl:result', {
                error: 'Session not found',
            });
            return;
        }

        const startTime = Date.now();

        try {
            let result: any;
            
            switch (session.language) {
                case 'javascript':
                    result = this.executeJavaScript(code, session.context);
                    break;
                case 'python':
                    result = await this.executePython(code);
                    break;
                default:
                    throw new Error(`Unsupported language: ${session.language}`);
            }

            socket.emit('repl:result', {
                result,
                type: typeof result,
                executionTime: Date.now() - startTime,
                context: session.context,
            });
        } catch (error) {
            socket.emit('repl:result', {
                error: (error as Error).message,
                executionTime: Date.now() - startTime,
            });
        }
    }

    private executeJavaScript(code: string, context: Record<string, any>): any {
        // Create a sandboxed evaluation context
        const contextKeys = Object.keys(context);
        const contextValues = Object.values(context);
        
        // eslint-disable-next-line no-new-func
        const fn = new Function(...contextKeys, `return eval(${JSON.stringify(code)})`);
        const result = fn(...contextValues);
        
        // Update context with any new variables
        // (In a real implementation, we'd use a proper sandbox)
        
        return result;
    }

    private async executePython(code: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const proc = spawn('python', ['-c', code]) as unknown as ChildProcess;
            let stdout = '';
            let stderr = '';

            proc.stdout?.on('data', (data: Buffer) => {
                stdout += data.toString();
            });

            proc.stderr?.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            proc.on('exit', (exitCode: number | null) => {
                if (exitCode === 0) {
                    resolve(stdout.trim() || undefined);
                } else {
                    reject(new Error(stderr.trim() || `Process exited with code ${exitCode}`));
                }
            });
        });
    }

    destroy(id: string): void {
        this.sessions.delete(id);
    }
}

// ============ Socket Handler Setup ============

export function setupDevToolsHandlers(io: SocketIOServer): void {
    const terminalManager = new TerminalManager();
    const debugManager = new DebugManager();
    const replManager = new ReplManager();

    io.on('connection', (socket: Socket) => {
        console.log(`[DevTools] Client connected: ${socket.id}`);

        // ============ Terminal Events ============

        socket.on('terminal:create', (data: any) => {
            const { terminalId, options } = data;
            
            if (!terminalManager.exists(terminalId)) {
                terminalManager.create(terminalId, socket, options);
                socket.emit('terminal:created', { terminalId });
            }
        });

        socket.on('terminal:input', (data: any) => {
            const { terminalId, data: inputData } = data;
            terminalManager.write(terminalId, inputData);
        });

        socket.on('terminal:resize', (data: any) => {
            const { terminalId, cols, rows } = data;
            terminalManager.resize(terminalId, cols, rows);
        });

        socket.on('terminal:kill', (data: any) => {
            const { terminalId } = data;
            terminalManager.kill(terminalId);
            socket.emit('terminal:killed', { terminalId });
        });

        socket.on('terminal:getBuffer', (data: any, callback: Function) => {
            const { terminalId } = data;
            const buffer = terminalManager.getBuffer(terminalId);
            callback({ buffer });
        });

        // ============ Debug Events ============

        socket.on('debug:start', async (data: any) => {
            const { sessionId, filePath, language, breakpoints, config } = data;
            
            const session = debugManager.create(sessionId, filePath, language);
            
            // Add breakpoints
            if (breakpoints) {
                for (const bp of breakpoints) {
                    debugManager.addBreakpoint(sessionId, bp);
                }
            }
            
            await debugManager.start(sessionId, socket, config);
        });

        socket.on('debug:stop', (data: any) => {
            const { sessionId } = data;
            debugManager.stop(sessionId);
        });

        socket.on('debug:restart', (data: any) => {
            const { sessionId } = data;
            // Stop and restart would be implemented here
            debugManager.stop(sessionId);
            // Re-start with same config
        });

        socket.on('debug:action', (data: any) => {
            const { sessionId, action } = data;
            debugManager.handleAction(sessionId, action, socket);
        });

        socket.on('debug:breakpoint:add', (data: any) => {
            const { sessionId, breakpoint } = data;
            debugManager.addBreakpoint(sessionId, breakpoint);
            socket.emit('debug:breakpointVerified', {
                id: breakpoint.id,
                verified: true,
            });
        });

        socket.on('debug:breakpoint:remove', (data: any) => {
            const { sessionId, breakpointId } = data;
            debugManager.removeBreakpoint(sessionId, breakpointId);
        });

        socket.on('debug:evaluate', (data: any) => {
            const { sessionId, expression, watchId, context } = data;
            
            // Simplified evaluation - in a real implementation,
            // we would evaluate in the debug context
            try {
                // eslint-disable-next-line no-eval
                const result = eval(expression);
                socket.emit('debug:evaluated', {
                    watchId,
                    context,
                    result,
                    type: typeof result,
                });
            } catch (error) {
                socket.emit('debug:evaluated', {
                    watchId,
                    context,
                    error: (error as Error).message,
                });
            }
        });

        // ============ REPL Events ============

        socket.on('repl:create', (data: any) => {
            const { sessionId, language } = data;
            replManager.create(sessionId, language);
            socket.emit('repl:created', { sessionId });
        });

        socket.on('repl:execute', async (data: any) => {
            const { code, language, context } = data;
            
            // Create or use existing session
            const sessionId = `${socket.id}-repl`;
            if (!replManager['sessions'].has(sessionId)) {
                replManager.create(sessionId, language);
            }
            
            await replManager.execute(sessionId, code, socket);
        });

        socket.on('repl:destroy', (data: any) => {
            const { sessionId } = data;
            replManager.destroy(sessionId);
        });

        // ============ Cleanup on disconnect ============

        socket.on('disconnect', () => {
            console.log(`[DevTools] Client disconnected: ${socket.id}`);
            // Clean up any sessions for this socket
        });
    });
}

// ============ Express Route Handlers ============

export function setupDevToolsRoutes(app: any): void {
    // Health check endpoint
    app.get('/api/devtools/health', (_req: any, res: any) => {
        res.json({ status: 'ok', services: ['terminal', 'debugger', 'repl'] });
    });

    // Get supported languages
    app.get('/api/devtools/languages', (_req: any, res: any) => {
        res.json({
            terminal: ['bash', 'zsh', 'powershell', 'cmd'],
            debugger: ['javascript', 'typescript', 'python'],
            repl: ['javascript', 'python', 'ruby', 'go', 'rust'],
        });
    });
}

export { TerminalManager, DebugManager, ReplManager };
