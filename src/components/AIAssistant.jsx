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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && !isMinimized && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, isMinimized]);

    const handleQuickAction = (action) => {
        const prompt = `${action.prompt}\n\n\`\`\`${language}\n${currentCode}\n\`\`\``;
        handleSend(prompt);
    };

    const handleSend = async (customPrompt = null) => {
        const message = customPrompt || input;
        if (!message.trim()) return;

        setInput('');
        const userMessage = { role: 'user', content: message };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Using free Hugging Face Inference API (no API key needed for basic usage)
            // You can replace this with OpenAI, Anthropic, or other AI services
            const response = await fetch('https://api-inference.huggingface.co/models/codellama/CodeLlama-7b-hf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: message,
                    parameters: {
                        max_new_tokens: 500,
                        temperature: 0.7,
                        top_p: 0.95,
                        return_full_text: false
                    }
                })
            });

            if (!response.ok) {
                throw new Error('AI service temporarily unavailable');
            }

            const data = await response.json();
            const aiResponse = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;

            if (aiResponse) {
                setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
            } else {
                // Fallback response
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'I apologize, but I\'m having trouble processing your request. The AI service might be loading or temporarily unavailable. Please try:\n\n1. **Waiting a moment** - The model might be loading\n2. **Simplifying your question** - Ask specific questions about the code\n3. **Using Quick Actions** - Try the preset buttons above\n\nFor best results, ask specific questions like:\n- "What does this function do?"\n- "How can I improve this code?"\n- "Are there any bugs in this code?"'
                }]);
            }
        } catch (error) {
            console.error('AI Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `**AI Service Unavailable**\n\nThe free AI service (Hugging Face) might be loading or experiencing high traffic. Here are some alternatives:\n\n**Quick Tips for ${language}:**\n${language === 'javascript' ? `
- Use const/let instead of var
- Add error handling with try/catch
- Use async/await for asynchronous code
- Consider adding JSDoc comments
` : language === 'python' ? `
- Follow PEP 8 style guidelines
- Use type hints for better clarity
- Add docstrings to functions
- Consider using list comprehensions
` : '- Follow language best practices\n- Add proper error handling\n- Write clear comments'}

You can also:\n- Check code manually for common issues\n- Review the language documentation\n- Ask your team members for feedback`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const extractCode = (text) => {
        const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
        const matches = [...text.matchAll(codeBlockRegex)];
        return matches.map(match => match[1].trim());
    };

    if (!isOpen) return null;

    return (
        <div className={clsx(
            "fixed bg-surface border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col transition-all duration-300",
            isMinimized
                ? "bottom-6 right-6 w-80 h-14"
                : "bottom-6 right-6 w-[500px] h-[600px]"
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
                                                    // Code block
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
                                                        <Check className="w-3 h-3" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3 h-3" />
                                                        Copy
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
