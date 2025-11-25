import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X, Trash2, Minimize2, Maximize2, Copy, Check } from 'lucide-react';
import clsx from 'clsx';

const Terminal = ({ isOpen, onClose, isMaximized, onToggleMaximize, socket }) => {
    const [history, setHistory] = useState([
        { type: 'system', content: 'Connected to backend terminal...' }
    ]);
    const [input, setInput] = useState('');
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentPath, setCurrentPath] = useState('');
    const [copied, setCopied] = useState(false);

    const inputRef = useRef(null);
    const historyEndRef = useRef(null);

    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (socket && isOpen) {
            socket.emit('terminal-create');

            const handleOutput = (data) => {
                // Simple ANSI code stripping for now, or use a library like ansi-to-react
                // For this demo, we'll just display raw text or basic cleaning
                const cleanData = data.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
                setHistory(prev => [...prev, { type: 'output', content: cleanData }]);
            };

            socket.on('terminal-output', handleOutput);

            return () => {
                socket.off('terminal-output', handleOutput);
            };
        }
    }, [socket, isOpen]);

    const handleCommand = (cmd) => {
        const trimmedCmd = cmd; // Don't trim too aggressively, spaces might matter
        if (!trimmedCmd && trimmedCmd !== '') return;

        // Add to history
        if (trimmedCmd.trim()) {
            setCommandHistory(prev => [...prev, trimmedCmd]);
        }
        setHistory(prev => [...prev, { type: 'command', content: `$ ${trimmedCmd}` }]);

        if (trimmedCmd.trim() === 'clear') {
            setHistory([]);
            return;
        }

        if (socket) {
            socket.emit('terminal-input', trimmedCmd + '\n');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCommand(input);
            setInput('');
            setHistoryIndex(-1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
                setHistoryIndex(newIndex);
                setInput(commandHistory[commandHistory.length - 1 - newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[commandHistory.length - 1 - newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInput('');
            }
        } else if (e.key === 'c' && e.ctrlKey) {
            e.preventDefault();
            setInput('');
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            setHistory([]);
        }
    };

    const handleCopyAll = () => {
        const text = history.map(h => h.content).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className={clsx(
            "bg-black/95 backdrop-blur-sm border rounded-xl shadow-2xl flex flex-col font-mono text-sm overflow-hidden transition-all duration-300",
            isMaximized
                ? "fixed inset-4 z-50 border-green-500/30"
                : "border-white/10"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-dark/80 border-b border-green-500/20 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer" onClick={onClose} />
                        <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 cursor-pointer" onClick={onToggleMaximize} />
                        <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 cursor-pointer" />
                    </div>
                    <TerminalIcon className="w-4 h-4 text-green-400 ml-2" />
                    <span className="text-xs font-bold text-green-400">Terminal</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopyAll}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-text-muted hover:text-white"
                        title="Copy all"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={() => setHistory([])}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-text-muted hover:text-white"
                        title="Clear"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onToggleMaximize}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-text-muted hover:text-white"
                        title={isMaximized ? "Minimize" : "Maximize"}
                    >
                        {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-text-muted hover:text-white"
                        title="Close"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Terminal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin bg-black/50">
                {history.map((entry, index) => (
                    <div key={index} className={clsx(
                        "whitespace-pre-wrap break-all",
                        entry.type === 'command' && "text-green-400",
                        entry.type === 'output' && "text-gray-300",
                        entry.type === 'error' && "text-red-400",
                        entry.type === 'system' && "text-blue-400"
                    )}>
                        {entry.content}
                    </div>
                ))}
                <div ref={historyEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 bg-black/50 border-t border-green-500/10 shrink-0">
                <span className="text-green-400 shrink-0">{currentPath} $</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-green-300 focus:outline-none placeholder:text-green-700"
                    placeholder="Type 'help' for commands..."
                    autoComplete="off"
                    spellCheck="false"
                />
            </div>

            {/* Footer Hints */}
            <div className="px-4 py-1.5 bg-surface-dark/60 border-t border-green-500/10 text-[10px] text-gray-500 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <span>↵ Execute</span>
                    <span>↑↓ History</span>
                    <span>Ctrl+C Cancel</span>
                    <span>Ctrl+L Clear</span>
                </div>
                <span>{commandHistory.length} commands</span>
            </div>
        </div>
    );
};

export default Terminal;
