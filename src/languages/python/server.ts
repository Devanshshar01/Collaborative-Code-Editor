/**
 * Language Server Configurations
 * Per-language LSP settings for all supported languages
 */

import { LanguageServerConfig, LSPLanguage } from '../../types/lsp';

// Python - Pyright language server
export const pythonConfig: LanguageServerConfig = {
    language: LSPLanguage.PYTHON,
    serverCommand: ['pyright-langserver', '--stdio'],
    serverArgs: [],
    documentSelector: ['python'],
    triggerCharacters: ['.', '[', '(', ',', '"', "'"],
    signatureTriggerCharacters: ['(', ','],
    dockerImage: 'lsp-server-python',
    initializationOptions: {
        python: {
            analysis: {
                autoSearchPaths: true,
                diagnosticMode: 'workspace',
                useLibraryCodeForTypes: true,
                typeCheckingMode: 'basic',
                autoImportCompletions: true,
            }
        }
    },
    installCommands: [
        'pip install pyright pylsp-mypy python-lsp-server[all] black isort',
    ],
    healthCheckCommand: 'pyright --version',
    rootPath: '/workspace',
};

export default pythonConfig;
