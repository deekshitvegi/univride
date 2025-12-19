import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CHANGE: Use relative base path. This allows the app to work at 'username.github.io/repo' OR 'username.github.io'
  base: './', 
  define: {
    // Polyfill process.env so libraries (like GoogleGenAI) don't crash
    'process.env': {},
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // Helps debugging in production
  },
  logLevel: 'info'
});