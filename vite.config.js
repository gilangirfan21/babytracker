import { resolve } from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/babytracker/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        login: resolve(import.meta.dirname, 'login.html'),
        tracker: resolve(import.meta.dirname, 'tracker.html'),
        profile: resolve(import.meta.dirname, 'profile.html'),
        grafik: resolve(import.meta.dirname, 'grafik.html'),
      },
    },
  },
})
