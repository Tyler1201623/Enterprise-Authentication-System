/// <reference types="vite/client" />

import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "/Enterprise-Authentication-System/",
  publicDir: "public",
  server: {
    port: 3000,
    open: true,
    host: true,
    hmr: {
      overlay: false,
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      process: "process/browser",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: "util",
      buffer: "buffer",
      crypto: "crypto-browserify",
    },
  },
  define: {
    "process.env": {},
    global: {},
  },
  optimizeDeps: {
    include: [
      "crypto-browserify",
      "buffer",
      "process/browser",
      "stream-browserify",
      "util",
      "browserify-zlib",
    ],
    esbuildOptions: {
      target: "es2020",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    assetsDir: "assets",
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => {
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router-dom")
          ) {
            return "react-vendor";
          }

          if (
            id.includes("node_modules/crypto-js") ||
            id.includes("node_modules/buffer") ||
            id.includes("node_modules/process") ||
            id.includes("node_modules/nanoid") ||
            id.includes("node_modules/otplib") ||
            id.includes("node_modules/date-fns")
          ) {
            return "utils-vendor";
          }

          if (
            id.includes("node_modules/styled-components") ||
            id.includes("node_modules/react-icons") ||
            id.includes("node_modules/framer-motion")
          ) {
            return "ui-vendor";
          }

          return null;
        },
      },
    },
  },
});
