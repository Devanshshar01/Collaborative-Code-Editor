import {Language, LanguageConfig} from '../types/execution';

export const EXECUTION_TIMEOUT = 5000; // 5 seconds
export const MEMORY_LIMIT = '256m';
export const MAX_CODE_SIZE = 50000; // 50KB

export const LANGUAGE_CONFIGS: Record<Language, LanguageConfig> = {
    [Language.PYTHON]: {
        image: 'code-executor-python',
        fileExtension: 'py',
        executeCommand: 'python3 /tmp/code.py',
        timeout: EXECUTION_TIMEOUT,
        memoryLimit: MEMORY_LIMIT
    },
    [Language.JAVASCRIPT]: {
        image: 'code-executor-node',
        fileExtension: 'js',
        executeCommand: 'node /tmp/code.js',
        timeout: EXECUTION_TIMEOUT,
        memoryLimit: MEMORY_LIMIT
    },
    [Language.TYPESCRIPT]: {
        image: 'code-executor-node',
        fileExtension: 'ts',
        compileCommand: 'tsc --outDir /tmp /tmp/code.ts',
        executeCommand: 'node /tmp/code.js',
        timeout: EXECUTION_TIMEOUT,
        memoryLimit: MEMORY_LIMIT
    },
    [Language.JAVA]: {
        image: 'code-executor-java',
        fileExtension: 'java',
        compileCommand: 'javac -d /tmp /tmp/Main.java',
        executeCommand: 'java -cp /tmp Main',
        timeout: EXECUTION_TIMEOUT,
        memoryLimit: MEMORY_LIMIT
    },
    [Language.CPP]: {
        image: 'code-executor-cpp',
        fileExtension: 'cpp',
        compileCommand: 'g++ -o /tmp/program /tmp/code.cpp',
        executeCommand: '/tmp/program',
        timeout: EXECUTION_TIMEOUT,
        memoryLimit: MEMORY_LIMIT
    },
    [Language.C]: {
        image: 'code-executor-c',
        fileExtension: 'c',
        compileCommand: 'gcc -o /tmp/program /tmp/code.c',
        executeCommand: '/tmp/program',
        timeout: EXECUTION_TIMEOUT,
        memoryLimit: MEMORY_LIMIT
    },
    [Language.GO]: {
        image: 'code-executor-go',
        fileExtension: 'go',
        compileCommand: 'go build -o /tmp/program /tmp/code.go',
        executeCommand: '/tmp/program',
        timeout: EXECUTION_TIMEOUT,
        memoryLimit: MEMORY_LIMIT
    },
    [Language.HTML]: {
        image: 'code-executor-node',
        fileExtension: 'html',
        executeCommand: 'cat /tmp/code.html',
        timeout: EXECUTION_TIMEOUT,
        memoryLimit: MEMORY_LIMIT
    },
    [Language.CSS]: {
        image: 'code-executor-node',
        fileExtension: 'css',
        executeCommand: 'cat /tmp/code.css',
        timeout: EXECUTION_TIMEOUT,
        memoryLimit: MEMORY_LIMIT
    }
};

// Docker security options
export const DOCKER_SECURITY_OPTS = [
    '--network=none',                    // No network access
    '--read-only',                       // Read-only filesystem
    '--tmpfs=/tmp:rw,noexec,nosuid,size=64m', // Writable /tmp with size limit
    '--cap-drop=ALL',                    // Drop all capabilities
    '--security-opt=no-new-privileges',  // Prevent privilege escalation
    '--pids-limit=50',                   // Limit number of processes
    '--cpu-shares=512',                  // CPU weight
];
