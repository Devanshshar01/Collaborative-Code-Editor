import React, { useState, useEffect, useRef } from 'react';
import {
    Search,
    Code,
    Palette,
    Play,
    Download,
    Upload,
    GitBranch,
    Settings,
    Moon,
    Sun,
    Terminal,
    FileText,
    Zap,
    Command as CommandIcon
} from 'lucide-react';
import clsx from 'clsx';

const CommandPalette = ({ isOpen, onClose, onCommand }) => {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    const commands = [
        // File Operations
        { id: 'file.new', label: 'New File', icon: FileText, category: 'File', keywords: ['create', 'new'], action: () => onCommand('file.new') },
        { id: 'file.upload', label: 'Upload Files', icon: Upload, category: 'File', keywords: ['import'], action: () => onCommand('file.upload') },
        { id: 'file.download', label: 'Download Project', icon: Download, category: 'File', keywords: ['export', 'save'], action: () => onCommand('file.download') },

        // Code Actions
        { id: 'code.run', label: 'Run Code', icon: Play, category: 'Code', keywords: ['execute', 'compile'], shortcut: 'Ctrl+Enter', action: () => onCommand('code.run') },
        { id: 'code.format', label: 'Format Code', icon: Zap, category: 'Code', keywords: ['prettier', 'beautify'], shortcut: 'Shift+Alt+F', action: () => onCommand('code.format') },
        { id: 'code.ai', label: 'Ask AI Assistant', icon: Zap, category: 'AI', keywords: ['copilot', 'gpt', 'help'], shortcut: 'Ctrl+Shift+A', action: () => onCommand('code.ai') },

        // View
        { id: 'view.editor', label: 'Show Editor', icon: Code, category: 'View', keywords: ['code'], action: () => onCommand('view.editor') },
        { id: 'view.whiteboard', label: 'Show Whiteboard', icon: Palette, category: 'View', keywords: ['draw', 'canvas'], action: () => onCommand('view.whiteboard') },
        { id: 'view.split', label: 'Split View', icon: Code, category: 'View', keywords: ['layout'], action: () => onCommand('view.split') },
        { id: 'view.terminal', label: 'Toggle Terminal', icon: Terminal, category: 'View', keywords: ['console', 'shell'], shortcut: 'Ctrl+`', action: () => onCommand('view.terminal') },

        // Theme
        { id: 'theme.dark', label: 'Dark Theme', icon: Moon, category: 'Theme', keywords: ['appearance'], action: () => onCommand('theme.dark') },
        { id: 'theme.light', label: 'Light Theme', icon: Sun, category: 'Theme', keywords: ['appearance'], action: () => onCommand('theme.light') },

        // Git
        { id: 'git.commit', label: 'Git: Commit', icon: GitBranch, category: 'Git', keywords: ['source control'], action: () => onCommand('git.commit') },
        { id: 'git.push', label: 'Git: Push', icon: GitBranch, category: 'Git', keywords: ['upload', 'sync'], action: () => onCommand('git.push') },
        { id: 'git.pull', label: 'Git: Pull', icon: GitBranch, category: 'Git', keywords: ['download', 'sync'], action: () => onCommand('git.pull') },

        // Settings
        { id: 'settings.open', label: 'Open Settings', icon: Settings, category: 'Settings', keywords: ['preferences', 'config'], action: () => onCommand('settings.open') },
    ];

    const filteredCommands = commands.filter(cmd => {
        const searchLower = search.toLowerCase();
        return (
            cmd.label.toLowerCase().includes(searchLower) ||
            cmd.category.toLowerCase().includes(searchLower) ||
            cmd.keywords.some(kw => kw.includes(searchLower))
        );
    });

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    handleClose();
                }
            } else if (e.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex]);

    const handleClose = () => {
        setSearch('');
        setSelectedIndex(0);
        onClose();
    };

    const handleCommandClick = (command) => {
        command.action();
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh] animate-fade-in">
            <div className="w-full max-w-2xl mx-4 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-slide-up">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                    <Search className="w-5 h-5 text-text-secondary" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted text-sm focus:outline-none"
                    />
                    <div className="flex items-center gap-1 text-xs text-text-muted bg-white/5 px-2 py-1 rounded">
                        <CommandIcon className="w-3 h-3" />
                        <span>K</span>
                    </div>
                </div>

                {/* Commands List */}
                <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                    {filteredCommands.length === 0 ? (
                        <div className="p-8 text-center text-text-muted text-sm">
                            No commands found for "{search}"
                        </div>
                    ) : (
                        <div className="py-2">
                            {Object.entries(
                                filteredCommands.reduce((acc, cmd) => {
                                    if (!acc[cmd.category]) acc[cmd.category] = [];
                                    acc[cmd.category].push(cmd);
                                    return acc;
                                }, {})
                            ).map(([category, cmds]) => (
                                <div key={category} className="mb-2">
                                    <div className="px-4 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                        {category}
                                    </div>
                                    {cmds.map((cmd, idx) => {
                                        const globalIdx = filteredCommands.indexOf(cmd);
                                        return (
                                            <button
                                                key={cmd.id}
                                                onClick={() => handleCommandClick(cmd)}
                                                className={clsx(
                                                    'w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left',
                                                    globalIdx === selectedIndex
                                                        ? 'bg-primary/10 text-primary border-l-2 border-primary'
                                                        : 'text-text-primary hover:bg-white/5 border-l-2 border-transparent'
                                                )}
                                            >
                                                <cmd.icon className="w-4 h-4 shrink-0" />
                                                <span className="flex-1 text-sm font-medium">{cmd.label}</span>
                                                {cmd.shortcut && (
                                                    <span className="text-xs text-text-muted font-mono bg-white/5 px-2 py-0.5 rounded">
                                                        {cmd.shortcut}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-white/5 bg-surface-light/30 text-[10px] text-text-muted flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="bg-white/10 px-1 rounded">↑↓</kbd> Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="bg-white/10 px-1 rounded">↵</kbd> Execute
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="bg-white/10 px-1 rounded">Esc</kbd> Close
                        </span>
                    </div>
                    <span>{filteredCommands.length} commands</span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
