/**
 * Language Server Configurations
 * Java - Eclipse JDT.LS language server
 */

import { LanguageServerConfig, LSPLanguage } from '../../types/lsp';

// Java - Eclipse JDT.LS language server
export const javaConfig: LanguageServerConfig = {
    language: LSPLanguage.JAVA,
    serverCommand: ['java'],
    serverArgs: [
        '-Declipse.application=org.eclipse.jdt.ls.core.id1',
        '-Dosgi.bundles.defaultStartLevel=4',
        '-Declipse.product=org.eclipse.jdt.ls.core.product',
        '-Dlog.level=ALL',
        '-Xmx1G',
        '--add-modules=ALL-SYSTEM',
        '--add-opens', 'java.base/java.util=ALL-UNNAMED',
        '--add-opens', 'java.base/java.lang=ALL-UNNAMED',
        '-jar', '/opt/jdtls/plugins/org.eclipse.equinox.launcher_*.jar',
        '-configuration', '/opt/jdtls/config_linux',
        '-data', '/workspace/.jdtls',
    ],
    documentSelector: ['java'],
    triggerCharacters: ['.', '@', '#'],
    signatureTriggerCharacters: ['(', ','],
    dockerImage: 'lsp-server-java',
    initializationOptions: {
        bundles: [],
        workspaceFolders: ['/workspace'],
        settings: {
            java: {
                home: '/usr/lib/jvm/java-17-openjdk',
                errors: {
                    incompleteClasspath: {
                        severity: 'warning'
                    }
                },
                configuration: {
                    checkProjectSettingsExclusions: false,
                    updateBuildConfiguration: 'automatic',
                    maven: {
                        userSettings: null
                    }
                },
                trace: {
                    server: 'verbose'
                },
                import: {
                    gradle: {
                        enabled: true
                    },
                    maven: {
                        enabled: true
                    },
                    exclusions: [
                        '**/node_modules/**',
                        '**/.metadata/**',
                        '**/archetype-resources/**',
                        '**/META-INF/maven/**'
                    ]
                },
                referencesCodeLens: {
                    enabled: true
                },
                implementationsCodeLens: {
                    enabled: true
                },
                signatureHelp: {
                    enabled: true
                },
                format: {
                    enabled: true,
                    settings: {
                        url: '',
                        profile: ''
                    }
                },
                saveActions: {
                    organizeImports: true
                },
                contentProvider: {
                    preferred: null
                },
                autobuild: {
                    enabled: true
                },
                completion: {
                    favoriteStaticMembers: [
                        'org.junit.Assert.*',
                        'org.junit.Assume.*',
                        'org.junit.jupiter.api.Assertions.*',
                        'org.junit.jupiter.api.Assumptions.*',
                        'org.junit.jupiter.api.DynamicContainer.*',
                        'org.junit.jupiter.api.DynamicTest.*',
                        'org.mockito.Mockito.*',
                        'org.mockito.ArgumentMatchers.*',
                        'org.mockito.Answers.*'
                    ],
                    filteredTypes: [
                        'java.awt.*',
                        'com.sun.*',
                        'sun.*',
                        'jdk.*',
                        'org.graalvm.*',
                        'io.micrometer.shaded.*'
                    ],
                    importOrder: [
                        'java',
                        'javax',
                        'org',
                        'com',
                        ''
                    ],
                    guessMethodArguments: true,
                    maxResults: 100,
                },
                sources: {
                    organizeImports: {
                        starThreshold: 99,
                        staticStarThreshold: 99
                    }
                },
                codeGeneration: {
                    toString: {
                        template: '${object.className} {${member.name()}=${member.value}, ${otherMembers}}'
                    },
                    hashCodeEquals: {
                        useJava7Objects: true
                    },
                    useBlocks: true
                },
                inlayHints: {
                    parameterNames: {
                        enabled: 'all'
                    }
                }
            }
        }
    },
    installCommands: [
        'apt-get update && apt-get install -y openjdk-17-jdk maven gradle',
        'curl -fLo /tmp/jdtls.tar.gz https://download.eclipse.org/jdtls/snapshots/jdt-language-server-latest.tar.gz',
        'mkdir -p /opt/jdtls && tar -xzf /tmp/jdtls.tar.gz -C /opt/jdtls',
    ],
    healthCheckCommand: 'java -version',
    rootPath: '/workspace',
};

export default javaConfig;
