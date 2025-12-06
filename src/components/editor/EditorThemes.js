/**
 * Editor Themes - VS Code compatible themes
 * Provides 7+ themes with custom theme support
 */

import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// ==========================================
// THEME: VS Code Dark+ (Default Dark)
// ==========================================
export const vscodeDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
  },
  '.cm-content': {
    caretColor: '#aeafad',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#aeafad',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#264f78',
  },
  '.cm-panels': {
    backgroundColor: '#252526',
    color: '#cccccc',
  },
  '.cm-panels.cm-panels-top': {
    borderBottom: '1px solid #3c3c3c',
  },
  '.cm-panels.cm-panels-bottom': {
    borderTop: '1px solid #3c3c3c',
  },
  '.cm-searchMatch': {
    backgroundColor: '#515c6a',
    outline: '1px solid #74879f',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#613214',
  },
  '.cm-activeLine': {
    backgroundColor: '#2c2c2c',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#add6ff26',
  },
  '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
    backgroundColor: '#bad0f847',
    outline: '1px solid #888',
  },
  '.cm-gutters': {
    backgroundColor: '#1e1e1e',
    color: '#858585',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#2c2c2c',
    color: '#c6c6c6',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6a9955',
  },
  '.cm-tooltip': {
    backgroundColor: '#252526',
    border: '1px solid #454545',
  },
  '.cm-tooltip .cm-tooltip-arrow:before': {
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  '.cm-tooltip .cm-tooltip-arrow:after': {
    borderTopColor: '#252526',
    borderBottomColor: '#252526',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#04395e',
      color: '#fff',
    },
  },
  '.cm-line': {
    padding: '0 4px',
  },
}, { dark: true });

const vscodeDarkHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#569cd6' },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: '#9cdcfe' },
  { tag: [t.function(t.variableName), t.labelName], color: '#dcdcaa' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#569cd6' },
  { tag: [t.definition(t.name), t.separator], color: '#d4d4d4' },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#4ec9b0' },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#d4d4d4' },
  { tag: [t.meta, t.comment], color: '#6a9955' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#569cd6', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#569cd6' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#569cd6' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#ce9178' },
  { tag: t.invalid, color: '#f44747' },
]);

export const vscodeDark = [vscodeDarkTheme, syntaxHighlighting(vscodeDarkHighlight)];

// ==========================================
// THEME: VS Code Light+ (Default Light)
// ==========================================
export const vscodeLightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  '.cm-content': {
    caretColor: '#000000',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#000000',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#add6ff',
  },
  '.cm-panels': {
    backgroundColor: '#f3f3f3',
    color: '#333',
  },
  '.cm-searchMatch': {
    backgroundColor: '#ea5c0055',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#ea5c00aa',
  },
  '.cm-activeLine': {
    backgroundColor: '#fff8dc',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#add6ff80',
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: '#bad0f847',
    outline: '1px solid #888',
  },
  '.cm-gutters': {
    backgroundColor: '#f7f7f7',
    color: '#237893',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#fff8dc',
  },
  '.cm-tooltip': {
    backgroundColor: '#f3f3f3',
    border: '1px solid #c8c8c8',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#0074d9',
      color: '#fff',
    },
  },
}, { dark: false });

const vscodeLightHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#0000ff' },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: '#001080' },
  { tag: [t.function(t.variableName), t.labelName], color: '#795e26' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#0000ff' },
  { tag: [t.definition(t.name), t.separator], color: '#000000' },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#267f99' },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#000000' },
  { tag: [t.meta, t.comment], color: '#008000' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#0000ff' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#a31515' },
  { tag: t.invalid, color: '#cd3131' },
]);

export const vscodeLight = [vscodeLightTheme, syntaxHighlighting(vscodeLightHighlight)];

// ==========================================
// THEME: Dracula
// ==========================================
export const draculaTheme = EditorView.theme({
  '&': {
    backgroundColor: '#282a36',
    color: '#f8f8f2',
  },
  '.cm-content': {
    caretColor: '#f8f8f0',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#f8f8f0',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#44475a',
  },
  '.cm-panels': {
    backgroundColor: '#21222c',
    color: '#f8f8f2',
  },
  '.cm-searchMatch': {
    backgroundColor: '#50fa7b33',
    outline: '1px solid #50fa7b',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#ffb86c33',
  },
  '.cm-activeLine': {
    backgroundColor: '#44475a50',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#44475a',
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: '#44475a',
    outline: '1px solid #f8f8f2',
  },
  '.cm-gutters': {
    backgroundColor: '#282a36',
    color: '#6272a4',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#44475a50',
    color: '#f8f8f2',
  },
  '.cm-tooltip': {
    backgroundColor: '#21222c',
    border: '1px solid #44475a',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#44475a',
      color: '#f8f8f2',
    },
  },
}, { dark: true });

const draculaHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#ff79c6' },
  { tag: [t.name, t.deleted, t.character, t.macroName], color: '#f8f8f2' },
  { tag: [t.propertyName], color: '#66d9ef' },
  { tag: [t.function(t.variableName), t.labelName], color: '#50fa7b' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#bd93f9' },
  { tag: [t.definition(t.name), t.separator], color: '#f8f8f2' },
  { tag: [t.typeName, t.className, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#8be9fd' },
  { tag: [t.number], color: '#bd93f9' },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#ff79c6' },
  { tag: [t.meta, t.comment], color: '#6272a4' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#bd93f9' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#f1fa8c' },
  { tag: t.invalid, color: '#ff5555' },
]);

export const dracula = [draculaTheme, syntaxHighlighting(draculaHighlight)];

// ==========================================
// THEME: One Dark Pro
// ==========================================
export const oneDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#282c34',
    color: '#abb2bf',
  },
  '.cm-content': {
    caretColor: '#528bff',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#528bff',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#3e4451',
  },
  '.cm-panels': {
    backgroundColor: '#21252b',
    color: '#abb2bf',
  },
  '.cm-searchMatch': {
    backgroundColor: '#314365',
    outline: '1px solid #528bff',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#314365',
  },
  '.cm-activeLine': {
    backgroundColor: '#2c313a',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#3e4451',
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: '#515a6b',
    outline: '1px solid #528bff',
  },
  '.cm-gutters': {
    backgroundColor: '#282c34',
    color: '#4b5263',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#2c313a',
    color: '#abb2bf',
  },
  '.cm-tooltip': {
    backgroundColor: '#21252b',
    border: '1px solid #181a1f',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#2c313a',
      color: '#abb2bf',
    },
  },
}, { dark: true });

const oneDarkHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#c678dd' },
  { tag: [t.name, t.deleted, t.character, t.macroName], color: '#e06c75' },
  { tag: [t.propertyName], color: '#e06c75' },
  { tag: [t.function(t.variableName), t.labelName], color: '#61afef' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#d19a66' },
  { tag: [t.definition(t.name), t.separator], color: '#abb2bf' },
  { tag: [t.typeName, t.className, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#e5c07b' },
  { tag: [t.number], color: '#d19a66' },
  { tag: [t.operator, t.operatorKeyword], color: '#56b6c2' },
  { tag: [t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#56b6c2' },
  { tag: [t.meta, t.comment], color: '#5c6370', fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#d19a66' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#98c379' },
  { tag: t.invalid, color: '#ffffff', backgroundColor: '#e06c75' },
]);

export const oneDark = [oneDarkTheme, syntaxHighlighting(oneDarkHighlight)];

// ==========================================
// THEME: Solarized Dark
// ==========================================
export const solarizedDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#002b36',
    color: '#839496',
  },
  '.cm-content': {
    caretColor: '#839496',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#839496',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#073642',
  },
  '.cm-panels': {
    backgroundColor: '#00212b',
    color: '#839496',
  },
  '.cm-searchMatch': {
    backgroundColor: '#2aa19855',
    outline: '1px solid #2aa198',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#cb4b1655',
  },
  '.cm-activeLine': {
    backgroundColor: '#073642',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#073642',
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: '#073642',
    outline: '1px solid #93a1a1',
  },
  '.cm-gutters': {
    backgroundColor: '#002b36',
    color: '#586e75',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#073642',
    color: '#93a1a1',
  },
  '.cm-tooltip': {
    backgroundColor: '#00212b',
    border: '1px solid #073642',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#073642',
      color: '#93a1a1',
    },
  },
}, { dark: true });

const solarizedDarkHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#859900' },
  { tag: [t.name, t.deleted, t.character, t.macroName], color: '#839496' },
  { tag: [t.propertyName], color: '#268bd2' },
  { tag: [t.function(t.variableName), t.labelName], color: '#268bd2' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#cb4b16' },
  { tag: [t.definition(t.name), t.separator], color: '#839496' },
  { tag: [t.typeName, t.className, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#b58900' },
  { tag: [t.number], color: '#d33682' },
  { tag: [t.operator, t.operatorKeyword], color: '#859900' },
  { tag: [t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#cb4b16' },
  { tag: [t.meta, t.comment], color: '#586e75', fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#cb4b16' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#2aa198' },
  { tag: t.invalid, color: '#dc322f' },
]);

export const solarizedDark = [solarizedDarkTheme, syntaxHighlighting(solarizedDarkHighlight)];

// ==========================================
// THEME: High Contrast
// ==========================================
export const highContrastTheme = EditorView.theme({
  '&': {
    backgroundColor: '#000000',
    color: '#ffffff',
  },
  '.cm-content': {
    caretColor: '#ffffff',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#ffffff',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#264f78',
  },
  '.cm-panels': {
    backgroundColor: '#000000',
    color: '#ffffff',
  },
  '.cm-searchMatch': {
    backgroundColor: '#515c6a',
    outline: '2px solid #f38518',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#613214',
    outline: '2px solid #ffffff',
  },
  '.cm-activeLine': {
    backgroundColor: '#1a1a1a',
    outline: '1px solid #6fc3df',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#515c6a',
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: '#000000',
    outline: '2px solid #ffff00',
  },
  '.cm-gutters': {
    backgroundColor: '#000000',
    color: '#ffffff',
    border: '1px solid #6fc3df',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
  },
  '.cm-tooltip': {
    backgroundColor: '#000000',
    border: '2px solid #6fc3df',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#0078d4',
      color: '#ffffff',
    },
  },
}, { dark: true });

const highContrastHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#569cd6', fontWeight: 'bold' },
  { tag: [t.name, t.deleted, t.character, t.macroName], color: '#9cdcfe' },
  { tag: [t.propertyName], color: '#9cdcfe' },
  { tag: [t.function(t.variableName), t.labelName], color: '#dcdcaa' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#4fc1ff' },
  { tag: [t.definition(t.name), t.separator], color: '#ffffff' },
  { tag: [t.typeName, t.className, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#4ec9b0' },
  { tag: [t.number], color: '#b5cea8' },
  { tag: [t.operator, t.operatorKeyword], color: '#d4d4d4' },
  { tag: [t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#d16969' },
  { tag: [t.meta, t.comment], color: '#7ca668' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#569cd6' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#ce9178' },
  { tag: t.invalid, color: '#f44747', fontWeight: 'bold' },
]);

export const highContrast = [highContrastTheme, syntaxHighlighting(highContrastHighlight)];

// ==========================================
// THEME: GitHub Dark
// ==========================================
export const githubDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
  },
  '.cm-content': {
    caretColor: '#c9d1d9',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#c9d1d9',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#264f78',
  },
  '.cm-panels': {
    backgroundColor: '#161b22',
    color: '#c9d1d9',
  },
  '.cm-searchMatch': {
    backgroundColor: '#58a6ff33',
    outline: '1px solid #58a6ff',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#3fb95033',
  },
  '.cm-activeLine': {
    backgroundColor: '#161b22',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#3fb95033',
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: '#3fb95033',
    outline: '1px solid #3fb950',
  },
  '.cm-gutters': {
    backgroundColor: '#0d1117',
    color: '#484f58',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#161b22',
    color: '#c9d1d9',
  },
  '.cm-tooltip': {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#388bfd26',
      color: '#c9d1d9',
    },
  },
}, { dark: true });

const githubDarkHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#ff7b72' },
  { tag: [t.name, t.deleted, t.character, t.macroName], color: '#c9d1d9' },
  { tag: [t.propertyName], color: '#79c0ff' },
  { tag: [t.function(t.variableName), t.labelName], color: '#d2a8ff' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#79c0ff' },
  { tag: [t.definition(t.name), t.separator], color: '#c9d1d9' },
  { tag: [t.typeName, t.className, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#ffa657' },
  { tag: [t.number], color: '#79c0ff' },
  { tag: [t.operator, t.operatorKeyword], color: '#ff7b72' },
  { tag: [t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#a5d6ff' },
  { tag: [t.meta, t.comment], color: '#8b949e' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#79c0ff' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#a5d6ff' },
  { tag: t.invalid, color: '#f85149' },
]);

export const githubDark = [githubDarkTheme, syntaxHighlighting(githubDarkHighlight)];

// ==========================================
// THEME: Monokai
// ==========================================
export const monokaiTheme = EditorView.theme({
  '&': {
    backgroundColor: '#272822',
    color: '#f8f8f2',
  },
  '.cm-content': {
    caretColor: '#f8f8f0',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#f8f8f0',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#49483e',
  },
  '.cm-panels': {
    backgroundColor: '#1e1f1c',
    color: '#f8f8f2',
  },
  '.cm-searchMatch': {
    backgroundColor: '#ffe79233',
    outline: '1px solid #e6db74',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#fd971f33',
  },
  '.cm-activeLine': {
    backgroundColor: '#3e3d32',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#49483e',
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: '#49483e',
    outline: '1px solid #f8f8f2',
  },
  '.cm-gutters': {
    backgroundColor: '#272822',
    color: '#90908a',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#3e3d32',
    color: '#f8f8f2',
  },
  '.cm-tooltip': {
    backgroundColor: '#1e1f1c',
    border: '1px solid #49483e',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#49483e',
      color: '#f8f8f2',
    },
  },
}, { dark: true });

const monokaiHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#f92672' },
  { tag: [t.name, t.deleted, t.character, t.macroName], color: '#f8f8f2' },
  { tag: [t.propertyName], color: '#66d9ef' },
  { tag: [t.function(t.variableName), t.labelName], color: '#a6e22e' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#66d9ef' },
  { tag: [t.definition(t.name), t.separator], color: '#f8f8f2' },
  { tag: [t.typeName, t.className, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#a6e22e', fontStyle: 'italic' },
  { tag: [t.number], color: '#ae81ff' },
  { tag: [t.operator, t.operatorKeyword], color: '#f92672' },
  { tag: [t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#fd971f' },
  { tag: [t.meta, t.comment], color: '#75715e' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#ae81ff' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#e6db74' },
  { tag: t.invalid, color: '#f8f8f0', backgroundColor: '#f92672' },
]);

export const monokai = [monokaiTheme, syntaxHighlighting(monokaiHighlight)];

// ==========================================
// All Themes Export
// ==========================================
export const themes = {
  'dark': { name: 'Dark+ (Default Dark)', extension: vscodeDark, isDark: true },
  'light': { name: 'Light+ (Default Light)', extension: vscodeLight, isDark: false },
  'vs-dark': { name: 'Dark+ (Default Dark)', extension: vscodeDark, isDark: true },
  'vs-light': { name: 'Light+ (Default Light)', extension: vscodeLight, isDark: false },
  'dracula': { name: 'Dracula', extension: dracula, isDark: true },
  'one-dark': { name: 'One Dark Pro', extension: oneDark, isDark: true },
  'solarized-dark': { name: 'Solarized Dark', extension: solarizedDark, isDark: true },
  'high-contrast': { name: 'High Contrast', extension: highContrast, isDark: true },
  'github-dark': { name: 'GitHub Dark', extension: githubDark, isDark: true },
  'monokai': { name: 'Monokai', extension: monokai, isDark: true },
};

export const getTheme = (themeName) => {
  return themes[themeName] || themes['dark'];
};

export const getThemeByName = (themeName) => {
  return themes[themeName] || themes['dark'];
};

export const getThemeList = () => {
  return Object.entries(themes).map(([id, info]) => ({
    id,
    name: info.name,
    isDark: info.isDark,
  }));
};

/**
 * Create a custom theme
 * @param {Object} colors - Color configuration for the theme
 * @returns {Array} CodeMirror theme extensions
 */
export const createCustomTheme = (colors = {}) => {
  const defaultColors = {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    selection: '#264f78',
    cursor: '#aeafad',
    gutterBackground: '#1e1e1e',
    gutterForeground: '#858585',
    lineHighlight: '#2c2c2c',
    ...colors,
  };

  const customTheme = EditorView.theme({
    '&': {
      backgroundColor: defaultColors.background,
      color: defaultColors.foreground,
    },
    '.cm-content': {
      caretColor: defaultColors.cursor,
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: defaultColors.cursor,
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: defaultColors.selection,
    },
    '.cm-activeLine': {
      backgroundColor: defaultColors.lineHighlight,
    },
    '.cm-gutters': {
      backgroundColor: defaultColors.gutterBackground,
      color: defaultColors.gutterForeground,
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: defaultColors.lineHighlight,
    },
  }, { dark: true });

  return [customTheme, syntaxHighlighting(vscodeDarkHighlight)];
};

export default themes;
