import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || './',
  envPrefix: ['VITE_', 'REACT_APP_'],
  build: { outDir: 'build', sourcemap: false },
});
