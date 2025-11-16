import React, {useState} from 'react';
import CodeEditor from './components/CodeEditor';
import VideoCall from './components/VideoCall';
import Whiteboard from './components/Whiteboard';
import Sidebar from './components/Sidebar';
import {useSocket} from './hooks/useSocket';
import './App.css';
import './index.css';

function App() {
    const [roomId] = useState(() => {
        // Get room ID from URL or generate a new one
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('room') || `room-${Math.random().toString(36).substr(2, 9)}`;
    });

    const [userId] = useState(() => {
        // Generate or retrieve user ID
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
        // Simple admin check - in production this would be more sophisticated
        return localStorage.getItem('isAdmin') === 'true' || roomId.includes('admin');
    });

    const [syncStatus, setSyncStatus] = useState({connected: false, synced: false});
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [activeView, setActiveView] = useState('editor'); // 'editor', 'whiteboard', 'split'
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // Initialize Socket.IO connection for chat
    const {isConnected, users, joinRoom, sendCodeChange, socket} = useSocket();

    // Join room on mount
    React.useEffect(() => {
        if (isConnected && roomId && userId) {
            joinRoom(roomId, {id: userId, name: userName});
        }
    }, [isConnected, roomId, userId, userName]);

    const handleSyncStatusChange = (status) => {
        setSyncStatus(status);
    };

    const handleUserListChange = (users) => {
        setOnlineUsers(users);
    };

    const handleError = (error) => {
        console.error('App error:', error);
        // Could show a toast notification here
    };

    const handleNameChange = (newName) => {
        setUserName(newName);
        localStorage.setItem('userName', newName);
        // Would need to update the awareness state in the editor
    };

    const toggleAdmin = () => {
        const newAdminStatus = !isAdmin;
        localStorage.setItem('isAdmin', newAdminStatus.toString());
        window.location.reload(); // Simple way to update admin state
    };

    const shareRoom = () => {
        const url = `${window.location.origin}?room=${roomId}`;
        navigator.clipboard.writeText(url);
        alert(`Room URL copied to clipboard: ${url}`);
    };

    const handleFileSelect = (file, path) => {
        console.log('File selected:', file, path);
        setSelectedFile({file, path});
        // TODO: Load file content from server
    };

    const handleSidebarTabChange = (tab) => {
        console.log('Sidebar tab changed:', tab);
        // Map sidebar tabs to active view
        if (tab === 'code') {
            setActiveView('editor');
        } else if (tab === 'whiteboard') {
            setActiveView('whiteboard');
        }
    };

    const getViewStyle = () => {
        switch (activeView) {
            case 'whiteboard':
                return {
                    editor: {display: 'none'},
                    whiteboard: {flex: 1},
                    video: showVideo ? {flex: 1} : {display: 'none'}
                };
            case 'split':
                return {
                    editor: {flex: 1},
                    whiteboard: {flex: 1},
                    video: showVideo ? {width: '300px'} : {display: 'none'}
                };
            default: // 'editor'
                return {
                    editor: {flex: 2},
                    whiteboard: {display: 'none'},
                    video: showVideo ? {flex: 1} : {display: 'none'}
                };
        }
    };

    const viewStyles = getViewStyle();

    return (
        <div className="App" style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#1a1a1a'
        }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 24px',
                background: '#2d2d30',
                borderBottom: '1px solid #3e3e42',
                color: '#cccccc'
            }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                    <h1 style={{margin: 0, fontSize: '20px', fontWeight: 'normal'}}>
                        🚀 Collaborative Code Editor
                    </h1>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 12px',
                        background: '#1e1e1e',
                        borderRadius: '4px',
                        fontSize: '13px'
                    }}>
                        <span style={{color: '#969696'}}>Room:</span>
                        <span style={{color: '#4ec9b0', fontFamily: 'monospace'}}>{roomId}</span>
                        <button
                            onClick={shareRoom}
                            style={{
                                marginLeft: '8px',
                                padding: '2px 8px',
                                background: '#007acc',
                                border: 'none',
                                borderRadius: '3px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '11px'
                            }}
                        >
                            Share
                        </button>
                    </div>
                </div>

                <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                    {/* View Toggle Buttons */}
                    <div style={{
                        display: 'flex',
                        background: '#1e1e1e',
                        borderRadius: '6px',
                        padding: '2px'
                    }}>
                        <button
                            onClick={() => setActiveView('editor')}
                            style={{
                                padding: '6px 12px',
                                background: activeView === 'editor' ? '#007acc' : 'transparent',
                                color: activeView === 'editor' ? 'white' : '#cccccc',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            💻 Code
                        </button>
                        <button
                            onClick={() => setActiveView('whiteboard')}
                            style={{
                                padding: '6px 12px',
                                background: activeView === 'whiteboard' ? '#007acc' : 'transparent',
                                color: activeView === 'whiteboard' ? 'white' : '#cccccc',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            🎨 Draw
                        </button>
                        <button
                            onClick={() => setActiveView('split')}
                            style={{
                                padding: '6px 12px',
                                background: activeView === 'split' ? '#007acc' : 'transparent',
                                color: activeView === 'split' ? 'white' : '#cccccc',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            🔀 Split
                        </button>
                    </div>

                    {/* Connection Status */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: syncStatus.connected
                                ? (syncStatus.synced ? '#4caf50' : '#ff9800')
                                : '#f44336'
                        }}/>
                        <span>
                            {syncStatus.connected
                                ? (syncStatus.synced ? 'Connected' : 'Syncing')
                                : 'Offline'}
                        </span>
                    </div>

                    {/* Online Users */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px'
                    }}>
                        <span>👥 {onlineUsers.length + 1} online</span>
                    </div>

                    {/* User Settings */}
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        style={{
                            padding: '6px 12px',
                            background: '#3c3c3c',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            color: '#cccccc',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        ⚙️ {userName}
                        {isAdmin && <span style={{color: '#ff9800'}}>👑</span>}
                    </button>

                    <button
                        onClick={() => setShowVideo(prev => !prev)}
                        style={{
                            padding: '6px 12px',
                            background: showVideo ? '#007acc' : '#3c3c3c',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                    >
                        {showVideo ? 'Hide Video' : 'Show Video'}
                    </button>
                </div>
            </header>

            {/* Settings Modal */}
            {showSettings && (
                <div style={{
                    position: 'fixed',
                    top: '60px',
                    right: '20px',
                    background: '#2d2d30',
                    border: '1px solid #3e3e42',
                    borderRadius: '4px',
                    padding: '16px',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    minWidth: '250px'
                }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '13px',
                        color: '#cccccc'
                    }}>
                        Display Name:
                    </label>
                    <input
                        type="text"
                        value={userName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '6px',
                            background: '#1e1e1e',
                            border: '1px solid #3e3e42',
                            borderRadius: '3px',
                            color: '#cccccc',
                            fontSize: '13px',
                            marginBottom: '12px'
                        }}
                    />

                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        color: '#cccccc',
                        marginBottom: '12px',
                        cursor: 'pointer'
                    }}>
                        <input
                            type="checkbox"
                            checked={isAdmin}
                            onChange={toggleAdmin}
                            style={{cursor: 'pointer'}}
                        />
                        Admin Mode (can clear whiteboard)
                    </label>

                    <button
                        onClick={() => setShowSettings(false)}
                        style={{
                            display: 'block',
                            padding: '6px 12px',
                            background: '#007acc',
                            border: 'none',
                            borderRadius: '3px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            width: '100%'
                        }}
                    >
                        Save
                    </button>
                </div>
            )}

            {/* Main Content */}
            <main style={{flex: 1, overflow: 'hidden'}}>
                <div style={{display: 'flex', height: '100%'}}>
                    {/* Sidebar */}
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

                    {/* Main content area */}
                    <div style={{flex: 1, display: 'flex', height: '100%'}}>
                        {/* Code Editor */}
                        <div style={{
                            ...viewStyles.editor,
                            borderRight: activeView === 'split' ? '1px solid #2d2d30' : 'none'
                        }}>
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

                        {/* Whiteboard */}
                        <div style={{
                            ...viewStyles.whiteboard,
                            borderRight: (activeView === 'split' && showVideo) ? '1px solid #2d2d30' : 'none'
                        }}>
                            <Whiteboard
                                roomId={roomId}
                                userId={userId}
                                userName={userName}
                                isAdmin={isAdmin}
                                onError={handleError}
                                onUsersChange={handleUserListChange}
                            />
                        </div>

                        {/* Video Call */}
                        {showVideo && (
                            <div style={{
                                ...viewStyles.video,
                                background: '#0f0f0f'
                            }}>
                                <VideoCall
                                    roomId={roomId}
                                    userId={userId}
                                    userName={userName}
                                    serverUrl={process.env.REACT_APP_SOCKET_URL || 'http://localhost:4000'}
                                    stunServers={[]}
                                    onError={handleError}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer style={{
                padding: '8px 24px',
                background: '#2d2d30',
                borderTop: '1px solid #3e3e42',
                color: '#969696',
                fontSize: '12px',
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <div>
                    Real-time collaboration: Code Editor + Whiteboard + Video • Powered by Yjs CRDT
                </div>
                <div>
                    {onlineUsers.length > 0 && (
                        <span>
                            Active: {onlineUsers.map(u => u.name).join(', ')}
                        </span>
                    )}
                </div>
            </footer>
        </div>
    );
}

export default App;