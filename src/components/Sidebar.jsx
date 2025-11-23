import React, { useState, useEffect, useRef } from 'react';
import {
    Code,
    Palette,
    Settings,
    Users,
    MessageSquare,
    FolderTree,
    Send,
    X,
    Circle,
    ChevronRight,
    ChevronDown,
    File,
    Folder
} from 'lucide-react';
import clsx from 'clsx';

const Sidebar = ({
    roomId,
    userId,
    userName,
    socket,
    onTabChange,
    onFileSelect,
    participants = [],
    isCollapsed = false,
    onToggleCollapse
}) => {
    const [activeTab, setActiveTab] = useState('code');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [fileTree, setFileTree] = useState({
        name: 'Root',
        type: 'folder',
        isOpen: true,
        children: [
            {
                name: 'src',
                type: 'folder',
                isOpen: true,
                children: [
                    { name: 'index.js', type: 'file', language: 'javascript' },
                    { name: 'App.jsx', type: 'file', language: 'javascript' },
                    { name: 'styles.css', type: 'file', language: 'css' }
                ]
            },
            {
                name: 'components',
                type: 'folder',
                isOpen: false,
                children: [
                    { name: 'Header.jsx', type: 'file', language: 'javascript' },
                    { name: 'Footer.jsx', type: 'file', language: 'javascript' }
                ]
            },
            { name: 'README.md', type: 'file', language: 'markdown' },
            { name: 'package.json', type: 'file', language: 'json' }
        ]
    });

    const chatEndRef = useRef(null);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Socket.IO chat listeners
    useEffect(() => {
        if (!socket) return;

        const handleChatMessage = (message) => {
            setMessages(prev => [...prev, message]);
        };

        const handleSystemMessage = (message) => {
            setMessages(prev => [...prev, {
                type: 'system',
                text: message.text,
                timestamp: Date.now()
            }]);
        };

        socket.on('chat-message', handleChatMessage);
        socket.on('system-message', handleSystemMessage);

        return () => {
            socket.off('chat-message', handleChatMessage);
            socket.off('system-message', handleSystemMessage);
        };
    }, [socket]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        onTabChange?.(tab);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();

        if (!newMessage.trim() || !socket) return;

        const message = {
            userId,
            userName,
            text: newMessage,
            timestamp: Date.now(),
            roomId
        };

        socket.emit('chat-message', message);
        setMessages(prev => [...prev, { ...message, type: 'sent' }]);
        setNewMessage('');
    };

    const toggleFolder = (path) => {
        const updateTree = (node, currentPath = []) => {
            const nodePath = [...currentPath, node.name];
            const pathString = nodePath.join('/');

            if (pathString === path) {
                return { ...node, isOpen: !node.isOpen };
            }

            if (node.children) {
                return {
                    ...node,
                    children: node.children.map(child => updateTree(child, nodePath))
                };
            }

            return node;
        };

        setFileTree(prev => updateTree(prev));
    };

    const handleFileClick = (file, path) => {
        if (file.type === 'file') {
            onFileSelect?.(file, path);
        }
    };

    const renderFileTree = (node, path = []) => {
        const currentPath = [...path, node.name];
        const pathString = currentPath.join('/');
        const isFolder = node.type === 'folder';

        return (
            <div key={pathString} className="select-none">
                <div
                    className={clsx(
                        'flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/5 rounded text-sm transition-colors',
                        {
                            'font-medium': isFolder,
                            'text-text-primary': isFolder,
                            'text-text-secondary': !isFolder
                        }
                    )}
                    onClick={() => isFolder ? toggleFolder(pathString) : handleFileClick(node, pathString)}
                    style={{ paddingLeft: `${path.length * 12 + 12}px` }}
                >
                    {isFolder ? (
                        <>
                            {node.isOpen ? (
                                <ChevronDown className="w-4 h-4 text-text-secondary" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-text-secondary" />
                            )}
                            <Folder className="w-4 h-4 text-accent-orange" />
                        </>
                    ) : (
                        <>
                            <span className="w-4" />
                            <File className="w-4 h-4 text-primary-light" />
                        </>
                    )}
                    <span className="truncate">{node.name}</span>
                </div>

                {isFolder && node.isOpen && node.children && (
                    <div>
                        {node.children.map(child => renderFileTree(child, currentPath))}
                    </div>
                )}
            </div>
        );
    };

    if (isCollapsed) {
        return (
            <div className="w-12 bg-surface border-r border-white/5 flex flex-col items-center py-4 gap-4 z-20">
                <button
                    onClick={() => onToggleCollapse?.()}
                    className="p-2 hover:bg-white/10 rounded transition-colors text-text-secondary hover:text-white"
                    title="Expand Sidebar"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <div className="w-80 md:w-72 lg:w-80 bg-surface border-r border-white/5 flex flex-col h-full animate-slide-in z-20">
            {/* Header with collapse button */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Navigation</h2>
                <button
                    onClick={() => onToggleCollapse?.()}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors text-text-secondary hover:text-white"
                    title="Collapse Sidebar"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-white/5 p-1 gap-1">
                <button
                    onClick={() => handleTabChange('code')}
                    className={clsx(
                        'flex-1 flex items-center justify-center gap-2 py-2 px-2 text-xs font-medium transition-all rounded-md',
                        {
                            'bg-primary/10 text-primary': activeTab === 'code',
                            'text-text-secondary hover:text-text-primary hover:bg-white/5': activeTab !== 'code'
                        }
                    )}
                >
                    <Code className="w-4 h-4" />
                    <span>Code</span>
                </button>

                <button
                    onClick={() => handleTabChange('whiteboard')}
                    className={clsx(
                        'flex-1 flex items-center justify-center gap-2 py-2 px-2 text-xs font-medium transition-all rounded-md',
                        {
                            'bg-secondary/10 text-secondary': activeTab === 'whiteboard',
                            'text-text-secondary hover:text-text-primary hover:bg-white/5': activeTab !== 'whiteboard'
                        }
                    )}
                >
                    <Palette className="w-4 h-4" />
                    <span>Draw</span>
                </button>

                <button
                    onClick={() => handleTabChange('settings')}
                    className={clsx(
                        'flex-1 flex items-center justify-center gap-2 py-2 px-2 text-xs font-medium transition-all rounded-md',
                        {
                            'bg-accent-teal/10 text-accent-teal': activeTab === 'settings',
                            'text-text-secondary hover:text-text-primary hover:bg-white/5': activeTab !== 'settings'
                        }
                    )}
                >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {/* File Tree Section */}
                <div className="border-b border-white/5">
                    <div className="flex items-center gap-2 px-4 py-2 bg-surface-light/30">
                        <FolderTree className="w-3.5 h-3.5 text-text-secondary" />
                        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Files</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto scrollbar-thin py-2">
                        {renderFileTree(fileTree)}
                    </div>
                </div>

                {/* Participants Section */}
                <div className="border-b border-white/5">
                    <div className="flex items-center gap-2 px-4 py-2 bg-surface-light/30">
                        <Users className="w-3.5 h-3.5 text-text-secondary" />
                        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                            Participants ({participants.length + 1})
                        </h3>
                    </div>
                    <div className="max-h-48 overflow-y-auto scrollbar-thin py-2">
                        {/* Current user */}
                        <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors">
                            <div className="relative">
                                <div
                                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-primary/20">
                                    {userName[0]?.toUpperCase()}
                                </div>
                                <Circle
                                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 fill-green-500 text-green-500 ring-2 ring-surface" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-text-primary truncate">
                                    {userName} <span className="text-text-secondary text-xs">(You)</span>
                                </div>
                                <div className="text-[10px] text-green-400">Online</div>
                            </div>
                        </div>

                        {/* Other participants */}
                        {participants.map((participant) => (
                            <div
                                key={participant.id}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors"
                            >
                                <div className="relative">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg"
                                        style={{ backgroundColor: participant.color || '#666' }}
                                    >
                                        {participant.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <Circle
                                        className={clsx(
                                            'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ring-2 ring-surface',
                                            participant.isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-500 text-gray-500'
                                        )}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-text-primary truncate">
                                        {participant.name || 'Anonymous'}
                                    </div>
                                    <div className="text-[10px] text-text-secondary">
                                        {participant.isOnline ? 'Online' : 'Offline'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="flex-1 flex flex-col min-h-0 bg-surface-light/10">
                    <div className="flex items-center gap-2 px-4 py-2 bg-surface-light/30 border-b border-white/5">
                        <MessageSquare className="w-3.5 h-3.5 text-text-secondary" />
                        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Chat</h3>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-text-muted text-xs gap-2">
                                <MessageSquare className="w-8 h-8 opacity-20" />
                                <p>No messages yet.</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={clsx('flex', {
                                        'justify-end': msg.userId === userId || msg.type === 'sent',
                                        'justify-start': msg.userId !== userId && msg.type !== 'sent' && msg.type !== 'system',
                                        'justify-center': msg.type === 'system'
                                    })}
                                >
                                    {msg.type === 'system' ? (
                                        <div className="text-[10px] text-text-muted bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                            {msg.text}
                                        </div>
                                    ) : (
                                        <div
                                            className={clsx('max-w-[85%] p-3 rounded-xl shadow-sm', {
                                                'bg-primary text-white rounded-br-none': msg.userId === userId || msg.type === 'sent',
                                                'bg-surface-light text-text-primary border border-white/5 rounded-bl-none': msg.userId !== userId && msg.type !== 'sent'
                                            })}
                                        >
                                            {msg.userId !== userId && (
                                                <div className="text-[10px] font-bold mb-1 opacity-70 text-primary-light">
                                                    {msg.userName}
                                                </div>
                                            )}
                                            <div className="text-xs leading-relaxed">{msg.text}</div>
                                            <div className="text-[9px] opacity-50 mt-1 text-right">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Message Input */}
                    <form
                        onSubmit={handleSendMessage}
                        className="p-3 border-t border-white/5 bg-surface-light/20"
                    >
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-background-secondary border border-white/10 text-text-primary px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-text-muted"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className={clsx(
                                    'p-2 rounded-lg transition-all',
                                    {
                                        'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20': newMessage.trim(),
                                        'bg-white/5 text-text-muted cursor-not-allowed': !newMessage.trim()
                                    }
                                )}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;