import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/auth': 'http://localhost:5000',
    }
  },
  test: {
    globals: true, // Use global APIs like describe, it, expect
    environment: 'happy-dom', // Use happy-dom for DOM simulation
    // deps: { // Omitting for now as no complex UI library like Vuetify is used
    //   inline: ['vuetify'] 
    // },
    coverage: { // Optional: configure coverage reporter
      provider: 'istanbul', // or 'v8'
      reporter: ['text', 'json', 'html'],
    },
    setupFiles: ['./tests/setup.js'], // Adding setupFiles configuration
  },
})
