import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Séparer les bibliothèques tierces lourdes
              'react-vendor': ['react', 'react-dom'],
              'recharts': ['recharts'],
              'sweetalert2': ['sweetalert2'],
              'written-number': ['written-number'],
              // Séparer les composants lourds
              'components-forms': ['./components/QuoteForm', './components/WorkRequestForm'],
              'components-managers': ['./components/ArticleManager', './components/WorkTypeManager', './components/StructureManager'],
              'components-lists': ['./components/QuoteList', './components/WorkRequestList', './components/ClientList', './components/UserList']
            }
          }
        },
        chunkSizeWarningLimit: 1000 // Augmenter la limite d'avertissement à 1000 kB
      }
    };
});
