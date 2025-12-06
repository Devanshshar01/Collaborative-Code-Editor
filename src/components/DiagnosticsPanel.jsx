/**
 * Diagnostics Panel Component
 * Displays LSP diagnostics with error squiggles and messages
 */

import React, { useMemo, useCallback } from 'react';
import { 
    AlertCircle, 
    AlertTriangle, 
    Info, 
    Lightbulb, 
    ChevronRight,
    FileCode,
    X 
} from 'lucide-react';
import clsx from 'clsx';

const severityConfig = {
    1: { icon: AlertCircle, label: 'Error', color: 'text-red-400', bg: 'bg-red-500/10' },
    2: { icon: AlertTriangle, label: 'Warning', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    3: { icon: Info, label: 'Info', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    4: { icon: Lightbulb, label: 'Hint', color: 'text-green-400', bg: 'bg-green-500/10' },
};

export const DiagnosticsPanel = ({
    diagnostics,
    onDiagnosticClick,
    onClose,
    className,
}) => {
    // Flatten diagnostics if Map
    const flatDiagnostics = useMemo(() => {
        if (Array.isArray(diagnostics)) {
            return diagnostics;
        }
        const result = [];
        for (const [uri, diags] of diagnostics) {
            for (const d of diags) {
                result.push({ ...d, uri });
            }
        }
        return result;
    }, [diagnostics]);

    // Group by severity
    const grouped = useMemo(() => {
        const groups = { 1: [], 2: [], 3: [], 4: [] };
        for (const d of flatDiagnostics) {
            const severity = d.severity || 1;
            groups[severity].push(d);
        }
        return groups;
    }, [flatDiagnostics]);

    // Counts
    const counts = useMemo(() => ({
        errors: grouped[1].length,
        warnings: grouped[2].length,
        info: grouped[3].length,
        hints: grouped[4].length,
        total: flatDiagnostics.length,
    }), [grouped, flatDiagnostics]);

    const handleClick = useCallback((diagnostic) => {
        onDiagnosticClick?.(diagnostic);
    }, [onDiagnosticClick]);

    return (
        <div className={clsx(
            'flex flex-col bg-[#1e1e1e] border-t border-[#333]',
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#333] bg-[#252526]">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-[#cccccc]">Problems</span>
                    <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-red-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {counts.errors}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {counts.warnings}
                        </span>
                        <span className="flex items-center gap-1 text-blue-400">
                            <Info className="w-3.5 h-3.5" />
                            {counts.info}
                        </span>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-[#333] rounded"
                    >
                        <X className="w-4 h-4 text-[#858585]" />
                    </button>
                )}
            </div>

            {/* Diagnostics List */}
            <div className="flex-1 overflow-auto min-h-0">
                {flatDiagnostics.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-[#858585] text-sm">
                        No problems detected
                    </div>
                ) : (
                    <div className="divide-y divide-[#333]">
                        {flatDiagnostics.map((diagnostic, index) => {
                            const config = severityConfig[diagnostic.severity] || severityConfig[1];
                            const Icon = config.icon;
                            const fileName = diagnostic.uri?.split('/').pop() || diagnostic.file || 'Unknown';

                            return (
                                <div
                                    key={`${diagnostic.uri}-${index}`}
                                    className={clsx(
                                        'flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-[#2a2d2e] transition-colors',
                                        config.bg
                                    )}
                                    onClick={() => handleClick(diagnostic)}
                                >
                                    <Icon className={clsx('w-4 h-4 mt-0.5 flex-shrink-0', config.color)} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-[#cccccc] truncate">
                                                {diagnostic.message}
                                            </span>
                                            {diagnostic.code && (
                                                <span className="text-xs text-[#858585] flex-shrink-0">
                                                    {diagnostic.source ? `${diagnostic.source}(${diagnostic.code})` : diagnostic.code}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-[#858585] mt-0.5">
                                            <FileCode className="w-3 h-3" />
                                            <span>{fileName}</span>
                                            <span>
                                                [{diagnostic.range.start.line + 1}:{diagnostic.range.start.character + 1}]
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-[#858585] flex-shrink-0" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiagnosticsPanel;
