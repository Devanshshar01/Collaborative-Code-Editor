/**
 * Global Search Overlay Component
 * VS Code-style Ctrl+Shift+F content search across all files
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Search,
    File,
    ChevronRight,
    ChevronDown,
    X,
    Replace,
    RefreshCw,
    CaseSensitive,
    Regex,
    WholeWord,
    FolderOpen,
    ArrowDown,
    ArrowUp,
} from 'lucide-react';
import clsx from 'clsx';
import { useWorkspaceStore } from '../stores/workspaceStore';

// Search result item component
const SearchResultLine = ({
    result,
    lineNumber,
    content,
    matches,
    isSelected,
    onClick,
}) => {
    // Highlight matches in the line
    const highlightedContent = useMemo(() => {
        if (!matches || matches.length === 0) {
            return <span className="text-[#cccccc]">{content}</span>;
        }

        const parts = [];
        let lastIndex = 0;

        matches.forEach((match, i) => {
            // Add text before match
            if (match.start > lastIndex) {
                parts.push(
                    <span key={`pre-${i}`} className="text-[#cccccc]">
                        {content.slice(lastIndex, match.start)}
                    </span>
                );
            }
            // Add highlighted match
            parts.push(
                <span 
                    key={`match-${i}`} 
                    className="bg-[#613214] text-[#f8d7a4] rounded px-0.5"
                >
                    {content.slice(match.start, match.end)}
                </span>
            );
            lastIndex = match.end;
        });

        // Add remaining text
        if (lastIndex < content.length) {
            parts.push(
                <span key="post" className="text-[#cccccc]">
                    {content.slice(lastIndex)}
                </span>
            );
        }

        return parts;
    }, [content, matches]);

    return (
        <div
            className={clsx(
                'flex items-start gap-2 px-4 py-1 cursor-pointer text-xs',
                isSelected ? 'bg-[#094771]' : 'hover:bg-[#2a2d2e]'
            )}
            onClick={onClick}
        >
            <span className="text-[#858585] w-8 text-right flex-shrink-0">
                {lineNumber}
            </span>
            <span className="font-mono truncate flex-1">
                {highlightedContent}
            </span>
        </div>
    );
};

// File result group
const SearchResultFile = ({
    file,
    results,
    isExpanded,
    onToggle,
    onResultClick,
    selectedResultId,
}) => {
    return (
        <div className="border-b border-[#3c3c3c] last:border-b-0">
            <div
                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[#2a2d2e]"
                onClick={onToggle}
            >
                {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#858585]" />
                ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#858585]" />
                )}
                <File className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-[#cccccc] flex-1 truncate">
                    {file.name}
                </span>
                <span className="text-[10px] text-[#858585] bg-[#3c3c3c] px-1.5 py-0.5 rounded">
                    {results.length}
                </span>
            </div>
            
            {isExpanded && (
                <div className="pb-1">
                    {results.map((result, index) => (
                        <SearchResultLine
                            key={`${file.id}-${result.lineNumber}-${index}`}
                            result={result}
                            lineNumber={result.lineNumber}
                            content={result.content}
                            matches={result.matches}
                            isSelected={selectedResultId === `${file.id}-${index}`}
                            onClick={() => onResultClick(file, result, `${file.id}-${index}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Main Global Search component
const GlobalSearch = ({
    isOpen,
    onClose,
    onResultSelect,
}) => {
    const [query, setQuery] = useState('');
    const [replaceQuery, setReplaceQuery] = useState('');
    const [showReplace, setShowReplace] = useState(false);
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [useRegex, setUseRegex] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [expandedFiles, setExpandedFiles] = useState(new Set());
    const [selectedResultId, setSelectedResultId] = useState(null);
    
    const inputRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    const { nodes } = useWorkspaceStore();

    // Perform search
    const performSearch = useCallback(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setIsSearching(true);

        // Build search regex
        let searchRegex;
        try {
            let pattern = query;
            if (!useRegex) {
                pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }
            if (wholeWord) {
                pattern = `\\b${pattern}\\b`;
            }
            searchRegex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
        } catch (e) {
            setIsSearching(false);
            return;
        }

        const searchResults = [];

        nodes.forEach((node, id) => {
            if (node.type !== 'file' || !node.content) return;

            const lines = node.content.split('\n');
            const fileResults = [];

            lines.forEach((line, lineIndex) => {
                const matches = [];
                let match;

                // Reset regex lastIndex
                searchRegex.lastIndex = 0;

                while ((match = searchRegex.exec(line)) !== null) {
                    matches.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        text: match[0],
                    });

                    // Prevent infinite loop with zero-length matches
                    if (match[0].length === 0) {
                        searchRegex.lastIndex++;
                    }
                }

                if (matches.length > 0) {
                    fileResults.push({
                        lineNumber: lineIndex + 1,
                        content: line.trim(),
                        matches,
                    });
                }
            });

            if (fileResults.length > 0) {
                searchResults.push({
                    file: { id, name: node.name, path: node.path },
                    results: fileResults,
                });
            }
        });

        setResults(searchResults);
        setExpandedFiles(new Set(searchResults.slice(0, 5).map(r => r.file.id)));
        setIsSearching(false);
    }, [query, caseSensitive, wholeWord, useRegex, nodes]);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            performSearch();
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [performSearch]);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Toggle file expansion
    const toggleFile = (fileId) => {
        setExpandedFiles(prev => {
            const next = new Set(prev);
            if (next.has(fileId)) {
                next.delete(fileId);
            } else {
                next.add(fileId);
            }
            return next;
        });
    };

    // Handle result click
    const handleResultClick = (file, result, resultId) => {
        setSelectedResultId(resultId);
        onResultSelect?.({
            fileId: file.id,
            filePath: file.path,
            lineNumber: result.lineNumber,
            column: result.matches[0]?.start || 0,
        });
    };

    // Calculate totals
    const totals = useMemo(() => {
        let fileCount = results.length;
        let matchCount = results.reduce((sum, r) => sum + r.results.length, 0);
        return { fileCount, matchCount };
    }, [results]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="flex flex-col h-full bg-[#252526] border-r border-[#3c3c3c]">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#3c3c3c]">
                <span className="text-xs font-medium text-[#cccccc] uppercase tracking-wider">
                    Search
                </span>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-[#3c3c3c] rounded"
                >
                    <X className="w-4 h-4 text-[#858585]" />
                </button>
            </div>

            {/* Search inputs */}
            <div className="p-3 space-y-2 border-b border-[#3c3c3c]">
                {/* Search input */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-[#3c3c3c] rounded">
                        <Search className="w-4 h-4 text-[#858585] ml-2" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search"
                            className="flex-1 bg-transparent text-xs text-[#cccccc] px-2 py-1.5
                                     outline-none placeholder:text-[#858585]"
                        />
                        {/* Options */}
                        <div className="flex items-center gap-0.5 mr-1">
                            <button
                                onClick={() => setCaseSensitive(!caseSensitive)}
                                className={clsx(
                                    'p-1 rounded',
                                    caseSensitive ? 'bg-[#094771]' : 'hover:bg-[#4c4c4c]'
                                )}
                                title="Match Case"
                            >
                                <CaseSensitive className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setWholeWord(!wholeWord)}
                                className={clsx(
                                    'p-1 rounded',
                                    wholeWord ? 'bg-[#094771]' : 'hover:bg-[#4c4c4c]'
                                )}
                                title="Match Whole Word"
                            >
                                <WholeWord className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setUseRegex(!useRegex)}
                                className={clsx(
                                    'p-1 rounded',
                                    useRegex ? 'bg-[#094771]' : 'hover:bg-[#4c4c4c]'
                                )}
                                title="Use Regular Expression"
                            >
                                <Regex className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowReplace(!showReplace)}
                        className={clsx(
                            'p-1.5 rounded',
                            showReplace ? 'bg-[#094771]' : 'hover:bg-[#3c3c3c]'
                        )}
                        title="Toggle Replace"
                    >
                        <Replace className="w-4 h-4" />
                    </button>
                </div>

                {/* Replace input */}
                {showReplace && (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center bg-[#3c3c3c] rounded">
                            <Replace className="w-4 h-4 text-[#858585] ml-2" />
                            <input
                                type="text"
                                value={replaceQuery}
                                onChange={(e) => setReplaceQuery(e.target.value)}
                                placeholder="Replace"
                                className="flex-1 bg-transparent text-xs text-[#cccccc] px-2 py-1.5
                                         outline-none placeholder:text-[#858585]"
                            />
                        </div>
                        <button
                            className="p-1.5 hover:bg-[#3c3c3c] rounded"
                            title="Replace All"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Results summary */}
            {query && (
                <div className="px-3 py-2 text-xs text-[#858585] border-b border-[#3c3c3c]">
                    {isSearching ? (
                        <span className="flex items-center gap-2">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Searching...
                        </span>
                    ) : (
                        <span>
                            {totals.matchCount} results in {totals.fileCount} files
                        </span>
                    )}
                </div>
            )}

            {/* Results list */}
            <div className="flex-1 overflow-auto">
                {results.length > 0 ? (
                    results.map((item) => (
                        <SearchResultFile
                            key={item.file.id}
                            file={item.file}
                            results={item.results}
                            isExpanded={expandedFiles.has(item.file.id)}
                            onToggle={() => toggleFile(item.file.id)}
                            onResultClick={handleResultClick}
                            selectedResultId={selectedResultId}
                        />
                    ))
                ) : query ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#858585]">
                        <Search className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm">No results found</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[#858585] px-4">
                        <Search className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm text-center">
                            Search in all files
                        </span>
                        <span className="text-xs text-center mt-1 text-[#6c6c6c]">
                            Type to search across your workspace
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalSearch;
