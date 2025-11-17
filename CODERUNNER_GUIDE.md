# CodeRunner Component Guide

A beautiful, feature-rich React component for executing code with terminal-style output display.

## Features

- ✅ **Beautiful UI**: Terminal-style output with modern design
- ✅ **Loading States**: Animated spinner with progress messages
- ✅ **Error Handling**: Comprehensive error display for all error types
- ✅ **Execution Metrics**: Display execution time and exit codes
- ✅ **Status Indicators**: Visual feedback for success/failure
- ✅ **Keyboard Shortcuts**: Ctrl+Enter to run code
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Compilation Errors**: Special handling for compile-time errors
- ✅ **Timeout Detection**: Clear feedback for timeout scenarios
- ✅ **Multiple Output Streams**: Separate display for stdout and stderr

## Installation

### 1. Install axios

```bash
npm install axios
```

### 2. Copy Component Files

The component consists of two files:

- `src/components/CodeRunner.jsx` - React component
- `src/components/CodeRunner.css` - Styles

Both files are already created in your project.

## Basic Usage

```jsx
import React, { useState } from 'react';
import CodeRunner from './components/CodeRunner';

function App() {
  const [code, setCode] = useState('print("Hello, World!")');
  const [language, setLanguage] = useState('python');
  const [input, setInput] = useState('');

  return (
    <div>
      <CodeRunner 
        code={code} 
        language={language} 
        input={input}
      />
    </div>
  );
}

export default App;
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `code` | string | Yes | - | The source code to execute |
| `language` | string | Yes | - | Programming language (python, javascript, etc.) |
| `input` | string | No | `''` | Standard input for the program |

### Supported Languages

- `python` - Python 3.11
- `javascript` - JavaScript (Node.js 20)
- `typescript` - TypeScript 5.3
- `java` - Java 17
- `cpp` - C++ (GCC 13)
- `c` - C (GCC 13)
- `go` - Go 1.21
- `html` - HTML
- `css` - CSS

## Integration Examples

### Example 1: With CodeMirror Editor

```jsx
import React, { useState } from 'react';
import CodeRunner from './components/CodeRunner';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

function CodeEditor() {
  const [code, setCode] = useState('print("Hello")');
  const [language, setLanguage] = useState('python');

  return (
    <div className="editor-container">
      {/* Language Selector */}
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="python">Python</option>
        <option value="javascript">JavaScript</option>
        <option value="java">Java</option>
        <option value="cpp">C++</option>
      </select>

      {/* Code Editor */}
      <CodeMirror
        value={code}
        height="400px"
        extensions={[python()]}
        onChange={(value) => setCode(value)}
      />

      {/* Code Runner */}
      <CodeRunner 
        code={code} 
        language={language}
      />
    </div>
  );
}
```

### Example 2: With Input Field

```jsx
import React, { useState } from 'react';
import CodeRunner from './components/CodeRunner';

function InteractiveRunner() {
  const [code, setCode] = useState('name = input("Enter name: ")\nprint(f"Hello, {name}!")');
  const [input, setInput] = useState('Alice');

  return (
    <div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={10}
        cols={50}
      />
      
      <div>
        <label>Standard Input:</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter input for your program"
        />
      </div>

      <CodeRunner 
        code={code} 
        language="python" 
        input={input}
      />
    </div>
  );
}
```

### Example 3: Multiple Code Runners

```jsx
import React, { useState } from 'react';
import CodeRunner from './components/CodeRunner';

function ComparisonView() {
  const pythonCode = 'print("Hello from Python")';
  const jsCode = 'console.log("Hello from JavaScript")';

  return (
    <div className="comparison">
      <div className="column">
        <h3>Python</h3>
        <CodeRunner code={pythonCode} language="python" />
      </div>
      
      <div className="column">
        <h3>JavaScript</h3>
        <CodeRunner code={jsCode} language="javascript" />
      </div>
    </div>
  );
}
```

## API Configuration

### Environment Variables

Set the API URL via environment variable:

```bash
# .env file
REACT_APP_API_URL=http://localhost:4000
```

Or in the component:

```jsx
// Modify in CodeRunner.jsx
const API_URL = 'http://your-server.com:4000';
```

### Custom Axios Configuration

To add authentication or custom headers, modify the axios call in `CodeRunner.jsx`:

```jsx
const response = await axios.post(
  `${API_URL}/api/execute`,
  { code, language, input },
  {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourToken}` // Add auth
    },
    timeout: 10000
  }
);
```

## UI States

### 1. Initial State

- Shows "Ready to run" message
- Keyboard shortcut hint visible
- Run button in default state

### 2. Running State

- Animated spinner in button
- Button text changes to "Running..."
- Loading message in output area
- Button disabled

### 3. Success State

- Green status bar with checkmark
- Execution time displayed
- stdout shown in green terminal
- Exit code displayed

### 4. Error State

- Red status bar with X mark
- Error message displayed
- stderr shown in yellow/orange
- Helpful hints for common errors

### 5. Empty Output State

- Message: "No output produced"
- Hint about successful execution

## Error Handling

The component handles various error scenarios:

### 1. Network Errors

```
Error: Cannot connect to execution server. Is it running?
```

### 2. Timeout Errors

```
Error: Request timeout - server took too long to respond
```

### 3. Compilation Errors

```
Compilation Error:
[compiler error messages]
💡 Check your syntax and try again
```

### 4. Runtime Errors

```
Standard Error:
[runtime error messages]
```

### 5. Validation Errors

```
Error: Please enter some code to execute
Error: Please select a language
```

## Keyboard Shortcuts

- **Ctrl + Enter** (Windows/Linux) or **Cmd + Enter** (Mac): Run code

## Styling

### Customization

The component uses CSS variables for easy theming:

```css
/* Add to your global CSS */
.code-runner {
  --primary-color: #667eea;
  --success-color: #10b981;
  --error-color: #ef4444;
  --background-dark: #1e1e1e;
  --background-darker: #1a1a1a;
}
```

### Custom Themes

Create a custom theme:

```css
/* Light theme example */
.code-runner.light-theme {
  background: #ffffff;
}

.code-runner.light-theme .runner-header {
  background: #f5f5f5;
}

.code-runner.light-theme .output-container {
  background: #fafafa;
  color: #333;
}
```

### Responsive Breakpoints

The component is responsive:

- **Desktop**: Full layout with all features
- **Tablet**: Adjusted spacing and flex wrapping
- **Mobile**: Stacked layout, full-width buttons

## Advanced Usage

### Custom Error Messages

```jsx
const [customError, setCustomError] = useState(null);

// In your error handling
if (response.status === 429) {
  setCustomError('Rate limit exceeded. Please wait.');
}
```

### Execution History

Track execution history:

```jsx
const [history, setHistory] = useState([]);

const handleRunComplete = (result) => {
  setHistory(prev => [...prev, {
    timestamp: new Date(),
    code,
    language,
    result
  }]);
};
```

### Progress Tracking

Show progress for long executions:

```jsx
const [progress, setProgress] = useState(0);

useEffect(() => {
  if (isRunning) {
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 10, 90));
    }, 500);
    return () => clearInterval(interval);
  }
}, [isRunning]);
```

## Performance Tips

### 1. Debounce Code Changes

```jsx
import { debounce } from 'lodash';

const debouncedRun = debounce(handleRun, 300);
```

### 2. Memoize Component

```jsx
import { memo } from 'react';

const CodeRunner = memo(({ code, language, input }) => {
  // ... component code
});
```

### 3. Lazy Load

```jsx
const CodeRunner = lazy(() => import('./components/CodeRunner'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CodeRunner code={code} language={language} />
    </Suspense>
  );
}
```

## Accessibility

The component includes:

- **Keyboard navigation**: Full keyboard support
- **Focus indicators**: Clear focus styles
- **ARIA labels**: Screen reader friendly
- **Semantic HTML**: Proper heading structure

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Troubleshooting

### Issue: "Cannot connect to execution server"

**Solution**: Ensure the backend server is running:

```bash
npm start
```

### Issue: Output not showing

**Solution**: Check that `showOutput` state is true. Click the "Output" toggle button.

### Issue: Styles not applying

**Solution**: Ensure `CodeRunner.css` is imported:

```jsx
import './CodeRunner.css';
```

### Issue: Axios errors

**Solution**: Install axios:

```bash
npm install axios
```

### Issue: CORS errors

**Solution**: Configure CORS in your backend:

```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

## Testing

### Unit Test Example

```jsx
import { render, fireEvent, waitFor } from '@testing-library/react';
import CodeRunner from './CodeRunner';
import axios from 'axios';

jest.mock('axios');

test('runs code successfully', async () => {
  axios.post.mockResolvedValue({
    data: {
      stdout: 'Hello, World!',
      stderr: '',
      exitCode: 0,
      executionTime: 100
    }
  });

  const { getByText, getByRole } = render(
    <CodeRunner code='print("Hello")' language="python" />
  );

  const runButton = getByRole('button', { name: /run code/i });
  fireEvent.click(runButton);

  await waitFor(() => {
    expect(getByText('Hello, World!')).toBeInTheDocument();
  });
});
```

## Examples Repository

For more examples, see the examples directory:

- Basic usage
- Integration with editors
- Custom themes
- Advanced error handling
- Execution history
- Multi-language support

## Contributing

To improve the CodeRunner component:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## License

ISC

## Support

For issues or questions:

- Check the troubleshooting section
- Review the API documentation
- Check browser console for errors
- Ensure backend is running and accessible
