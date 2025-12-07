/**
 * XTermPanel - Terminal panel component using xterm.js
 * Provides integrated terminal with full PTY support
 */

import React, { useRef, useEffect, useCallback, useState, memo } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import { Unicode11Addon } from 'xterm-addon-unicode11';
import { SerializeAddon } from 'xterm-addon-serialize';
import useTerminalStore from '../../stores/terminalStore';
import 'xterm/css/xterm.css';

// ============ Terminal Themes ============

const terminalThemes = {
    dark: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#264f78',
        black: '#1e1e1e',
        red: '#f44747',
        green: '#6a9955',
        yellow: '#dcdcaa',
        blue: '#569cd6',
        magenta: '#c586c0',
        cyan: '#4ec9b0',
        white: '#d4d4d4',
        brightBlack: '#808080',
        brightRed: '#f44747',
        brightGreen: '#6a9955',
        brightYellow: '#dcdcaa',
        brightBlue: '#569cd6',
        brightMagenta: '#c586c0',
        brightCyan: '#4ec9b0',
        brightWhite: '#ffffff',
    },
    light: {
        background: '#ffffff',
        foreground: '#1e1e1e',
        cursor: '#000000',
        cursorAccent: '#ffffff',
        selectionBackground: '#add6ff',
        black: '#1e1e1e',
        red: '#cd3131',
        green: '#008000',
        yellow: '#795e26',
        blue: '#0000ff',
        magenta: '#af00db',
        cyan: '#267f99',
        white: '#d4d4d4',
        brightBlack: '#808080',
        brightRed: '#cd3131',
        brightGreen: '#008000',
        brightYellow: '#795e26',
        brightBlue: '#0000ff',
        brightMagenta: '#af00db',
        brightCyan: '#267f99',
        brightWhite: '#1e1e1e',
    },
    monokai: {
        background: '#272822',
        foreground: '#f8f8f2',
        cursor: '#f8f8f0',
        cursorAccent: '#272822',
        selectionBackground: '#49483e',
        black: '#272822',
        red: '#f92672',
        green: '#a6e22e',
        yellow: '#f4bf75',
        blue: '#66d9ef',
        magenta: '#ae81ff',
        cyan: '#a1efe4',
        white: '#f8f8f2',
        brightBlack: '#75715e',
        brightRed: '#f92672',
        brightGreen: '#a6e22e',
        brightYellow: '#f4bf75',
        brightBlue: '#66d9ef',
        brightMagenta: '#ae81ff',
        brightCyan: '#a1efe4',
        brightWhite: '#f9f8f5',
    },
    dracula: {
        background: '#282a36',
        foreground: '#f8f8f2',
        cursor: '#f8f8f2',
        cursorAccent: '#282a36',
        selectionBackground: '#44475a',
        black: '#21222c',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#6272a4',
        brightRed: '#ff6e6e',
        brightGreen: '#69ff94',
        brightYellow: '#ffffa5',
        brightBlue: '#d6acff',
        brightMagenta: '#ff92df',
        brightCyan: '#a4ffff',
        brightWhite: '#ffffff',
    },
};

// ============ Single Terminal Instance Component ============

const TerminalInstance = memo(({ terminalId, isActive, socket }) => {
    const containerRef = useRef(null);
    const terminalRef = useRef(null);
    const fitAddonRef = useRef(null);
    const searchAddonRef = useRef(null);
    
    const {
        terminals,
        theme,
        fontSize,
        fontFamily,
        updateTerminal,
        writeToTerminal,
        addToHistory,
    } = useTerminalStore();
    
    const terminal = terminals.find(t => t.id === terminalId);
    
    // Initialize terminal
    useEffect(() => {
        if (!containerRef.current || terminalRef.current) return;
        
        // Create terminal instance
        const term = new Terminal({
            cursorBlink: true,
            cursorStyle: 'block',
            fontSize: fontSize,
            fontFamily: fontFamily,
            theme: terminalThemes[theme] || terminalThemes.dark,
            scrollback: 10000,
            allowTransparency: true,
            bellStyle: 'sound',
            windowsMode: navigator.platform.includes('Win'),
        });
        
        // Initialize addons
        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon((e, uri) => {
            window.open(uri, '_blank');
        });
        const searchAddon = new SearchAddon();
        const unicode11Addon = new Unicode11Addon();
        const serializeAddon = new SerializeAddon();
        
        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);
        term.loadAddon(searchAddon);
        term.loadAddon(unicode11Addon);
        term.loadAddon(serializeAddon);
        
        term.unicode.activeVersion = '11';
        
        // Open terminal in container
        term.open(containerRef.current);
        
        // Fit to container
        setTimeout(() => fitAddon.fit(), 0);
        
        // Store refs
        terminalRef.current = term;
        fitAddonRef.current = fitAddon;
        searchAddonRef.current = searchAddon;
        
        // Handle input
        let currentLine = '';
        
        term.onData((data) => {
            if (socket && socket.connected) {
                socket.emit('terminal:input', {
                    terminalId,
                    data,
                });
            } else {
                // Local echo if no PTY connection
                if (data === '\r') {
                    // Enter pressed
                    term.write('\r\n');
                    if (currentLine.trim()) {
                        addToHistory(terminalId, currentLine);
                    }
                    currentLine = '';
                } else if (data === '\x7f') {
                    // Backspace
                    if (currentLine.length > 0) {
                        currentLine = currentLine.slice(0, -1);
                        term.write('\b \b');
                    }
                } else if (data === '\x03') {
                    // Ctrl+C
                    term.write('^C\r\n');
                    currentLine = '';
                } else if (data >= ' ') {
                    currentLine += data;
                    term.write(data);
                }
            }
        });
        
        // Handle resize
        term.onResize(({ cols, rows }) => {
            if (socket && socket.connected) {
                socket.emit('terminal:resize', {
                    terminalId,
                    cols,
                    rows,
                });
            }
        });
        
        // Update store with terminal instance reference
        updateTerminal(terminalId, { 
            cols: term.cols,
            rows: term.rows,
        });
        
        // Write welcome message if new
        if (terminal?.buffer.length === 0) {
            term.writeln('\x1b[1;34m┌─────────────────────────────────────┐\x1b[0m');
            term.writeln('\x1b[1;34m│\x1b[0m  \x1b[1;32mCollaborative Code Editor Terminal\x1b[0m  \x1b[1;34m│\x1b[0m');
            term.writeln('\x1b[1;34m└─────────────────────────────────────┘\x1b[0m');
            term.writeln('');
        }
        
        return () => {
            term.dispose();
            terminalRef.current = null;
        };
    }, [terminalId]);
    
    // Handle socket data
    useEffect(() => {
        if (!socket || !terminalRef.current) return;
        
        const handleOutput = (data) => {
            if (data.terminalId === terminalId && terminalRef.current) {
                terminalRef.current.write(data.data);
            }
        };
        
        socket.on('terminal:output', handleOutput);
        
        return () => {
            socket.off('terminal:output', handleOutput);
        };
    }, [socket, terminalId]);
    
    // Update theme
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.options.theme = terminalThemes[theme] || terminalThemes.dark;
        }
    }, [theme]);
    
    // Update font
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.options.fontSize = fontSize;
            terminalRef.current.options.fontFamily = fontFamily;
            if (fitAddonRef.current) {
                fitAddonRef.current.fit();
            }
        }
    }, [fontSize, fontFamily]);
    
    // Handle resize on window/container resize
    useEffect(() => {
        const handleResize = () => {
            if (fitAddonRef.current && isActive) {
                fitAddonRef.current.fit();
            }
        };
        
        window.addEventListener('resize', handleResize);
        
        // Create ResizeObserver for container
        const observer = new ResizeObserver(handleResize);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        
        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, [isActive]);
    
    // Fit when becoming active
    useEffect(() => {
        if (isActive && fitAddonRef.current) {
            setTimeout(() => fitAddonRef.current.fit(), 0);
            terminalRef.current?.focus();
        }
    }, [isActive]);
    
    // Write external data to terminal
    useEffect(() => {
        if (terminal?.pendingWrite && terminalRef.current) {
            terminalRef.current.write(terminal.pendingWrite);
            updateTerminal(terminalId, { pendingWrite: null });
        }
    }, [terminal?.pendingWrite, terminalId]);
    
    return (
        <div
            ref={containerRef}
            className={`terminal-instance ${isActive ? 'active' : 'hidden'}`}
            style={{
                width: '100%',
                height: '100%',
                display: isActive ? 'block' : 'none',
            }}
        />
    );
});

TerminalInstance.displayName = 'TerminalInstance';

// ============ Terminal Tab Component ============

const TerminalTab = memo(({ terminal, isActive, onSelect, onClose, onRename }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(terminal.name);
    const inputRef = useRef(null);
    
    const handleDoubleClick = () => {
        setIsEditing(true);
        setTimeout(() => inputRef.current?.select(), 0);
    };
    
    const handleNameSubmit = () => {
        setIsEditing(false);
        if (name.trim()) {
            onRename(terminal.id, name.trim());
        } else {
            setName(terminal.name);
        }
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleNameSubmit();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setName(terminal.name);
        }
    };
    
    return (
        <div
            className={`terminal-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(terminal.id)}
            onDoubleClick={handleDoubleClick}
        >
            <span className="terminal-tab-icon">
                {terminal.type === 'shell' ? '>' : 
                 terminal.type === 'output' ? '□' : '$'}
            </span>
            
            {isEditing ? (
                <input
                    ref={inputRef}
                    className="terminal-tab-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleNameSubmit}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span className="terminal-tab-name">{terminal.name}</span>
            )}
            
            <button
                className="terminal-tab-close"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose(terminal.id);
                }}
            >
                ×
            </button>
        </div>
    );
});

TerminalTab.displayName = 'TerminalTab';

// ============ Main XTermPanel Component ============

const XTermPanel = ({ socket, isOpen = true, onToggle }) => {
    const panelRef = useRef(null);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const {
        terminals,
        activeTerminalId,
        createTerminal,
        closeTerminal,
        setActiveTerminal,
        renameTerminal,
        clearTerminal,
        killProcess,
    } = useTerminalStore();
    
    // Create initial terminal if none exist
    useEffect(() => {
        if (terminals.length === 0) {
            createTerminal('Terminal 1');
        }
    }, []);
    
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            
            // Ctrl+Shift+` - New terminal
            if (e.ctrlKey && e.shiftKey && e.key === '`') {
                e.preventDefault();
                createTerminal(`Terminal ${terminals.length + 1}`);
            }
            // Ctrl+Shift+W - Close terminal
            else if (e.ctrlKey && e.shiftKey && e.key === 'W') {
                e.preventDefault();
                if (activeTerminalId) {
                    closeTerminal(activeTerminalId);
                }
            }
            // Ctrl+Shift+[ / ] - Previous/Next terminal
            else if (e.ctrlKey && e.shiftKey && e.key === '[') {
                e.preventDefault();
                const currentIndex = terminals.findIndex(t => t.id === activeTerminalId);
                if (currentIndex > 0) {
                    setActiveTerminal(terminals[currentIndex - 1].id);
                }
            }
            else if (e.ctrlKey && e.shiftKey && e.key === ']') {
                e.preventDefault();
                const currentIndex = terminals.findIndex(t => t.id === activeTerminalId);
                if (currentIndex < terminals.length - 1) {
                    setActiveTerminal(terminals[currentIndex + 1].id);
                }
            }
            // Ctrl+F - Search
            else if (e.ctrlKey && e.key === 'f' && panelRef.current?.contains(document.activeElement)) {
                e.preventDefault();
                setSearchVisible(true);
            }
            // Escape - Close search
            else if (e.key === 'Escape' && searchVisible) {
                setSearchVisible(false);
                setSearchQuery('');
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeTerminalId, terminals, searchVisible]);
    
    const handleNewTerminal = useCallback(() => {
        createTerminal(`Terminal ${terminals.length + 1}`);
    }, [terminals.length]);
    
    const handleSplit = useCallback(() => {
        // Create new terminal in split view
        createTerminal(`Terminal ${terminals.length + 1}`, 'shell', {
            split: true,
        });
    }, [terminals.length]);
    
    const handleClear = useCallback(() => {
        if (activeTerminalId) {
            clearTerminal(activeTerminalId);
        }
    }, [activeTerminalId]);
    
    const handleKill = useCallback(() => {
        if (activeTerminalId) {
            killProcess(activeTerminalId);
        }
    }, [activeTerminalId]);
    
    if (!isOpen) {
        return null;
    }
    
    return (
        <div ref={panelRef} className="xterm-panel">
            {/* Header */}
            <div className="xterm-panel-header">
                <div className="xterm-tabs">
                    {terminals.map(terminal => (
                        <TerminalTab
                            key={terminal.id}
                            terminal={terminal}
                            isActive={terminal.id === activeTerminalId}
                            onSelect={setActiveTerminal}
                            onClose={closeTerminal}
                            onRename={renameTerminal}
                        />
                    ))}
                </div>
                
                <div className="xterm-actions">
                    <button
                        className="xterm-action-btn"
                        onClick={handleNewTerminal}
                        title="New Terminal (Ctrl+Shift+`)"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                    </button>
                    
                    <button
                        className="xterm-action-btn"
                        onClick={handleSplit}
                        title="Split Terminal"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <rect x="1" y="2" width="14" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2"/>
                            <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.2"/>
                        </svg>
                    </button>
                    
                    <button
                        className="xterm-action-btn"
                        onClick={handleKill}
                        title="Kill Terminal"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <rect x="4" y="4" width="8" height="8" fill="currentColor"/>
                        </svg>
                    </button>
                    
                    <button
                        className="xterm-action-btn"
                        onClick={handleClear}
                        title="Clear Terminal"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M3 3h10v10H3zM3 7h10" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                        </svg>
                    </button>
                    
                    {onToggle && (
                        <button
                            className="xterm-action-btn"
                            onClick={onToggle}
                            title="Close Panel"
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            
            {/* Search bar */}
            {searchVisible && (
                <div className="xterm-search">
                    <input
                        type="text"
                        className="xterm-search-input"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    <button className="xterm-search-btn">↑</button>
                    <button className="xterm-search-btn">↓</button>
                    <button 
                        className="xterm-search-btn"
                        onClick={() => {
                            setSearchVisible(false);
                            setSearchQuery('');
                        }}
                    >
                        ×
                    </button>
                </div>
            )}
            
            {/* Terminal instances */}
            <div className="xterm-terminals">
                {terminals.map(terminal => (
                    <TerminalInstance
                        key={terminal.id}
                        terminalId={terminal.id}
                        isActive={terminal.id === activeTerminalId}
                        socket={socket}
                    />
                ))}
            </div>
            
            {/* Styles */}
            <style>{`
                .xterm-panel {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #1e1e1e;
                    border-top: 1px solid #3c3c3c;
                }
                
                .xterm-panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 35px;
                    background: #252526;
                    border-bottom: 1px solid #3c3c3c;
                    padding: 0 4px;
                }
                
                .xterm-tabs {
                    display: flex;
                    gap: 2px;
                    overflow-x: auto;
                    flex: 1;
                }
                
                .terminal-tab {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 8px;
                    background: transparent;
                    border: none;
                    color: #888;
                    font-size: 12px;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: background 0.15s, color 0.15s;
                    white-space: nowrap;
                }
                
                .terminal-tab:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #ccc;
                }
                
                .terminal-tab.active {
                    background: #1e1e1e;
                    color: #fff;
                }
                
                .terminal-tab-icon {
                    font-family: monospace;
                    font-size: 11px;
                    color: #888;
                }
                
                .terminal-tab-name {
                    max-width: 150px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .terminal-tab-input {
                    background: #3c3c3c;
                    border: 1px solid #007acc;
                    color: #fff;
                    font-size: 12px;
                    padding: 2px 4px;
                    border-radius: 2px;
                    outline: none;
                    width: 100px;
                }
                
                .terminal-tab-close {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 16px;
                    height: 16px;
                    background: transparent;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    border-radius: 3px;
                    font-size: 14px;
                    line-height: 1;
                    opacity: 0;
                    transition: opacity 0.15s, background 0.15s;
                }
                
                .terminal-tab:hover .terminal-tab-close,
                .terminal-tab.active .terminal-tab-close {
                    opacity: 1;
                }
                
                .terminal-tab-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }
                
                .xterm-actions {
                    display: flex;
                    gap: 2px;
                    padding-left: 8px;
                }
                
                .xterm-action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 26px;
                    height: 26px;
                    background: transparent;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: background 0.15s, color 0.15s;
                }
                
                .xterm-action-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }
                
                .xterm-search {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    background: #252526;
                    border-bottom: 1px solid #3c3c3c;
                }
                
                .xterm-search-input {
                    flex: 1;
                    max-width: 300px;
                    padding: 4px 8px;
                    background: #3c3c3c;
                    border: 1px solid #5c5c5c;
                    border-radius: 4px;
                    color: #fff;
                    font-size: 12px;
                    outline: none;
                }
                
                .xterm-search-input:focus {
                    border-color: #007acc;
                }
                
                .xterm-search-btn {
                    padding: 4px 8px;
                    background: transparent;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .xterm-search-btn:hover {
                    color: #fff;
                }
                
                .xterm-terminals {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                }
                
                .terminal-instance {
                    position: absolute;
                    inset: 0;
                    padding: 4px;
                }
                
                .terminal-instance.hidden {
                    visibility: hidden;
                    pointer-events: none;
                }
                
                /* xterm overrides */
                .xterm {
                    height: 100%;
                    padding: 4px;
                }
                
                .xterm-viewport {
                    overflow-y: auto !important;
                }
                
                .xterm-viewport::-webkit-scrollbar {
                    width: 10px;
                }
                
                .xterm-viewport::-webkit-scrollbar-track {
                    background: #1e1e1e;
                }
                
                .xterm-viewport::-webkit-scrollbar-thumb {
                    background: #5a5a5a;
                    border-radius: 5px;
                }
                
                .xterm-viewport::-webkit-scrollbar-thumb:hover {
                    background: #6a6a6a;
                }
            `}</style>
        </div>
    );
};

export default XTermPanel;
