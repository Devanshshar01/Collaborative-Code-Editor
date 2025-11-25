import React, { useState, useRef, useEffect } from 'react';
import {
    Sparkles,
    Send,
    X,
    Copy,
    Check,
    Loader2,
    Code2,
    MessageSquare,
    Lightbulb,
    Bug,
    RefreshCw,
    Minimize2,
    Maximize2
} from 'lucide-react';
import clsx from 'clsx';

/**
 * AI Code Assistant – chat interface powered by Google Gemini.
 * Replace `YOUR_GEMINI_API_KEY` with a valid key or set it in the environment
 * variable `GEMINI_API_KEY`. The component works without a key by showing a fallback
 * response.
 */
const AIAssistant = ({ isOpen, onClose, currentCode, onInsertCode, language }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const quickActions = [
        { id: 'explain', label: 'Explain Code', icon: MessageSquare, prompt: 'Explain this code in detail:' },
        { id: 'optimize', label: 'Optimize', icon: Sparkles, prompt: 'Optimize this code for better performance:' },
        { id: 'debug', label: 'Find Bugs', icon: Bug, prompt: 'Find potential bugs or issues in this code:' },
        { id: 'refactor', label: 'Refactor', icon: RefreshCw, prompt: 'Refactor this code following best practices:' },
        { id: 'document', label: 'Add Docs', icon: Code2, prompt: 'Add comprehensive documentation and comments to this code:' },
        { id: 'test', label: 'Generate Tests', icon: Lightbulb, prompt: 'Generate unit tests for this code:' }
    ];

    // Auto‑scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen && !isMinimized && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, isMinimized]);

    const handleQuickAction = (action) => {
        const prompt = `${action.prompt}\n\n\`\`\`${language}\n${currentCode}\n\`\`\``;
        handleSend(prompt);
    };

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Optional helper to extract fenced code blocks from a response
    const extractCode = (text) => {
        const codeBlockRegex = /```[\\w]*\n([\\s\\S]*?)```/g;
        const matches = [...text.matchAll(codeBlockRegex)];
        return matches.map(m => m[1].trim());
    };

    const handleSend = async (customPrompt = null) => {
        const message = customPrompt || input;
        if (!message.trim()) return;

        const userMessage = { role: 'user', content: message };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const apiKey = process.env.GEMINI_API_KEY || '';
            if (!apiKey) throw new Error('Gemini API key not set');

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: message }] }]
                })
            });

            if (!response.ok) throw new Error('Gemini service unavailable');
            const data = await response.json();
            const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
            setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
        } catch (error) {
            console.error('AI Error:', error);
            // Simple fallback – echo the request so UI stays usable
            const fallback = `Gemini unavailable. Your request was:\n\n"${message}"`;
            setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={clsx(
            "fixed bg-surface border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col transition-all duration-300",
            isMinimized ? "bottom-6 right-6 w-80 h-14" : "bottom-6 right-6 w-[500px] h-[600px]"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-purple-600/10 to-blue-600/10 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-sm text-text-primary">AI Code Assistant</h3>
                    {isLoading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-text-secondary hover:text-white"
                        title={isMinimized ? "Maximize" : "Minimize"}
                    >
                        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-text-secondary hover:text-white"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Body – hidden when minimized */}
            {!isMinimized && (
                <>
                    {/* Quick Actions */}
                    <div className="px-4 py-3 border-b border-white/5 bg-surface-light/30 shrink-0">
                        <div className="grid grid-cols-3 gap-2">
                            {quickActions.map(action => (
                                <button
                                    key={action.id}
                                    onClick={() => handleQuickAction(action)}
                                    disabled={isLoading || !currentCode}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                                        isLoading || !currentCode
                                            ? "bg-white/5 text-text-muted cursor-not-allowed opacity-50"
                                            : "bg-white/5 hover:bg-white/10 text-text-primary border-white/10 hover:border-primary/30"
                                    )}
                                >
                                    <action.icon className="w-3.5 h-3.5" />
                                    <span className="truncate">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl flex items-center justify-center mb-4">
                                    <Sparkles className="w-8 h-8 text-purple-400" />
                                </div>
                                <h4 className="text-sm font-bold text-text-primary mb-2">AI Code Assistant Ready</h4>
                                <p className="text-xs text-text-muted mb-4">
                                    Ask me anything about your code! I can help with:
                                </p>
                                <ul className="text-xs text-text-secondary space-y-1 text-left">
                                    <li>• Explaining complex code</li>
                                    <li>• Finding bugs and issues</li>
                                    <li>• Optimizing performance</li>
                                    <li>• Generating documentation</li>
                                    <li>• Writing unit tests</li>
                                </ul>
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={clsx(
                                        "flex gap-3 animate-fade-in",
                                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                                    )}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    <div
                                        className={clsx(
                                            "max-w-[85%] rounded-xl p-3 text-sm",
                                            msg.role === 'user'
                                                ? 'bg-primary text-white'
                                                : 'bg-surface-light border border-white/10 text-text-primary'
                                        )}
                                    >
                                        <div className="whitespace-pre-wrap break-words">
                                            {msg.content.split('```').map((part, i) => {
                                                if (i % 2 === 1) {
                                                    const lines = part.split('\n');
                                                    const lang = lines[0];
                                                    const code = lines.slice(1).join('\n');
                                                    return (
                                                        <div key={i} className="my-2 relative group">
                                                            <div className="bg-black/30 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                                                                <div className="text-text-muted text-[10px] mb-2">{lang || 'code'}</div>
                                                                <pre className="text-text-primary">{code}</pre>
                                                            </div>
                                                            <button
                                                                onClick={() => handleCopy(code, `${index}-${i}`)}
                                                                className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                {copiedIndex === `${index}-${i}` ? (
                                                                    <Check className="w-3 h-3 text-green-400" />
                                                                ) : (
                                                                    <Copy className="w-3 h-3 text-white" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    );
                                                }
                                                return <span key={i}>{part}</span>;
                                            })}
                                        </div>
                                        {msg.role === 'assistant' && (
                                            <button
                                                onClick={() => handleCopy(msg.content, index)}
                                                className="mt-2 text-xs text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
                                            >
                                                {copiedIndex === index ? (
                                                    <>
                                                        <Check className="w-3 h-3" /> Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3 h-3" /> Copy
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                </div>
                                <div className="bg-surface-light border border-white/10 rounded-xl p-3 text-sm text-text-secondary">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 border-t border-white/5 bg-surface-light/30 shrink-0">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask anything about your code..."
                                disabled={isLoading}
                                className="flex-1 bg-background-secondary border border-white/10 text-text-primary px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-text-muted disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className={clsx(
                                    "p-2 rounded-lg transition-all shrink-0",
                                    input.trim() && !isLoading
                                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 shadow-lg"
                                        : "bg-white/5 text-text-muted cursor-not-allowed"
                                )}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <div className="mt-2 text-[10px] text-text-muted">
                            💡 Tip: Select code in the editor and ask specific questions for better results
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};

export default AIAssistant;
