/// <reference types="vite/client" />

import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "/Enterprise-Authentication-System/",
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
      process: "process",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: "util",
      buffer: "buffer",
      crypto: "crypto-browserify",
    },
  },
  define: {
    "process.env": process.env,
    global: {},
  },
  optimizeDeps: {
    include: [
      "crypto-browserify",
      "buffer",
      "process",
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
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          utils: [
            "crypto-js",
            "buffer",
            "process",
            "nanoid",
            "otplib",
            "date-fns",
          ],
          ui: ["styled-components", "react-icons", "framer-motion"],
        },
      },
    },
  },
});
