import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Using relative path for better compatibility with GitHub Pages subdirectories
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});