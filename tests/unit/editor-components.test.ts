/**
 * Editor Tests - Test suite for VS Code editor components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Components to test
import {
  EnhancedCodeEditor,
  EditorToolbar,
  DiagnosticsPanel,
  CompletionPopup,
  SignatureHelp,
  HoverInfo,
  Minimap,
  Breadcrumbs,
  FindReplace,
  themes,
  getThemeByName,
} from '../../src/components/editor';
import { LSPManager, CompletionItemKind } from '../../src/services/lsp-manager.js';

// Mock providers
vi.mock('../../src/utils/yjs-provider', () => ({
  default: vi.fn().mockImplementation(() => ({
    getAwareness: vi.fn().mockReturnValue({
      setLocalStateField: vi.fn(),
      getStates: vi.fn().mockReturnValue(new Map()),
      on: vi.fn(),
      off: vi.fn(),
      clientID: 'test-client',
    }),
    isSynced: vi.fn().mockReturnValue(true),
    destroy: vi.fn(),
  })),
}));

// Mock Y.js
vi.mock('yjs', () => ({
  Doc: vi.fn().mockImplementation(() => ({
    getText: vi.fn().mockReturnValue({
      toString: vi.fn().mockReturnValue(''),
    }),
    destroy: vi.fn(),
  })),
  UndoManager: vi.fn().mockImplementation(() => ({})),
}));

describe('Editor Themes', () => {
  it('should have all required themes', () => {
    const requiredThemes = ['dark', 'light', 'dracula', 'one-dark', 'monokai'];
    requiredThemes.forEach(themeName => {
      expect(themes[themeName]).toBeDefined();
    });
  });

  it('should return correct theme by name', () => {
    const darkTheme = getThemeByName('dark');
    expect(darkTheme).toBeDefined();
    expect(darkTheme.extension).toBeDefined();
    expect(darkTheme.isDark).toBe(true);
  });

  it('should fallback to dark theme for unknown themes', () => {
    const unknownTheme = getThemeByName('unknown-theme');
    expect(unknownTheme).toBeDefined();
    expect(unknownTheme.name).toBe('Dark+ (Default Dark)');
  });
});

describe('LSPManager', () => {
  let lspManager;

  beforeEach(() => {
    lspManager = new LSPManager();
  });

  it('should return completions for JavaScript', async () => {
    const code = 'const x = ';
    const completions = await lspManager.getCompletions(code, code.length, 'javascript');
    expect(Array.isArray(completions)).toBe(true);
    expect(completions.length).toBeGreaterThan(0);
  });

  it('should return completions for Python', async () => {
    const code = 'import ';
    const completions = await lspManager.getCompletions(code, code.length, 'python');
    expect(Array.isArray(completions)).toBe(true);
  });

  it('should check syntax and return diagnostics', async () => {
    const code = 'const x = {';
    const diagnostics = await lspManager.getDiagnostics(code, 'javascript');
    expect(Array.isArray(diagnostics)).toBe(true);
  });

  it('should format JavaScript code', async () => {
    const code = 'const x=1;const y=2;';
    const formatted = await lspManager.format(code, 'javascript');
    expect(typeof formatted).toBe('string');
  });
});

describe('CompletionPopup', () => {
  const mockItems = [
    { label: 'console', kind: CompletionItemKind.VARIABLE, detail: 'Object' },
    { label: 'const', kind: CompletionItemKind.KEYWORD, detail: 'Keyword' },
    { label: 'constructor', kind: CompletionItemKind.METHOD, detail: 'Method' },
  ];

  it('should render completion items', () => {
    render(
      <CompletionPopup
        items={mockItems}
        visible={true}
        position={{ x: 100, y: 100 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('console')).toBeInTheDocument();
    expect(screen.getByText('const')).toBeInTheDocument();
    expect(screen.getByText('constructor')).toBeInTheDocument();
  });

  it('should call onSelect when item is clicked', async () => {
    const onSelect = vi.fn();
    render(
      <CompletionPopup
        items={mockItems}
        visible={true}
        position={{ x: 100, y: 100 }}
        onSelect={onSelect}
        onClose={vi.fn()}
      />
    );

    await userEvent.click(screen.getByText('console'));
    expect(onSelect).toHaveBeenCalledWith(mockItems[0]);
  });

  it('should not render when visible is false', () => {
    const { container } = render(
      <CompletionPopup
        items={mockItems}
        visible={false}
        position={{ x: 100, y: 100 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show suggestion count', () => {
    render(
      <CompletionPopup
        items={mockItems}
        visible={true}
        position={{ x: 100, y: 100 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('3 suggestions')).toBeInTheDocument();
  });
});

describe('DiagnosticsPanel', () => {
  const mockDiagnostics = [
    { message: 'Syntax error', severity: 'error', line: 1, column: 5, source: 'eslint' },
    { message: 'Unused variable', severity: 'warning', line: 3, column: 10, source: 'eslint' },
    { message: 'Consider using const', severity: 'info', line: 5, column: 1, source: 'eslint' },
  ];

  it('should render all diagnostics', () => {
    render(
      <DiagnosticsPanel
        diagnostics={mockDiagnostics}
        onDiagnosticClick={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Syntax error')).toBeInTheDocument();
    expect(screen.getByText('Unused variable')).toBeInTheDocument();
    expect(screen.getByText('Consider using const')).toBeInTheDocument();
  });

  it('should filter by severity', async () => {
    render(
      <DiagnosticsPanel
        diagnostics={mockDiagnostics}
        onDiagnosticClick={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // Find and click error filter button
    const errorButton = screen.getByRole('button', { name: /1 error/i });
    await userEvent.click(errorButton);

    // Only error should be visible
    expect(screen.getByText('Syntax error')).toBeInTheDocument();
  });

  it('should call onDiagnosticClick when diagnostic is clicked', async () => {
    const onDiagnosticClick = vi.fn();
    render(
      <DiagnosticsPanel
        diagnostics={mockDiagnostics}
        onDiagnosticClick={onDiagnosticClick}
        onClose={vi.fn()}
      />
    );

    await userEvent.click(screen.getByText('Syntax error'));
    expect(onDiagnosticClick).toHaveBeenCalledWith(mockDiagnostics[0]);
  });
});

describe('FindReplace', () => {
  it('should render search input', () => {
    render(
      <FindReplace
        visible={true}
        onSearch={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('should call onSearch when typing', async () => {
    const onSearch = vi.fn();
    render(
      <FindReplace
        visible={true}
        onSearch={onSearch}
        onClose={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search');
    await userEvent.type(searchInput, 'test');
    
    expect(onSearch).toHaveBeenCalled();
  });

  it('should show match count', () => {
    render(
      <FindReplace
        visible={true}
        onSearch={vi.fn()}
        onClose={vi.fn()}
        matchCount={5}
        currentMatch={2}
      />
    );

    expect(screen.getByText('2 of 5')).toBeInTheDocument();
  });

  it('should show replace input when toggled', async () => {
    render(
      <FindReplace
        visible={true}
        onSearch={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // Click toggle to show replace
    const toggleButton = screen.getByTitle(/Show Replace/i);
    await userEvent.click(toggleButton);

    expect(screen.getByPlaceholderText('Replace')).toBeInTheDocument();
  });
});

describe('Breadcrumbs', () => {
  it('should render file path segments', () => {
    render(
      <Breadcrumbs
        path={['src', 'components', 'editor', 'CodeEditor.jsx']}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('components')).toBeInTheDocument();
    expect(screen.getByText('editor')).toBeInTheDocument();
    expect(screen.getByText('CodeEditor.jsx')).toBeInTheDocument();
  });

  it('should call onNavigate when segment is clicked', async () => {
    const onNavigate = vi.fn();
    render(
      <Breadcrumbs
        path={['src', 'components']}
        onNavigate={onNavigate}
      />
    );

    await userEvent.click(screen.getByText('src'));
    expect(onNavigate).toHaveBeenCalled();
  });
});

describe('EditorToolbar', () => {
  const defaultProps = {
    language: 'javascript',
    theme: 'dark',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', monospace",
    onLanguageChange: vi.fn(),
    onThemeChange: vi.fn(),
    onFontSizeChange: vi.fn(),
    onFormat: vi.fn(),
  };

  it('should render toolbar buttons', () => {
    render(<EditorToolbar {...defaultProps} />);

    expect(screen.getByTitle(/Format/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Find/i)).toBeInTheDocument();
  });

  it('should call onFormat when format button is clicked', async () => {
    const onFormat = vi.fn();
    render(<EditorToolbar {...defaultProps} onFormat={onFormat} />);

    await userEvent.click(screen.getByTitle(/Format/i));
    expect(onFormat).toHaveBeenCalled();
  });

  it('should show font size controls', () => {
    render(<EditorToolbar {...defaultProps} />);

    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByTitle(/Decrease font size/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Increase font size/i)).toBeInTheDocument();
  });

  it('should change font size', async () => {
    const onFontSizeChange = vi.fn();
    render(<EditorToolbar {...defaultProps} onFontSizeChange={onFontSizeChange} />);

    await userEvent.click(screen.getByTitle(/Increase font size/i));
    expect(onFontSizeChange).toHaveBeenCalledWith(15);
  });
});

describe('HoverInfo', () => {
  const mockContent = {
    type: 'function log(message: string): void',
    documentation: 'Logs a message to the console.',
    language: 'typescript',
  };

  it('should render hover content', () => {
    render(
      <HoverInfo
        content={mockContent}
        visible={true}
        position={{ x: 100, y: 100 }}
      />
    );

    expect(screen.getByText(/function log/)).toBeInTheDocument();
    expect(screen.getByText(/Logs a message/)).toBeInTheDocument();
  });

  it('should show quick actions', () => {
    render(
      <HoverInfo
        content={mockContent}
        visible={true}
        position={{ x: 100, y: 100 }}
        onGoToDefinition={vi.fn()}
        onFindReferences={vi.fn()}
      />
    );

    expect(screen.getByText('Definition')).toBeInTheDocument();
    expect(screen.getByText('References')).toBeInTheDocument();
  });

  it('should not render when content is null', () => {
    const { container } = render(
      <HoverInfo
        content={null}
        visible={true}
        position={{ x: 100, y: 100 }}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('SignatureHelp', () => {
  const mockSignatures = [
    {
      label: 'console.log(message?: any, ...optionalParams: any[]): void',
      documentation: 'Prints to console',
      parameters: [
        { label: 'message?: any', documentation: 'The message to print' },
        { label: '...optionalParams: any[]', documentation: 'Additional parameters' },
      ],
    },
  ];

  it('should render signature', () => {
    render(
      <SignatureHelp
        signatures={mockSignatures}
        activeSignature={0}
        activeParameter={0}
        visible={true}
        position={{ x: 100, y: 100 }}
      />
    );

    expect(screen.getByText(/console\.log/)).toBeInTheDocument();
  });

  it('should highlight active parameter', () => {
    render(
      <SignatureHelp
        signatures={mockSignatures}
        activeSignature={0}
        activeParameter={0}
        visible={true}
        position={{ x: 100, y: 100 }}
      />
    );

    // The active parameter should have special styling
    const messageParam = screen.getByText('message?: any');
    expect(messageParam).toHaveClass('text-yellow-400');
  });
});

describe('Minimap', () => {
  it('should render canvas', () => {
    const { container } = render(
      <Minimap
        content="const x = 1;\nconst y = 2;"
        viewportStart={1}
        viewportEnd={2}
        totalLines={2}
        onScroll={vi.fn()}
      />
    );

    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('should call onScroll when clicked', async () => {
    const onScroll = vi.fn();
    const { container } = render(
      <Minimap
        content="line 1\nline 2\nline 3\nline 4\nline 5"
        viewportStart={1}
        viewportEnd={3}
        totalLines={5}
        onScroll={onScroll}
        width={80}
      />
    );

    const canvas = container.querySelector('canvas');
    await userEvent.click(canvas);
    
    expect(onScroll).toHaveBeenCalled();
  });
});
