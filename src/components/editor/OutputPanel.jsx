import React, { useState } from 'react';
import { X, Terminal, AlertCircle, Clock } from 'lucide-react';
import Button from '../ui/Button';
import './OutputPanel.css';

const OutputPanel = ({
    output,
    onClose,
    isRunning,
    className = ''
}) => {
    const [activeTab, setActiveTab] = useState('output'); // output, problems, logs

    return (
        <div className={`output-panel ${className}`}>
            <div className="output-header">
                <div className="output-tabs">
                    <button
                        className={`output-tab ${activeTab === 'output' ? 'active' : ''}`}
                        onClick={() => setActiveTab('output')}
                    >
                        Output
                    </button>
                    <button
                        className={`output-tab ${activeTab === 'problems' ? 'active' : ''}`}
                        onClick={() => setActiveTab('problems')}
                    >
                        Problems {output?.stderr ? '(1)' : ''}
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {output?.exitCode !== undefined && (
                        <span className="text-xs text-text-secondary flex items-center gap-1">
                            <Clock size={12} />
                            Exited: {output.exitCode}
                        </span>
                    )}
                    <Button variant="ghost" size="sm" onClick={onClose} className="!p-1">
                        <X size={14} />
                    </Button>
                </div>
            </div>

            <div className="output-content custom-scrollbar">
                {isRunning ? (
                    <div className="output-empty">
                        <div className="animate-spin text-primary">
                            <Terminal size={24} />
                        </div>
                        <span>Running code...</span>
                    </div>
                ) : !output ? (
                    <div className="output-empty">
                        <Terminal size={24} />
                        <span>Run code to see output</span>
                    </div>
                ) : (
                    <>
                        {activeTab === 'output' && (
                            output.stdout ? (
                                <pre>{output.stdout}</pre>
                            ) : (
                                <span className="text-text-tertiary italic">No output</span>
                            )
                        )}

                        {activeTab === 'problems' && (
                            output.stderr ? (
                                <div>
                                    <div className="flex items-center gap-2 text-error mb-2">
                                        <AlertCircle size={14} />
                                        <span className="font-bold">Runtime Error</span>
                                    </div>
                                    <pre className="output-error">{output.stderr}</pre>
                                </div>
                            ) : (
                                <span className="text-text-tertiary italic">No problems detected</span>
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default OutputPanel;
