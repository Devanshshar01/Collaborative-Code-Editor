/**
 * LSP Protocol Types for VS Code-level IDE features
 * Supports: pyright, typescript-ls, clangd, gopls, java-ls, rust-analyzer
 */

export enum LSPLanguage {
    PYTHON = 'python',
    JAVASCRIPT = 'javascript',
    TYPESCRIPT = 'typescript',
    JAVA = 'java',
    CPP = 'cpp',
    C = 'c',
    GO = 'go',
    RUST = 'rust',
    HTML = 'html',
    CSS = 'css'
}

// LSP Message Types
export interface LSPMessage {
    jsonrpc: '2.0';
    id?: number | string;
    method?: string;
    params?: unknown;
    result?: unknown;
    error?: LSPError;
}

export interface LSPError {
    code: number;
    message: string;
    data?: unknown;
}

// Position and Range
export interface Position {
    line: number;
    character: number;
}

export interface Range {
    start: Position;
    end: Position;
}

export interface Location {
    uri: string;
    range: Range;
}

export interface LocationLink {
    originSelectionRange?: Range;
    targetUri: string;
    targetRange: Range;
    targetSelectionRange: Range;
}

// Text Document
export interface TextDocumentIdentifier {
    uri: string;
}

export interface VersionedTextDocumentIdentifier extends TextDocumentIdentifier {
    version: number;
}

export interface TextDocumentItem {
    uri: string;
    languageId: string;
    version: number;
    text: string;
}

export interface TextDocumentContentChangeEvent {
    range?: Range;
    rangeLength?: number;
    text: string;
}

export interface TextEdit {
    range: Range;
    newText: string;
}

// Diagnostics
export enum DiagnosticSeverity {
    Error = 1,
    Warning = 2,
    Information = 3,
    Hint = 4
}

export enum DiagnosticTag {
    Unnecessary = 1,
    Deprecated = 2
}

export interface DiagnosticRelatedInformation {
    location: Location;
    message: string;
}

export interface Diagnostic {
    range: Range;
    severity?: DiagnosticSeverity;
    code?: number | string;
    codeDescription?: { href: string };
    source?: string;
    message: string;
    tags?: DiagnosticTag[];
    relatedInformation?: DiagnosticRelatedInformation[];
    data?: unknown;
}

export interface PublishDiagnosticsParams {
    uri: string;
    version?: number;
    diagnostics: Diagnostic[];
}

// Completion
export enum CompletionItemKind {
    Text = 1,
    Method = 2,
    Function = 3,
    Constructor = 4,
    Field = 5,
    Variable = 6,
    Class = 7,
    Interface = 8,
    Module = 9,
    Property = 10,
    Unit = 11,
    Value = 12,
    Enum = 13,
    Keyword = 14,
    Snippet = 15,
    Color = 16,
    File = 17,
    Reference = 18,
    Folder = 19,
    EnumMember = 20,
    Constant = 21,
    Struct = 22,
    Event = 23,
    Operator = 24,
    TypeParameter = 25
}

export enum CompletionItemTag {
    Deprecated = 1
}

export enum InsertTextFormat {
    PlainText = 1,
    Snippet = 2
}

export interface CompletionItemLabelDetails {
    detail?: string;
    description?: string;
}

export interface CompletionItem {
    label: string;
    labelDetails?: CompletionItemLabelDetails;
    kind?: CompletionItemKind;
    tags?: CompletionItemTag[];
    detail?: string;
    documentation?: string | MarkupContent;
    deprecated?: boolean;
    preselect?: boolean;
    sortText?: string;
    filterText?: string;
    insertText?: string;
    insertTextFormat?: InsertTextFormat;
    insertTextMode?: number;
    textEdit?: TextEdit;
    additionalTextEdits?: TextEdit[];
    commitCharacters?: string[];
    command?: Command;
    data?: unknown;
}

export interface CompletionList {
    isIncomplete: boolean;
    items: CompletionItem[];
}

export interface CompletionParams {
    textDocument: TextDocumentIdentifier;
    position: Position;
    context?: CompletionContext;
}

export interface CompletionContext {
    triggerKind: CompletionTriggerKind;
    triggerCharacter?: string;
}

export enum CompletionTriggerKind {
    Invoked = 1,
    TriggerCharacter = 2,
    TriggerForIncompleteCompletions = 3
}

// Hover
export interface MarkupContent {
    kind: 'plaintext' | 'markdown';
    value: string;
}

export interface Hover {
    contents: MarkupContent | string | string[];
    range?: Range;
}

export interface HoverParams {
    textDocument: TextDocumentIdentifier;
    position: Position;
}

// Definition, Declaration, TypeDefinition, Implementation
export interface DefinitionParams {
    textDocument: TextDocumentIdentifier;
    position: Position;
}

// References
export interface ReferenceParams {
    textDocument: TextDocumentIdentifier;
    position: Position;
    context: ReferenceContext;
}

export interface ReferenceContext {
    includeDeclaration: boolean;
}

// Document Symbols
export enum SymbolKind {
    File = 1,
    Module = 2,
    Namespace = 3,
    Package = 4,
    Class = 5,
    Method = 6,
    Property = 7,
    Field = 8,
    Constructor = 9,
    Enum = 10,
    Interface = 11,
    Function = 12,
    Variable = 13,
    Constant = 14,
    String = 15,
    Number = 16,
    Boolean = 17,
    Array = 18,
    Object = 19,
    Key = 20,
    Null = 21,
    EnumMember = 22,
    Struct = 23,
    Event = 24,
    Operator = 25,
    TypeParameter = 26
}

export enum SymbolTag {
    Deprecated = 1
}

export interface DocumentSymbol {
    name: string;
    detail?: string;
    kind: SymbolKind;
    tags?: SymbolTag[];
    deprecated?: boolean;
    range: Range;
    selectionRange: Range;
    children?: DocumentSymbol[];
}

export interface SymbolInformation {
    name: string;
    kind: SymbolKind;
    tags?: SymbolTag[];
    deprecated?: boolean;
    location: Location;
    containerName?: string;
}

// Code Actions
export enum CodeActionKind {
    Empty = '',
    QuickFix = 'quickfix',
    Refactor = 'refactor',
    RefactorExtract = 'refactor.extract',
    RefactorInline = 'refactor.inline',
    RefactorRewrite = 'refactor.rewrite',
    Source = 'source',
    SourceOrganizeImports = 'source.organizeImports',
    SourceFixAll = 'source.fixAll'
}

export interface CodeActionContext {
    diagnostics: Diagnostic[];
    only?: CodeActionKind[];
    triggerKind?: number;
}

export interface CodeActionParams {
    textDocument: TextDocumentIdentifier;
    range: Range;
    context: CodeActionContext;
}

export interface CodeAction {
    title: string;
    kind?: CodeActionKind;
    diagnostics?: Diagnostic[];
    isPreferred?: boolean;
    disabled?: { reason: string };
    edit?: WorkspaceEdit;
    command?: Command;
    data?: unknown;
}

// Workspace Edit
export interface WorkspaceEdit {
    changes?: { [uri: string]: TextEdit[] };
    documentChanges?: (TextDocumentEdit | CreateFile | RenameFile | DeleteFile)[];
}

export interface TextDocumentEdit {
    textDocument: VersionedTextDocumentIdentifier;
    edits: TextEdit[];
}

export interface CreateFile {
    kind: 'create';
    uri: string;
    options?: { overwrite?: boolean; ignoreIfExists?: boolean };
}

export interface RenameFile {
    kind: 'rename';
    oldUri: string;
    newUri: string;
    options?: { overwrite?: boolean; ignoreIfExists?: boolean };
}

export interface DeleteFile {
    kind: 'delete';
    uri: string;
    options?: { recursive?: boolean; ignoreIfNotExists?: boolean };
}

// Commands
export interface Command {
    title: string;
    command: string;
    arguments?: unknown[];
}

// Formatting
export interface FormattingOptions {
    tabSize: number;
    insertSpaces: boolean;
    trimTrailingWhitespace?: boolean;
    insertFinalNewline?: boolean;
    trimFinalNewlines?: boolean;
}

export interface DocumentFormattingParams {
    textDocument: TextDocumentIdentifier;
    options: FormattingOptions;
}

export interface DocumentRangeFormattingParams {
    textDocument: TextDocumentIdentifier;
    range: Range;
    options: FormattingOptions;
}

// Rename
export interface RenameParams {
    textDocument: TextDocumentIdentifier;
    position: Position;
    newName: string;
}

export interface PrepareRenameResult {
    range: Range;
    placeholder: string;
}

// Signature Help
export interface SignatureHelp {
    signatures: SignatureInformation[];
    activeSignature?: number;
    activeParameter?: number;
}

export interface SignatureInformation {
    label: string;
    documentation?: string | MarkupContent;
    parameters?: ParameterInformation[];
    activeParameter?: number;
}

export interface ParameterInformation {
    label: string | [number, number];
    documentation?: string | MarkupContent;
}

export interface SignatureHelpParams {
    textDocument: TextDocumentIdentifier;
    position: Position;
    context?: SignatureHelpContext;
}

export interface SignatureHelpContext {
    triggerKind: number;
    triggerCharacter?: string;
    isRetrigger: boolean;
    activeSignatureHelp?: SignatureHelp;
}

// Inlay Hints
export enum InlayHintKind {
    Type = 1,
    Parameter = 2
}

export interface InlayHint {
    position: Position;
    label: string | InlayHintLabelPart[];
    kind?: InlayHintKind;
    textEdits?: TextEdit[];
    tooltip?: string | MarkupContent;
    paddingLeft?: boolean;
    paddingRight?: boolean;
    data?: unknown;
}

export interface InlayHintLabelPart {
    value: string;
    tooltip?: string | MarkupContent;
    location?: Location;
    command?: Command;
}

export interface InlayHintParams {
    textDocument: TextDocumentIdentifier;
    range: Range;
}

// Semantic Tokens
export interface SemanticTokensParams {
    textDocument: TextDocumentIdentifier;
}

export interface SemanticTokens {
    resultId?: string;
    data: number[];
}

export interface SemanticTokensLegend {
    tokenTypes: string[];
    tokenModifiers: string[];
}

// Call Hierarchy
export interface CallHierarchyItem {
    name: string;
    kind: SymbolKind;
    tags?: SymbolTag[];
    detail?: string;
    uri: string;
    range: Range;
    selectionRange: Range;
    data?: unknown;
}

export interface CallHierarchyIncomingCall {
    from: CallHierarchyItem;
    fromRanges: Range[];
}

export interface CallHierarchyOutgoingCall {
    to: CallHierarchyItem;
    fromRanges: Range[];
}

// Server Capabilities
export interface ServerCapabilities {
    textDocumentSync?: number | TextDocumentSyncOptions;
    completionProvider?: CompletionOptions;
    hoverProvider?: boolean;
    signatureHelpProvider?: SignatureHelpOptions;
    definitionProvider?: boolean;
    typeDefinitionProvider?: boolean;
    implementationProvider?: boolean;
    referencesProvider?: boolean;
    documentHighlightProvider?: boolean;
    documentSymbolProvider?: boolean;
    workspaceSymbolProvider?: boolean;
    codeActionProvider?: boolean | CodeActionOptions;
    codeLensProvider?: CodeLensOptions;
    documentFormattingProvider?: boolean;
    documentRangeFormattingProvider?: boolean;
    documentOnTypeFormattingProvider?: DocumentOnTypeFormattingOptions;
    renameProvider?: boolean | RenameOptions;
    documentLinkProvider?: DocumentLinkOptions;
    colorProvider?: boolean;
    foldingRangeProvider?: boolean;
    executeCommandProvider?: ExecuteCommandOptions;
    workspace?: WorkspaceCapabilities;
    semanticTokensProvider?: SemanticTokensOptions;
    inlayHintProvider?: boolean;
    callHierarchyProvider?: boolean;
    linkedEditingRangeProvider?: boolean;
}

export interface TextDocumentSyncOptions {
    openClose?: boolean;
    change?: number;
    willSave?: boolean;
    willSaveWaitUntil?: boolean;
    save?: boolean | { includeText?: boolean };
}

export interface CompletionOptions {
    triggerCharacters?: string[];
    allCommitCharacters?: string[];
    resolveProvider?: boolean;
    workDoneProgress?: boolean;
}

export interface SignatureHelpOptions {
    triggerCharacters?: string[];
    retriggerCharacters?: string[];
}

export interface CodeActionOptions {
    codeActionKinds?: CodeActionKind[];
    resolveProvider?: boolean;
}

export interface CodeLensOptions {
    resolveProvider?: boolean;
}

export interface DocumentOnTypeFormattingOptions {
    firstTriggerCharacter: string;
    moreTriggerCharacter?: string[];
}

export interface RenameOptions {
    prepareProvider?: boolean;
}

export interface DocumentLinkOptions {
    resolveProvider?: boolean;
}

export interface ExecuteCommandOptions {
    commands: string[];
}

export interface WorkspaceCapabilities {
    workspaceFolders?: { supported?: boolean; changeNotifications?: boolean | string };
    fileOperations?: {
        didCreate?: FileOperationRegistrationOptions;
        willCreate?: FileOperationRegistrationOptions;
        didRename?: FileOperationRegistrationOptions;
        willRename?: FileOperationRegistrationOptions;
        didDelete?: FileOperationRegistrationOptions;
        willDelete?: FileOperationRegistrationOptions;
    };
}

export interface FileOperationRegistrationOptions {
    filters: FileOperationFilter[];
}

export interface FileOperationFilter {
    scheme?: string;
    pattern: FileOperationPattern;
}

export interface FileOperationPattern {
    glob: string;
    matches?: 'file' | 'folder';
}

export interface SemanticTokensOptions {
    legend: SemanticTokensLegend;
    range?: boolean;
    full?: boolean | { delta?: boolean };
}

// Initialize params
export interface InitializeParams {
    processId: number | null;
    clientInfo?: { name: string; version?: string };
    locale?: string;
    rootPath?: string | null;
    rootUri: string | null;
    capabilities: ClientCapabilities;
    initializationOptions?: unknown;
    trace?: 'off' | 'messages' | 'verbose';
    workspaceFolders?: WorkspaceFolder[] | null;
}

export interface WorkspaceFolder {
    uri: string;
    name: string;
}

export interface ClientCapabilities {
    workspace?: {
        applyEdit?: boolean;
        workspaceEdit?: { documentChanges?: boolean };
        didChangeConfiguration?: { dynamicRegistration?: boolean };
        didChangeWatchedFiles?: { dynamicRegistration?: boolean };
        symbol?: { dynamicRegistration?: boolean };
        executeCommand?: { dynamicRegistration?: boolean };
        workspaceFolders?: boolean;
        configuration?: boolean;
        semanticTokens?: { refreshSupport?: boolean };
        codeLens?: { refreshSupport?: boolean };
        inlayHint?: { refreshSupport?: boolean };
    };
    textDocument?: {
        synchronization?: {
            dynamicRegistration?: boolean;
            willSave?: boolean;
            willSaveWaitUntil?: boolean;
            didSave?: boolean;
        };
        completion?: {
            dynamicRegistration?: boolean;
            completionItem?: {
                snippetSupport?: boolean;
                commitCharactersSupport?: boolean;
                documentationFormat?: string[];
                deprecatedSupport?: boolean;
                preselectSupport?: boolean;
                tagSupport?: { valueSet?: number[] };
                insertReplaceSupport?: boolean;
                resolveSupport?: { properties?: string[] };
                insertTextModeSupport?: { valueSet?: number[] };
                labelDetailsSupport?: boolean;
            };
            completionItemKind?: { valueSet?: number[] };
            contextSupport?: boolean;
            insertTextMode?: number;
        };
        hover?: {
            dynamicRegistration?: boolean;
            contentFormat?: string[];
        };
        signatureHelp?: {
            dynamicRegistration?: boolean;
            signatureInformation?: {
                documentationFormat?: string[];
                parameterInformation?: { labelOffsetSupport?: boolean };
                activeParameterSupport?: boolean;
            };
            contextSupport?: boolean;
        };
        declaration?: { dynamicRegistration?: boolean; linkSupport?: boolean };
        definition?: { dynamicRegistration?: boolean; linkSupport?: boolean };
        typeDefinition?: { dynamicRegistration?: boolean; linkSupport?: boolean };
        implementation?: { dynamicRegistration?: boolean; linkSupport?: boolean };
        references?: { dynamicRegistration?: boolean };
        documentHighlight?: { dynamicRegistration?: boolean };
        documentSymbol?: {
            dynamicRegistration?: boolean;
            symbolKind?: { valueSet?: number[] };
            hierarchicalDocumentSymbolSupport?: boolean;
            tagSupport?: { valueSet?: number[] };
            labelSupport?: boolean;
        };
        codeAction?: {
            dynamicRegistration?: boolean;
            codeActionLiteralSupport?: {
                codeActionKind?: { valueSet?: string[] };
            };
            isPreferredSupport?: boolean;
            disabledSupport?: boolean;
            dataSupport?: boolean;
            resolveSupport?: { properties?: string[] };
            honorsChangeAnnotations?: boolean;
        };
        codeLens?: { dynamicRegistration?: boolean };
        documentLink?: { dynamicRegistration?: boolean; tooltipSupport?: boolean };
        colorProvider?: { dynamicRegistration?: boolean };
        formatting?: { dynamicRegistration?: boolean };
        rangeFormatting?: { dynamicRegistration?: boolean };
        onTypeFormatting?: { dynamicRegistration?: boolean };
        rename?: {
            dynamicRegistration?: boolean;
            prepareSupport?: boolean;
            prepareSupportDefaultBehavior?: number;
            honorsChangeAnnotations?: boolean;
        };
        publishDiagnostics?: {
            relatedInformation?: boolean;
            tagSupport?: { valueSet?: number[] };
            versionSupport?: boolean;
            codeDescriptionSupport?: boolean;
            dataSupport?: boolean;
        };
        foldingRange?: {
            dynamicRegistration?: boolean;
            rangeLimit?: number;
            lineFoldingOnly?: boolean;
            foldingRangeKind?: { valueSet?: string[] };
            foldingRange?: { collapsedText?: boolean };
        };
        selectionRange?: { dynamicRegistration?: boolean };
        linkedEditingRange?: { dynamicRegistration?: boolean };
        callHierarchy?: { dynamicRegistration?: boolean };
        semanticTokens?: {
            dynamicRegistration?: boolean;
            tokenTypes?: string[];
            tokenModifiers?: string[];
            formats?: string[];
            requests?: { range?: boolean; full?: boolean | { delta?: boolean } };
            multilineTokenSupport?: boolean;
            overlappingTokenSupport?: boolean;
        };
        moniker?: { dynamicRegistration?: boolean };
        inlayHint?: {
            dynamicRegistration?: boolean;
            resolveSupport?: { properties?: string[] };
        };
        diagnostic?: { dynamicRegistration?: boolean; relatedDocumentSupport?: boolean };
    };
    window?: {
        showMessage?: { messageActionItem?: { additionalPropertiesSupport?: boolean } };
        showDocument?: { support?: boolean };
        workDoneProgress?: boolean;
    };
    general?: {
        staleRequestSupport?: {
            cancel?: boolean;
            retryOnContentModified?: string[];
        };
        regularExpressions?: { engine?: string; version?: string };
        markdown?: { parser?: string; version?: string };
        positionEncodings?: string[];
    };
}

export interface InitializeResult {
    capabilities: ServerCapabilities;
    serverInfo?: { name: string; version?: string };
}

// LSP Client Request/Response interfaces for WebSocket communication
export interface LSPClientRequest {
    id: string;
    roomId: string;
    fileUri: string;
    language: LSPLanguage;
    method: string;
    params: unknown;
}

export interface LSPClientResponse {
    id: string;
    result?: unknown;
    error?: LSPError;
    timestamp: number;
}

// LSP Server Instance
export interface LSPServerInstance {
    language: LSPLanguage;
    containerId: string;
    port: number;
    status: 'starting' | 'ready' | 'error' | 'stopped';
    capabilities?: ServerCapabilities;
    lastActivity: number;
}

// Language Server Configuration
export interface LanguageServerConfig {
    language: LSPLanguage;
    serverCommand: string[];
    serverArgs?: string[];
    initializationOptions?: unknown;
    documentSelector: string[];
    triggerCharacters?: string[];
    signatureTriggerCharacters?: string[];
    dockerImage: string;
    installCommands?: string[];
    healthCheckCommand?: string;
    rootPath?: string;
}
