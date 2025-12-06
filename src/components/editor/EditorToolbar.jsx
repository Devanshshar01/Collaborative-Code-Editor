/**
 * EditorToolbar - VS Code style editor toolbar
 * Features: Format, Theme, Font, Language, Settings
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Code2,
  Settings,
  Palette,
  Type,
  ChevronDown,
  AlignLeft,
  Indent,
  WrapText,
  Eye,
  EyeOff,
  Minus,
  Plus,
  RotateCcw,
  Command,
  Keyboard,
  Search,
  Replace,
  FileCode,
  Layout,
  Terminal,
  GitBranch,
  Maximize2,
  Minimize2,
  SplitSquareHorizontal,
  PanelLeft,
  PanelRight,
  Columns,
  Map,
} from 'lucide-react';
import clsx from 'clsx';
import { getThemeList } from './EditorThemes';

// Supported languages
const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', extensions: ['.js', '.jsx', '.mjs'] },
  { id: 'typescript', name: 'TypeScript', extensions: ['.ts', '.tsx'] },
  { id: 'python', name: 'Python', extensions: ['.py', '.pyw'] },
  { id: 'java', name: 'Java', extensions: ['.java'] },
  { id: 'cpp', name: 'C++', extensions: ['.cpp', '.cc', '.cxx', '.hpp'] },
  { id: 'c', name: 'C', extensions: ['.c', '.h'] },
  { id: 'go', name: 'Go', extensions: ['.go'] },
  { id: 'rust', name: 'Rust', extensions: ['.rs'] },
  { id: 'html', name: 'HTML', extensions: ['.html', '.htm'] },
  { id: 'css', name: 'CSS', extensions: ['.css'] },
  { id: 'json', name: 'JSON', extensions: ['.json'] },
  { id: 'markdown', name: 'Markdown', extensions: ['.md', '.markdown'] },
];

// Font families
const FONT_FAMILIES = [
  { id: 'fira-code', name: 'Fira Code', value: "'Fira Code', monospace" },
  { id: 'jetbrains-mono', name: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { id: 'consolas', name: 'Consolas', value: "'Consolas', monospace" },
  { id: 'monaco', name: 'Monaco', value: "'Monaco', monospace" },
  { id: 'source-code-pro', name: 'Source Code Pro', value: "'Source Code Pro', monospace" },
  { id: 'cascadia-code', name: 'Cascadia Code', value: "'Cascadia Code', monospace" },
  { id: 'roboto-mono', name: 'Roboto Mono', value: "'Roboto Mono', monospace" },
  { id: 'ubuntu-mono', name: 'Ubuntu Mono', value: "'Ubuntu Mono', monospace" },
  { id: 'monospace', name: 'System Monospace', value: 'monospace' },
];

// Dropdown component
const Dropdown = ({ trigger, children, align = 'left' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={clsx(
            'absolute top-full mt-1 bg-[#252526] border border-[#3c3c3c] rounded shadow-lg z-50 min-w-[200px] max-h-[400px] overflow-y-auto',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {typeof children === 'function' ? children(() => setIsOpen(false)) : children}
        </div>
      )}
    </div>
  );
};

// Toolbar Button
const ToolbarButton = ({ icon: Icon, label, onClick, active, disabled, shortcut }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={shortcut ? `${label} (${shortcut})` : label}
    className={clsx(
      'flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors',
      active
        ? 'bg-[#094771] text-white'
        : 'text-gray-300 hover:bg-[#2a2d2e] hover:text-white',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {label && <span className="hidden sm:inline">{label}</span>}
  </button>
);

// Toolbar Separator
const ToolbarSeparator = () => (
  <div className="w-px h-5 bg-[#3c3c3c] mx-1" />
);

const EditorToolbar = ({
  // Editor state
  language,
  theme,
  fontSize,
  fontFamily,
  wordWrap,
  showMinimap,
  showLineNumbers,
  showWhitespace,
  tabSize,
  
  // Callbacks
  onLanguageChange,
  onThemeChange,
  onFontSizeChange,
  onFontFamilyChange,
  onWordWrapChange,
  onShowMinimapChange,
  onShowLineNumbersChange,
  onShowWhitespaceChange,
  onTabSizeChange,
  onFormat,
  onFind,
  onReplace,
  onGoToLine,
  onCommandPalette,
  onToggleSidebar,
  onToggleTerminal,
  onSplitEditor,
  onToggleFullscreen,
  
  // Status
  cursorPosition = { line: 1, column: 1 },
  selectionCount = 0,
  encoding = 'UTF-8',
  eol = 'LF',
  isReadOnly = false,
}) => {
  const themes = getThemeList();
  
  return (
    <div className="flex items-center justify-between bg-[#252526] border-b border-[#3c3c3c] px-2 py-1">
      {/* Left section - Actions */}
      <div className="flex items-center gap-1">
        {/* Format */}
        <ToolbarButton
          icon={AlignLeft}
          label="Format"
          onClick={onFormat}
          shortcut="Shift+Alt+F"
        />
        
        <ToolbarSeparator />
        
        {/* Find & Replace */}
        <ToolbarButton
          icon={Search}
          label="Find"
          onClick={onFind}
          shortcut="Ctrl+F"
        />
        <ToolbarButton
          icon={Replace}
          label="Replace"
          onClick={onReplace}
          shortcut="Ctrl+H"
        />
        
        <ToolbarSeparator />
        
        {/* Command Palette */}
        <ToolbarButton
          icon={Command}
          label="Commands"
          onClick={onCommandPalette}
          shortcut="Ctrl+Shift+P"
        />
        
        {/* Go to Line */}
        <ToolbarButton
          icon={Code2}
          label="Go to Line"
          onClick={onGoToLine}
          shortcut="Ctrl+G"
        />
        
        <ToolbarSeparator />
        
        {/* View Controls */}
        <ToolbarButton
          icon={showMinimap ? Map : Map}
          label="Minimap"
          onClick={() => onShowMinimapChange?.(!showMinimap)}
          active={showMinimap}
        />
        
        <ToolbarButton
          icon={wordWrap ? WrapText : WrapText}
          label="Word Wrap"
          onClick={() => onWordWrapChange?.(!wordWrap)}
          active={wordWrap}
          shortcut="Alt+Z"
        />
        
        <ToolbarButton
          icon={showWhitespace ? Eye : EyeOff}
          label="Whitespace"
          onClick={() => onShowWhitespaceChange?.(!showWhitespace)}
          active={showWhitespace}
        />
      </div>

      {/* Center section - Language & Theme */}
      <div className="flex items-center gap-2">
        {/* Language Selector */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-1 px-2 py-1 text-sm text-gray-300 hover:bg-[#2a2d2e] rounded">
              <FileCode className="w-4 h-4" />
              <span>{LANGUAGES.find(l => l.id === language)?.name || 'Plain Text'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          }
        >
          {(close) => (
            <div className="py-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    onLanguageChange?.(lang.id);
                    close();
                  }}
                  className={clsx(
                    'w-full px-3 py-1.5 text-left text-sm hover:bg-[#094771]',
                    language === lang.id ? 'bg-[#094771] text-white' : 'text-gray-300'
                  )}
                >
                  <span>{lang.name}</span>
                  <span className="ml-2 text-xs text-gray-500">{lang.extensions[0]}</span>
                </button>
              ))}
            </div>
          )}
        </Dropdown>
        
        {/* Theme Selector */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-1 px-2 py-1 text-sm text-gray-300 hover:bg-[#2a2d2e] rounded">
              <Palette className="w-4 h-4" />
              <span>{themes.find(t => t.id === theme)?.name || 'Dark+'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          }
        >
          {(close) => (
            <div className="py-1">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onThemeChange?.(t.id);
                    close();
                  }}
                  className={clsx(
                    'w-full px-3 py-1.5 text-left text-sm hover:bg-[#094771] flex items-center gap-2',
                    theme === t.id ? 'bg-[#094771] text-white' : 'text-gray-300'
                  )}
                >
                  <div
                    className={clsx(
                      'w-3 h-3 rounded-full border',
                      t.isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
                    )}
                  />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </Dropdown>
      </div>

      {/* Right section - Font & Status */}
      <div className="flex items-center gap-2">
        {/* Font Size */}
        <div className="flex items-center gap-1 bg-[#1e1e1e] rounded px-1">
          <button
            onClick={() => onFontSizeChange?.(Math.max(8, fontSize - 1))}
            className="p-1 text-gray-400 hover:text-white"
            title="Decrease font size"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-xs text-gray-300 w-6 text-center">{fontSize}</span>
          <button
            onClick={() => onFontSizeChange?.(Math.min(32, fontSize + 1))}
            className="p-1 text-gray-400 hover:text-white"
            title="Increase font size"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        
        {/* Font Family */}
        <Dropdown
          align="right"
          trigger={
            <button className="flex items-center gap-1 px-2 py-1 text-sm text-gray-300 hover:bg-[#2a2d2e] rounded">
              <Type className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
          }
        >
          {(close) => (
            <div className="py-1">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.id}
                  onClick={() => {
                    onFontFamilyChange?.(font.value);
                    close();
                  }}
                  className={clsx(
                    'w-full px-3 py-1.5 text-left text-sm hover:bg-[#094771]',
                    fontFamily === font.value ? 'bg-[#094771] text-white' : 'text-gray-300'
                  )}
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </Dropdown>
        
        {/* Tab Size */}
        <Dropdown
          align="right"
          trigger={
            <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:bg-[#2a2d2e] rounded">
              <Indent className="w-3 h-3" />
              <span>Tab: {tabSize}</span>
            </button>
          }
        >
          {(close) => (
            <div className="py-1">
              {[2, 4, 8].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    onTabSizeChange?.(size);
                    close();
                  }}
                  className={clsx(
                    'w-full px-3 py-1.5 text-left text-sm hover:bg-[#094771]',
                    tabSize === size ? 'bg-[#094771] text-white' : 'text-gray-300'
                  )}
                >
                  {size} Spaces
                </button>
              ))}
            </div>
          )}
        </Dropdown>
        
        <ToolbarSeparator />
        
        {/* Cursor Position */}
        <button
          onClick={onGoToLine}
          className="px-2 py-1 text-xs text-gray-400 hover:bg-[#2a2d2e] rounded"
          title="Go to Line"
        >
          Ln {cursorPosition.line}, Col {cursorPosition.column}
          {selectionCount > 0 && ` (${selectionCount} selected)`}
        </button>
        
        {/* Encoding */}
        <span className="text-xs text-gray-500">{encoding}</span>
        
        {/* EOL */}
        <span className="text-xs text-gray-500">{eol}</span>
        
        {/* Read-only indicator */}
        {isReadOnly && (
          <span className="text-xs text-yellow-500 bg-yellow-500/20 px-1 rounded">
            Read-only
          </span>
        )}
        
        <ToolbarSeparator />
        
        {/* Layout Controls */}
        <ToolbarButton
          icon={SplitSquareHorizontal}
          onClick={onSplitEditor}
          label=""
        />
        <ToolbarButton
          icon={Terminal}
          onClick={onToggleTerminal}
          label=""
        />
        <ToolbarButton
          icon={Maximize2}
          onClick={onToggleFullscreen}
          label=""
        />
      </div>
    </div>
  );
};

export default EditorToolbar;
