/**
 * Language Server Configurations
 * TypeScript/JavaScript - typescript-language-server
 */

import { LanguageServerConfig, LSPLanguage } from '../../types/lsp';

// TypeScript/JavaScript - typescript-language-server
export const typescriptConfig: LanguageServerConfig = {
    language: LSPLanguage.TYPESCRIPT,
    serverCommand: ['typescript-language-server', '--stdio'],
    serverArgs: [],
    documentSelector: ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
    triggerCharacters: ['.', '"', "'", '/', '@', '<'],
    signatureTriggerCharacters: ['(', ',', '<'],
    dockerImage: 'lsp-server-typescript',
    initializationOptions: {
        preferences: {
            includeInlayParameterNameHints: 'all',
            includeInlayParameterNameHintsWhenArgumentMatchesName: true,
            includeInlayFunctionParameterTypeHints: true,
            includeInlayVariableTypeHints: true,
            includeInlayPropertyDeclarationTypeHints: true,
            includeInlayFunctionLikeReturnTypeHints: true,
            includeInlayEnumMemberValueHints: true,
            importModuleSpecifierPreference: 'relative',
            quotePreference: 'single',
        },
        tsserver: {
            useSyntaxServer: 'auto',
        }
    },
    installCommands: [
        'npm install -g typescript typescript-language-server prettier eslint',
    ],
    healthCheckCommand: 'typescript-language-server --version',
    rootPath: '/workspace',
};

export const javascriptConfig: LanguageServerConfig = {
    language: LSPLanguage.JAVASCRIPT,
    serverCommand: ['typescript-language-server', '--stdio'],
    serverArgs: [],
    documentSelector: ['javascript', 'javascriptreact'],
    triggerCharacters: ['.', '"', "'", '/', '@', '<'],
    signatureTriggerCharacters: ['(', ',', '<'],
    dockerImage: 'lsp-server-typescript',
    initializationOptions: {
        preferences: {
            includeInlayParameterNameHints: 'all',
            includeInlayFunctionParameterTypeHints: true,
            includeInlayVariableTypeHints: true,
            includeInlayPropertyDeclarationTypeHints: true,
            includeInlayFunctionLikeReturnTypeHints: true,
            importModuleSpecifierPreference: 'relative',
        }
    },
    installCommands: [
        'npm install -g typescript typescript-language-server prettier eslint',
    ],
    healthCheckCommand: 'typescript-language-server --version',
    rootPath: '/workspace',
};

export default typescriptConfig;
