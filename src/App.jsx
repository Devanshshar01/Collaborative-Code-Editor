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
    Minimize2
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import CodeEditor from './components/CodeEditor';
import VideoCall from './components/VideoCall';
import Whiteboard from './components/Whiteboard';
import Sidebar from './components/Sidebar';
import { useSocket } from './hooks/useSocket';
import './App.css';
import './index.css';

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

    const [syncStatus, setSyncStatus] = useState({ connected: false, synced: false });
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const [activeView, setActiveView] = useState('editor'); // 'editor', 'whiteboard', 'split', 'maximize-video'
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const { isConnected, users, joinRoom, sendCodeChange, socket } = useSocket();

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

    if (showLanding) {
        return <LandingPage onEnter={() => setShowLanding(false)} />;
    }

    return (
        <div className="h-screen w-full flex flex-col bg-background text-text-primary overflow-hidden font-sans">
            {/* Header */}
            <header className="h-14 bg-surface/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-10">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/20 rounded-lg">
                            <Code2 className="w-5 h-5 text-primary" />
                        </div>
                        <h1 className="font-bold text-sm tracking-wide bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            COLLAB EDITOR
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 px-3 py-1.5 bg-surface-light/30 rounded-full border border-white/5">
                        <span className="text-xs text-text-secondary font-medium">Room</span>
                        <span className="text-xs font-mono text-primary-light bg-primary/10 px-2 py-0.5 rounded">{roomId}</span>
                        <button
                            onClick={shareRoom}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors text-text-secondary hover:text-white"
                            title="Copy Link"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Toggles */}
                    <div className="flex bg-surface-light/30 p-1 rounded-lg border border-white/5">
                        <button
                            onClick={() => setActiveView('editor')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeView === 'editor' || activeView === 'maximize-video'
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-text-secondary hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Code2 className="w-3.5 h-3.5" />
                            Code
                        </button>
                        <button
                            onClick={() => setActiveView('whiteboard')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeView === 'whiteboard'
                                ? 'bg-secondary text-white shadow-lg shadow-secondary/20'
                                : 'text-text-secondary hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <PenTool className="w-3.5 h-3.5" />
                            Draw
                        </button>
                        <button
                            onClick={() => setActiveView('split')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeView === 'split'
                                ? 'bg-accent-teal text-white shadow-lg shadow-accent-teal/20'
                                : 'text-text-secondary hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Split className="w-3.5 h-3.5" />
                            Split
                        </button>
                    </div>

                    <div className="h-6 w-px bg-white/10 mx-2" />

                    {/* Status Indicators */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                            {syncStatus.connected ? (
                                <Wifi className={`w-3.5 h-3.5 ${syncStatus.synced ? 'text-green-400' : 'text-amber-400'}`} />
                            ) : (
                                <WifiOff className="w-3.5 h-3.5 text-red-400" />
                            )}
                            <span className="hidden sm:inline">
                                {syncStatus.connected ? (syncStatus.synced ? 'Connected' : 'Syncing...') : 'Offline'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                            <Users className="w-3.5 h-3.5 text-primary-light" />
                            <span>{onlineUsers.length + 1}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <button
                        onClick={() => setShowVideo(prev => !prev)}
                        className={`p-2 rounded-lg transition-all border ${showVideo
                            ? 'bg-primary/20 border-primary/50 text-primary'
                            : 'bg-surface-light/30 border-transparent text-text-secondary hover:text-white hover:bg-surface-light/50'
                            }`}
                        title="Toggle Video"
                    >
                        <Video className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-surface-light/30 border border-transparent hover:border-white/10 hover:bg-surface-light/50 transition-all"
                    >
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-text-primary hidden sm:inline">{userName}</span>
                        {isAdmin && <span className="text-[10px] text-amber-400 ml-1">👑</span>}
                    </button>
                </div>
            </header>

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

                <div className="flex-1 flex relative bg-background-secondary/50">
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
                            theme="dark"
                            onSyncStatusChange={handleSyncStatusChange}
                            onUserListChange={handleUserListChange}
                            onError={handleError}
                        />
                    </div>

                    {/* Whiteboard Area */}
                    <div
                        className={`flex-1 flex flex-col transition-all duration-300 ${activeView === 'editor' || activeView === 'maximize-video' ? 'hidden' : ''
                            } ${activeView === 'split' ? 'w-1/2' : 'w-full'}`}
                    >
                        <Whiteboard
                            roomId={roomId}
                            userId={userId}
                            userName={userName}
                            isAdmin={isAdmin}
                            onError={handleError}
                            onUsersChange={handleUserListChange}
                        />
                    </div>

                    {/* Floating/Maximized Video Call */}
                    {showVideo && (
                        <div className={`transition-all duration-300 ease-in-out flex flex-col bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden ${activeView === 'maximize-video'
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
            </main>

            {/* Status Bar */}
            <footer className="h-6 bg-primary/90 backdrop-blur text-white text-[10px] flex items-center justify-between px-3 select-none">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-medium">
                        <Monitor className="w-3 h-3" />
                        main*
                    </span>
                    <span className="opacity-80">0 errors, 0 warnings</span>
                </div>
                <div className="flex items-center gap-4 opacity-90">
                    {onlineUsers.length > 0 && (
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Active: {onlineUsers.map(u => u.name).join(', ')}
                        </span>
                    )}
                    <span>Ln 1, Col 1</span>
                    <span>UTF-8</span>
                    <span>JavaScript</span>
                    <span>Prettier</span>
                </div>
            </footer>
        </div>
    );
}

export default App;