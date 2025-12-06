/**
 * VS Code-style Menu Bar Component
 * Replicates the exact look and feel of VS Code's menu bar
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, ChevronRight, Search } from 'lucide-react';
import clsx from 'clsx';

// Menu item definitions matching VS Code exactly
const menuDefinitions = {
    file: {
        label: 'File',
        items: [
            { id: 'file.newFile', label: 'New File', shortcut: 'Ctrl+N' },
            { id: 'file.newWindow', label: 'New Window', shortcut: 'Ctrl+Shift+N' },
            { type: 'separator' },
            { id: 'file.openFile', label: 'Open File...', shortcut: 'Ctrl+O' },
            { id: 'file.openFolder', label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O' },
            { id: 'file.openRecent', label: 'Open Recent', submenu: [
                { id: 'file.reopen', label: 'Reopen Closed Editor', shortcut: 'Ctrl+Shift+T' },
                { type: 'separator' },
                { id: 'file.clearRecent', label: 'Clear Recently Opened' },
            ]},
            { type: 'separator' },
            { id: 'file.save', label: 'Save', shortcut: 'Ctrl+S' },
            { id: 'file.saveAs', label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
            { id: 'file.saveAll', label: 'Save All', shortcut: 'Ctrl+K S' },
            { type: 'separator' },
            { id: 'file.share', label: 'Share', submenu: [
                { id: 'file.share.copyLink', label: 'Copy Room Link' },
            ]},
            { type: 'separator' },
            { id: 'file.autoSave', label: 'Auto Save', checkable: true, checked: true },
            { type: 'separator' },
            { id: 'file.preferences.settings', label: 'Settings', shortcut: 'Ctrl+,' },
            { id: 'file.preferences.keyboardShortcuts', label: 'Keyboard Shortcuts', shortcut: 'Ctrl+K Ctrl+S' },
            { id: 'file.preferences.themes', label: 'Color Theme', shortcut: 'Ctrl+K Ctrl+T' },
            { type: 'separator' },
            { id: 'file.close', label: 'Close Editor', shortcut: 'Ctrl+W' },
            { id: 'file.closeFolder', label: 'Close Folder', shortcut: 'Ctrl+K F' },
        ],
    },
    edit: {
        label: 'Edit',
        items: [
            { id: 'edit.undo', label: 'Undo', shortcut: 'Ctrl+Z' },
            { id: 'edit.redo', label: 'Redo', shortcut: 'Ctrl+Y' },
            { type: 'separator' },
            { id: 'edit.cut', label: 'Cut', shortcut: 'Ctrl+X' },
            { id: 'edit.copy', label: 'Copy', shortcut: 'Ctrl+C' },
            { id: 'edit.paste', label: 'Paste', shortcut: 'Ctrl+V' },
            { type: 'separator' },
            { id: 'edit.find', label: 'Find', shortcut: 'Ctrl+F' },
            { id: 'edit.replace', label: 'Replace', shortcut: 'Ctrl+H' },
            { type: 'separator' },
            { id: 'edit.findInFiles', label: 'Find in Files', shortcut: 'Ctrl+Shift+F' },
            { id: 'edit.replaceInFiles', label: 'Replace in Files', shortcut: 'Ctrl+Shift+H' },
            { type: 'separator' },
            { id: 'edit.toggleLineComment', label: 'Toggle Line Comment', shortcut: 'Ctrl+/' },
            { id: 'edit.toggleBlockComment', label: 'Toggle Block Comment', shortcut: 'Shift+Alt+A' },
            { id: 'edit.emmetExpand', label: 'Emmet: Expand Abbreviation', shortcut: 'Tab' },
        ],
    },
    selection: {
        label: 'Selection',
        items: [
            { id: 'selection.selectAll', label: 'Select All', shortcut: 'Ctrl+A' },
            { id: 'selection.expandSelection', label: 'Expand Selection', shortcut: 'Shift+Alt+→' },
            { id: 'selection.shrinkSelection', label: 'Shrink Selection', shortcut: 'Shift+Alt+←' },
            { type: 'separator' },
            { id: 'selection.copyLineUp', label: 'Copy Line Up', shortcut: 'Shift+Alt+↑' },
            { id: 'selection.copyLineDown', label: 'Copy Line Down', shortcut: 'Shift+Alt+↓' },
            { id: 'selection.moveLineUp', label: 'Move Line Up', shortcut: 'Alt+↑' },
            { id: 'selection.moveLineDown', label: 'Move Line Down', shortcut: 'Alt+↓' },
            { id: 'selection.duplicateSelection', label: 'Duplicate Selection' },
            { type: 'separator' },
            { id: 'selection.addCursorAbove', label: 'Add Cursor Above', shortcut: 'Ctrl+Alt+↑' },
            { id: 'selection.addCursorBelow', label: 'Add Cursor Below', shortcut: 'Ctrl+Alt+↓' },
            { id: 'selection.addCursorsToLineEnds', label: 'Add Cursors to Line Ends', shortcut: 'Shift+Alt+I' },
            { id: 'selection.addNextOccurrence', label: 'Add Next Occurrence', shortcut: 'Ctrl+D' },
            { id: 'selection.addPreviousOccurrence', label: 'Add Previous Occurrence' },
            { id: 'selection.selectAllOccurrences', label: 'Select All Occurrences', shortcut: 'Ctrl+Shift+L' },
        ],
    },
    view: {
        label: 'View',
        items: [
            { id: 'view.commandPalette', label: 'Command Palette...', shortcut: 'Ctrl+Shift+P' },
            { id: 'view.openView', label: 'Open View...' },
            { type: 'separator' },
            { id: 'view.appearance', label: 'Appearance', submenu: [
                { id: 'view.fullscreen', label: 'Full Screen', shortcut: 'F11' },
                { id: 'view.zenMode', label: 'Zen Mode', shortcut: 'Ctrl+K Z' },
                { type: 'separator' },
                { id: 'view.menuBar', label: 'Menu Bar', checkable: true, checked: true },
                { id: 'view.primarySideBar', label: 'Primary Side Bar', shortcut: 'Ctrl+B', checkable: true, checked: true },
                { id: 'view.secondarySideBar', label: 'Secondary Side Bar', shortcut: 'Ctrl+Alt+B', checkable: true },
                { id: 'view.statusBar', label: 'Status Bar', checkable: true, checked: true },
                { id: 'view.activityBar', label: 'Activity Bar', checkable: true, checked: true },
                { id: 'view.panel', label: 'Panel', checkable: true, checked: true },
            ]},
            { id: 'view.editorLayout', label: 'Editor Layout', submenu: [
                { id: 'view.splitUp', label: 'Split Up' },
                { id: 'view.splitDown', label: 'Split Down' },
                { id: 'view.splitLeft', label: 'Split Left' },
                { id: 'view.splitRight', label: 'Split Right' },
                { type: 'separator' },
                { id: 'view.singleColumn', label: 'Single' },
                { id: 'view.twoColumns', label: 'Two Columns' },
                { id: 'view.threeColumns', label: 'Three Columns' },
                { id: 'view.twoRows', label: 'Two Rows' },
                { id: 'view.threeRows', label: 'Three Rows' },
                { id: 'view.grid', label: 'Grid (2x2)' },
            ]},
            { type: 'separator' },
            { id: 'view.explorer', label: 'Explorer', shortcut: 'Ctrl+Shift+E' },
            { id: 'view.search', label: 'Search', shortcut: 'Ctrl+Shift+F' },
            { id: 'view.sourceControl', label: 'Source Control', shortcut: 'Ctrl+Shift+G G' },
            { id: 'view.run', label: 'Run and Debug', shortcut: 'Ctrl+Shift+D' },
            { id: 'view.extensions', label: 'Extensions', shortcut: 'Ctrl+Shift+X' },
            { type: 'separator' },
            { id: 'view.problems', label: 'Problems', shortcut: 'Ctrl+Shift+M' },
            { id: 'view.output', label: 'Output', shortcut: 'Ctrl+Shift+U' },
            { id: 'view.debugConsole', label: 'Debug Console', shortcut: 'Ctrl+Shift+Y' },
            { id: 'view.terminal', label: 'Terminal', shortcut: 'Ctrl+`' },
            { type: 'separator' },
            { id: 'view.wordWrap', label: 'Word Wrap', shortcut: 'Alt+Z' },
        ],
    },
    go: {
        label: 'Go',
        items: [
            { id: 'go.back', label: 'Back', shortcut: 'Alt+←', disabled: true },
            { id: 'go.forward', label: 'Forward', shortcut: 'Alt+→', disabled: true },
            { id: 'go.lastEditLocation', label: 'Last Edit Location', shortcut: 'Ctrl+K Ctrl+Q' },
            { type: 'separator' },
            { id: 'go.switchEditor', label: 'Switch Editor', submenu: [
                { id: 'go.nextEditor', label: 'Next Editor', shortcut: 'Ctrl+PageDown' },
                { id: 'go.previousEditor', label: 'Previous Editor', shortcut: 'Ctrl+PageUp' },
            ]},
            { id: 'go.switchGroup', label: 'Switch Group', submenu: [
                { id: 'go.group1', label: 'Group 1', shortcut: 'Ctrl+1' },
                { id: 'go.group2', label: 'Group 2', shortcut: 'Ctrl+2' },
                { id: 'go.group3', label: 'Group 3', shortcut: 'Ctrl+3' },
            ]},
            { type: 'separator' },
            { id: 'go.goToFile', label: 'Go to File...', shortcut: 'Ctrl+P' },
            { id: 'go.goToSymbol', label: 'Go to Symbol in Workspace...', shortcut: 'Ctrl+T' },
            { type: 'separator' },
            { id: 'go.goToSymbolInEditor', label: 'Go to Symbol in Editor...', shortcut: 'Ctrl+Shift+O' },
            { id: 'go.goToDefinition', label: 'Go to Definition', shortcut: 'F12' },
            { id: 'go.goToDeclaration', label: 'Go to Declaration' },
            { id: 'go.goToTypeDefinition', label: 'Go to Type Definition' },
            { id: 'go.goToImplementations', label: 'Go to Implementations', shortcut: 'Ctrl+F12' },
            { id: 'go.goToReferences', label: 'Go to References', shortcut: 'Shift+F12' },
            { type: 'separator' },
            { id: 'go.goToLine', label: 'Go to Line...', shortcut: 'Ctrl+G' },
            { id: 'go.goToBracket', label: 'Go to Bracket', shortcut: 'Ctrl+Shift+\\' },
        ],
    },
    run: {
        label: 'Run',
        items: [
            { id: 'run.startDebugging', label: 'Start Debugging', shortcut: 'F5' },
            { id: 'run.runWithoutDebugging', label: 'Run Without Debugging', shortcut: 'Ctrl+F5' },
            { id: 'run.stopDebugging', label: 'Stop Debugging', shortcut: 'Shift+F5', disabled: true },
            { id: 'run.restartDebugging', label: 'Restart Debugging', shortcut: 'Ctrl+Shift+F5', disabled: true },
            { type: 'separator' },
            { id: 'run.openConfigurations', label: 'Open Configurations' },
            { id: 'run.addConfiguration', label: 'Add Configuration...' },
            { type: 'separator' },
            { id: 'run.stepOver', label: 'Step Over', shortcut: 'F10', disabled: true },
            { id: 'run.stepInto', label: 'Step Into', shortcut: 'F11', disabled: true },
            { id: 'run.stepOut', label: 'Step Out', shortcut: 'Shift+F11', disabled: true },
            { id: 'run.continue', label: 'Continue', shortcut: 'F5', disabled: true },
            { type: 'separator' },
            { id: 'run.toggleBreakpoint', label: 'Toggle Breakpoint', shortcut: 'F9' },
            { id: 'run.newBreakpoint', label: 'New Breakpoint', submenu: [
                { id: 'run.conditionalBreakpoint', label: 'Conditional Breakpoint...' },
                { id: 'run.inlineBreakpoint', label: 'Inline Breakpoint', shortcut: 'Shift+F9' },
                { id: 'run.functionBreakpoint', label: 'Function Breakpoint...' },
                { id: 'run.logpoint', label: 'Logpoint...' },
            ]},
        ],
    },
    terminal: {
        label: 'Terminal',
        items: [
            { id: 'terminal.new', label: 'New Terminal', shortcut: 'Ctrl+Shift+`' },
            { id: 'terminal.split', label: 'Split Terminal', shortcut: 'Ctrl+Shift+5' },
            { type: 'separator' },
            { id: 'terminal.runTask', label: 'Run Task...' },
            { id: 'terminal.runBuildTask', label: 'Run Build Task...', shortcut: 'Ctrl+Shift+B' },
            { id: 'terminal.runActiveFile', label: 'Run Active File' },
            { id: 'terminal.runSelectedText', label: 'Run Selected Text' },
            { type: 'separator' },
            { id: 'terminal.showTasks', label: 'Show Running Tasks...' },
            { id: 'terminal.restartTask', label: 'Restart Running Task...' },
            { id: 'terminal.terminate', label: 'Terminate Task...' },
            { type: 'separator' },
            { id: 'terminal.configureTask', label: 'Configure Tasks...' },
            { id: 'terminal.configureDefaultBuild', label: 'Configure Default Build Task...' },
        ],
    },
    help: {
        label: 'Help',
        items: [
            { id: 'help.welcome', label: 'Welcome' },
            { id: 'help.showAllCommands', label: 'Show All Commands', shortcut: 'Ctrl+Shift+P' },
            { id: 'help.documentation', label: 'Documentation' },
            { id: 'help.releaseNotes', label: 'Release Notes' },
            { type: 'separator' },
            { id: 'help.keyboardShortcuts', label: 'Keyboard Shortcuts Reference', shortcut: 'Ctrl+K Ctrl+R' },
            { id: 'help.interactivePlayground', label: 'Editor Playground' },
            { type: 'separator' },
            { id: 'help.reportIssue', label: 'Report Issue' },
            { type: 'separator' },
            { id: 'help.toggleDevTools', label: 'Toggle Developer Tools', shortcut: 'Ctrl+Shift+I' },
            { type: 'separator' },
            { id: 'help.about', label: 'About' },
        ],
    },
};

// Submenu component
const SubMenu = ({ items, onItemClick }) => {
    const [hoveredSubmenu, setHoveredSubmenu] = useState(null);

    return (
        <div 
            className="absolute left-full top-0 -mt-[4px] ml-0 min-w-[220px] bg-[#252526] border border-[#454545] rounded-[5px] shadow-[0_2px_8px_rgba(0,0,0,0.35)] py-[4px] z-[100]"
        >
            {items.map((item, index) => {
                if (item.type === 'separator') {
                    return <div key={index} className="h-[1px] bg-[#454545] my-[4px] mx-[10px]" />;
                }

                const hasSubmenu = Array.isArray(item.submenu);

                return (
                    <div 
                        key={item.id} 
                        className="relative"
                        onMouseEnter={() => hasSubmenu && setHoveredSubmenu(item.id)}
                        onMouseLeave={() => hasSubmenu && setHoveredSubmenu(null)}
                    >
                        <button
                            className={clsx(
                                'w-full h-[22px] px-[10px] flex items-center text-[13px] leading-[22px]',
                                'text-[#cccccc] hover:bg-[#094771] hover:text-white',
                                item.disabled && 'opacity-40 pointer-events-none'
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!item.disabled && !hasSubmenu) {
                                    onItemClick(item.id);
                                }
                            }}
                            disabled={item.disabled}
                        >
                            <span className="w-[20px] flex items-center justify-center mr-[4px]">
                                {item.checkable && item.checked && <Check className="w-[14px] h-[14px]" />}
                            </span>
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.shortcut && (
                                <span className="ml-[20px] text-[#858585] text-[12px]">{item.shortcut}</span>
                            )}
                            {hasSubmenu && (
                                <ChevronRight className="w-[14px] h-[14px] ml-[10px] text-[#858585]" />
                            )}
                        </button>
                        {hasSubmenu && hoveredSubmenu === item.id && (
                            <SubMenu items={item.submenu} onItemClick={onItemClick} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// Main dropdown menu component
const DropdownMenu = ({ items, isOpen, onItemClick }) => {
    const [hoveredSubmenu, setHoveredSubmenu] = useState(null);

    if (!isOpen) return null;

    return (
        <div 
            className="absolute top-full left-0 min-w-[220px] bg-[#252526] border border-[#454545] rounded-[5px] shadow-[0_2px_8px_rgba(0,0,0,0.35)] py-[4px] z-50"
            onClick={(e) => e.stopPropagation()}
        >
            {items.map((item, index) => {
                if (item.type === 'separator') {
                    return <div key={index} className="h-[1px] bg-[#454545] my-[4px] mx-[10px]" />;
                }

                const hasSubmenu = Array.isArray(item.submenu);

                return (
                    <div 
                        key={item.id} 
                        className="relative"
                        onMouseEnter={() => hasSubmenu && setHoveredSubmenu(item.id)}
                        onMouseLeave={() => hasSubmenu && setHoveredSubmenu(null)}
                    >
                        <button
                            className={clsx(
                                'w-full h-[22px] px-[10px] flex items-center text-[13px] leading-[22px]',
                                'text-[#cccccc] hover:bg-[#094771] hover:text-white',
                                item.disabled && 'opacity-40 pointer-events-none'
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!item.disabled && !hasSubmenu) {
                                    onItemClick(item.id);
                                }
                            }}
                            disabled={item.disabled}
                        >
                            <span className="w-[20px] flex items-center justify-center mr-[4px]">
                                {item.checkable && item.checked && <Check className="w-[14px] h-[14px]" />}
                            </span>
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.shortcut && (
                                <span className="ml-[20px] text-[#858585] text-[12px]">{item.shortcut}</span>
                            )}
                            {hasSubmenu && (
                                <ChevronRight className="w-[14px] h-[14px] ml-[10px] text-[#858585]" />
                            )}
                        </button>
                        {hasSubmenu && hoveredSubmenu === item.id && (
                            <SubMenu items={item.submenu} onItemClick={onItemClick} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// Main MenuBar component
const MenuBar = ({
    onCommand,
    onQuickOpen,
    onGlobalSearch,
    onSettings,
    onTheme,
    onTerminal,
    projectName = 'Collaborative-Code-Editor',
}) => {
    const [activeMenu, setActiveMenu] = useState(null);
    const [menuBarActive, setMenuBarActive] = useState(false);
    const menuBarRef = useRef(null);

    // Handle menu button click
    const handleMenuClick = useCallback((menuKey) => {
        if (activeMenu === menuKey) {
            setActiveMenu(null);
            setMenuBarActive(false);
        } else {
            setActiveMenu(menuKey);
            setMenuBarActive(true);
        }
    }, [activeMenu]);

    // Handle hover when menu bar is active (VS Code behavior)
    const handleMenuHover = useCallback((menuKey) => {
        if (menuBarActive) {
            setActiveMenu(menuKey);
        }
    }, [menuBarActive]);

    // Close menus
    const handleClose = useCallback(() => {
        setActiveMenu(null);
        setMenuBarActive(false);
    }, []);

    // Handle menu item click
    const handleItemClick = useCallback((commandId) => {
        console.log('Menu command:', commandId);
        
        // Route to specific handlers
        switch (commandId) {
            case 'go.goToFile':
                onQuickOpen?.();
                break;
            case 'edit.findInFiles':
            case 'view.search':
                onGlobalSearch?.();
                break;
            case 'file.preferences.settings':
                onSettings?.();
                break;
            case 'file.preferences.themes':
                onTheme?.();
                break;
            case 'view.terminal':
            case 'terminal.new':
                onTerminal?.();
                break;
            case 'view.commandPalette':
            case 'help.showAllCommands':
                onCommand?.('view.commandPalette');
                break;
            default:
                onCommand?.(commandId);
        }
        handleClose();
    }, [onCommand, onQuickOpen, onGlobalSearch, onSettings, onTheme, onTerminal, handleClose]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuBarRef.current && !menuBarRef.current.contains(e.target)) {
                handleClose();
            }
        };

        if (menuBarActive) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [menuBarActive, handleClose]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleClose]);

    // Arrow key navigation when menu is active
    useEffect(() => {
        if (!menuBarActive || !activeMenu) return;

        const menuKeys = Object.keys(menuDefinitions);
        const currentIndex = menuKeys.indexOf(activeMenu);

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const newIndex = currentIndex > 0 ? currentIndex - 1 : menuKeys.length - 1;
                setActiveMenu(menuKeys[newIndex]);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const newIndex = currentIndex < menuKeys.length - 1 ? currentIndex + 1 : 0;
                setActiveMenu(menuKeys[newIndex]);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [menuBarActive, activeMenu]);

    return (
        <div 
            ref={menuBarRef}
            className="h-[30px] bg-[#3c3c3c] flex items-center select-none text-[13px]"
        >
            {/* VS Code Application Icon */}
            <button 
                className="w-[35px] h-full flex items-center justify-center hover:bg-[#505050] focus:outline-none"
                onClick={() => handleMenuClick('file')}
            >
                <svg width="16" height="16" viewBox="0 0 100 100" fill="none">
                    <path d="M95 18.9L74.4 0 26.4 47.6 9.2 35.2 0 40v20.5l9.2 4.8 17.2-12.5L74.4 100 95 81.1V18.9z" fill="#007ACC"/>
                    <path d="M74.4 100L26.4 52.5l-17.2 12.4L0 60.1V40l9.2-4.8 17.2 12.5L74.4 0l20.6 18.9v62.2z" fill="#1F9CF0"/>
                </svg>
            </button>

            {/* Menu Items */}
            <div className="flex items-center h-full">
                {Object.entries(menuDefinitions).map(([key, menu]) => (
                    <div key={key} className="relative h-full">
                        <button
                            className={clsx(
                                'h-full px-[8px] text-[#cccccc] focus:outline-none transition-colors',
                                activeMenu === key 
                                    ? 'bg-[#505050]' 
                                    : 'hover:bg-[#505050]'
                            )}
                            onClick={() => handleMenuClick(key)}
                            onMouseEnter={() => handleMenuHover(key)}
                        >
                            {menu.label}
                        </button>
                        <DropdownMenu
                            items={menu.items}
                            isOpen={activeMenu === key}
                            onItemClick={handleItemClick}
                        />
                    </div>
                ))}
            </div>

            {/* Center - Search/Project Name (like VS Code's title) */}
            <div className="flex-1 flex items-center justify-center">
                <button
                    onClick={onQuickOpen}
                    className="flex items-center gap-[8px] px-[12px] py-[3px] bg-[#3c3c3c] hover:bg-[#505050] 
                             border border-[#5a5a5a] rounded-[6px] text-[12px] text-[#cccccc] 
                             min-w-[320px] max-w-[600px] justify-center transition-colors focus:outline-none
                             focus:border-[#007acc]"
                >
                    <Search className="w-[14px] h-[14px] text-[#858585]" />
                    <span className="text-[#858585]">{projectName}</span>
                    <span className="text-[#858585] text-[11px] ml-[8px] opacity-70">Ctrl+P</span>
                </button>
            </div>

            {/* Right side - Window controls (just visual on web) */}
            <div className="flex items-center h-full">
                {/* Customize Layout */}
                <button 
                    className="w-[46px] h-full flex items-center justify-center text-[#cccccc] hover:bg-[#505050] focus:outline-none"
                    title="Customize Layout"
                >
                    <svg className="w-[16px] h-[16px]" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2 2h4v4H2V2zm0 6h4v4H2V8zm6-6h4v4H8V2zm6 0h4v4h-4V2zm-6 6h4v4H8V8zm6 0h4v4h-4V8z" fillOpacity="0.8"/>
                    </svg>
                </button>

                {/* Minimize */}
                <button 
                    className="w-[46px] h-full flex items-center justify-center text-[#cccccc] hover:bg-[#505050] focus:outline-none"
                    title="Minimize"
                >
                    <svg className="w-[16px] h-[16px]" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M14 8v1H3V8h11z"/>
                    </svg>
                </button>

                {/* Maximize */}
                <button 
                    className="w-[46px] h-full flex items-center justify-center text-[#cccccc] hover:bg-[#505050] focus:outline-none"
                    title="Maximize"
                >
                    <svg className="w-[16px] h-[16px]" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3 3v10h10V3H3zm9 9H4V4h8v8z"/>
                    </svg>
                </button>

                {/* Close */}
                <button 
                    className="w-[46px] h-full flex items-center justify-center text-[#cccccc] hover:bg-[#e81123] focus:outline-none"
                    title="Close"
                >
                    <svg className="w-[16px] h-[16px]" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M7.116 8l-4.558 4.558.884.884L8 8.884l4.558 4.558.884-.884L8.884 8l4.558-4.558-.884-.884L8 7.116 3.442 2.558l-.884.884L7.116 8z"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default MenuBar;
