/**
 * Debug Panel Component
 * Full debugging interface with breakpoints, call stack, variables, watch expressions
 */

import React, { useState, useCallback } from 'react';
import {
    Play,
    Pause,
    Square,
    SkipForward,
    ArrowDown,
    ArrowUp,
    RefreshCw,
    Circle,
    CircleDot,
    ChevronRight,
    ChevronDown,
    Eye,
    Plus,
    X,
    Trash2,
    Layers,
    Variable,
} from 'lucide-react';
import clsx from 'clsx';

// Toolbar Component
const DebugToolbar = ({ state, onStart, onPause, onContinue, onStop, onStepOver, onStepInto, onStepOut, onRestart }) => {
    const isRunning = state === 'running';
    const isPaused = state === 'paused';
    const isIdle = state === 'idle' || state === 'stopped';

    return (
        <div className="flex items-center gap-1 px-2 py-1 bg-[#3c3c3c] border-b border-[#333]">
            {isIdle ? (
                <button
                    onClick={onStart}
                    className="p-1.5 rounded hover:bg-[#4c4c4c] text-green-400"
                    title="Start Debugging (F5)"
                >
                    <Play className="w-4 h-4" />
                </button>
            ) : (
                <>
                    {isRunning ? (
                        <button
                            onClick={onPause}
                            className="p-1.5 rounded hover:bg-[#4c4c4c] text-yellow-400"
                            title="Pause (F6)"
                        >
                            <Pause className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={onContinue}
                            className="p-1.5 rounded hover:bg-[#4c4c4c] text-green-400"
                            title="Continue (F5)"
                        >
                            <Play className="w-4 h-4" />
                        </button>
                    )}
                </>
            )}
            
            <button
                onClick={onStop}
                disabled={isIdle}
                className={clsx(
                    'p-1.5 rounded',
                    isIdle ? 'text-[#555] cursor-not-allowed' : 'hover:bg-[#4c4c4c] text-red-400'
                )}
                title="Stop (Shift+F5)"
            >
                <Square className="w-4 h-4" />
            </button>
            
            <button
                onClick={onRestart}
                disabled={isIdle}
                className={clsx(
                    'p-1.5 rounded',
                    isIdle ? 'text-[#555] cursor-not-allowed' : 'hover:bg-[#4c4c4c] text-blue-400'
                )}
                title="Restart (Ctrl+Shift+F5)"
            >
                <RefreshCw className="w-4 h-4" />
            </button>
            
            <div className="w-px h-4 bg-[#555] mx-1" />
            
            <button
                onClick={onStepOver}
                disabled={!isPaused}
                className={clsx(
                    'p-1.5 rounded',
                    !isPaused ? 'text-[#555] cursor-not-allowed' : 'hover:bg-[#4c4c4c] text-[#cccccc]'
                )}
                title="Step Over (F10)"
            >
                <SkipForward className="w-4 h-4" />
            </button>
            
            <button
                onClick={onStepInto}
                disabled={!isPaused}
                className={clsx(
                    'p-1.5 rounded',
                    !isPaused ? 'text-[#555] cursor-not-allowed' : 'hover:bg-[#4c4c4c] text-[#cccccc]'
                )}
                title="Step Into (F11)"
            >
                <ArrowDown className="w-4 h-4" />
            </button>
            
            <button
                onClick={onStepOut}
                disabled={!isPaused}
                className={clsx(
                    'p-1.5 rounded',
                    !isPaused ? 'text-[#555] cursor-not-allowed' : 'hover:bg-[#4c4c4c] text-[#cccccc]'
                )}
                title="Step Out (Shift+F11)"
            >
                <ArrowUp className="w-4 h-4" />
            </button>
            
            <div className="flex-1" />
            
            <span className={clsx(
                'text-xs px-2 py-0.5 rounded',
                state === 'running' && 'bg-green-500/20 text-green-400',
                state === 'paused' && 'bg-yellow-500/20 text-yellow-400',
                (state === 'idle' || state === 'stopped') && 'bg-gray-500/20 text-gray-400'
            )}>
                {state.charAt(0).toUpperCase() + state.slice(1)}
            </span>
        </div>
    );
};

// Collapsible Section Component
const Section = ({ title, icon, defaultOpen = true, badge, actions, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-[#333]">
            <div
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-[#2a2d2e] select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-[#858585]" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-[#858585]" />
                )}
                {icon}
                <span className="text-xs font-medium text-[#cccccc] uppercase tracking-wide">
                    {title}
                </span>
                {badge !== undefined && badge > 0 && (
                    <span className="text-xs bg-[#4c4c4c] text-[#cccccc] px-1.5 py-0.5 rounded-full">
                        {badge}
                    </span>
                )}
                <div className="flex-1" />
                {actions && (
                    <div onClick={(e) => e.stopPropagation()}>
                        {actions}
                    </div>
                )}
            </div>
            {isOpen && <div className="pb-2">{children}</div>}
        </div>
    );
};

// Variable Tree Component
const VariableTree = ({ variables, depth = 0, onExpand }) => {
    if (!variables || variables.length === 0) {
        return (
            <div className="px-4 py-2 text-xs text-[#858585] italic">
                No variables
            </div>
        );
    }

    return (
        <div style={{ paddingLeft: depth * 12 }}>
            {variables.map((variable, index) => {
                const hasChildren = variable.variablesReference > 0;
                
                return (
                    <div key={`${variable.name}-${index}`}>
                        <div
                            className={clsx(
                                'flex items-center gap-1 px-2 py-0.5 text-xs hover:bg-[#2a2d2e]',
                                hasChildren && 'cursor-pointer'
                            )}
                            onClick={() => hasChildren && onExpand?.(variable)}
                        >
                            {hasChildren ? (
                                variable.expanded ? (
                                    <ChevronDown className="w-3 h-3 text-[#858585]" />
                                ) : (
                                    <ChevronRight className="w-3 h-3 text-[#858585]" />
                                )
                            ) : (
                                <span className="w-3" />
                            )}
                            <span className="text-blue-400">{variable.name}</span>
                            <span className="text-[#858585]">=</span>
                            <span className="text-[#ce9178] truncate">{variable.value}</span>
                            {variable.type && (
                                <span className="text-[#4ec9b0] text-[10px] ml-auto">
                                    {variable.type}
                                </span>
                            )}
                        </div>
                        {variable.expanded && variable.children && (
                            <VariableTree
                                variables={variable.children}
                                depth={depth + 1}
                                onExpand={onExpand}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// Main Debug Panel Component
export const DebugPanel = ({
    state,
    breakpoints,
    callStack,
    variables,
    watchExpressions,
    currentFrame,
    onStart,
    onPause,
    onContinue,
    onStop,
    onStepOver,
    onStepInto,
    onStepOut,
    onRestart,
    onToggleBreakpoint,
    onRemoveBreakpoint,
    onAddBreakpoint,
    onFrameSelect,
    onVariableExpand,
    onAddWatch,
    onRemoveWatch,
    className,
}) => {
    const [newWatchExpression, setNewWatchExpression] = useState('');

    const handleAddWatch = useCallback(() => {
        if (newWatchExpression.trim()) {
            onAddWatch?.(newWatchExpression.trim());
            setNewWatchExpression('');
        }
    }, [newWatchExpression, onAddWatch]);

    return (
        <div className={clsx('flex flex-col bg-[#1e1e1e] border-l border-[#333]', className)}>
            {/* Toolbar */}
            <DebugToolbar
                state={state}
                onStart={onStart}
                onPause={onPause}
                onContinue={onContinue}
                onStop={onStop}
                onStepOver={onStepOver}
                onStepInto={onStepInto}
                onStepOut={onStepOut}
                onRestart={onRestart}
            />

            {/* Sections */}
            <div className="flex-1 overflow-auto">
                {/* Variables Section */}
                <Section
                    title="Variables"
                    icon={<Variable className="w-3.5 h-3.5 text-purple-400" />}
                    defaultOpen
                >
                    <div className="text-xs text-[#858585] px-2 py-1 bg-[#252526]">Local</div>
                    <VariableTree variables={variables.local} onExpand={onVariableExpand} />
                    <div className="text-xs text-[#858585] px-2 py-1 bg-[#252526] mt-2">Global</div>
                    <VariableTree variables={variables.global} onExpand={onVariableExpand} />
                </Section>

                {/* Watch Section */}
                <Section
                    title="Watch"
                    icon={<Eye className="w-3.5 h-3.5 text-yellow-400" />}
                    badge={watchExpressions.length}
                    actions={
                        <button
                            onClick={onAddBreakpoint}
                            className="p-0.5 hover:bg-[#4c4c4c] rounded"
                        >
                            <Plus className="w-3.5 h-3.5 text-[#858585]" />
                        </button>
                    }
                >
                    <div className="space-y-1">
                        {watchExpressions.map((watch) => (
                            <div
                                key={watch.id}
                                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-[#2a2d2e] group"
                            >
                                <span className="text-blue-400">{watch.expression}</span>
                                <span className="text-[#858585]">=</span>
                                {watch.error ? (
                                    <span className="text-red-400">{watch.error}</span>
                                ) : (
                                    <span className="text-[#ce9178]">{watch.value ?? 'undefined'}</span>
                                )}
                                <button
                                    onClick={() => onRemoveWatch?.(watch)}
                                    className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#4c4c4c] rounded"
                                >
                                    <X className="w-3 h-3 text-[#858585]" />
                                </button>
                            </div>
                        ))}
                        <div className="flex items-center gap-1 px-2">
                            <input
                                type="text"
                                value={newWatchExpression}
                                onChange={(e) => setNewWatchExpression(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddWatch()}
                                placeholder="Add expression..."
                                className="flex-1 bg-transparent text-xs text-[#cccccc] outline-none placeholder:text-[#555]"
                            />
                            <button
                                onClick={handleAddWatch}
                                className="p-0.5 hover:bg-[#4c4c4c] rounded"
                            >
                                <Plus className="w-3.5 h-3.5 text-[#858585]" />
                            </button>
                        </div>
                    </div>
                </Section>

                {/* Call Stack Section */}
                <Section
                    title="Call Stack"
                    icon={<Layers className="w-3.5 h-3.5 text-blue-400" />}
                    badge={callStack.length}
                >
                    {callStack.length === 0 ? (
                        <div className="px-4 py-2 text-xs text-[#858585] italic">
                            Not paused
                        </div>
                    ) : (
                        callStack.map((frame, index) => (
                            <div
                                key={frame.id}
                                className={clsx(
                                    'flex items-center gap-2 px-2 py-1 text-xs cursor-pointer hover:bg-[#2a2d2e]',
                                    currentFrame === frame.id && 'bg-[#094771]'
                                )}
                                onClick={() => onFrameSelect?.(frame)}
                            >
                                {index === 0 && (
                                    <ChevronRight className="w-3 h-3 text-yellow-400" />
                                )}
                                <span className="text-yellow-400">{frame.name}</span>
                                <span className="text-[#858585]">
                                    {frame.source?.name}:{frame.line}
                                </span>
                            </div>
                        ))
                    )}
                </Section>

                {/* Breakpoints Section */}
                <Section
                    title="Breakpoints"
                    icon={<CircleDot className="w-3.5 h-3.5 text-red-400" />}
                    badge={breakpoints.length}
                    actions={
                        <div className="flex items-center gap-1">
                            <button
                                onClick={onAddBreakpoint}
                                className="p-0.5 hover:bg-[#4c4c4c] rounded"
                            >
                                <Plus className="w-3.5 h-3.5 text-[#858585]" />
                            </button>
                            <button
                                onClick={() => breakpoints.forEach(onRemoveBreakpoint)}
                                className="p-0.5 hover:bg-[#4c4c4c] rounded"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-[#858585]" />
                            </button>
                        </div>
                    }
                >
                    {breakpoints.length === 0 ? (
                        <div className="px-4 py-2 text-xs text-[#858585] italic">
                            No breakpoints
                        </div>
                    ) : (
                        breakpoints.map((bp) => (
                            <div
                                key={bp.id}
                                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-[#2a2d2e] group"
                            >
                                <button
                                    onClick={() => onToggleBreakpoint?.(bp)}
                                    className={clsx(
                                        'w-3.5 h-3.5 rounded-full border flex items-center justify-center',
                                        bp.enabled
                                            ? 'border-red-500 bg-red-500'
                                            : 'border-[#555] bg-transparent'
                                    )}
                                >
                                    {bp.enabled && (
                                        <Circle className="w-2 h-2 text-white fill-current" />
                                    )}
                                </button>
                                <span className="text-[#cccccc]">
                                    {bp.file.split('/').pop()}:{bp.line}
                                </span>
                                {bp.condition && (
                                    <span className="text-[#858585]">({bp.condition})</span>
                                )}
                                <button
                                    onClick={() => onRemoveBreakpoint?.(bp)}
                                    className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#4c4c4c] rounded"
                                >
                                    <X className="w-3 h-3 text-[#858585]" />
                                </button>
                            </div>
                        ))
                    )}
                </Section>
            </div>
        </div>
    );
};

export default DebugPanel;
