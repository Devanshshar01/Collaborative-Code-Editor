import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Tldraw, createTLStore } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import TLDrawYjsProvider from '../utils/tldraw-yjs-provider';
import { Image, FileText, Save, Trash2, Users, Activity, Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

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

        // Create TLDraw store with default shapes
        const tlStore = createTLStore();

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
            <div className="flex flex-col items-center justify-center h-full bg-surface-light text-text-secondary">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                <div className="text-sm font-medium">Initializing whiteboard...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-surface-light relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-white/5 shadow-sm z-10">
                {/* Status indicators */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/5">
                        <div className={clsx(
                            "w-2 h-2 rounded-full animate-pulse",
                            isConnected ? (isSynced ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-yellow-500") : "bg-red-500"
                        )} />
                        <span className="text-xs font-medium text-text-secondary">
                            {isConnected ? (isSynced ? 'Synced' : 'Syncing...') : 'Offline'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <Activity className="w-3.5 h-3.5" />
                        <span>{stats.shapes} shapes</span>
                    </div>

                    {/* Online users */}
                    <div className="flex items-center gap-1">
                        <div className="flex -space-x-2 mr-2">
                            {onlineUsers.slice(0, 5).map((user) => (
                                <div
                                    key={user.id}
                                    title={user.name}
                                    className="w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                                    style={{ backgroundColor: user.color }}
                                >
                                    {user.name[0].toUpperCase()}
                                </div>
                            ))}
                            {onlineUsers.length > 5 && (
                                <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-light flex items-center justify-center text-[10px] font-bold text-text-secondary">
                                    +{onlineUsers.length - 5}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-text-secondary bg-white/5 px-2 py-1 rounded-md">
                            <Users className="w-3.5 h-3.5" />
                            <span>{stats.users + 1}</span>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportPNG}
                        disabled={isExporting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-all border border-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
                        <span className="text-xs font-medium">PNG</span>
                    </button>

                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 transition-all border border-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                        <span className="text-xs font-medium">PDF</span>
                    </button>

                    <button
                        onClick={handleExportData}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 transition-all border border-green-500/20"
                    >
                        <Save className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Data</span>
                    </button>

                    {isAdmin && (
                        <button
                            onClick={handleClearWhiteboard}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/20 ml-2"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Clear</span>
                        </button>
                    )}
                </div>
            </div>

            {/* TLDraw Editor */}
            <div
                ref={editorRef}
                className="flex-1 relative"
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
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500/90 backdrop-blur-md text-white px-6 py-4 rounded-xl shadow-2xl border border-red-400/50 flex items-center gap-3 z-50 animate-pulse">
                    <AlertCircle className="w-6 h-6" />
                    <span className="font-medium">Reconnecting to whiteboard...</span>
                </div>
            )}

            {/* Export progress overlay */}
            {isExporting && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-surface p-6 rounded-xl border border-white/10 shadow-2xl flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <div className="text-center">
                            <div className="text-lg font-medium text-white">Exporting whiteboard...</div>
                            <div className="text-sm text-text-secondary mt-1">Please wait while we generate your file</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Whiteboard;