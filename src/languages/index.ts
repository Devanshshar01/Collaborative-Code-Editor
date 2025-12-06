/**
 * Language Server Configuration Index
 * Exports all language server configurations
 */

import pythonConfig from './python/server';
import typescriptConfig, { javascriptConfig } from './typescript/server';
import { cConfig, cppConfig } from './cpp/server';
import goConfig from './go/server';
import javaConfig from './java/server';
import rustConfig from './rust/server';
import { htmlConfig, cssConfig } from './web/server';
import { LanguageServerConfig, LSPLanguage } from '../types/lsp';

// Export all configurations
export {
    pythonConfig,
    typescriptConfig,
    javascriptConfig,
    cConfig,
    cppConfig,
    goConfig,
    javaConfig,
    rustConfig,
    htmlConfig,
    cssConfig,
};

// Language server registry
export const LANGUAGE_SERVER_CONFIGS: Record<LSPLanguage, LanguageServerConfig> = {
    [LSPLanguage.PYTHON]: pythonConfig,
    [LSPLanguage.TYPESCRIPT]: typescriptConfig,
    [LSPLanguage.JAVASCRIPT]: javascriptConfig,
    [LSPLanguage.C]: cConfig,
    [LSPLanguage.CPP]: cppConfig,
    [LSPLanguage.GO]: goConfig,
    [LSPLanguage.JAVA]: javaConfig,
    [LSPLanguage.RUST]: rustConfig,
    [LSPLanguage.HTML]: htmlConfig,
    [LSPLanguage.CSS]: cssConfig,
};

// Get configuration for a language
export function getLanguageServerConfig(language: LSPLanguage): LanguageServerConfig | undefined {
    return LANGUAGE_SERVER_CONFIGS[language];
}

// Get language from file extension
export function getLanguageFromExtension(extension: string): LSPLanguage | undefined {
    const extensionMap: Record<string, LSPLanguage> = {
        'py': LSPLanguage.PYTHON,
        'pyi': LSPLanguage.PYTHON,
        'pyw': LSPLanguage.PYTHON,
        'ts': LSPLanguage.TYPESCRIPT,
        'tsx': LSPLanguage.TYPESCRIPT,
        'mts': LSPLanguage.TYPESCRIPT,
        'cts': LSPLanguage.TYPESCRIPT,
        'js': LSPLanguage.JAVASCRIPT,
        'jsx': LSPLanguage.JAVASCRIPT,
        'mjs': LSPLanguage.JAVASCRIPT,
        'cjs': LSPLanguage.JAVASCRIPT,
        'c': LSPLanguage.C,
        'h': LSPLanguage.C,
        'cpp': LSPLanguage.CPP,
        'cxx': LSPLanguage.CPP,
        'cc': LSPLanguage.CPP,
        'hpp': LSPLanguage.CPP,
        'hxx': LSPLanguage.CPP,
        'hh': LSPLanguage.CPP,
        'go': LSPLanguage.GO,
        'java': LSPLanguage.JAVA,
        'rs': LSPLanguage.RUST,
        'html': LSPLanguage.HTML,
        'htm': LSPLanguage.HTML,
        'css': LSPLanguage.CSS,
        'scss': LSPLanguage.CSS,
        'less': LSPLanguage.CSS,
    };
    return extensionMap[extension.toLowerCase()];
}

// Get language from MIME type
export function getLanguageFromMimeType(mimeType: string): LSPLanguage | undefined {
    const mimeMap: Record<string, LSPLanguage> = {
        'text/x-python': LSPLanguage.PYTHON,
        'text/typescript': LSPLanguage.TYPESCRIPT,
        'text/javascript': LSPLanguage.JAVASCRIPT,
        'text/x-c': LSPLanguage.C,
        'text/x-c++': LSPLanguage.CPP,
        'text/x-go': LSPLanguage.GO,
        'text/x-java': LSPLanguage.JAVA,
        'text/x-rust': LSPLanguage.RUST,
        'text/html': LSPLanguage.HTML,
        'text/css': LSPLanguage.CSS,
    };
    return mimeMap[mimeType];
}

// Default client capabilities for all language servers
export const DEFAULT_CLIENT_CAPABILITIES = {
    workspace: {
        applyEdit: true,
        workspaceEdit: { documentChanges: true },
        didChangeConfiguration: { dynamicRegistration: true },
        didChangeWatchedFiles: { dynamicRegistration: true },
        symbol: { dynamicRegistration: true },
        executeCommand: { dynamicRegistration: true },
        workspaceFolders: true,
        configuration: true,
        semanticTokens: { refreshSupport: true },
        codeLens: { refreshSupport: true },
        inlayHint: { refreshSupport: true },
    },
    textDocument: {
        synchronization: {
            dynamicRegistration: true,
            willSave: true,
            willSaveWaitUntil: true,
            didSave: true,
        },
        completion: {
            dynamicRegistration: true,
            completionItem: {
                snippetSupport: true,
                commitCharactersSupport: true,
                documentationFormat: ['markdown', 'plaintext'],
                deprecatedSupport: true,
                preselectSupport: true,
                tagSupport: { valueSet: [1] },
                insertReplaceSupport: true,
                resolveSupport: { properties: ['documentation', 'detail', 'additionalTextEdits'] },
                insertTextModeSupport: { valueSet: [1, 2] },
                labelDetailsSupport: true,
            },
            completionItemKind: {
                valueSet: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
            },
            contextSupport: true,
            insertTextMode: 2,
        },
        hover: {
            dynamicRegistration: true,
            contentFormat: ['markdown', 'plaintext'],
        },
        signatureHelp: {
            dynamicRegistration: true,
            signatureInformation: {
                documentationFormat: ['markdown', 'plaintext'],
                parameterInformation: { labelOffsetSupport: true },
                activeParameterSupport: true,
            },
            contextSupport: true,
        },
        declaration: { dynamicRegistration: true, linkSupport: true },
        definition: { dynamicRegistration: true, linkSupport: true },
        typeDefinition: { dynamicRegistration: true, linkSupport: true },
        implementation: { dynamicRegistration: true, linkSupport: true },
        references: { dynamicRegistration: true },
        documentHighlight: { dynamicRegistration: true },
        documentSymbol: {
            dynamicRegistration: true,
            symbolKind: { valueSet: Array.from({ length: 26 }, (_, i) => i + 1) },
            hierarchicalDocumentSymbolSupport: true,
            tagSupport: { valueSet: [1] },
            labelSupport: true,
        },
        codeAction: {
            dynamicRegistration: true,
            codeActionLiteralSupport: {
                codeActionKind: {
                    valueSet: [
                        '', 'quickfix', 'refactor', 'refactor.extract', 'refactor.inline',
                        'refactor.rewrite', 'source', 'source.organizeImports', 'source.fixAll',
                    ],
                },
            },
            isPreferredSupport: true,
            disabledSupport: true,
            dataSupport: true,
            resolveSupport: { properties: ['edit'] },
            honorsChangeAnnotations: true,
        },
        codeLens: { dynamicRegistration: true },
        documentLink: { dynamicRegistration: true, tooltipSupport: true },
        colorProvider: { dynamicRegistration: true },
        formatting: { dynamicRegistration: true },
        rangeFormatting: { dynamicRegistration: true },
        onTypeFormatting: { dynamicRegistration: true },
        rename: {
            dynamicRegistration: true,
            prepareSupport: true,
            prepareSupportDefaultBehavior: 1,
            honorsChangeAnnotations: true,
        },
        publishDiagnostics: {
            relatedInformation: true,
            tagSupport: { valueSet: [1, 2] },
            versionSupport: true,
            codeDescriptionSupport: true,
            dataSupport: true,
        },
        foldingRange: {
            dynamicRegistration: true,
            rangeLimit: 5000,
            lineFoldingOnly: true,
            foldingRangeKind: { valueSet: ['comment', 'imports', 'region'] },
            foldingRange: { collapsedText: true },
        },
        selectionRange: { dynamicRegistration: true },
        linkedEditingRange: { dynamicRegistration: true },
        callHierarchy: { dynamicRegistration: true },
        semanticTokens: {
            dynamicRegistration: true,
            tokenTypes: [
                'namespace', 'type', 'class', 'enum', 'interface', 'struct', 'typeParameter',
                'parameter', 'variable', 'property', 'enumMember', 'event', 'function', 'method',
                'macro', 'keyword', 'modifier', 'comment', 'string', 'number', 'regexp', 'operator',
                'decorator',
            ],
            tokenModifiers: [
                'declaration', 'definition', 'readonly', 'static', 'deprecated', 'abstract',
                'async', 'modification', 'documentation', 'defaultLibrary',
            ],
            formats: ['relative'],
            requests: { range: true, full: { delta: true } },
            multilineTokenSupport: false,
            overlappingTokenSupport: false,
        },
        inlayHint: {
            dynamicRegistration: true,
            resolveSupport: { properties: ['tooltip', 'textEdits', 'label.tooltip', 'label.location', 'label.command'] },
        },
        diagnostic: { dynamicRegistration: true, relatedDocumentSupport: false },
    },
    window: {
        showMessage: { messageActionItem: { additionalPropertiesSupport: true } },
        showDocument: { support: true },
        workDoneProgress: true,
    },
    general: {
        staleRequestSupport: {
            cancel: true,
            retryOnContentModified: ['textDocument/semanticTokens/full', 'textDocument/semanticTokens/range', 'textDocument/semanticTokens/full/delta'],
        },
        regularExpressions: { engine: 'ECMAScript', version: 'ES2020' },
        markdown: { parser: 'marked', version: '1.1.0' },
        positionEncodings: ['utf-16'],
    },
};
