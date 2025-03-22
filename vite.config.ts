/// <reference types="vite/client" />

import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import react from "@vitejs/plugin-react";
import fs from "fs";
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
      "../internals/define-globalThis-property": resolve(
        "./src/internals/define-globalThis-property.js"
      ),
      "./internals/define-globalThis-property": resolve(
        "./src/internals/define-globalThis-property.js"
      ),
      "../internals/define-globalThis-property?commonjs-external": resolve(
        "./src/internals/define-globalThis-property.js"
      ),
      "../internals/globalThis-this": resolve(
        "./src/internals/globalThis-this.js"
      ),
      "./internals/globalThis-this": resolve(
        "./src/internals/globalThis-this.js"
      ),
      "../internals/globalThis-this?commonjs-external": resolve(
        "./src/internals/globalThis-this.js"
      ),
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
      plugins: [
        {
          name: "handle-circular-references",
          resolveId(source, importer) {
            if (
              source.includes("define-globalThis-property") ||
              source.includes("globalThis-this")
            ) {
              const moduleName = source.includes("define-globalThis-property")
                ? "define-globalThis-property.js"
                : "globalThis-this.js";
              const resolvedPath = resolve(`./src/internals/${moduleName}`);
              console.log(
                `[Circular Reference] Resolving ${source} from ${importer || "unknown"} to ${resolvedPath}`
              );
              return { id: resolvedPath, external: false };
            }
            return null;
          },
          load(id) {
            if (id.includes("define-globalThis-property.js")) {
              return `
// Direct module implementation to avoid circular references
'use strict';
function defineGlobalProperty(name, value) {
  try {
    if (typeof global !== 'undefined') {
      if (Object.defineProperty) {
        Object.defineProperty(global, name, { configurable: true, writable: true, value: value });
      } else {
        global[name] = value;
      }
    }
    if (typeof window !== 'undefined') {
      if (Object.defineProperty) {
        Object.defineProperty(window, name, { configurable: true, writable: true, value: value });
      } else {
        window[name] = value;
      }
    }
    return true;
  } catch (error) {
    console.warn('Failed to define global property:', name, error);
    return false;
  }
}
// Export the function using multiple module formats
export default defineGlobalProperty;
if (typeof module !== 'undefined') {
  module.exports = defineGlobalProperty;
}
`;
            }
            if (id.includes("globalThis-this.js")) {
              return `
// Direct module implementation to avoid circular references
'use strict';
function getGlobalThis() {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  if (typeof self !== 'undefined') {
    return self;
  }
  try {
    return Function('return this')();
  } catch (e) {
    return {};
  }
}
// Export using both module formats
export default getGlobalThis;
if (typeof module !== 'undefined') {
  module.exports = getGlobalThis;
}
`;
            }
            return null;
          },
        },
        nodeResolve({
          browser: true,
          preferBuiltins: false,
        }),
        commonjs({
          transformMixedEsModules: true,
          requireReturnsDefault: "preferred",
        }),
        replace({
          preventAssignment: true,
          "process.env.NODE_ENV": JSON.stringify(
            process.env.NODE_ENV || "production"
          ),
          "process.browser": true,
          global: "globalThis",
        }),
        {
          name: "debug-rollup",
          buildStart() {
            console.log("Rollup build starting with Vite integration...");
            console.log("Working directory:", process.cwd());
            console.log("Module paths:", [
              resolve("./src/internals/define-globalThis-property.js"),
              resolve("./src/internals/globalThis-this.js"),
            ]);
            console.log(
              "Module exists (define-globalThis-property):",
              fs.existsSync(
                resolve("./src/internals/define-globalThis-property.js")
              )
            );
            console.log(
              "Module exists (globalThis-this):",
              fs.existsSync(resolve("./src/internals/globalThis-this.js"))
            );
          },
        },
      ],
      onwarn(warning, warn) {
        if (
          warning.code === "CIRCULAR_DEPENDENCY" &&
          (warning.message.includes("define-globalThis-property") ||
            warning.message.includes("globalThis-this"))
        ) {
          return;
        }

        if (warning.code === "THIS_IS_UNDEFINED") return;

        warn(warning);
      },
    },
  },
});
