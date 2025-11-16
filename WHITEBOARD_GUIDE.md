# 🎨 Collaborative Whiteboard Guide

A real-time collaborative whiteboard integrated with your code editor, powered by TLDraw and Yjs CRDT technology.

## ✨ Features Overview

### **Core Whiteboard Features**

- ✅ **Real-time collaboration** with multiple users
- ✅ **Drawing tools**: Pen, highlighter, shapes, text, arrows
- ✅ **Shapes**: Rectangles, circles, diamonds, triangles, lines
- ✅ **Text annotations** with rich formatting
- ✅ **Image support** with drag & drop
- ✅ **Infinite canvas** with zoom and pan
- ✅ **Undo/redo** functionality

### **Collaboration Features**

- ✅ **Multi-user cursors** with unique colors
- ✅ **Real-time synchronization** using Yjs CRDT
- ✅ **Conflict-free editing** - no race conditions
- ✅ **Offline editing** with automatic sync when reconnected
- ✅ **User presence indicators** showing who's online
- ✅ **Admin controls** for whiteboard management

### **Export & Sharing**

- ✅ **PNG export** - High-quality image download
- ✅ **PDF export** - Vector-based document export
- ✅ **JSON data export** - Full whiteboard state backup
- ✅ **Large diagram optimization** - Efficient handling of complex drawings

### **Integration Features**

- ✅ **Code snippet shapes** - Embed code directly in whiteboard
- ✅ **Annotation shapes** - Timestamped comments with author attribution
- ✅ **View modes**: Code-only, Whiteboard-only, Split-view
- ✅ **Persistent storage** using IndexedDB for offline access

---

## 🚀 Getting Started

### **Accessing the Whiteboard**

1. **Join a room** in the collaborative editor
2. **Click the "🎨 Draw" button** in the header to switch to whiteboard view
3. **Or use "🔀 Split"** to see both code and whiteboard side by side

### **View Modes**

- **💻 Code**: Code editor only (default)
- **🎨 Draw**: Whiteboard only (full screen)
- **🔀 Split**: Code editor and whiteboard side by side

### **Basic Drawing**

1. **Select tools** from the TLDraw toolbar on the left
2. **Draw** by clicking and dragging on the canvas
3. **Add shapes** using the shape tools (rectangle, circle, etc.)
4. **Add text** using the text tool - double-click to edit
5. **Move objects** using the select tool

---

## 🔧 Collaboration Features

### **Real-Time Synchronization**

**How it works:**

- All drawing actions sync in real-time using Yjs CRDT
- No conflicts - multiple users can edit simultaneously
- Changes persist across sessions via MongoDB snapshots

**Status indicators:**

- 🟢 **Green dot**: Connected and synced
- 🟠 **Orange dot**: Connected but syncing
- 🔴 **Red dot**: Offline (changes saved locally)

### **Multi-User Cursors**

Each user has a unique colored cursor that shows:

- **Real-time position** as they move around the canvas
- **User name** label next to the cursor
- **Consistent color** throughout the session

### **User Presence**

The toolbar shows:

- **Total users online** (including yourself)
- **User avatars** with initials and colors
- **"+N" indicator** if more than 5 users are online

---

## 🎨 Drawing Tools & Shapes

### **Built-in Tools**

- **✏️ Draw**: Free-hand drawing with various brush sizes
- **📝 Text**: Add text annotations anywhere
- **⭕ Shapes**: Rectangle, circle, diamond, triangle, star, hexagon
- **➡️ Arrow**: Directional arrows with different styles
- **🖍️ Highlighter**: Semi-transparent highlighting tool
- **⚡ Line**: Straight lines with different styles and thickness

### **Custom Shapes**

#### **📋 Annotation Shape**

Perfect for code reviews and feedback:

```jsx
// Usage in component
const addAnnotation = (point, text) => {
  WhiteboardUtils.createAnnotation(
    editor,           // TLDraw editor instance
    point,           // {x, y} position
    text,            // Comment text
    userName,        // Author name
    userColor        // User's color
  );
};
```

Features:

- **Timestamped comments** with author attribution
- **Color-coded** by user
- **Editable text** - double-click to modify
- **Auto-sized** based on content

#### **💻 Code Snippet Shape**

Embed code directly in whiteboard:

```jsx
// Usage in component
const addCodeSnippet = (point, code, language) => {
  WhiteboardUtils.createCodeSnippet(
    editor,           // TLDraw editor instance
    point,           // {x, y} position
    code,            // Code content
    language         // 'javascript', 'python', 'java'
  );
};
```

Features:

- **Syntax highlighting** for different languages
- **Editable content** - click to modify code
- **Language selector** in the header
- **Dark/light theme** support

---

## 📤 Export Functionality

### **PNG Export**

```javascript
// Exports the entire visible whiteboard as high-quality PNG
handleExportPNG()
```

**Features:**

- **High resolution** (2x scale for crisp images)
- **White background** for clean printing
- **Automatic filename** with room ID and date
- **Handles large diagrams** efficiently

### **PDF Export**

```javascript
// Exports whiteboard as vector PDF document
handleExportPDF()
```

**Features:**

- **Vector-based** - scalable without quality loss
- **Auto-orientation** - landscape/portrait based on content
- **Preserves quality** at any zoom level
- **Professional format** for sharing and archiving

### **JSON Data Export**

```javascript
// Exports complete whiteboard state as JSON
handleExportData()
```

**Includes:**

- All shapes with properties
- Bindings (connections between shapes)
- Assets (images, etc.)
- Metadata (export time, room ID, shape count)

**Use cases:**

- **Backup** whiteboard sessions
- **Version control** for diagrams
- **Migration** between rooms
- **Analysis** of drawing patterns

---

## ⚙️ Admin Controls

### **Enabling Admin Mode**

1. **Open Settings** (⚙️ button in header)
2. **Check "Admin Mode"** checkbox
3. **Save settings**
4. **Crown icon** 👑 appears next to your name

### **Admin Capabilities**

#### **Clear Whiteboard**

- **Red "🧹 Clear" button** appears in whiteboard toolbar
- **Confirmation dialog** prevents accidental clears
- **Syncs to all users** immediately
- **Cannot be undone** - use with caution

```jsx
// Admin check in component
{isAdmin && (
  <button onClick={handleClearWhiteboard}>
    🧹 Clear
  </button>
)}
```

### **Alternative Admin Setup**

For testing, create an admin room by including "admin" in the room name:

```
http://localhost:3000?room=admin-test-room
```

---

## 🔄 Performance Optimization

### **Large Diagram Handling**

The whiteboard automatically optimizes performance for large diagrams:

#### **Shape Limits**

- **Default limit**: 10,000 shapes per whiteboard
- **Auto-cleanup**: Removes oldest shapes when limit exceeded
- **Configurable**: Set `REACT_APP_TLDRAW_MAX_SHAPES` in `.env`

#### **Memory Management**

- **Viewport culling**: Only renders visible shapes
- **Efficient serialization**: Optimized Yjs operations
- **Local caching**: IndexedDB for offline access
- **Debounced sync**: Batches rapid changes

#### **Network Optimization**

- **Binary protocol**: Efficient Yjs updates over WebSocket
- **Compression**: Automatic compression of large updates
- **Incremental sync**: Only sends changed shapes
- **Connection pooling**: Reuses WebSocket connections

### **Performance Monitoring**

Watch the toolbar for performance indicators:

- **Shape count**: Current number of shapes
- **User count**: Active collaborators
- **Connection status**: Real-time sync state

---

## 🛠️ Troubleshooting

### **Common Issues**

#### **Whiteboard Not Loading**

1. Check browser console for errors
2. Verify Yjs WebSocket server is running (port 1234)
3. Ensure IndexedDB is available in browser
4. Try refreshing the page

#### **Shapes Not Syncing**

1. Check connection status indicator
2. Verify other users are in same room
3. Look for WebSocket connection errors
4. Check MongoDB is running and accessible

#### **Export Not Working**

1. Ensure whiteboard has content to export
2. Check browser allows file downloads
3. Verify canvas element is rendered
4. Try a different export format

#### **Performance Issues**

1. Check shape count in toolbar
2. Use "Clear" button to remove old shapes (admin)
3. Reduce shape complexity
4. Close unnecessary browser tabs

### **Debug Information**

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('tldraw-debug', 'true');
// Reload page to see debug logs
```

---

## 🎯 Best Practices

### **For Collaboration**

- **Use headings and labels** for organized diagrams
- **Color-code** different types of content
- **Add timestamps** to annotations for context
- **Export regularly** to backup important work

### **For Performance**

- **Limit complexity** - break large diagrams into multiple rooms
- **Clean up regularly** - remove unnecessary shapes
- **Use vector shapes** instead of complex drawings when possible
- **Export and clear** completed diagrams

### **For Presentations**

- **Use PDF export** for sharing with stakeholders
- **PNG export** for embedding in documents
- **Split view** for explaining code with diagrams
- **Annotation shapes** for detailed feedback

---

## 🔌 API Integration

### **Programmatic Control**

```jsx
import { WhiteboardUtils } from '../utils/tldraw-shapes';

// Add annotation programmatically
const addComment = () => {
  WhiteboardUtils.createAnnotation(
    editor,
    { x: 100, y: 100 },
    'This needs refactoring',
    userName,
    '#ff6b6b'
  );
};

// Add code snippet
const addCode = () => {
  WhiteboardUtils.createCodeSnippet(
    editor,
    { x: 200, y: 200 },
    'function example() {\n  return "Hello";\n}',
    'javascript'
  );
};
```

### **Event Listeners**

```javascript
// Listen for shape changes
provider.on('shapes-change', (changes) => {
  console.log('Shapes updated:', changes);
});

// Listen for user presence changes
provider.on('awareness-change', (users) => {
  console.log('Users online:', users);
});
```

---

## 🚀 Advanced Usage

### **Custom Tools**

You can extend the whiteboard with custom tools:

```jsx
// Custom tool example
const customTools = [
  {
    id: 'annotation-tool',
    icon: '💬',
    label: 'Add Comment',
    onSelect: () => {
      // Add annotation at current cursor position
    }
  }
];
```

### **Keyboard Shortcuts**

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `D` | Draw tool |
| `R` | Rectangle |
| `O` | Circle |
| `T` | Text |
| `A` | Arrow |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Space+Drag` | Pan canvas |
| `Ctrl+Scroll` | Zoom |
| `Ctrl+0` | Zoom to fit |

### **Collaborative Workflows**

#### **Code Review Process**

1. **Developer shares** code in split view
2. **Reviewers add annotations** on whiteboard
3. **Discussion points** highlighted with arrows
4. **Export final review** as PDF

#### **System Architecture Design**

1. **Start with basic shapes** for components
2. **Add arrows** for data flow
3. **Use text annotations** for specifications
4. **Color-code** different layers/concerns
5. **Export for documentation**

#### **Bug Triage Session**

1. **Draw user flow** with shapes and arrows
2. **Mark problem areas** with red annotations
3. **Add code snippets** showing relevant parts
4. **Export session notes** for follow-up

---

## 📱 Mobile & Touch Support

### **Touch Gestures**

- **Single finger**: Draw/select
- **Two finger pinch**: Zoom in/out
- **Two finger drag**: Pan canvas
- **Long press**: Context menu
- **Double tap**: Edit text/shapes

### **Mobile Optimization**

- **Touch-friendly** button sizes
- **Responsive toolbar** layout
- **Gesture recognition** for natural drawing
- **Performance optimizations** for mobile devices

---

## 🔮 Future Enhancements

### **Planned Features**

- **Voice annotations** - Record audio comments
- **Video integration** - Embed video calls in whiteboard
- **Template library** - Predefined diagram templates
- **Collaborative cursors** - See where others are looking
- **Smart shapes** - Auto-connect related shapes
- **Export integrations** - Direct export to Google Drive, Notion, etc.

### **API Extensions**

- **Webhook notifications** for shape changes
- **External integrations** with project management tools
- **Automated diagram generation** from code analysis
- **AI-powered** shape suggestions

---

**Ready to start drawing?** Click the "🎨 Draw" button in your collaborative editor and begin creating diagrams with your
team in real-time!