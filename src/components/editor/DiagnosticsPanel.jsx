/**
 * Diagnostics Panel - VS Code style problems panel
 * Shows errors, warnings, and hints from LSP
 */

import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Filter,
  X,
  FileCode,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';

// Severity levels
const SEVERITY = {
  1: { name: 'Error', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  2: { name: 'Warning', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  3: { name: 'Information', icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  4: { name: 'Hint', icon: Lightbulb, color: 'text-gray-400', bg: 'bg-gray-500/10' },
};

// Diagnostic Item
const DiagnosticItem = ({ diagnostic, file, onNavigate, onQuickFix }) => {
  const severity = SEVERITY[diagnostic.severity] || SEVERITY[3];
  const Icon = severity.icon;
  
  return (
    <div
      className={clsx(
        'flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-[#2a2d2e] border-l-2',
        diagnostic.severity === 1 ? 'border-red-500' : 
        diagnostic.severity === 2 ? 'border-yellow-500' : 
        'border-transparent'
      )}
      onClick={() => onNavigate?.(file, diagnostic.range.start)}
    >
      <Icon className={clsx('w-4 h-4 mt-0.5 flex-shrink-0', severity.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-gray-200 break-words">{diagnostic.message}</span>
          {diagnostic.code && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              [{diagnostic.source || 'lsp'}({diagnostic.code})]
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <FileCode className="w-3 h-3" />
          <span className="truncate">{file}</span>
          <span>
            [{diagnostic.range.start.line + 1}:{diagnostic.range.start.character + 1}]
          </span>
        </div>
        {diagnostic.relatedInformation && diagnostic.relatedInformation.length > 0 && (
          <div className="mt-1 pl-4 border-l border-gray-700">
            {diagnostic.relatedInformation.map((info, idx) => (
              <div key={idx} className="text-xs text-gray-400">
                {info.message}
              </div>
            ))}
          </div>
        )}
      </div>
      {diagnostic.codeActions && diagnostic.codeActions.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickFix?.(diagnostic);
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-[#094771] hover:bg-[#0d5a8f] rounded"
          title="Quick Fix"
        >
          <Lightbulb className="w-3 h-3" />
          Fix
        </button>
      )}
    </div>
  );
};

// File Group
const FileGroup = ({ file, diagnostics, isExpanded, onToggle, onNavigate, onQuickFix }) => {
  const counts = useMemo(() => {
    return diagnostics.reduce((acc, d) => {
      acc[d.severity] = (acc[d.severity] || 0) + 1;
      return acc;
    }, {});
  }, [diagnostics]);

  return (
    <div className="border-b border-[#3c3c3c]">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2a2d2e] text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
        <FileCode className="w-4 h-4 text-gray-400" />
        <span className="flex-1 text-sm text-gray-200 truncate">{file}</span>
        <div className="flex items-center gap-2">
          {counts[1] > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="w-3 h-3" />
              {counts[1]}
            </span>
          )}
          {counts[2] > 0 && (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <AlertTriangle className="w-3 h-3" />
              {counts[2]}
            </span>
          )}
          {(counts[3] || 0) + (counts[4] || 0) > 0 && (
            <span className="flex items-center gap-1 text-xs text-blue-400">
              <Info className="w-3 h-3" />
              {(counts[3] || 0) + (counts[4] || 0)}
            </span>
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="bg-[#1e1e1e]">
          {diagnostics.map((diagnostic, idx) => (
            <DiagnosticItem
              key={idx}
              diagnostic={diagnostic}
              file={file}
              onNavigate={onNavigate}
              onQuickFix={onQuickFix}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DiagnosticsPanel = ({
  diagnostics = {},
  onNavigate,
  onQuickFix,
  onRefresh,
  onClose,
  className,
}) => {
  const [filter, setFilter] = useState({ errors: true, warnings: true, info: true });
  const [expandedFiles, setExpandedFiles] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Compute counts
  const counts = useMemo(() => {
    let errors = 0, warnings = 0, info = 0;
    
    Object.values(diagnostics).forEach((fileDiagnostics) => {
      fileDiagnostics.forEach((d) => {
        if (d.severity === 1) errors++;
        else if (d.severity === 2) warnings++;
        else info++;
      });
    });
    
    return { errors, warnings, info, total: errors + warnings + info };
  }, [diagnostics]);

  // Filter diagnostics
  const filteredDiagnostics = useMemo(() => {
    const result = {};
    
    Object.entries(diagnostics).forEach(([file, fileDiagnostics]) => {
      const filtered = fileDiagnostics.filter((d) => {
        // Severity filter
        if (d.severity === 1 && !filter.errors) return false;
        if (d.severity === 2 && !filter.warnings) return false;
        if (d.severity >= 3 && !filter.info) return false;
        
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            d.message.toLowerCase().includes(query) ||
            file.toLowerCase().includes(query)
          );
        }
        
        return true;
      });
      
      if (filtered.length > 0) {
        result[file] = filtered;
      }
    });
    
    return result;
  }, [diagnostics, filter, searchQuery]);

  const toggleFile = (file) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(file)) {
      newExpanded.delete(file);
    } else {
      newExpanded.add(file);
    }
    setExpandedFiles(newExpanded);
  };

  const expandAll = () => {
    setExpandedFiles(new Set(Object.keys(filteredDiagnostics)));
  };

  const collapseAll = () => {
    setExpandedFiles(new Set());
  };

  return (
    <div className={clsx('flex flex-col bg-[#1e1e1e] text-gray-300', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Problems</span>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setFilter(f => ({ ...f, errors: !f.errors }))}
              className={clsx(
                'flex items-center gap-1 px-1.5 py-0.5 rounded',
                filter.errors ? 'bg-red-500/20 text-red-400' : 'text-gray-500'
              )}
            >
              <AlertCircle className="w-3 h-3" />
              {counts.errors}
            </button>
            <button
              onClick={() => setFilter(f => ({ ...f, warnings: !f.warnings }))}
              className={clsx(
                'flex items-center gap-1 px-1.5 py-0.5 rounded',
                filter.warnings ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-500'
              )}
            >
              <AlertTriangle className="w-3 h-3" />
              {counts.warnings}
            </button>
            <button
              onClick={() => setFilter(f => ({ ...f, info: !f.info }))}
              className={clsx(
                'flex items-center gap-1 px-1.5 py-0.5 rounded',
                filter.info ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500'
              )}
            >
              <Info className="w-3 h-3" />
              {counts.info}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter..."
            className="w-32 px-2 py-1 text-xs bg-[#3c3c3c] border border-[#3c3c3c] rounded focus:border-[#007acc] outline-none"
          />
          <button
            onClick={expandAll}
            className="p-1 hover:bg-[#3c3c3c] rounded"
            title="Expand All"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={collapseAll}
            className="p-1 hover:bg-[#3c3c3c] rounded"
            title="Collapse All"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onRefresh}
            className="p-1 hover:bg-[#3c3c3c] rounded"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#3c3c3c] rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(filteredDiagnostics).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
            <span className="text-sm">No problems detected</span>
          </div>
        ) : (
          Object.entries(filteredDiagnostics).map(([file, fileDiagnostics]) => (
            <FileGroup
              key={file}
              file={file}
              diagnostics={fileDiagnostics}
              isExpanded={expandedFiles.has(file)}
              onToggle={() => toggleFile(file)}
              onNavigate={onNavigate}
              onQuickFix={onQuickFix}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1 text-xs text-gray-500 bg-[#252526] border-t border-[#3c3c3c]">
        <span>
          {counts.total} problem{counts.total !== 1 ? 's' : ''} in{' '}
          {Object.keys(diagnostics).length} file{Object.keys(diagnostics).length !== 1 ? 's' : ''}
        </span>
        <span>
          Showing {Object.values(filteredDiagnostics).flat().length} of {counts.total}
        </span>
      </div>
    </div>
  );
};

export default DiagnosticsPanel;
