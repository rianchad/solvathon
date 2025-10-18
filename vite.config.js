
import { defineConfig } from 'vite';

export default defineConfig({
  // Local preview/dev only; Render static serves files from dist.
  preview: {
    host: '0.0.0.0',
    strictPort: true
  }
  // ...existing config if you have one...
});