/**
 * Clipboard Hook
 * Copy, cut, paste functionality
 */

import { useCallback } from 'react';
import { useCanvasStore, createElement } from '../store';
import { nanoid } from 'nanoid';

export const useClipboard = () => {
    const { 
        elements, 
        selectedIds, 
        clipboard, 
        setClipboard, 
        addElements, 
        deleteElements,
        selectElements,
    } = useCanvasStore();

    // Copy selected elements
    const copy = useCallback((specificId) => {
        const idsToCopy = specificId ? [specificId] : selectedIds;
        const elementsToCopy = elements.filter(el => idsToCopy.includes(el.id));
        
        if (elementsToCopy.length > 0) {
            // Deep clone elements
            const cloned = JSON.parse(JSON.stringify(elementsToCopy));
            setClipboard(cloned);
            
            // Also try to use system clipboard
            try {
                navigator.clipboard.writeText(JSON.stringify(cloned));
            } catch (e) {
                // System clipboard not available
            }
        }
    }, [elements, selectedIds, setClipboard]);

    // Cut selected elements
    const cut = useCallback((specificId) => {
        const idsToCut = specificId ? [specificId] : selectedIds;
        const elementsToCut = elements.filter(el => idsToCut.includes(el.id));
        
        if (elementsToCut.length > 0) {
            // Deep clone elements
            const cloned = JSON.parse(JSON.stringify(elementsToCut));
            setClipboard(cloned);
            
            // Delete original elements
            deleteElements(idsToCut);
            
            // Also try to use system clipboard
            try {
                navigator.clipboard.writeText(JSON.stringify(cloned));
            } catch (e) {
                // System clipboard not available
            }
        }
    }, [elements, selectedIds, setClipboard, deleteElements]);

    // Paste from clipboard
    const paste = useCallback(async (position) => {
        let elementsToPaste = clipboard;
        
        // Try to read from system clipboard
        try {
            const text = await navigator.clipboard.readText();
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
                elementsToPaste = parsed;
            }
        } catch (e) {
            // System clipboard not available or invalid data
        }
        
        if (elementsToPaste.length === 0) return;
        
        // Offset pasted elements
        const offset = 20;
        const pastedElements = elementsToPaste.map(el => ({
            ...el,
            id: nanoid(),
            name: `${el.name} copy`,
            x: (position?.x ?? el.x) + offset,
            y: (position?.y ?? el.y) + offset,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }));
        
        addElements(pastedElements);
        selectElements(pastedElements.map(e => e.id));
    }, [clipboard, addElements, selectElements]);

    // Check if clipboard has content
    const hasClipboardContent = clipboard.length > 0;

    return {
        copy,
        cut,
        paste,
        hasClipboardContent,
    };
};

export default useClipboard;
