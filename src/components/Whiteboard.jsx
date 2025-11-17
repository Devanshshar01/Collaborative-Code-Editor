import React, {useState, useRef, useEffect, useMemo, useCallback} from 'react';
import {
    Tldraw, DefaultDashStyle, DefaultSizeStyle, DefaultColorStyle,
    DefaultFontStyle, DefaultAlignStyle, DefaultVerticalAlignStyle, TldrawUiMenuItem, TldrawUiMenuGroup
} from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import TLDrawYjsProvider from '../utils/tldraw-yjs-provider';
import {enhancedShapeUtils, WhiteboardUtils} from '../utils/tldraw-shapes.jsx';

const Whiteboard = ({
                        roomId,
                        userId,
                        userName,
                        isAdmin = false,
                        onStatsChange,
                        onError,
                        onUsersChange
                    }) => {
    const [store, setStore] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [stats, setStats] = useState({
        shapes: 0,
        users: 0,
        connected: false,
        synced: false
    });
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isExporting, setIsExporting] = useState(false);

    const providerRef = useRef(null);
    const editorRef = useRef(null);
    const isInitialSyncRef = useRef(true);

    // Initialize TLDraw store and Yjs provider
    useEffect(() => {
        if (!roomId || !userId) return;

        // Create TLDraw store
        const tlStore = createTLStore({
            shapeUtils: enhancedShapeUtils
        });

        setStore(tlStore);

        // Initialize Yjs provider
        const provider = new TLDrawYjsProvider(roomId, userId, {
            userName,
            serverUrl: process.env.REACT_APP_YJS_URL || 'ws://localhost:1234',
            enablePersistence: true,
            maxShapes: 10000,
            onConnect: () => {
                console.log('🎨 Whiteboard connected to server');
                setIsConnected(true);
                updateStats();
            },
            onDisconnect: () => {
                console.log('🎨 Whiteboard disconnected from server');
                setIsConnected(false);
                updateStats();
            },
            onSync: () => {
                console.log('🎨 Whiteboard synced');
                setIsSynced(true);

                // Sync Yjs to TLDraw on initial load
                if (isInitialSyncRef.current) {
                    provider.syncYjsToTLDraw(tlStore);
                    isInitialSyncRef.current = false;
                }

                updateStats();
            },
            onError: (error) => {
                console.error('Whiteboard error:', error);
                onError?.(error);
            }
        });

        providerRef.current = provider;

        // Set up store change listener
        const handleStoreChange = (changes) => {
            if (!isInitialSyncRef.current) {
                provider.handleStoreChange(tlStore, changes);
            }
        };

        const unsubscribe = tlStore.listen(handleStoreChange);

        // Set up Yjs change listeners
        const handleShapesChange = () => {
            if (!isInitialSyncRef.current) {
                provider.syncYjsToTLDraw(tlStore);
            }
            updateStats();
        };

        const handleAwarenessChange = () => {
            const users = provider.getOnlineUsers();
            setOnlineUsers(users);
            onUsersChange?.(users);
            updateStats();
        };

        provider.on('shapes-change', handleShapesChange);
        provider.on('awareness-change', handleAwarenessChange);

        const updateStats = () => {
            const newStats = provider.getStats();
            setStats(newStats);
            onStatsChange?.(newStats);
        };

        // Update stats periodically
        const statsInterval = setInterval(updateStats, 5000);

        return () => {
            clearInterval(statsInterval);
            unsubscribe();
            provider.off('shapes-change', handleShapesChange);
            provider.off('awareness-change', handleAwarenessChange);
            provider.destroy();
        };
    }, [roomId, userId, userName, onError, onStatsChange, onUsersChange]);

    // Handle cursor updates
    const handlePointerMove = useCallback((info) => {
        if (providerRef.current && info.point) {
            providerRef.current.updateCursor({
                x: info.point.x,
                y: info.point.y,
                timestamp: Date.now()
            });
        }
    }, []);

    // Clear whiteboard (admin only)
    const handleClearWhiteboard = useCallback(() => {
        if (!isAdmin) {
            alert('Only administrators can clear the whiteboard');
            return;
        }

        const confirmClear = window.confirm(
            'Are you sure you want to clear the entire whiteboard? This action cannot be undone.'
        );

        if (confirmClear && providerRef.current) {
            const success = providerRef.current.clearWhiteboard(true);
            if (success) {
                // Also clear local store
                if (store) {
                    store.clear();
                }
                alert('Whiteboard cleared successfully');
            }
        }
    }, [isAdmin, store]);

    // Export as PNG
    const handleExportPNG = useCallback(async () => {
        if (!editorRef.current) return;

        setIsExporting(true);
        try {
            // Get the TLDraw canvas element
            const canvasElement = editorRef.current.querySelector('.tl-canvas');
            if (!canvasElement) {
                throw new Error('Canvas element not found');
            }

            // Create screenshot using html2canvas
            const canvas = await html2canvas(canvasElement, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher quality
                useCORS: true,
                allowTaint: true
            });

            // Download the image
            const link = document.createElement('a');
            link.download = `whiteboard-${roomId}-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL();
            link.click();

            console.log('✅ Whiteboard exported as PNG');
        } catch (error) {
            console.error('Failed to export PNG:', error);
            onError?.(error);
            alert('Failed to export whiteboard as PNG');
        } finally {
            setIsExporting(false);
        }
    }, [roomId, onError]);

    // Export as PDF
    const handleExportPDF = useCallback(async () => {
        if (!editorRef.current) return;

        setIsExporting(true);
        try {
            // Get the TLDraw canvas element
            const canvasElement = editorRef.current.querySelector('.tl-canvas');
            if (!canvasElement) {
                throw new Error('Canvas element not found');
            }

            // Create screenshot using html2canvas
            const canvas = await html2canvas(canvasElement, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true
            });

            // Create PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`whiteboard-${roomId}-${new Date().toISOString().slice(0, 10)}.pdf`);

            console.log('✅ Whiteboard exported as PDF');
        } catch (error) {
            console.error('Failed to export PDF:', error);
            onError?.(error);
            alert('Failed to export whiteboard as PDF');
        } finally {
            setIsExporting(false);
        }
    }, [roomId, onError]);

    // Export whiteboard data as JSON
    const handleExportData = useCallback(() => {
        if (!providerRef.current) return;

        try {
            const data = providerRef.current.exportWhiteboardData();
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `whiteboard-data-${roomId}-${new Date().toISOString().slice(0, 10)}.json`;
            link.click();

            URL.revokeObjectURL(link.href);
            console.log('✅ Whiteboard data exported as JSON');
        } catch (error) {
            console.error('Failed to export data:', error);
            onError?.(error);
        }
    }, [roomId, onError]);

    // Render loading state
    if (!store) {
        return (
            <div className="whiteboard-loading" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                background: '#fafafa',
                color: '#666',
                fontSize: '16px'
            }}>
                <div>
                    🎨 Initializing whiteboard...
                </div>
            </div>
        );
    }

    return (
        <div className="whiteboard-container" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#fafafa'
        }}>
            {/* Toolbar */}
            <div className="whiteboard-toolbar" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                background: '#ffffff',
                borderBottom: '1px solid #e1e1e1',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                {/* Status indicators */}
                <div className="toolbar-left" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isConnected ? (isSynced ? '#4caf50' : '#ff9800') : '#f44336'
                        }}/>
                        <span style={{color: '#666'}}>
                            {isConnected ? (isSynced ? 'Synced' : 'Syncing...') : 'Offline'}
                        </span>
                    </div>

                    <div style={{fontSize: '14px', color: '#666'}}>
                        📊 {stats.shapes} shapes • 👥 {stats.users + 1} users
                    </div>

                    {/* Online users */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {onlineUsers.slice(0, 5).map((user, index) => (
                            <div
                                key={user.id}
                                title={user.name}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: user.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    color: '#fff',
                                    fontWeight: 'bold'
                                }}
                            >
                                {user.name[0].toUpperCase()}
                            </div>
                        ))}
                        {onlineUsers.length > 5 && (
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: '#ccc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                color: '#666'
                            }}>
                                +{onlineUsers.length - 5}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="toolbar-right" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <button
                        onClick={handleExportPNG}
                        disabled={isExporting}
                        style={{
                            padding: '6px 12px',
                            background: '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isExporting ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            opacity: isExporting ? 0.6 : 1
                        }}
                    >
                        {isExporting ? '⏳' : '📷'} PNG
                    </button>

                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        style={{
                            padding: '6px 12px',
                            background: '#ff5722',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isExporting ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            opacity: isExporting ? 0.6 : 1
                        }}
                    >
                        {isExporting ? '⏳' : '📄'} PDF
                    </button>

                    <button
                        onClick={handleExportData}
                        style={{
                            padding: '6px 12px',
                            background: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        💾 Data
                    </button>

                    {isAdmin && (
                        <button
                            onClick={handleClearWhiteboard}
                            style={{
                                padding: '6px 12px',
                                background: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                marginLeft: '8px'
                            }}
                        >
                            🧹 Clear
                        </button>
                    )}
                </div>
            </div>

            {/* TLDraw Editor */}
            <div
                ref={editorRef}
                className="whiteboard-editor"
                style={{
                    flex: 1,
                    position: 'relative'
                }}
            >
                <Tldraw
                    store={store}
                    onPointerMove={handlePointerMove}
                    persistenceKey={`tldraw-${roomId}`}
                    inferDarkMode
                />
            </div>

            {/* Connection status overlay */}
            {!isConnected && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(244, 67, 54, 0.9)',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                    🔌 Reconnecting to whiteboard...
                </div>
            )}

            {/* Export progress overlay */}
            {isExporting && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    zIndex: 2000
                }}>
                    <div style={{textAlign: 'center'}}>
                        <div>📸 Exporting whiteboard...</div>
                        <div style={{fontSize: '14px', marginTop: '8px', opacity: 0.8}}>
                            Please wait while we generate your file
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Whiteboard;