/**
 * Chat Panel Component
 * Real-time chat with reactions, threading, and typing indicators
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Smile, Paperclip, Reply, MoreHorizontal, X, Edit2, Trash2, AtSign, Code, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';

// Emoji picker data
const emojis = {
  recent: ['👍', '❤️', '😂', '🎉', '🔥', '👀', '✅', '💯'],
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'],
  gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤏', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '💪'],
  objects: ['💻', '📱', '💾', '💿', '📀', '🖥️', '🖨️', '⌨️', '🖱️', '📷', '🎥', '📞', '☎️', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️', '⏰', '🔋', '🔌', '💡', '🔦', '🕯️', '📕', '📗', '📘', '📙'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '⭐', '🌟', '💫', '⚡', '🔥', '💥', '❄️', '🎉', '🎊', '✅', '❌'],
};

// Message component
const Message = ({ 
  message, 
  currentUserId, 
  onReact, 
  onReply, 
  onEdit, 
  onDelete,
  users 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isOwnMessage = message.userId === currentUserId;

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const getUserColor = (userId) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#74B9FF', '#A29BFE', '#FD79A8'];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className={clsx(
        'group relative px-4 py-2 hover:bg-white/5 transition-colors',
        message.isSystem && 'bg-yellow-500/10'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Reply indicator */}
      {message.replyTo && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 ml-10">
          <Reply className="w-3 h-3" />
          <span>Replying to {getUserName(message.replyTo.userId)}</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
          style={{ backgroundColor: getUserColor(message.userId) }}
        >
          {getUserName(message.userId).charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span 
              className="font-medium text-sm"
              style={{ color: getUserColor(message.userId) }}
            >
              {getUserName(message.userId)}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </span>
            {message.edited && (
              <span className="text-xs text-gray-500">(edited)</span>
            )}
          </div>

          {/* Message content */}
          {message.type === 'code' ? (
            <pre className="mt-1 p-3 bg-gray-800 rounded-lg text-sm overflow-x-auto">
              <code className="text-gray-300">{message.content}</code>
            </pre>
          ) : message.type === 'image' ? (
            <img 
              src={message.content} 
              alt="Shared image" 
              className="mt-1 max-w-xs rounded-lg"
            />
          ) : (
            <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(message.reactions).map(([emoji, userIds]) => (
                <button
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  className={clsx(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors',
                    userIds.includes(currentUserId)
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  )}
                >
                  <span>{emoji}</span>
                  <span>{userIds.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && !message.isSystem && (
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-white/10 shadow-lg">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
              title="Add reaction"
            >
              <Smile className="w-4 h-4" />
            </button>
            <button
              onClick={() => onReply(message)}
              className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
              title="Reply"
            >
              <Reply className="w-4 h-4" />
            </button>
            {isOwnMessage && (
              <>
                <button
                  onClick={() => onEdit(message)}
                  className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="absolute right-4 top-full mt-1 z-50 bg-gray-800 rounded-lg border border-white/10 shadow-xl p-3 w-72">
            <div className="text-xs text-gray-400 mb-2">Quick reactions</div>
            <div className="flex flex-wrap gap-1">
              {emojis.recent.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(message.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-2 hover:bg-white/10 rounded text-xl transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Typing indicator component
const TypingIndicator = ({ typingUsers, users }) => {
  if (typingUsers.length === 0) return null;

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Someone';
  };

  const typingText = () => {
    if (typingUsers.length === 1) {
      return `${getUserName(typingUsers[0])} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${getUserName(typingUsers[0])} and ${getUserName(typingUsers[1])} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  };

  return (
    <div className="px-4 py-2 text-sm text-gray-400 flex items-center gap-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{typingText()}</span>
    </div>
  );
};

// Main Chat Panel component
const ChatPanel = ({ 
  roomId, 
  userId, 
  userName, 
  socket,
  isOpen = true,
  onClose,
  users = []
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Receive new message
    socket.on('chat:message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Message edited
    socket.on('chat:message-edited', ({ messageId, content }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content, edited: true } : msg
        )
      );
    });

    // Message deleted
    socket.on('chat:message-deleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });

    // Reaction added/removed
    socket.on('chat:reaction', ({ messageId, emoji, userId: reactUserId, added }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          
          const reactions = { ...msg.reactions };
          if (added) {
            reactions[emoji] = [...(reactions[emoji] || []), reactUserId];
          } else {
            reactions[emoji] = (reactions[emoji] || []).filter((id) => id !== reactUserId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          }
          
          return { ...msg, reactions };
        })
      );
    });

    // Typing indicator
    socket.on('chat:typing', ({ userId: typingUserId, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping && !prev.includes(typingUserId)) {
          return [...prev, typingUserId];
        } else if (!isTyping) {
          return prev.filter((id) => id !== typingUserId);
        }
        return prev;
      });
    });

    // Load message history
    socket.emit('chat:get-history', { roomId }, (history) => {
      if (history) setMessages(history);
    });

    return () => {
      socket.off('chat:message');
      socket.off('chat:message-edited');
      socket.off('chat:message-deleted');
      socket.off('chat:reaction');
      socket.off('chat:typing');
    };
  }, [socket, roomId]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socket) return;

    socket.emit('chat:typing', { roomId, userId, isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:typing', { roomId, userId, isTyping: false });
    }, 2000);
  }, [socket, roomId, userId]);

  // Send message
  const sendMessage = useCallback(() => {
    if (!inputValue.trim() || !socket) return;

    if (editingMessage) {
      // Edit existing message
      socket.emit('chat:edit-message', {
        roomId,
        messageId: editingMessage.id,
        content: inputValue.trim(),
      });
      setEditingMessage(null);
    } else {
      // Send new message
      const message = {
        id: `${Date.now()}-${userId}`,
        roomId,
        userId,
        userName,
        content: inputValue.trim(),
        type: isCodeMode ? 'code' : 'text',
        timestamp: Date.now(),
        replyTo: replyingTo ? { id: replyingTo.id, userId: replyingTo.userId } : null,
        reactions: {},
      };

      socket.emit('chat:send-message', message);
      setReplyingTo(null);
    }

    setInputValue('');
    setIsCodeMode(false);
    socket.emit('chat:typing', { roomId, userId, isTyping: false });
  }, [inputValue, socket, roomId, userId, userName, editingMessage, replyingTo, isCodeMode]);

  // Handle reaction
  const handleReact = useCallback((messageId, emoji) => {
    if (!socket) return;
    socket.emit('chat:react', { roomId, messageId, emoji, userId });
  }, [socket, roomId, userId]);

  // Handle reply
  const handleReply = useCallback((message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  }, []);

  // Handle edit
  const handleEdit = useCallback((message) => {
    setEditingMessage(message);
    setInputValue(message.content);
    inputRef.current?.focus();
  }, []);

  // Handle delete
  const handleDelete = useCallback((messageId) => {
    if (!socket) return;
    if (confirm('Delete this message?')) {
      socket.emit('chat:delete-message', { roomId, messageId });
    }
  }, [socket, roomId]);

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Insert emoji
  const insertEmoji = useCallback((emoji) => {
    setInputValue((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-white">Chat</h3>
          <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded-full">
            {users.length} online
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              currentUserId={userId}
              users={users}
              onReact={handleReact}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      <TypingIndicator 
        typingUsers={typingUsers.filter(id => id !== userId)} 
        users={users}
      />

      {/* Reply/Edit indicator */}
      {(replyingTo || editingMessage) && (
        <div className="px-4 py-2 bg-gray-800/50 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {replyingTo ? (
              <>
                <Reply className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">
                  Replying to <span className="text-white">{replyingTo.userName}</span>
                </span>
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400">Editing message</span>
              </>
            )}
          </div>
          <button
            onClick={() => {
              setReplyingTo(null);
              setEditingMessage(null);
              setInputValue('');
            }}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-white/10">
        <div className="relative">
          <div className="flex items-end gap-2 bg-gray-800 rounded-lg border border-white/10 focus-within:border-blue-500 transition-colors">
            {/* Actions */}
            <div className="flex items-center gap-1 p-2">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                title="Add emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsCodeMode(!isCodeMode)}
                className={clsx(
                  'p-1.5 hover:bg-white/10 rounded transition-colors',
                  isCodeMode ? 'text-blue-400' : 'text-gray-400 hover:text-white'
                )}
                title="Code block"
              >
                <Code className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            {/* Input field */}
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder={isCodeMode ? "Paste or type code..." : "Type a message..."}
              rows={1}
              className={clsx(
                'flex-1 bg-transparent text-white text-sm py-3 pr-3 resize-none outline-none placeholder-gray-500',
                isCodeMode && 'font-mono'
              )}
              style={{ maxHeight: '150px' }}
            />

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim()}
              className={clsx(
                'p-3 m-1 rounded-lg transition-colors',
                inputValue.trim()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg border border-white/10 shadow-xl p-3 w-72 z-50">
              {Object.entries(emojis).map(([category, emojiList]) => (
                <div key={category} className="mb-3">
                  <div className="text-xs text-gray-400 mb-2 capitalize">{category}</div>
                  <div className="flex flex-wrap gap-1">
                    {emojiList.slice(0, 16).map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => insertEmoji(emoji)}
                        className="p-1.5 hover:bg-white/10 rounded text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
