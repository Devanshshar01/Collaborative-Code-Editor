/**
 * Signature Help - Parameter hints popup
 * Shows function signature with current parameter highlighted
 */

import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
import clsx from 'clsx';

// Parse signature into label parts
const parseSignature = (signature, activeParameter) => {
  const label = signature.label;
  const parameters = signature.parameters || [];
  
  if (parameters.length === 0) {
    return [{ text: label, isActive: false }];
  }

  const parts = [];
  let lastIndex = 0;

  parameters.forEach((param, index) => {
    const paramLabel = typeof param.label === 'string' 
      ? param.label 
      : label.substring(param.label[0], param.label[1]);
    
    const paramIndex = label.indexOf(paramLabel, lastIndex);
    
    if (paramIndex > lastIndex) {
      parts.push({ text: label.substring(lastIndex, paramIndex), isActive: false });
    }
    
    parts.push({ 
      text: paramLabel, 
      isActive: index === activeParameter,
      documentation: param.documentation
    });
    
    lastIndex = paramIndex + paramLabel.length;
  });

  if (lastIndex < label.length) {
    parts.push({ text: label.substring(lastIndex), isActive: false });
  }

  return parts;
};

const SignatureHelp = ({
  signatures = [],
  activeSignature = 0,
  activeParameter = 0,
  position = { x: 0, y: 0 },
  visible = true,
  onClose,
}) => {
  // Calculate position to avoid going off-screen
  const style = useMemo(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 450;
    const popupHeight = 120;

    let x = position.x;
    let y = position.y - popupHeight - 10; // Position above cursor

    // Adjust horizontal position
    if (x + popupWidth > viewportWidth) {
      x = viewportWidth - popupWidth - 10;
    }

    // If not enough space above, show below
    if (y < 10) {
      y = position.y + 20;
    }

    return {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      zIndex: 1001,
    };
  }, [position]);

  if (!visible || signatures.length === 0) return null;

  const currentSignature = signatures[activeSignature];
  const parts = parseSignature(currentSignature, activeParameter);
  
  // Get current parameter documentation
  const currentParam = currentSignature.parameters?.[activeParameter];
  const paramDoc = currentParam?.documentation;
  const paramDocText = typeof paramDoc === 'object' ? paramDoc.value : paramDoc;

  return (
    <div
      style={style}
      className="bg-[#252526] border border-[#454545] rounded shadow-xl overflow-hidden max-w-[450px]"
    >
      {/* Signature */}
      <div className="p-2 font-mono text-sm">
        {signatures.length > 1 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span>
              {activeSignature + 1} of {signatures.length} overloads
            </span>
          </div>
        )}
        <div className="text-gray-300">
          {parts.map((part, index) => (
            <span
              key={index}
              className={clsx(
                part.isActive && 'text-yellow-400 font-semibold underline'
              )}
            >
              {part.text}
            </span>
          ))}
        </div>
      </div>

      {/* Parameter documentation */}
      {paramDocText && (
        <div className="px-2 pb-2 border-t border-[#3c3c3c]">
          <div className="flex items-start gap-2 pt-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-400">
              <span className="text-yellow-400 font-medium">
                {typeof currentParam.label === 'string' 
                  ? currentParam.label 
                  : currentSignature.label.substring(
                      currentParam.label[0], 
                      currentParam.label[1]
                    )}
              </span>
              <span className="mx-1">—</span>
              <span>{paramDocText}</span>
            </div>
          </div>
        </div>
      )}

      {/* Signature documentation */}
      {currentSignature.documentation && (
        <div className="px-2 pb-2 border-t border-[#3c3c3c]">
          <p className="text-xs text-gray-400 pt-2">
            {typeof currentSignature.documentation === 'object' 
              ? currentSignature.documentation.value 
              : currentSignature.documentation}
          </p>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="px-2 py-1 text-[10px] text-gray-600 bg-[#1e1e1e]">
        ↑↓ Switch signature · Esc Close
      </div>
    </div>
  );
};

export default SignatureHelp;
