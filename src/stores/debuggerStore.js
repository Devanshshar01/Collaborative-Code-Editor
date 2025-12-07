/**
 * Debugger Store - Zustand store for debugger state management
 * Manages breakpoints, call stack, variables, watch expressions
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';

// ============ Types ============

export const DebuggerState = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    STEPPING: 'stepping',
    STOPPED: 'stopped',
    ERROR: 'error',
};

export const BreakpointType = {
    LINE: 'line',
    CONDITIONAL: 'conditional',
    LOGPOINT: 'logpoint',
    EXCEPTION: 'exception',
    FUNCTION: 'function',
};

export const BreakpointState = {
    ENABLED: 'enabled',
    DISABLED: 'disabled',
    UNVERIFIED: 'unverified',
};

export const VariableScope = {
    LOCAL: 'local',
    CLOSURE: 'closure',
    GLOBAL: 'global',
    ARGUMENTS: 'arguments',
};

export const StepAction = {
    CONTINUE: 'continue',
    STEP_OVER: 'stepOver',
    STEP_INTO: 'stepInto',
    STEP_OUT: 'stepOut',
    RESTART: 'restart',
    STOP: 'stop',
    PAUSE: 'pause',
};

// ============ Factory Functions ============

const createBreakpoint = (filePath, line, options = {}) => ({
    id: nanoid(),
    filePath,
    line,
    column: options.column || 0,
    type: options.type || BreakpointType.LINE,
    state: BreakpointState.ENABLED,
    condition: options.condition || null,
    hitCount: options.hitCount || null,
    logMessage: options.logMessage || null,
    hitCondition: options.hitCondition || null,
    verified: false,
    hits: 0,
});

const createWatchExpression = (expression) => ({
    id: nanoid(),
    expression,
    value: null,
    type: null,
    error: null,
    isExpanded: false,
});

// ============ Store ============

export const useDebuggerStore = create(
    subscribeWithSelector((set, get) => ({
        // ============ State ============
        
        // Debugger session state
        state: DebuggerState.IDLE,
        sessionId: null,
        language: null,
        
        // Execution context
        currentFilePath: null,
        currentLine: null,
        currentColumn: null,
        currentFunction: null,
        
        // Call stack
        callStack: [],
        selectedFrameIndex: 0,
        
        // Variables
        localVariables: [],
        closureVariables: [],
        globalVariables: [],
        
        // Breakpoints
        breakpoints: [],
        exceptionBreakpoints: {
            caught: false,
            uncaught: true,
        },
        
        // Watch expressions
        watchExpressions: [],
        
        // Output/Console
        debugConsole: [],
        maxConsoleLines: 1000,
        
        // Socket connection
        socket: null,
        isConnected: false,
        
        // Panel state
        isPanelOpen: false,
        activeTab: 'variables', // 'variables' | 'watch' | 'callstack' | 'breakpoints' | 'console'
        
        // Configuration
        config: {
            stopOnEntry: false,
            justMyCode: true,
            skipFiles: [],
            sourceMaps: true,
        },
        
        // ============ Session Management ============
        
        startDebugging: (filePath, language, options = {}) => {
            const sessionId = nanoid();
            const { socket } = get();
            
            set({
                state: DebuggerState.RUNNING,
                sessionId,
                currentFilePath: filePath,
                language,
                callStack: [],
                localVariables: [],
                debugConsole: [],
            });
            
            if (socket) {
                socket.emit('debug:start', {
                    sessionId,
                    filePath,
                    language,
                    breakpoints: get().breakpoints.filter(bp => bp.state === BreakpointState.ENABLED),
                    config: { ...get().config, ...options },
                });
            }
            
            return sessionId;
        },
        
        stopDebugging: () => {
            const { socket, sessionId } = get();
            
            if (socket && sessionId) {
                socket.emit('debug:stop', { sessionId });
            }
            
            set({
                state: DebuggerState.STOPPED,
                sessionId: null,
                currentLine: null,
                currentColumn: null,
                currentFunction: null,
                callStack: [],
                localVariables: [],
                closureVariables: [],
            });
        },
        
        restartDebugging: () => {
            const { currentFilePath, language, socket, sessionId } = get();
            
            if (socket && sessionId) {
                socket.emit('debug:restart', { sessionId });
            } else if (currentFilePath && language) {
                get().startDebugging(currentFilePath, language);
            }
        },
        
        // ============ Execution Control ============
        
        continue: () => {
            const { socket, sessionId, state } = get();
            if (state !== DebuggerState.PAUSED) return;
            
            set({ state: DebuggerState.RUNNING });
            
            if (socket) {
                socket.emit('debug:action', { 
                    sessionId, 
                    action: StepAction.CONTINUE 
                });
            }
        },
        
        stepOver: () => {
            const { socket, sessionId, state } = get();
            if (state !== DebuggerState.PAUSED) return;
            
            set({ state: DebuggerState.STEPPING });
            
            if (socket) {
                socket.emit('debug:action', { 
                    sessionId, 
                    action: StepAction.STEP_OVER 
                });
            }
        },
        
        stepInto: () => {
            const { socket, sessionId, state } = get();
            if (state !== DebuggerState.PAUSED) return;
            
            set({ state: DebuggerState.STEPPING });
            
            if (socket) {
                socket.emit('debug:action', { 
                    sessionId, 
                    action: StepAction.STEP_INTO 
                });
            }
        },
        
        stepOut: () => {
            const { socket, sessionId, state } = get();
            if (state !== DebuggerState.PAUSED) return;
            
            set({ state: DebuggerState.STEPPING });
            
            if (socket) {
                socket.emit('debug:action', { 
                    sessionId, 
                    action: StepAction.STEP_OUT 
                });
            }
        },
        
        pause: () => {
            const { socket, sessionId, state } = get();
            if (state !== DebuggerState.RUNNING) return;
            
            if (socket) {
                socket.emit('debug:action', { 
                    sessionId, 
                    action: StepAction.PAUSE 
                });
            }
        },
        
        // ============ Breakpoints ============
        
        addBreakpoint: (filePath, line, options = {}) => {
            const breakpoint = createBreakpoint(filePath, line, options);
            
            set(state => ({
                breakpoints: [...state.breakpoints, breakpoint],
            }));
            
            // Sync to debug session if active
            const { socket, sessionId } = get();
            if (socket && sessionId) {
                socket.emit('debug:breakpoint:add', {
                    sessionId,
                    breakpoint,
                });
            }
            
            return breakpoint.id;
        },
        
        removeBreakpoint: (id) => {
            const breakpoint = get().breakpoints.find(bp => bp.id === id);
            
            set(state => ({
                breakpoints: state.breakpoints.filter(bp => bp.id !== id),
            }));
            
            const { socket, sessionId } = get();
            if (socket && sessionId && breakpoint) {
                socket.emit('debug:breakpoint:remove', {
                    sessionId,
                    breakpointId: id,
                });
            }
        },
        
        toggleBreakpoint: (filePath, line) => {
            const existing = get().breakpoints.find(
                bp => bp.filePath === filePath && bp.line === line
            );
            
            if (existing) {
                get().removeBreakpoint(existing.id);
            } else {
                get().addBreakpoint(filePath, line);
            }
        },
        
        enableBreakpoint: (id) => {
            set(state => ({
                breakpoints: state.breakpoints.map(bp =>
                    bp.id === id ? { ...bp, state: BreakpointState.ENABLED } : bp
                ),
            }));
        },
        
        disableBreakpoint: (id) => {
            set(state => ({
                breakpoints: state.breakpoints.map(bp =>
                    bp.id === id ? { ...bp, state: BreakpointState.DISABLED } : bp
                ),
            }));
        },
        
        updateBreakpoint: (id, updates) => {
            set(state => ({
                breakpoints: state.breakpoints.map(bp =>
                    bp.id === id ? { ...bp, ...updates } : bp
                ),
            }));
        },
        
        clearAllBreakpoints: () => {
            const { socket, sessionId } = get();
            
            if (socket && sessionId) {
                socket.emit('debug:breakpoint:clearAll', { sessionId });
            }
            
            set({ breakpoints: [] });
        },
        
        getBreakpointsForFile: (filePath) => {
            return get().breakpoints.filter(bp => bp.filePath === filePath);
        },
        
        setExceptionBreakpoints: (caught, uncaught) => {
            set({
                exceptionBreakpoints: { caught, uncaught },
            });
            
            const { socket, sessionId } = get();
            if (socket && sessionId) {
                socket.emit('debug:exceptionBreakpoints', {
                    sessionId,
                    caught,
                    uncaught,
                });
            }
        },
        
        // ============ Call Stack ============
        
        setCallStack: (frames) => {
            set({
                callStack: frames,
                selectedFrameIndex: 0,
            });
            
            if (frames.length > 0) {
                set({
                    currentFilePath: frames[0].filePath,
                    currentLine: frames[0].line,
                    currentColumn: frames[0].column,
                    currentFunction: frames[0].functionName,
                });
            }
        },
        
        selectStackFrame: (index) => {
            const { callStack, socket, sessionId } = get();
            const frame = callStack[index];
            
            if (!frame) return;
            
            set({
                selectedFrameIndex: index,
                currentFilePath: frame.filePath,
                currentLine: frame.line,
                currentColumn: frame.column,
                currentFunction: frame.functionName,
            });
            
            // Request variables for this frame
            if (socket && sessionId) {
                socket.emit('debug:getVariables', {
                    sessionId,
                    frameId: frame.id,
                });
            }
        },
        
        // ============ Variables ============
        
        setVariables: (scope, variables) => {
            switch (scope) {
                case VariableScope.LOCAL:
                    set({ localVariables: variables });
                    break;
                case VariableScope.CLOSURE:
                    set({ closureVariables: variables });
                    break;
                case VariableScope.GLOBAL:
                    set({ globalVariables: variables });
                    break;
            }
        },
        
        expandVariable: (scope, variableId) => {
            const { socket, sessionId } = get();
            
            if (socket && sessionId) {
                socket.emit('debug:expandVariable', {
                    sessionId,
                    scope,
                    variableId,
                });
            }
        },
        
        // ============ Watch Expressions ============
        
        addWatchExpression: (expression) => {
            const watch = createWatchExpression(expression);
            
            set(state => ({
                watchExpressions: [...state.watchExpressions, watch],
            }));
            
            // Evaluate immediately if in debug session
            const { socket, sessionId, state: debugState } = get();
            if (socket && sessionId && debugState === DebuggerState.PAUSED) {
                socket.emit('debug:evaluate', {
                    sessionId,
                    watchId: watch.id,
                    expression,
                });
            }
            
            return watch.id;
        },
        
        removeWatchExpression: (id) => {
            set(state => ({
                watchExpressions: state.watchExpressions.filter(w => w.id !== id),
            }));
        },
        
        updateWatchExpression: (id, expression) => {
            set(state => ({
                watchExpressions: state.watchExpressions.map(w =>
                    w.id === id ? { ...w, expression, value: null, error: null } : w
                ),
            }));
            
            // Re-evaluate
            const { socket, sessionId, state: debugState } = get();
            if (socket && sessionId && debugState === DebuggerState.PAUSED) {
                socket.emit('debug:evaluate', {
                    sessionId,
                    watchId: id,
                    expression,
                });
            }
        },
        
        setWatchValue: (id, value, type, error) => {
            set(state => ({
                watchExpressions: state.watchExpressions.map(w =>
                    w.id === id ? { ...w, value, type, error } : w
                ),
            }));
        },
        
        refreshWatchExpressions: () => {
            const { socket, sessionId, watchExpressions, state: debugState } = get();
            
            if (socket && sessionId && debugState === DebuggerState.PAUSED) {
                watchExpressions.forEach(watch => {
                    socket.emit('debug:evaluate', {
                        sessionId,
                        watchId: watch.id,
                        expression: watch.expression,
                    });
                });
            }
        },
        
        // ============ Debug Console ============
        
        addConsoleOutput: (type, message, data) => {
            set(state => {
                const newConsole = [
                    ...state.debugConsole,
                    {
                        id: nanoid(),
                        type, // 'log' | 'warn' | 'error' | 'info' | 'output' | 'input'
                        message,
                        data,
                        timestamp: Date.now(),
                    },
                ];
                
                // Limit console lines
                if (newConsole.length > state.maxConsoleLines) {
                    newConsole.shift();
                }
                
                return { debugConsole: newConsole };
            });
        },
        
        clearConsole: () => set({ debugConsole: [] }),
        
        evaluateInConsole: (expression) => {
            const { socket, sessionId, state: debugState } = get();
            
            get().addConsoleOutput('input', expression);
            
            if (socket && sessionId && debugState === DebuggerState.PAUSED) {
                socket.emit('debug:evaluate', {
                    sessionId,
                    expression,
                    context: 'console',
                });
            }
        },
        
        // ============ Socket Connection ============
        
        setSocket: (socket) => {
            set({ socket, isConnected: !!socket });
            
            if (socket) {
                // Set up socket listeners
                socket.on('debug:paused', (data) => {
                    set({
                        state: DebuggerState.PAUSED,
                        currentFilePath: data.filePath,
                        currentLine: data.line,
                        currentColumn: data.column,
                        currentFunction: data.functionName,
                    });
                    
                    if (data.callStack) {
                        get().setCallStack(data.callStack);
                    }
                    
                    if (data.variables) {
                        get().setVariables(VariableScope.LOCAL, data.variables.local || []);
                        get().setVariables(VariableScope.CLOSURE, data.variables.closure || []);
                    }
                    
                    get().refreshWatchExpressions();
                });
                
                socket.on('debug:resumed', () => {
                    set({ state: DebuggerState.RUNNING });
                });
                
                socket.on('debug:stopped', (data) => {
                    set({
                        state: DebuggerState.STOPPED,
                        sessionId: null,
                    });
                    
                    if (data.exitCode !== undefined) {
                        get().addConsoleOutput('info', `Process exited with code ${data.exitCode}`);
                    }
                });
                
                socket.on('debug:output', (data) => {
                    get().addConsoleOutput(data.category || 'output', data.output);
                });
                
                socket.on('debug:variables', (data) => {
                    get().setVariables(data.scope, data.variables);
                });
                
                socket.on('debug:evaluated', (data) => {
                    if (data.watchId) {
                        get().setWatchValue(data.watchId, data.result, data.type, data.error);
                    } else if (data.context === 'console') {
                        get().addConsoleOutput(
                            data.error ? 'error' : 'output',
                            data.error || data.result
                        );
                    }
                });
                
                socket.on('debug:breakpointVerified', (data) => {
                    get().updateBreakpoint(data.id, { verified: data.verified });
                });
                
                socket.on('debug:breakpointHit', (data) => {
                    const bp = get().breakpoints.find(b => b.id === data.id);
                    if (bp) {
                        get().updateBreakpoint(data.id, { hits: bp.hits + 1 });
                    }
                });
                
                socket.on('debug:error', (data) => {
                    set({ state: DebuggerState.ERROR });
                    get().addConsoleOutput('error', data.message);
                });
            }
        },
        
        disconnectSocket: () => {
            const { socket } = get();
            if (socket) {
                socket.off('debug:paused');
                socket.off('debug:resumed');
                socket.off('debug:stopped');
                socket.off('debug:output');
                socket.off('debug:variables');
                socket.off('debug:evaluated');
                socket.off('debug:breakpointVerified');
                socket.off('debug:breakpointHit');
                socket.off('debug:error');
            }
            set({ socket: null, isConnected: false });
        },
        
        // ============ Panel State ============
        
        togglePanel: () => set(state => ({ isPanelOpen: !state.isPanelOpen })),
        openPanel: () => set({ isPanelOpen: true }),
        closePanel: () => set({ isPanelOpen: false }),
        setActiveTab: (tab) => set({ activeTab: tab }),
        
        // ============ Helpers ============
        
        isDebugging: () => {
            const state = get().state;
            return state === DebuggerState.RUNNING || 
                   state === DebuggerState.PAUSED || 
                   state === DebuggerState.STEPPING;
        },
        
        isPaused: () => get().state === DebuggerState.PAUSED,
        isRunning: () => get().state === DebuggerState.RUNNING,
    }))
);

// ============ Selector Hooks ============

export const useDebuggerState = () => useDebuggerStore(state => state.state);
export const useBreakpoints = () => useDebuggerStore(state => state.breakpoints);
export const useCallStack = () => useDebuggerStore(state => state.callStack);
export const useLocalVariables = () => useDebuggerStore(state => state.localVariables);
export const useWatchExpressions = () => useDebuggerStore(state => state.watchExpressions);
export const useDebugConsole = () => useDebuggerStore(state => state.debugConsole);
export const useCurrentLocation = () => useDebuggerStore(state => ({
    filePath: state.currentFilePath,
    line: state.currentLine,
    column: state.currentColumn,
    function: state.currentFunction,
}));

export default useDebuggerStore;
