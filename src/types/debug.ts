/**
 * Debug Adapter Protocol Types for VS Code-level debugging
 * Supports: Breakpoints, Watch, Call Stack, Variable Inspection
 */

export enum DebugAdapterType {
    DEBUGPY = 'debugpy',           // Python
    NODE_DEBUG = 'node-debug',     // JavaScript/TypeScript
    CPPDBG = 'cppdbg',             // C/C++
    DELVE = 'delve',               // Go
    JAVA_DEBUG = 'java-debug',     // Java
    LLDB = 'lldb',                 // Rust
}

// Debug Protocol Messages
export interface DebugProtocolMessage {
    seq: number;
    type: 'request' | 'response' | 'event';
}

export interface DebugRequest extends DebugProtocolMessage {
    type: 'request';
    command: string;
    arguments?: unknown;
}

export interface DebugResponse extends DebugProtocolMessage {
    type: 'response';
    request_seq: number;
    success: boolean;
    command: string;
    message?: string;
    body?: unknown;
}

export interface DebugEvent extends DebugProtocolMessage {
    type: 'event';
    event: string;
    body?: unknown;
}

// Capabilities
export interface DebugCapabilities {
    supportsConfigurationDoneRequest?: boolean;
    supportsFunctionBreakpoints?: boolean;
    supportsConditionalBreakpoints?: boolean;
    supportsHitConditionalBreakpoints?: boolean;
    supportsEvaluateForHovers?: boolean;
    exceptionBreakpointFilters?: ExceptionBreakpointsFilter[];
    supportsStepBack?: boolean;
    supportsSetVariable?: boolean;
    supportsRestartFrame?: boolean;
    supportsGotoTargetsRequest?: boolean;
    supportsStepInTargetsRequest?: boolean;
    supportsCompletionsRequest?: boolean;
    supportsModulesRequest?: boolean;
    additionalModuleColumns?: ColumnDescriptor[];
    supportedChecksumAlgorithms?: string[];
    supportsRestartRequest?: boolean;
    supportsExceptionOptions?: boolean;
    supportsValueFormattingOptions?: boolean;
    supportsExceptionInfoRequest?: boolean;
    supportTerminateDebuggee?: boolean;
    supportSuspendDebuggee?: boolean;
    supportsDelayedStackTraceLoading?: boolean;
    supportsLoadedSourcesRequest?: boolean;
    supportsLogPoints?: boolean;
    supportsTerminateThreadsRequest?: boolean;
    supportsSetExpression?: boolean;
    supportsTerminateRequest?: boolean;
    supportsDataBreakpoints?: boolean;
    supportsReadMemoryRequest?: boolean;
    supportsWriteMemoryRequest?: boolean;
    supportsDisassembleRequest?: boolean;
    supportsCancelRequest?: boolean;
    supportsBreakpointLocationsRequest?: boolean;
    supportsClipboardContext?: boolean;
    supportsSteppingGranularity?: boolean;
    supportsInstructionBreakpoints?: boolean;
    supportsExceptionFilterOptions?: boolean;
    supportsSingleThreadExecutionRequests?: boolean;
}

export interface ExceptionBreakpointsFilter {
    filter: string;
    label: string;
    description?: string;
    default?: boolean;
    supportsCondition?: boolean;
    conditionDescription?: string;
}

export interface ColumnDescriptor {
    attributeName: string;
    label: string;
    format?: string;
    type?: 'string' | 'number' | 'boolean' | 'unixTimestampUTC';
    width?: number;
}

// Breakpoints
export interface SourceBreakpoint {
    line: number;
    column?: number;
    condition?: string;
    hitCondition?: string;
    logMessage?: string;
}

export interface Breakpoint {
    id?: number;
    verified: boolean;
    message?: string;
    source?: Source;
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    instructionReference?: string;
    offset?: number;
}

export interface FunctionBreakpoint {
    name: string;
    condition?: string;
    hitCondition?: string;
}

export interface DataBreakpoint {
    dataId: string;
    accessType?: 'read' | 'write' | 'readWrite';
    condition?: string;
    hitCondition?: string;
}

export interface InstructionBreakpoint {
    instructionReference: string;
    offset?: number;
    condition?: string;
    hitCondition?: string;
}

// Source
export interface Source {
    name?: string;
    path?: string;
    sourceReference?: number;
    presentationHint?: 'normal' | 'emphasize' | 'deemphasize';
    origin?: string;
    sources?: Source[];
    adapterData?: unknown;
    checksums?: Checksum[];
}

export interface Checksum {
    algorithm: string;
    checksum: string;
}

// Stack Frames
export interface StackFrame {
    id: number;
    name: string;
    source?: Source;
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
    canRestart?: boolean;
    instructionPointerReference?: string;
    moduleId?: number | string;
    presentationHint?: 'normal' | 'label' | 'subtle';
}

export interface StackTraceResponse {
    stackFrames: StackFrame[];
    totalFrames?: number;
}

// Scopes and Variables
export interface Scope {
    name: string;
    presentationHint?: 'arguments' | 'locals' | 'registers' | string;
    variablesReference: number;
    namedVariables?: number;
    indexedVariables?: number;
    expensive: boolean;
    source?: Source;
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
}

export interface Variable {
    name: string;
    value: string;
    type?: string;
    presentationHint?: VariablePresentationHint;
    evaluateName?: string;
    variablesReference: number;
    namedVariables?: number;
    indexedVariables?: number;
    memoryReference?: string;
}

export interface VariablePresentationHint {
    kind?: 'property' | 'method' | 'class' | 'data' | 'event' | 'baseClass' | 'innerClass' | 'interface' | 'mostDerivedClass' | 'virtual' | 'dataBreakpoint' | string;
    attributes?: ('static' | 'constant' | 'readOnly' | 'rawString' | 'hasObjectId' | 'canHaveObjectId' | 'hasSideEffects' | 'hasDataBreakpoint' | string)[];
    visibility?: 'public' | 'private' | 'protected' | 'internal' | 'final' | string;
    lazy?: boolean;
}

// Threads
export interface Thread {
    id: number;
    name: string;
}

// Modules
export interface Module {
    id: number | string;
    name: string;
    path?: string;
    isOptimized?: boolean;
    isUserCode?: boolean;
    version?: string;
    symbolStatus?: string;
    symbolFilePath?: string;
    dateTimeStamp?: string;
    addressRange?: string;
}

// Exceptions
export interface ExceptionDetails {
    message?: string;
    typeName?: string;
    fullTypeName?: string;
    evaluateName?: string;
    stackTrace?: string;
    innerException?: ExceptionDetails[];
}

export interface ExceptionInfoResponse {
    exceptionId: string;
    description?: string;
    breakMode: 'never' | 'always' | 'unhandled' | 'userUnhandled';
    details?: ExceptionDetails;
}

// Evaluate
export interface EvaluateArguments {
    expression: string;
    frameId?: number;
    context?: 'watch' | 'repl' | 'hover' | 'clipboard' | 'variables' | string;
    format?: ValueFormat;
}

export interface EvaluateResponse {
    result: string;
    type?: string;
    presentationHint?: VariablePresentationHint;
    variablesReference: number;
    namedVariables?: number;
    indexedVariables?: number;
    memoryReference?: string;
}

export interface ValueFormat {
    hex?: boolean;
}

// Watch expressions
export interface WatchExpression {
    id: string;
    expression: string;
    value?: string;
    type?: string;
    variablesReference?: number;
    error?: string;
}

// Completions
export interface CompletionItem {
    label: string;
    text?: string;
    sortText?: string;
    detail?: string;
    type?: 'method' | 'function' | 'constructor' | 'field' | 'variable' | 'class' | 'interface' | 'module' | 'property' | 'unit' | 'value' | 'enum' | 'keyword' | 'snippet' | 'text' | 'color' | 'file' | 'reference' | 'customcolor';
    start?: number;
    length?: number;
    selectionStart?: number;
    selectionLength?: number;
}

// Launch/Attach Configurations
export interface LaunchConfiguration {
    type: string;
    request: 'launch' | 'attach';
    name: string;
    program?: string;
    args?: string[];
    cwd?: string;
    env?: Record<string, string>;
    stopOnEntry?: boolean;
    console?: 'internalConsole' | 'integratedTerminal' | 'externalTerminal';
    
    // Python specific
    justMyCode?: boolean;
    
    // Node specific
    runtimeExecutable?: string;
    runtimeArgs?: string[];
    sourceMaps?: boolean;
    outFiles?: string[];
    
    // C/C++ specific
    MIMode?: 'gdb' | 'lldb';
    miDebuggerPath?: string;
    setupCommands?: SetupCommand[];
    
    // Go specific
    mode?: 'debug' | 'remote' | 'test' | 'exec' | 'replay' | 'core';
    dlvToolPath?: string;
    
    // Java specific
    mainClass?: string;
    classPaths?: string[];
    vmArgs?: string;
    modulePaths?: string[];
}

export interface SetupCommand {
    description?: string;
    text: string;
    ignoreFailures?: boolean;
}

// Debug Session
export interface DebugSession {
    id: string;
    roomId: string;
    userId: string;
    language: string;
    status: 'initializing' | 'running' | 'paused' | 'terminated' | 'error';
    configuration: LaunchConfiguration;
    capabilities?: DebugCapabilities;
    threads: Thread[];
    currentThreadId?: number;
    currentFrameId?: number;
    breakpoints: Map<string, Breakpoint[]>; // uri -> breakpoints
    watchExpressions: WatchExpression[];
    containerId?: string;
    debugAdapterId?: string;
    createdAt: number;
    lastActivity: number;
}

// Events from Debug Adapter
export interface StoppedEvent {
    reason: 'step' | 'breakpoint' | 'exception' | 'pause' | 'entry' | 'goto' | 'function breakpoint' | 'data breakpoint' | 'instruction breakpoint' | string;
    description?: string;
    threadId?: number;
    preserveFocusHint?: boolean;
    text?: string;
    allThreadsStopped?: boolean;
    hitBreakpointIds?: number[];
}

export interface ContinuedEvent {
    threadId: number;
    allThreadsContinued?: boolean;
}

export interface ExitedEvent {
    exitCode: number;
}

export interface TerminatedEvent {
    restart?: unknown;
}

export interface ThreadEvent {
    reason: 'started' | 'exited';
    threadId: number;
}

export interface OutputEvent {
    category?: 'console' | 'important' | 'stdout' | 'stderr' | 'telemetry' | string;
    output: string;
    group?: 'start' | 'startCollapsed' | 'end';
    variablesReference?: number;
    source?: Source;
    line?: number;
    column?: number;
    data?: unknown;
}

export interface BreakpointEvent {
    reason: 'changed' | 'new' | 'removed';
    breakpoint: Breakpoint;
}

export interface ModuleEvent {
    reason: 'new' | 'changed' | 'removed';
    module: Module;
}

export interface LoadedSourceEvent {
    reason: 'new' | 'changed' | 'removed';
    source: Source;
}

export interface ProcessEvent {
    name: string;
    systemProcessId?: number;
    isLocalProcess?: boolean;
    startMethod?: 'launch' | 'attach' | 'attachForSuspendedLaunch';
    pointerSize?: number;
}

export interface ProgressStartEvent {
    progressId: string;
    title: string;
    requestId?: number;
    cancellable?: boolean;
    message?: string;
    percentage?: number;
}

export interface ProgressUpdateEvent {
    progressId: string;
    message?: string;
    percentage?: number;
}

export interface ProgressEndEvent {
    progressId: string;
    message?: string;
}

export interface InvalidatedEvent {
    areas?: ('all' | 'stacks' | 'threads' | 'variables')[];
    threadId?: number;
    stackFrameId?: number;
}

export interface MemoryEvent {
    memoryReference: string;
    offset: number;
    count: number;
}

// Client Request Types
export interface DebugClientRequest {
    id: string;
    roomId: string;
    sessionId: string;
    command: string;
    arguments?: unknown;
}

export interface DebugClientResponse {
    id: string;
    sessionId: string;
    success: boolean;
    command: string;
    message?: string;
    body?: unknown;
    timestamp: number;
}

// Debug Configuration for each language
export interface DebugAdapterConfig {
    type: DebugAdapterType;
    language: string;
    dockerImage: string;
    adapterCommand: string[];
    launchConfig: Partial<LaunchConfiguration>;
    installCommands?: string[];
}
