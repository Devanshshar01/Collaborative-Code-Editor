/**
 * LSP Client Hook for React
 * Provides LSP features to CodeEditor component
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

// Types
export interface Position {
    line: number;
    character: number;
}

export interface Range {
    start: Position;
    end: Position;
}

export interface Diagnostic {
    range: Range;
    severity: 1 | 2 | 3 | 4; // Error, Warning, Info, Hint
    code?: string | number;
    source?: string;
    message: string;
    tags?: number[];
    relatedInformation?: {
        location: { uri: string; range: Range };
        message: string;
    }[];
}

export interface CompletionItem {
    label: string;
    labelDetails?: { detail?: string; description?: string };
    kind?: number;
    detail?: string;
    documentation?: string | { kind: string; value: string };
    insertText?: string;
    insertTextFormat?: number;
    textEdit?: { range: Range; newText: string };
    additionalTextEdits?: { range: Range; newText: string }[];
    sortText?: string;
    filterText?: string;
    preselect?: boolean;
}

export interface Hover {
    contents: string | { kind: string; value: string } | string[];
    range?: Range;
}

export interface Location {
    uri: string;
    range: Range;
}

export interface SignatureHelp {
    signatures: {
        label: string;
        documentation?: string | { kind: string; value: string };
        parameters?: {
            label: string | [number, number];
            documentation?: string | { kind: string; value: string };
        }[];
        activeParameter?: number;
    }[];
    activeSignature?: number;
    activeParameter?: number;
}

export interface InlayHint {
    position: Position;
    label: string | { value: string; tooltip?: string; location?: Location; command?: any }[];
    kind?: 1 | 2; // Type, Parameter
    paddingLeft?: boolean;
    paddingRight?: boolean;
}

export interface SemanticToken {
    line: number;
    startChar: number;
    length: number;
    tokenType: number;
    tokenModifiers: number;
}

export interface CodeAction {
    title: string;
    kind?: string;
    diagnostics?: Diagnostic[];
    isPreferred?: boolean;
    edit?: {
        changes?: { [uri: string]: { range: Range; newText: string }[] };
    };
    command?: { title: string; command: string; arguments?: any[] };
}

export interface DocumentSymbol {
    name: string;
    detail?: string;
    kind: number;
    range: Range;
    selectionRange: Range;
    children?: DocumentSymbol[];
}

export interface LSPCapabilities {
    completionProvider?: { triggerCharacters?: string[]; resolveProvider?: boolean };
    hoverProvider?: boolean;
    signatureHelpProvider?: { triggerCharacters?: string[] };
    definitionProvider?: boolean;
    typeDefinitionProvider?: boolean;
    implementationProvider?: boolean;
    referencesProvider?: boolean;
    documentSymbolProvider?: boolean;
    codeActionProvider?: boolean;
    documentFormattingProvider?: boolean;
    documentRangeFormattingProvider?: boolean;
    renameProvider?: boolean | { prepareProvider?: boolean };
    inlayHintProvider?: boolean;
    semanticTokensProvider?: { legend: { tokenTypes: string[]; tokenModifiers: string[] }; full?: boolean };
}

export interface LSPState {
    connected: boolean;
    serverStatus: 'disconnected' | 'starting' | 'ready' | 'error';
    capabilities: LSPCapabilities | null;
    diagnostics: Map<string, Diagnostic[]>;
    error: string | null;
}

export interface LSPClientOptions {
    serverUrl?: string;
    roomId: string;
    userId: string;
    language: string;
    onDiagnostics?: (uri: string, diagnostics: Diagnostic[]) => void;
    onServerStatus?: (status: string) => void;
    onError?: (error: string) => void;
}

export function useLSPClient(options: LSPClientOptions) {
    const { serverUrl = 'ws://localhost:3001', roomId, userId, language, onDiagnostics, onServerStatus, onError } = options;

    const socketRef = useRef<Socket | null>(null);
    const requestIdRef = useRef(0);
    const pendingRequestsRef = useRef<Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>>(new Map());

    const [state, setState] = useState<LSPState>({
        connected: false,
        serverStatus: 'disconnected',
        capabilities: null,
        diagnostics: new Map(),
        error: null,
    });

    // Connect to LSP server
    useEffect(() => {
        const socket = io(serverUrl, {
            path: '/lsp',
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setState(prev => ({ ...prev, connected: true, error: null }));
            
            // Join LSP session
            socket.emit('lsp:join', { roomId, userId, language });
        });

        socket.on('disconnect', () => {
            setState(prev => ({ ...prev, connected: false, serverStatus: 'disconnected' }));
        });

        socket.on('lsp:joined', (data: { serverId: string; capabilities: LSPCapabilities; status: string }) => {
            setState(prev => ({
                ...prev,
                serverStatus: 'ready',
                capabilities: data.capabilities,
            }));
            onServerStatus?.('ready');
        });

        socket.on('lsp:serverStatus', (data: { status: string; capabilities?: LSPCapabilities; error?: string }) => {
            setState(prev => ({
                ...prev,
                serverStatus: data.status as any,
                capabilities: data.capabilities || prev.capabilities,
                error: data.error || null,
            }));
            onServerStatus?.(data.status);
            if (data.error) {
                onError?.(data.error);
            }
        });

        socket.on('lsp:diagnostics', (data: { uri: string; diagnostics: Diagnostic[] }) => {
            setState(prev => {
                const newDiagnostics = new Map(prev.diagnostics);
                newDiagnostics.set(data.uri, data.diagnostics);
                return { ...prev, diagnostics: newDiagnostics };
            });
            onDiagnostics?.(data.uri, data.diagnostics);
        });

        socket.on('lsp:response', (response: { id: string; result?: any; error?: { code: number; message: string } }) => {
            const pending = pendingRequestsRef.current.get(response.id);
            if (pending) {
                clearTimeout(pending.timeout);
                pendingRequestsRef.current.delete(response.id);
                
                if (response.error) {
                    pending.reject(new Error(response.error.message));
                } else {
                    pending.resolve(response.result);
                }
            }
        });

        socket.on('lsp:error', (data: { message: string }) => {
            setState(prev => ({ ...prev, error: data.message }));
            onError?.(data.message);
        });

        return () => {
            socket.emit('lsp:leave');
            socket.disconnect();
            socketRef.current = null;
            
            // Reject all pending requests
            for (const [id, pending] of pendingRequestsRef.current) {
                clearTimeout(pending.timeout);
                pending.reject(new Error('Connection closed'));
            }
            pendingRequestsRef.current.clear();
        };
    }, [serverUrl, roomId, userId, language]);

    // Send LSP request
    const sendRequest = useCallback(async <T>(method: string, params: any, timeout = 10000): Promise<T> => {
        const socket = socketRef.current;
        if (!socket || !state.connected) {
            throw new Error('Not connected to LSP server');
        }

        const id = `${++requestIdRef.current}`;

        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                pendingRequestsRef.current.delete(id);
                reject(new Error(`Request ${method} timed out`));
            }, timeout);

            pendingRequestsRef.current.set(id, { resolve, reject, timeout: timeoutHandle });

            socket.emit('lsp:request', {
                id,
                roomId,
                fileUri: params.textDocument?.uri || '',
                language,
                method,
                params,
            });
        });
    }, [roomId, language, state.connected]);

    // Document synchronization
    const didOpen = useCallback((uri: string, languageId: string, version: number, text: string) => {
        socketRef.current?.emit('lsp:didOpen', {
            document: { uri, languageId, version, text },
        });
    }, []);

    const didChange = useCallback((uri: string, version: number, changes: { range?: Range; text: string }[]) => {
        socketRef.current?.emit('lsp:didChange', { uri, version, changes });
    }, []);

    const didClose = useCallback((uri: string) => {
        socketRef.current?.emit('lsp:didClose', { uri });
    }, []);

    const didSave = useCallback((uri: string, text?: string) => {
        socketRef.current?.emit('lsp:didSave', { uri, text });
    }, []);

    // LSP features
    const getCompletions = useCallback(async (
        uri: string,
        position: Position,
        triggerCharacter?: string
    ): Promise<CompletionItem[] | { isIncomplete: boolean; items: CompletionItem[] } | null> => {
        if (!state.capabilities?.completionProvider) return null;

        return sendRequest('textDocument/completion', {
            textDocument: { uri },
            position,
            context: triggerCharacter
                ? { triggerKind: 2, triggerCharacter }
                : { triggerKind: 1 },
        });
    }, [sendRequest, state.capabilities]);

    const getHover = useCallback(async (uri: string, position: Position): Promise<Hover | null> => {
        if (!state.capabilities?.hoverProvider) return null;

        return sendRequest('textDocument/hover', {
            textDocument: { uri },
            position,
        });
    }, [sendRequest, state.capabilities]);

    const getDefinition = useCallback(async (uri: string, position: Position): Promise<Location | Location[] | null> => {
        if (!state.capabilities?.definitionProvider) return null;

        return sendRequest('textDocument/definition', {
            textDocument: { uri },
            position,
        });
    }, [sendRequest, state.capabilities]);

    const getTypeDefinition = useCallback(async (uri: string, position: Position): Promise<Location | Location[] | null> => {
        if (!state.capabilities?.typeDefinitionProvider) return null;

        return sendRequest('textDocument/typeDefinition', {
            textDocument: { uri },
            position,
        });
    }, [sendRequest, state.capabilities]);

    const getImplementation = useCallback(async (uri: string, position: Position): Promise<Location | Location[] | null> => {
        if (!state.capabilities?.implementationProvider) return null;

        return sendRequest('textDocument/implementation', {
            textDocument: { uri },
            position,
        });
    }, [sendRequest, state.capabilities]);

    const getReferences = useCallback(async (
        uri: string,
        position: Position,
        includeDeclaration = true
    ): Promise<Location[] | null> => {
        if (!state.capabilities?.referencesProvider) return null;

        return sendRequest('textDocument/references', {
            textDocument: { uri },
            position,
            context: { includeDeclaration },
        });
    }, [sendRequest, state.capabilities]);

    const getSignatureHelp = useCallback(async (uri: string, position: Position): Promise<SignatureHelp | null> => {
        if (!state.capabilities?.signatureHelpProvider) return null;

        return sendRequest('textDocument/signatureHelp', {
            textDocument: { uri },
            position,
        });
    }, [sendRequest, state.capabilities]);

    const getDocumentSymbols = useCallback(async (uri: string): Promise<DocumentSymbol[] | null> => {
        if (!state.capabilities?.documentSymbolProvider) return null;

        return sendRequest('textDocument/documentSymbol', {
            textDocument: { uri },
        });
    }, [sendRequest, state.capabilities]);

    const getCodeActions = useCallback(async (
        uri: string,
        range: Range,
        diagnostics: Diagnostic[] = []
    ): Promise<CodeAction[] | null> => {
        if (!state.capabilities?.codeActionProvider) return null;

        return sendRequest('textDocument/codeAction', {
            textDocument: { uri },
            range,
            context: { diagnostics },
        });
    }, [sendRequest, state.capabilities]);

    const formatDocument = useCallback(async (
        uri: string,
        options: { tabSize: number; insertSpaces: boolean }
    ): Promise<{ range: Range; newText: string }[] | null> => {
        if (!state.capabilities?.documentFormattingProvider) return null;

        return sendRequest('textDocument/formatting', {
            textDocument: { uri },
            options,
        });
    }, [sendRequest, state.capabilities]);

    const formatRange = useCallback(async (
        uri: string,
        range: Range,
        options: { tabSize: number; insertSpaces: boolean }
    ): Promise<{ range: Range; newText: string }[] | null> => {
        if (!state.capabilities?.documentRangeFormattingProvider) return null;

        return sendRequest('textDocument/rangeFormatting', {
            textDocument: { uri },
            range,
            options,
        });
    }, [sendRequest, state.capabilities]);

    const rename = useCallback(async (
        uri: string,
        position: Position,
        newName: string
    ): Promise<{ changes?: { [uri: string]: { range: Range; newText: string }[] } } | null> => {
        if (!state.capabilities?.renameProvider) return null;

        return sendRequest('textDocument/rename', {
            textDocument: { uri },
            position,
            newName,
        });
    }, [sendRequest, state.capabilities]);

    const prepareRename = useCallback(async (
        uri: string,
        position: Position
    ): Promise<Range | { range: Range; placeholder: string } | null> => {
        if (!state.capabilities?.renameProvider || 
            (typeof state.capabilities.renameProvider === 'object' && !state.capabilities.renameProvider.prepareProvider)) {
            return null;
        }

        return sendRequest('textDocument/prepareRename', {
            textDocument: { uri },
            position,
        });
    }, [sendRequest, state.capabilities]);

    const getInlayHints = useCallback(async (uri: string, range: Range): Promise<InlayHint[] | null> => {
        if (!state.capabilities?.inlayHintProvider) return null;

        return sendRequest('textDocument/inlayHint', {
            textDocument: { uri },
            range,
        });
    }, [sendRequest, state.capabilities]);

    const getSemanticTokens = useCallback(async (uri: string): Promise<{ resultId?: string; data: number[] } | null> => {
        if (!state.capabilities?.semanticTokensProvider?.full) return null;

        return sendRequest('textDocument/semanticTokens/full', {
            textDocument: { uri },
        });
    }, [sendRequest, state.capabilities]);

    return {
        // State
        ...state,

        // Document sync
        didOpen,
        didChange,
        didClose,
        didSave,

        // LSP features
        getCompletions,
        getHover,
        getDefinition,
        getTypeDefinition,
        getImplementation,
        getReferences,
        getSignatureHelp,
        getDocumentSymbols,
        getCodeActions,
        formatDocument,
        formatRange,
        rename,
        prepareRename,
        getInlayHints,
        getSemanticTokens,
    };
}

export default useLSPClient;
