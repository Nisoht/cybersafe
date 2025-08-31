/// <reference types="vite/client" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Bind to 0.0.0.0 for IPv4/IPv6 compatibility
    strictPort: true // Fail if port 3000 is unavailable
  },
  build: {
    outDir: 'dist'
  }
});