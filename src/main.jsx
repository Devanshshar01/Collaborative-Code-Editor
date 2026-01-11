import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

console.log('main.jsx loaded');
console.log('React:', React);
console.log('ReactDOM:', ReactDOM);

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

try {
  const root = ReactDOM.createRoot(rootElement);
  console.log('Root created:', root);

  root.render(
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );

  console.log('Render called successfully');
} catch (error) {
  console.error('Fatal error during initialization:', error);
  document.body.innerHTML = `<div style="color: red; padding: 20px;">
    <h1>Fatal Error</h1>
    <pre>${error.toString()}</pre>
  </div>`;
}
