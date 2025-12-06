/**
 * Find and Replace - VS Code style search/replace panel
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Replace,
  ChevronDown,
  ChevronRight,
  X,
  CaseSensitive,
  WholeWord,
  Regex,
  ArrowUp,
  ArrowDown,
  ReplaceAll,
} from 'lucide-react';
import clsx from 'clsx';

const FindReplace = ({
  onSearch,
  onReplace,
  onReplaceAll,
  onNext,
  onPrevious,
  onClose,
  matchCount = 0,
  currentMatch = 0,
  visible = true,
  initialSearchTerm = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  
  const searchInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  // Focus search input when visible
  useEffect(() => {
    if (visible && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [visible]);

  // Update search term from prop
  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  // Trigger search on options change
  useEffect(() => {
    if (searchTerm) {
      onSearch?.(searchTerm, { caseSensitive, wholeWord, useRegex });
    }
  }, [caseSensitive, wholeWord, useRegex]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value, { caseSensitive, wholeWord, useRegex });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevious?.();
      } else {
        onNext?.();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
    }
  };

  const handleReplaceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onReplaceAll?.(searchTerm, replaceTerm, { caseSensitive, wholeWord, useRegex });
      } else {
        onReplace?.(searchTerm, replaceTerm, { caseSensitive, wholeWord, useRegex });
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
    }
  };

  if (!visible) return null;

  return (
    <div className="flex flex-col bg-[#252526] border-b border-[#3c3c3c] shadow-lg">
      {/* Search row */}
      <div className="flex items-center gap-2 p-2">
        {/* Expand/collapse toggle */}
        <button
          onClick={() => setShowReplace(!showReplace)}
          className="p-1 hover:bg-[#3c3c3c] rounded"
          title={showReplace ? 'Hide Replace' : 'Show Replace'}
        >
          {showReplace ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Search input */}
        <div className="flex-1 flex items-center bg-[#3c3c3c] border border-[#3c3c3c] focus-within:border-[#007acc] rounded">
          <Search className="w-4 h-4 text-gray-500 ml-2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            placeholder="Search"
            className="flex-1 bg-transparent border-none outline-none px-2 py-1 text-sm text-white placeholder-gray-500"
          />
          
          {/* Search options */}
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={clsx(
              'p-1 rounded mx-0.5',
              caseSensitive ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:bg-[#4c4c4c]'
            )}
            title="Match Case (Alt+C)"
          >
            <CaseSensitive className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWholeWord(!wholeWord)}
            className={clsx(
              'p-1 rounded mx-0.5',
              wholeWord ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:bg-[#4c4c4c]'
            )}
            title="Match Whole Word (Alt+W)"
          >
            <WholeWord className="w-4 h-4" />
          </button>
          <button
            onClick={() => setUseRegex(!useRegex)}
            className={clsx(
              'p-1 rounded mx-0.5',
              useRegex ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:bg-[#4c4c4c]'
            )}
            title="Use Regular Expression (Alt+R)"
          >
            <Regex className="w-4 h-4" />
          </button>
        </div>

        {/* Match count */}
        <span className="text-xs text-gray-400 min-w-[80px] text-center">
          {matchCount > 0 ? `${currentMatch} of ${matchCount}` : 'No results'}
        </span>

        {/* Navigation */}
        <button
          onClick={onPrevious}
          disabled={matchCount === 0}
          className="p-1 hover:bg-[#3c3c3c] rounded disabled:opacity-50"
          title="Previous Match (Shift+Enter)"
        >
          <ArrowUp className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={onNext}
          disabled={matchCount === 0}
          className="p-1 hover:bg-[#3c3c3c] rounded disabled:opacity-50"
          title="Next Match (Enter)"
        >
          <ArrowDown className="w-4 h-4 text-gray-400" />
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#3c3c3c] rounded"
          title="Close (Escape)"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Replace row */}
      {showReplace && (
        <div className="flex items-center gap-2 px-2 pb-2">
          <div className="w-6" /> {/* Spacer for alignment */}
          
          {/* Replace input */}
          <div className="flex-1 flex items-center bg-[#3c3c3c] border border-[#3c3c3c] focus-within:border-[#007acc] rounded">
            <Replace className="w-4 h-4 text-gray-500 ml-2" />
            <input
              ref={replaceInputRef}
              type="text"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              onKeyDown={handleReplaceKeyDown}
              placeholder="Replace"
              className="flex-1 bg-transparent border-none outline-none px-2 py-1 text-sm text-white placeholder-gray-500"
            />
          </div>

          {/* Replace actions */}
          <button
            onClick={() => onReplace?.(searchTerm, replaceTerm, { caseSensitive, wholeWord, useRegex })}
            disabled={!searchTerm || matchCount === 0}
            className="px-2 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] rounded disabled:opacity-50"
            title="Replace (Enter)"
          >
            Replace
          </button>
          <button
            onClick={() => onReplaceAll?.(searchTerm, replaceTerm, { caseSensitive, wholeWord, useRegex })}
            disabled={!searchTerm || matchCount === 0}
            className="px-2 py-1 text-xs text-gray-300 hover:bg-[#3c3c3c] rounded disabled:opacity-50"
            title="Replace All (Ctrl+Shift+Enter)"
          >
            Replace All
          </button>

          <div className="w-20" /> {/* Spacer for alignment */}
        </div>
      )}
    </div>
  );
};

export default FindReplace;
