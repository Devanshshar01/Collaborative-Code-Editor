/**
 * Go To Definition Panel - Shows definition results
 * Peek definition inline in the editor
 */

import React, { useState, useEffect } from 'react';
import { X, FileCode, ChevronRight, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

const GoToDefinitionPanel = ({
  definitions = [],
  onNavigate,
  onClose,
  visible = true,
  position = { x: 0, y: 0 },
  peekMode = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, definitions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (definitions[selectedIndex]) {
            onNavigate?.(definitions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, definitions, selectedIndex, onNavigate, onClose]);

  if (!visible || definitions.length === 0) return null;

  // Inline peek mode
  if (peekMode) {
    const def = definitions[selectedIndex];
    
    return (
      <div 
        className="border border-[#007acc] bg-[#1e1e1e] rounded shadow-xl overflow-hidden"
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '500px',
          maxHeight: '300px',
          zIndex: 1000,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#007acc] text-white">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            <span className="text-sm font-medium">
              {definitions.length} definition{definitions.length > 1 ? 's' : ''} found
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-0.5 hover:bg-white/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Definition list */}
        {definitions.length > 1 && (
          <div className="border-b border-[#3c3c3c] max-h-[100px] overflow-y-auto">
            {definitions.map((def, index) => (
              <div
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1 cursor-pointer text-sm',
                  index === selectedIndex
                    ? 'bg-[#094771] text-white'
                    : 'hover:bg-[#2a2d2e] text-gray-300'
                )}
              >
                <FileCode className="w-3 h-3" />
                <span className="truncate">{def.uri || def.file}</span>
                <span className="text-gray-500">
                  :{def.range?.start?.line || def.line}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Code preview */}
        <div className="p-2 max-h-[200px] overflow-auto">
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
            <FileCode className="w-3 h-3" />
            <span>{def.uri || def.file}</span>
            <ChevronRight className="w-3 h-3" />
            <span>Line {def.range?.start?.line || def.line}</span>
          </div>
          {def.preview && (
            <pre className="text-sm font-mono text-gray-300 bg-[#252526] p-2 rounded overflow-x-auto">
              {def.preview}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-1 border-t border-[#3c3c3c] bg-[#252526] text-xs text-gray-500">
          <span>↑↓ Navigate · ↵ Go to · Esc Close</span>
          <button
            onClick={() => onNavigate?.(definitions[selectedIndex])}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
          >
            <ExternalLink className="w-3 h-3" />
            Open in Editor
          </button>
        </div>
      </div>
    );
  }

  // List mode (for command palette results)
  return (
    <div className="bg-[#252526] border border-[#454545] rounded shadow-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-[#3c3c3c]">
        <h3 className="text-sm font-medium text-white">
          {definitions.length} Definition{definitions.length > 1 ? 's' : ''}
        </h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {definitions.map((def, index) => (
          <div
            key={index}
            onClick={() => onNavigate?.(def)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 cursor-pointer',
              'hover:bg-[#2a2d2e] border-b border-[#3c3c3c] last:border-b-0'
            )}
          >
            <FileCode className="w-4 h-4 text-blue-400" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">
                {def.name || def.symbol || 'Definition'}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="truncate">{def.uri || def.file}</span>
                <span>:</span>
                <span>{def.range?.start?.line || def.line}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoToDefinitionPanel;
