import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Without this, the automatic chunking heuristic is sensitive to
        // how many lazy views exist — adding a 5th/6th lazy-loaded view
        // (see App.jsx) flipped it from splitting @supabase/supabase-js
        // into its own ~228KB chunk to merging it straight into the main
        // bundle instead. Functionally harmless either way (AuthContext
        // needs it eagerly regardless of chunk boundaries), but it means
        // that ~228KB — which rarely changes — gets re-downloaded by
        // returning visitors on every future deploy instead of staying
        // cached separately from the app code that actually changes.
        manualChunks(id) {
          if (id.includes('node_modules/@supabase')) return 'supabase-vendor';
        },
      },
    },
  },
})
