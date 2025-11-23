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
    }
})
