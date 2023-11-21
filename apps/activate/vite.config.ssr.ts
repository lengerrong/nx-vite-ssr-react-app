/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/activate',

  server: {
    port: 4200,
    host: 'localhost',
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  plugins: [
    react(),
    nxViteTsPaths(),
  ],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [
  //    viteTsConfigPaths({
  //      root: './',
  //    }),
  //  ],
  // },

  test: {
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },

  build: {
    target: "esnext",
    rollupOptions: {
      external: ["fsevents", "esbuild", "vite", "fs", "path", "https", "http", "tls", "net", "zlib", "stream", "tty", "os", "crypto", "util"],
      output: {
        dynamicImportInCjs: true
      }
    },
    copyPublicDir: false, // not copy public assets
    minify: false
  },

  optimizeDeps: {
    esbuildOptions: {
      target: "esnext"
    },
    force: true
  },

  ssr: {
    // for production standalone deployment. bundle everything except the above external
    // so that await import main.server.mjs no need any dpes under node_modules
    noExternal: process.env["NX_TASK_TARGET_CONFIGURATION"] === "production" ? true : undefined
  }

});
