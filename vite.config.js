import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    host: true,
    open: false,
    strictPort: true,
    // CORS and wildcard headers removed — use proxy config if needed
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
        login: './login.html',
        freedomboard: './freedomboard.html',
        gallery: './gallery.html',
        blog: './blog.html',
        chat: './chat.html',
        countdown: './countdown.html',
        contact: './contact.html',
      },
    },
  },
});
