/**
 * Language Server Configurations
 * C/C++ - clangd language server
 */

import { LanguageServerConfig, LSPLanguage } from '../../types/lsp';

// C - clangd language server
export const cConfig: LanguageServerConfig = {
    language: LSPLanguage.C,
    serverCommand: ['clangd'],
    serverArgs: [
        '--background-index',
        '--clang-tidy',
        '--completion-style=detailed',
        '--header-insertion=iwyu',
        '--suggest-missing-includes',
        '--function-arg-placeholders',
        '--fallback-style=llvm',
        '-j=4',
        '--pch-storage=memory',
    ],
    documentSelector: ['c'],
    triggerCharacters: ['.', '>', ':', '<', '"'],
    signatureTriggerCharacters: ['(', ','],
    dockerImage: 'lsp-server-cpp',
    initializationOptions: {
        clangdFileStatus: true,
        fallbackFlags: ['-std=c17', '-Wall', '-Wextra', '-pedantic'],
    },
    installCommands: [
        'apt-get update && apt-get install -y clangd clang-format clang-tidy',
    ],
    healthCheckCommand: 'clangd --version',
    rootPath: '/workspace',
};

// C++ - clangd language server
export const cppConfig: LanguageServerConfig = {
    language: LSPLanguage.CPP,
    serverCommand: ['clangd'],
    serverArgs: [
        '--background-index',
        '--clang-tidy',
        '--completion-style=detailed',
        '--header-insertion=iwyu',
        '--suggest-missing-includes',
        '--function-arg-placeholders',
        '--fallback-style=llvm',
        '-j=4',
        '--pch-storage=memory',
    ],
    documentSelector: ['cpp', 'c'],
    triggerCharacters: ['.', '>', ':', '<', '"'],
    signatureTriggerCharacters: ['(', ','],
    dockerImage: 'lsp-server-cpp',
    initializationOptions: {
        clangdFileStatus: true,
        fallbackFlags: ['-std=c++20', '-Wall', '-Wextra', '-pedantic'],
    },
    installCommands: [
        'apt-get update && apt-get install -y clangd clang-format clang-tidy',
    ],
    healthCheckCommand: 'clangd --version',
    rootPath: '/workspace',
};

export default cppConfig;
