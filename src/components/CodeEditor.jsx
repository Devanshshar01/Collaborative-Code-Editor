import React, {useEffect, useRef, useState, useCallback} from 'react';
import * as Y from 'yjs';
import {yCollab, yUndoManagerKeymap} from 'y-codemirror.next';
import {EditorView, basicSetup} from '@codemirror/basic-setup';
import {EditorState, Compartment} from '@codemirror/state';
import {ViewPlugin, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars} from '@codemirror/view';
import {javascript} from '@codemirror/lang-javascript';
import {python} from '@codemirror/lang-python';
import {java} from '@codemirror/lang-java';
import {oneDark} from '@codemirror/theme-one-dark';
import {indentWithTab} from '@codemirror/commands';
import {autocompletion, completionKeymap} from '@codemirror/autocomplete';
import {lintKeymap} from '@codemirror/lint';
import {searchKeymap, highlightSelectionMatches} from '@codemirror/search';
import {defaultKeymap, historyKeymap} from '@codemirror/commands';
import YjsWebSocketProvider from '../utils/yjs-provider';

// User colors for cursors
const USER_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7'
];

// Language mode configurations
const languageConfigs = {
    javascript: javascript({jsx: true, typescript: true}),
    python: python(),
    java: java()
};

const CodeEditor = ({
                        roomId,
                        userId,
                        userName = 'Anonymous',
                        language = 'javascript',
                        theme = 'dark',
                        onSyncStatusChange,
                        onUserListChange,
                        onError
                    }) => {
    const editorRef = useRef(null);
    const viewRef = useRef(null);
    const ydocRef = useRef(null);
    const providerRef = useRef(null);
    const languageCompartment = useRef(new Compartment());
    const themeCompartment = useRef(new Compartment());

    const [isConnected, setIsConnected] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [users, setUsers] = useState([]);
    const [userColor] = useState(() => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]);

    // Initialize Yjs document and provider
    useEffect(() => {
        if (!roomId || !userId) return;

        // Create Yjs document
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        // Get the shared text type
        const ytext = ydoc.getText('codemirror');

        // Create WebSocket provider
        const provider = new YjsWebSocketProvider(ydoc, {
            roomId,
            userId,
            serverUrl: process.env.REACT_APP_YJS_URL || 'ws://localhost:1234',
            onConnect: () => {
                console.log('Connected to collaboration server');
                setIsConnected(true);
                onSyncStatusChange?.({connected: true, synced: false});
            },
            onDisconnect: () => {
                console.log('Disconnected from collaboration server');
                setIsConnected(false);
                setIsSynced(false);
                onSyncStatusChange?.({connected: false, synced: false});
            },
            onError: (error) => {
                console.error('Collaboration error:', error);
                onError?.(error);
            },
            onVersionConflict: (localVersion, serverVersion) => {
                console.warn(`Version conflict detected: local=${localVersion}, server=${serverVersion}`);
                // Could show a modal asking user to reload or continue
            }
        });
        providerRef.current = provider;

        // Set user awareness information
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
                onSyncStatusChange?.({connected: isConnected, synced});
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

        const ytext = ydocRef.current.getText('codemirror');
        const undoManager = new Y.UndoManager(ytext);

        // Create editor state with all extensions
        const state = EditorState.create({
            doc: ytext.toString(),
            extensions: [
                basicSetup,

                // Language support (configurable)
                languageCompartment.current.of(languageConfigs[language] || languageConfigs.javascript),

                // Theme (configurable)
                themeCompartment.current.of(theme === 'dark' ? oneDark : []),

                // Yjs collaboration
                yCollab(ytext, providerRef.current?.getAwareness(), {undoManager}),

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
                        fontSize: "14px"
                    },
                    ".cm-content": {
                        padding: "12px"
                    },
                    ".cm-focused": {
                        outline: "none"
                    },
                    ".cm-ySelectionInfo": {
                        position: "absolute",
                        top: "-1.5em",
                        left: "0",
                        fontSize: "10px",
                        fontFamily: "sans-serif",
                        background: "inherit",
                        color: "inherit",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        whiteSpace: "nowrap",
                        zIndex: 100
                    },
                    ".cm-ySelectionCaretDot": {
                        display: "inline-block",
                        width: "4px",
                        height: "14px",
                        marginLeft: "-2px",
                        borderRadius: "2px",
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
                            console.log('Document updated by remote user');
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
    }, [language, theme, isConnected]);

    // Update language dynamically
    const changeLanguage = useCallback((newLanguage) => {
        if (viewRef.current && languageConfigs[newLanguage]) {
            viewRef.current.dispatch({
                effects: languageCompartment.current.reconfigure(languageConfigs[newLanguage])
            });
        }
    }, []);

    // Update theme dynamically
    const changeTheme = useCallback((newTheme) => {
        if (viewRef.current) {
            viewRef.current.dispatch({
                effects: themeCompartment.current.reconfigure(newTheme === 'dark' ? oneDark : [])
            });
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

    return (
        <div className="code-editor-container" style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
            {/* Status bar */}
            <div className="editor-status-bar" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 16px',
                background: theme === 'dark' ? '#1e1e1e' : '#f5f5f5',
                borderBottom: '1px solid ' + (theme === 'dark' ? '#333' : '#ddd'),
                fontSize: '12px',
                color: theme === 'dark' ? '#ccc' : '#666'
            }}>
                <div className="status-left">
          <span className="connection-status" style={{marginRight: '16px'}}>
            <span
                style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isConnected ? (isSynced ? '#4caf50' : '#ff9800') : '#f44336',
                    marginRight: '6px'
                }}
            />
              {isConnected ? (isSynced ? 'Synced' : 'Syncing...') : 'Offline'}
          </span>
                    <span className="room-info">
            Room: {roomId}
          </span>
                </div>

                <div className="status-center">
                    <select
                        value={language}
                        onChange={(e) => changeLanguage(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: '1px solid ' + (theme === 'dark' ? '#555' : '#ccc'),
                            color: 'inherit',
                            padding: '2px 8px',
                            borderRadius: '3px',
                            marginRight: '8px'
                        }}
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                    </select>

                    <button
                        onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}
                        style={{
                            background: 'transparent',
                            border: '1px solid ' + (theme === 'dark' ? '#555' : '#ccc'),
                            color: 'inherit',
                            padding: '2px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>

                <div className="status-right">
          <span className="user-count">
            👥 {users.length + 1} users online
          </span>
                    {users.slice(0, 5).map((user, index) => (
                        <span
                            key={user.id}
                            title={user.name}
                            style={{
                                display: 'inline-block',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: user.color,
                                marginLeft: '4px',
                                textAlign: 'center',
                                lineHeight: '24px',
                                fontSize: '11px',
                                color: '#fff',
                                fontWeight: 'bold'
                            }}
                        >
              {user.name[0].toUpperCase()}
            </span>
                    ))}
                </div>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                className="code-editor"
                style={{
                    flex: 1,
                    overflow: 'auto',
                    background: theme === 'dark' ? '#282c34' : '#fff'
                }}
            />

            {/* Toolbar */}
            <div className="editor-toolbar" style={{
                display: 'flex',
                padding: '8px 16px',
                background: theme === 'dark' ? '#1e1e1e' : '#f5f5f5',
                borderTop: '1px solid ' + (theme === 'dark' ? '#333' : '#ddd'),
                gap: '8px'
            }}>
                <button
                    onClick={formatCode}
                    style={{
                        padding: '4px 12px',
                        background: theme === 'dark' ? '#333' : '#fff',
                        border: '1px solid ' + (theme === 'dark' ? '#555' : '#ccc'),
                        color: theme === 'dark' ? '#ccc' : '#333',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    Format Code
                </button>

                <button
                    onClick={() => {
                        const code = getCode();
                        navigator.clipboard.writeText(code);
                        console.log('Code copied to clipboard');
                    }}
                    style={{
                        padding: '4px 12px',
                        background: theme === 'dark' ? '#333' : '#fff',
                        border: '1px solid ' + (theme === 'dark' ? '#555' : '#ccc'),
                        color: theme === 'dark' ? '#ccc' : '#333',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    Copy Code
                </button>

                <div style={{flex: 1}}/>

                <span style={{
                    fontSize: '11px',
                    color: theme === 'dark' ? '#666' : '#999',
                    alignSelf: 'center'
                }}>
          Ctrl+Z: Undo | Ctrl+Y: Redo | Ctrl+F: Find | Tab: Indent
        </span>
            </div>
        </div>
    );
};

export default CodeEditor;