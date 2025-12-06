import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip compression for production
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression for modern browsers
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@services': resolve(__dirname, './src/services'),
      '@types': resolve(__dirname, './src/types'),
      '@config': resolve(__dirname, './src/config'),
    },
  },

  server: {
    port: 5173,
    host: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
      },
    },
    hmr: {
      overlay: true,
    },
  },

  preview: {
    port: 4173,
    host: true,
  },

  build: {
    outDir: 'dist/client',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'vendor-react': ['react', 'react-dom'],
          
          // CodeMirror editor
          'vendor-editor': [
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/commands',
            '@codemirror/autocomplete',
            '@codemirror/language',
            '@codemirror/lint',
            '@codemirror/search',
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
            '@codemirror/lang-json',
          ],
          
          // Collaboration (Yjs CRDT)
          'vendor-collab': [
            'yjs',
            'y-websocket',
            'y-protocols',
            'y-indexeddb',
            'lib0',
          ],
          
          // WebRTC & Video
          'vendor-rtc': [
            'simple-peer',
            'recordrtc',
            'hark',
            'webrtc-adapter',
          ],
          
          // UI Components
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            'class-variance-authority',
            'clsx',
          ],
          
          // Utilities
          'vendor-utils': [
            'axios',
            'date-fns',
            'lodash-es',
            'uuid',
            'zod',
            'zustand',
          ],
        },
      },
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'socket.io-client',
      'yjs',
      'y-websocket',
      '@codemirror/state',
      '@codemirror/view',
    ],
    exclude: ['@tldraw/tldraw'],
  },

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});
