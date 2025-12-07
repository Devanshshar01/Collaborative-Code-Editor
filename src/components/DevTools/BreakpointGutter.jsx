/**
 * BreakpointGutter - Gutter component for breakpoint markers in code editor
 * Provides clickable gutter for adding/removing breakpoints with visual indicators
 */

import React, { useCallback, useMemo, memo, useState, useRef, useEffect } from 'react';
import useDebuggerStore, {
    BreakpointState,
    BreakpointType,
} from '../../stores/debuggerStore';

// ============ Breakpoint Icon Component ============

const BreakpointIcon = memo(({ breakpoint, size = 14 }) => {
    if (!breakpoint) {
        return null;
    }
    
    const { state, type, verified } = breakpoint;
    
    // Disabled breakpoint
    if (state === BreakpointState.DISABLED) {
        return (
            <svg width={size} height={size} viewBox="0 0 16 16">
                <circle
                    cx="8"
                    cy="8"
                    r="5"
                    fill="none"
                    stroke="#808080"
                    strokeWidth="2"
                />
            </svg>
        );
    }
    
    // Unverified breakpoint
    if (!verified) {
        return (
            <svg width={size} height={size} viewBox="0 0 16 16">
                <circle
                    cx="8"
                    cy="8"
                    r="5"
                    fill="#808080"
                    opacity="0.5"
                />
            </svg>
        );
    }
    
    // Logpoint
    if (type === BreakpointType.LOGPOINT) {
        return (
            <svg width={size} height={size} viewBox="0 0 16 16">
                <path
                    d="M2 8L5 11L14 2"
                    stroke="#e51400"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }
    
    // Conditional breakpoint
    if (type === BreakpointType.CONDITIONAL) {
        return (
            <svg width={size} height={size} viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="6" fill="#e51400" />
                <text
                    x="8"
                    y="11"
                    fontSize="8"
                    fill="white"
                    textAnchor="middle"
                    fontWeight="bold"
                >
                    ?
                </text>
            </svg>
        );
    }
    
    // Function breakpoint
    if (type === BreakpointType.FUNCTION) {
        return (
            <svg width={size} height={size} viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="6" fill="#e51400" />
                <text
                    x="8"
                    y="11"
                    fontSize="7"
                    fill="white"
                    textAnchor="middle"
                    fontFamily="monospace"
                >
                    ƒ
                </text>
            </svg>
        );
    }
    
    // Normal breakpoint
    return (
        <svg width={size} height={size} viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" fill="#e51400" />
        </svg>
    );
});

BreakpointIcon.displayName = 'BreakpointIcon';

// ============ Gutter Line Component ============

const GutterLine = memo(({ 
    lineNumber, 
    breakpoint, 
    isCurrentLine,
    isHovered,
    onClick,
    onContextMenu,
    onMouseEnter,
    onMouseLeave,
}) => {
    const hasBreakpoint = !!breakpoint;
    
    return (
        <div
            className={`gutter-line ${isCurrentLine ? 'current-line' : ''} ${isHovered ? 'hovered' : ''}`}
            onClick={() => onClick(lineNumber)}
            onContextMenu={(e) => onContextMenu(e, lineNumber)}
            onMouseEnter={() => onMouseEnter(lineNumber)}
            onMouseLeave={onMouseLeave}
        >
            {/* Line number */}
            <span className="gutter-line-number">{lineNumber}</span>
            
            {/* Breakpoint indicator area */}
            <span className="gutter-breakpoint-area">
                {hasBreakpoint ? (
                    <BreakpointIcon breakpoint={breakpoint} />
                ) : isHovered ? (
                    <svg width="14" height="14" viewBox="0 0 16 16" className="gutter-hover-indicator">
                        <circle cx="8" cy="8" r="5" fill="#e51400" opacity="0.3" />
                    </svg>
                ) : null}
            </span>
            
            {/* Current line indicator (arrow) */}
            {isCurrentLine && (
                <span className="gutter-current-indicator">
                    <svg width="12" height="12" viewBox="0 0 16 16">
                        <path d="M4 3L12 8L4 13V3Z" fill="#ffcc00" />
                    </svg>
                </span>
            )}
        </div>
    );
});

GutterLine.displayName = 'GutterLine';

// ============ Context Menu Component ============

const BreakpointContextMenu = memo(({ 
    x, 
    y, 
    lineNumber, 
    breakpoint, 
    onClose,
    onAddBreakpoint,
    onRemoveBreakpoint,
    onEditBreakpoint,
    onAddConditional,
    onAddLogpoint,
    onEnableBreakpoint,
    onDisableBreakpoint,
}) => {
    const menuRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);
    
    const hasBreakpoint = !!breakpoint;
    const isEnabled = breakpoint?.state === BreakpointState.ENABLED;
    
    return (
        <div
            ref={menuRef}
            className="breakpoint-context-menu"
            style={{ left: x, top: y }}
        >
            {hasBreakpoint ? (
                <>
                    <button 
                        className="context-menu-item"
                        onClick={() => {
                            onRemoveBreakpoint(lineNumber);
                            onClose();
                        }}
                    >
                        Remove Breakpoint
                    </button>
                    
                    <button 
                        className="context-menu-item"
                        onClick={() => {
                            isEnabled 
                                ? onDisableBreakpoint(breakpoint.id) 
                                : onEnableBreakpoint(breakpoint.id);
                            onClose();
                        }}
                    >
                        {isEnabled ? 'Disable Breakpoint' : 'Enable Breakpoint'}
                    </button>
                    
                    <div className="context-menu-separator" />
                    
                    <button 
                        className="context-menu-item"
                        onClick={() => {
                            onEditBreakpoint(breakpoint, 'condition');
                            onClose();
                        }}
                    >
                        Edit Condition...
                    </button>
                    
                    <button 
                        className="context-menu-item"
                        onClick={() => {
                            onEditBreakpoint(breakpoint, 'hitCount');
                            onClose();
                        }}
                    >
                        Edit Hit Count...
                    </button>
                    
                    <button 
                        className="context-menu-item"
                        onClick={() => {
                            onEditBreakpoint(breakpoint, 'logMessage');
                            onClose();
                        }}
                    >
                        Edit Log Message...
                    </button>
                </>
            ) : (
                <>
                    <button 
                        className="context-menu-item"
                        onClick={() => {
                            onAddBreakpoint(lineNumber);
                            onClose();
                        }}
                    >
                        Add Breakpoint
                    </button>
                    
                    <button 
                        className="context-menu-item"
                        onClick={() => {
                            onAddConditional(lineNumber);
                            onClose();
                        }}
                    >
                        Add Conditional Breakpoint...
                    </button>
                    
                    <button 
                        className="context-menu-item"
                        onClick={() => {
                            onAddLogpoint(lineNumber);
                            onClose();
                        }}
                    >
                        Add Logpoint...
                    </button>
                </>
            )}
        </div>
    );
});

BreakpointContextMenu.displayName = 'BreakpointContextMenu';

// ============ Breakpoint Edit Dialog ============

const BreakpointEditDialog = memo(({ 
    breakpoint, 
    editType, 
    onSave, 
    onClose 
}) => {
    const [value, setValue] = useState(() => {
        switch (editType) {
            case 'condition': return breakpoint?.condition || '';
            case 'hitCount': return breakpoint?.hitCondition || '';
            case 'logMessage': return breakpoint?.logMessage || '';
            default: return '';
        }
    });
    
    const dialogRef = useRef(null);
    const inputRef = useRef(null);
    
    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(breakpoint?.id, editType, value);
        onClose();
    };
    
    const getLabel = () => {
        switch (editType) {
            case 'condition': return 'Expression to evaluate (break when true):';
            case 'hitCount': return 'Break when hit count condition is true:';
            case 'logMessage': return 'Log message (expressions in {}):';
            default: return 'Value:';
        }
    };
    
    const getPlaceholder = () => {
        switch (editType) {
            case 'condition': return 'e.g., x > 5 && y === "test"';
            case 'hitCount': return 'e.g., >= 10, % 2 == 0';
            case 'logMessage': return 'e.g., Value of x: {x}, y: {y}';
            default: return '';
        }
    };
    
    return (
        <div className="breakpoint-edit-overlay" onClick={onClose}>
            <div 
                ref={dialogRef}
                className="breakpoint-edit-dialog"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <label className="edit-dialog-label">
                        {getLabel()}
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        className="edit-dialog-input"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={getPlaceholder()}
                    />
                    <div className="edit-dialog-actions">
                        <button type="button" className="edit-dialog-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="edit-dialog-btn primary">
                            OK
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

BreakpointEditDialog.displayName = 'BreakpointEditDialog';

// ============ Main BreakpointGutter Component ============

const BreakpointGutter = ({ 
    filePath,
    lineCount,
    currentLine = null,
    scrollTop = 0,
    lineHeight = 20,
    visibleLines = null,
    onBreakpointChange,
}) => {
    const [hoveredLine, setHoveredLine] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [editDialog, setEditDialog] = useState(null);
    
    const {
        breakpoints,
        addBreakpoint,
        removeBreakpoint,
        toggleBreakpoint,
        enableBreakpoint,
        disableBreakpoint,
        updateBreakpoint,
        getBreakpointsForFile,
    } = useDebuggerStore();
    
    // Get breakpoints for current file
    const fileBreakpoints = useMemo(() => {
        return breakpoints.filter(bp => bp.filePath === filePath);
    }, [breakpoints, filePath]);
    
    // Create lookup map for quick access
    const breakpointMap = useMemo(() => {
        const map = new Map();
        fileBreakpoints.forEach(bp => {
            map.set(bp.line, bp);
        });
        return map;
    }, [fileBreakpoints]);
    
    // Calculate visible line range
    const visibleRange = useMemo(() => {
        if (visibleLines) return visibleLines;
        
        const startLine = Math.floor(scrollTop / lineHeight) + 1;
        const visibleCount = Math.ceil(window.innerHeight / lineHeight) + 2;
        const endLine = Math.min(startLine + visibleCount, lineCount);
        
        return { start: startLine, end: endLine };
    }, [scrollTop, lineHeight, lineCount, visibleLines]);
    
    // Handle click on gutter line
    const handleClick = useCallback((lineNumber) => {
        toggleBreakpoint(filePath, lineNumber);
        onBreakpointChange?.(filePath, lineNumber);
    }, [filePath, toggleBreakpoint, onBreakpointChange]);
    
    // Handle context menu
    const handleContextMenu = useCallback((e, lineNumber) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            lineNumber,
            breakpoint: breakpointMap.get(lineNumber),
        });
    }, [breakpointMap]);
    
    // Add breakpoint
    const handleAddBreakpoint = useCallback((lineNumber) => {
        addBreakpoint(filePath, lineNumber);
        onBreakpointChange?.(filePath, lineNumber);
    }, [filePath, addBreakpoint, onBreakpointChange]);
    
    // Remove breakpoint
    const handleRemoveBreakpoint = useCallback((lineNumber) => {
        const bp = breakpointMap.get(lineNumber);
        if (bp) {
            removeBreakpoint(bp.id);
            onBreakpointChange?.(filePath, lineNumber);
        }
    }, [breakpointMap, removeBreakpoint, filePath, onBreakpointChange]);
    
    // Add conditional breakpoint
    const handleAddConditional = useCallback((lineNumber) => {
        setEditDialog({
            breakpoint: { line: lineNumber },
            editType: 'condition',
            isNew: true,
        });
    }, []);
    
    // Add logpoint
    const handleAddLogpoint = useCallback((lineNumber) => {
        setEditDialog({
            breakpoint: { line: lineNumber },
            editType: 'logMessage',
            isNew: true,
        });
    }, []);
    
    // Edit breakpoint
    const handleEditBreakpoint = useCallback((breakpoint, editType) => {
        setEditDialog({
            breakpoint,
            editType,
            isNew: false,
        });
    }, []);
    
    // Save breakpoint edit
    const handleSaveEdit = useCallback((id, editType, value) => {
        if (editDialog?.isNew) {
            const type = editType === 'logMessage' 
                ? BreakpointType.LOGPOINT 
                : editType === 'condition' 
                    ? BreakpointType.CONDITIONAL 
                    : BreakpointType.LINE;
            
            addBreakpoint(filePath, editDialog.breakpoint.line, {
                type,
                condition: editType === 'condition' ? value : null,
                logMessage: editType === 'logMessage' ? value : null,
                hitCondition: editType === 'hitCount' ? value : null,
            });
        } else if (id) {
            const updates = {};
            if (editType === 'condition') updates.condition = value;
            if (editType === 'hitCount') updates.hitCondition = value;
            if (editType === 'logMessage') updates.logMessage = value;
            
            updateBreakpoint(id, updates);
        }
    }, [editDialog, filePath, addBreakpoint, updateBreakpoint]);
    
    // Generate lines array
    const lines = useMemo(() => {
        const result = [];
        for (let i = visibleRange.start; i <= visibleRange.end; i++) {
            result.push(i);
        }
        return result;
    }, [visibleRange]);
    
    return (
        <div className="breakpoint-gutter">
            {/* Gutter lines */}
            <div 
                className="gutter-lines"
                style={{ 
                    transform: `translateY(${-(scrollTop % lineHeight)}px)`,
                    marginTop: (visibleRange.start - 1) * lineHeight,
                }}
            >
                {lines.map(lineNumber => (
                    <GutterLine
                        key={lineNumber}
                        lineNumber={lineNumber}
                        breakpoint={breakpointMap.get(lineNumber)}
                        isCurrentLine={lineNumber === currentLine}
                        isHovered={lineNumber === hoveredLine}
                        onClick={handleClick}
                        onContextMenu={handleContextMenu}
                        onMouseEnter={setHoveredLine}
                        onMouseLeave={() => setHoveredLine(null)}
                    />
                ))}
            </div>
            
            {/* Context menu */}
            {contextMenu && (
                <BreakpointContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    lineNumber={contextMenu.lineNumber}
                    breakpoint={contextMenu.breakpoint}
                    onClose={() => setContextMenu(null)}
                    onAddBreakpoint={handleAddBreakpoint}
                    onRemoveBreakpoint={handleRemoveBreakpoint}
                    onEditBreakpoint={handleEditBreakpoint}
                    onAddConditional={handleAddConditional}
                    onAddLogpoint={handleAddLogpoint}
                    onEnableBreakpoint={enableBreakpoint}
                    onDisableBreakpoint={disableBreakpoint}
                />
            )}
            
            {/* Edit dialog */}
            {editDialog && (
                <BreakpointEditDialog
                    breakpoint={editDialog.breakpoint}
                    editType={editDialog.editType}
                    onSave={handleSaveEdit}
                    onClose={() => setEditDialog(null)}
                />
            )}
            
            {/* Styles */}
            <style>{`
                .breakpoint-gutter {
                    position: relative;
                    width: 60px;
                    min-width: 60px;
                    background: #1e1e1e;
                    border-right: 1px solid #3c3c3c;
                    user-select: none;
                    overflow: hidden;
                }
                
                .gutter-lines {
                    position: absolute;
                    width: 100%;
                }
                
                .gutter-line {
                    display: flex;
                    align-items: center;
                    height: ${lineHeight}px;
                    padding: 0 4px;
                    cursor: pointer;
                }
                
                .gutter-line:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .gutter-line.current-line {
                    background: rgba(255, 204, 0, 0.1);
                }
                
                .gutter-line-number {
                    flex: 1;
                    color: #858585;
                    font-size: 12px;
                    font-family: 'Consolas', 'Monaco', monospace;
                    text-align: right;
                    padding-right: 8px;
                }
                
                .gutter-line.current-line .gutter-line-number {
                    color: #c6c6c6;
                }
                
                .gutter-breakpoint-area {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 16px;
                    height: 16px;
                }
                
                .gutter-hover-indicator {
                    opacity: 0;
                    transition: opacity 0.15s;
                }
                
                .gutter-line.hovered .gutter-hover-indicator {
                    opacity: 1;
                }
                
                .gutter-current-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 14px;
                    height: 14px;
                    margin-left: 2px;
                }
                
                /* Context Menu */
                .breakpoint-context-menu {
                    position: fixed;
                    background: #252526;
                    border: 1px solid #454545;
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                    z-index: 10000;
                    min-width: 180px;
                    padding: 4px 0;
                }
                
                .context-menu-item {
                    display: block;
                    width: 100%;
                    padding: 6px 12px;
                    background: transparent;
                    border: none;
                    color: #cccccc;
                    font-size: 12px;
                    text-align: left;
                    cursor: pointer;
                }
                
                .context-menu-item:hover {
                    background: #094771;
                    color: #ffffff;
                }
                
                .context-menu-separator {
                    height: 1px;
                    background: #454545;
                    margin: 4px 0;
                }
                
                /* Edit Dialog */
                .breakpoint-edit-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10001;
                }
                
                .breakpoint-edit-dialog {
                    background: #252526;
                    border: 1px solid #454545;
                    border-radius: 6px;
                    padding: 16px;
                    min-width: 400px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                }
                
                .edit-dialog-label {
                    display: block;
                    color: #cccccc;
                    font-size: 12px;
                    margin-bottom: 8px;
                }
                
                .edit-dialog-input {
                    width: 100%;
                    padding: 8px 10px;
                    background: #3c3c3c;
                    border: 1px solid #5c5c5c;
                    border-radius: 4px;
                    color: #cccccc;
                    font-family: 'Consolas', 'Monaco', monospace;
                    font-size: 13px;
                    outline: none;
                }
                
                .edit-dialog-input:focus {
                    border-color: #007acc;
                }
                
                .edit-dialog-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    margin-top: 16px;
                }
                
                .edit-dialog-btn {
                    padding: 6px 16px;
                    background: #3c3c3c;
                    border: 1px solid #5c5c5c;
                    border-radius: 4px;
                    color: #cccccc;
                    font-size: 12px;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                
                .edit-dialog-btn:hover {
                    background: #454545;
                }
                
                .edit-dialog-btn.primary {
                    background: #0e639c;
                    border-color: #0e639c;
                }
                
                .edit-dialog-btn.primary:hover {
                    background: #1177bb;
                }
            `}</style>
        </div>
    );
};

export default BreakpointGutter;
