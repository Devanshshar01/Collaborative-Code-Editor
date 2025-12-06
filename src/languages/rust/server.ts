/**
 * Language Server Configurations
 * Rust - rust-analyzer language server
 */

import { LanguageServerConfig, LSPLanguage } from '../../types/lsp';

// Rust - rust-analyzer language server
export const rustConfig: LanguageServerConfig = {
    language: LSPLanguage.RUST,
    serverCommand: ['rust-analyzer'],
    serverArgs: [],
    documentSelector: ['rust'],
    triggerCharacters: ['.', ':', '<', '"', '/'],
    signatureTriggerCharacters: ['(', ',', '<'],
    dockerImage: 'lsp-server-rust',
    initializationOptions: {
        cargo: {
            allFeatures: true,
            loadOutDirsFromCheck: true,
            runBuildScripts: true,
        },
        checkOnSave: {
            allFeatures: true,
            command: 'clippy',
        },
        procMacro: {
            enable: true,
            attributes: {
                enable: true,
            },
        },
        inlayHints: {
            bindingModeHints: {
                enable: true,
            },
            chainingHints: {
                enable: true,
            },
            closingBraceHints: {
                enable: true,
                minLines: 25,
            },
            closureReturnTypeHints: {
                enable: 'always',
            },
            lifetimeElisionHints: {
                enable: 'always',
                useParameterNames: true,
            },
            maxLength: 25,
            parameterHints: {
                enable: true,
            },
            reborrowHints: {
                enable: 'always',
            },
            renderColons: true,
            typeHints: {
                enable: true,
                hideClosureInitialization: false,
                hideNamedConstructor: false,
            },
        },
        lens: {
            enable: true,
            debug: {
                enable: true,
            },
            implementations: {
                enable: true,
            },
            references: {
                adt: {
                    enable: true,
                },
                enumVariant: {
                    enable: true,
                },
                method: {
                    enable: true,
                },
                trait: {
                    enable: true,
                },
            },
            run: {
                enable: true,
            },
        },
        completion: {
            autoimport: {
                enable: true,
            },
            autoself: {
                enable: true,
            },
            postfix: {
                enable: true,
            },
            privateEditable: {
                enable: true,
            },
            snippets: {
                custom: {
                    'Arc::new': {
                        postfix: 'arc',
                        body: 'Arc::new(${receiver})',
                        requires: 'std::sync::Arc',
                        scope: 'expr',
                    },
                    'Rc::new': {
                        postfix: 'rc',
                        body: 'Rc::new(${receiver})',
                        requires: 'std::rc::Rc',
                        scope: 'expr',
                    },
                    'Box::pin': {
                        postfix: 'pinbox',
                        body: 'Box::pin(${receiver})',
                        requires: 'std::boxed::Box',
                        scope: 'expr',
                    },
                },
            },
        },
        diagnostics: {
            enable: true,
            experimental: {
                enable: true,
            },
        },
        hover: {
            actions: {
                debug: {
                    enable: true,
                },
                enable: true,
                gotoTypeDef: {
                    enable: true,
                },
                implementations: {
                    enable: true,
                },
                references: {
                    enable: true,
                },
                run: {
                    enable: true,
                },
            },
            documentation: {
                enable: true,
                keywords: {
                    enable: true,
                },
            },
            links: {
                enable: true,
            },
        },
        semanticHighlighting: {
            operator: {
                specialization: {
                    enable: true,
                },
            },
            punctuation: {
                enable: true,
                separate: {
                    macro: {
                        bang: true,
                    },
                },
                specialization: {
                    enable: true,
                },
            },
            strings: {
                enable: true,
            },
        },
    },
    installCommands: [
        'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y',
        'rustup component add rust-analyzer clippy rustfmt',
    ],
    healthCheckCommand: 'rust-analyzer --version',
    rootPath: '/workspace',
};

export default rustConfig;
