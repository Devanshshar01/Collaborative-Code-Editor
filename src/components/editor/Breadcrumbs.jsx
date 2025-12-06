/**
 * Breadcrumbs - File path and symbol navigation
 * Shows current file path with clickable segments
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  FileCode,
  Folder,
  Hash,
  Box,
  Wrench,
  Variable,
  ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';

// Symbol type icons
const SYMBOL_ICONS = {
  file: FileCode,
  folder: Folder,
  class: Box,
  function: Wrench,
  method: Wrench,
  variable: Variable,
  property: Hash,
  constant: Hash,
};

// Dropdown menu for breadcrumb item
const BreadcrumbDropdown = ({ items, onSelect, onClose }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 bg-[#252526] border border-[#454545] rounded shadow-xl z-50 min-w-[200px] max-h-[300px] overflow-y-auto"
    >
      {items.map((item, index) => {
        const Icon = SYMBOL_ICONS[item.type] || FileCode;
        return (
          <div
            key={index}
            onClick={() => {
              onSelect(item);
              onClose();
            }}
            className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[#2a2d2e] text-gray-300 hover:text-white"
          >
            <Icon className="w-4 h-4 text-gray-500" />
            <span className="text-sm truncate">{item.label}</span>
            {item.detail && (
              <span className="text-xs text-gray-500 ml-auto">{item.detail}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Single breadcrumb item
const BreadcrumbItem = ({ item, isLast, onClick, siblings, onSiblingSelect }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const Icon = SYMBOL_ICONS[item.type] || FileCode;

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => {
          if (siblings && siblings.length > 0) {
            setShowDropdown(!showDropdown);
          } else {
            onClick?.(item);
          }
        }}
        className={clsx(
          'flex items-center gap-1 px-1.5 py-0.5 rounded text-sm',
          'hover:bg-[#2a2d2e] transition-colors',
          isLast ? 'text-white' : 'text-gray-400 hover:text-white'
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{item.label}</span>
        {siblings && siblings.length > 0 && (
          <ChevronDown className="w-3 h-3 text-gray-500" />
        )}
      </button>

      {showDropdown && siblings && (
        <BreadcrumbDropdown
          items={siblings}
          onSelect={(selected) => {
            onSiblingSelect?.(selected);
            setShowDropdown(false);
          }}
          onClose={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

const Breadcrumbs = ({
  path = [],
  symbols = [],
  onNavigate,
  onSymbolSelect,
  className,
}) => {
  // Combine path segments and symbols
  const pathItems = path.map((segment, index) => ({
    type: index === path.length - 1 ? 'file' : 'folder',
    label: segment,
    path: path.slice(0, index + 1).join('/'),
  }));

  const symbolItems = symbols.map((symbol) => ({
    type: symbol.kind || 'function',
    label: symbol.name,
    range: symbol.range,
    children: symbol.children,
  }));

  const allItems = [...pathItems, ...symbolItems];

  if (allItems.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(
        'flex items-center gap-0.5 px-3 py-1 bg-[#252526] border-b border-[#3c3c3c] overflow-x-auto',
        className
      )}
    >
      {allItems.map((item, index) => (
        <React.Fragment key={index}>
          <BreadcrumbItem
            item={item}
            isLast={index === allItems.length - 1}
            onClick={(clickedItem) => {
              if (clickedItem.path) {
                onNavigate?.(clickedItem.path);
              } else if (clickedItem.range) {
                onSymbolSelect?.(clickedItem);
              }
            }}
            siblings={item.children}
            onSiblingSelect={onSymbolSelect}
          />
          {index < allItems.length - 1 && (
            <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs;
