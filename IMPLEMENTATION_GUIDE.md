# 🛠️ File System Implementation Guide

## ✅ Status: Files Restored

I've restored all corrupted files to their original working state:
- ✅ `src/App.jsx` - Restored
- ✅ `src/components/Sidebar.jsx` - Restored  
- ✅ `src/components/CodeEditor.jsx` - Restored

Your app should now run without errors!

## 🎯 Goal: Enable File System Like a Normal Code Editor

You want to:
1. Create new files and folders
2. Click on a file to edit it
3. Switch between files (each has its own content)
4. Auto-save everything via Yjs

## 📋 What You Already Have

Your project has these components ready to use:
- **FileTree Component** (`src/components/FileTree.jsx`) ✅
- **FileTreeManager** (`src/utils/file-tree-manager.ts`) ✅
- **useFileTree Hook** (`src/hooks/useFileTree.ts`) ✅

They just need to be connected!

## 🔧 Step-by-Step Implementation

### Step 1: Update App.jsx

**File**: `src/App.jsx`

**Line 1** - Add these imports at the top (after the existing imports):
```javascript
import * as Y from 'yjs';
import { useFileTree } from './hooks/useFileTree';
```

**After line 52** - Add Yjs doc and file tree setup (after the `selectedFile` state):
```javascript
// Create Yjs doc for file tree
const ydocRef = useRef(null);
if (!ydocRef.current) {
    ydocRef.current = new Y.Doc();
}

// Use file tree hook
const { fileTreeManager, activeFileId, setActiveFileId } = useFileTree(roomId, ydocRef.current);
```

**Around line 92** - Update the `handleFileSelect` function:
```javascript
const handleFileSelect = (fileId) => {
    console.log('File selected:', fileId);
    setActiveFileId(fileId);
};
```

**Around line 274** - Update the Sidebar props:
```javascript
<Sidebar
    roomId={roomId}
    userId={userId}
    userName={userName}
    socket={socket}
    fileTreeManager={fileTreeManager}
    activeFileId={activeFileId}
    onFileSelect={handleFileSelect}
    participants={onlineUsers.map(u => ({
        id: u.id,
        name: u.name,
        color: u.color,
        isOnline: true
    }))}
    isCollapsed={sidebarCollapsed}
    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
    onTabChange={handleSidebarTabChange}
/>
```

**Around line 297** - Update the CodeEditor props:
```javascript
<CodeEditor
    roomId={roomId}
    userId={userId}
    userName={userName}
    language="javascript"
    theme="dark"
    fileTreeManager={fileTreeManager}
    activeFileId={activeFileId}
    onSyncStatusChange={handleSyncStatusChange}
    onUserListChange={handleUserListChange}
    onError={handleError}
/>
```

### Step 2: Update Sidebar.jsx

**File**: `src/components/Sidebar.jsx`

**Line 17** - Add import for FileTree:
```javascript
import FileTree from './FileTree';
```

**Line 19** - Update the component props to include file tree props:
```javascript
const Sidebar = ({
    roomId,
    userId,
    userName,
    socket,
    fileTreeManager,
    activeFileId,
    onTabChange,
    onFileSelect,
    participants = [],
    isCollapsed = false,
    onToggleCollapse
}) => {
```

**Remove lines 33-60** - Delete the hardcoded `fileTree` state and toggle/click functions (lines with dummy file tree data)

**Around line 272** - Replace the file tree rendering:
```javascript
<div className="max-h-64 overflow-y-auto scrollbar-thin">
    {fileTreeManager ? (
        <FileTree 
            fileTreeManager={fileTreeManager} 
            activeFileId={activeFileId}
            onFileSelect={onFileSelect}
        />
    ) : (
        <div className="p-4 text-xs text-text-secondary">Loading files...</div>
    )}
</div>
```

### Step 3: Update CodeEditor.jsx

**File**: `src/components/CodeEditor.jsx`

**Line 27** - Update component props to include file tree props:
```javascript
const CodeEditor = ({ 
    roomId, 
    userId, 
    userName, 
    fileTreeManager,
    activeFileId,
    language: initialLanguage = 'javascript', 
    theme: initialTheme = 'dark', 
    onSyncStatusChange, 
    onUserListChange, 
    onError 
}) => {
```

**Around line 135** - Update Yeditor initialization to use the selected file:
```javascript
// Initialize CodeMirror editor
useEffect(() => {
    if (!editorRef.current || !ydocRef.current) return;

    // Get the Y.Text for the active file, or use default if no file selected
    let ytext;
    if (activeFileId && fileTreeManager) {
        ytext = fileTreeManager.getFileContent(activeFileId);
        if (!ytext) {
            console.warn('No content found for file:', activeFileId);
            ytext = ydocRef.current.getText('codemirror'); // Fallback
        }
    } else {
        ytext = ydocRef.current.getText('codemirror'); // Default shared editor
    }
    
    const undoManager = new Y.UndoManager(ytext);
    
    // ... rest of the editor setup code stays the same ...
```

**Around line 265** - Update the useEffect dependencies to re-render when file changes:
```javascript
}, [language, theme, isConnected, activeFileId, fileTreeManager]);
```

## 🚀 Testing Your Changes

After making all the changes above:

1. **Save all files**
2. **Refresh your browser** (or it should hot-reload automatically)
3. **Look at the sidebar** - you should see an empty file tree
4. **Click the "📄+" button** to create a new file
5. **Name it** `test.js`
6. **Click on the file** - it should open in the editor
7. **Type some code** - like `console.log('Hello!');`
8. **Create another file** - like `app.js`
9. **Switch between files** - each should keep its own content!

## ✨ Features You'll Have

After implementation:
- ✅ Create files and folders
- ✅ Rename files/folders (right-click → Rename)
- ✅ Delete files/folders (right-click → Delete)
- ✅ Drag-and-drop to reorganize
- ✅ Real-time sync across all users
- ✅ Auto-save (via Yjs)
- ✅ Each file has separate content
- ✅ Collaborative editing on the same file

## ❓ Troubleshooting

**If you see errors:**
1. Make sure all imports are at the top of the file
2. Check that`useRef` is imported in App.jsx (it should already be there)
3. Restart the dev server if hot-reload doesn't work

**If the file tree doesn't appear:**
1. Check the browser console for errors
2. Make sure `fileTreeManager` is being passed correctly
3. Verify that `ydocRef.current` is not null

**If files don't open when clicked:**
1. Check that `onFileSelect` is calling `setActiveFileId` correctly
2. Verify `activeFileId` is being passed to CodeEditor
3. Look for console errors

## 📝 Summary of Changes

1. **App.jsx**: Add Yjs doc, useFileTree hook, pass props to Sidebar and CodeEditor
2. **Sidebar.jsx**: Remove dummy data, use real FileTree component
3. **CodeEditor.jsx**: Accept file props, use selected file's Y.Text, update dependencies

That's it! About 50 lines of code total to add a complete file system! 🎉

## 💡 Next Steps

Once this is working, you can:
- Add more language support (add to `languageConfigs` in CodeEditor)- Add file upload/download
- Add file search
- Add keyboard shortcuts for file operations
- Add a file preview pane

Happy coding! 🚀
