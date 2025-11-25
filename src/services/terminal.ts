import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { Socket } from 'socket.io';
import os from 'os';

interface TerminalSession {
    process: ChildProcessWithoutNullStreams;
    id: string;
}

export class TerminalService {
    private sessions: Map<string, TerminalSession> = new Map();

    createSession(socket: Socket) {
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

        try {
            const termProcess = spawn(shell, [], {
                cwd: process.cwd(),
                env: process.env
            });

            const sessionId = socket.id;
            this.sessions.set(sessionId, { process: termProcess, id: sessionId });

            // Handle output
            termProcess.stdout.on('data', (data) => {
                socket.emit('terminal-output', data.toString());
            });

            termProcess.stderr.on('data', (data) => {
                socket.emit('terminal-output', data.toString());
            });

            termProcess.on('close', (code) => {
                socket.emit('terminal-output', `\nProcess exited with code ${code}\r\n`);
                this.sessions.delete(sessionId);
            });

            socket.on('disconnect', () => {
                this.killSession(sessionId);
            });

            console.log(`Terminal session created for ${sessionId}`);
        } catch (error) {
            console.error('Failed to create terminal session:', error);
            socket.emit('terminal-error', 'Failed to create terminal session');
        }
    }

    handleInput(socketId: string, input: string) {
        const session = this.sessions.get(socketId);
        if (session) {
            session.process.stdin.write(input);
        }
    }

    killSession(socketId: string) {
        const session = this.sessions.get(socketId);
        if (session) {
            session.process.kill();
            this.sessions.delete(socketId);
        }
    }
}
