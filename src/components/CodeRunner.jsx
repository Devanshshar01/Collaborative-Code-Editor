import React, {useState} from 'react';
import axios from 'axios';
import './CodeRunner.css';

const CodeRunner = ({code, language, input = ''}) => {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [showOutput, setShowOutput] = useState(false);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

    // Language display names
    const languageNames = {
        python: 'Python',
        javascript: 'JavaScript',
        typescript: 'TypeScript',
        java: 'Java',
        cpp: 'C++',
        c: 'C',
        go: 'Go',
        html: 'HTML',
        css: 'CSS'
    };

    // Exit code meanings
    const getExitCodeMessage = (exitCode) => {
        if (exitCode === 0) return 'Success';
        if (exitCode === 124) return 'Timeout';
        if (exitCode === 137) return 'Out of Memory';
        if (exitCode === -1) return 'System Error';
        return `Exit Code ${exitCode}`;
    };

    const handleRun = async () => {
        // Validation
        if (!code || code.trim().length === 0) {
            setError('Please enter some code to execute');
            setShowOutput(true);
            return;
        }

        if (!language) {
            setError('Please select a language');
            setShowOutput(true);
            return;
        }

        // Reset state
        setIsRunning(true);
        setError(null);
        setResult(null);
        setShowOutput(true);

        try {
            const response = await axios.post(
                `${API_URL}/api/execute`,
                {
                    code,
                    language,
                    input
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10 second timeout for the HTTP request
                }
            );

            setResult(response.data);
            setError(null);
        } catch (err) {
            console.error('Execution error:', err);

            // Handle different error types
            if (err.code === 'ECONNABORTED') {
                setError('Request timeout - server took too long to respond');
            } else if (err.response) {
                // Server responded with error
                const errorData = err.response.data;
                setError(errorData.error || errorData.stderr || 'Execution failed');

                // If there's partial result data, show it
                if (errorData.stdout || errorData.stderr) {
                    setResult(errorData);
                }
            } else if (err.request) {
                // Request made but no response
                setError('Cannot connect to execution server. Is it running?');
            } else {
                // Other errors
                setError(err.message || 'An unexpected error occurred');
            }
        } finally {
            setIsRunning(false);
        }
    };

    const formatTime = (ms) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const handleKeyDown = (e) => {
        // Ctrl+Enter or Cmd+Enter to run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleRun();
        }
    };

    React.useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [code, language, input]);

    return (
        <div className="code-runner">
            <div className="runner-header">
                <button
                    className={`run-button ${isRunning ? 'running' : ''}`}
                    onClick={handleRun}
                    disabled={isRunning}
                >
                    {isRunning ? (
                        <>
                            <span className="spinner"></span>
                            <span>Running...</span>
                        </>
                    ) : (
                        <>
                            <span className="play-icon">▶</span>
                            <span>Run Code</span>
                        </>
                    )}
                </button>

                <div className="runner-info">
          <span className="language-badge">
            {languageNames[language] || language}
          </span>
                    {result && (
                        <span className="execution-time">
              ⏱ {formatTime(result.executionTime)}
            </span>
                    )}
                </div>

                {showOutput && (
                    <button
                        className="toggle-output"
                        onClick={() => setShowOutput(!showOutput)}
                        title="Toggle output"
                    >
                        {showOutput ? '▼' : '▶'} Output
                    </button>
                )}
            </div>

            {showOutput && (
                <div className="output-container">
                    {/* Loading State */}
                    {isRunning && (
                        <div className="output-loading">
                            <div className="loading-spinner"></div>
                            <p>Executing your code...</p>
                            <p className="loading-hint">
                                This may take a few seconds for compiled languages
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !result && (
                        <div className="output-error">
                            <div className="error-header">
                                <span className="error-icon">❌</span>
                                <span className="error-title">Execution Error</span>
                            </div>
                            <pre className="error-message">{error}</pre>
                        </div>
                    )}

                    {/* Success/Results State */}
                    {result && !isRunning && (
                        <div className="output-terminal">
                            {/* Status Bar */}
                            <div className={`status-bar ${result.exitCode === 0 ? 'success' : 'error'}`}>
                                <div className="status-left">
                  <span className="status-icon">
                    {result.exitCode === 0 ? '✓' : '✗'}
                  </span>
                                    <span className="status-text">
                    {getExitCodeMessage(result.exitCode)}
                  </span>
                                </div>
                                <div className="status-right">
                  <span className="stat-item">
                    <span className="stat-label">Time:</span>
                    <span className="stat-value">{formatTime(result.executionTime)}</span>
                  </span>
                                    <span className="stat-item">
                    <span className="stat-label">Exit:</span>
                    <span className="stat-value">{result.exitCode}</span>
                  </span>
                                </div>
                            </div>

                            {/* Standard Output */}
                            {result.stdout && (
                                <div className="output-section">
                                    <div className="section-header">
                                        <span className="section-icon">📤</span>
                                        <span className="section-title">Standard Output</span>
                                    </div>
                                    <pre className="output-content stdout">{result.stdout}</pre>
                                </div>
                            )}

                            {/* Standard Error */}
                            {result.stderr && (
                                <div className="output-section">
                                    <div className="section-header error">
                                        <span className="section-icon">⚠️</span>
                                        <span className="section-title">Standard Error</span>
                                    </div>
                                    <pre className="output-content stderr">{result.stderr}</pre>
                                </div>
                            )}

                            {/* No Output */}
                            {!result.stdout && !result.stderr && result.exitCode === 0 && (
                                <div className="output-empty">
                                    <span className="empty-icon">📝</span>
                                    <p>No output produced</p>
                                    <p className="empty-hint">
                                        Your code ran successfully but didn't print anything
                                    </p>
                                </div>
                            )}

                            {/* Compilation Error Detected */}
                            {result.stderr && result.stderr.includes('Compilation Error') && (
                                <div className="compilation-error-hint">
                                    <span className="hint-icon">💡</span>
                                    <span>Check your syntax and try again</span>
                                </div>
                            )}

                            {/* Timeout Detected */}
                            {result.stderr && result.stderr.includes('timeout') && (
                                <div className="timeout-hint">
                                    <span className="hint-icon">⏰</span>
                                    <span>Execution time limit: 5 seconds</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* No output yet */}
                    {!isRunning && !result && !error && (
                        <div className="output-empty">
                            <span className="empty-icon">🚀</span>
                            <p>Ready to run</p>
                            <p className="empty-hint">
                                Click "Run Code" or press Ctrl+Enter to execute
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Keyboard Shortcut Hint */}
            {!showOutput && (
                <div className="shortcut-hint">
                    Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to run
                </div>
            )}
        </div>
    );
};

export default CodeRunner;
