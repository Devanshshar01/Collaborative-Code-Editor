/**
 * Enhanced CodeEditor Component
 * VS Code/IntelliJ-level IDE features with LSP integration
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as Y from 'yjs';
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next';
import { EditorView, keymap as cmKeymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, ViewPlugin, Decoration } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { EditorState, Compartment, StateEffect, StateField } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { indentWithTab, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { autocompletion, completionKeymap, acceptCompletion, startCompletion } from '@codemirror/autocomplete';
import { linter, lintGutter, lintKeymap } from '@codemirror/lint';
import { searchKeymap, highlightSelectionMatches, search, openSearchPanel } from '@codemirror/search';
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import {
    Copy, FileCode, Users, Check, RefreshCw, Sun, Moon, Command, Play,
    Terminal, XCircle, Loader2, Bug, TestTube, Code2, Search, Settings,
    Sparkles, AlertCircle, ChevronRight, Layers, Eye, GitBranch, Palette,
    Keyboard, Zap, FileSearch, Replace, BookOpen, Braces, MoreHorizontal
} from 'lucide-react';
import clsx from 'clsx';
import YjsWebSocketProvider from '../utils/yjs-provider';

// Import IDE components
import DiagnosticsPanel from './DiagnosticsPanel';
import DebugPanel from './DebugPanel';
import TestRunnerPanel from './TestRunnerPanel';
import REPLPanel from './REPLPanel';

// User colors for cursors
const USER_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7'
];

// Language configurations
const LANGUAGE_CONFIGS = {
    javascript: { ext: javascript(), name: 'JavaScript', icon: '🟨', extensions: ['.js', '.jsx', '.mjs'] },
    typescript: { ext: javascript({ typescript: true, jsx: true }), name: 'TypeScript', icon: '🔷', extensions: ['.ts', '.tsx'] },
    python: { ext: python(), name: 'Python', icon: '🐍', extensions: ['.py', '.pyi'] },
    java: { ext: java(), name: 'Java', icon: '☕', extensions: ['.java'] },
    cpp: { ext: cpp(), name: 'C++', icon: '⚙️', extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h'] },
    c: { ext: cpp(), name: 'C', icon: '🔧', extensions: ['.c', '.h'] },
    rust: { ext: rust(), name: 'Rust', icon: '🦀', extensions: ['.rs'] },
    go: { ext: go(), name: 'Go', icon: '🐹', extensions: ['.go'] },
    html: { ext: html(), name: 'HTML', icon: '🌐', extensions: ['.html', '.htm'] },
    css: { ext: css(), name: 'CSS', icon: '🎨', extensions: ['.css', '.scss', '.less'] },
    json: { ext: json(), name: 'JSON', icon: '📋', extensions: ['.json'] },
};

// Bottom panel tabs
const BOTTOM_PANELS = {
    output: { label: 'Output', icon: Terminal },
    problems: { label: 'Problems', icon: AlertCircle },
    debug: { label: 'Debug Console', icon: Bug },
    terminal: { label: 'Terminal', icon: Terminal },
};

// Side panel tabs
const SIDE_PANELS = {
    explorer: { label: 'Explorer', icon: FileCode },
    search: { label: 'Search', icon: Search },
    git: { label: 'Source Control', icon: GitBranch },
    debug: { label: 'Run and Debug', icon: Bug },
    testing: { label: 'Testing', icon: TestTube },
};

const EnhancedCodeEditor = ({
    roomId,
    userId,
    userName,
    fileTreeManager,
    activeFileId,
    language: initialLanguage = 'javascript',
    theme: initialTheme = 'dark',
    onSyncStatusChange,
    onUserListChange,
    onError,
    // LSP integration
    lspClient,
    // Debug integration
    debugManager,
    // Test integration
    testRunner,
}) => {
    const editorRef = useRef(null);
    const viewRef = useRef(null);
    const providerRef = useRef(null);
    const ydocRef = useRef(null);
    
    // Connection state
    const [isConnected, setIsConnected] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [users, setUsers] = useState([]);
    
    // Editor state
    const [language, setLanguage] = useState(initialLanguage);
    const [theme, setTheme] = useState(initialTheme);
    const [copied, setCopied] = useState(false);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
    
    // Execution state
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState(null);
    
    // Panel state
    const [activeBottomPanel, setActiveBottomPanel] = useState('output');
    const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
    const [showBottomPanel, setShowBottomPanel] = useState(false);
    const [activeSidePanel, setActiveSidePanel] = useState('explorer');
    const [showSidePanel, setShowSidePanel] = useState(true);
    const [sidePanelWidth, setSidePanelWidth] = useState(250);
    
    // LSP state
    const [diagnostics, setDiagnostics] = useState(new Map());
    const [lspStatus, setLspStatus] = useState('disconnected');
    
    // Debug state
    const [debugState, setDebugState] = useState('idle');
    const [breakpoints, setBreakpoints] = useState([]);
    const [callStack, setCallStack] = useState([]);
    const [variables, setVariables] = useState({ local: [], global: [] });
    const [watchExpressions, setWatchExpressions] = useState([]);
    
    // Test state
    const [testSuites, setTestSuites] = useState([]);
    const [testSummary, setTestSummary] = useState({ total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 });
    const [isTestRunning, setIsTestRunning] = useState(false);
    
    // REPL state
    const [replEntries, setReplEntries] = useState([]);
    const [replLanguage, setReplLanguage] = useState('javascript');
    const [isReplExecuting, setIsReplExecuting] = useState(false);
    
    // Minimap state
    const [showMinimap, setShowMinimap] = useState(true);
    
    // Compartments for dynamic configuration
    const languageCompartment = useRef(new Compartment());
    const themeCompartment = useRef(new Compartment());
    const readOnlyCompartment = useRef(new Compartment());
    
    // User color based on userId
    const userColor = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
    }, [userId]);

    // Detect language from file extension
    const detectLanguage = useCallback((filename) => {
        if (!filename) return 'javascript';
        const ext = '.' + filename.split('.').pop()?.toLowerCase();
        for (const [lang, config] of Object.entries(LANGUAGE_CONFIGS)) {
            if (config.extensions.includes(ext)) {
                return lang;
            }
        }
        return 'javascript';
    }, []);

    // LSP diagnostics to CodeMirror lint
    const createLinter = useCallback(() => {
        return linter(async (view) => {
            const fileDiagnostics = diagnostics.get(activeFileId) || [];
            return fileDiagnostics.map(d => ({
                from: view.state.doc.line(d.range.start.line + 1).from + d.range.start.character,
                to: view.state.doc.line(d.range.end.line + 1).from + d.range.end.character,
                severity: d.severity === 1 ? 'error' : d.severity === 2 ? 'warning' : 'info',
                message: d.message,
                source: d.source,
            }));
        }, { delay: 300 });
    }, [diagnostics, activeFileId]);

    // Custom autocomplete with LSP
    const lspAutocomplete = useCallback(() => {
        return autocompletion({
            override: [
                async (context) => {
                    if (!lspClient?.isConnected()) {
                        return null;
                    }
                    
                    const pos = context.pos;
                    const line = context.state.doc.lineAt(pos);
                    const lineText = line.text;
                    const column = pos - line.from;
                    
                    // Check if we should trigger completion
                    const wordBefore = context.matchBefore(/\w*/);
                    if (!wordBefore || wordBefore.from === wordBefore.to) {
                        // Check for trigger characters
                        const triggerChars = ['.', ':', '<', '"', "'", '/', '@', '('];
                        const charBefore = lineText[column - 1];
                        if (!triggerChars.includes(charBefore)) {
                            return null;
                        }
                    }
                    
                    try {
                        const completions = await lspClient.getCompletions(
                            activeFileId,
                            { line: line.number - 1, character: column }
                        );
                        
                        if (!completions || completions.length === 0) {
                            return null;
                        }
                        
                        return {
                            from: wordBefore?.from ?? pos,
                            options: completions.map(c => ({
                                label: c.label,
                                type: c.kind ? getCompletionType(c.kind) : 'text',
                                detail: c.detail,
                                info: c.documentation,
                                boost: c.sortText ? -parseInt(c.sortText, 10) : 0,
                                apply: c.insertText || c.label,
                            })),
                        };
                    } catch (error) {
                        console.error('LSP completion error:', error);
                        return null;
                    }
                },
            ],
            activateOnTyping: true,
            maxRenderedOptions: 50,
        });
    }, [lspClient, activeFileId]);

    // Initialize Yjs and Provider
    useEffect(() => {
        if (!roomId || !userId) return;

        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

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
            colorLight: userColor + '33'
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

        // Get the Y.Text for the active file
        let ytext;
        if (activeFileId && fileTreeManager) {
            ytext = fileTreeManager.getFileContent(activeFileId);
            if (!ytext) {
                ytext = ydocRef.current.getText('codemirror');
            }
        } else {
            ytext = ydocRef.current.getText('codemirror');
        }

        const undoManager = new Y.UndoManager(ytext);
        const langConfig = LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS.javascript;

        // Create editor state with enhanced extensions
        const state = EditorState.create({
            doc: ytext.toString(),
            extensions: [
                basicSetup,
                
                // Language support
                languageCompartment.current.of(langConfig.ext),
                
                // Theme
                themeCompartment.current.of(theme === 'dark' ? vscodeDark : []),
                
                // Yjs collaboration
                yCollab(ytext, providerRef.current?.getAwareness(), { undoManager }),
                
                // Key bindings
                cmKeymap.of([
                    ...defaultKeymap,
                    ...historyKeymap,
                    ...searchKeymap,
                    ...completionKeymap,
                    ...closeBracketsKeymap,
                    ...lintKeymap,
                    ...yUndoManagerKeymap,
                    indentWithTab,
                    // Custom keybindings
                    { key: 'Ctrl-Space', run: startCompletion },
                    { key: 'F12', run: () => handleGoToDefinition() },
                    { key: 'Shift-F12', run: () => handleFindReferences() },
                    { key: 'F2', run: () => handleRename() },
                    { key: 'Ctrl-Shift-P', run: () => handleCommandPalette() },
                    { key: 'Ctrl-`', run: () => setShowBottomPanel(p => !p) },
                ]),
                
                // Editor features
                lineNumbers(),
                highlightActiveLineGutter(),
                highlightSpecialChars(),
                highlightSelectionMatches(),
                bracketMatching(),
                closeBrackets(),
                foldGutter(),
                indentOnInput(),
                search({ top: true }),
                lintGutter(),
                
                // LSP features
                createLinter(),
                lspAutocomplete(),
                
                // Cursor position tracking
                ViewPlugin.fromClass(class {
                    update(update) {
                        if (update.selectionSet) {
                            const pos = update.state.selection.main.head;
                            const line = update.state.doc.lineAt(pos);
                            setCursorPosition({
                                line: line.number,
                                column: pos - line.from + 1
                            });
                        }
                    }
                }),
                
                // Read-only when disconnected
                readOnlyCompartment.current.of(EditorView.editable.of(isConnected)),
                
                // Custom theme
                EditorView.theme({
                    "&": {
                        height: "100%",
                        fontSize: "13px",
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                        backgroundColor: "#1e1e1e"
                    },
                    ".cm-content": {
                        padding: "0"
                    },
                    ".cm-gutters": {
                        backgroundColor: "#1e1e1e",
                        borderRight: "1px solid #333",
                        color: "#6e7681"
                    },
                    ".cm-activeLineGutter": {
                        backgroundColor: "#2a2d2e",
                        color: "#c6c6c6"
                    },
                    ".cm-activeLine": {
                        backgroundColor: "#2a2d2e80"
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
                        boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
                    },
                    ".cm-tooltip": {
                        backgroundColor: "#252526",
                        border: "1px solid #454545",
                        borderRadius: "4px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                    },
                    ".cm-tooltip-autocomplete": {
                        "& > ul > li": {
                            padding: "4px 8px"
                        },
                        "& > ul > li[aria-selected]": {
                            backgroundColor: "#094771"
                        }
                    },
                    ".cm-diagnostic-error": {
                        borderBottom: "2px wavy #f14c4c"
                    },
                    ".cm-diagnostic-warning": {
                        borderBottom: "2px wavy #cca700"
                    },
                    ".cm-diagnostic-info": {
                        borderBottom: "2px wavy #3794ff"
                    }
                })
            ]
        });

        const view = new EditorView({
            state,
            parent: editorRef.current
        });
        viewRef.current = view;

        return () => {
            view.destroy();
        };
    }, [language, theme, isConnected, activeFileId, fileTreeManager, createLinter, lspAutocomplete]);

    // Update language dynamically
    const changeLanguage = useCallback((newLanguage) => {
        if (viewRef.current && LANGUAGE_CONFIGS[newLanguage]) {
            viewRef.current.dispatch({
                effects: languageCompartment.current.reconfigure(LANGUAGE_CONFIGS[newLanguage].ext)
            });
            setLanguage(newLanguage);
        }
    }, []);

    // Get current code
    const getCode = useCallback(() => {
        return viewRef.current?.state.doc.toString() || '';
    }, []);

    // Handle LSP go to definition
    const handleGoToDefinition = useCallback(async () => {
        if (!lspClient?.isConnected() || !viewRef.current) return false;
        
        const pos = viewRef.current.state.selection.main.head;
        const line = viewRef.current.state.doc.lineAt(pos);
        
        try {
            const definition = await lspClient.getDefinition(activeFileId, {
                line: line.number - 1,
                character: pos - line.from
            });
            
            if (definition) {
                // Navigate to definition (would integrate with file tree)
                console.log('Go to definition:', definition);
            }
        } catch (error) {
            console.error('Go to definition error:', error);
        }
        return true;
    }, [lspClient, activeFileId]);

    // Handle find references
    const handleFindReferences = useCallback(async () => {
        if (!lspClient?.isConnected() || !viewRef.current) return false;
        
        const pos = viewRef.current.state.selection.main.head;
        const line = viewRef.current.state.doc.lineAt(pos);
        
        try {
            const references = await lspClient.getReferences(activeFileId, {
                line: line.number - 1,
                character: pos - line.from
            });
            
            if (references && references.length > 0) {
                console.log('References:', references);
                // Show references panel
            }
        } catch (error) {
            console.error('Find references error:', error);
        }
        return true;
    }, [lspClient, activeFileId]);

    // Handle rename
    const handleRename = useCallback(async () => {
        if (!lspClient?.isConnected() || !viewRef.current) return false;
        
        // Would show rename dialog
        console.log('Rename symbol');
        return true;
    }, [lspClient]);

    // Handle command palette
    const handleCommandPalette = useCallback(() => {
        // Would show command palette
        console.log('Open command palette');
        return true;
    }, []);

    // Run code
    const handleRunCode = async () => {
        const code = getCode();
        if (!code.trim()) return;

        setIsRunning(true);
        setShowBottomPanel(true);
        setActiveBottomPanel('output');
        setOutput(null);

        try {
            const response = await fetch('http://localhost:4000/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language }),
            });

            if (!response.ok) {
                // Fallback for JS
                if (language === 'javascript') {
                    const logs = [];
                    const originalLog = console.log;
                    console.log = (...args) => {
                        logs.push(args.map(arg =>
                            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                        ).join(' '));
                        originalLog(...args);
                    };
                    try {
                        new Function(code)();
                        console.log = originalLog;
                        setOutput({
                            stdout: logs.join('\n') || 'Code executed successfully',
                            stderr: '',
                            exitCode: 0
                        });
                    } catch (err) {
                        console.log = originalLog;
                        setOutput({ stdout: '', stderr: err.toString(), exitCode: 1 });
                    }
                } else {
                    throw new Error(`Execution service unavailable for ${language}`);
                }
            } else {
                setOutput(await response.json());
            }
        } catch (error) {
            setOutput({
                stdout: '',
                stderr: `Error: ${error.message}`,
                exitCode: 1
            });
        } finally {
            setIsRunning(false);
        }
    };

    // Copy code
    const handleCopy = () => {
        navigator.clipboard.writeText(getCode());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Count diagnostics
    const diagnosticCounts = useMemo(() => {
        const counts = { errors: 0, warnings: 0, info: 0 };
        for (const [, fileDiags] of diagnostics) {
            for (const d of fileDiags) {
                if (d.severity === 1) counts.errors++;
                else if (d.severity === 2) counts.warnings++;
                else counts.info++;
            }
        }
        return counts;
    }, [diagnostics]);

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between h-9 px-2 bg-[#3c3c3c] border-b border-[#252526]">
                {/* Left section */}
                <div className="flex items-center gap-2">
                    {/* Sync Status */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs">
                        <div className={clsx(
                            "w-2 h-2 rounded-full",
                            isConnected ? (isSynced ? "bg-green-500" : "bg-yellow-500 animate-pulse") : "bg-red-500"
                        )} />
                        <span className="text-[#cccccc]">
                            {isConnected ? (isSynced ? 'Synced' : 'Syncing...') : 'Offline'}
                        </span>
                    </div>
                    
                    <div className="h-4 w-px bg-[#555]" />
                    
                    {/* Room Info */}
                    <div className="flex items-center gap-1.5 text-xs text-[#858585]">
                        <FileCode className="w-3.5 h-3.5" />
                        <span className="font-mono">{roomId}</span>
                    </div>
                </div>

                {/* Center section - Actions */}
                <div className="flex items-center gap-1">
                    {/* Run */}
                    <button
                        onClick={handleRunCode}
                        disabled={isRunning}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors",
                            isRunning
                                ? "bg-[#555] text-[#858585] cursor-not-allowed"
                                : "bg-[#0e639c] hover:bg-[#1177bb] text-white"
                        )}
                    >
                        {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Run
                    </button>

                    {/* Debug */}
                    <button
                        onClick={() => { setActiveSidePanel('debug'); setShowSidePanel(true); }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[#cccccc] hover:bg-[#505050] transition-colors"
                    >
                        <Bug className="w-3.5 h-3.5 text-[#f48771]" />
                        Debug
                    </button>

                    {/* Test */}
                    <button
                        onClick={() => { setActiveSidePanel('testing'); setShowSidePanel(true); }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[#cccccc] hover:bg-[#505050] transition-colors"
                    >
                        <TestTube className="w-3.5 h-3.5 text-[#73c991]" />
                        Test
                    </button>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-2">
                    {/* Language selector */}
                    <select
                        value={language}
                        onChange={(e) => changeLanguage(e.target.value)}
                        className="bg-[#3c3c3c] border border-[#555] text-[#cccccc] px-2 py-0.5 rounded text-xs focus:outline-none focus:border-[#007acc]"
                    >
                        {Object.entries(LANGUAGE_CONFIGS).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.icon} {cfg.name}</option>
                        ))}
                    </select>

                    {/* Users */}
                    <div className="flex items-center gap-1">
                        <div className="flex -space-x-1.5">
                            {users.slice(0, 4).map((user) => (
                                <div
                                    key={user.id}
                                    title={user.name}
                                    className="w-5 h-5 rounded-full border border-[#1e1e1e] flex items-center justify-center text-[9px] font-bold text-white"
                                    style={{ backgroundColor: user.color }}
                                >
                                    {user.name[0].toUpperCase()}
                                </div>
                            ))}
                        </div>
                        <span className="text-xs text-[#858585] ml-1">
                            <Users className="w-3.5 h-3.5 inline mr-0.5" />
                            {users.length + 1}
                        </span>
                    </div>

                    {/* Settings */}
                    <button className="p-1 rounded hover:bg-[#505050]">
                        <Settings className="w-4 h-4 text-[#858585]" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Side Panel */}
                {showSidePanel && (
                    <div 
                        className="flex flex-col bg-[#252526] border-r border-[#1e1e1e]"
                        style={{ width: sidePanelWidth }}
                    >
                        {/* Side Panel Tabs */}
                        <div className="flex items-center h-9 border-b border-[#1e1e1e] px-1">
                            {Object.entries(SIDE_PANELS).map(([key, panel]) => {
                                const Icon = panel.icon;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setActiveSidePanel(key)}
                                        title={panel.label}
                                        className={clsx(
                                            "p-1.5 rounded",
                                            activeSidePanel === key
                                                ? "text-white"
                                                : "text-[#858585] hover:text-[#cccccc]"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* Side Panel Content */}
                        <div className="flex-1 overflow-auto">
                            {activeSidePanel === 'debug' && (
                                <DebugPanel
                                    state={debugState}
                                    breakpoints={breakpoints}
                                    callStack={callStack}
                                    variables={variables}
                                    watchExpressions={watchExpressions}
                                    className="h-full"
                                />
                            )}
                            {activeSidePanel === 'testing' && (
                                <TestRunnerPanel
                                    suites={testSuites}
                                    summary={testSummary}
                                    isRunning={isTestRunning}
                                    className="h-full"
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Editor Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Tab Bar */}
                    <div className="flex items-center h-9 bg-[#252526] border-b border-[#1e1e1e] px-1">
                        <div className="flex items-center gap-0.5 px-3 py-1.5 bg-[#1e1e1e] text-[#cccccc] text-xs rounded-t border-t border-x border-[#1e1e1e]">
                            <FileCode className="w-3.5 h-3.5 mr-1.5 text-[#519aba]" />
                            {activeFileId || 'Untitled'}
                            <button className="ml-2 hover:bg-[#333] rounded p-0.5">
                                <XCircle className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 relative">
                        <div ref={editorRef} className="h-full w-full overflow-auto" />
                        
                        {/* Minimap (placeholder) */}
                        {showMinimap && (
                            <div className="absolute top-0 right-0 w-[80px] h-full bg-[#1e1e1e] border-l border-[#333] opacity-50" />
                        )}
                    </div>

                    {/* Bottom Panel */}
                    {showBottomPanel && (
                        <div 
                            className="flex flex-col bg-[#1e1e1e] border-t border-[#333]"
                            style={{ height: bottomPanelHeight }}
                        >
                            {/* Bottom Panel Tabs */}
                            <div className="flex items-center h-8 bg-[#252526] px-2">
                                {Object.entries(BOTTOM_PANELS).map(([key, panel]) => {
                                    const Icon = panel.icon;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setActiveBottomPanel(key)}
                                            className={clsx(
                                                "flex items-center gap-1.5 px-2 py-1 text-xs rounded",
                                                activeBottomPanel === key
                                                    ? "text-[#cccccc] bg-[#1e1e1e]"
                                                    : "text-[#858585] hover:text-[#cccccc]"
                                            )}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {panel.label}
                                            {key === 'problems' && diagnosticCounts.errors > 0 && (
                                                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                                                    {diagnosticCounts.errors}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                                <div className="flex-1" />
                                <button
                                    onClick={() => setShowBottomPanel(false)}
                                    className="p-1 hover:bg-[#333] rounded"
                                >
                                    <XCircle className="w-3.5 h-3.5 text-[#858585]" />
                                </button>
                            </div>

                            {/* Bottom Panel Content */}
                            <div className="flex-1 overflow-auto">
                                {activeBottomPanel === 'output' && (
                                    <div className="p-3 font-mono text-xs">
                                        {output ? (
                                            <>
                                                {output.stdout && (
                                                    <pre className="text-[#cccccc] whitespace-pre-wrap">{output.stdout}</pre>
                                                )}
                                                {output.stderr && (
                                                    <pre className="text-red-400 whitespace-pre-wrap mt-2">{output.stderr}</pre>
                                                )}
                                                <div className="mt-3 text-[10px] text-[#858585]">
                                                    Exit code: {output.exitCode}
                                                </div>
                                            </>
                                        ) : isRunning ? (
                                            <div className="flex items-center gap-2 text-[#858585]">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Running...
                                            </div>
                                        ) : (
                                            <div className="text-[#858585]">No output</div>
                                        )}
                                    </div>
                                )}
                                
                                {activeBottomPanel === 'problems' && (
                                    <DiagnosticsPanel
                                        diagnostics={diagnostics}
                                        className="h-full"
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between h-6 px-2 bg-[#007acc] text-white text-xs">
                <div className="flex items-center gap-3">
                    {/* Git branch (placeholder) */}
                    <div className="flex items-center gap-1">
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>main</span>
                    </div>
                    
                    {/* Errors/Warnings */}
                    <div className="flex items-center gap-2">
                        {diagnosticCounts.errors > 0 && (
                            <span className="flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                {diagnosticCounts.errors}
                            </span>
                        )}
                        {diagnosticCounts.warnings > 0 && (
                            <span className="flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {diagnosticCounts.warnings}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Cursor Position */}
                    <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
                    
                    {/* Language */}
                    <span>{LANGUAGE_CONFIGS[language]?.name || language}</span>
                    
                    {/* Encoding */}
                    <span>UTF-8</span>
                    
                    {/* LSP Status */}
                    <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {lspStatus === 'connected' ? 'LSP' : 'No LSP'}
                    </span>
                </div>
            </div>
        </div>
    );
};

// Helper function to convert LSP completion kind to CodeMirror type
function getCompletionType(kind) {
    const types = {
        1: 'text', 2: 'method', 3: 'function', 4: 'constructor',
        5: 'field', 6: 'variable', 7: 'class', 8: 'interface',
        9: 'module', 10: 'property', 11: 'unit', 12: 'value',
        13: 'enum', 14: 'keyword', 15: 'snippet', 16: 'text',
        17: 'file', 18: 'reference', 19: 'folder', 20: 'enummember',
        21: 'constant', 22: 'struct', 23: 'event', 24: 'operator',
        25: 'typeparameter',
    };
    return types[kind] || 'text';
}

export default EnhancedCodeEditor;
