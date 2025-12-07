/**
 * Terminal Store - Zustand store for terminal state management
 * Manages multiple terminal instances with xterm.js integration
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';

// ============ Types ============

export const TerminalType = {
    SHELL: 'shell',
    OUTPUT: 'output',
    REPL: 'repl',
    DEBUG: 'debug',
};

export const TerminalStatus = {
    IDLE: 'idle',
    RUNNING: 'running',
    BLOCKED: 'blocked',
    ERROR: 'error',
    DISCONNECTED: 'disconnected',
};

// ============ Default Terminal Config ============

const defaultTerminalConfig = {
    fontSize: 14,
    fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
    lineHeight: 1.2,
    cursorBlink: true,
    cursorStyle: 'block',
    scrollback: 5000,
    theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        cursorAccent: '#1e1e1e',
        selection: 'rgba(255, 255, 255, 0.3)',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
    },
};

// ============ Terminal Entry Factory ============

const createTerminalEntry = (type, title, cwd) => ({
    id: nanoid(),
    type,
    title: title || `Terminal ${Date.now() % 1000}`,
    status: TerminalStatus.IDLE,
    cwd: cwd || process.cwd?.() || '~',
    createdAt: Date.now(),
    lastActive: Date.now(),
    history: [],
    historyIndex: -1,
    buffer: '',
    exitCode: null,
    processId: null,
});

// ============ Store ============

export const useTerminalStore = create(
    subscribeWithSelector((set, get) => ({
        // ============ State ============
        
        // Terminal instances
        terminals: [],
        activeTerminalId: null,
        
        // Configuration
        config: { ...defaultTerminalConfig },
        
        // Panel state
        isPanelOpen: true,
        panelHeight: 300,
        panelMinHeight: 100,
        panelMaxHeight: 600,
        
        // Split view
        splitView: false,
        splitTerminalId: null,
        
        // History across sessions
        globalHistory: [],
        maxGlobalHistory: 1000,
        
        // Socket connection
        socket: null,
        isConnected: false,
        
        // ============ Terminal Management ============
        
        createTerminal: (type = TerminalType.SHELL, title, cwd) => {
            const terminal = createTerminalEntry(type, title, cwd);
            
            set(state => ({
                terminals: [...state.terminals, terminal],
                activeTerminalId: terminal.id,
            }));
            
            // Emit socket event to create backend terminal
            const { socket } = get();
            if (socket) {
                socket.emit('terminal:create', {
                    id: terminal.id,
                    type,
                    cwd: terminal.cwd,
                });
            }
            
            return terminal.id;
        },
        
        closeTerminal: (id) => {
            const { terminals, activeTerminalId, socket } = get();
            const index = terminals.findIndex(t => t.id === id);
            
            if (index === -1) return;
            
            // Emit socket event to kill backend terminal
            if (socket) {
                socket.emit('terminal:kill', { id });
            }
            
            // Determine new active terminal
            let newActiveId = activeTerminalId;
            if (activeTerminalId === id) {
                if (terminals.length > 1) {
                    newActiveId = terminals[index === 0 ? 1 : index - 1].id;
                } else {
                    newActiveId = null;
                }
            }
            
            set(state => ({
                terminals: state.terminals.filter(t => t.id !== id),
                activeTerminalId: newActiveId,
            }));
        },
        
        setActiveTerminal: (id) => {
            const terminal = get().terminals.find(t => t.id === id);
            if (terminal) {
                set({ activeTerminalId: id });
                
                // Update last active time
                get().updateTerminal(id, { lastActive: Date.now() });
            }
        },
        
        updateTerminal: (id, updates) => {
            set(state => ({
                terminals: state.terminals.map(t =>
                    t.id === id ? { ...t, ...updates } : t
                ),
            }));
        },
        
        renameTerminal: (id, title) => {
            get().updateTerminal(id, { title });
        },
        
        clearTerminal: (id) => {
            const { socket } = get();
            if (socket) {
                socket.emit('terminal:clear', { id });
            }
        },
        
        // ============ Input/Output ============
        
        writeToTerminal: (id, data) => {
            const { socket } = get();
            if (socket) {
                socket.emit('terminal:input', { id, data });
            }
        },
        
        sendCommand: (id, command) => {
            const { socket } = get();
            if (socket) {
                socket.emit('terminal:input', { id, data: command + '\r' });
            }
            
            // Add to history
            get().addToHistory(id, command);
        },
        
        sendCtrlC: (id) => {
            get().writeToTerminal(id, '\x03');
        },
        
        sendCtrlD: (id) => {
            get().writeToTerminal(id, '\x04');
        },
        
        sendCtrlZ: (id) => {
            get().writeToTerminal(id, '\x1a');
        },
        
        // ============ History ============
        
        addToHistory: (id, command) => {
            if (!command.trim()) return;
            
            set(state => {
                const terminal = state.terminals.find(t => t.id === id);
                if (!terminal) return state;
                
                const newHistory = [...terminal.history];
                // Don't add duplicates consecutively
                if (newHistory[newHistory.length - 1] !== command) {
                    newHistory.push(command);
                    if (newHistory.length > 500) {
                        newHistory.shift();
                    }
                }
                
                // Also add to global history
                const newGlobalHistory = [...state.globalHistory];
                if (newGlobalHistory[newGlobalHistory.length - 1] !== command) {
                    newGlobalHistory.push(command);
                    if (newGlobalHistory.length > state.maxGlobalHistory) {
                        newGlobalHistory.shift();
                    }
                }
                
                return {
                    terminals: state.terminals.map(t =>
                        t.id === id
                            ? { ...t, history: newHistory, historyIndex: newHistory.length }
                            : t
                    ),
                    globalHistory: newGlobalHistory,
                };
            });
        },
        
        navigateHistory: (id, direction) => {
            set(state => {
                const terminal = state.terminals.find(t => t.id === id);
                if (!terminal || terminal.history.length === 0) return state;
                
                let newIndex = terminal.historyIndex + direction;
                newIndex = Math.max(0, Math.min(terminal.history.length, newIndex));
                
                return {
                    terminals: state.terminals.map(t =>
                        t.id === id ? { ...t, historyIndex: newIndex } : t
                    ),
                };
            });
            
            const terminal = get().terminals.find(t => t.id === id);
            if (terminal && terminal.historyIndex < terminal.history.length) {
                return terminal.history[terminal.historyIndex];
            }
            return '';
        },
        
        // ============ Panel State ============
        
        togglePanel: () => set(state => ({ isPanelOpen: !state.isPanelOpen })),
        openPanel: () => set({ isPanelOpen: true }),
        closePanel: () => set({ isPanelOpen: false }),
        
        setPanelHeight: (height) => {
            const { panelMinHeight, panelMaxHeight } = get();
            const clampedHeight = Math.max(panelMinHeight, Math.min(panelMaxHeight, height));
            set({ panelHeight: clampedHeight });
        },
        
        // ============ Split View ============
        
        toggleSplit: () => {
            const { splitView, terminals, activeTerminalId } = get();
            
            if (!splitView && terminals.length >= 2) {
                const otherTerminal = terminals.find(t => t.id !== activeTerminalId);
                set({
                    splitView: true,
                    splitTerminalId: otherTerminal?.id || null,
                });
            } else {
                set({ splitView: false, splitTerminalId: null });
            }
        },
        
        setSplitTerminal: (id) => set({ splitTerminalId: id }),
        
        // ============ Configuration ============
        
        setConfig: (config) => set(state => ({
            config: { ...state.config, ...config },
        })),
        
        setFontSize: (size) => get().setConfig({ fontSize: size }),
        setTheme: (theme) => get().setConfig({ theme }),
        
        // ============ Socket Connection ============
        
        setSocket: (socket) => {
            set({ socket, isConnected: !!socket });
            
            if (socket) {
                // Set up socket listeners
                socket.on('terminal:output', ({ id, data }) => {
                    // This will be handled by the XTermPanel component
                    // which maintains the xterm.js instance
                    const event = new CustomEvent('terminal:output', { 
                        detail: { id, data } 
                    });
                    window.dispatchEvent(event);
                });
                
                socket.on('terminal:exit', ({ id, exitCode }) => {
                    get().updateTerminal(id, { 
                        status: TerminalStatus.IDLE,
                        exitCode,
                    });
                });
                
                socket.on('terminal:error', ({ id, error }) => {
                    get().updateTerminal(id, { 
                        status: TerminalStatus.ERROR,
                    });
                    console.error(`Terminal ${id} error:`, error);
                });
                
                socket.on('terminal:cwd', ({ id, cwd }) => {
                    get().updateTerminal(id, { cwd });
                });
                
                socket.on('disconnect', () => {
                    set({ isConnected: false });
                    get().terminals.forEach(t => {
                        get().updateTerminal(t.id, { 
                            status: TerminalStatus.DISCONNECTED 
                        });
                    });
                });
                
                socket.on('connect', () => {
                    set({ isConnected: true });
                });
            }
        },
        
        disconnectSocket: () => {
            const { socket } = get();
            if (socket) {
                socket.off('terminal:output');
                socket.off('terminal:exit');
                socket.off('terminal:error');
                socket.off('terminal:cwd');
            }
            set({ socket: null, isConnected: false });
        },
        
        // ============ Resize ============
        
        resizeTerminal: (id, cols, rows) => {
            const { socket } = get();
            if (socket) {
                socket.emit('terminal:resize', { id, cols, rows });
            }
        },
        
        // ============ Helpers ============
        
        getTerminal: (id) => get().terminals.find(t => t.id === id),
        
        getActiveTerminal: () => {
            const { terminals, activeTerminalId } = get();
            return terminals.find(t => t.id === activeTerminalId);
        },
        
        hasTerminals: () => get().terminals.length > 0,
    }))
);

// ============ Selector Hooks ============

export const useTerminals = () => useTerminalStore(state => state.terminals);
export const useActiveTerminal = () => useTerminalStore(state => 
    state.terminals.find(t => t.id === state.activeTerminalId)
);
export const useTerminalConfig = () => useTerminalStore(state => state.config);
export const useIsPanelOpen = () => useTerminalStore(state => state.isPanelOpen);
export const usePanelHeight = () => useTerminalStore(state => state.panelHeight);
export const useIsConnected = () => useTerminalStore(state => state.isConnected);

export default useTerminalStore;
