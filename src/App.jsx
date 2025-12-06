import React, { useState, useEffect, useCallback } from 'react';
import {
    Code2,
    Video,
    PenTool,
    Split,
    Settings,
    Share2,
    Users,
    Wifi,
    WifiOff,
    Monitor,
    X,
    Check,
    Maximize2,
    Minimize2,
    Command,
    Terminal as TerminalIcon,
    Palette,
    Sparkles,
    Layout,
    Zap,
    Search
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import CodeEditor from './components/CodeEditor';
import VideoCall from './components/VideoCall';
import FigmaCanvas from './components/FigmaCanvas';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import AIAssistant from './components/AIAssistant';
import Terminal from './components/Terminal';
import ThemeSelector from './components/ThemeSelector';
import ProjectTemplates from './components/ProjectTemplates';
import QuickOpen from './components/QuickOpen';
import GlobalSearch from './components/GlobalSearch';
import Breadcrumbs from './components/Breadcrumbs';
import MenuBar from './components/MenuBar';
import { useSocket } from './hooks/useSocket';
import { useWorkspaceStore } from './stores/workspaceStore';
import './App.css';
import './index.css';
import './components/FileExplorer.css';

function App() {
    const [showLanding, setShowLanding] = useState(true);
    const [roomId] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('room') || `room-${Math.random().toString(36).substr(2, 9)}`;
    });

    const [userId] = useState(() => {
        let id = localStorage.getItem('userId');
        if (!id) {
            id = `user-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('userId', id);
        }
        return id;
    });

    const [userName, setUserName] = useState(() => {
        return localStorage.getItem('userName') || 'Anonymous';
    });

    const [isAdmin] = useState(() => {
        return localStorage.getItem('isAdmin') === 'true' || roomId.includes('admin');
    });

    // Core States
    const [syncStatus, setSyncStatus] = useState({ connected: false, synced: false });
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const [activeView, setActiveView] = useState('editor');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // NEW FEATURE STATES
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [showAIAssistant, setShowAIAssistant] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [terminalMaximized, setTerminalMaximized] = useState(false);
    const [showThemeSelector, setShowThemeSelector] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showQuickOpen, setShowQuickOpen] = useState(false);
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('vscode-dark');
    const [currentCode, setCurrentCode] = useState('');

    // Workspace store
    const { activeFile, setActiveFile } = useWorkspaceStore();

    const { isConnected, users, joinRoom, sendCodeChange, socket } = useSocket();

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Quick Open: Ctrl/Cmd + P
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                setShowQuickOpen(true);
            }

            // Command Palette: Ctrl/Cmd + Shift + P or Ctrl/Cmd + K
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                setShowCommandPalette(true);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowCommandPalette(true);
            }

            // Global Search: Ctrl/Cmd + Shift + F
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                setShowGlobalSearch(true);
            }

            // AI Assistant: Ctrl/Cmd + Shift + A
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                setShowAIAssistant(true);
            }

            // Terminal: Ctrl/Cmd + `
            if ((e.ctrlKey || e.metaKey) && e.key === '`') {
                e.preventDefault();
                setShowTerminal(prev => !prev);
            }

            // Settings: Ctrl/Cmd + ,
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault();
                setShowSettings(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isConnected && roomId && userId) {
            joinRoom(roomId, { id: userId, name: userName });
        }
    }, [isConnected, roomId, userId, userName]);

    const handleSyncStatusChange = useCallback((status) => {
        setSyncStatus(status);
    }, []);

    const handleUserListChange = useCallback((users) => {
        setOnlineUsers(users);
    }, []);

    const handleError = useCallback((error) => {
        console.error('App error:', error);
    }, []);

    const handleNameChange = (newName) => {
        setUserName(newName);
        localStorage.setItem('userName', newName);
    };

    const toggleAdmin = () => {
        const newAdminStatus = !isAdmin;
        localStorage.setItem('isAdmin', newAdminStatus.toString());
        window.location.reload();
    };

    const shareRoom = () => {
        const url = `${window.location.origin}?room=${roomId}`;
        navigator.clipboard.writeText(url);
        alert(`Room URL copied to clipboard: ${url}`);
    };

    const handleFileSelect = (file, path) => {
        console.log('File selected:', file, path);
        setSelectedFile({ file, path });
    };

    const handleSidebarTabChange = (tab) => {
        if (tab === 'code') {
            setActiveView('editor');
        } else if (tab === 'whiteboard') {
            setActiveView('whiteboard');
        }
    };

    // Command Palette Handler
    const handleCommand = (commandId) => {
        console.log('Executing command:', commandId);

        switch (commandId) {
            // ============ FILE COMMANDS ============
            case 'file.newFile':
                // Create new untitled file
                const newFileName = `untitled-${Date.now()}.js`;
                setSelectedFile({ file: { name: newFileName, content: '' }, path: newFileName });
                break;
            case 'file.newWindow':
                window.open(window.location.href, '_blank');
                break;
            case 'file.openFile':
            case 'file.upload':
                // Trigger file input click
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.multiple = true;
                fileInput.onchange = (e) => {
                    const files = Array.from(e.target.files);
                    files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            setSelectedFile({ 
                                file: { name: file.name, content: ev.target.result }, 
                                path: file.name 
                            });
                        };
                        reader.readAsText(file);
                    });
                };
                fileInput.click();
                break;
            case 'file.openFolder':
                // Browser doesn't support folder selection easily, show message
                alert('Folder selection: Use the file explorer sidebar to manage files');
                break;
            case 'file.save':
                // Save current file (trigger download)
                if (currentCode) {
                    const blob = new Blob([currentCode], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = selectedFile?.file?.name || 'untitled.txt';
                    a.click();
                    URL.revokeObjectURL(url);
                }
                break;
            case 'file.saveAs':
                // Save as with dialog
                if (currentCode) {
                    const fileName = prompt('Enter file name:', selectedFile?.file?.name || 'untitled.txt');
                    if (fileName) {
                        const blob = new Blob([currentCode], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileName;
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                }
                break;
            case 'file.saveAll':
                // In collaborative environment, all changes are auto-saved
                alert('All changes are automatically synced in real-time');
                break;
            case 'file.autoSave':
                // Toggle auto-save (in this app, it's always on via Yjs)
                alert('Auto-save is always enabled in collaborative mode');
                break;
            case 'file.share.copyLink':
                shareRoom();
                break;
            case 'file.close':
                setSelectedFile(null);
                break;
            case 'file.closeFolder':
                // Reset to initial state
                setSelectedFile(null);
                break;
            case 'file.preferences.settings':
                setShowSettings(true);
                break;
            case 'file.preferences.keyboardShortcuts':
                // Show keyboard shortcuts
                alert('Keyboard Shortcuts:\n\nCtrl+P - Quick Open\nCtrl+Shift+P - Command Palette\nCtrl+Shift+F - Search in Files\nCtrl+` - Toggle Terminal\nCtrl+, - Settings\nCtrl+B - Toggle Sidebar\nF5 - Run Code\nCtrl+S - Save File');
                break;
            case 'file.preferences.themes':
                setShowThemeSelector(true);
                break;

            // ============ EDIT COMMANDS ============
            case 'edit.undo':
                document.execCommand('undo');
                break;
            case 'edit.redo':
                document.execCommand('redo');
                break;
            case 'edit.cut':
                document.execCommand('cut');
                break;
            case 'edit.copy':
                document.execCommand('copy');
                break;
            case 'edit.paste':
                navigator.clipboard.readText().then(text => {
                    document.execCommand('insertText', false, text);
                }).catch(() => {
                    alert('Paste: Use Ctrl+V in the editor');
                });
                break;
            case 'edit.find':
                // Trigger Monaco editor find (Ctrl+F)
                const findEvent = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true });
                document.activeElement?.dispatchEvent(findEvent);
                break;
            case 'edit.replace':
                // Trigger Monaco editor replace (Ctrl+H)
                const replaceEvent = new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, bubbles: true });
                document.activeElement?.dispatchEvent(replaceEvent);
                break;
            case 'edit.findInFiles':
                setShowGlobalSearch(true);
                break;
            case 'edit.replaceInFiles':
                setShowGlobalSearch(true);
                break;
            case 'edit.toggleLineComment':
                // Monaco: Ctrl+/
                const commentEvent = new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true });
                document.activeElement?.dispatchEvent(commentEvent);
                break;
            case 'edit.toggleBlockComment':
                // Monaco: Shift+Alt+A
                alert('Block Comment: Use Shift+Alt+A in the editor');
                break;

            // ============ SELECTION COMMANDS ============
            case 'selection.selectAll':
                document.execCommand('selectAll');
                break;
            case 'selection.copyLineUp':
            case 'selection.copyLineDown':
            case 'selection.moveLineUp':
            case 'selection.moveLineDown':
            case 'selection.expandSelection':
            case 'selection.shrinkSelection':
            case 'selection.addCursorAbove':
            case 'selection.addCursorBelow':
            case 'selection.addNextOccurrence':
            case 'selection.selectAllOccurrences':
                // These are Monaco editor operations
                alert(`Use keyboard shortcut for this action in the editor`);
                break;

            // ============ VIEW COMMANDS ============
            case 'view.commandPalette':
                setShowCommandPalette(true);
                break;
            case 'view.openView':
                setShowCommandPalette(true);
                break;
            case 'view.fullscreen':
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.documentElement.requestFullscreen();
                }
                break;
            case 'view.zenMode':
                // Hide all UI except editor
                setSidebarCollapsed(true);
                setShowTerminal(false);
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                }
                break;
            case 'view.primarySideBar':
                setSidebarCollapsed(prev => !prev);
                break;
            case 'view.panel':
                setShowTerminal(prev => !prev);
                break;
            case 'view.explorer':
                setSidebarCollapsed(false);
                break;
            case 'view.search':
                setShowGlobalSearch(true);
                break;
            case 'view.sourceControl':
                alert('Source Control: Git integration coming soon');
                break;
            case 'view.run':
                // Show run/debug panel
                setShowTerminal(true);
                break;
            case 'view.extensions':
                alert('Extensions: Feature coming soon');
                break;
            case 'view.problems':
                setShowTerminal(true);
                break;
            case 'view.output':
                setShowTerminal(true);
                break;
            case 'view.debugConsole':
                setShowTerminal(true);
                break;
            case 'view.terminal':
                setShowTerminal(prev => !prev);
                break;
            case 'view.wordWrap':
                // Toggle word wrap in editor
                alert('Word Wrap: Toggle in editor settings');
                break;
            case 'view.splitUp':
            case 'view.splitDown':
            case 'view.splitLeft':
            case 'view.splitRight':
                setActiveView('split');
                break;
            case 'view.singleColumn':
                setActiveView('editor');
                break;

            // ============ GO COMMANDS ============
            case 'go.goToFile':
                setShowQuickOpen(true);
                break;
            case 'go.goToLine':
                const line = prompt('Go to Line:');
                if (line && !isNaN(line)) {
                    // Monaco editor go to line
                    alert(`Go to line ${line}: Use Ctrl+G in the editor`);
                }
                break;
            case 'go.goToSymbol':
            case 'go.goToSymbolInEditor':
                setShowQuickOpen(true);
                break;
            case 'go.goToDefinition':
            case 'go.goToDeclaration':
            case 'go.goToTypeDefinition':
            case 'go.goToImplementations':
            case 'go.goToReferences':
                alert('Go to Definition: Press F12 in the editor');
                break;
            case 'go.back':
                // Navigation history back
                break;
            case 'go.forward':
                // Navigation history forward
                break;

            // ============ RUN COMMANDS ============
            case 'run.startDebugging':
            case 'run.runWithoutDebugging':
            case 'code.run':
                // Run the current code
                setShowTerminal(true);
                // Trigger the code runner if available
                const runButton = document.querySelector('[data-run-button]');
                if (runButton) runButton.click();
                break;
            case 'run.stopDebugging':
                // Stop running code
                break;
            case 'run.toggleBreakpoint':
                alert('Breakpoints: Click in the gutter margin to toggle');
                break;

            // ============ TERMINAL COMMANDS ============
            case 'terminal.new':
                setShowTerminal(true);
                break;
            case 'terminal.split':
                setShowTerminal(true);
                break;
            case 'terminal.runTask':
            case 'terminal.runBuildTask':
                setShowTerminal(true);
                break;
            case 'terminal.runActiveFile':
                setShowTerminal(true);
                const runBtn = document.querySelector('[data-run-button]');
                if (runBtn) runBtn.click();
                break;

            // ============ HELP COMMANDS ============
            case 'help.welcome':
                setShowLanding(true);
                break;
            case 'help.showAllCommands':
                setShowCommandPalette(true);
                break;
            case 'help.documentation':
                window.open('https://code.visualstudio.com/docs', '_blank');
                break;
            case 'help.releaseNotes':
                alert('Collaborative Code Editor v1.0\n\nFeatures:\n- Real-time collaboration\n- Multi-language support\n- AI assistant\n- Whiteboard\n- Video calls');
                break;
            case 'help.keyboardShortcuts':
            case 'help.keyboardShortcutsReference':
                handleCommand('file.preferences.keyboardShortcuts');
                break;
            case 'help.toggleDevTools':
                // Open browser dev tools hint
                alert('Developer Tools: Press F12 or Ctrl+Shift+I');
                break;
            case 'help.about':
                alert('Collaborative Code Editor\n\nA real-time collaborative coding environment with:\n- 9 supported languages\n- Live collaboration via Yjs\n- AI-powered assistance\n- Integrated whiteboard\n- Video conferencing\n\nBuilt with React, Monaco Editor, and WebRTC');
                break;
            case 'help.reportIssue':
                window.open('https://github.com/issues', '_blank');
                break;

            // ============ AI COMMANDS ============
            case 'code.ai':
                setShowAIAssistant(true);
                break;

            // ============ VIEW MODES ============
            case 'view.editor':
                setActiveView('editor');
                break;
            case 'view.whiteboard':
                setActiveView('whiteboard');
                break;
            case 'view.split':
                setActiveView('split');
                break;

            // ============ THEME ============
            case 'theme.dark':
            case 'theme.light':
            case 'view.appearance':
                setShowThemeSelector(true);
                break;

            default:
                console.log('Unhandled command:', commandId);
        }
    };

    // Theme Change Handler
    const handleThemeChange = (themeId) => {
        setCurrentTheme(themeId);
        localStorage.setItem('editorTheme', themeId);
    };

    // Template Selection Handler
    const handleSelectTemplate = (template) => {
        console.log('Selected template:', template);
        // Implementation: Load template files into the editor
        // You can integrate this with your file system
    };

    if (showLanding) {
        return <LandingPage onEnter={() => setShowLanding(false)} />;
    }

    return (
        <div className="h-screen w-full flex flex-col bg-[#1e1e1e] text-[#cccccc] overflow-hidden font-sans">
            {/* VS Code-style Menu Bar */}
            <MenuBar
                onCommand={handleCommand}
                onQuickOpen={() => setShowQuickOpen(true)}
                onGlobalSearch={() => setShowGlobalSearch(true)}
                onSettings={() => setShowSettings(true)}
                onTerminal={() => setShowTerminal(true)}
                projectName="Collaborative-Code-Editor"
            />

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
                    <div className="bg-surface border border-white/10 rounded-xl shadow-2xl w-full max-w-md p-6 m-4 relative animate-slide-up">
                        <button
                            onClick={() => setShowSettings(false)}
                            className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-primary" />
                            Settings
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="w-full bg-background-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAdmin ? 'bg-primary border-primary' : 'border-text-secondary group-hover:border-primary'}`}>
                                        {isAdmin && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isAdmin}
                                        onChange={toggleAdmin}
                                        className="hidden"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-text-primary">Admin Mode</span>
                                        <span className="text-xs text-text-secondary">Enable administrative features like clearing whiteboard</span>
                                    </div>
                                </label>
                            </div>

                            <button
                                onClick={() => setShowSettings(false)}
                                className="w-full mt-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-all shadow-lg shadow-primary/20"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden relative">
                <Sidebar
                    roomId={roomId}
                    userId={userId}
                    userName={userName}
                    socket={socket}
                    participants={onlineUsers.map(u => ({
                        id: u.id,
                        name: u.name,
                        color: u.color,
                        isOnline: true
                    }))}
                    isCollapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    onTabChange={handleSidebarTabChange}
                    onFileSelect={handleFileSelect}
                />

                <div className="flex-1 flex flex-col relative bg-background-secondary/50">
                    {/* Editor/Whiteboard Area */}
                    <div className="flex-1 flex relative">
                        {/* Code Editor Area */}
                        <div
                            className={`flex-1 flex flex-col transition-all duration-300 ${activeView === 'whiteboard' || activeView === 'maximize-video' ? 'hidden' : ''
                                } ${activeView === 'split' ? 'w-1/2 border-r border-white/5' : 'w-full'}`}
                        >
                            <CodeEditor
                                roomId={roomId}
                                userId={userId}
                                userName={userName}
                                language="javascript"
                                theme={currentTheme}
                                onSyncStatusChange={handleSyncStatusChange}
                                onUserListChange={handleUserListChange}
                                onError={handleError}
                            />
                        </div>

                        {/* Figma-like Design Editor */}
                        <div
                            className={`flex-1 flex flex-col transition-all duration-300 ${activeView === 'editor' || activeView === 'maximize-video' ? 'hidden' : ''
                                } ${activeView === 'split' ? 'w-1/2' : 'w-full'}`}
                        >
                            <FigmaCanvas
                                roomId={roomId}
                                userId={userId}
                                userName={userName}
                            />
                        </div>

                        {showVideo && (
                            <div className={`transition-all duration-300 shadow-2xl rounded-xl overflow-hidden border border-white/10 bg-surface ${activeView === 'maximize-video'
                                ? 'fixed inset-4 z-50'
                                : 'fixed bottom-6 right-6 w-[580px] h-[420px] z-40'
                                }`}>
                                <div className="bg-surface-light/50 px-4 py-2 flex items-center justify-between border-b border-white/5 shrink-0">
                                    <span className="text-xs font-medium text-text-secondary flex items-center gap-2">
                                        <Video className="w-3 h-3" />
                                        Video Call
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setActiveView(activeView === 'maximize-video' ? 'editor' : 'maximize-video')}
                                            className="text-text-secondary hover:text-white transition-colors p-1"
                                            title={activeView === 'maximize-video' ? "Minimize" : "Maximize"}
                                        >
                                            {activeView === 'maximize-video' ? (
                                                <Minimize2 className="w-3 h-3" />
                                            ) : (
                                                <Maximize2 className="w-3 h-3" />
                                            )}
                                        </button>
                                        <button onClick={() => setShowVideo(false)} className="text-text-secondary hover:text-white transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-black/50 relative overflow-hidden">
                                    <VideoCall
                                        roomId={roomId}
                                        userId={userId}
                                        userName={userName}
                                        serverUrl={process.env.REACT_APP_SOCKET_URL || 'http://localhost:4000'}
                                        stunServers={[]}
                                        onError={handleError}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* VS Code-style Status Bar */}
            <footer className="h-[22px] bg-[#007acc] text-white text-[12px] flex items-center justify-between select-none">
                {/* Left section */}
                <div className="flex items-center h-full">
                    {/* Remote indicator */}
                    <button className="h-full px-2 hover:bg-[#1f8ad2] flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M12.5 12.5L9 9m3.5 3.5l-1-1m1 1l1 1M3.5 3.5L7 7m-3.5-3.5l1 1m-1-1l-1-1m11 6.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
                        </svg>
                    </button>
                    
                    {/* Branch */}
                    <button className="h-full px-2 hover:bg-[#1f8ad2] flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                            <path fillRule="evenodd" d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z" clipRule="evenodd"/>
                        </svg>
                        <span>main*</span>
                    </button>

                    {/* Sync status */}
                    <button className="h-full px-2 hover:bg-[#1f8ad2] flex items-center gap-1">
                        {syncStatus.connected ? (
                            <>
                                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M2.5 5.5a3 3 0 013-3h5a3 3 0 013 3V9a3 3 0 01-3 3h-2v1h2a4 4 0 004-4V5.5a4 4 0 00-4-4h-5a4 4 0 00-4 4v.707l1.146-1.147a.5.5 0 01.708.708l-2 2a.5.5 0 01-.708 0l-2-2a.5.5 0 11.708-.708L2.5 5.707V5.5z"/>
                                </svg>
                                <span>{syncStatus.synced ? '0↓ 0↑' : 'Syncing...'}</span>
                            </>
                        ) : (
                            <span className="text-yellow-300">Offline</span>
                        )}
                    </button>

                    {/* Errors/Warnings */}
                    <button className="h-full px-2 hover:bg-[#1f8ad2] flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 2a6 6 0 100 12A6 6 0 008 2zM1 8a7 7 0 1114 0A7 7 0 011 8z"/>
                            <path d="M7.5 4v4h1V4h-1zm.5 6.5a.75.75 0 100 1.5.75.75 0 000-1.5z"/>
                        </svg>
                        <span>0</span>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                            <path fillRule="evenodd" d="M7.56 1h.88l6.54 12.26-.44.74H1.44l-.42-.74L7.56 1zm.44 1.7L2.68 13h10.64L8 2.7zM8 5v4h1V5H8zm0 5v2h1v-2H8z" clipRule="evenodd"/>
                        </svg>
                        <span>0</span>
                    </button>
                </div>

                {/* Right section */}
                <div className="flex items-center h-full">
                    {/* Video Call Button */}
                    <button 
                        onClick={() => setShowVideo(!showVideo)}
                        className={`h-full px-2 hover:bg-[#1f8ad2] flex items-center gap-1.5 ${showVideo ? 'bg-[#1f8ad2]' : ''}`}
                        title={showVideo ? "Hide Video Call" : "Start Video Call"}
                    >
                        <Video className="w-3.5 h-3.5" />
                        <span>{showVideo ? 'End Call' : 'Video'}</span>
                    </button>

                    {/* Collaborators */}
                    {onlineUsers.length > 0 && (
                        <button className="h-full px-2 hover:bg-[#1f8ad2] flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>{onlineUsers.length + 1}</span>
                        </button>
                    )}

                    {/* Line/Column */}
                    <button className="h-full px-2 hover:bg-[#1f8ad2]">
                        Ln 1, Col 1
                    </button>

                    {/* Spaces */}
                    <button className="h-full px-2 hover:bg-[#1f8ad2]">
                        Spaces: 4
                    </button>

                    {/* Encoding */}
                    <button className="h-full px-2 hover:bg-[#1f8ad2]">
                        UTF-8
                    </button>

                    {/* Line ending */}
                    <button className="h-full px-2 hover:bg-[#1f8ad2]">
                        LF
                    </button>

                    {/* Language mode */}
                    <button className="h-full px-2 hover:bg-[#1f8ad2]">
                        JavaScript
                    </button>

                    {/* Copilot */}
                    <button className="h-full px-2 hover:bg-[#1f8ad2] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    {/* Notifications */}
                    <button className="h-full px-2 hover:bg-[#1f8ad2]">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M13.377 10.573a7.63 7.63 0 01-.383-2.38V6.195a5.115 5.115 0 00-1.268-3.446 5.138 5.138 0 00-3.242-1.722c-.694-.072-1.4 0-2.07.227-.67.215-1.28.574-1.794 1.053a4.923 4.923 0 00-1.208 1.675 5.067 5.067 0 00-.431 2.022v2.2a7.61 7.61 0 01-.383 2.37L2 12.343l.479.658h3.505c0 .526.215 1.04.586 1.412.37.37.885.587 1.41.587.526 0 1.04-.215 1.411-.587s.587-.886.587-1.412h3.505l.478-.658-.586-1.77zm-4.69 3.147a.997.997 0 01-.705.299.997.997 0 01-.706-.3.999.999 0 01-.3-.705h1.999a.939.939 0 01-.287.706zm-5.515-1.71l.371-1.114a8.633 8.633 0 00.443-2.691V6.004c0-.563.12-1.113.347-1.616.227-.514.55-.969.969-1.34.419-.382.91-.67 1.436-.837.538-.18 1.1-.24 1.65-.18a4.147 4.147 0 012.597 1.4 4.133 4.133 0 011.004 2.776v2.01c0 .909.144 1.818.443 2.691l.371 1.113h-9.63v-.011z"/>
                        </svg>
                    </button>
                </div>
            </footer>

            {/* NEW FEATURE COMPONENTS */}
            <CommandPalette
                isOpen={showCommandPalette}
                onClose={() => setShowCommandPalette(false)}
                onCommand={handleCommand}
            />

            <AIAssistant
                isOpen={showAIAssistant}
                onClose={() => setShowAIAssistant(false)}
                currentCode={currentCode}
                language="javascript"
                onInsertCode={(code) => console.log('Insert code:', code)}
            />

            <ThemeSelector
                isOpen={showThemeSelector}
                onClose={() => setShowThemeSelector(false)}
                currentTheme={currentTheme}
                onThemeChange={handleThemeChange}
            />

            <ProjectTemplates
                isOpen={showTemplates}
                onClose={() => setShowTemplates(false)}
                onSelectTemplate={handleSelectTemplate}
            />

            <QuickOpen
                isOpen={showQuickOpen}
                onClose={() => setShowQuickOpen(false)}
                onSelect={(file) => {
                    console.log('Quick open selected:', file);
                    setActiveFile(file.path);
                    setSelectedFile({ file, path: file.path });
                }}
            />

            <GlobalSearch
                isOpen={showGlobalSearch}
                onClose={() => setShowGlobalSearch(false)}
                onResultSelect={(result) => {
                    console.log('Search result selected:', result);
                    setActiveFile(result.filePath);
                    setSelectedFile({ file: { name: result.filePath.split('/').pop() }, path: result.filePath });
                }}
            />
        </div>
    );
}

export default App;