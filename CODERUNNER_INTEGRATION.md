# Integrating CodeRunner with Collaborative Editor

Guide for integrating the CodeRunner component into your existing collaborative code editor.

## Quick Integration

### Step 1: Install axios

```bash
npm install axios
```

### Step 2: Import CodeRunner

In your existing `CodeEditor.jsx` or `App.jsx`:

```jsx
import CodeRunner from './components/CodeRunner';
import './components/CodeRunner.css';
```

### Step 3: Add to Your UI

```jsx
function CodeEditor() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  
  return (
    <div className="editor-container">
      {/* Your existing CodeMirror editor */}
      <CodeMirror
        value={code}
        onChange={setCode}
      />
      
      {/* Add CodeRunner */}
      <CodeRunner 
        code={code} 
        language={language}
      />
    </div>
  );
}
```

## Full Integration Example

### Updated CodeEditor.jsx

```jsx
import React, { useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import CodeRunner from './CodeRunner';
import './CodeRunner.css';

const CodeEditor = ({ roomId }) => {
  const [code, setCode] = useState('print("Hello, World!")');
  const [language, setLanguage] = useState('python');
  const [input, setInput] = useState('');

  // Language selector with proper extensions
  const getLanguageExtension = (lang) => {
    switch(lang) {
      case 'python': return python();
      case 'javascript': 
      case 'typescript': return javascript();
      case 'java': return java();
      default: return javascript();
    }
  };

  return (
    <div className="code-editor-container">
      {/* Header with controls */}
      <div className="editor-header">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="language-selector"
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="go">Go</option>
        </select>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Standard input (optional)"
          className="stdin-input"
        />
      </div>

      {/* Code Editor */}
      <div className="editor-wrapper">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="code-input"
          rows={20}
          placeholder="Write your code here..."
        />
      </div>

      {/* Code Runner */}
      <CodeRunner 
        code={code}
        language={language}
        input={input}
      />
    </div>
  );
};

export default CodeEditor;
```

### Add Styles

```css
/* Add to your existing CSS file */
.code-editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
}

.editor-header {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #2d2d2d;
  border-bottom: 1px solid #3d3d3d;
}

.language-selector {
  padding: 0.5rem 1rem;
  background: #3d3d3d;
  color: #fff;
  border: 1px solid #4d4d4d;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
}

.stdin-input {
  flex: 1;
  padding: 0.5rem 1rem;
  background: #3d3d3d;
  color: #fff;
  border: 1px solid #4d4d4d;
  border-radius: 4px;
  font-size: 0.9rem;
}

.stdin-input::placeholder {
  color: #888;
}

.editor-wrapper {
  flex: 1;
  overflow: auto;
}

.code-input {
  width: 100%;
  height: 100%;
  padding: 1rem;
  background: #1e1e1e;
  color: #fff;
  border: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
}

.code-input:focus {
  outline: none;
}
```

## Integration with Existing Yjs Collaborative Editor

If you're using Yjs for collaborative editing:

```jsx
import React, { useEffect, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, basicSetup } from 'codemirror';
import { yCollab } from 'y-codemirror.next';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import CodeRunner from './CodeRunner';

const CollaborativeEditor = ({ roomId }) => {
  const [editorView, setEditorView] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');

  useEffect(() => {
    // Initialize Yjs document
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('codemirror');

    // Connect to Yjs server
    const provider = new WebsocketProvider(
      'ws://localhost:1234',
      `room-${roomId}`,
      ydoc
    );

    // Create CodeMirror editor with Yjs collaboration
    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        yCollab(ytext, provider.awareness),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setCode(update.state.doc.toString());
          }
        })
      ]
    });

    const view = new EditorView({
      state,
      parent: document.getElementById('editor')
    });

    setEditorView(view);

    return () => {
      provider.destroy();
      view.destroy();
    };
  }, [roomId]);

  return (
    <div>
      <div id="editor"></div>
      
      {/* Code Runner with collaborative code */}
      <CodeRunner 
        code={code}
        language={language}
      />
    </div>
  );
};

export default CollaborativeEditor;
```

## Integration with Video Call Feature

Add CodeRunner to your existing App.jsx with video:

```jsx
import React, { useState } from 'react';
import CodeEditor from './components/CodeEditor';
import VideoCall from './components/VideoCall';
import CodeRunner from './components/CodeRunner';
import Sidebar from './components/Sidebar';
import Whiteboard from './components/Whiteboard';

function App() {
  const [showVideo, setShowVideo] = useState(false);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [roomId] = useState('default-room');

  return (
    <div className="app-container">
      <Sidebar />
      
      <div className="main-content">
        {/* Code Editor */}
        <div className="editor-panel">
          <CodeEditor 
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            roomId={roomId}
          />
          
          {/* Code Runner */}
          <CodeRunner 
            code={code}
            language={language}
          />
        </div>

        {/* Video Call (if enabled) */}
        {showVideo && (
          <div className="video-panel">
            <VideoCall roomId={roomId} />
          </div>
        )}

        {/* Whiteboard */}
        <div className="whiteboard-panel">
          <Whiteboard roomId={roomId} />
        </div>
      </div>

      {/* Toggle Video Button */}
      <button 
        onClick={() => setShowVideo(!showVideo)}
        className="toggle-video-btn"
      >
        {showVideo ? 'Hide Video' : 'Show Video'}
      </button>
    </div>
  );
}

export default App;
```

## Layout Configurations

### Option 1: Side-by-Side Layout

```jsx
<div className="layout-horizontal">
  <div className="editor-section">
    <CodeEditor code={code} onChange={setCode} />
  </div>
  <div className="output-section">
    <CodeRunner code={code} language={language} />
  </div>
</div>
```

```css
.layout-horizontal {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  height: 100vh;
}

.editor-section, .output-section {
  overflow: auto;
}
```

### Option 2: Stacked Layout

```jsx
<div className="layout-vertical">
  <div className="editor-section">
    <CodeEditor code={code} onChange={setCode} />
  </div>
  <div className="output-section">
    <CodeRunner code={code} language={language} />
  </div>
</div>
```

```css
.layout-vertical {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.editor-section {
  flex: 2;
  overflow: auto;
}

.output-section {
  flex: 1;
  overflow: auto;
}
```

### Option 3: Tabbed Layout

```jsx
const [activeTab, setActiveTab] = useState('editor');

<div className="tabbed-layout">
  <div className="tabs">
    <button 
      className={activeTab === 'editor' ? 'active' : ''}
      onClick={() => setActiveTab('editor')}
    >
      Editor
    </button>
    <button 
      className={activeTab === 'output' ? 'active' : ''}
      onClick={() => setActiveTab('output')}
    >
      Output
    </button>
  </div>

  <div className="tab-content">
    {activeTab === 'editor' ? (
      <CodeEditor code={code} onChange={setCode} />
    ) : (
      <CodeRunner code={code} language={language} />
    )}
  </div>
</div>
```

## State Management Integration

### Using Context API

```jsx
// CodeContext.js
import React, { createContext, useContext, useState } from 'react';

const CodeContext = createContext();

export const CodeProvider = ({ children }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [input, setInput] = useState('');

  return (
    <CodeContext.Provider value={{
      code, setCode,
      language, setLanguage,
      input, setInput
    }}>
      {children}
    </CodeContext.Provider>
  );
};

export const useCode = () => useContext(CodeContext);

// Usage in components
function App() {
  return (
    <CodeProvider>
      <Editor />
      <Runner />
    </CodeProvider>
  );
}

function Editor() {
  const { code, setCode } = useCode();
  // ... editor implementation
}

function Runner() {
  const { code, language, input } = useCode();
  return <CodeRunner code={code} language={language} input={input} />;
}
```

## Real-time Collaboration

Share execution results with other users:

```jsx
import { useSocket } from './hooks/useSocket';

const CollaborativeRunner = ({ roomId, code, language }) => {
  const socket = useSocket();
  const [sharedResults, setSharedResults] = useState([]);

  const handleRunComplete = (result) => {
    // Broadcast result to room
    socket.emit('code-executed', {
      roomId,
      result,
      userId: socket.id,
      timestamp: Date.now()
    });
  };

  useEffect(() => {
    socket.on('code-executed', (data) => {
      setSharedResults(prev => [...prev, data]);
    });

    return () => socket.off('code-executed');
  }, [socket]);

  return (
    <div>
      <CodeRunner 
        code={code}
        language={language}
        onComplete={handleRunComplete}
      />

      {/* Show other users' results */}
      <div className="shared-results">
        <h3>Team Results</h3>
        {sharedResults.map((item, idx) => (
          <div key={idx} className="result-item">
            <span>User {item.userId}</span>
            <pre>{item.result.stdout}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Environment Setup

Update your `.env` file:

```bash
# Frontend .env
REACT_APP_API_URL=http://localhost:4000
REACT_APP_SOCKET_URL=http://localhost:4000
REACT_APP_YJS_URL=ws://localhost:1234
```

## Testing the Integration

1. **Start the backend**:
   ```bash
   npm start
   ```

2. **Build Docker images** (if not done):
   ```bash
   cd docker && ./build-images.sh
   ```

3. **Start your React app**:
   ```bash
   # In another terminal
   cd client && npm start
   ```

4. **Test the integration**:
    - Write code in the editor
    - Click "Run Code"
    - Verify output appears in CodeRunner

## Troubleshooting

### CORS Issues

Add CORS headers in your backend (`src/server.ts`):

```typescript
import cors from 'cors';

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

### State Sync Issues

Ensure code state is properly synced:

```jsx
// Debounce code updates
import { debounce } from 'lodash';

const debouncedSetCode = debounce(setCode, 300);

<textarea onChange={(e) => debouncedSetCode(e.target.value)} />
```

### Performance Issues

Lazy load CodeRunner:

```jsx
import { lazy, Suspense } from 'react';

const CodeRunner = lazy(() => import('./components/CodeRunner'));

function App() {
  return (
    <Suspense fallback={<div>Loading runner...</div>}>
      <CodeRunner code={code} language={language} />
    </Suspense>
  );
}
```

## Next Steps

1. ✅ Install axios: `npm install axios`
2. ✅ Integrate CodeRunner into your editor component
3. ✅ Test with different languages
4. ✅ Add input field for stdin
5. ✅ Style to match your theme
6. ✅ Add keyboard shortcuts
7. ✅ Implement result sharing (optional)
8. ✅ Add execution history (optional)

## Complete Example

See `CODERUNNER_GUIDE.md` for complete examples and advanced usage.

## Support

For integration issues:

- Check browser console for errors
- Verify backend is running
- Check CORS configuration
- Ensure axios is installed
- Review component props
