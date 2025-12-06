/**
 * Hover Info - Documentation popup on hover
 * Shows type info, documentation, and quick actions
 */

import React, { useMemo } from 'react';
import { ExternalLink, Copy, FileCode, BookOpen } from 'lucide-react';
import clsx from 'clsx';

const HoverInfo = ({
  content = null,
  position = { x: 0, y: 0 },
  visible = true,
  onClose,
  onGoToDefinition,
  onFindReferences,
}) => {
  // Calculate position to avoid going off-screen
  const style = useMemo(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 400;
    const popupHeight = 200;

    let x = position.x;
    let y = position.y + 20; // Position below cursor

    // Adjust horizontal position
    if (x + popupWidth > viewportWidth) {
      x = viewportWidth - popupWidth - 10;
    }
    if (x < 10) x = 10;

    // If not enough space below, show above
    if (y + popupHeight > viewportHeight) {
      y = position.y - popupHeight - 10;
    }

    return {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      zIndex: 1002,
    };
  }, [position]);

  if (!visible || !content) return null;

  const { type, documentation, range, language } = content;

  // Parse markdown documentation
  const renderDocumentation = (doc) => {
    if (!doc) return null;
    const text = typeof doc === 'object' ? doc.value : doc;
    
    return (
      <div className="text-sm text-gray-300 whitespace-pre-wrap">
        {text}
      </div>
    );
  };

  const handleCopy = () => {
    const textToCopy = type || '';
    navigator.clipboard.writeText(textToCopy);
  };

  return (
    <div
      style={style}
      className="bg-[#252526] border border-[#454545] rounded shadow-xl overflow-hidden max-w-[400px]"
      onMouseLeave={onClose}
    >
      {/* Type signature */}
      {type && (
        <div className="p-2 bg-[#1e1e1e] border-b border-[#3c3c3c]">
          <pre className="text-sm font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
            <code className={language ? `language-${language}` : ''}>
              {type}
            </code>
          </pre>
        </div>
      )}

      {/* Documentation */}
      {documentation && (
        <div className="p-2 max-h-[200px] overflow-y-auto">
          {renderDocumentation(documentation)}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex items-center gap-1 px-2 py-1 border-t border-[#3c3c3c] bg-[#1e1e1e]">
        {onGoToDefinition && (
          <button
            onClick={onGoToDefinition}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-[#2a2d2e] rounded"
            title="Go to Definition (F12)"
          >
            <FileCode className="w-3 h-3" />
            Definition
          </button>
        )}
        {onFindReferences && (
          <button
            onClick={onFindReferences}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-[#2a2d2e] rounded"
            title="Find All References (Shift+F12)"
          >
            <BookOpen className="w-3 h-3" />
            References
          </button>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-[#2a2d2e] rounded ml-auto"
          title="Copy to Clipboard"
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
      </div>
    </div>
  );
};

export default HoverInfo;
