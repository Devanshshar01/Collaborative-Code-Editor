import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { ViewPlugin, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { indentWithTab } from '@codemirror/commands';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { defaultKeymap, historyKeymap } from '@codemirror/commands';
import { Copy, FileCode, Users, Check, RefreshCw, Sun, Moon, Command, Play, Terminal, XCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import YjsWebSocketProvider from '../utils/yjs-provider';
import OutputPanel from './Editor/OutputPanel';

// User colors for cursors
const USER_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7'
];

const CodeEditor = ({
    roomId,
    userId,
    userName,
    fileTreeManager,
    activeFileId,
    language: initialLanguage = 'javascript',
    theme: initialTheme = 'dark',
    onSyncStatusChange,
    onUserListChange,
    onError
}) => {
    const editorRef = useRef(null);
    const viewRef = useRef(null);
    const providerRef = useRef(null);
    const ydocRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [users, setUsers] = useState([]);
    const [language, setLanguage] = useState(initialLanguage);
    const [theme, setTheme] = useState(initialTheme);
    const [copied, setCopied] = useState(false);

    // Execution state
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState(null);
    const [showOutput, setShowOutput] = useState(false);

    // Compartments for dynamic configuration
    const languageCompartment = useRef(new Compartment());
    const themeCompartment = useRef(new Compartment());

    // Language configurations
    const languageConfigs = {
        javascript: javascript(),
        python: python(),
        java: java()
    };

    // User color
    const userColor = React.useMemo(() => {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
    }, [userId]);

    // Initialize Yjs and Provider
    useEffect(() => {
        if (!roomId || !userId) return;

        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        // Use the custom provider
        const provider = new YjsWebSocketProvider(ydoc, {
            serverUrl: import.meta.env.VITE_YJS_URL || 'ws://localhost:1234',
            roomId,
            userId,
            onConnect: () => {
                setIsConnected(true);
                onSyncStatusChange?.({ connected: true, synced: false });
            },
            onDisconnect: () => {
                setIsConnected(false);
                onSyncStatusChange?.({ connected: false, synced: false });
            },
            onError: (error) => {
                console.error('Provider error:', error);
                onError?.(error);
            }
        });
        providerRef.current = provider;

        // Awareness (cursors)
        const awareness = provider.getAwareness();
        awareness.setLocalStateField('user', {
            name: userName,
            color: userColor,
            colorLight: userColor + '33' // 20% opacity for selection
        });

        // Track sync status
        const syncCheckInterval = setInterval(() => {
            const synced = provider.isSynced();
            if (synced !== isSynced) {
                setIsSynced(synced);
                onSyncStatusChange?.({ connected: isConnected, synced });
            }
        }, 1000);

        // Track online users
        const updateUsers = () => {
            const states = awareness.getStates();
            const userList = [];
            states.forEach((state, clientId) => {
                if (state.user && clientId !== awareness.clientID) {
                    userList.push({
                        id: clientId,
                        ...state.user
                    });
                }
            });
            setUsers(userList);
            onUserListChange?.(userList);
        };

        awareness.on('change', updateUsers);
        updateUsers();

        // Cleanup
        return () => {
            clearInterval(syncCheckInterval);
            awareness.off('change', updateUsers);
            provider.destroy();
            ydoc.destroy();
        };
    }, [roomId, userId, userName, userColor]);

    // Initialize CodeMirror editor
    useEffect(() => {
        if (!editorRef.current || !ydocRef.current) return;

        // Get the Y.Text for the active file, or use default if no file selected
        let ytext;
        if (activeFileId && fileTreeManager) {
            ytext = fileTreeManager.getFileContent(activeFileId);
            if (!ytext) {
                console.warn('No content found for file:', activeFileId);
                ytext = ydocRef.current.getText('codemirror'); // Fallback
            }
        } else {
            ytext = ydocRef.current.getText('codemirror'); // Default shared editor
        }

        const undoManager = new Y.UndoManager(ytext);

        // Create editor state with all extensions
        const state = EditorState.create({
            doc: ytext.toString(),
            extensions: [
                basicSetup,

                // Language support (configurable)
                languageCompartment.current.of(languageConfigs[language] || languageConfigs.javascript),

                // Theme (configurable) - VS Code Dark+
                themeCompartment.current.of(theme === 'dark' ? vscodeDark : []),

                // Yjs collaboration
                yCollab(ytext, providerRef.current?.getAwareness(), { undoManager }),

                // Key bindings
                keymap.of([
                    ...defaultKeymap,
                    ...historyKeymap,
                    ...searchKeymap,
                    ...completionKeymap,
                    ...lintKeymap,
                    ...yUndoManagerKeymap,
                    indentWithTab
                ]),

                // Editor features
                lineNumbers(),
                highlightActiveLineGutter(),
                highlightSpecialChars(),
                highlightSelectionMatches(),
                autocompletion(),

                // Custom theme adjustments
                EditorView.theme({
                    "&": {
                        height: "100%",
                        fontSize: "14px",
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                        backgroundColor: "transparent"
                    },
                    ".cm-content": {
                        padding: "0"
                    },
                    ".cm-gutters": {
                        backgroundColor: "transparent",
                        borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                        color: "#6e7681"
                    },
                    ".cm-activeLineGutter": {
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        color: "#e2e8f0"
                    },
                    ".cm-focused": {
                        outline: "none"
                    },
                    ".cm-ySelectionInfo": {
                        position: "absolute",
                        top: "-1.5em",
                        left: "0",
                        fontSize: "10px",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: "600",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        whiteSpace: "nowrap",
                        zIndex: 100,
                        boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                    },
                    ".cm-ySelectionCaretDot": {
                        display: "inline-block",
                        width: "2px",
                        height: "14px",
                        marginLeft: "-1px",
                        borderRadius: "0",
                        position: "relative",
                        top: "2px"
                    },
                    ".cm-widgetBuffer": {
                        position: "absolute",
                        width: "0",
                        height: "0",
                        visibility: "hidden"
                    }
                }),

                // Update notification
                ViewPlugin.fromClass(class {
                    constructor(view) {
                        this.view = view;
                    }

                    update(update) {
                        if (update.docChanged && !update.transactions.some(tr => tr.annotation(Y.UndoManager))) {
                            // Document changed by remote user
                            // Could trigger a toast or subtle indicator
                        }
                    }
                }),

                // Handle read-only mode when disconnected
                EditorView.editable.of(isConnected),

                // Custom cursor colors for remote users
                EditorView.theme({
                    ".cm-ySelection": {
                        opacity: 0.3
                    },
                    ".cm-yLineSelection": {
                        padding: "2px 2px",
                        borderRadius: "2px"
                    }
                })
            ]
        });

        // Create editor view
        const view = new EditorView({
            state,
            parent: editorRef.current
        });
        viewRef.current = view;

        // Cleanup
        return () => {
            view.destroy();
        };
    }, [language, theme, isConnected, activeFileId, fileTreeManager]);

    // Update language dynamically
    const changeLanguage = useCallback((newLanguage) => {
        if (viewRef.current && languageConfigs[newLanguage]) {
            viewRef.current.dispatch({
                effects: languageCompartment.current.reconfigure(languageConfigs[newLanguage])
            });
            setLanguage(newLanguage);
        }
    }, []);

    // Update theme dynamically
    const changeTheme = useCallback((newTheme) => {
        if (viewRef.current) {
            viewRef.current.dispatch({
                effects: themeCompartment.current.reconfigure(newTheme === 'dark' ? vscodeDark : [])
            });
            setTheme(newTheme);
        }
    }, []);

    // Get current code
    const getCode = useCallback(() => {
        return viewRef.current?.state.doc.toString() || '';
    }, []);

    // Format code (placeholder - would need prettier integration)
    const formatCode = useCallback(() => {
        // This would integrate with prettier or another formatter
        console.log('Format code not yet implemented');
    }, []);

    const handleCopy = () => {
        const code = getCode();
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRunCode = async () => {
        const code = getCode();
        if (!code.trim()) return;

        setIsRunning(true);
        setShowOutput(true);
        setOutput(null);

        try {
            // Check if backend execution service is available
            const response = await fetch('http://localhost:4000/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    language,
                }),
            });

            if (!response.ok) {
                // If backend is not running or returns error, fallback to client-side for JS
                if (language === 'javascript') {
                    try {
                        // Capture console.log output
                        const logs = [];
                        const originalLog = console.log;
                        console.log = (...args) => {
                            logs.push(args.map(arg =>
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                            ).join(' '));
                            originalLog(...args);
                        };

                        // Execute code safely
                        // eslint-disable-next-line no-new-func
                        new Function(code)();

                        console.log = originalLog;

                        setOutput({
                            stdout: logs.join('\n') || 'Code executed successfully (no output)',
                            stderr: '',
                            exitCode: 0
                        });
                    } catch (err) {
                        setOutput({
                            stdout: '',
                            stderr: err.toString(),
                            exitCode: 1
                        });
                    }
                } else {
                    throw new Error(`Execution service unavailable. Client-side execution not supported for ${language}.`);
                }
            } else {
                const result = await response.json();
                setOutput(result);
            }
        } catch (error) {
            console.error('Execution failed:', error);

            // Fallback for JS if fetch failed
            if (language === 'javascript') {
                try {
                    const logs = [];
                    const originalLog = console.log;
                    console.log = (...args) => {
                        logs.push(args.map(arg =>
                            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                        ).join(' '));
                        originalLog(...args);
                    };

                    // eslint-disable-next-line no-new-func
                    new Function(code)();

                    console.log = originalLog;

                    setOutput({
                        stdout: logs.join('\n') || 'Code executed successfully (no output)',
                        stderr: '',
                        exitCode: 0
                    });
                } catch (err) {
                    setOutput({
                        stdout: '',
                        stderr: err.toString(),
                        exitCode: 1
                    });
                }
            } else {
                setOutput({
                    stdout: '',
                    stderr: `Error: ${error.message}\n\nMake sure the backend execution service is running on port 4000.`,
                    exitCode: 1
                });
            }
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface-dark/50 backdrop-blur-sm rounded-xl overflow-hidden border border-white/5 shadow-xl">
            {/* Status bar */}
            <div className="flex justify-between items-center px-4 py-2 bg-surface border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/5">
                        <div className={clsx(
                            "w-2 h-2 rounded-full animate-pulse",
                            isConnected ? (isSynced ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-yellow-500") : "bg-red-500"
                        )} />
                        <span className="text-xs font-medium text-text-secondary">
                            {isConnected ? (isSynced ? 'Synced' : 'Syncing...') : 'Offline'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Room: <span className="text-text-primary font-mono">{roomId}</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Run Button */}
                    <button
                        onClick={handleRunCode}
                        disabled={isRunning}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-lg",
                            isRunning
                                ? "bg-white/10 text-text-muted cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-500 text-white shadow-green-600/20"
                        )}
                    >
                        {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        Run
                    </button>

                    <div className="h-4 w-px bg-white/10 mx-1" />

                    <div className="relative group">
                        <select
                            value={language}
                            onChange={(e) => changeLanguage(e.target.value)}
                            className="appearance-none bg-surface-light border border-white/10 text-text-primary px-3 py-1 pr-8 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-white/10 transition-colors"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-3 h-3 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    <button
                        onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-yellow-400 transition-all"
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 mr-2">
                        {users.slice(0, 5).map((user) => (
                            <div
                                key={user.id}
                                title={user.name}
                                className="w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                                style={{ backgroundColor: user.color }}
                            >
                                {user.name[0].toUpperCase()}
                            </div>
                        ))}
                        {users.length > 5 && (
                            <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-light flex items-center justify-center text-[10px] font-bold text-text-secondary">
                                +{users.length - 5}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-secondary bg-white/5 px-2 py-1 rounded-md">
                        <Users className="w-3.5 h-3.5" />
                        <span>{users.length + 1}</span>
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 relative overflow-hidden bg-[#1e1e1e] flex flex-col">
                <div className="flex-1 relative">
                    <div
                        ref={editorRef}
                        className="h-full w-full overflow-auto custom-scrollbar"
                    />
                </div>

                {/* Output Panel */}
                {showOutput && (
                    <div className="h-1/3 border-t border-white/10 flex flex-col animate-slide-up bg-surface">
                        <OutputPanel
                            output={output}
                            isRunning={isRunning}
                            onClose={() => setShowOutput(false)}
                            className="h-full"
                        />
                    </div>
                )}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface border-t border-white/5 text-xs">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowOutput(!showOutput)}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all border",
                            showOutput
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary border-white/5 hover:border-white/10"
                        )}
                    >
                        <Terminal className="w-3.5 h-3.5" />
                        Console
                    </button>

                    <button
                        onClick={formatCode}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all border border-white/5 hover:border-white/10"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Format
                    </button>

                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all border border-white/5 hover:border-white/10"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <div className="flex items-center gap-4 text-text-muted font-mono text-[10px] opacity-60">
                    <span className="flex items-center gap-1"><Command className="w-3 h-3" />Z Undo</span>
                    <span className="flex items-center gap-1"><Command className="w-3 h-3" />Y Redo</span>
                    <span className="flex items-center gap-1"><Command className="w-3 h-3" />F Find</span>
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;