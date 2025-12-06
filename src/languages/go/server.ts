/**
 * Language Server Configurations
 * Go - gopls language server
 */

import { LanguageServerConfig, LSPLanguage } from '../../types/lsp';

// Go - gopls language server
export const goConfig: LanguageServerConfig = {
    language: LSPLanguage.GO,
    serverCommand: ['gopls'],
    serverArgs: ['serve'],
    documentSelector: ['go', 'go.mod', 'go.sum'],
    triggerCharacters: ['.', '"'],
    signatureTriggerCharacters: ['(', ','],
    dockerImage: 'lsp-server-go',
    initializationOptions: {
        'ui.completion.usePlaceholders': true,
        'ui.semanticTokens': true,
        'ui.codelenses': {
            gc_details: true,
            generate: true,
            regenerate_cgo: true,
            tidy: true,
            upgrade_dependency: true,
            vendor: true,
            run_govulncheck: true,
        },
        'ui.diagnostic.staticcheck': true,
        'ui.diagnostic.analyses': {
            fieldalignment: true,
            nilness: true,
            shadow: true,
            unusedparams: true,
            unusedwrite: true,
            useany: true,
        },
        'formatting.gofumpt': true,
        'ui.hints': {
            assignVariableTypes: true,
            compositeLiteralFields: true,
            compositeLiteralTypes: true,
            constantValues: true,
            functionTypeParameters: true,
            parameterNames: true,
            rangeVariableTypes: true,
        },
    },
    installCommands: [
        'go install golang.org/x/tools/gopls@latest',
        'go install github.com/go-delve/delve/cmd/dlv@latest',
        'go install golang.org/x/tools/cmd/goimports@latest',
    ],
    healthCheckCommand: 'gopls version',
    rootPath: '/workspace',
};

export default goConfig;
