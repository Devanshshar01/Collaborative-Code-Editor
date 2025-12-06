/**
 * History Hook
 * Undo/Redo functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useCanvasStore } from '../store';

const MAX_HISTORY_LENGTH = 100;

export const useHistory = () => {
    const [past, setPast] = useState([]);
    const [future, setFuture] = useState([]);
    const isUndoingRef = useRef(false);
    
    const { elements, setElements, version } = useCanvasStore();
    const lastVersionRef = useRef(version);

    // Save state to history when elements change
    useEffect(() => {
        // Don't save during undo/redo
        if (isUndoingRef.current) {
            isUndoingRef.current = false;
            return;
        }

        // Only save if version actually changed
        if (version !== lastVersionRef.current && elements.length >= 0) {
            lastVersionRef.current = version;
            
            setPast(prev => {
                const newPast = [...prev, JSON.stringify(elements)];
                // Limit history length
                if (newPast.length > MAX_HISTORY_LENGTH) {
                    newPast.shift();
                }
                return newPast;
            });
            
            // Clear future when new action is performed
            setFuture([]);
        }
    }, [version, elements]);

    // Undo
    const undo = useCallback(() => {
        if (past.length === 0) return;

        isUndoingRef.current = true;
        
        const newPast = [...past];
        const previousState = newPast.pop();
        
        setPast(newPast);
        setFuture(prev => [JSON.stringify(elements), ...prev]);
        
        if (previousState) {
            setElements(JSON.parse(previousState));
        }
    }, [past, elements, setElements]);

    // Redo
    const redo = useCallback(() => {
        if (future.length === 0) return;

        isUndoingRef.current = true;
        
        const newFuture = [...future];
        const nextState = newFuture.shift();
        
        setFuture(newFuture);
        setPast(prev => [...prev, JSON.stringify(elements)]);
        
        if (nextState) {
            setElements(JSON.parse(nextState));
        }
    }, [future, elements, setElements]);

    // Clear history
    const clearHistory = useCallback(() => {
        setPast([]);
        setFuture([]);
    }, []);

    return {
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        clearHistory,
        historyLength: past.length,
    };
};

export default useHistory;
