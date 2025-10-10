import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'recharts-vendor': ['recharts'],
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // App chunks by feature
          'dashboard': [
            './src/pages/Dashboard.jsx',
            './src/pages/ReportsRefactored.jsx'
          ],
          'management': [
            './src/pages/ChickenOrdersRefactored.jsx',
            './src/pages/LiveChickenStockRefactored.jsx',
            './src/pages/FeedManagementRefactored.jsx',
            './src/pages/StockInventory.jsx',
            './src/pages/DressedChickenStockRefactored.jsx'
          ],
          'admin': [
            './src/pages/UserManagement.jsx',
            './src/pages/AuditTrail.jsx',
            './src/pages/SiteSettings.jsx'
          ],
          'transactions': [
            './src/pages/Transactions.jsx'
          ]
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            return '[name]-[hash].js'
          }
          return 'chunk-[hash].js'
        }
      }
    },
    // Enable source maps for production debugging
    sourcemap: false,
    // Optimize dependencies
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  // Optimize dev server
  server: {
    hmr: {
      overlay: false
    }
  }
})
