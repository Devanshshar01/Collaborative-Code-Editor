/**
 * EnhancedREPL - Interactive REPL component with multi-language support
 * Provides code evaluation, history, and intellisense
 */

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { nanoid } from 'nanoid';
import useTerminalStore from '../../stores/terminalStore';

// ============ Constants ============

const LANGUAGES = {
    javascript: {
        name: 'JavaScript',
        icon: '🟨',
        prompt: '> ',
        multilinePrompt: '... ',
        extension: 'js',
    },
    python: {
        name: 'Python',
        icon: '🐍',
        prompt: '>>> ',
        multilinePrompt: '... ',
        extension: 'py',
    },
    ruby: {
        name: 'Ruby',
        icon: '💎',
        prompt: 'irb> ',
        multilinePrompt: '.... ',
        extension: 'rb',
    },
    go: {
        name: 'Go',
        icon: '🔵',
        prompt: 'go> ',
        multilinePrompt: '... ',
        extension: 'go',
    },
    rust: {
        name: 'Rust',
        icon: '🦀',
        prompt: 'rust> ',
        multilinePrompt: '... ',
        extension: 'rs',
    },
};

// ============ Output Types ============

const OutputType = {
    INPUT: 'input',
    OUTPUT: 'output',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    SYSTEM: 'system',
};

// ============ REPL Output Cell Component ============

const OutputCell = memo(({ cell }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    const getTypeIcon = () => {
        switch (cell.type) {
            case OutputType.INPUT: return '→';
            case OutputType.OUTPUT: return '←';
            case OutputType.ERROR: return '✕';
            case OutputType.WARNING: return '⚠';
            case OutputType.INFO: return 'ℹ';
            case OutputType.SYSTEM: return '⚙';
            default: return '•';
        }
    };
    
    const getTypeClass = () => {
        switch (cell.type) {
            case OutputType.INPUT: return 'repl-cell-input';
            case OutputType.OUTPUT: return 'repl-cell-output';
            case OutputType.ERROR: return 'repl-cell-error';
            case OutputType.WARNING: return 'repl-cell-warning';
            case OutputType.INFO: return 'repl-cell-info';
            case OutputType.SYSTEM: return 'repl-cell-system';
            default: return '';
        }
    };
    
    const formatValue = (value) => {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value, null, 2);
            } catch {
                return String(value);
            }
        }
        return String(value);
    };
    
    const isMultiline = cell.content && cell.content.includes('\n');
    
    return (
        <div className={`repl-cell ${getTypeClass()}`}>
            <div className="repl-cell-header">
                <span className="repl-cell-icon">{getTypeIcon()}</span>
                {isMultiline && (
                    <button
                        className="repl-cell-expand"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? '▼' : '▶'}
                    </button>
                )}
                {cell.type === OutputType.INPUT && (
                    <span className="repl-cell-lang">{cell.language}</span>
                )}
                {cell.executionTime && (
                    <span className="repl-cell-time">{cell.executionTime}ms</span>
                )}
            </div>
            {(isExpanded || !isMultiline) && (
                <pre className="repl-cell-content">
                    {formatValue(cell.content)}
                </pre>
            )}
        </div>
    );
});

OutputCell.displayName = 'OutputCell';

// ============ Code Input Component ============

const CodeInput = memo(({ 
    value, 
    onChange, 
    onSubmit, 
    onHistoryUp, 
    onHistoryDown,
    language,
    isMultiline,
    placeholder,
}) => {
    const textareaRef = useRef(null);
    const [rows, setRows] = useState(1);
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Shift+Enter for new line
                return;
            }
            // Check if we need multiline mode
            const needsMultiline = checkNeedsMultiline(value, language);
            if (needsMultiline && !isMultiline) {
                // Continue input
                return;
            }
            e.preventDefault();
            onSubmit();
        } else if (e.key === 'ArrowUp' && !value) {
            e.preventDefault();
            onHistoryUp();
        } else if (e.key === 'ArrowDown' && !value) {
            e.preventDefault();
            onHistoryDown();
        } else if (e.key === 'Tab') {
            e.preventDefault();
            // Insert tab or trigger autocomplete
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newValue = value.substring(0, start) + '  ' + value.substring(end);
            onChange(newValue);
            setTimeout(() => {
                textareaRef.current.selectionStart = start + 2;
                textareaRef.current.selectionEnd = start + 2;
            }, 0);
        }
    };
    
    const checkNeedsMultiline = (code, lang) => {
        if (!code) return false;
        
        // Simple checks for incomplete blocks
        if (lang === 'python') {
            return code.endsWith(':') || 
                   code.includes('def ') || 
                   code.includes('class ') ||
                   (code.split('(').length !== code.split(')').length);
        }
        if (lang === 'javascript') {
            const openBraces = (code.match(/{/g) || []).length;
            const closeBraces = (code.match(/}/g) || []).length;
            return openBraces > closeBraces ||
                   code.endsWith('=>') ||
                   (code.split('(').length !== code.split(')').length);
        }
        return false;
    };
    
    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
            setRows(Math.ceil(scrollHeight / 20));
        }
    }, [value]);
    
    // Focus on mount
    useEffect(() => {
        textareaRef.current?.focus();
    }, []);
    
    const langConfig = LANGUAGES[language] || LANGUAGES.javascript;
    const prompt = isMultiline ? langConfig.multilinePrompt : langConfig.prompt;
    
    return (
        <div className="repl-input-container">
            <span className="repl-prompt">{prompt}</span>
            <textarea
                ref={textareaRef}
                className="repl-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={rows}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
            />
        </div>
    );
});

CodeInput.displayName = 'CodeInput';

// ============ Main REPL Component ============

const EnhancedREPL = ({ socket, initialLanguage = 'javascript' }) => {
    const [language, setLanguage] = useState(initialLanguage);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isMultiline, setIsMultiline] = useState(false);
    const [multilineBuffer, setMultilineBuffer] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [context, setContext] = useState({});
    
    const outputRef = useRef(null);
    const commandHistory = useRef([]);
    
    // Scroll to bottom on new output
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [history]);
    
    // Socket event handlers
    useEffect(() => {
        if (!socket) return;
        
        const handleResult = (data) => {
            setIsExecuting(false);
            
            if (data.error) {
                addOutput(OutputType.ERROR, data.error, {
                    executionTime: data.executionTime,
                });
            } else {
                addOutput(OutputType.OUTPUT, data.result, {
                    executionTime: data.executionTime,
                    type: data.type,
                });
            }
            
            // Update context with any new variables
            if (data.context) {
                setContext(prev => ({ ...prev, ...data.context }));
            }
        };
        
        socket.on('repl:result', handleResult);
        
        return () => {
            socket.off('repl:result', handleResult);
        };
    }, [socket]);
    
    const addOutput = useCallback((type, content, extra = {}) => {
        setHistory(prev => [...prev, {
            id: nanoid(),
            type,
            content,
            timestamp: Date.now(),
            language: type === OutputType.INPUT ? language : undefined,
            ...extra,
        }]);
    }, [language]);
    
    const executeCode = useCallback((code) => {
        if (!code.trim()) return;
        
        // Add to command history
        commandHistory.current.push(code);
        
        // Add input to output
        addOutput(OutputType.INPUT, code);
        
        // Clear input
        setInput('');
        setHistoryIndex(-1);
        setIsMultiline(false);
        setMultilineBuffer('');
        
        setIsExecuting(true);
        
        if (socket && socket.connected) {
            socket.emit('repl:execute', {
                code,
                language,
                context,
            });
        } else {
            // Local evaluation for JavaScript
            if (language === 'javascript') {
                try {
                    const startTime = performance.now();
                    // eslint-disable-next-line no-eval
                    const result = eval(code);
                    const executionTime = Math.round(performance.now() - startTime);
                    
                    addOutput(OutputType.OUTPUT, result, {
                        executionTime,
                        type: typeof result,
                    });
                } catch (error) {
                    addOutput(OutputType.ERROR, error.message);
                }
            } else {
                addOutput(OutputType.SYSTEM, `${LANGUAGES[language]?.name || language} execution requires server connection`);
            }
            setIsExecuting(false);
        }
    }, [socket, language, context, addOutput]);
    
    const handleSubmit = useCallback(() => {
        if (isMultiline) {
            const fullCode = multilineBuffer + '\n' + input;
            executeCode(fullCode);
        } else {
            executeCode(input);
        }
    }, [input, isMultiline, multilineBuffer, executeCode]);
    
    const handleHistoryUp = useCallback(() => {
        if (commandHistory.current.length === 0) return;
        
        const newIndex = historyIndex < commandHistory.current.length - 1 
            ? historyIndex + 1 
            : historyIndex;
        
        setHistoryIndex(newIndex);
        setInput(commandHistory.current[commandHistory.current.length - 1 - newIndex] || '');
    }, [historyIndex]);
    
    const handleHistoryDown = useCallback(() => {
        if (historyIndex <= 0) {
            setHistoryIndex(-1);
            setInput('');
            return;
        }
        
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory.current[commandHistory.current.length - 1 - newIndex] || '');
    }, [historyIndex]);
    
    const handleClear = useCallback(() => {
        setHistory([]);
        addOutput(OutputType.SYSTEM, 'Console cleared');
    }, [addOutput]);
    
    const handleReset = useCallback(() => {
        setContext({});
        handleClear();
        addOutput(OutputType.SYSTEM, 'Context reset');
    }, [handleClear, addOutput]);
    
    const langConfig = LANGUAGES[language] || LANGUAGES.javascript;
    
    return (
        <div className="enhanced-repl">
            {/* Header */}
            <div className="repl-header">
                <div className="repl-title">
                    <span className="repl-icon">{langConfig.icon}</span>
                    <span>Interactive REPL</span>
                </div>
                
                <div className="repl-controls">
                    <select
                        className="repl-language-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        {Object.entries(LANGUAGES).map(([key, config]) => (
                            <option key={key} value={key}>
                                {config.icon} {config.name}
                            </option>
                        ))}
                    </select>
                    
                    <button
                        className="repl-btn"
                        onClick={handleClear}
                        title="Clear console"
                    >
                        Clear
                    </button>
                    
                    <button
                        className="repl-btn"
                        onClick={handleReset}
                        title="Reset context"
                    >
                        Reset
                    </button>
                </div>
            </div>
            
            {/* Output area */}
            <div ref={outputRef} className="repl-output">
                {history.length === 0 ? (
                    <div className="repl-welcome">
                        <p>Welcome to the {langConfig.name} REPL</p>
                        <p className="repl-hint">
                            Type code and press Enter to evaluate. Shift+Enter for new line.
                        </p>
                    </div>
                ) : (
                    history.map(cell => (
                        <OutputCell key={cell.id} cell={cell} />
                    ))
                )}
                
                {isExecuting && (
                    <div className="repl-executing">
                        <span className="repl-spinner">⏳</span>
                        Executing...
                    </div>
                )}
            </div>
            
            {/* Input area */}
            <div className="repl-input-area">
                <CodeInput
                    value={input}
                    onChange={setInput}
                    onSubmit={handleSubmit}
                    onHistoryUp={handleHistoryUp}
                    onHistoryDown={handleHistoryDown}
                    language={language}
                    isMultiline={isMultiline}
                    placeholder={`Enter ${langConfig.name} code...`}
                />
            </div>
            
            {/* Styles */}
            <style>{`
                .enhanced-repl {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #1e1e1e;
                    color: #d4d4d4;
                    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                    font-size: 13px;
                }
                
                .repl-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: #252526;
                    border-bottom: 1px solid #3c3c3c;
                }
                
                .repl-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 500;
                }
                
                .repl-icon {
                    font-size: 16px;
                }
                
                .repl-controls {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
                .repl-language-select {
                    background: #3c3c3c;
                    border: 1px solid #5c5c5c;
                    border-radius: 4px;
                    color: #d4d4d4;
                    padding: 4px 8px;
                    font-size: 12px;
                    cursor: pointer;
                    outline: none;
                }
                
                .repl-language-select:hover {
                    border-color: #007acc;
                }
                
                .repl-btn {
                    background: transparent;
                    border: 1px solid #5c5c5c;
                    border-radius: 4px;
                    color: #d4d4d4;
                    padding: 4px 12px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                
                .repl-btn:hover {
                    background: #3c3c3c;
                    border-color: #007acc;
                }
                
                .repl-output {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px 12px;
                }
                
                .repl-output::-webkit-scrollbar {
                    width: 10px;
                }
                
                .repl-output::-webkit-scrollbar-track {
                    background: #1e1e1e;
                }
                
                .repl-output::-webkit-scrollbar-thumb {
                    background: #5a5a5a;
                    border-radius: 5px;
                }
                
                .repl-welcome {
                    color: #888;
                    text-align: center;
                    padding: 40px 20px;
                }
                
                .repl-hint {
                    font-size: 12px;
                    margin-top: 8px;
                }
                
                .repl-cell {
                    margin-bottom: 8px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.02);
                }
                
                .repl-cell-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 4px;
                    font-size: 11px;
                    color: #888;
                }
                
                .repl-cell-icon {
                    width: 14px;
                }
                
                .repl-cell-expand {
                    background: none;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    font-size: 10px;
                    padding: 0;
                }
                
                .repl-cell-lang {
                    background: #3c3c3c;
                    padding: 1px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                }
                
                .repl-cell-time {
                    margin-left: auto;
                    color: #6a9955;
                }
                
                .repl-cell-content {
                    margin: 0;
                    white-space: pre-wrap;
                    word-break: break-word;
                    font-family: inherit;
                    font-size: 13px;
                    line-height: 1.4;
                }
                
                .repl-cell-input .repl-cell-content {
                    color: #dcdcaa;
                }
                
                .repl-cell-output .repl-cell-content {
                    color: #4ec9b0;
                }
                
                .repl-cell-error .repl-cell-content {
                    color: #f44747;
                }
                
                .repl-cell-warning .repl-cell-content {
                    color: #ce9178;
                }
                
                .repl-cell-info .repl-cell-content {
                    color: #569cd6;
                }
                
                .repl-cell-system .repl-cell-content {
                    color: #888;
                    font-style: italic;
                }
                
                .repl-executing {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px;
                    color: #888;
                }
                
                .repl-spinner {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .repl-input-area {
                    border-top: 1px solid #3c3c3c;
                    background: #252526;
                }
                
                .repl-input-container {
                    display: flex;
                    align-items: flex-start;
                    padding: 8px 12px;
                }
                
                .repl-prompt {
                    color: #6a9955;
                    font-weight: 500;
                    padding-top: 2px;
                    min-width: 40px;
                }
                
                .repl-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #d4d4d4;
                    font-family: inherit;
                    font-size: 13px;
                    line-height: 1.4;
                    resize: none;
                    outline: none;
                    min-height: 20px;
                }
                
                .repl-input::placeholder {
                    color: #5a5a5a;
                }
            `}</style>
        </div>
    );
};

export default EnhancedREPL;
