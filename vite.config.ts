import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'firebase';
              }
              if (id.includes('jspdf')) {
                return 'jspdf';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'recharts';
              }
              if (id.includes('lucide-react')) {
                return 'lucide';
              }
              if (
                /node_modules\/react\//.test(id) || 
                /node_modules\/react-dom\//.test(id) || 
                /node_modules\/scheduler\//.test(id) || 
                /node_modules\/motion\//.test(id) || 
                /node_modules\/@motionone\//.test(id)
              ) {
                return 'react-core';
              }
              return 'vendor';
            }
          }
        }
      }
    }
  };
});
