/**
 * EnhancedDebugger - Main debugger panel with controls, variables, call stack
 * Provides a full debugging experience with stepping, breakpoints, and inspection
 */

import React, { useState, useCallback, memo, useEffect } from 'react';
import useDebuggerStore, {
    DebuggerState,
    BreakpointState,
    BreakpointType,
    VariableScope,
} from '../../stores/debuggerStore';

// ============ Icons ============

const Icons = {
    play: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2l10 6-10 6V2z"/>
        </svg>
    ),
    pause: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="2" width="4" height="12"/>
            <rect x="9" y="2" width="4" height="12"/>
        </svg>
    ),
    stop: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="10" height="10"/>
        </svg>
    ),
    stepOver: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <circle cx="8" cy="12" r="2" fill="currentColor"/>
        </svg>
    ),
    stepInto: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2v10M4 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
    ),
    stepOut: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 14V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
    ),
    restart: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 8a5 5 0 019.54-2M13 8a5 5 0 01-9.54 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M12.5 2v4h-4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
    ),
    breakpoint: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="6" fill="#e51400"/>
        </svg>
    ),
    breakpointDisabled: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="5" fill="none" stroke="#808080" strokeWidth="2"/>
        </svg>
    ),
    conditional: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="6" fill="#e51400"/>
            <text x="8" y="11" fontSize="8" fill="white" textAnchor="middle">?</text>
        </svg>
    ),
    logpoint: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 8l3 3 7-7" stroke="#e51400" strokeWidth="2" fill="none"/>
        </svg>
    ),
    expand: (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 4l4 4-4 4"/>
        </svg>
    ),
    collapse: (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6l4 4 4-4"/>
        </svg>
    ),
};

// ============ Debug Controls Toolbar ============

const DebugControls = memo(() => {
    const {
        state,
        continue: continueExec,
        stepOver,
        stepInto,
        stepOut,
        pause,
        stopDebugging,
        restartDebugging,
    } = useDebuggerStore();
    
    const isActive = state === DebuggerState.RUNNING || 
                     state === DebuggerState.PAUSED ||
                     state === DebuggerState.STEPPING;
    
    const isPaused = state === DebuggerState.PAUSED;
    const isRunning = state === DebuggerState.RUNNING;
    
    return (
        <div className="debug-controls">
            {/* Continue/Pause */}
            {isActive && (
                <button
                    className="debug-btn"
                    onClick={isPaused ? continueExec : pause}
                    title={isPaused ? "Continue (F5)" : "Pause (F6)"}
                    disabled={!isActive}
                >
                    {isPaused ? Icons.play : Icons.pause}
                </button>
            )}
            
            {/* Step Over */}
            <button
                className="debug-btn"
                onClick={stepOver}
                title="Step Over (F10)"
                disabled={!isPaused}
            >
                {Icons.stepOver}
            </button>
            
            {/* Step Into */}
            <button
                className="debug-btn"
                onClick={stepInto}
                title="Step Into (F11)"
                disabled={!isPaused}
            >
                {Icons.stepInto}
            </button>
            
            {/* Step Out */}
            <button
                className="debug-btn"
                onClick={stepOut}
                title="Step Out (Shift+F11)"
                disabled={!isPaused}
            >
                {Icons.stepOut}
            </button>
            
            {/* Restart */}
            <button
                className="debug-btn"
                onClick={restartDebugging}
                title="Restart (Ctrl+Shift+F5)"
                disabled={!isActive}
            >
                {Icons.restart}
            </button>
            
            {/* Stop */}
            <button
                className="debug-btn debug-btn-stop"
                onClick={stopDebugging}
                title="Stop (Shift+F5)"
                disabled={!isActive}
            >
                {Icons.stop}
            </button>
        </div>
    );
});

DebugControls.displayName = 'DebugControls';

// ============ Variable Item Component ============

const VariableItem = memo(({ variable, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { expandVariable } = useDebuggerStore();
    
    const hasChildren = variable.hasChildren || 
                        (typeof variable.value === 'object' && variable.value !== null);
    
    const handleExpand = () => {
        if (!isExpanded && hasChildren && !variable.children) {
            expandVariable(variable.scope, variable.id);
        }
        setIsExpanded(!isExpanded);
    };
    
    const formatValue = (val, type) => {
        if (val === undefined) return 'undefined';
        if (val === null) return 'null';
        if (type === 'string') return `"${val}"`;
        if (type === 'function') return 'ƒ ()';
        if (typeof val === 'object') {
            if (Array.isArray(val)) return `Array(${val.length})`;
            return `{...}`;
        }
        return String(val);
    };
    
    const getTypeColor = (type) => {
        switch (type) {
            case 'string': return '#ce9178';
            case 'number': return '#b5cea8';
            case 'boolean': return '#569cd6';
            case 'undefined':
            case 'null': return '#808080';
            case 'function': return '#dcdcaa';
            case 'object': return '#4ec9b0';
            default: return '#d4d4d4';
        }
    };
    
    return (
        <div className="variable-item" style={{ paddingLeft: depth * 16 }}>
            <div className="variable-row" onClick={handleExpand}>
                {hasChildren && (
                    <span className="variable-expand">
                        {isExpanded ? Icons.collapse : Icons.expand}
                    </span>
                )}
                {!hasChildren && <span className="variable-expand-placeholder" />}
                
                <span className="variable-name">{variable.name}</span>
                <span className="variable-separator">: </span>
                <span 
                    className="variable-value"
                    style={{ color: getTypeColor(variable.type) }}
                >
                    {formatValue(variable.value, variable.type)}
                </span>
            </div>
            
            {isExpanded && variable.children && (
                <div className="variable-children">
                    {variable.children.map(child => (
                        <VariableItem 
                            key={child.id} 
                            variable={child} 
                            depth={depth + 1} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

VariableItem.displayName = 'VariableItem';

// ============ Variables Panel ============

const VariablesPanel = memo(() => {
    const { localVariables, closureVariables, globalVariables, state } = useDebuggerStore();
    const [expandedScopes, setExpandedScopes] = useState({
        local: true,
        closure: true,
        global: false,
    });
    
    const toggleScope = (scope) => {
        setExpandedScopes(prev => ({ ...prev, [scope]: !prev[scope] }));
    };
    
    if (state !== DebuggerState.PAUSED) {
        return (
            <div className="panel-empty">
                {state === DebuggerState.RUNNING ? (
                    <span>Program is running...</span>
                ) : (
                    <span>Not paused</span>
                )}
            </div>
        );
    }
    
    return (
        <div className="variables-panel">
            {/* Local Variables */}
            <div className="scope-section">
                <div 
                    className="scope-header"
                    onClick={() => toggleScope('local')}
                >
                    <span className="scope-expand">
                        {expandedScopes.local ? Icons.collapse : Icons.expand}
                    </span>
                    <span>Local</span>
                    <span className="scope-count">{localVariables.length}</span>
                </div>
                {expandedScopes.local && (
                    <div className="scope-variables">
                        {localVariables.length > 0 ? (
                            localVariables.map(v => (
                                <VariableItem key={v.id} variable={v} />
                            ))
                        ) : (
                            <span className="scope-empty">No local variables</span>
                        )}
                    </div>
                )}
            </div>
            
            {/* Closure Variables */}
            {closureVariables.length > 0 && (
                <div className="scope-section">
                    <div 
                        className="scope-header"
                        onClick={() => toggleScope('closure')}
                    >
                        <span className="scope-expand">
                            {expandedScopes.closure ? Icons.collapse : Icons.expand}
                        </span>
                        <span>Closure</span>
                        <span className="scope-count">{closureVariables.length}</span>
                    </div>
                    {expandedScopes.closure && (
                        <div className="scope-variables">
                            {closureVariables.map(v => (
                                <VariableItem key={v.id} variable={v} />
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {/* Global Variables */}
            <div className="scope-section">
                <div 
                    className="scope-header"
                    onClick={() => toggleScope('global')}
                >
                    <span className="scope-expand">
                        {expandedScopes.global ? Icons.collapse : Icons.expand}
                    </span>
                    <span>Global</span>
                </div>
                {expandedScopes.global && (
                    <div className="scope-variables">
                        {globalVariables.length > 0 ? (
                            globalVariables.map(v => (
                                <VariableItem key={v.id} variable={v} />
                            ))
                        ) : (
                            <span className="scope-empty">Loading global variables...</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

VariablesPanel.displayName = 'VariablesPanel';

// ============ Watch Panel ============

const WatchPanel = memo(() => {
    const { watchExpressions, addWatchExpression, removeWatchExpression, updateWatchExpression } = useDebuggerStore();
    const [newExpression, setNewExpression] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    
    const handleAdd = () => {
        if (newExpression.trim()) {
            addWatchExpression(newExpression.trim());
            setNewExpression('');
        }
    };
    
    const handleEdit = (id, expression) => {
        setEditingId(id);
        setEditValue(expression);
    };
    
    const handleEditSubmit = (id) => {
        if (editValue.trim()) {
            updateWatchExpression(id, editValue.trim());
        }
        setEditingId(null);
        setEditValue('');
    };
    
    const getValueDisplay = (watch) => {
        if (watch.error) return <span className="watch-error">{watch.error}</span>;
        if (watch.value === undefined) return <span className="watch-pending">evaluating...</span>;
        return <span className="watch-value">{JSON.stringify(watch.value)}</span>;
    };
    
    return (
        <div className="watch-panel">
            {watchExpressions.map(watch => (
                <div key={watch.id} className="watch-item">
                    {editingId === watch.id ? (
                        <input
                            className="watch-edit-input"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleEditSubmit(watch.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit(watch.id)}
                            autoFocus
                        />
                    ) : (
                        <>
                            <span 
                                className="watch-expression"
                                onDoubleClick={() => handleEdit(watch.id, watch.expression)}
                            >
                                {watch.expression}
                            </span>
                            <span className="watch-separator">: </span>
                            {getValueDisplay(watch)}
                            <button
                                className="watch-remove"
                                onClick={() => removeWatchExpression(watch.id)}
                            >
                                ×
                            </button>
                        </>
                    )}
                </div>
            ))}
            
            <div className="watch-add">
                <input
                    className="watch-add-input"
                    placeholder="Add expression"
                    value={newExpression}
                    onChange={(e) => setNewExpression(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
            </div>
        </div>
    );
});

WatchPanel.displayName = 'WatchPanel';

// ============ Call Stack Panel ============

const CallStackPanel = memo(() => {
    const { callStack, selectedFrameIndex, selectStackFrame, state } = useDebuggerStore();
    
    if (state !== DebuggerState.PAUSED) {
        return <div className="panel-empty">Not paused</div>;
    }
    
    if (callStack.length === 0) {
        return <div className="panel-empty">No call stack</div>;
    }
    
    return (
        <div className="callstack-panel">
            {callStack.map((frame, index) => (
                <div
                    key={frame.id}
                    className={`callstack-frame ${index === selectedFrameIndex ? 'selected' : ''}`}
                    onClick={() => selectStackFrame(index)}
                >
                    <span className="frame-function">{frame.functionName || '(anonymous)'}</span>
                    <span className="frame-location">
                        {frame.filePath?.split('/').pop()}:{frame.line}
                    </span>
                </div>
            ))}
        </div>
    );
});

CallStackPanel.displayName = 'CallStackPanel';

// ============ Breakpoints Panel ============

const BreakpointsPanel = memo(() => {
    const { breakpoints, exceptionBreakpoints, toggleBreakpoint, enableBreakpoint, disableBreakpoint, removeBreakpoint, setExceptionBreakpoints } = useDebuggerStore();
    
    const getBreakpointIcon = (bp) => {
        if (bp.state === BreakpointState.DISABLED) return Icons.breakpointDisabled;
        if (bp.type === BreakpointType.CONDITIONAL) return Icons.conditional;
        if (bp.type === BreakpointType.LOGPOINT) return Icons.logpoint;
        return Icons.breakpoint;
    };
    
    return (
        <div className="breakpoints-panel">
            {/* Exception breakpoints */}
            <div className="exception-breakpoints">
                <label className="exception-option">
                    <input
                        type="checkbox"
                        checked={exceptionBreakpoints.caught}
                        onChange={(e) => setExceptionBreakpoints(e.target.checked, exceptionBreakpoints.uncaught)}
                    />
                    <span>Caught Exceptions</span>
                </label>
                <label className="exception-option">
                    <input
                        type="checkbox"
                        checked={exceptionBreakpoints.uncaught}
                        onChange={(e) => setExceptionBreakpoints(exceptionBreakpoints.caught, e.target.checked)}
                    />
                    <span>Uncaught Exceptions</span>
                </label>
            </div>
            
            {/* Breakpoint list */}
            <div className="breakpoint-list">
                {breakpoints.length === 0 ? (
                    <div className="panel-empty">No breakpoints</div>
                ) : (
                    breakpoints.map(bp => (
                        <div key={bp.id} className="breakpoint-item">
                            <input
                                type="checkbox"
                                checked={bp.state === BreakpointState.ENABLED}
                                onChange={() => bp.state === BreakpointState.ENABLED 
                                    ? disableBreakpoint(bp.id) 
                                    : enableBreakpoint(bp.id)
                                }
                            />
                            <span className="breakpoint-icon">{getBreakpointIcon(bp)}</span>
                            <span className="breakpoint-location">
                                {bp.filePath?.split('/').pop()}:{bp.line}
                            </span>
                            {bp.condition && (
                                <span className="breakpoint-condition">
                                    when: {bp.condition}
                                </span>
                            )}
                            {bp.hits > 0 && (
                                <span className="breakpoint-hits">
                                    hits: {bp.hits}
                                </span>
                            )}
                            <button
                                className="breakpoint-remove"
                                onClick={() => removeBreakpoint(bp.id)}
                            >
                                ×
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
});

BreakpointsPanel.displayName = 'BreakpointsPanel';

// ============ Debug Console Panel ============

const DebugConsolePanel = memo(() => {
    const { debugConsole, evaluateInConsole, clearConsole } = useDebuggerStore();
    const [input, setInput] = useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            evaluateInConsole(input.trim());
            setInput('');
        }
    };
    
    return (
        <div className="debug-console-panel">
            <div className="console-output">
                {debugConsole.map(entry => (
                    <div key={entry.id} className={`console-entry console-${entry.type}`}>
                        <span className="console-message">{entry.message}</span>
                    </div>
                ))}
            </div>
            
            <form className="console-input-form" onSubmit={handleSubmit}>
                <span className="console-prompt">{'>'}</span>
                <input
                    className="console-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Evaluate expression"
                />
            </form>
        </div>
    );
});

DebugConsolePanel.displayName = 'DebugConsolePanel';

// ============ Main Enhanced Debugger Component ============

const EnhancedDebugger = ({ socket, onFileNavigate }) => {
    const { 
        state, 
        activeTab, 
        setActiveTab, 
        setSocket,
        currentFilePath,
        currentLine,
    } = useDebuggerStore();
    
    // Set socket on mount
    useEffect(() => {
        if (socket) {
            setSocket(socket);
        }
        return () => setSocket(null);
    }, [socket, setSocket]);
    
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // F5 - Continue
            if (e.key === 'F5' && !e.shiftKey && !e.ctrlKey) {
                e.preventDefault();
                useDebuggerStore.getState().continue();
            }
            // Shift+F5 - Stop
            else if (e.key === 'F5' && e.shiftKey && !e.ctrlKey) {
                e.preventDefault();
                useDebuggerStore.getState().stopDebugging();
            }
            // Ctrl+Shift+F5 - Restart
            else if (e.key === 'F5' && e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                useDebuggerStore.getState().restartDebugging();
            }
            // F6 - Pause
            else if (e.key === 'F6') {
                e.preventDefault();
                useDebuggerStore.getState().pause();
            }
            // F10 - Step Over
            else if (e.key === 'F10') {
                e.preventDefault();
                useDebuggerStore.getState().stepOver();
            }
            // F11 - Step Into
            else if (e.key === 'F11' && !e.shiftKey) {
                e.preventDefault();
                useDebuggerStore.getState().stepInto();
            }
            // Shift+F11 - Step Out
            else if (e.key === 'F11' && e.shiftKey) {
                e.preventDefault();
                useDebuggerStore.getState().stepOut();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    // Navigate to current location
    useEffect(() => {
        if (state === DebuggerState.PAUSED && currentFilePath && currentLine && onFileNavigate) {
            onFileNavigate(currentFilePath, currentLine);
        }
    }, [state, currentFilePath, currentLine, onFileNavigate]);
    
    const tabs = [
        { id: 'variables', label: 'Variables' },
        { id: 'watch', label: 'Watch' },
        { id: 'callstack', label: 'Call Stack' },
        { id: 'breakpoints', label: 'Breakpoints' },
        { id: 'console', label: 'Console' },
    ];
    
    const renderPanel = () => {
        switch (activeTab) {
            case 'variables': return <VariablesPanel />;
            case 'watch': return <WatchPanel />;
            case 'callstack': return <CallStackPanel />;
            case 'breakpoints': return <BreakpointsPanel />;
            case 'console': return <DebugConsolePanel />;
            default: return <VariablesPanel />;
        }
    };
    
    const getStateLabel = () => {
        switch (state) {
            case DebuggerState.IDLE: return 'Not debugging';
            case DebuggerState.RUNNING: return 'Running';
            case DebuggerState.PAUSED: return 'Paused';
            case DebuggerState.STEPPING: return 'Stepping';
            case DebuggerState.STOPPED: return 'Stopped';
            case DebuggerState.ERROR: return 'Error';
            default: return '';
        }
    };
    
    return (
        <div className="enhanced-debugger">
            {/* Debug toolbar */}
            <div className="debug-header">
                <div className="debug-status">
                    <span className={`status-indicator status-${state}`} />
                    <span className="status-label">{getStateLabel()}</span>
                </div>
                <DebugControls />
            </div>
            
            {/* Tabs */}
            <div className="debug-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`debug-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            
            {/* Panel content */}
            <div className="debug-panel-content">
                {renderPanel()}
            </div>
            
            {/* Styles */}
            <style>{`
                .enhanced-debugger {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #252526;
                    color: #d4d4d4;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 12px;
                }
                
                .debug-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: #1e1e1e;
                    border-bottom: 1px solid #3c3c3c;
                }
                
                .debug-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .status-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #808080;
                }
                
                .status-indicator.status-idle { background: #808080; }
                .status-indicator.status-running { background: #6a9955; }
                .status-indicator.status-paused { background: #dcdcaa; }
                .status-indicator.status-stepping { background: #569cd6; }
                .status-indicator.status-stopped { background: #f44747; }
                .status-indicator.status-error { background: #f44747; }
                
                .status-label {
                    font-size: 11px;
                    color: #888;
                }
                
                .debug-controls {
                    display: flex;
                    gap: 4px;
                }
                
                .debug-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    background: transparent;
                    border: none;
                    color: #cccccc;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: background 0.15s, color 0.15s;
                }
                
                .debug-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }
                
                .debug-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                
                .debug-btn-stop:hover:not(:disabled) {
                    color: #f44747;
                }
                
                .debug-tabs {
                    display: flex;
                    background: #252526;
                    border-bottom: 1px solid #3c3c3c;
                }
                
                .debug-tab {
                    flex: 1;
                    padding: 8px 12px;
                    background: transparent;
                    border: none;
                    color: #888;
                    font-size: 11px;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    transition: color 0.15s, border-color 0.15s;
                }
                
                .debug-tab:hover {
                    color: #cccccc;
                }
                
                .debug-tab.active {
                    color: #ffffff;
                    border-bottom-color: #007acc;
                }
                
                .debug-panel-content {
                    flex: 1;
                    overflow: auto;
                }
                
                .panel-empty {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100px;
                    color: #888;
                    font-style: italic;
                }
                
                /* Variables Panel */
                .variables-panel {
                    padding: 4px 0;
                }
                
                .scope-section {
                    margin-bottom: 4px;
                }
                
                .scope-header {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-weight: 500;
                }
                
                .scope-header:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .scope-expand {
                    display: flex;
                    color: #888;
                }
                
                .scope-count {
                    margin-left: auto;
                    color: #888;
                    font-size: 10px;
                }
                
                .scope-variables {
                    padding-left: 8px;
                }
                
                .scope-empty {
                    color: #888;
                    font-style: italic;
                    padding: 4px 24px;
                    display: block;
                }
                
                .variable-item {
                    font-family: 'Consolas', 'Monaco', monospace;
                    font-size: 12px;
                }
                
                .variable-row {
                    display: flex;
                    align-items: center;
                    padding: 2px 4px;
                    cursor: pointer;
                }
                
                .variable-row:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .variable-expand {
                    display: flex;
                    width: 16px;
                    color: #888;
                }
                
                .variable-expand-placeholder {
                    width: 16px;
                }
                
                .variable-name {
                    color: #9cdcfe;
                }
                
                .variable-separator {
                    color: #808080;
                }
                
                .variable-value {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                /* Watch Panel */
                .watch-panel {
                    padding: 4px 8px;
                }
                
                .watch-item {
                    display: flex;
                    align-items: center;
                    padding: 4px;
                    font-family: 'Consolas', 'Monaco', monospace;
                    font-size: 12px;
                }
                
                .watch-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .watch-expression {
                    color: #9cdcfe;
                    cursor: pointer;
                }
                
                .watch-separator {
                    color: #808080;
                    margin: 0 4px;
                }
                
                .watch-value {
                    color: #4ec9b0;
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .watch-error {
                    color: #f44747;
                }
                
                .watch-pending {
                    color: #888;
                    font-style: italic;
                }
                
                .watch-remove {
                    background: transparent;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    padding: 0 4px;
                    font-size: 14px;
                    opacity: 0;
                }
                
                .watch-item:hover .watch-remove {
                    opacity: 1;
                }
                
                .watch-edit-input {
                    flex: 1;
                    background: #3c3c3c;
                    border: 1px solid #007acc;
                    color: #d4d4d4;
                    padding: 2px 4px;
                    font-family: inherit;
                    font-size: inherit;
                    outline: none;
                }
                
                .watch-add {
                    padding: 4px;
                }
                
                .watch-add-input {
                    width: 100%;
                    background: transparent;
                    border: 1px solid transparent;
                    color: #d4d4d4;
                    padding: 4px;
                    font-family: 'Consolas', 'Monaco', monospace;
                    font-size: 12px;
                    outline: none;
                }
                
                .watch-add-input:focus {
                    border-color: #3c3c3c;
                    background: #1e1e1e;
                }
                
                /* Call Stack Panel */
                .callstack-panel {
                    padding: 4px 0;
                }
                
                .callstack-frame {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 12px;
                    cursor: pointer;
                }
                
                .callstack-frame:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .callstack-frame.selected {
                    background: rgba(0, 122, 204, 0.3);
                }
                
                .frame-function {
                    color: #dcdcaa;
                    font-family: 'Consolas', 'Monaco', monospace;
                }
                
                .frame-location {
                    color: #888;
                    font-size: 11px;
                    margin-left: auto;
                }
                
                /* Breakpoints Panel */
                .breakpoints-panel {
                    padding: 4px 0;
                }
                
                .exception-breakpoints {
                    padding: 8px 12px;
                    border-bottom: 1px solid #3c3c3c;
                }
                
                .exception-option {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 2px 0;
                    cursor: pointer;
                }
                
                .breakpoint-list {
                    padding: 4px 0;
                }
                
                .breakpoint-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 12px;
                }
                
                .breakpoint-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .breakpoint-icon {
                    display: flex;
                }
                
                .breakpoint-location {
                    font-family: 'Consolas', 'Monaco', monospace;
                    color: #9cdcfe;
                }
                
                .breakpoint-condition {
                    color: #888;
                    font-size: 11px;
                }
                
                .breakpoint-hits {
                    color: #6a9955;
                    font-size: 10px;
                    margin-left: auto;
                }
                
                .breakpoint-remove {
                    background: transparent;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    padding: 0 4px;
                    font-size: 14px;
                    opacity: 0;
                }
                
                .breakpoint-item:hover .breakpoint-remove {
                    opacity: 1;
                }
                
                /* Debug Console */
                .debug-console-panel {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .console-output {
                    flex: 1;
                    overflow-y: auto;
                    padding: 4px 8px;
                    font-family: 'Consolas', 'Monaco', monospace;
                    font-size: 12px;
                }
                
                .console-entry {
                    padding: 2px 0;
                }
                
                .console-log .console-message { color: #d4d4d4; }
                .console-warn .console-message { color: #dcdcaa; }
                .console-error .console-message { color: #f44747; }
                .console-info .console-message { color: #569cd6; }
                .console-output .console-message { color: #4ec9b0; }
                .console-input .console-message { color: #888; }
                .console-input .console-message::before { content: '> '; }
                
                .console-input-form {
                    display: flex;
                    align-items: center;
                    padding: 4px 8px;
                    border-top: 1px solid #3c3c3c;
                    background: #1e1e1e;
                }
                
                .console-prompt {
                    color: #dcdcaa;
                    margin-right: 8px;
                }
                
                .console-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #d4d4d4;
                    font-family: 'Consolas', 'Monaco', monospace;
                    font-size: 12px;
                    outline: none;
                }
            `}</style>
        </div>
    );
};

export default EnhancedDebugger;
