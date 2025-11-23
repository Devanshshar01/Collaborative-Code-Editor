# Collaborative Code Editor - File System Integration Guide

## Overview
This document explains how to integrate the existing file system (FileTree + FileTreeManager) with your CodeEditor so you can create, edit, and save files like a normal code editor.

## What's Already Working
✅ FileTree component (src/components/FileTree.jsx) - renders file/folder tree with drag-drop, context menus
✅ FileTree Manager (src/utils/file-tree-manager.ts) - creates/deletes/renames files, stores content in Y.Text
✅ useFileTree hook (src/hooks/useFileTree.ts) - manages file tree state
✅ Basic CodeEditor with Yjs sync

## What Needs to Change

### 1. Update App.jsx
The App component needs to:
- Import and create a Yjs document for the file tree
- Use the useFileTree hook to get fileTreeManager and activeFileId
- Pass fileTreeManager and activeFileId to both Sidebar and CodeEditor
- Update handleFileSelect to use file IDs instead of file objects

**Key changes needed:**
```javascript
// Add imports
import * as Y from 'yjs';
import { useFileTree } from './hooks/useFileTree';

// Create Yjs doc for file tree (in component, using useRef)
const ydocRef = useRef(null);
if (!ydocRef.current) {
    ydocRef.current = new Y.Doc();
}

// Use the file tree hook
const { fileTreeManager, activeFileId, setActiveFileId } = useFileTree(roomId, ydocRef.current);

// Pass to Sidebar
<Sidebar
    ...existingProps
    fileTreeManager={fileTreeManager}
    activeFileId={activeFileId}
    onFileSelect={(fileId) => setActiveFileId(fileId)}
/>

// Pass to CodeEditor  
<CodeEditor
    ...existingProps
    fileTreeManager={fileTreeManager}
    activeFileId={activeFileId}
/>
```

### 2. Update Sidebar.jsx
The Sidebar needs to:
- Accept fileTreeManager, activeFileId, and onFileSelect props
- Replace the hardcoded dummy fileTree with the real FileTree component

**Key changes needed:**
```javascript
import FileTree from './FileTree';

// In the File Tree Section, replace renderFileTree(fileTree) with:
{fileTreeManager ? (
    <FileTree 
        fileTreeManager={fileTreeManager} 
        activeFileId={activeFileId}
        onFileSelect={onFileSelect}
    />
) : (
    <div className="p-4 text-xs text-text-secondary">Loading files...</div>
)}
```

### 3. Update CodeEditor.jsx
This is the MOST IMPORTANT change. The CodeEditor needs to:
- Accept fileTreeManager and activeFileId props
- Use the Y.Text from the selected file instead of a single shared Y.Text
- Re-initialize the editor when the activeFileId changes

**Key change - in the useEffect that creates the editor:**
```javascript
// Get the Y.Text for the active file
let ytext;
if (activeFileId && fileTreeManager) {
    ytext = fileTreeManager.getFileContent(activeFileId);
    if (!ytext) {
        console.warn('No content found for file:', activefile Id);
        ytext = ydocRef.current.getText('codemirror'); // Fallback
    }
} else {
    ytext = ydocRef.current.getText('codemirror'); // Default shared editor
}

const undoManager = new Y.UndoManager(ytext);
```

**Also update the dependencies array:**
```javascript
// Change from:
}, [language, theme, isConnected]);

// To:
}, [language, theme, isConnected, activeFileId, fileTreeManager]);
```

This will make the editor reinitialize whenever you select a different file!

## How It Will Work After Integration

1. **Creating Files**: Click the "+" button in the file tree sidebar → Creates a new file in the FileTreeManager → Auto-saved as Y.Text
2. **Selecting Files**: Click on a file in the tree → Sets activeFileId → CodeEditor loads that file's Y.Text content
3. **Editing**: Type in CodeEditor → Changes sync via Yjs to all connected users in real-time
4. **Saving**: Automatic! Changes to Y.Text are automatically synced

## Testing Steps

1. Start the app
2. Create a new file in the file tree (click + button)
3. Click on the file to select it
4. Type some code
5. Create another file
6. Switch between files - each should have its own content
7. Open another browser window with the same room - you should see the same files and be able to edit them collaboratively

## File Locations
- App.jsx: `src/App.jsx`
- Sidebar.jsx: `src/components/Sidebar.jsx`
- CodeEditor.jsx: `src/components/CodeEditor.jsx`
- FileTree.jsx: `src/components/FileTree.jsx` (no changes needed)
- FileTreeManager: `src/utils/file-tree-manager.ts` (no changes needed)
- useFileTree hook: `src/hooks/useFileTree.ts` (no changes needed)

## Additional Features Already Implemented
- **Rename**: Right-click → Rename
- **Delete**: Right-click → Delete  
- **Create Folder**: Right-click on folder → New Folder
- **Drag & Drop**: Drag files/folders to reorganize
- **Unique naming**: Automatically handles name conflicts

## Notes
- Each file's content is stored as a separate Y.Text in the Yjs document
- The file tree structure is also synced via Yjs
- Everything syncs in real-time across all connected users
- The FileTreeManager handles all the complex logic for you
