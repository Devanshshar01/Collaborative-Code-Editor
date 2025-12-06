/**
 * Language Server Configurations
 * HTML/CSS - vscode-html-languageserver & vscode-css-languageserver
 */

import { LanguageServerConfig, LSPLanguage } from '../../types/lsp';

// HTML - vscode-html-languageserver
export const htmlConfig: LanguageServerConfig = {
    language: LSPLanguage.HTML,
    serverCommand: ['vscode-html-language-server', '--stdio'],
    serverArgs: [],
    documentSelector: ['html', 'htm'],
    triggerCharacters: ['<', '!', '.', '/', '"', "'", '=', ' '],
    signatureTriggerCharacters: [],
    dockerImage: 'lsp-server-web',
    initializationOptions: {
        provideFormatter: true,
        embeddedLanguages: {
            css: true,
            javascript: true,
        },
        configurationSection: ['html', 'css', 'javascript'],
    },
    installCommands: [
        'npm install -g vscode-langservers-extracted',
    ],
    healthCheckCommand: 'vscode-html-language-server --version',
    rootPath: '/workspace',
};

// CSS - vscode-css-languageserver
export const cssConfig: LanguageServerConfig = {
    language: LSPLanguage.CSS,
    serverCommand: ['vscode-css-language-server', '--stdio'],
    serverArgs: [],
    documentSelector: ['css', 'scss', 'less'],
    triggerCharacters: [':', ' ', '-', '/', '.', '#', '@', '(', '"', "'"],
    signatureTriggerCharacters: [],
    dockerImage: 'lsp-server-web',
    initializationOptions: {
        provideFormatter: true,
        configurationSection: ['css', 'scss', 'less'],
    },
    installCommands: [
        'npm install -g vscode-langservers-extracted',
    ],
    healthCheckCommand: 'vscode-css-language-server --version',
    rootPath: '/workspace',
};

export default htmlConfig;
