/**
 * REPL Panel Component
 * Interactive Read-Eval-Print Loop for multiple languages
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Play,
    Trash2,
    Download,
    Upload,
    Terminal as TerminalIcon,
    X,
    Clock,
    AlertCircle,
    Loader2,
    Copy,
    Code,
} from 'lucide-react';
import clsx from 'clsx';

const languageConfig = {
    python: { name: 'Python', prompt: '>>>', color: 'text-yellow-400' },
    javascript: { name: 'JavaScript', prompt: '>', color: 'text-yellow-300' },
    typescript: { name: 'TypeScript', prompt: '>', color: 'text-blue-400' },
    ruby: { name: 'Ruby', prompt: 'irb>', color: 'text-red-400' },
    lua: { name: 'Lua', prompt: '>', color: 'text-blue-300' },
    go: { name: 'Go', prompt: '>>>', color: 'text-cyan-400' },
    rust: { name: 'Rust', prompt: '>>', color: 'text-orange-400' },
    java: { name: 'Java', prompt: 'jshell>', color: 'text-orange-500' },
    c: { name: 'C', prompt: 'cling$', color: 'text-gray-400' },
    cpp: { name: 'C++', prompt: 'cling$', color: 'text-blue-500' },
    shell: { name: 'Shell', prompt: '$', color: 'text-green-400' },
};

// Entry Display Component
const EntryDisplay = ({ entry, language, onCopy }) => {
    const config = languageConfig[language];

    if (entry.type === 'input') {
        return (
            <div className="flex items-start gap-2 group">
                <span className={clsx('font-mono text-xs select-none', config.color)}>
                    {config.prompt}
                </span>
                <pre className="flex-1 font-mono text-xs text-[#cccccc] whitespace-pre-wrap break-words">
                    {entry.content}
                </pre>
                <button
                    onClick={() => onCopy?.(entry.content)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#4c4c4c] rounded"
                >
                    <Copy className="w-3 h-3 text-[#858585]" />
                </button>
            </div>
        );
    }

    if (entry.type === 'output') {
        return (
            <div className="flex items-start gap-2 pl-6 group">
                <pre className="flex-1 font-mono text-xs text-[#4ec9b0] whitespace-pre-wrap break-words">
                    {entry.content}
                </pre>
                {entry.duration !== undefined && (
                    <span className="text-xs text-[#555] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {entry.duration.toFixed(1)}ms
                    </span>
                )}
            </div>
        );
    }

    if (entry.type === 'error') {
        return (
            <div className="flex items-start gap-2 pl-6">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <pre className="flex-1 font-mono text-xs text-red-400 whitespace-pre-wrap break-words">
                    {entry.content}
                </pre>
            </div>
        );
    }

    // info
    return (
        <div className="flex items-start gap-2 pl-6">
            <pre className="flex-1 font-mono text-xs text-[#858585] italic whitespace-pre-wrap">
                {entry.content}
            </pre>
        </div>
    );
};

// Main REPL Panel Component
export const REPLPanel = ({
    language,
    entries,
    isExecuting = false,
    onExecute,
    onClear,
    onLanguageChange,
    onHistoryNavigate,
    onInterrupt,
    onExport,
    onImport,
    onClose,
    className,
}) => {
    const [input, setInput] = useState('');
    const [isMultiline, setIsMultiline] = useState(false);
    const inputRef = useRef(null);
    const scrollRef = useRef(null);
    const config = languageConfig[language];

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [entries]);

    // Focus input
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleExecute = useCallback(() => {
        if (input.trim() && !isExecuting) {
            onExecute?.(input);
            setInput('');
            setIsMultiline(false);
        }
    }, [input, isExecuting, onExecute]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isMultiline) {
            e.preventDefault();
            handleExecute();
        } else if (e.key === 'Enter' && e.shiftKey) {
            setIsMultiline(true);
        } else if (e.key === 'ArrowUp' && !input && !isMultiline) {
            e.preventDefault();
            onHistoryNavigate?.('up');
        } else if (e.key === 'ArrowDown' && !input && !isMultiline) {
            e.preventDefault();
            onHistoryNavigate?.('down');
        } else if (e.key === 'c' && e.ctrlKey && isExecuting) {
            e.preventDefault();
            onInterrupt?.();
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            onClear?.();
        }
    }, [input, isMultiline, isExecuting, handleExecute, onHistoryNavigate, onInterrupt, onClear]);

    const handleCopy = useCallback((content) => {
        navigator.clipboard.writeText(content);
    }, []);

    return (
        <div className={clsx('flex flex-col bg-[#1e1e1e] border-t border-[#333]', className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#333] bg-[#252526]">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-[#cccccc]" />
                    <span className="text-sm font-medium text-[#cccccc]">REPL</span>
                    
                    {/* Language Selector */}
                    <select
                        value={language}
                        onChange={(e) => onLanguageChange?.(e.target.value)}
                        className="ml-2 bg-[#3c3c3c] text-xs text-[#cccccc] border border-[#555] rounded px-2 py-1 outline-none focus:border-[#007acc]"
                    >
                        {Object.entries(languageConfig).map(([key, cfg]) => (
                            <option key={key} value={key}>
                                {cfg.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="flex items-center gap-1">
                    <button
                        onClick={onExport}
                        className="p-1.5 rounded hover:bg-[#4c4c4c]"
                        title="Export Session"
                    >
                        <Download className="w-4 h-4 text-[#858585]" />
                    </button>
                    <button
                        onClick={onImport}
                        className="p-1.5 rounded hover:bg-[#4c4c4c]"
                        title="Import Code"
                    >
                        <Upload className="w-4 h-4 text-[#858585]" />
                    </button>
                    <button
                        onClick={onClear}
                        className="p-1.5 rounded hover:bg-[#4c4c4c]"
                        title="Clear (Ctrl+L)"
                    >
                        <Trash2 className="w-4 h-4 text-[#858585]" />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded hover:bg-[#4c4c4c]"
                        >
                            <X className="w-4 h-4 text-[#858585]" />
                        </button>
                    )}
                </div>
            </div>

            {/* Output Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-auto min-h-0 p-3 font-mono"
            >
                {entries.length === 0 ? (
                    <div className="text-xs text-[#858585]">
                        <div className="flex items-center gap-2 mb-2">
                            <Code className="w-4 h-4" />
                            <span>{config.name} Interactive Shell</span>
                        </div>
                        <div className="text-[#555]">
                            Type code and press Enter to execute. Shift+Enter for multiline.
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {entries.map((entry) => (
                            <EntryDisplay
                                key={entry.id}
                                entry={entry}
                                language={language}
                                onCopy={handleCopy}
                            />
                        ))}
                    </div>
                )}
                
                {/* Executing Indicator */}
                {isExecuting && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#858585]">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Executing... (Ctrl+C to interrupt)</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="border-t border-[#333] p-2">
                <div className="flex items-start gap-2">
                    <span className={clsx('font-mono text-xs select-none pt-1.5', config.color)}>
                        {isMultiline ? '...' : config.prompt}
                    </span>
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter code..."
                            disabled={isExecuting}
                            rows={isMultiline ? 4 : 1}
                            className={clsx(
                                'w-full bg-[#252526] text-xs text-[#cccccc] font-mono',
                                'border border-[#333] rounded px-2 py-1.5',
                                'outline-none focus:border-[#007acc]',
                                'placeholder:text-[#555]',
                                'resize-none',
                                isExecuting && 'opacity-50 cursor-not-allowed'
                            )}
                        />
                    </div>
                    <button
                        onClick={handleExecute}
                        disabled={isExecuting || !input.trim()}
                        className={clsx(
                            'p-1.5 rounded',
                            isExecuting || !input.trim()
                                ? 'text-[#555] cursor-not-allowed'
                                : 'hover:bg-[#4c4c4c] text-green-400'
                        )}
                        title="Execute (Enter)"
                    >
                        {isExecuting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                    </button>
                </div>
                
                {/* Help Text */}
                <div className="flex items-center justify-between mt-1 px-6 text-[10px] text-[#555]">
                    <span>Shift+Enter: multiline | Ctrl+L: clear | ↑↓: history</span>
                    {isMultiline && (
                        <button
                            onClick={handleExecute}
                            className="text-[#007acc] hover:underline"
                        >
                            Execute (Ctrl+Enter)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default REPLPanel;
