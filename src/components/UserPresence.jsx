import React, { useState, useEffect } from 'react';
import { Users, Circle, Crown, Star, Zap, Code, MessageSquare, Video, Activity } from 'lucide-react';
import clsx from 'clsx';

const UserPresence = ({ users, currentUser, socket, roomId }) => {
    const [userActivities, setUserActivities] = useState({});
    const [hoveredUser, setHoveredUser] = useState(null);

    useEffect(() => {
        if (!socket) return;

        const handleUserActivity = ({ userId, activity, timestamp }) => {
            setUserActivities(prev => ({
                ...prev,
                [userId]: { activity, timestamp, lastSeen: Date.now() }
            }));

            // Clear activity after 3 seconds
            setTimeout(() => {
                setUserActivities(prev => {
                    const { [userId]: removed, ...rest } = prev;
                    return rest;
                });
            }, 3000);
        };

        socket.on('user-activity', handleUserActivity);

        return () => {
            socket.off('user-activity', handleUserActivity);
        };
    }, [socket]);

    const getActivityIcon = (activity) => {
        switch (activity) {
            case 'typing': return Code;
            case 'chatting': return MessageSquare;
            case 'video': return Video;
            case 'drawing': return Zap;
            default: return Activity;
        }
    };

    const getActivityText = (activity) => {
        switch (activity) {
            case 'typing': return 'Coding...';
            case 'chatting': return 'Chatting...';
            case 'video': return 'In video call';
            case 'drawing': return 'Drawing...';
            default: return 'Active';
        }
    };

    const getRoleIcon = (user) => {
        if (user.isAdmin || user.role === 'admin') return Crown;
        if (user.role === 'moderator') return Star;
        return null;
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getTimeSince = (timestamp) => {
        if (!timestamp) return 'Just now';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const allUsers = [
        { ...currentUser, id: currentUser.id, isCurrentUser: true, isOnline: true },
        ...users
    ];

    return (
        <div className="flex flex-col h-full bg-surface border-l border-white/5">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5 bg-surface-light/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-bold text-text-primary">
                            Online ({allUsers.length})
                        </h3>
                    </div>
                    <div className="flex -space-x-2">
                        {allUsers.slice(0, 3).map((user, i) => (
                            <div
                                key={user.id}
                                className="w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                                style={{
                                    backgroundColor: user.color || '#666',
                                    zIndex: 3 - i
                                }}
                            >
                                {getInitials(user.name)}
                            </div>
                        ))}
                        {allUsers.length > 3 && (
                            <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-light flex items-center justify-center text-[10px] font-bold text-text-secondary">
                                +{allUsers.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                {allUsers.map((user) => {
                    const activity = userActivities[user.id];
                    const RoleIcon = getRoleIcon(user);
                    const ActivityIcon = activity ? getActivityIcon(activity.activity) : null;
                    const isHovered = hoveredUser === user.id;

                    return (
                        <div
                            key={user.id}
                            className={clsx(
                                "group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                                user.isCurrentUser
                                    ? "bg-primary/10 border border-primary/20"
                                    : "hover:bg-white/5 border border-transparent hover:border-white/5"
                            )}
                            onMouseEnter={() => setHoveredUser(user.id)}
                            onMouseLeave={() => setHoveredUser(null)}
                        >
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div
                                    className={clsx(
                                        "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg transition-transform",
                                        isHovered && "scale-110"
                                    )}
                                    style={{
                                        background: `linear-gradient(135deg, ${user.color || '#666'} 0%, ${user.color || '#666'}dd 100%)`
                                    }}
                                >
                                    {getInitials(user.name)}
                                </div>

                                {/* Status Indicator */}
                                <div className="absolute -bottom-0.5 -right-0.5">
                                    <Circle
                                        className={clsx(
                                            'w-3.5 h-3.5 ring-2 ring-surface rounded-full',
                                            user.isOnline
                                                ? 'fill-green-500 text-green-500'
                                                : 'fill-gray-500 text-gray-500'
                                        )}
                                    />
                                </div>

                                {/* Activity Pulse */}
                                {activity && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-blue-500/50">
                                        {ActivityIcon && <ActivityIcon className="w-3 h-3 text-white" />}
                                    </div>
                                )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-text-primary truncate">
                                        {user.name}
                                    </span>

                                    {user.isCurrentUser && (
                                        <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold shrink-0">
                                            YOU
                                        </span>
                                    )}

                                    {RoleIcon && (
                                        <RoleIcon className={clsx(
                                            "w-3.5 h-3.5 shrink-0",
                                            user.isAdmin || user.role === 'admin' ? "text-yellow-500" : "text-purple-500"
                                        )} />
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-0.5">
                                    {activity ? (
                                        <span className="text-xs text-blue-400 font-medium flex items-center gap-1">
                                            {ActivityIcon && <ActivityIcon className="w-3 h-3" />}
                                            {getActivityText(activity.activity)}
                                        </span>
                                    ) : user.isOnline ? (
                                        <span className="text-xs text-green-400 font-medium">
                                            Active now
                                        </span>
                                    ) : (
                                        <span className="text-xs text-text-muted">
                                            {getTimeSince(user.lastSeen)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Cursor Preview (on hover) */}
                            {isHovered && !user.isCurrentUser && (
                                <div
                                    className="absolute right-3 w-2 h-2 rounded-full animate-pulse"
                                    style={{ backgroundColor: user.color }}
                                    title="Cursor color"
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer Stats */}
            <div className="px-4 py-3 border-t border-white/5 bg-surface-light/30">
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 bg-white/5 rounded-lg">
                        <div className="text-lg font-bold text-green-400">
                            {allUsers.filter(u => u.isOnline).length}
                        </div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wide">
                            Online
                        </div>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg">
                        <div className="text-lg font-bold text-blue-400">
                            {Object.keys(userActivities).length}
                        </div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wide">
                            Active
                        </div>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg">
                        <div className="text-lg font-bold text-purple-400">
                            {allUsers.length}
                        </div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wide">
                            Total
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserPresence;
