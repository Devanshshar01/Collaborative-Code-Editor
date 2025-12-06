/**
 * CodeMirror LSP Extension
 * Integrates LSP features with CodeMirror 6 editor
 */

import {
    Decoration,
    DecorationSet,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
    hoverTooltip,
    Tooltip,
    showTooltip,
} from '@codemirror/view';
import {
    StateField,
    StateEffect,
    EditorState,
    Extension,
    Facet,
    RangeSetBuilder,
    Text,
} from '@codemirror/state';
import {
    Diagnostic as CMDiagnostic,
    setDiagnostics,
    linter,
    lintGutter,
} from '@codemirror/lint';
import {
    Completion,
    CompletionContext,
    CompletionResult,
    autocompletion,
    startCompletion,
    completionKeymap,
} from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';

// Types
export interface LSPDiagnostic {
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
    severity?: 1 | 2 | 3 | 4;
    code?: string | number;
    source?: string;
    message: string;
    tags?: number[];
}

export interface LSPCompletionItem {
    label: string;
    labelDetails?: { detail?: string; description?: string };
    kind?: number;
    detail?: string;
    documentation?: string | { kind: string; value: string };
    insertText?: string;
    insertTextFormat?: number;
    textEdit?: { range: any; newText: string };
    additionalTextEdits?: any[];
    sortText?: string;
    filterText?: string;
    preselect?: boolean;
}

export interface LSPHover {
    contents: string | { kind: string; value: string } | string[];
    range?: { start: { line: number; character: number }; end: { line: number; character: number } };
}

export interface LSPSignatureHelp {
    signatures: {
        label: string;
        documentation?: string | { kind: string; value: string };
        parameters?: { label: string | [number, number]; documentation?: string | { kind: string; value: string } }[];
        activeParameter?: number;
    }[];
    activeSignature?: number;
    activeParameter?: number;
}

export interface LSPInlayHint {
    position: { line: number; character: number };
    label: string | { value: string; tooltip?: string }[];
    kind?: 1 | 2;
    paddingLeft?: boolean;
    paddingRight?: boolean;
}

// Facet for LSP client configuration
export interface LSPConfig {
    getCompletions?: (uri: string, pos: { line: number; character: number }, trigger?: string) => Promise<LSPCompletionItem[] | { isIncomplete: boolean; items: LSPCompletionItem[] } | null>;
    getHover?: (uri: string, pos: { line: number; character: number }) => Promise<LSPHover | null>;
    getSignatureHelp?: (uri: string, pos: { line: number; character: number }) => Promise<LSPSignatureHelp | null>;
    getDefinition?: (uri: string, pos: { line: number; character: number }) => Promise<any>;
    getInlayHints?: (uri: string, range: any) => Promise<LSPInlayHint[] | null>;
    uri: string;
    triggerCharacters?: string[];
    signatureTriggerCharacters?: string[];
}

export const lspConfig = Facet.define<LSPConfig, LSPConfig | null>({
    combine: (values) => values[0] || null,
});

// Convert LSP position to CodeMirror offset
function posToOffset(doc: Text, pos: { line: number; character: number }): number {
    if (pos.line >= doc.lines) return doc.length;
    const line = doc.line(pos.line + 1);
    return Math.min(line.from + pos.character, line.to);
}

// Convert CodeMirror offset to LSP position
function offsetToPos(doc: Text, offset: number): { line: number; character: number } {
    const line = doc.lineAt(offset);
    return {
        line: line.number - 1,
        character: offset - line.from,
    };
}

// Severity to CodeMirror diagnostic severity
function severityToLint(severity?: number): 'error' | 'warning' | 'info' | 'hint' {
    switch (severity) {
        case 1: return 'error';
        case 2: return 'warning';
        case 3: return 'info';
        case 4: return 'hint';
        default: return 'error';
    }
}

// CompletionItemKind to Completion type
function kindToType(kind?: number): string {
    const types: Record<number, string> = {
        1: 'text',
        2: 'method',
        3: 'function',
        4: 'constructor',
        5: 'field',
        6: 'variable',
        7: 'class',
        8: 'interface',
        9: 'module',
        10: 'property',
        11: 'unit',
        12: 'value',
        13: 'enum',
        14: 'keyword',
        15: 'snippet',
        16: 'color',
        17: 'file',
        18: 'reference',
        19: 'folder',
        20: 'enum-member',
        21: 'constant',
        22: 'struct',
        23: 'event',
        24: 'operator',
        25: 'type',
    };
    return types[kind || 1] || 'text';
}

// Format documentation content
function formatDocumentation(doc: string | { kind: string; value: string } | undefined): string {
    if (!doc) return '';
    if (typeof doc === 'string') return doc;
    return doc.value;
}

// LSP Diagnostics Effect and Field
export const setLSPDiagnostics = StateEffect.define<LSPDiagnostic[]>();

export const lspDiagnosticsField = StateField.define<CMDiagnostic[]>({
    create: () => [],
    update(diagnostics, tr) {
        for (const effect of tr.effects) {
            if (effect.is(setLSPDiagnostics)) {
                const doc = tr.state.doc;
                return effect.value.map(d => ({
                    from: posToOffset(doc, d.range.start),
                    to: posToOffset(doc, d.range.end),
                    severity: severityToLint(d.severity),
                    message: d.message,
                    source: d.source,
                }));
            }
        }
        return diagnostics;
    },
});

// Diagnostics extension
export function lspLinter(): Extension {
    return [
        lspDiagnosticsField,
        linter((view) => view.state.field(lspDiagnosticsField)),
        lintGutter(),
    ];
}

// Autocomplete extension
export function lspAutocomplete(): Extension {
    return autocompletion({
        override: [
            async (context: CompletionContext): Promise<CompletionResult | null> => {
                const config = context.state.facet(lspConfig);
                if (!config?.getCompletions) return null;

                const pos = offsetToPos(context.state.doc, context.pos);
                
                // Check for trigger character
                let triggerCharacter: string | undefined;
                if (context.explicit) {
                    triggerCharacter = undefined;
                } else {
                    const before = context.matchBefore(/\S/);
                    if (before && config.triggerCharacters?.includes(before.text)) {
                        triggerCharacter = before.text;
                    }
                }

                try {
                    const result = await config.getCompletions(config.uri, pos, triggerCharacter);
                    if (!result) return null;

                    const items = Array.isArray(result) ? result : result.items;
                    if (!items.length) return null;

                    // Find the word being completed
                    const word = context.matchBefore(/[\w$]*/);
                    const from = word?.from ?? context.pos;

                    const completions: Completion[] = items.map(item => ({
                        label: item.label,
                        detail: item.labelDetails?.detail || item.detail,
                        info: formatDocumentation(item.documentation) || undefined,
                        type: kindToType(item.kind),
                        apply: item.insertText || item.textEdit?.newText || item.label,
                        boost: item.preselect ? 99 : (item.sortText ? -parseInt(item.sortText, 10) || 0 : 0),
                    }));

                    return {
                        from,
                        options: completions,
                        validFor: /^[\w$]*$/,
                    };
                } catch (error) {
                    console.error('LSP completion error:', error);
                    return null;
                }
            },
        ],
        activateOnTyping: true,
        maxRenderedOptions: 100,
    });
}

// Hover tooltip extension
export function lspHover(): Extension {
    return hoverTooltip(async (view, pos) => {
        const config = view.state.facet(lspConfig);
        if (!config?.getHover) return null;

        const lspPos = offsetToPos(view.state.doc, pos);

        try {
            const hover = await config.getHover(config.uri, lspPos);
            if (!hover) return null;

            let content: string;
            if (typeof hover.contents === 'string') {
                content = hover.contents;
            } else if (Array.isArray(hover.contents)) {
                content = hover.contents.join('\n\n');
            } else {
                content = hover.contents.value;
            }

            if (!content) return null;

            const from = hover.range
                ? posToOffset(view.state.doc, hover.range.start)
                : pos;
            const to = hover.range
                ? posToOffset(view.state.doc, hover.range.end)
                : pos;

            return {
                pos: from,
                end: to,
                above: true,
                create: () => {
                    const dom = document.createElement('div');
                    dom.className = 'cm-lsp-hover';
                    dom.innerHTML = formatHoverContent(content);
                    return { dom };
                },
            };
        } catch (error) {
            console.error('LSP hover error:', error);
            return null;
        }
    }, { hoverTime: 300 });
}

// Format hover content (basic markdown support)
function formatHoverContent(content: string): string {
    // Basic markdown code block formatting
    content = content.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="cm-lsp-code"><code>$2</code></pre>');
    content = content.replace(/`([^`]+)`/g, '<code class="cm-lsp-inline-code">$1</code>');
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    content = content.replace(/\n/g, '<br>');
    return content;
}

// Inlay Hints
class InlayHintWidget extends WidgetType {
    constructor(
        readonly text: string,
        readonly kind: 'type' | 'parameter',
        readonly paddingLeft: boolean,
        readonly paddingRight: boolean
    ) {
        super();
    }

    eq(other: InlayHintWidget): boolean {
        return this.text === other.text && this.kind === other.kind;
    }

    toDOM(): HTMLElement {
        const span = document.createElement('span');
        span.className = `cm-inlay-hint cm-inlay-hint-${this.kind}`;
        span.textContent = this.text;
        if (this.paddingLeft) span.style.marginLeft = '4px';
        if (this.paddingRight) span.style.marginRight = '4px';
        return span;
    }

    ignoreEvent(): boolean {
        return false;
    }
}

export const setInlayHints = StateEffect.define<LSPInlayHint[]>();

const inlayHintsField = StateField.define<DecorationSet>({
    create: () => Decoration.none,
    update(hints, tr) {
        for (const effect of tr.effects) {
            if (effect.is(setInlayHints)) {
                const builder = new RangeSetBuilder<Decoration>();
                const doc = tr.state.doc;

                // Sort hints by position
                const sortedHints = [...effect.value].sort((a, b) => {
                    if (a.position.line !== b.position.line) {
                        return a.position.line - b.position.line;
                    }
                    return a.position.character - b.position.character;
                });

                for (const hint of sortedHints) {
                    const pos = posToOffset(doc, hint.position);
                    const text = typeof hint.label === 'string'
                        ? hint.label
                        : hint.label.map(p => p.value).join('');
                    const kind = hint.kind === 2 ? 'parameter' : 'type';

                    builder.add(
                        pos,
                        pos,
                        Decoration.widget({
                            widget: new InlayHintWidget(text, kind, hint.paddingLeft || false, hint.paddingRight || false),
                            side: 1,
                        })
                    );
                }

                return builder.finish();
            }
        }
        return hints.map(tr.changes);
    },
    provide: (field) => EditorView.decorations.from(field),
});

export function lspInlayHints(): Extension {
    return inlayHintsField;
}

// Signature Help tooltip
export const signatureHelpTooltipField = StateField.define<Tooltip | null>({
    create: () => null,
    update(tooltip, tr) {
        // Keep tooltip unless document changed significantly
        if (tr.docChanged) return null;
        return tooltip;
    },
    provide: (field) => showTooltip.from(field),
});

export const setSignatureHelp = StateEffect.define<{ pos: number; help: LSPSignatureHelp } | null>();

export function lspSignatureHelp(): Extension {
    return [
        signatureHelpTooltipField,
        EditorView.updateListener.of((update) => {
            // Trigger signature help on typing '(' or ','
            if (update.docChanged && update.transactions.some(tr => tr.isUserEvent('input.type'))) {
                const config = update.state.facet(lspConfig);
                if (!config?.getSignatureHelp || !config.signatureTriggerCharacters) return;

                const pos = update.state.selection.main.head;
                if (pos > 0) {
                    const char = update.state.sliceDoc(pos - 1, pos);
                    if (config.signatureTriggerCharacters.includes(char)) {
                        // Fetch signature help
                        const lspPos = offsetToPos(update.state.doc, pos);
                        config.getSignatureHelp(config.uri, lspPos).then(help => {
                            if (help && help.signatures.length > 0) {
                                // Update state with signature help
                                update.view.dispatch({
                                    effects: setSignatureHelp.of({ pos, help }),
                                });
                            }
                        }).catch(console.error);
                    }
                }
            }
        }),
    ];
}

// Go to Definition keymap
export function lspGoToDefinition(): Extension {
    return keymap.of([
        {
            key: 'F12',
            run: (view) => {
                const config = view.state.facet(lspConfig);
                if (!config?.getDefinition) return false;

                const pos = offsetToPos(view.state.doc, view.state.selection.main.head);
                config.getDefinition(config.uri, pos).then(result => {
                    if (result) {
                        // Emit custom event for handling navigation
                        view.dom.dispatchEvent(new CustomEvent('lsp-goto-definition', {
                            detail: { result },
                            bubbles: true,
                        }));
                    }
                }).catch(console.error);

                return true;
            },
        },
        {
            key: 'Mod-Click',
            run: (view) => {
                // Handle Ctrl/Cmd+Click for go to definition
                return false;
            },
        },
    ]);
}

// Combined LSP extension
export function lspExtension(config: LSPConfig): Extension {
    return [
        lspConfig.of(config),
        lspLinter(),
        lspAutocomplete(),
        lspHover(),
        lspInlayHints(),
        lspSignatureHelp(),
        lspGoToDefinition(),
        lspTheme,
    ];
}

// Theme for LSP features
export const lspTheme = EditorView.theme({
    '.cm-lsp-hover': {
        backgroundColor: '#1e1e1e',
        border: '1px solid #454545',
        borderRadius: '4px',
        padding: '8px 12px',
        maxWidth: '600px',
        maxHeight: '300px',
        overflow: 'auto',
        fontSize: '13px',
        lineHeight: '1.5',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#d4d4d4',
    },
    '.cm-lsp-code': {
        backgroundColor: '#2d2d2d',
        padding: '8px',
        borderRadius: '4px',
        overflow: 'auto',
        margin: '4px 0',
    },
    '.cm-lsp-inline-code': {
        backgroundColor: '#2d2d2d',
        padding: '2px 4px',
        borderRadius: '3px',
    },
    '.cm-inlay-hint': {
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        border: '1px solid rgba(150, 150, 150, 0.2)',
        borderRadius: '3px',
        padding: '0 4px',
        fontSize: '0.85em',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#9cdcfe',
        verticalAlign: 'middle',
    },
    '.cm-inlay-hint-type': {
        color: '#4ec9b0',
    },
    '.cm-inlay-hint-parameter': {
        color: '#9cdcfe',
    },
    '.cm-tooltip.cm-tooltip-autocomplete': {
        backgroundColor: '#252526',
        border: '1px solid #454545',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul': {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '13px',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
        padding: '4px 8px',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
        backgroundColor: '#04395e',
    },
    '.cm-completionIcon': {
        width: '16px',
        marginRight: '4px',
    },
    '.cm-diagnostic': {
        paddingLeft: '4px',
        borderLeft: '3px solid',
    },
    '.cm-diagnostic-error': {
        borderLeftColor: '#f14c4c',
        backgroundColor: 'rgba(241, 76, 76, 0.1)',
    },
    '.cm-diagnostic-warning': {
        borderLeftColor: '#cca700',
        backgroundColor: 'rgba(204, 167, 0, 0.1)',
    },
    '.cm-diagnostic-info': {
        borderLeftColor: '#3794ff',
        backgroundColor: 'rgba(55, 148, 255, 0.1)',
    },
    '.cm-diagnostic-hint': {
        borderLeftColor: '#89d185',
        backgroundColor: 'rgba(137, 209, 133, 0.1)',
    },
});

export default lspExtension;
