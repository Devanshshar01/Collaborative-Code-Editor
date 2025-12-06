/**
 * Minimap - VS Code style document minimap
 * Shows a condensed view of the entire document
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

const Minimap = ({
  content = '',
  viewportStart = 0,
  viewportEnd = 0,
  totalLines = 0,
  onScroll,
  width = 100,
  scale = 0.1,
  theme = 'dark',
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Colors based on theme
  const colors = {
    dark: {
      background: '#1e1e1e',
      line: 'rgba(212, 212, 212, 0.3)',
      keyword: 'rgba(86, 156, 214, 0.6)',
      string: 'rgba(206, 145, 120, 0.6)',
      comment: 'rgba(106, 153, 85, 0.4)',
      number: 'rgba(181, 206, 168, 0.6)',
      viewport: 'rgba(121, 121, 121, 0.4)',
      viewportBorder: 'rgba(121, 121, 121, 0.8)',
    },
    light: {
      background: '#ffffff',
      line: 'rgba(0, 0, 0, 0.2)',
      keyword: 'rgba(0, 0, 255, 0.5)',
      string: 'rgba(163, 21, 21, 0.5)',
      comment: 'rgba(0, 128, 0, 0.4)',
      number: 'rgba(9, 134, 88, 0.5)',
      viewport: 'rgba(0, 0, 0, 0.1)',
      viewportBorder: 'rgba(0, 0, 0, 0.3)',
    },
  };

  const currentColors = colors[theme] || colors.dark;

  // Simple syntax highlighting patterns
  const patterns = {
    keyword: /\b(const|let|var|function|class|if|else|for|while|return|import|export|from|async|await|try|catch|new|this|def|print|int|str|public|private|static|void)\b/g,
    string: /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comment: /\/\/.*$|\/\*[\s\S]*?\*\/|#.*$/gm,
    number: /\b\d+\.?\d*\b/g,
  };

  // Render minimap
  const renderMinimap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !content) return;

    const ctx = canvas.getContext('2d');
    const lines = content.split('\n');
    const lineHeight = 3;
    const charWidth = 1;
    
    // Set canvas size
    const height = Math.max(lines.length * lineHeight, 100);
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = currentColors.background;
    ctx.fillRect(0, 0, width, height);

    // Draw lines
    lines.forEach((line, lineIndex) => {
      const y = lineIndex * lineHeight;
      const trimmedLine = line.trimStart();
      const indent = line.length - trimmedLine.length;
      
      // Base line color
      ctx.fillStyle = currentColors.line;
      
      // Draw simplified line representation
      for (let i = 0; i < Math.min(line.length, width / charWidth); i++) {
        const char = line[i];
        if (char && char !== ' ' && char !== '\t') {
          ctx.fillRect(indent * charWidth * 0.5 + i * charWidth, y, charWidth, lineHeight - 1);
        }
      }
    });

    // Draw viewport indicator
    const viewportY = (viewportStart / totalLines) * height;
    const viewportHeight = ((viewportEnd - viewportStart) / totalLines) * height;
    
    ctx.fillStyle = currentColors.viewport;
    ctx.fillRect(0, viewportY, width, viewportHeight);
    
    ctx.strokeStyle = currentColors.viewportBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, viewportY + 0.5, width - 1, viewportHeight - 1);
  }, [content, viewportStart, viewportEnd, totalLines, width, currentColors]);

  useEffect(() => {
    renderMinimap();
  }, [renderMinimap]);

  // Handle click/drag to scroll
  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleScroll(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleScroll(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScroll = (e) => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !onScroll) return;

    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = y / canvas.height;
    const targetLine = Math.floor(percentage * totalLines);
    
    onScroll(targetLine);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer select-none"
      style={{ width: `${width}px` }}
      onMouseDown={handleMouseDown}
    >
      <canvas
        ref={canvasRef}
        className="block"
        style={{ width: `${width}px` }}
      />
    </div>
  );
};

export default Minimap;
