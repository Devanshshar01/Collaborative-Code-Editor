/**
 * Figma-style Top Bar Component
 * Header with file menu, zoom controls, share button
 */

import React, { useState, useCallback } from 'react';
import clsx from 'clsx';

// Figma logo icon
const FigmaLogo = () => (
    <svg width="24" height="36" viewBox="0 0 38 57" fill="none">
        <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE"/>
        <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 0 1-19 0z" fill="#0ACF83"/>
        <path d="M19 0v19h9.5a9.5 9.5 0 0 0 0-19H19z" fill="#FF7262"/>
        <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E"/>
        <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF"/>
    </svg>
);

// Menu dropdown component
const MenuDropdown = ({ label, items, isOpen, onOpen, onClose }) => {
    return (
        <div 
            className="figma-menu-dropdown"
            onMouseEnter={onOpen}
            onMouseLeave={onClose}
        >
            <button 
                className={clsx('figma-menu-trigger', isOpen && 'open')}
                onClick={onOpen}
            >
                {label}
            </button>
            {isOpen && (
                <div className="figma-menu-content">
                    {items.map((item, index) => {
                        if (item.type === 'separator') {
                            return <div key={index} className="figma-menu-separator" />;
                        }
                        return (
                            <button
                                key={item.id}
                                className={clsx('figma-menu-item', item.disabled && 'disabled')}
                                onClick={() => !item.disabled && item.onClick?.()}
                                disabled={item.disabled}
                            >
                                <span className="figma-menu-item-label">{item.label}</span>
                                {item.shortcut && (
                                    <span className="figma-menu-item-shortcut">{item.shortcut}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// Zoom controls
const ZoomControls = ({ zoom, onZoomChange }) => {
    const zoomPresets = [0.5, 0.75, 1, 1.5, 2, 4];
    const [showDropdown, setShowDropdown] = useState(false);

    const zoomIn = () => onZoomChange(Math.min(zoom * 1.25, 256));
    const zoomOut = () => onZoomChange(Math.max(zoom / 1.25, 0.02));
    const zoomToFit = () => onZoomChange(1);

    return (
        <div className="figma-zoom-controls">
            <button onClick={zoomOut} className="figma-zoom-btn" title="Zoom out">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 7h8v2H4V7z"/>
                </svg>
            </button>
            
            <div className="figma-zoom-dropdown">
                <button 
                    className="figma-zoom-value"
                    onClick={() => setShowDropdown(!showDropdown)}
                >
                    {Math.round(zoom * 100)}%
                    <svg width="8" height="8" viewBox="0 0 8 8">
                        <path d="M1 2l3 4 3-4H1z" fill="currentColor"/>
                    </svg>
                </button>
                
                {showDropdown && (
                    <div className="figma-zoom-presets" onMouseLeave={() => setShowDropdown(false)}>
                        {zoomPresets.map(preset => (
                            <button
                                key={preset}
                                className={clsx('figma-zoom-preset', zoom === preset && 'active')}
                                onClick={() => {
                                    onZoomChange(preset);
                                    setShowDropdown(false);
                                }}
                            >
                                {Math.round(preset * 100)}%
                            </button>
                        ))}
                        <div className="figma-menu-separator" />
                        <button 
                            className="figma-zoom-preset"
                            onClick={() => {
                                zoomToFit();
                                setShowDropdown(false);
                            }}
                        >
                            Zoom to Fit
                        </button>
                        <button 
                            className="figma-zoom-preset"
                            onClick={() => {
                                onZoomChange(1);
                                setShowDropdown(false);
                            }}
                        >
                            Zoom to 100%
                        </button>
                    </div>
                )}
            </div>
            
            <button onClick={zoomIn} className="figma-zoom-btn" title="Zoom in">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M7 4v3H4v2h3v3h2V9h3V7H9V4H7z"/>
                </svg>
            </button>
        </div>
    );
};

// Main TopBar component
const TopBar = ({
    zoom,
    onZoomChange,
    onExportPNG,
    onExportSVG,
    onExportJSON,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    fileName,
    userName,
    collaborative,
}) => {
    const [openMenu, setOpenMenu] = useState(null);

    const fileMenuItems = [
        { id: 'new', label: 'New design file', shortcut: 'Ctrl+N', onClick: () => console.log('New') },
        { id: 'open', label: 'Open...', shortcut: 'Ctrl+O', onClick: () => console.log('Open') },
        { type: 'separator' },
        { id: 'save', label: 'Save to file', shortcut: 'Ctrl+S', onClick: onExportJSON },
        { id: 'save-as', label: 'Save as...', shortcut: 'Ctrl+Shift+S', onClick: onExportJSON },
        { type: 'separator' },
        { id: 'export-png', label: 'Export as PNG', shortcut: 'Ctrl+Shift+E', onClick: onExportPNG },
        { id: 'export-svg', label: 'Export as SVG', onClick: onExportSVG },
        { id: 'export-json', label: 'Export as JSON', onClick: onExportJSON },
        { type: 'separator' },
        { id: 'close', label: 'Close', shortcut: 'Ctrl+W', onClick: () => console.log('Close') },
    ];

    const editMenuItems = [
        { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', onClick: onUndo, disabled: !canUndo },
        { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Shift+Z', onClick: onRedo, disabled: !canRedo },
        { type: 'separator' },
        { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X', onClick: () => console.log('Cut') },
        { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', onClick: () => console.log('Copy') },
        { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V', onClick: () => console.log('Paste') },
        { id: 'paste-here', label: 'Paste here', shortcut: 'Ctrl+Shift+V', onClick: () => console.log('Paste here') },
        { type: 'separator' },
        { id: 'duplicate', label: 'Duplicate', shortcut: 'Ctrl+D', onClick: () => console.log('Duplicate') },
        { id: 'delete', label: 'Delete', shortcut: 'Del', onClick: () => console.log('Delete') },
    ];

    const viewMenuItems = [
        { id: 'zoom-in', label: 'Zoom in', shortcut: 'Ctrl++', onClick: () => onZoomChange(zoom * 1.25) },
        { id: 'zoom-out', label: 'Zoom out', shortcut: 'Ctrl+-', onClick: () => onZoomChange(zoom / 1.25) },
        { id: 'zoom-100', label: 'Zoom to 100%', shortcut: 'Ctrl+0', onClick: () => onZoomChange(1) },
        { id: 'zoom-fit', label: 'Zoom to fit', shortcut: 'Shift+1', onClick: () => console.log('Fit') },
        { type: 'separator' },
        { id: 'rulers', label: 'Rulers', shortcut: 'Shift+R', onClick: () => console.log('Rulers') },
        { id: 'grid', label: 'Grid', shortcut: "Ctrl+'", onClick: () => console.log('Grid') },
        { type: 'separator' },
        { id: 'outlines', label: 'Show outlines', shortcut: 'Ctrl+Y', onClick: () => console.log('Outlines') },
        { id: 'pixel-preview', label: 'Pixel preview', onClick: () => console.log('Pixel') },
    ];

    const objectMenuItems = [
        { id: 'group', label: 'Group selection', shortcut: 'Ctrl+G', onClick: () => console.log('Group') },
        { id: 'ungroup', label: 'Ungroup', shortcut: 'Ctrl+Shift+G', onClick: () => console.log('Ungroup') },
        { id: 'frame', label: 'Frame selection', shortcut: 'Ctrl+Alt+G', onClick: () => console.log('Frame') },
        { type: 'separator' },
        { id: 'bring-front', label: 'Bring to front', shortcut: ']', onClick: () => console.log('Front') },
        { id: 'bring-forward', label: 'Bring forward', shortcut: 'Ctrl+]', onClick: () => console.log('Forward') },
        { id: 'send-backward', label: 'Send backward', shortcut: 'Ctrl+[', onClick: () => console.log('Backward') },
        { id: 'send-back', label: 'Send to back', shortcut: '[', onClick: () => console.log('Back') },
        { type: 'separator' },
        { id: 'flip-h', label: 'Flip horizontal', shortcut: 'Shift+H', onClick: () => console.log('Flip H') },
        { id: 'flip-v', label: 'Flip vertical', shortcut: 'Shift+V', onClick: () => console.log('Flip V') },
    ];

    const helpMenuItems = [
        { id: 'help', label: 'Help and resources', onClick: () => window.open('https://help.figma.com', '_blank') },
        { id: 'keyboard', label: 'Keyboard shortcuts', onClick: () => console.log('Shortcuts') },
        { type: 'separator' },
        { id: 'about', label: 'About', onClick: () => alert('Figma-style Canvas Editor\nBuilt with React') },
    ];

    return (
        <div className="figma-topbar">
            {/* Left section - Logo and menus */}
            <div className="figma-topbar-left">
                <button className="figma-logo-btn" title="Home">
                    <FigmaLogo />
                </button>

                <div className="figma-menus">
                    <MenuDropdown
                        label="File"
                        items={fileMenuItems}
                        isOpen={openMenu === 'file'}
                        onOpen={() => setOpenMenu('file')}
                        onClose={() => setOpenMenu(null)}
                    />
                    <MenuDropdown
                        label="Edit"
                        items={editMenuItems}
                        isOpen={openMenu === 'edit'}
                        onOpen={() => setOpenMenu('edit')}
                        onClose={() => setOpenMenu(null)}
                    />
                    <MenuDropdown
                        label="View"
                        items={viewMenuItems}
                        isOpen={openMenu === 'view'}
                        onOpen={() => setOpenMenu('view')}
                        onClose={() => setOpenMenu(null)}
                    />
                    <MenuDropdown
                        label="Object"
                        items={objectMenuItems}
                        isOpen={openMenu === 'object'}
                        onOpen={() => setOpenMenu('object')}
                        onClose={() => setOpenMenu(null)}
                    />
                    <MenuDropdown
                        label="Help"
                        items={helpMenuItems}
                        isOpen={openMenu === 'help'}
                        onOpen={() => setOpenMenu('help')}
                        onClose={() => setOpenMenu(null)}
                    />
                </div>
            </div>

            {/* Center section - File name */}
            <div className="figma-topbar-center">
                <span className="figma-file-name">{fileName}</span>
                <span className="figma-file-status">
                    {collaborative ? '● Saved' : 'Local'}
                </span>
            </div>

            {/* Right section - Zoom and share */}
            <div className="figma-topbar-right">
                <ZoomControls zoom={zoom} onZoomChange={onZoomChange} />

                {/* User avatar */}
                {userName && (
                    <div className="figma-user-avatar" title={userName}>
                        {userName.charAt(0).toUpperCase()}
                    </div>
                )}

                {/* Share button */}
                <button className="figma-share-btn">
                    Share
                </button>

                {/* Play/Present button */}
                <button className="figma-play-btn" title="Present">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 2l10 6-10 6V2z"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default TopBar;
