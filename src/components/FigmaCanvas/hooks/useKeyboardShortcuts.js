/**
 * Keyboard Shortcuts Hook
 * Handle all keyboard shortcuts like Figma
 */

import { useEffect, useCallback } from 'react';
import { ToolType } from '../store';

export const useKeyboardShortcuts = ({
    undo,
    redo,
    copy,
    cut,
    paste,
    deleteElements,
    selectAll,
    clearSelection,
    groupElements,
    ungroupElements,
    bringToFront,
    sendToBack,
    duplicateElements,
    setTool,
}) => {
    const handleKeyDown = useCallback((e) => {
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        const isCtrl = e.ctrlKey || e.metaKey;
        const isShift = e.shiftKey;
        const key = e.key.toLowerCase();

        // Undo: Ctrl+Z
        if (isCtrl && !isShift && key === 'z') {
            e.preventDefault();
            undo?.();
            return;
        }

        // Redo: Ctrl+Shift+Z or Ctrl+Y
        if ((isCtrl && isShift && key === 'z') || (isCtrl && key === 'y')) {
            e.preventDefault();
            redo?.();
            return;
        }

        // Copy: Ctrl+C
        if (isCtrl && key === 'c') {
            e.preventDefault();
            copy?.();
            return;
        }

        // Cut: Ctrl+X
        if (isCtrl && key === 'x') {
            e.preventDefault();
            cut?.();
            return;
        }

        // Paste: Ctrl+V
        if (isCtrl && key === 'v') {
            e.preventDefault();
            paste?.();
            return;
        }

        // Duplicate: Ctrl+D
        if (isCtrl && key === 'd') {
            e.preventDefault();
            duplicateElements?.();
            return;
        }

        // Delete: Delete or Backspace
        if (key === 'delete' || key === 'backspace') {
            e.preventDefault();
            deleteElements?.();
            return;
        }

        // Select All: Ctrl+A
        if (isCtrl && key === 'a') {
            e.preventDefault();
            selectAll?.();
            return;
        }

        // Escape: Clear selection
        if (key === 'escape') {
            e.preventDefault();
            clearSelection?.();
            return;
        }

        // Group: Ctrl+G
        if (isCtrl && !isShift && key === 'g') {
            e.preventDefault();
            groupElements?.();
            return;
        }

        // Ungroup: Ctrl+Shift+G
        if (isCtrl && isShift && key === 'g') {
            e.preventDefault();
            ungroupElements?.();
            return;
        }

        // Bring to Front: ]
        if (key === ']' && !isCtrl) {
            e.preventDefault();
            bringToFront?.();
            return;
        }

        // Send to Back: [
        if (key === '[' && !isCtrl) {
            e.preventDefault();
            sendToBack?.();
            return;
        }

        // Tool shortcuts (only when not holding Ctrl)
        if (!isCtrl) {
            switch (key) {
                case 'v':
                    e.preventDefault();
                    setTool?.(ToolType.SELECT);
                    break;
                case 'f':
                    e.preventDefault();
                    setTool?.(ToolType.FRAME);
                    break;
                case 'r':
                    e.preventDefault();
                    setTool?.(ToolType.RECTANGLE);
                    break;
                case 'o':
                    e.preventDefault();
                    setTool?.(ToolType.ELLIPSE);
                    break;
                case 'l':
                    e.preventDefault();
                    setTool?.(isShift ? ToolType.ARROW : ToolType.LINE);
                    break;
                case 'p':
                    e.preventDefault();
                    setTool?.(isShift ? ToolType.PENCIL : ToolType.PEN);
                    break;
                case 't':
                    e.preventDefault();
                    setTool?.(ToolType.TEXT);
                    break;
                case 'h':
                    e.preventDefault();
                    setTool?.(ToolType.HAND);
                    break;
                case 'c':
                    e.preventDefault();
                    setTool?.(ToolType.COMMENT);
                    break;
            }
        }

        // Zoom shortcuts
        if (isCtrl && (key === '=' || key === '+')) {
            e.preventDefault();
            // Zoom in handled by canvas
        }
        if (isCtrl && key === '-') {
            e.preventDefault();
            // Zoom out handled by canvas
        }
        if (isCtrl && key === '0') {
            e.preventDefault();
            // Reset zoom handled by canvas
        }

    }, [undo, redo, copy, cut, paste, deleteElements, selectAll, clearSelection, groupElements, ungroupElements, bringToFront, sendToBack, duplicateElements, setTool]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
