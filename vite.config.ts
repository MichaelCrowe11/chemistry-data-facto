import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import { visualizer } from 'rollup-plugin-visualizer';

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
    // Bundle analyzer for production builds
    process.env.ANALYZE && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }) as PluginOption,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  build: {
    // Target modern browsers for better optimization
    target: 'es2020',
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React vendors
          'vendor-react': ['react', 'react-dom', 'react-error-boundary'],
          // THREE.js in separate chunk
          'vendor-three': ['three'],
          // UI libraries
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
            '@radix-ui/react-popover',
            '@radix-ui/react-scroll-area',
          ],
          // Data visualization
          'vendor-viz': ['d3', 'recharts'],
          // Icons
          'vendor-icons': ['@phosphor-icons/react', 'lucide-react'],
          // Animation
          'vendor-animation': ['framer-motion'],
          // Forms and validation
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // AI/ML
          'vendor-ai': ['ai', '@ai-sdk/openai'],
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit (but aim to stay under 500KB per chunk)
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging (can disable for final deployment)
    sourcemap: false,
    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@github/spark/hooks',
    ],
    exclude: ['@github/spark'],
  },
  // Enable gzip/brotli compression in dev server
  server: {
    compress: true,
  },
});
