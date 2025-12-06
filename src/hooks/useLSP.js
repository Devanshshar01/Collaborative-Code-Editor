/**
 * LSP Client Hook
 * Provides code intelligence features: autocomplete, hover, diagnostics, etc.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// LSP message types
const LSPMethods = {
  INITIALIZE: 'initialize',
  INITIALIZED: 'initialized',
  SHUTDOWN: 'shutdown',
  TEXT_DOCUMENT_DID_OPEN: 'textDocument/didOpen',
  TEXT_DOCUMENT_DID_CHANGE: 'textDocument/didChange',
  TEXT_DOCUMENT_DID_CLOSE: 'textDocument/didClose',
  TEXT_DOCUMENT_COMPLETION: 'textDocument/completion',
  TEXT_DOCUMENT_HOVER: 'textDocument/hover',
  TEXT_DOCUMENT_DEFINITION: 'textDocument/definition',
  TEXT_DOCUMENT_REFERENCES: 'textDocument/references',
  TEXT_DOCUMENT_DOCUMENT_SYMBOL: 'textDocument/documentSymbol',
  TEXT_DOCUMENT_FORMATTING: 'textDocument/formatting',
  TEXT_DOCUMENT_RANGE_FORMATTING: 'textDocument/rangeFormatting',
  TEXT_DOCUMENT_CODE_ACTION: 'textDocument/codeAction',
  TEXT_DOCUMENT_RENAME: 'textDocument/rename',
  TEXT_DOCUMENT_SIGNATURE_HELP: 'textDocument/signatureHelp',
  TEXT_DOCUMENT_PUBLISH_DIAGNOSTICS: 'textDocument/publishDiagnostics',
};

// Diagnostic severity
export const DiagnosticSeverity = {
  ERROR: 1,
  WARNING: 2,
  INFORMATION: 3,
  HINT: 4,
};

// Completion item kinds
export const CompletionItemKind = {
  TEXT: 1,
  METHOD: 2,
  FUNCTION: 3,
  CONSTRUCTOR: 4,
  FIELD: 5,
  VARIABLE: 6,
  CLASS: 7,
  INTERFACE: 8,
  MODULE: 9,
  PROPERTY: 10,
  UNIT: 11,
  VALUE: 12,
  ENUM: 13,
  KEYWORD: 14,
  SNIPPET: 15,
  COLOR: 16,
  FILE: 17,
  REFERENCE: 18,
  FOLDER: 19,
  ENUM_MEMBER: 20,
  CONSTANT: 21,
  STRUCT: 22,
  EVENT: 23,
  OPERATOR: 24,
  TYPE_PARAMETER: 25,
};

// Symbol kinds
export const SymbolKind = {
  FILE: 1,
  MODULE: 2,
  NAMESPACE: 3,
  PACKAGE: 4,
  CLASS: 5,
  METHOD: 6,
  PROPERTY: 7,
  FIELD: 8,
  CONSTRUCTOR: 9,
  ENUM: 10,
  INTERFACE: 11,
  FUNCTION: 12,
  VARIABLE: 13,
  CONSTANT: 14,
  STRING: 15,
  NUMBER: 16,
  BOOLEAN: 17,
  ARRAY: 18,
  OBJECT: 19,
  KEY: 20,
  NULL: 21,
  ENUM_MEMBER: 22,
  STRUCT: 23,
  EVENT: 24,
  OPERATOR: 25,
  TYPE_PARAMETER: 26,
};

// Built-in completions for languages
const builtinCompletions = {
  javascript: [
    { label: 'console', kind: CompletionItemKind.MODULE, detail: 'Console object' },
    { label: 'console.log', kind: CompletionItemKind.METHOD, detail: 'Log to console', insertText: 'console.log($1)' },
    { label: 'console.error', kind: CompletionItemKind.METHOD, detail: 'Log error', insertText: 'console.error($1)' },
    { label: 'function', kind: CompletionItemKind.KEYWORD, detail: 'Function declaration', insertText: 'function $1($2) {\n\t$3\n}' },
    { label: 'async function', kind: CompletionItemKind.KEYWORD, detail: 'Async function', insertText: 'async function $1($2) {\n\t$3\n}' },
    { label: 'const', kind: CompletionItemKind.KEYWORD, detail: 'Constant declaration' },
    { label: 'let', kind: CompletionItemKind.KEYWORD, detail: 'Variable declaration' },
    { label: 'var', kind: CompletionItemKind.KEYWORD, detail: 'Variable declaration (legacy)' },
    { label: 'if', kind: CompletionItemKind.KEYWORD, detail: 'If statement', insertText: 'if ($1) {\n\t$2\n}' },
    { label: 'for', kind: CompletionItemKind.KEYWORD, detail: 'For loop', insertText: 'for (let $1 = 0; $1 < $2; $1++) {\n\t$3\n}' },
    { label: 'forEach', kind: CompletionItemKind.METHOD, detail: 'Array forEach', insertText: '.forEach(($1) => {\n\t$2\n})' },
    { label: 'map', kind: CompletionItemKind.METHOD, detail: 'Array map', insertText: '.map(($1) => $2)' },
    { label: 'filter', kind: CompletionItemKind.METHOD, detail: 'Array filter', insertText: '.filter(($1) => $2)' },
    { label: 'reduce', kind: CompletionItemKind.METHOD, detail: 'Array reduce', insertText: '.reduce((acc, $1) => $2, $3)' },
    { label: 'Promise', kind: CompletionItemKind.CLASS, detail: 'Promise constructor' },
    { label: 'await', kind: CompletionItemKind.KEYWORD, detail: 'Await promise' },
    { label: 'import', kind: CompletionItemKind.KEYWORD, detail: 'Import module', insertText: "import { $1 } from '$2';" },
    { label: 'export', kind: CompletionItemKind.KEYWORD, detail: 'Export module' },
    { label: 'class', kind: CompletionItemKind.KEYWORD, detail: 'Class declaration', insertText: 'class $1 {\n\tconstructor($2) {\n\t\t$3\n\t}\n}' },
    { label: 'try', kind: CompletionItemKind.KEYWORD, detail: 'Try-catch block', insertText: 'try {\n\t$1\n} catch (error) {\n\t$2\n}' },
    { label: 'setTimeout', kind: CompletionItemKind.FUNCTION, detail: 'Set timeout', insertText: 'setTimeout(() => {\n\t$1\n}, $2)' },
    { label: 'setInterval', kind: CompletionItemKind.FUNCTION, detail: 'Set interval', insertText: 'setInterval(() => {\n\t$1\n}, $2)' },
    { label: 'fetch', kind: CompletionItemKind.FUNCTION, detail: 'Fetch API', insertText: "fetch('$1').then(res => res.json()).then(data => $2)" },
    { label: 'JSON.parse', kind: CompletionItemKind.METHOD, detail: 'Parse JSON string' },
    { label: 'JSON.stringify', kind: CompletionItemKind.METHOD, detail: 'Stringify to JSON' },
    { label: 'Object.keys', kind: CompletionItemKind.METHOD, detail: 'Get object keys' },
    { label: 'Object.values', kind: CompletionItemKind.METHOD, detail: 'Get object values' },
    { label: 'Object.entries', kind: CompletionItemKind.METHOD, detail: 'Get object entries' },
    { label: 'Array.isArray', kind: CompletionItemKind.METHOD, detail: 'Check if array' },
    { label: 'Math.random', kind: CompletionItemKind.METHOD, detail: 'Random number 0-1' },
    { label: 'Math.floor', kind: CompletionItemKind.METHOD, detail: 'Round down' },
    { label: 'Math.ceil', kind: CompletionItemKind.METHOD, detail: 'Round up' },
    { label: 'Math.round', kind: CompletionItemKind.METHOD, detail: 'Round to nearest' },
  ],
  python: [
    { label: 'print', kind: CompletionItemKind.FUNCTION, detail: 'Print to stdout', insertText: 'print($1)' },
    { label: 'def', kind: CompletionItemKind.KEYWORD, detail: 'Function definition', insertText: 'def $1($2):\n\t$3' },
    { label: 'async def', kind: CompletionItemKind.KEYWORD, detail: 'Async function', insertText: 'async def $1($2):\n\t$3' },
    { label: 'class', kind: CompletionItemKind.KEYWORD, detail: 'Class definition', insertText: 'class $1:\n\tdef __init__(self$2):\n\t\t$3' },
    { label: 'if', kind: CompletionItemKind.KEYWORD, detail: 'If statement', insertText: 'if $1:\n\t$2' },
    { label: 'elif', kind: CompletionItemKind.KEYWORD, detail: 'Else if', insertText: 'elif $1:\n\t$2' },
    { label: 'else', kind: CompletionItemKind.KEYWORD, detail: 'Else statement', insertText: 'else:\n\t$1' },
    { label: 'for', kind: CompletionItemKind.KEYWORD, detail: 'For loop', insertText: 'for $1 in $2:\n\t$3' },
    { label: 'while', kind: CompletionItemKind.KEYWORD, detail: 'While loop', insertText: 'while $1:\n\t$2' },
    { label: 'try', kind: CompletionItemKind.KEYWORD, detail: 'Try-except', insertText: 'try:\n\t$1\nexcept Exception as e:\n\t$2' },
    { label: 'with', kind: CompletionItemKind.KEYWORD, detail: 'Context manager', insertText: 'with $1 as $2:\n\t$3' },
    { label: 'import', kind: CompletionItemKind.KEYWORD, detail: 'Import module' },
    { label: 'from', kind: CompletionItemKind.KEYWORD, detail: 'From import', insertText: 'from $1 import $2' },
    { label: 'return', kind: CompletionItemKind.KEYWORD, detail: 'Return statement' },
    { label: 'yield', kind: CompletionItemKind.KEYWORD, detail: 'Yield value' },
    { label: 'lambda', kind: CompletionItemKind.KEYWORD, detail: 'Lambda function', insertText: 'lambda $1: $2' },
    { label: 'len', kind: CompletionItemKind.FUNCTION, detail: 'Get length' },
    { label: 'range', kind: CompletionItemKind.FUNCTION, detail: 'Generate range', insertText: 'range($1)' },
    { label: 'enumerate', kind: CompletionItemKind.FUNCTION, detail: 'Enumerate iterable' },
    { label: 'zip', kind: CompletionItemKind.FUNCTION, detail: 'Zip iterables' },
    { label: 'map', kind: CompletionItemKind.FUNCTION, detail: 'Map function' },
    { label: 'filter', kind: CompletionItemKind.FUNCTION, detail: 'Filter iterable' },
    { label: 'list', kind: CompletionItemKind.CLASS, detail: 'List constructor' },
    { label: 'dict', kind: CompletionItemKind.CLASS, detail: 'Dict constructor' },
    { label: 'set', kind: CompletionItemKind.CLASS, detail: 'Set constructor' },
    { label: 'tuple', kind: CompletionItemKind.CLASS, detail: 'Tuple constructor' },
    { label: 'str', kind: CompletionItemKind.CLASS, detail: 'String constructor' },
    { label: 'int', kind: CompletionItemKind.CLASS, detail: 'Integer constructor' },
    { label: 'float', kind: CompletionItemKind.CLASS, detail: 'Float constructor' },
    { label: 'bool', kind: CompletionItemKind.CLASS, detail: 'Boolean constructor' },
    { label: 'input', kind: CompletionItemKind.FUNCTION, detail: 'Read input' },
    { label: 'open', kind: CompletionItemKind.FUNCTION, detail: 'Open file', insertText: "open('$1', '$2')" },
    { label: '__init__', kind: CompletionItemKind.METHOD, detail: 'Constructor', insertText: 'def __init__(self$1):\n\t$2' },
    { label: '__str__', kind: CompletionItemKind.METHOD, detail: 'String representation', insertText: 'def __str__(self):\n\treturn $1' },
    { label: 'self', kind: CompletionItemKind.KEYWORD, detail: 'Instance reference' },
  ],
  java: [
    { label: 'public', kind: CompletionItemKind.KEYWORD, detail: 'Public modifier' },
    { label: 'private', kind: CompletionItemKind.KEYWORD, detail: 'Private modifier' },
    { label: 'protected', kind: CompletionItemKind.KEYWORD, detail: 'Protected modifier' },
    { label: 'static', kind: CompletionItemKind.KEYWORD, detail: 'Static modifier' },
    { label: 'final', kind: CompletionItemKind.KEYWORD, detail: 'Final modifier' },
    { label: 'class', kind: CompletionItemKind.KEYWORD, detail: 'Class declaration', insertText: 'public class $1 {\n\t$2\n}' },
    { label: 'interface', kind: CompletionItemKind.KEYWORD, detail: 'Interface declaration', insertText: 'public interface $1 {\n\t$2\n}' },
    { label: 'void', kind: CompletionItemKind.KEYWORD, detail: 'Void return type' },
    { label: 'main', kind: CompletionItemKind.SNIPPET, detail: 'Main method', insertText: 'public static void main(String[] args) {\n\t$1\n}' },
    { label: 'System.out.println', kind: CompletionItemKind.METHOD, detail: 'Print line', insertText: 'System.out.println($1);' },
    { label: 'System.out.print', kind: CompletionItemKind.METHOD, detail: 'Print', insertText: 'System.out.print($1);' },
    { label: 'if', kind: CompletionItemKind.KEYWORD, detail: 'If statement', insertText: 'if ($1) {\n\t$2\n}' },
    { label: 'for', kind: CompletionItemKind.KEYWORD, detail: 'For loop', insertText: 'for (int $1 = 0; $1 < $2; $1++) {\n\t$3\n}' },
    { label: 'foreach', kind: CompletionItemKind.SNIPPET, detail: 'Enhanced for', insertText: 'for ($1 $2 : $3) {\n\t$4\n}' },
    { label: 'while', kind: CompletionItemKind.KEYWORD, detail: 'While loop', insertText: 'while ($1) {\n\t$2\n}' },
    { label: 'try', kind: CompletionItemKind.KEYWORD, detail: 'Try-catch', insertText: 'try {\n\t$1\n} catch (Exception e) {\n\t$2\n}' },
    { label: 'switch', kind: CompletionItemKind.KEYWORD, detail: 'Switch statement', insertText: 'switch ($1) {\n\tcase $2:\n\t\t$3\n\t\tbreak;\n\tdefault:\n\t\t$4\n}' },
    { label: 'new', kind: CompletionItemKind.KEYWORD, detail: 'Create instance' },
    { label: 'return', kind: CompletionItemKind.KEYWORD, detail: 'Return statement' },
    { label: 'import', kind: CompletionItemKind.KEYWORD, detail: 'Import statement' },
    { label: 'package', kind: CompletionItemKind.KEYWORD, detail: 'Package declaration' },
    { label: 'extends', kind: CompletionItemKind.KEYWORD, detail: 'Inheritance' },
    { label: 'implements', kind: CompletionItemKind.KEYWORD, detail: 'Interface implementation' },
    { label: 'String', kind: CompletionItemKind.CLASS, detail: 'String class' },
    { label: 'Integer', kind: CompletionItemKind.CLASS, detail: 'Integer wrapper' },
    { label: 'ArrayList', kind: CompletionItemKind.CLASS, detail: 'ArrayList class', insertText: 'ArrayList<$1> $2 = new ArrayList<>();' },
    { label: 'HashMap', kind: CompletionItemKind.CLASS, detail: 'HashMap class', insertText: 'HashMap<$1, $2> $3 = new HashMap<>();' },
    { label: 'Scanner', kind: CompletionItemKind.CLASS, detail: 'Scanner class', insertText: 'Scanner $1 = new Scanner(System.in);' },
  ],
};

// Simple local diagnostics (syntax checking)
const checkSyntax = (code, language) => {
  const diagnostics = [];
  const lines = code.split('\n');

  if (language === 'javascript') {
    // Check for common JS issues
    lines.forEach((line, index) => {
      // Unclosed brackets
      const openBrackets = (line.match(/\{/g) || []).length;
      const closeBrackets = (line.match(/\}/g) || []).length;
      
      // Check for console.log without parentheses
      if (/console\.log\s+[^(]/.test(line)) {
        diagnostics.push({
          range: { start: { line: index, character: 0 }, end: { line: index, character: line.length } },
          severity: DiagnosticSeverity.ERROR,
          message: 'console.log requires parentheses',
          source: 'syntax-check',
        });
      }
      
      // Check for missing semicolons (basic)
      if (line.trim() && 
          !line.trim().endsWith(';') && 
          !line.trim().endsWith('{') && 
          !line.trim().endsWith('}') &&
          !line.trim().endsWith(',') &&
          !line.trim().startsWith('//') &&
          !line.trim().startsWith('/*') &&
          !line.trim().startsWith('*') &&
          !line.trim().startsWith('if') &&
          !line.trim().startsWith('else') &&
          !line.trim().startsWith('for') &&
          !line.trim().startsWith('while') &&
          !line.trim().startsWith('function') &&
          !line.trim().startsWith('class') &&
          !line.trim().startsWith('import') &&
          !line.trim().startsWith('export') &&
          line.trim().length > 0) {
        // This is a hint, not an error
        diagnostics.push({
          range: { start: { line: index, character: line.length }, end: { line: index, character: line.length } },
          severity: DiagnosticSeverity.HINT,
          message: 'Consider adding a semicolon',
          source: 'style-check',
        });
      }
    });
  }

  if (language === 'python') {
    lines.forEach((line, index) => {
      // Check for tabs vs spaces consistency
      if (line.startsWith('\t') && code.includes('    ')) {
        diagnostics.push({
          range: { start: { line: index, character: 0 }, end: { line: index, character: 1 } },
          severity: DiagnosticSeverity.WARNING,
          message: 'Mixed tabs and spaces',
          source: 'style-check',
        });
      }
      
      // Check for missing colon after if/for/while/def/class
      if (/^\s*(if|for|while|def|class|elif|else|try|except|finally|with)\s+[^:]+$/.test(line) && !line.trim().endsWith(':')) {
        diagnostics.push({
          range: { start: { line: index, character: line.length }, end: { line: index, character: line.length } },
          severity: DiagnosticSeverity.ERROR,
          message: 'Missing colon after statement',
          source: 'syntax-check',
        });
      }
    });
  }

  return diagnostics;
};

export const useLSP = (language, content, socket) => {
  const [diagnostics, setDiagnostics] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const debounceTimer = useRef(null);

  // Update diagnostics when content changes
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const newDiagnostics = checkSyntax(content, language);
      setDiagnostics(newDiagnostics);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [content, language]);

  // Get completions at position
  const getCompletions = useCallback((position, prefix = '') => {
    const completions = builtinCompletions[language] || [];
    
    if (!prefix) return completions;
    
    return completions.filter(item => 
      item.label.toLowerCase().startsWith(prefix.toLowerCase())
    );
  }, [language]);

  // Get hover information
  const getHover = useCallback((word) => {
    const completions = builtinCompletions[language] || [];
    const item = completions.find(c => c.label === word || c.label.endsWith('.' + word));
    
    if (item) {
      return {
        contents: {
          kind: 'markdown',
          value: `**${item.label}**\n\n${item.detail || ''}`,
        },
      };
    }
    
    return null;
  }, [language]);

  // Get definition (mock - would need real LSP server)
  const getDefinition = useCallback((word, content) => {
    // Search for function/class definition in content
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // JavaScript/TypeScript
      if (language === 'javascript') {
        if (new RegExp(`function\\s+${word}\\s*\\(`).test(line) ||
            new RegExp(`const\\s+${word}\\s*=`).test(line) ||
            new RegExp(`let\\s+${word}\\s*=`).test(line) ||
            new RegExp(`class\\s+${word}`).test(line)) {
          return { line: i, character: line.indexOf(word) };
        }
      }
      
      // Python
      if (language === 'python') {
        if (new RegExp(`def\\s+${word}\\s*\\(`).test(line) ||
            new RegExp(`class\\s+${word}`).test(line) ||
            new RegExp(`${word}\\s*=`).test(line)) {
          return { line: i, character: line.indexOf(word) };
        }
      }
      
      // Java
      if (language === 'java') {
        if (new RegExp(`(public|private|protected)?\\s*(static)?\\s*\\w+\\s+${word}\\s*\\(`).test(line) ||
            new RegExp(`class\\s+${word}`).test(line)) {
          return { line: i, character: line.indexOf(word) };
        }
      }
    }
    
    return null;
  }, [language]);

  // Find references
  const findReferences = useCallback((word, content) => {
    const references = [];
    const lines = content.split('\n');
    const wordRegex = new RegExp(`\\b${word}\\b`, 'g');
    
    lines.forEach((line, lineNum) => {
      let match;
      while ((match = wordRegex.exec(line)) !== null) {
        references.push({
          line: lineNum,
          character: match.index,
          length: word.length,
        });
      }
    });
    
    return references;
  }, []);

  // Format document (basic indentation fix)
  const formatDocument = useCallback((content) => {
    const lines = content.split('\n');
    let indentLevel = 0;
    const indentSize = language === 'python' ? 4 : 2;
    const indent = language === 'python' ? '    ' : '  ';
    
    return lines.map(line => {
      const trimmed = line.trim();
      
      // Decrease indent for closing braces
      if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // For Python, handle dedent keywords
      if (language === 'python' && /^(elif|else|except|finally)/.test(trimmed)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const indented = indent.repeat(indentLevel) + trimmed;
      
      // Increase indent for opening braces or colons
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
        indentLevel++;
      }
      
      // For Python, increase indent after colons
      if (language === 'python' && trimmed.endsWith(':')) {
        indentLevel++;
      }
      
      return indented;
    }).join('\n');
  }, [language]);

  // Get document symbols (outline)
  const getDocumentSymbols = useCallback((content) => {
    const symbols = [];
    const lines = content.split('\n');
    
    lines.forEach((line, lineNum) => {
      // JavaScript functions
      if (language === 'javascript') {
        const funcMatch = line.match(/(?:function|const|let|var)\s+(\w+)\s*(?:=\s*(?:async\s*)?\(|=\s*function|\()/);
        if (funcMatch) {
          symbols.push({
            name: funcMatch[1],
            kind: SymbolKind.FUNCTION,
            range: { start: { line: lineNum, character: 0 }, end: { line: lineNum, character: line.length } },
          });
        }
        
        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch) {
          symbols.push({
            name: classMatch[1],
            kind: SymbolKind.CLASS,
            range: { start: { line: lineNum, character: 0 }, end: { line: lineNum, character: line.length } },
          });
        }
      }
      
      // Python functions and classes
      if (language === 'python') {
        const defMatch = line.match(/def\s+(\w+)\s*\(/);
        if (defMatch) {
          symbols.push({
            name: defMatch[1],
            kind: SymbolKind.FUNCTION,
            range: { start: { line: lineNum, character: 0 }, end: { line: lineNum, character: line.length } },
          });
        }
        
        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch) {
          symbols.push({
            name: classMatch[1],
            kind: SymbolKind.CLASS,
            range: { start: { line: lineNum, character: 0 }, end: { line: lineNum, character: line.length } },
          });
        }
      }
      
      // Java
      if (language === 'java') {
        const methodMatch = line.match(/(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/);
        if (methodMatch && !['if', 'for', 'while', 'switch'].includes(methodMatch[1])) {
          symbols.push({
            name: methodMatch[1],
            kind: SymbolKind.METHOD,
            range: { start: { line: lineNum, character: 0 }, end: { line: lineNum, character: line.length } },
          });
        }
        
        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch) {
          symbols.push({
            name: classMatch[1],
            kind: SymbolKind.CLASS,
            range: { start: { line: lineNum, character: 0 }, end: { line: lineNum, character: line.length } },
          });
        }
      }
    });
    
    return symbols;
  }, [language]);

  // Get signature help
  const getSignatureHelp = useCallback((content, position) => {
    // Find the current function call context
    const lines = content.split('\n');
    const currentLine = lines[position.line] || '';
    const beforeCursor = currentLine.substring(0, position.character);
    
    // Find the function name before the opening paren
    const funcMatch = beforeCursor.match(/(\w+)\s*\([^)]*$/);
    if (!funcMatch) return null;
    
    const funcName = funcMatch[1];
    const completions = builtinCompletions[language] || [];
    const func = completions.find(c => c.label === funcName || c.label.endsWith('.' + funcName));
    
    if (func && func.insertText) {
      return {
        signatures: [{
          label: func.insertText.replace(/\$\d/g, '').replace(/\n/g, ' '),
          documentation: func.detail,
        }],
        activeSignature: 0,
        activeParameter: (beforeCursor.match(/,/g) || []).length,
      };
    }
    
    return null;
  }, [language]);

  return {
    diagnostics,
    isConnected,
    getCompletions,
    getHover,
    getDefinition,
    findReferences,
    formatDocument,
    getDocumentSymbols,
    getSignatureHelp,
  };
};

export default useLSP;
