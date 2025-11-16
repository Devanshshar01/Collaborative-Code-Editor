# 📱 Sidebar Navigation Documentation

## Overview

A comprehensive sidebar navigation component featuring tab switching, file tree management, participant tracking, and
real-time chat messaging.

## ✨ Features

### **1. Tab Switcher**

- **Code Editor Tab**: Switch to code editing view
- **Whiteboard Tab**: Switch to collaborative drawing view
- **Settings Tab**: Access application settings
- **Active Indicator**: Visual highlight of current tab
- **Responsive Icons**: Full labels on desktop, icons only on tablets

### **2. File Tree**

- **Hierarchical Structure**: Nested folders and files
- **Expand/Collapse**: Click folders to toggle
- **File Icons**: Visual distinction between folders and files
- **Color Coding**: Folders (yellow), Files (blue)
- **Click to Open**: Select files for editing
- **Smooth Animations**: Collapse/expand with transitions

### **3. Participant List**

- **Real-time Updates**: Shows all online users
- **Status Indicators**: Green dot for online, gray for offline
- **User Avatars**: Circular avatars with user initials
- **Color Coding**: Each user has a unique color
- **Current User Highlight**: "You" label for current user
- **Count Display**: Total participants shown in header

### **4. Chat Panel**

- **Real-time Messaging**: Socket.IO powered chat
- **Message Bubbles**: Sent (blue) vs Received (gray)
- **Timestamps**: Show message time
- **System Messages**: Centered system notifications
- **Auto-scroll**: Scrolls to latest message
- **Send Button**: Submit with Enter or click
- **Input Validation**: Disabled when empty

### **5. Responsive Design**

- **Desktop** (1024px+): Full sidebar with labels
- **Tablet** (768px-1023px): Narrower sidebar, icon-only tabs
- **Collapsible**: Hide sidebar completely for more space
- **Smooth Animations**: Slide in/out transitions

---

## 🎨 Styling with Tailwind CSS

### **Custom Theme Colors**

```javascript
// tailwind.config.js
sidebar: {
  bg: '#1e1e1e',        // Main background
  hover: '#2d2d30',     // Hover state
  active: '#007acc',    // Active tab
  border: '#3e3e42'     // Borders
},
chat: {
  sent: '#007acc',      // Sent messages
  received: '#2d2d30',  // Received messages
  system: '#4a4a4a'     // System messages
}
```

### **Responsive Breakpoints**

- **md**: 768px (tablet)
- **lg**: 1024px (desktop)

### **Custom Classes**

- `.scrollbar-thin`: Custom scrollbar styling
- `.animate-slide-in`: Smooth sidebar entrance
- `.chat-bubble`: Message bubble styling

---

## 🔧 Component API

### **Props**

```typescript
interface SidebarProps {
  roomId: string;           // Current room identifier
  userId: string;           // Current user identifier
  userName: string;         // Display name
  socket: Socket | null;    // Socket.IO instance for chat
  participants?: Participant[]; // List of online users
  isCollapsed?: boolean;    // Sidebar collapsed state
  onToggleCollapse?: () => void; // Toggle callback
  onTabChange?: (tab: string) => void; // Tab change callback
  onFileSelect?: (file: object, path: string) => void; // File selection callback
}

interface Participant {
  id: string;
  name: string;
  color?: string;
  isOnline: boolean;
}
```

### **Usage Example**

```jsx
import Sidebar from './components/Sidebar';
import { useSocket } from './hooks/useSocket';

function App() {
  const { socket } = useSocket();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar
        roomId="my-room"
        userId="user-123"
        userName="John Doe"
        socket={socket}
        participants={[
          { id: 'user-456', name: 'Jane Smith', color: '#ff6b6b', isOnline: true },
          { id: 'user-789', name: 'Bob Johnson', color: '#4ecdc4', isOnline: false }
        ]}
        isCollapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onTabChange={(tab) => console.log('Tab changed to:', tab)}
        onFileSelect={(file, path) => console.log('File selected:', file, path)}
      />
      
      {/* Main content */}
      <div className="flex-1">
        {/* Your editor/whiteboard here */}
      </div>
    </div>
  );
}
```

---

## 💬 Chat Functionality

### **Socket.IO Events**

#### **Client → Server**

```javascript
// Send chat message
socket.emit('chat-message', {
  roomId: 'room-123',
  userId: 'user-123',
  userName: 'John',
  text: 'Hello everyone!',
  timestamp: Date.now()
});

// Send typing indicator
socket.emit('typing-indicator', {
  roomId: 'room-123',
  userName: 'John',
  isTyping: true
});
```

#### **Server → Client**

```javascript
// Receive chat message
socket.on('chat-message', (message) => {
  // message: { userId, userName, text, timestamp, type: 'received' }
});

// Receive system message
socket.on('system-message', (message) => {
  // message: { type: 'system', text, timestamp }
});

// User typing
socket.on('user-typing', (data) => {
  // data: { userName, isTyping }
});
```

### **Message Types**

#### **Sent Message**

```javascript
{
  userId: 'user-123',
  userName: 'John',
  text: 'Hello!',
  timestamp: 1699999999999,
  type: 'sent'
}
```

#### **Received Message**

```javascript
{
  userId: 'user-456',
  userName: 'Jane',
  text: 'Hi John!',
  timestamp: 1699999999999,
  type: 'received'
}
```

#### **System Message**

```javascript
{
  type: 'system',
  text: 'Jane joined the room',
  timestamp: 1699999999999
}
```

---

## 📁 File Tree Structure

### **Default File Tree**

```javascript
{
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
    { name: 'README.md', type: 'file', language: 'markdown' }
  ]
}
```

### **Customizing File Tree**

```javascript
// Update file tree structure
const customFileTree = {
  name: 'Project',
  type: 'folder',
  isOpen: true,
  children: [
    {
      name: 'backend',
      type: 'folder',
      isOpen: true,
      children: [
        { name: 'server.js', type: 'file', language: 'javascript' },
        { name: 'routes.js', type: 'file', language: 'javascript' }
      ]
    },
    {
      name: 'frontend',
      type: 'folder',
      isOpen: false,
      children: [
        { name: 'App.jsx', type: 'file', language: 'javascript' }
      ]
    }
  ]
};

// Pass to Sidebar
<Sidebar fileTree={customFileTree} />
```

---

## 🎯 Responsive Behavior

### **Desktop (1024px+)**

- Sidebar width: 320px (w-80)
- Full tab labels visible
- All sections expanded
- Maximum chat height

### **Tablet (768px-1023px)**

- Sidebar width: 288px (w-72)
- Tab labels hidden, icons only
- Condensed participant list
- Reduced chat area

### **Collapsed State**

- Sidebar width: 48px (w-12)
- Only expand icon visible
- All content hidden
- Click to expand

### **CSS Breakpoints**

```css
/* Tailwind responsive utilities used */
md:w-72     /* 768px+ */
lg:w-80     /* 1024px+ */
hidden md:inline  /* Hide on mobile, show on tablet+ */
```

---

## 🎨 Customization

### **Colors**

Update `tailwind.config.js` to customize colors:

```javascript
theme: {
  extend: {
    colors: {
      sidebar: {
        bg: '#your-color',
        hover: '#your-color',
        active: '#your-color',
        border: '#your-color'
      }
    }
  }
}
```

### **Icons**

Replace Lucide icons with your preferred icon library:

```javascript
// Current: lucide-react
import { Code, Palette } from 'lucide-react';

// Alternative: react-icons
import { FaCode, FaPalette } from 'react-icons/fa';
```

### **Layout**

Adjust section heights in the component:

```javascript
// File tree
<div className="max-h-64 overflow-y-auto">  // Adjust max-h-64

// Participants
<div className="max-h-48 overflow-y-auto">  // Adjust max-h-48

// Chat takes remaining space automatically
```

---

## 🔌 Integration with Existing Components

### **With Code Editor**

```jsx
<Sidebar
  onTabChange={(tab) => {
    if (tab === 'code') {
      setActiveView('editor');
    }
  }}
  onFileSelect={(file) => {
    // Load file content in code editor
    loadFileContent(file.name);
  }}
/>
```

### **With Whiteboard**

```jsx
<Sidebar
  onTabChange={(tab) => {
    if (tab === 'whiteboard') {
      setActiveView('whiteboard');
    }
  }}
/>
```

### **With Video Call**

```jsx
// Participants automatically sync from video call
<Sidebar
  participants={videoParticipants.map(p => ({
    id: p.peerId,
    name: p.metadata?.userName,
    color: generateColor(p.peerId),
    isOnline: p.stream !== null
  }))}
/>
```

---

## 📝 Server-Side Chat Implementation

The Socket.IO server already handles chat messages. Here's the implementation:

```typescript
// In src/core/socket.ts
socket.on('chat-message', (message) => {
  // Broadcast to all users in room except sender
  socket.to(message.roomId).emit('chat-message', {
    ...message,
    type: 'received'
  });
});

socket.on('typing-indicator', (data) => {
  socket.to(data.roomId).emit('user-typing', data);
});
```

---

## 🚀 Advanced Features

### **Typing Indicators** (Future Enhancement)

```javascript
// Add to Sidebar component
const [typingUsers, setTypingUsers] = useState([]);

useEffect(() => {
  if (!socket) return;
  
  socket.on('user-typing', (data) => {
    if (data.isTyping) {
      setTypingUsers(prev => [...prev, data.userName]);
    } else {
      setTypingUsers(prev => prev.filter(u => u !== data.userName));
    }
  });
}, [socket]);

// Show in UI
{typingUsers.length > 0 && (
  <div className="text-xs text-gray-500 px-4 py-2">
    {typingUsers.join(', ')} is typing...
  </div>
)}
```

### **File Upload** (Future Enhancement)

```javascript
const handleFileUpload = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    socket.emit('file-upload', {
      roomId,
      fileName: file.name,
      content: e.target.result
    });
  };
  reader.readAsText(file);
};
```

### **Emoji Support** (Future Enhancement)

```javascript
import EmojiPicker from 'emoji-picker-react';

const [showEmojiPicker, setShowEmojiPicker] = useState(false);

const onEmojiClick = (emojiObject) => {
  setNewMessage(prev => prev + emojiObject.emoji);
};
```

---

## 📊 Performance Considerations

### **Message Limit**

Automatically limit stored messages to prevent memory issues:

```javascript
setMessages(prev => {
  const newMessages = [...prev, message];
  // Keep only last 100 messages
  return newMessages.slice(-100);
});
```

### **Virtualized Lists** (For Large File Trees)

Consider using `react-window` for very large file trees:

```javascript
import { FixedSizeList } from 'react-window';
```

### **Debounced Typing Indicators**

```javascript
const debouncedTyping = debounce(() => {
  socket.emit('typing-indicator', {
    roomId,
    userName,
    isTyping: true
  });
}, 300);
```

---

## 🎯 Best Practices

1. **Always clean up Socket.IO listeners** in useEffect
2. **Validate messages** before sending
3. **Sanitize user input** to prevent XSS
4. **Limit message history** to prevent memory leaks
5. **Use Tailwind utilities** for consistent styling
6. **Test on different screen sizes** (mobile, tablet, desktop)

---

## 🐛 Troubleshooting

### **Chat Messages Not Appearing**

- Check Socket.IO connection status
- Verify room IDs match between users
- Check browser console for errors
- Ensure server is handling 'chat-message' event

### **File Tree Not Updating**

- Check fileTree state structure
- Verify toggleFolder function logic
- Ensure path strings match correctly

### **Participants Not Showing**

- Verify participants array is passed correctly
- Check participant object structure
- Ensure user colors are valid hex codes

### **Sidebar Not Responsive**

- Check Tailwind CSS is loaded
- Verify breakpoint classes (md:, lg:)
- Test in browser dev tools responsive mode

---

## 🚀 Future Enhancements

- **Search in Files**: Quick file finder
- **Recent Files**: Track recently opened files
- **File Upload**: Drag & drop file upload
- **Emoji Support**: Emoji picker for chat
- **Typing Indicators**: "User is typing..." notification
- **Read Receipts**: Message read status
- **Chat Reactions**: React to messages with emojis
- **Code Snippets in Chat**: Share code in chat messages
- **File Sharing**: Send files through chat
- **Voice Messages**: Record and send audio

---

**The sidebar is now fully integrated and ready to use!** 🎉