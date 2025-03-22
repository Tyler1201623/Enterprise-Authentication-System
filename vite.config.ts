/// <reference types="vite/client" />

import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: [
        "buffer",
        "process",
        "util",
        "stream",
        "events",
        "path",
        "crypto",
      ],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
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
      path: "path-browserify",
    },
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
      define: {
        global: "globalThis",
      },
    },
    include: [
      "crypto-browserify",
      "buffer",
      "process/browser",
      "stream-browserify",
      "util",
      "browserify-zlib",
    ],
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
    minify: "esbuild",
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "utils-vendor": [
            "crypto-js",
            "buffer",
            "process/browser",
            "nanoid",
            "otplib",
            "date-fns",
          ],
          "ui-vendor": ["styled-components", "react-icons", "framer-motion"],
        },
      },
    },
  },
});
