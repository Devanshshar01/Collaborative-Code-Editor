/**
 * Quick Open / Search Overlay Component
 * VS Code-style Ctrl+P file search with fuzzy matching
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    Search,
    File,
    FileCode,
    FileText,
    Folder,
    Clock,
    X,
    Command,
    ArrowUp,
    ArrowDown,
    CornerDownLeft,
} from 'lucide-react';
import clsx from 'clsx';
import { useWorkspaceStore } from '../stores/workspaceStore';

// Fuzzy search scoring
const fuzzyMatch = (pattern, str) => {
    const patternLower = pattern.toLowerCase();
    const strLower = str.toLowerCase();
    
    let score = 0;
    let patternIdx = 0;
    let prevMatchIdx = -1;
    let consecutive = 0;
    const matchedIndices = [];

    for (let i = 0; i < str.length && patternIdx < pattern.length; i++) {
        if (strLower[i] === patternLower[patternIdx]) {
            matchedIndices.push(i);
            
            // Bonus for consecutive matches
            if (prevMatchIdx === i - 1) {
                consecutive++;
                score += 10 + consecutive * 5;
            } else {
                consecutive = 0;
                score += 5;
            }

            // Bonus for start of word
            if (i === 0 || /[^a-zA-Z0-9]/.test(str[i - 1])) {
                score += 20;
            }

            // Bonus for camelCase matches
            if (i > 0 && str[i] === str[i].toUpperCase() && str[i - 1] === str[i - 1].toLowerCase()) {
                score += 15;
            }

            prevMatchIdx = i;
            patternIdx++;
        }
    }

    // Return null if pattern wasn't fully matched
    if (patternIdx < pattern.length) {
        return null;
    }

    // Bonus for shorter strings (prefer exact matches)
    score += Math.max(0, 100 - str.length);

    // Bonus for filename matches
    const filename = str.split('/').pop() || str;
    if (filename.toLowerCase().includes(patternLower)) {
        score += 50;
    }

    return { score, matchedIndices };
};

// Highlight matched characters
const HighlightedText = ({ text, matchedIndices = [] }) => {
    if (matchedIndices.length === 0) {
        return <span>{text}</span>;
    }

    const result = [];
    let lastIndex = 0;

    matchedIndices.forEach((idx, i) => {
        // Add non-matched text
        if (idx > lastIndex) {
            result.push(
                <span key={`text-${i}`} className="text-[#858585]">
                    {text.slice(lastIndex, idx)}
                </span>
            );
        }
        // Add matched character
        result.push(
            <span key={`match-${i}`} className="text-[#18a3ff] font-medium">
                {text[idx]}
            </span>
        );
        lastIndex = idx + 1;
    });

    // Add remaining text
    if (lastIndex < text.length) {
        result.push(
            <span key="text-end" className="text-[#858585]">
                {text.slice(lastIndex)}
            </span>
        );
    }

    return <>{result}</>;
};

// Search result item
const SearchResultItem = ({ 
    result, 
    isSelected, 
    onSelect,
    onMouseEnter,
}) => {
    const ext = result.name.split('.').pop()?.toLowerCase();
    
    const getIcon = () => {
        const iconMap = {
            js: <FileCode className="w-4 h-4 text-yellow-400" />,
            jsx: <FileCode className="w-4 h-4 text-[#61DAFB]" />,
            ts: <FileCode className="w-4 h-4 text-blue-500" />,
            tsx: <FileCode className="w-4 h-4 text-blue-400" />,
            py: <FileCode className="w-4 h-4 text-yellow-500" />,
            json: <FileText className="w-4 h-4 text-yellow-500" />,
            md: <FileText className="w-4 h-4 text-blue-400" />,
        };
        return iconMap[ext] || <File className="w-4 h-4 text-gray-400" />;
    };

    return (
        <div
            className={clsx(
                'flex items-center gap-3 px-3 py-2 cursor-pointer',
                isSelected ? 'bg-[#094771]' : 'hover:bg-[#2a2d2e]'
            )}
            onClick={() => onSelect(result)}
            onMouseEnter={onMouseEnter}
        >
            {getIcon()}
            <div className="flex-1 min-w-0">
                <div className="text-sm text-[#cccccc] truncate">
                    <HighlightedText 
                        text={result.name} 
                        matchedIndices={result.nameMatches} 
                    />
                </div>
                <div className="text-xs text-[#858585] truncate">
                    <HighlightedText 
                        text={result.path} 
                        matchedIndices={result.pathMatches} 
                    />
                </div>
            </div>
            {result.recent && (
                <Clock className="w-3.5 h-3.5 text-[#858585]" />
            )}
        </div>
    );
};

// Main Quick Open component
const QuickOpen = ({
    isOpen,
    onClose,
    onFileSelect,
    mode = 'files', // 'files' | 'commands' | 'symbols'
}) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const { nodes, recentFiles, activeFileId } = useWorkspaceStore();

    // Get all files from workspace
    const allFiles = useMemo(() => {
        const files = [];
        nodes.forEach((node, id) => {
            if (node.type === 'file') {
                files.push({
                    id,
                    name: node.name,
                    path: node.path,
                    recent: recentFiles.includes(id),
                });
            }
        });
        return files;
    }, [nodes, recentFiles]);

    // Search and filter results
    const results = useMemo(() => {
        if (!query.trim()) {
            // Show recent files first
            const recent = allFiles
                .filter(f => recentFiles.includes(f.id))
                .sort((a, b) => recentFiles.indexOf(a.id) - recentFiles.indexOf(b.id))
                .slice(0, 10);
            
            return recent.map(f => ({
                ...f,
                score: 1000 - recentFiles.indexOf(f.id),
                nameMatches: [],
                pathMatches: [],
            }));
        }

        const matches = [];
        
        allFiles.forEach(file => {
            // Try matching against filename first
            const nameMatch = fuzzyMatch(query, file.name);
            const pathMatch = fuzzyMatch(query, file.path);

            if (nameMatch || pathMatch) {
                matches.push({
                    ...file,
                    score: Math.max(nameMatch?.score || 0, pathMatch?.score || 0),
                    nameMatches: nameMatch?.matchedIndices || [],
                    pathMatches: pathMatch?.matchedIndices || [],
                });
            }
        });

        // Sort by score descending
        return matches.sort((a, b) => b.score - a.score).slice(0, 20);
    }, [query, allFiles, recentFiles]);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [results]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selectedEl = listRef.current.children[selectedIndex];
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    Math.min(prev + 1, results.length - 1)
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (results[selectedIndex]) {
                    onFileSelect(results[selectedIndex]);
                    onClose();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [results, selectedIndex, onFileSelect, onClose]);

    // Global keyboard shortcut
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                // Toggle if already open, otherwise handled by parent
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-xl bg-[#252526] border border-[#454545] 
                          rounded-lg shadow-2xl overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[#454545]">
                    <Search className="w-4 h-4 text-[#858585]" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search files by name"
                        className="flex-1 bg-transparent text-sm text-[#cccccc] 
                                 outline-none placeholder:text-[#858585]"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 hover:bg-[#3c3c3c] rounded"
                        >
                            <X className="w-4 h-4 text-[#858585]" />
                        </button>
                    )}
                </div>

                {/* Results */}
                <div 
                    ref={listRef}
                    className="max-h-[400px] overflow-auto"
                >
                    {results.length > 0 ? (
                        results.map((result, index) => (
                            <SearchResultItem
                                key={result.id}
                                result={result}
                                isSelected={index === selectedIndex}
                                onSelect={() => {
                                    onFileSelect(result);
                                    onClose();
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                            />
                        ))
                    ) : query ? (
                        <div className="flex flex-col items-center justify-center py-8 text-[#858585]">
                            <File className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-sm">No matching files</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-[#858585]">
                            <Clock className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-sm">Type to search files</span>
                        </div>
                    )}
                </div>

                {/* Footer with shortcuts */}
                <div className="flex items-center justify-between px-3 py-2 
                              border-t border-[#454545] bg-[#1e1e1e] text-[10px] text-[#858585]">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" />
                            <ArrowDown className="w-3 h-3" />
                            navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <CornerDownLeft className="w-3 h-3" />
                            open
                        </span>
                        <span className="flex items-center gap-1">
                            esc close
                        </span>
                    </div>
                    <span>{results.length} results</span>
                </div>
            </div>
        </div>
    );
};

export default QuickOpen;
