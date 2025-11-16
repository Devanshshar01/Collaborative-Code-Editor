import React, {useState, useEffect, useRef, useCallback} from 'react';
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
                    {name: 'index.js', type: 'file', language: 'javascript'},
                    {name: 'App.jsx', type: 'file', language: 'javascript'},
                    {name: 'styles.css', type: 'file', language: 'css'}
                ]
            },
            {
                name: 'components',
                type: 'folder',
                isOpen: false,
                children: [
                    {name: 'Header.jsx', type: 'file', language: 'javascript'},
                    {name: 'Footer.jsx', type: 'file', language: 'javascript'}
                ]
            },
            {name: 'README.md', type: 'file', language: 'markdown'},
            {name: 'package.json', type: 'file', language: 'json'}
        ]
    });

    const chatEndRef = useRef(null);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({behavior: 'smooth'});
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
        setMessages(prev => [...prev, {...message, type: 'sent'}]);
        setNewMessage('');
    };

    const toggleFolder = (path) => {
        const updateTree = (node, currentPath = []) => {
            const nodePath = [...currentPath, node.name];
            const pathString = nodePath.join('/');

            if (pathString === path) {
                return {...node, isOpen: !node.isOpen};
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
                        'flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-sidebar-hover rounded text-sm transition-colors',
                        {
                            'font-medium': isFolder,
                            'text-gray-300': isFolder,
                            'text-gray-400': !isFolder
                        }
                    )}
                    onClick={() => isFolder ? toggleFolder(pathString) : handleFileClick(node, pathString)}
                    style={{paddingLeft: `${path.length * 12 + 12}px`}}
                >
                    {isFolder ? (
                        <>
                            {node.isOpen ? (
                                <ChevronDown className="w-4 h-4"/>
                            ) : (
                                <ChevronRight className="w-4 h-4"/>
                            )}
                            <Folder className="w-4 h-4 text-yellow-500"/>
                        </>
                    ) : (
                        <>
                            <span className="w-4"/>
                            <File className="w-4 h-4 text-blue-400"/>
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
            <div className="w-12 bg-sidebar-bg border-r border-sidebar-border flex flex-col items-center py-4 gap-4">
                <button
                    onClick={() => onToggleCollapse?.()}
                    className="p-2 hover:bg-sidebar-hover rounded transition-colors"
                    title="Expand Sidebar"
                >
                    <ChevronRight className="w-5 h-5 text-gray-400"/>
                </button>
            </div>
        );
    }

    return (
        <div
            className="w-80 md:w-72 lg:w-80 bg-sidebar-bg border-r border-sidebar-border flex flex-col h-full animate-slide-in">
            {/* Header with collapse button */}
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <h2 className="text-lg font-semibold text-gray-200">Navigation</h2>
                <button
                    onClick={() => onToggleCollapse?.()}
                    className="p-1.5 hover:bg-sidebar-hover rounded transition-colors"
                    title="Collapse Sidebar"
                >
                    <X className="w-5 h-5 text-gray-400"/>
                </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-sidebar-border">
                <button
                    onClick={() => handleTabChange('code')}
                    className={clsx(
                        'flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors',
                        {
                            'bg-sidebar-active text-white border-b-2 border-sidebar-active': activeTab === 'code',
                            'text-gray-400 hover:text-gray-200 hover:bg-sidebar-hover': activeTab !== 'code'
                        }
                    )}
                >
                    <Code className="w-4 h-4"/>
                    <span className="hidden md:inline">Code</span>
                </button>

                <button
                    onClick={() => handleTabChange('whiteboard')}
                    className={clsx(
                        'flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors',
                        {
                            'bg-sidebar-active text-white border-b-2 border-sidebar-active': activeTab === 'whiteboard',
                            'text-gray-400 hover:text-gray-200 hover:bg-sidebar-hover': activeTab !== 'whiteboard'
                        }
                    )}
                >
                    <Palette className="w-4 h-4"/>
                    <span className="hidden md:inline">Draw</span>
                </button>

                <button
                    onClick={() => handleTabChange('settings')}
                    className={clsx(
                        'flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors',
                        {
                            'bg-sidebar-active text-white border-b-2 border-sidebar-active': activeTab === 'settings',
                            'text-gray-400 hover:text-gray-200 hover:bg-sidebar-hover': activeTab !== 'settings'
                        }
                    )}
                >
                    <Settings className="w-4 h-4"/>
                    <span className="hidden md:inline">Settings</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {/* File Tree Section */}
                <div className="border-b border-sidebar-border">
                    <div className="flex items-center gap-2 px-4 py-2 bg-sidebar-hover">
                        <FolderTree className="w-4 h-4 text-gray-400"/>
                        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Files</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto scrollbar-thin py-2">
                        {renderFileTree(fileTree)}
                    </div>
                </div>

                {/* Participants Section */}
                <div className="border-b border-sidebar-border">
                    <div className="flex items-center gap-2 px-4 py-2 bg-sidebar-hover">
                        <Users className="w-4 h-4 text-gray-400"/>
                        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                            Participants ({participants.length + 1})
                        </h3>
                    </div>
                    <div className="max-h-48 overflow-y-auto scrollbar-thin py-2">
                        {/* Current user */}
                        <div className="flex items-center gap-3 px-4 py-2 hover:bg-sidebar-hover transition-colors">
                            <div className="relative">
                                <div
                                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                    {userName[0]?.toUpperCase()}
                                </div>
                                <Circle
                                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-green-500 text-green-500"/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-200 truncate">
                                    {userName} (You)
                                </div>
                                <div className="text-xs text-gray-500">Online</div>
                            </div>
                        </div>

                        {/* Other participants */}
                        {participants.map((participant) => (
                            <div
                                key={participant.id}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-sidebar-hover transition-colors"
                            >
                                <div className="relative">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                        style={{backgroundColor: participant.color || '#666'}}
                                    >
                                        {participant.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <Circle
                                        className={clsx(
                                            'absolute -bottom-0.5 -right-0.5 w-3 h-3',
                                            participant.isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-500 text-gray-500'
                                        )}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-200 truncate">
                                        {participant.name || 'Anonymous'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {participant.isOnline ? 'Online' : 'Offline'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center gap-2 px-4 py-2 bg-sidebar-hover border-b border-sidebar-border">
                        <MessageSquare className="w-4 h-4 text-gray-400"/>
                        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Chat</h3>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 text-sm py-8">
                                No messages yet. Start the conversation!
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
                                        <div className="text-xs text-gray-500 bg-chat-system px-3 py-1 rounded-full">
                                            {msg.text}
                                        </div>
                                    ) : (
                                        <div
                                            className={clsx('chat-bubble', {
                                                'bg-chat-sent text-white': msg.userId === userId || msg.type === 'sent',
                                                'bg-chat-received text-gray-200': msg.userId !== userId && msg.type !== 'sent'
                                            })}
                                        >
                                            {msg.userId !== userId && (
                                                <div className="text-xs font-semibold mb-1 opacity-80">
                                                    {msg.userName}
                                                </div>
                                            )}
                                            <div className="text-sm">{msg.text}</div>
                                            <div className="text-xs opacity-60 mt-1">
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
                        <div ref={chatEndRef}/>
                    </div>

                    {/* Message Input */}
                    <form
                        onSubmit={handleSendMessage}
                        className="p-3 border-t border-sidebar-border bg-sidebar-hover"
                    >
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-gray-800 text-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-active border border-gray-700"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className={clsx(
                                    'p-2 rounded-lg transition-colors',
                                    {
                                        'bg-sidebar-active text-white hover:bg-blue-600': newMessage.trim(),
                                        'bg-gray-700 text-gray-500 cursor-not-allowed': !newMessage.trim()
                                    }
                                )}
                            >
                                <Send className="w-5 h-5"/>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;