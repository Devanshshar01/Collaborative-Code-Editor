export enum Language {
    PYTHON = 'python',
    JAVASCRIPT = 'javascript',
    TYPESCRIPT = 'typescript',
    JAVA = 'java',
    CPP = 'cpp',
    C = 'c',
    GO = 'go',
    HTML = 'html',
    CSS = 'css'
}

export interface ExecutionRequest {
    code: string;
    language: Language;
    input?: string;
}

export interface ExecutionResult {
    stdout: string;
    stderr: string;
    executionTime: number;
    exitCode: number;
    error?: string;
}

export interface LanguageConfig {
    image: string;
    fileExtension: string;
    compileCommand?: string;
    executeCommand: string;
    timeout: number;
    memoryLimit: string;
}
