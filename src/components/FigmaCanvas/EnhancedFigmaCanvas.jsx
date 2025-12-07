/**
 * EnhancedFigmaCanvas - Main integration component
 * Combines all enhanced whiteboard components together
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { EnhancedCanvas } from './EnhancedCanvas';
import { EnhancedToolbar, EnhancedTopBar } from './EnhancedToolbar';
import { EnhancedPropertiesPanel } from './EnhancedPropertiesPanel';
import { EnhancedLayersPanel } from './EnhancedLayersPanel';
import { useWhiteboardStore, useElements, useSelectedIds, useTool, useZoom } from './whiteboardStore';
import { WhiteboardSocket, createWhiteboardSocket } from './whiteboardSocket';
import { WhiteboardYjs, createWhiteboardYjs } from './whiteboardYjs';

// ============ Main Component ============

export const EnhancedFigmaCanvas = ({
    roomId,
    socket,
    yjsDoc,
    yjsAwareness,
    userId,
    userName,
    userColor,
    onShare,
    onExport,
    showLayers = true,
    showProperties = true,
    showToolbar = true,
    showTopBar = true,
    className = '',
}) => {
    const containerRef = useRef(null);
    const whiteboardSocketRef = useRef(null);
    const whiteboardYjsRef = useRef(null);
    
    const [isReady, setIsReady] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    
    // Store hooks
    const elements = useElements();
    const selectedIds = useSelectedIds();
    const tool = useTool();
    const zoom = useZoom();
    
    // ============ Socket Connection ============
    
    useEffect(() => {
        if (socket && roomId && userId) {
            // Create socket manager
            whiteboardSocketRef.current = createWhiteboardSocket(
                socket,
                roomId,
                userId,
                userName || 'Anonymous',
                userColor || '#' + Math.floor(Math.random() * 16777215).toString(16)
            );
            
            // Connect
            whiteboardSocketRef.current.connect();
            setConnectionStatus('connected');
            
            return () => {
                if (whiteboardSocketRef.current) {
                    whiteboardSocketRef.current.disconnect();
                }
            };
        }
    }, [socket, roomId, userId, userName, userColor]);
    
    // ============ Yjs Integration ============
    
    useEffect(() => {
        if (yjsDoc && roomId && userId) {
            // Create Yjs manager
            whiteboardYjsRef.current = createWhiteboardYjs(
                yjsDoc,
                yjsAwareness,
                roomId,
                userId,
                userName || 'Anonymous',
                userColor || '#' + Math.floor(Math.random() * 16777215).toString(16)
            );
            
            // Initialize
            whiteboardYjsRef.current.init();
            setIsReady(true);
            
            return () => {
                if (whiteboardYjsRef.current) {
                    whiteboardYjsRef.current.destroy();
                }
            };
        } else {
            // No Yjs, just socket-based sync
            setIsReady(true);
        }
    }, [yjsDoc, yjsAwareness, roomId, userId, userName, userColor]);
    
    // ============ Sync Store Changes to Socket ============
    
    useEffect(() => {
        if (!whiteboardSocketRef.current) return;
        
        const unsubscribe = useWhiteboardStore.subscribe(
            state => ({ elements: state.elements, version: state.version }),
            ({ elements }, { elements: prevElements }) => {
                if (!whiteboardSocketRef.current) return;
                
                // Find changes and emit
                const added = elements.filter(el => !prevElements.find(p => p.id === el.id));
                const deleted = prevElements.filter(p => !elements.find(el => el.id === p.id));
                const modified = elements.filter(el => {
                    const prev = prevElements.find(p => p.id === el.id);
                    return prev && JSON.stringify(el) !== JSON.stringify(prev);
                });
                
                added.forEach(el => whiteboardSocketRef.current.emitObjectCreated(el));
                modified.forEach(el => whiteboardSocketRef.current.queueUpdate(el.id, el));
                if (deleted.length > 0) {
                    whiteboardSocketRef.current.emitObjectDeleted(deleted.map(el => el.id));
                }
            }
        );
        
        return () => unsubscribe();
    }, []);
    
    // ============ Keyboard Shortcuts ============
    
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Global keyboard shortcuts are handled in EnhancedCanvas
            // This handles any additional app-level shortcuts
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    // ============ Export Handler ============
    
    const handleExport = useCallback(() => {
        const store = useWhiteboardStore.getState();
        
        // Export as JSON
        const exportData = {
            version: '1.0',
            elements: store.elements,
            metadata: {
                roomId,
                exportedAt: new Date().toISOString(),
                exportedBy: userId,
            },
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whiteboard-${roomId}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        onExport?.();
    }, [roomId, userId, onExport]);
    
    // ============ Share Handler ============
    
    const handleShare = useCallback(() => {
        const shareUrl = `${window.location.origin}/room/${roomId}?whiteboard=true`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Collaborative Whiteboard',
                text: 'Join my whiteboard session',
                url: shareUrl,
            });
        } else {
            navigator.clipboard.writeText(shareUrl);
            alert('Share link copied to clipboard!');
        }
        
        onShare?.();
    }, [roomId, onShare]);
    
    // ============ Render ============
    
    if (!isReady) {
        return (
            <div style={styles.loading}>
                <div style={styles.spinner} />
                <p>Loading whiteboard...</p>
            </div>
        );
    }
    
    return (
        <div ref={containerRef} className={className} style={styles.container}>
            {/* Top Bar */}
            {showTopBar && (
                <EnhancedTopBar
                    roomName={roomId}
                    userName={userName}
                    onShare={handleShare}
                    onExport={handleExport}
                />
            )}
            
            <div style={styles.main}>
                {/* Left Sidebar - Toolbar */}
                {showToolbar && (
                    <EnhancedToolbar orientation="vertical" />
                )}
                
                {/* Left Panel - Layers */}
                {showLayers && (
                    <EnhancedLayersPanel />
                )}
                
                {/* Main Canvas */}
                <div style={styles.canvasContainer}>
                    <EnhancedCanvas
                        roomId={roomId}
                        userId={userId}
                        userName={userName}
                        userColor={userColor}
                    />
                    
                    {/* Connection status indicator */}
                    <div style={{
                        ...styles.statusIndicator,
                        background: connectionStatus === 'connected' ? '#4caf50' : '#ff9800',
                    }}>
                        {connectionStatus === 'connected' ? '●' : '○'}
                    </div>
                </div>
                
                {/* Right Panel - Properties */}
                {showProperties && (
                    <EnhancedPropertiesPanel />
                )}
            </div>
        </div>
    );
};

// ============ Standalone Mode ============

export const StandaloneFigmaCanvas = ({ className }) => {
    const [userId] = useState(() => `user-${Math.random().toString(36).slice(2, 8)}`);
    const [userName] = useState('Guest');
    const [userColor] = useState(() => '#' + Math.floor(Math.random() * 16777215).toString(16));
    
    return (
        <EnhancedFigmaCanvas
            roomId="standalone"
            userId={userId}
            userName={userName}
            userColor={userColor}
            className={className}
        />
    );
};

// ============ Styles ============

const styles = {
    container: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#1e1e1e',
        overflow: 'hidden',
    },
    main: {
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
    },
    canvasContainer: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    loading: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1e1e1e',
        color: '#888',
        gap: 16,
    },
    spinner: {
        width: 40,
        height: 40,
        border: '3px solid #333',
        borderTopColor: '#0d99ff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 24,
        height: 24,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    },
};

// Add keyframes for spinner
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(styleSheet);
}

export default EnhancedFigmaCanvas;
