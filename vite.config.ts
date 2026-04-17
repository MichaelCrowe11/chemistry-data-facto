import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = process.env.PROJECT_ROOT || __dirname

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-error-boundary'],
          'vendor-three': ['three'],
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
          'vendor-viz': ['d3', 'recharts'],
          'vendor-icons': ['@phosphor-icons/react', 'lucide-react'],
          'vendor-animation': ['framer-motion'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-ai': ['ai', '@ai-sdk/openai'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@github/spark/hooks',
    ],
    exclude: ['@github/spark'],
  },
  server: {
    compress: true,
  },
});
