/**
 * Test Runner Panel Component
 * Run and visualize test results for multiple frameworks
 */

import React, { useState, useMemo } from 'react';
import {
    Play,
    PlayCircle,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Circle,
    Clock,
    ChevronRight,
    ChevronDown,
    Search,
    FileCode,
    FolderTree,
    AlertCircle,
    Loader2,
    SkipForward,
    Timer,
    X,
} from 'lucide-react';
import clsx from 'clsx';

// Status Icons
const StatusIcon = ({ status, className }) => {
    switch (status) {
        case 'passed':
            return <CheckCircle2 className={clsx('w-4 h-4 text-green-400', className)} />;
        case 'failed':
        case 'error':
            return <XCircle className={clsx('w-4 h-4 text-red-400', className)} />;
        case 'skipped':
            return <SkipForward className={clsx('w-4 h-4 text-yellow-400', className)} />;
        case 'running':
            return <Loader2 className={clsx('w-4 h-4 text-blue-400 animate-spin', className)} />;
        default:
            return <Circle className={clsx('w-4 h-4 text-[#555]', className)} />;
    }
};

// Progress Bar
const ProgressBar = ({ summary }) => {
    const { total, passed, failed, skipped } = summary;
    if (total === 0) return null;
    
    const passedPct = (passed / total) * 100;
    const failedPct = (failed / total) * 100;
    const skippedPct = (skipped / total) * 100;
    
    return (
        <div className="h-1.5 w-full bg-[#333] rounded-full overflow-hidden flex">
            <div
                className="bg-green-500 transition-all duration-300"
                style={{ width: `${passedPct}%` }}
            />
            <div
                className="bg-red-500 transition-all duration-300"
                style={{ width: `${failedPct}%` }}
            />
            <div
                className="bg-yellow-500 transition-all duration-300"
                style={{ width: `${skippedPct}%` }}
            />
        </div>
    );
};

// Test Case Component
const TestCaseItem = ({ test, isSelected, onRun, onSelect }) => {
    return (
        <div
            className={clsx(
                'flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[#2a2d2e] group',
                isSelected && 'bg-[#094771]'
            )}
            onClick={onSelect}
        >
            <StatusIcon status={test.status} />
            <span className="text-xs text-[#cccccc] flex-1 truncate">
                {test.name}
            </span>
            {test.duration !== undefined && (
                <span className="text-xs text-[#858585] flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {test.duration.toFixed(0)}ms
                </span>
            )}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRun?.();
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#4c4c4c] rounded"
            >
                <Play className="w-3 h-3 text-green-400" />
            </button>
        </div>
    );
};

// Test Suite Component
const TestSuiteItem = ({ suite, depth = 0, selectedTestId, onToggle, onRunSuite, onRunTest, onSelectTest }) => {
    const isExpanded = suite.expanded ?? true;
    
    const counts = useMemo(() => {
        const count = (s) => {
            let result = { passed: 0, failed: 0, total: 0 };
            for (const test of s.tests) {
                result.total++;
                if (test.status === 'passed') result.passed++;
                if (test.status === 'failed' || test.status === 'error') result.failed++;
            }
            for (const child of s.suites || []) {
                const childCount = count(child);
                result.passed += childCount.passed;
                result.failed += childCount.failed;
                result.total += childCount.total;
            }
            return result;
        };
        return count(suite);
    }, [suite]);

    return (
        <div style={{ paddingLeft: depth * 12 }}>
            {/* Suite Header */}
            <div
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-[#2a2d2e] group"
                onClick={onToggle}
            >
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#858585]" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-[#858585]" />
                )}
                <StatusIcon status={suite.status} />
                <FolderTree className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs text-[#cccccc] flex-1 truncate font-medium">
                    {suite.name}
                </span>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-400">{counts.passed}</span>
                    <span className="text-[#555]">/</span>
                    <span className={counts.failed > 0 ? 'text-red-400' : 'text-[#858585]'}>
                        {counts.failed}
                    </span>
                    <span className="text-[#555]">/</span>
                    <span className="text-[#858585]">{counts.total}</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRunSuite?.();
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#4c4c4c] rounded"
                >
                    <PlayCircle className="w-3.5 h-3.5 text-green-400" />
                </button>
            </div>

            {/* Children */}
            {isExpanded && (
                <>
                    {suite.tests.map((test) => (
                        <TestCaseItem
                            key={test.id}
                            test={test}
                            isSelected={selectedTestId === test.id}
                            onRun={() => onRunTest?.(test)}
                            onSelect={() => onSelectTest?.(test)}
                        />
                    ))}
                    {suite.suites?.map((childSuite) => (
                        <TestSuiteItem
                            key={childSuite.id}
                            suite={childSuite}
                            depth={depth + 1}
                            selectedTestId={selectedTestId}
                            onToggle={() => onToggle?.()}
                            onRunSuite={() => onRunSuite?.()}
                            onRunTest={onRunTest}
                            onSelectTest={onSelectTest}
                        />
                    ))}
                </>
            )}
        </div>
    );
};

// Error Display
const ErrorDisplay = ({ test }) => {
    if (!test.error) return null;

    return (
        <div className="bg-[#1e1e1e] border-t border-[#333] p-4">
            <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">
                    {test.name} - Failed
                </span>
            </div>
            <div className="text-xs text-[#cccccc] mb-2">{test.error.message}</div>
            {test.error.expected && test.error.actual && (
                <div className="flex gap-4 mb-2">
                    <div className="flex-1">
                        <div className="text-xs text-green-400 mb-1">Expected:</div>
                        <pre className="text-xs bg-[#252526] p-2 rounded text-[#ce9178] overflow-x-auto">
                            {test.error.expected}
                        </pre>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs text-red-400 mb-1">Actual:</div>
                        <pre className="text-xs bg-[#252526] p-2 rounded text-[#ce9178] overflow-x-auto">
                            {test.error.actual}
                        </pre>
                    </div>
                </div>
            )}
            {test.error.stack && (
                <details className="text-xs">
                    <summary className="text-[#858585] cursor-pointer hover:text-[#cccccc]">
                        Stack trace
                    </summary>
                    <pre className="mt-2 bg-[#252526] p-2 rounded text-[#858585] overflow-x-auto whitespace-pre-wrap">
                        {test.error.stack}
                    </pre>
                </details>
            )}
        </div>
    );
};

// Main Test Runner Panel
export const TestRunnerPanel = ({
    suites,
    summary = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 },
    isRunning = false,
    selectedTestId,
    filter = 'all',
    onRunAll,
    onRunSuite,
    onRunTest,
    onStopRun,
    onRefresh,
    onFilterChange,
    onTestSelect,
    onToggleSuite,
    onClose,
    className,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    // Find selected test
    const selectedTest = useMemo(() => {
        const findTest = (suites) => {
            for (const suite of suites) {
                for (const test of suite.tests) {
                    if (test.id === selectedTestId) return test;
                }
                if (suite.suites) {
                    const found = findTest(suite.suites);
                    if (found) return found;
                }
            }
            return undefined;
        };
        return selectedTestId ? findTest(suites) : undefined;
    }, [suites, selectedTestId]);

    // Filter suites
    const filteredSuites = useMemo(() => {
        if (filter === 'all' && !searchQuery) return suites;
        
        const filterTests = (tests) => {
            return tests.filter((test) => {
                const matchesFilter = filter === 'all' ||
                    (filter === 'failed' && (test.status === 'failed' || test.status === 'error')) ||
                    (filter === 'passed' && test.status === 'passed') ||
                    (filter === 'skipped' && test.status === 'skipped');
                const matchesSearch = !searchQuery ||
                    test.name.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesFilter && matchesSearch;
            });
        };

        const filterSuites = (suites) => {
            return suites
                .map((suite) => ({
                    ...suite,
                    tests: filterTests(suite.tests),
                    suites: suite.suites ? filterSuites(suite.suites) : undefined,
                }))
                .filter((suite) => suite.tests.length > 0 || (suite.suites?.length ?? 0) > 0);
        };

        return filterSuites(suites);
    }, [suites, filter, searchQuery]);

    return (
        <div className={clsx('flex flex-col bg-[#1e1e1e] border-t border-[#333]', className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#333] bg-[#252526]">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#cccccc]">Test Explorer</span>
                </div>
                <div className="flex items-center gap-1">
                    {isRunning ? (
                        <button
                            onClick={onStopRun}
                            className="p-1.5 rounded hover:bg-[#4c4c4c] text-red-400"
                            title="Stop Tests"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={onRunAll}
                            className="p-1.5 rounded hover:bg-[#4c4c4c] text-green-400"
                            title="Run All Tests"
                        >
                            <Play className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onRefresh}
                        className="p-1.5 rounded hover:bg-[#4c4c4c] text-[#cccccc]"
                        title="Refresh Tests"
                    >
                        <RefreshCw className={clsx('w-4 h-4', isRunning && 'animate-spin')} />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded hover:bg-[#4c4c4c]"
                        >
                            <X className="w-4 h-4 text-[#858585]" />
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Bar */}
            <div className="px-3 py-2 border-b border-[#333]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1 text-[#cccccc]">
                            Total: {summary.total}
                        </span>
                        <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {summary.passed}
                        </span>
                        <span className="flex items-center gap-1 text-red-400">
                            <XCircle className="w-3 h-3" />
                            {summary.failed}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-400">
                            <SkipForward className="w-3 h-3" />
                            {summary.skipped}
                        </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-[#858585]">
                        <Clock className="w-3 h-3" />
                        {summary.duration.toFixed(0)}ms
                    </span>
                </div>
                <ProgressBar summary={summary} />
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#333]">
                <div className="flex items-center flex-1 gap-2 bg-[#3c3c3c] rounded px-2 py-1">
                    <Search className="w-3.5 h-3.5 text-[#858585]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tests..."
                        className="flex-1 bg-transparent text-xs text-[#cccccc] outline-none placeholder:text-[#555]"
                    />
                </div>
                <div className="flex items-center gap-1">
                    {['all', 'failed', 'passed', 'skipped'].map((f) => (
                        <button
                            key={f}
                            onClick={() => onFilterChange?.(f)}
                            className={clsx(
                                'px-2 py-1 text-xs rounded capitalize',
                                filter === f
                                    ? 'bg-[#094771] text-white'
                                    : 'text-[#858585] hover:bg-[#3c3c3c]'
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Test Tree */}
            <div className="flex-1 overflow-auto min-h-0">
                {filteredSuites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#858585] text-sm">
                        <FileCode className="w-8 h-8 mb-2" />
                        <span>No tests found</span>
                    </div>
                ) : (
                    filteredSuites.map((suite) => (
                        <TestSuiteItem
                            key={suite.id}
                            suite={suite}
                            selectedTestId={selectedTestId}
                            onToggle={() => onToggleSuite?.(suite)}
                            onRunSuite={() => onRunSuite?.(suite)}
                            onRunTest={onRunTest}
                            onSelectTest={onTestSelect}
                        />
                    ))
                )}
            </div>

            {/* Error Display */}
            {selectedTest && (selectedTest.status === 'failed' || selectedTest.status === 'error') && (
                <ErrorDisplay test={selectedTest} />
            )}
        </div>
    );
};

export default TestRunnerPanel;
