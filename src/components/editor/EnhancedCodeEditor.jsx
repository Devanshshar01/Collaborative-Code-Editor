/**
 * Enhanced Code Editor - VS Code style editor with full code intelligence
 * Features: LSP integration, autocomplete, diagnostics, find/replace, minimap
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as Y from 'yjs';
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next';
import { EditorView, Decoration, DecorationSet, ViewPlugin, WidgetType } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { EditorState, Compartment, StateField, StateEffect } from '@codemirror/state';
import { keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { sql } from '@codemirror/lang-sql';
import { rust } from '@codemirror/lang-rust';
import { indentWithTab } from '@codemirror/commands';
import { autocompletion, completionKeymap, startCompletion } from '@codemirror/autocomplete';
import { lintKeymap, lintGutter, setDiagnostics } from '@codemirror/lint';
import { searchKeymap, highlightSelectionMatches, search, openSearchPanel, closeSearchPanel } from '@codemirror/search';
import { defaultKeymap, historyKeymap } from '@codemirror/commands';
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import {
  Copy, FileCode, Users, Check, RefreshCw, Sun, Moon, Command, Play, Terminal,
  XCircle, Loader2, Search, Settings, ChevronRight, Maximize2, Minimize2
} from 'lucide-react';
import clsx from 'clsx';
import YjsWebSocketProvider from '../utils/yjs-provider';

// Import editor components
import {
  EditorToolbar,
  DiagnosticsPanel,
  CompletionPopup,
  SignatureHelp,
  HoverInfo,
  Minimap,
  Breadcrumbs,
  GoToDefinitionPanel,
  FindReplace,
  themes,
  getThemeByName,
} from './editor';
import { LSPManager } from '../../services/lsp-manager.js';

// User colors for cursors
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7'
];

// Language configurations
const LANGUAGE_CONFIGS = {
  javascript: { extension: javascript(), name: 'JavaScript', icon: '🟨' },
  typescript: { extension: javascript({ typescript: true }), name: 'TypeScript', icon: '🔷' },
  python: { extension: python(), name: 'Python', icon: '🐍' },
  java: { extension: java(), name: 'Java', icon: '☕' },
  cpp: { extension: cpp(), name: 'C++', icon: '⚙️' },
  c: { extension: cpp(), name: 'C', icon: '🔧' },
  html: { extension: html(), name: 'HTML', icon: '🌐' },
  css: { extension: css(), name: 'CSS', icon: '🎨' },
  json: { extension: json(), name: 'JSON', icon: '📋' },
  markdown: { extension: markdown(), name: 'Markdown', icon: '📝' },
  sql: { extension: sql(), name: 'SQL', icon: '🗃️' },
  rust: { extension: rust(), name: 'Rust', icon: '🦀' },
};

// Font families
const FONT_FAMILIES = [
  { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
  { value: "'Fira Code', monospace", label: 'Fira Code' },
  { value: "'Source Code Pro', monospace", label: 'Source Code Pro' },
  { value: "'Cascadia Code', monospace", label: 'Cascadia Code' },
  { value: "'Monaco', monospace", label: 'Monaco' },
  { value: "'Consolas', monospace", label: 'Consolas' },
  { value: "'Ubuntu Mono', monospace", label: 'Ubuntu Mono' },
];

const EnhancedCodeEditor = ({
  roomId,
  userId,
  userName,
  fileTreeManager,
  activeFileId,
  activeFilePath = [],
  language: initialLanguage = 'javascript',
  theme: initialTheme = 'dark',
  fontSize: initialFontSize = 14,
  fontFamily: initialFontFamily = "'JetBrains Mono', monospace",
  onSyncStatusChange,
  onUserListChange,
  onError,
  onFileChange,
  readOnly = false,
}) => {
  // Refs
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const providerRef = useRef(null);
  const ydocRef = useRef(null);
  const lspRef = useRef(null);

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [users, setUsers] = useState([]);

  // Editor configuration state
  const [language, setLanguage] = useState(initialLanguage);
  const [themeName, setThemeName] = useState(initialTheme);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [fontFamily, setFontFamily] = useState(initialFontFamily);
  const [showMinimap, setShowMinimap] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // UI state
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState(null);

  // Code intelligence state
  const [diagnostics, setDiagnostics] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [completionPosition, setCompletionPosition] = useState({ x: 0, y: 0 });
  const [showCompletions, setShowCompletions] = useState(false);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [showHover, setShowHover] = useState(false);
  const [signatureHelp, setSignatureHelp] = useState(null);
  const [definitions, setDefinitions] = useState([]);
  const [showDefinitions, setShowDefinitions] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);

  // Viewport state for minimap
  const [viewportInfo, setViewportInfo] = useState({
    start: 0,
    end: 0,
    total: 0,
  });

  // Compartments for dynamic configuration
  const languageCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const fontSizeCompartment = useRef(new Compartment());
  const wordWrapCompartment = useRef(new Compartment());

  // User color
  const userColor = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
  }, [userId]);

  // Initialize LSP Manager
  useEffect(() => {
    lspRef.current = new LSPManager();
    return () => {
      lspRef.current = null;
    };
  }, []);

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

  // Get current theme extension
  const getThemeExtension = useCallback(() => {
    const themeConfig = getThemeByName(themeName);
    if (themeConfig) {
      return themeConfig.extension;
    }
    return themes.dark.extension;
  }, [themeName]);

  // Initialize CodeMirror editor
  useEffect(() => {
    if (!editorRef.current || !ydocRef.current) return;

    // Get the Y.Text for the active file
    let ytext;
    if (activeFileId && fileTreeManager) {
      ytext = fileTreeManager.getFileContent(activeFileId);
      if (!ytext) {
        console.warn('No content found for file:', activeFileId);
        ytext = ydocRef.current.getText('codemirror');
      }
    } else {
      ytext = ydocRef.current.getText('codemirror');
    }

    const undoManager = new Y.UndoManager(ytext);

    // Create editor state with all extensions
    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,

        // Language support
        languageCompartment.current.of(
          LANGUAGE_CONFIGS[language]?.extension || LANGUAGE_CONFIGS.javascript.extension
        ),

        // Theme
        themeCompartment.current.of(getThemeExtension()),

        // Font size
        fontSizeCompartment.current.of(EditorView.theme({
          '&': { fontSize: `${fontSize}px` },
          '.cm-content': { fontFamily },
          '.cm-gutters': { fontFamily },
        })),

        // Word wrap
        wordWrapCompartment.current.of(wordWrap ? EditorView.lineWrapping : []),

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
          indentWithTab,
          // Custom keybindings
          { key: 'Ctrl-Space', run: startCompletion },
          { key: 'Ctrl-f', run: () => { setShowFindReplace(true); return true; } },
          { key: 'Ctrl-Shift-f', run: () => { setShowFindReplace(true); return true; } },
          { key: 'F12', run: () => { handleGoToDefinition(); return true; } },
          { key: 'Ctrl-Shift-p', run: () => { /* Open command palette */ return true; } },
        ]),

        // Editor features
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        highlightSelectionMatches(),
        bracketMatching(),
        foldGutter(),
        indentOnInput(),
        drawSelection(),
        lintGutter(),

        // Autocompletion
        autocompletion({
          override: [
            async (context) => {
              if (!lspRef.current) return null;
              const completions = await lspRef.current.getCompletions(
                context.state.doc.toString(),
                context.pos,
                language
              );
              if (completions.length === 0) return null;
              return {
                from: context.pos - (context.matchBefore(/\w*/)?.text.length || 0),
                options: completions.map(c => ({
                  label: c.label,
                  type: c.kind === 3 ? 'function' : c.kind === 6 ? 'variable' : 'text',
                  detail: c.detail,
                  info: c.documentation,
                  apply: c.insertText || c.label,
                })),
              };
            },
          ],
        }),

        // Custom theme adjustments
        EditorView.theme({
          '&': {
            height: '100%',
            backgroundColor: 'transparent',
          },
          '.cm-content': {
            padding: '0',
            caretColor: '#fff',
          },
          '.cm-gutters': {
            backgroundColor: 'transparent',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            color: '#6e7681',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: '#e2e8f0',
          },
          '.cm-focused': {
            outline: 'none',
          },
          '.cm-ySelectionInfo': {
            position: 'absolute',
            top: '-1.5em',
            left: '0',
            fontSize: '10px',
            fontFamily: "'Inter', sans-serif",
            fontWeight: '600',
            padding: '2px 6px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          },
          '.cm-ySelectionCaretDot': {
            display: 'inline-block',
            width: '2px',
            height: '14px',
            marginLeft: '-1px',
            borderRadius: '0',
            position: 'relative',
            top: '2px',
          },
          '.cm-cursor': {
            borderLeftColor: '#fff',
            borderLeftWidth: '2px',
          },
          '.cm-matchingBracket': {
            backgroundColor: 'rgba(255, 255, 0, 0.2)',
            outline: '1px solid rgba(255, 255, 0, 0.4)',
          },
          '.cm-foldGutter': {
            width: '12px',
          },
          '.cm-diagnostic-error': {
            borderBottom: '2px wavy #f44',
          },
          '.cm-diagnostic-warning': {
            borderBottom: '2px wavy #fa0',
          },
          '.cm-diagnostic-info': {
            borderBottom: '2px wavy #0af',
          },
        }),

        // Track viewport for minimap
        ViewPlugin.fromClass(class {
          constructor(view) {
            this.updateViewport(view);
          }
          update(update) {
            if (update.viewportChanged || update.docChanged) {
              this.updateViewport(update.view);
            }
          }
          updateViewport(view) {
            const { from, to } = view.viewport;
            const doc = view.state.doc;
            const startLine = doc.lineAt(from).number;
            const endLine = doc.lineAt(to).number;
            setViewportInfo({
              start: startLine,
              end: endLine,
              total: doc.lines,
            });
          }
        }),

        // Handle read-only mode
        EditorView.editable.of(!readOnly && isConnected),
      ],
    });

    // Create editor view
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [language, themeName, isConnected, activeFileId, fileTreeManager, readOnly]);

  // Update font size dynamically
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: fontSizeCompartment.current.reconfigure(EditorView.theme({
          '&': { fontSize: `${fontSize}px` },
          '.cm-content': { fontFamily },
          '.cm-gutters': { fontFamily },
        })),
      });
    }
  }, [fontSize, fontFamily]);

  // Update word wrap dynamically
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: wordWrapCompartment.current.reconfigure(wordWrap ? EditorView.lineWrapping : []),
      });
    }
  }, [wordWrap]);

  // Update theme dynamically
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartment.current.reconfigure(getThemeExtension()),
      });
    }
  }, [themeName, getThemeExtension]);

  // Change language
  const changeLanguage = useCallback((newLanguage) => {
    if (viewRef.current && LANGUAGE_CONFIGS[newLanguage]) {
      viewRef.current.dispatch({
        effects: languageCompartment.current.reconfigure(LANGUAGE_CONFIGS[newLanguage].extension),
      });
      setLanguage(newLanguage);
    }
  }, []);

  // Get current code
  const getCode = useCallback(() => {
    return viewRef.current?.state.doc.toString() || '';
  }, []);

  // Format code
  const handleFormat = useCallback(async () => {
    if (!viewRef.current || !lspRef.current) return;
    const code = getCode();
    const formatted = await lspRef.current.format(code, language);
    if (formatted !== code) {
      const view = viewRef.current;
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: formatted,
        },
      });
    }
  }, [language, getCode]);

  // Go to definition
  const handleGoToDefinition = useCallback(async () => {
    if (!viewRef.current || !lspRef.current) return;
    const code = getCode();
    const pos = viewRef.current.state.selection.main.head;
    const defs = await lspRef.current.getDefinition(code, pos, language);
    if (defs.length > 0) {
      setDefinitions(defs);
      setShowDefinitions(true);
    }
  }, [language, getCode]);

  // Copy code
  const handleCopy = useCallback(() => {
    const code = getCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getCode]);

  // Run code
  const handleRunCode = useCallback(async () => {
    const code = getCode();
    if (!code.trim()) return;

    setIsRunning(true);
    setShowOutput(true);
    setOutput(null);

    try {
      const response = await fetch('http://localhost:4000/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        // Fallback for JavaScript
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
              exitCode: 0,
            });
          } catch (err) {
            setOutput({ stdout: '', stderr: err.toString(), exitCode: 1 });
          }
        } else {
          throw new Error(`Execution service unavailable for ${language}`);
        }
      } else {
        const result = await response.json();
        setOutput(result);
      }
    } catch (error) {
      setOutput({
        stdout: '',
        stderr: `Error: ${error.message}`,
        exitCode: 1,
      });
    } finally {
      setIsRunning(false);
    }
  }, [language, getCode]);

  // Search handlers
  const handleSearch = useCallback((term, options) => {
    setSearchTerm(term);
    // Implement search logic with CodeMirror search extension
  }, []);

  // Minimap scroll
  const handleMinimapScroll = useCallback((line) => {
    if (!viewRef.current) return;
    const doc = viewRef.current.state.doc;
    if (line > 0 && line <= doc.lines) {
      const lineInfo = doc.line(line);
      viewRef.current.dispatch({
        effects: EditorView.scrollIntoView(lineInfo.from, { y: 'start' }),
      });
    }
  }, []);

  // Navigate to diagnostic
  const handleDiagnosticClick = useCallback((diagnostic) => {
    if (!viewRef.current) return;
    const doc = viewRef.current.state.doc;
    if (diagnostic.line > 0 && diagnostic.line <= doc.lines) {
      const lineInfo = doc.line(diagnostic.line);
      viewRef.current.dispatch({
        selection: { anchor: lineInfo.from + (diagnostic.column || 0) },
        effects: EditorView.scrollIntoView(lineInfo.from, { y: 'center' }),
      });
      viewRef.current.focus();
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  return (
    <div className={clsx(
      'flex flex-col bg-[#1e1e1e] overflow-hidden border border-[#3c3c3c] shadow-xl',
      isFullscreen ? 'fixed inset-0 z-50' : 'h-full rounded-xl'
    )}>
      {/* Toolbar */}
      <EditorToolbar
        language={language}
        languages={Object.entries(LANGUAGE_CONFIGS).map(([key, val]) => ({
          value: key,
          label: `${val.icon} ${val.name}`,
        }))}
        onLanguageChange={changeLanguage}
        theme={themeName}
        themes={Object.keys(themes)}
        onThemeChange={setThemeName}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        fontFamily={fontFamily}
        fontFamilies={FONT_FAMILIES}
        onFontFamilyChange={setFontFamily}
        onFormat={handleFormat}
        onToggleSettings={() => setShowSettings(!showSettings)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Breadcrumbs */}
      {activeFilePath.length > 0 && (
        <Breadcrumbs
          path={activeFilePath}
          onNavigate={(path) => console.log('Navigate to:', path)}
        />
      )}

      {/* Find/Replace */}
      <FindReplace
        visible={showFindReplace}
        onSearch={handleSearch}
        onClose={() => setShowFindReplace(false)}
        matchCount={matchCount}
        currentMatch={currentMatch}
        initialSearchTerm={searchTerm}
      />

      {/* Main editor area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Editor */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={editorRef}
            className="h-full w-full overflow-auto custom-scrollbar"
          />
        </div>

        {/* Minimap */}
        {showMinimap && (
          <div className="border-l border-[#3c3c3c] bg-[#1e1e1e]">
            <Minimap
              content={getCode()}
              viewportStart={viewportInfo.start}
              viewportEnd={viewportInfo.end}
              totalLines={viewportInfo.total}
              onScroll={handleMinimapScroll}
              width={80}
              theme={themeName.includes('light') ? 'light' : 'dark'}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex justify-between items-center px-3 py-1 bg-[#007acc] text-white text-xs">
        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className="flex items-center gap-2">
            <div className={clsx(
              'w-2 h-2 rounded-full',
              isConnected ? (isSynced ? 'bg-green-400' : 'bg-yellow-400 animate-pulse') : 'bg-red-400'
            )} />
            <span>{isConnected ? (isSynced ? 'Synced' : 'Syncing...') : 'Offline'}</span>
          </div>

          {/* Users */}
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{users.length + 1} collaborator{users.length !== 0 ? 's' : ''}</span>
          </div>

          {/* Diagnostics count */}
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="flex items-center gap-1 hover:bg-white/20 px-2 py-0.5 rounded"
          >
            <XCircle className="w-3 h-3" />
            <span>{diagnostics.filter(d => d.severity === 'error').length}</span>
            <span className="text-yellow-300">⚠ {diagnostics.filter(d => d.severity === 'warning').length}</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Language */}
          <span>{LANGUAGE_CONFIGS[language]?.name || language}</span>

          {/* Line info */}
          <span>Ln {viewportInfo.start}, Col 1</span>

          {/* Encoding */}
          <span>UTF-8</span>
        </div>
      </div>

      {/* Output panel */}
      {showOutput && (
        <div className="h-48 border-t border-[#3c3c3c] bg-[#1e1e1e] flex flex-col">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c]">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
              <Terminal className="w-3.5 h-3.5" />
              Output
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center gap-1 px-2 py-0.5 text-xs bg-green-600 hover:bg-green-500 text-white rounded disabled:opacity-50"
              >
                {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Run
              </button>
              <button
                onClick={() => setShowOutput(false)}
                className="text-gray-500 hover:text-white"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 p-3 overflow-auto font-mono text-xs">
            {output ? (
              <>
                {output.stdout && <pre className="text-green-400 whitespace-pre-wrap">{output.stdout}</pre>}
                {output.stderr && <pre className="text-red-400 whitespace-pre-wrap">{output.stderr}</pre>}
                <div className="mt-2 text-gray-500">Exit code: {output.exitCode}</div>
              </>
            ) : isRunning ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </div>
            ) : (
              <div className="text-gray-500">Press Run to execute code</div>
            )}
          </div>
        </div>
      )}

      {/* Diagnostics panel */}
      {showDiagnostics && (
        <DiagnosticsPanel
          diagnostics={diagnostics}
          onDiagnosticClick={handleDiagnosticClick}
          onClose={() => setShowDiagnostics(false)}
        />
      )}

      {/* Go to Definition panel */}
      {showDefinitions && (
        <GoToDefinitionPanel
          definitions={definitions}
          visible={showDefinitions}
          onNavigate={(def) => {
            // Navigate to definition
            setShowDefinitions(false);
          }}
          onClose={() => setShowDefinitions(false)}
          peekMode
        />
      )}
    </div>
  );
};

export default EnhancedCodeEditor;
