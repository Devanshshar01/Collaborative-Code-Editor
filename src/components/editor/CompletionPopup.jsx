/**
 * Completion Popup - VS Code style autocomplete dropdown
 * Features: Fuzzy matching, documentation preview, keyboard navigation
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Variable,
  Code2,
  Box,
  Wrench,
  Tag,
  Puzzle,
  FileCode,
  Folder,
  Hash,
  Type,
  Zap,
  Key,
  List,
} from 'lucide-react';
import clsx from 'clsx';
import { CompletionItemKind } from '../../services/lsp-manager';

// Icon mapping for completion kinds
const COMPLETION_ICONS = {
  [CompletionItemKind.TEXT]: Type,
  [CompletionItemKind.METHOD]: Wrench,
  [CompletionItemKind.FUNCTION]: Code2,
  [CompletionItemKind.CONSTRUCTOR]: Box,
  [CompletionItemKind.FIELD]: Tag,
  [CompletionItemKind.VARIABLE]: Variable,
  [CompletionItemKind.CLASS]: Box,
  [CompletionItemKind.INTERFACE]: Puzzle,
  [CompletionItemKind.MODULE]: FileCode,
  [CompletionItemKind.PROPERTY]: Tag,
  [CompletionItemKind.UNIT]: Hash,
  [CompletionItemKind.VALUE]: Hash,
  [CompletionItemKind.ENUM]: List,
  [CompletionItemKind.KEYWORD]: Key,
  [CompletionItemKind.SNIPPET]: Zap,
  [CompletionItemKind.COLOR]: Hash,
  [CompletionItemKind.FILE]: FileCode,
  [CompletionItemKind.REFERENCE]: Tag,
  [CompletionItemKind.FOLDER]: Folder,
  [CompletionItemKind.ENUM_MEMBER]: List,
  [CompletionItemKind.CONSTANT]: Hash,
  [CompletionItemKind.STRUCT]: Box,
  [CompletionItemKind.EVENT]: Zap,
  [CompletionItemKind.OPERATOR]: Code2,
  [CompletionItemKind.TYPE_PARAMETER]: Type,
};

// Color mapping for completion kinds
const COMPLETION_COLORS = {
  [CompletionItemKind.TEXT]: 'text-gray-400',
  [CompletionItemKind.METHOD]: 'text-purple-400',
  [CompletionItemKind.FUNCTION]: 'text-yellow-400',
  [CompletionItemKind.CONSTRUCTOR]: 'text-orange-400',
  [CompletionItemKind.FIELD]: 'text-blue-400',
  [CompletionItemKind.VARIABLE]: 'text-blue-300',
  [CompletionItemKind.CLASS]: 'text-orange-400',
  [CompletionItemKind.INTERFACE]: 'text-cyan-400',
  [CompletionItemKind.MODULE]: 'text-red-400',
  [CompletionItemKind.PROPERTY]: 'text-blue-400',
  [CompletionItemKind.ENUM]: 'text-orange-400',
  [CompletionItemKind.KEYWORD]: 'text-purple-400',
  [CompletionItemKind.SNIPPET]: 'text-green-400',
  [CompletionItemKind.CONSTANT]: 'text-cyan-400',
};

// Completion Item component
const CompletionItem = ({ item, isSelected, onClick, onMouseEnter }) => {
  const Icon = COMPLETION_ICONS[item.kind] || Code2;
  const color = COMPLETION_COLORS[item.kind] || 'text-gray-400';

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={clsx(
        'flex items-center gap-2 px-2 py-1 cursor-pointer',
        isSelected ? 'bg-[#094771] text-white' : 'hover:bg-[#2a2d2e]'
      )}
    >
      <Icon className={clsx('w-4 h-4 flex-shrink-0', isSelected ? 'text-white' : color)} />
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <span className="text-sm truncate">{item.label}</span>
        {item.detail && (
          <span className={clsx('text-xs truncate', isSelected ? 'text-gray-300' : 'text-gray-500')}>
            {item.detail}
          </span>
        )}
      </div>
      {item.deprecated && (
        <span className="text-xs text-red-400 line-through">deprecated</span>
      )}
    </div>
  );
};

// Documentation panel
const DocumentationPanel = ({ item }) => {
  if (!item) return null;

  const documentation = item.documentation;
  const docContent = typeof documentation === 'object' ? documentation.value : documentation;

  return (
    <div className="w-80 border-l border-[#3c3c3c] bg-[#252526] p-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        {COMPLETION_ICONS[item.kind] && (
          <span className={COMPLETION_COLORS[item.kind]}>
            {React.createElement(COMPLETION_ICONS[item.kind], { className: 'w-4 h-4' })}
          </span>
        )}
        <span className="font-medium text-white">{item.label}</span>
      </div>
      
      {/* Detail */}
      {item.detail && (
        <div className="text-xs text-gray-400 mb-2 font-mono bg-[#1e1e1e] p-2 rounded">
          {item.detail}
        </div>
      )}
      
      {/* Documentation */}
      {docContent && (
        <div className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none">
          {typeof documentation === 'object' && documentation.kind === 'markdown' ? (
            <div dangerouslySetInnerHTML={{ __html: docContent }} />
          ) : (
            <pre className="whitespace-pre-wrap text-xs">{docContent}</pre>
          )}
        </div>
      )}
      
      {/* Insert text preview */}
      {item.insertText && item.insertText !== item.label && (
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">Inserts:</div>
          <code className="text-xs text-green-400 bg-[#1e1e1e] p-1 rounded block">
            {item.insertText}
          </code>
        </div>
      )}
    </div>
  );
};

const CompletionPopup = ({
  items = [],
  position = { x: 0, y: 0 },
  onSelect,
  onClose,
  visible = true,
  maxHeight = 300,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDocs, setShowDocs] = useState(true);
  const listRef = useRef(null);
  const containerRef = useRef(null);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!visible || items.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          onSelect?.(items[selectedIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
        case 'PageDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 10, items.length - 1));
          break;
        case 'PageUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 10, 0));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, items, selectedIndex, onSelect, onClose]);

  // Position calculation
  const style = useMemo(() => {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const popupWidth = showDocs ? 600 : 320;
    const popupHeight = Math.min(maxHeight, items.length * 28 + 8);

    let x = position.x;
    let y = position.y;

    // Adjust horizontal position
    if (x + popupWidth > viewportWidth) {
      x = viewportWidth - popupWidth - 10;
    }

    // Adjust vertical position
    if (y + popupHeight > viewportHeight) {
      y = position.y - popupHeight - 20;
    }

    return {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      zIndex: 1000,
    };
  }, [position, items.length, maxHeight, showDocs]);

  if (!visible || items.length === 0) return null;

  const selectedItem = items[selectedIndex];

  return (
    <div
      ref={containerRef}
      style={style}
      className="flex bg-[#252526] border border-[#454545] rounded shadow-xl overflow-hidden"
    >
      {/* Completion list */}
      <div className="flex flex-col w-80">
        <div
          ref={listRef}
          className="overflow-y-auto"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          {items.map((item, index) => (
            <CompletionItem
              key={item.label + index}
              item={item}
              isSelected={index === selectedIndex}
              onClick={() => onSelect?.(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            />
          ))}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-2 py-1 text-xs text-gray-500 border-t border-[#3c3c3c]">
          <span>{items.length} suggestions</span>
          <span>↑↓ Navigate · ↵ Accept · Esc Close</span>
        </div>
      </div>

      {/* Documentation panel */}
      {showDocs && selectedItem && (
        <DocumentationPanel item={selectedItem} />
      )}
    </div>
  );
};

export default CompletionPopup;
