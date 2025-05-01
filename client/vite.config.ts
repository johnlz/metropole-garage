import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Adicionado para gerar caminhos relativos
  server: {
    port: 3000,
    host: '0.0.0.0',
    cors: true,
  },
  build: {
    outDir: 'dist',
  },
});