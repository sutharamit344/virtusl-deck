import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['appicon.png', 'vc logo.png', 'robots.txt'],
      manifest: {
        name: 'Virtual Deck',
        short_name: 'Deck',
        description: 'Multiplayer digital card game simulator',
        start_url: '/',
        display: 'fillscreen',
        background_color: '#0D1117',
        theme_color: '#0D1117',
        icons: [
          {
            src: 'appicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'appicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      '@mui/material',
      '@mui/icons-material',
      'firebase/app',
      'firebase/auth',
      'firebase/database',
    ]
  },

  build: {
    chunkSizeWarningLimit: 700, // Optional: increase limit from 500 KB to 700 KB
    rollupOptions: {
      output: {
        manualChunks: {
          // Core frameworks
          react: ['react', 'react-dom'],
          redux: ['react-redux', '@reduxjs/toolkit'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/database'],
          sound: ['use-sound'], // if using audio
        }
      }
    }
  }
})
