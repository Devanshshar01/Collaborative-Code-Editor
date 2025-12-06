import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    define: {
        'process.env': {},
        global: 'window',
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://localhost:4000',
                ws: true,
            }
        }
    },
    resolve: {
        dedupe: ['@codemirror/state', '@codemirror/view', '@codemirror/language', '@codemirror/commands']
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core React
                    'vendor-react': ['react', 'react-dom'],
                    // Editor (CodeMirror)
                    'vendor-editor': [
                        '@codemirror/state',
                        '@codemirror/view', 
                        '@codemirror/commands',
                        '@codemirror/language',
                        '@codemirror/autocomplete',
                        '@codemirror/search',
                        'codemirror'
                    ],
                    // Language support
                    'vendor-languages': [
                        '@codemirror/lang-javascript',
                        '@codemirror/lang-python',
                        '@codemirror/lang-java',
                        '@codemirror/lang-cpp',
                        '@codemirror/lang-go',
                        '@codemirror/lang-html',
                        '@codemirror/lang-css',
                        '@codemirror/lang-json'
                    ],
                    // Collaboration (Yjs)
                    'vendor-collab': ['yjs', 'y-websocket', 'y-codemirror.next', 'lib0'],
                    // Real-time communication
                    'vendor-rtc': ['socket.io-client', 'simple-peer'],
                    // UI utilities
                    'vendor-ui': ['lucide-react', 'clsx', 'zustand', 'nanoid'],
                },
            },
        },
        chunkSizeWarningLimit: 600,
    },
})
