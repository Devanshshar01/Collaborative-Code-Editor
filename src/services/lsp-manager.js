/**
 * Enhanced LSP Manager
 * Full Language Server Protocol implementation for code intelligence
 */

import { EventEmitter } from 'events';

// LSP Message Types
export const LSPMethods = {
  // Lifecycle
  INITIALIZE: 'initialize',
  INITIALIZED: 'initialized',
  SHUTDOWN: 'shutdown',
  EXIT: 'exit',
  
  // Document Sync
  DID_OPEN: 'textDocument/didOpen',
  DID_CHANGE: 'textDocument/didChange',
  DID_SAVE: 'textDocument/didSave',
  DID_CLOSE: 'textDocument/didClose',
  
  // Language Features
  COMPLETION: 'textDocument/completion',
  COMPLETION_RESOLVE: 'completionItem/resolve',
  HOVER: 'textDocument/hover',
  SIGNATURE_HELP: 'textDocument/signatureHelp',
  DEFINITION: 'textDocument/definition',
  TYPE_DEFINITION: 'textDocument/typeDefinition',
  IMPLEMENTATION: 'textDocument/implementation',
  REFERENCES: 'textDocument/references',
  DOCUMENT_HIGHLIGHT: 'textDocument/documentHighlight',
  DOCUMENT_SYMBOL: 'textDocument/documentSymbol',
  CODE_ACTION: 'textDocument/codeAction',
  CODE_LENS: 'textDocument/codeLens',
  CODE_LENS_RESOLVE: 'codeLens/resolve',
  FORMATTING: 'textDocument/formatting',
  RANGE_FORMATTING: 'textDocument/rangeFormatting',
  ON_TYPE_FORMATTING: 'textDocument/onTypeFormatting',
  RENAME: 'textDocument/rename',
  PREPARE_RENAME: 'textDocument/prepareRename',
  FOLDING_RANGE: 'textDocument/foldingRange',
  SELECTION_RANGE: 'textDocument/selectionRange',
  INLAY_HINT: 'textDocument/inlayHint',
  SEMANTIC_TOKENS_FULL: 'textDocument/semanticTokens/full',
  
  // Workspace
  WORKSPACE_SYMBOL: 'workspace/symbol',
  WORKSPACE_EXECUTE_COMMAND: 'workspace/executeCommand',
  
  // Diagnostics (server -> client)
  PUBLISH_DIAGNOSTICS: 'textDocument/publishDiagnostics',
};

// Diagnostic Severity
export const DiagnosticSeverity = {
  ERROR: 1,
  WARNING: 2,
  INFORMATION: 3,
  HINT: 4,
};

// Completion Item Kind
export const CompletionItemKind = {
  TEXT: 1,
  METHOD: 2,
  FUNCTION: 3,
  CONSTRUCTOR: 4,
  FIELD: 5,
  VARIABLE: 6,
  CLASS: 7,
  INTERFACE: 8,
  MODULE: 9,
  PROPERTY: 10,
  UNIT: 11,
  VALUE: 12,
  ENUM: 13,
  KEYWORD: 14,
  SNIPPET: 15,
  COLOR: 16,
  FILE: 17,
  REFERENCE: 18,
  FOLDER: 19,
  ENUM_MEMBER: 20,
  CONSTANT: 21,
  STRUCT: 22,
  EVENT: 23,
  OPERATOR: 24,
  TYPE_PARAMETER: 25,
};

// Symbol Kind
export const SymbolKind = {
  FILE: 1,
  MODULE: 2,
  NAMESPACE: 3,
  PACKAGE: 4,
  CLASS: 5,
  METHOD: 6,
  PROPERTY: 7,
  FIELD: 8,
  CONSTRUCTOR: 9,
  ENUM: 10,
  INTERFACE: 11,
  FUNCTION: 12,
  VARIABLE: 13,
  CONSTANT: 14,
  STRING: 15,
  NUMBER: 16,
  BOOLEAN: 17,
  ARRAY: 18,
  OBJECT: 19,
  KEY: 20,
  NULL: 21,
  ENUM_MEMBER: 22,
  STRUCT: 23,
  EVENT: 24,
  OPERATOR: 25,
  TYPE_PARAMETER: 26,
};

// Code Action Kind
export const CodeActionKind = {
  EMPTY: '',
  QUICK_FIX: 'quickfix',
  REFACTOR: 'refactor',
  REFACTOR_EXTRACT: 'refactor.extract',
  REFACTOR_INLINE: 'refactor.inline',
  REFACTOR_REWRITE: 'refactor.rewrite',
  SOURCE: 'source',
  SOURCE_ORGANIZE_IMPORTS: 'source.organizeImports',
  SOURCE_FIX_ALL: 'source.fixAll',
};

/**
 * LSP Server Connection
 * Handles communication with language servers
 */
class LSPConnection extends EventEmitter {
  constructor(language) {
    super();
    this.language = language;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.initialized = false;
    this.capabilities = {};
    this.ws = null;
  }

  async connect(serverUrl) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(serverUrl);
      
      this.ws.onopen = () => {
        this.initialize().then(resolve).catch(reject);
      };
      
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };
      
      this.ws.onerror = (error) => {
        this.emit('error', error);
        reject(error);
      };
      
      this.ws.onclose = () => {
        this.initialized = false;
        this.emit('close');
      };
    });
  }

  handleMessage(message) {
    if (message.id !== undefined) {
      // Response to a request
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        this.pendingRequests.delete(message.id);
        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
      }
    } else if (message.method) {
      // Notification from server
      this.emit(message.method, message.params);
    }
  }

  async initialize() {
    const result = await this.request(LSPMethods.INITIALIZE, {
      processId: null,
      rootUri: null,
      capabilities: {
        textDocument: {
          synchronization: { dynamicRegistration: true, didSave: true },
          completion: {
            dynamicRegistration: true,
            completionItem: {
              snippetSupport: true,
              documentationFormat: ['markdown', 'plaintext'],
              resolveSupport: { properties: ['documentation', 'detail'] },
            },
          },
          hover: { dynamicRegistration: true, contentFormat: ['markdown', 'plaintext'] },
          signatureHelp: { dynamicRegistration: true },
          definition: { dynamicRegistration: true },
          references: { dynamicRegistration: true },
          documentHighlight: { dynamicRegistration: true },
          documentSymbol: { dynamicRegistration: true },
          codeAction: { dynamicRegistration: true },
          codeLens: { dynamicRegistration: true },
          formatting: { dynamicRegistration: true },
          rangeFormatting: { dynamicRegistration: true },
          rename: { dynamicRegistration: true, prepareSupport: true },
          foldingRange: { dynamicRegistration: true },
          inlayHint: { dynamicRegistration: true },
        },
        workspace: {
          workspaceFolders: true,
          symbol: { dynamicRegistration: true },
        },
      },
    });
    
    this.capabilities = result.capabilities;
    this.initialized = true;
    
    await this.notify(LSPMethods.INITIALIZED, {});
    
    return result;
  }

  async request(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      
      this.pendingRequests.set(id, { resolve, reject });
      
      const message = { jsonrpc: '2.0', id, method, params };
      
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      } else {
        reject(new Error('WebSocket not connected'));
      }
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  notify(method, params) {
    const message = { jsonrpc: '2.0', method, params };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

/**
 * LSP Manager
 * Manages multiple language server connections
 */
class LSPManager extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map();
    this.documentVersions = new Map();
    this.diagnosticsCache = new Map();
    this.serverUrls = {
      javascript: 'ws://localhost:3001',
      typescript: 'ws://localhost:3001',
      python: 'ws://localhost:3000',
      java: 'ws://localhost:3002',
      cpp: 'ws://localhost:3003',
      go: 'ws://localhost:3004',
    };
  }

  /**
   * Initialize LSP for a language
   */
  async initialize(language) {
    if (this.connections.has(language)) {
      return this.connections.get(language);
    }

    const serverUrl = this.serverUrls[language];
    if (!serverUrl) {
      console.warn(`No LSP server configured for ${language}`);
      return null;
    }

    const connection = new LSPConnection(language);
    
    // Listen for diagnostics
    connection.on(LSPMethods.PUBLISH_DIAGNOSTICS, (params) => {
      this.diagnosticsCache.set(params.uri, params.diagnostics);
      this.emit('diagnostics', params);
    });

    try {
      await connection.connect(serverUrl);
      this.connections.set(language, connection);
      return connection;
    } catch (error) {
      console.error(`Failed to connect to ${language} LSP:`, error);
      return null;
    }
  }

  /**
   * Document lifecycle methods
   */
  async didOpen(uri, language, content) {
    const connection = await this.initialize(language);
    if (!connection) return;

    this.documentVersions.set(uri, 1);
    
    connection.notify(LSPMethods.DID_OPEN, {
      textDocument: {
        uri,
        languageId: language,
        version: 1,
        text: content,
      },
    });
  }

  async didChange(uri, language, changes) {
    const connection = this.connections.get(language);
    if (!connection) return;

    const version = (this.documentVersions.get(uri) || 0) + 1;
    this.documentVersions.set(uri, version);

    connection.notify(LSPMethods.DID_CHANGE, {
      textDocument: { uri, version },
      contentChanges: changes,
    });
  }

  async didSave(uri, language, content) {
    const connection = this.connections.get(language);
    if (!connection) return;

    connection.notify(LSPMethods.DID_SAVE, {
      textDocument: { uri },
      text: content,
    });
  }

  async didClose(uri, language) {
    const connection = this.connections.get(language);
    if (!connection) return;

    this.documentVersions.delete(uri);
    
    connection.notify(LSPMethods.DID_CLOSE, {
      textDocument: { uri },
    });
  }

  /**
   * Language feature methods
   */
  async getCompletions(uri, language, position) {
    const connection = this.connections.get(language);
    if (!connection) return [];

    try {
      const result = await connection.request(LSPMethods.COMPLETION, {
        textDocument: { uri },
        position,
      });
      
      return Array.isArray(result) ? result : result?.items || [];
    } catch (error) {
      console.error('Completion error:', error);
      return [];
    }
  }

  async getHover(uri, language, position) {
    const connection = this.connections.get(language);
    if (!connection) return null;

    try {
      return await connection.request(LSPMethods.HOVER, {
        textDocument: { uri },
        position,
      });
    } catch (error) {
      console.error('Hover error:', error);
      return null;
    }
  }

  async getSignatureHelp(uri, language, position) {
    const connection = this.connections.get(language);
    if (!connection) return null;

    try {
      return await connection.request(LSPMethods.SIGNATURE_HELP, {
        textDocument: { uri },
        position,
      });
    } catch (error) {
      console.error('Signature help error:', error);
      return null;
    }
  }

  async getDefinition(uri, language, position) {
    const connection = this.connections.get(language);
    if (!connection) return null;

    try {
      return await connection.request(LSPMethods.DEFINITION, {
        textDocument: { uri },
        position,
      });
    } catch (error) {
      console.error('Definition error:', error);
      return null;
    }
  }

  async getTypeDefinition(uri, language, position) {
    const connection = this.connections.get(language);
    if (!connection) return null;

    try {
      return await connection.request(LSPMethods.TYPE_DEFINITION, {
        textDocument: { uri },
        position,
      });
    } catch (error) {
      console.error('Type definition error:', error);
      return null;
    }
  }

  async getImplementation(uri, language, position) {
    const connection = this.connections.get(language);
    if (!connection) return null;

    try {
      return await connection.request(LSPMethods.IMPLEMENTATION, {
        textDocument: { uri },
        position,
      });
    } catch (error) {
      console.error('Implementation error:', error);
      return null;
    }
  }

  async getReferences(uri, language, position, includeDeclaration = true) {
    const connection = this.connections.get(language);
    if (!connection) return [];

    try {
      return await connection.request(LSPMethods.REFERENCES, {
        textDocument: { uri },
        position,
        context: { includeDeclaration },
      });
    } catch (error) {
      console.error('References error:', error);
      return [];
    }
  }

  async getDocumentHighlight(uri, language, position) {
    const connection = this.connections.get(language);
    if (!connection) return [];

    try {
      return await connection.request(LSPMethods.DOCUMENT_HIGHLIGHT, {
        textDocument: { uri },
        position,
      });
    } catch (error) {
      console.error('Document highlight error:', error);
      return [];
    }
  }

  async getDocumentSymbols(uri, language) {
    const connection = this.connections.get(language);
    if (!connection) return [];

    try {
      return await connection.request(LSPMethods.DOCUMENT_SYMBOL, {
        textDocument: { uri },
      });
    } catch (error) {
      console.error('Document symbols error:', error);
      return [];
    }
  }

  async getCodeActions(uri, language, range, diagnostics) {
    const connection = this.connections.get(language);
    if (!connection) return [];

    try {
      return await connection.request(LSPMethods.CODE_ACTION, {
        textDocument: { uri },
        range,
        context: { diagnostics },
      });
    } catch (error) {
      console.error('Code actions error:', error);
      return [];
    }
  }

  async format(uri, language, options = { tabSize: 2, insertSpaces: true }) {
    const connection = this.connections.get(language);
    if (!connection) return [];

    try {
      return await connection.request(LSPMethods.FORMATTING, {
        textDocument: { uri },
        options,
      });
    } catch (error) {
      console.error('Format error:', error);
      return [];
    }
  }

  async formatRange(uri, language, range, options = { tabSize: 2, insertSpaces: true }) {
    const connection = this.connections.get(language);
    if (!connection) return [];

    try {
      return await connection.request(LSPMethods.RANGE_FORMATTING, {
        textDocument: { uri },
        range,
        options,
      });
    } catch (error) {
      console.error('Format range error:', error);
      return [];
    }
  }

  async rename(uri, language, position, newName) {
    const connection = this.connections.get(language);
    if (!connection) return null;

    try {
      return await connection.request(LSPMethods.RENAME, {
        textDocument: { uri },
        position,
        newName,
      });
    } catch (error) {
      console.error('Rename error:', error);
      return null;
    }
  }

  async prepareRename(uri, language, position) {
    const connection = this.connections.get(language);
    if (!connection) return null;

    try {
      return await connection.request(LSPMethods.PREPARE_RENAME, {
        textDocument: { uri },
        position,
      });
    } catch (error) {
      console.error('Prepare rename error:', error);
      return null;
    }
  }

  async getFoldingRanges(uri, language) {
    const connection = this.connections.get(language);
    if (!connection) return [];

    try {
      return await connection.request(LSPMethods.FOLDING_RANGE, {
        textDocument: { uri },
      });
    } catch (error) {
      console.error('Folding ranges error:', error);
      return [];
    }
  }

  async getInlayHints(uri, language, range) {
    const connection = this.connections.get(language);
    if (!connection) return [];

    try {
      return await connection.request(LSPMethods.INLAY_HINT, {
        textDocument: { uri },
        range,
      });
    } catch (error) {
      console.error('Inlay hints error:', error);
      return [];
    }
  }

  /**
   * Get cached diagnostics
   */
  getDiagnostics(uri) {
    return this.diagnosticsCache.get(uri) || [];
  }

  /**
   * Workspace methods
   */
  async getWorkspaceSymbols(query) {
    const results = [];
    
    for (const [language, connection] of this.connections) {
      try {
        const symbols = await connection.request(LSPMethods.WORKSPACE_SYMBOL, { query });
        results.push(...symbols);
      } catch (error) {
        console.error(`Workspace symbols error for ${language}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Shutdown all connections
   */
  shutdown() {
    for (const [language, connection] of this.connections) {
      connection.disconnect();
    }
    this.connections.clear();
    this.documentVersions.clear();
    this.diagnosticsCache.clear();
  }
}

// Singleton instance
export const lspManager = new LSPManager();

export default LSPManager;
