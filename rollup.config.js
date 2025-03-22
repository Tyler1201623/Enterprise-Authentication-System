import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import fs from 'fs';
import path from 'path';

/**
 * Enhanced Rollup configuration for better Node.js polyfill handling
 * This works alongside Vite's built-in Rollup configuration
 */
export default {
  plugins: [
    // First plugin to handle circular references
    {
      name: 'handle-circular-references',
      resolveId(source, importer) {
        // Special handling for the define-globalThis-property circular reference
        if (source.includes('define-globalThis-property')) {
          const resolvedPath = path.resolve('./src/internals/define-globalThis-property.js');
          console.log(`[Circular Reference] Resolving ${source} from ${importer || 'unknown'} to ${resolvedPath}`);
          return { id: resolvedPath, external: false };
        }
        return null;
      }
    },
    nodeResolve({
      browser: true,
      preferBuiltins: false,
      dedupe: ['react', 'react-dom'],
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    }),
    // Process CommonJS modules properly
    commonjs({
      transformMixedEsModules: true,
      include: [
        /node_modules/,
        /src\/internals/  // Include the internals directory for CommonJS processing
      ],
      // Important: Make our module non-external
      esmExternals: id => !id.includes('define-globalThis-property'),
      // Provide specific resolution for circular
      requireReturnsDefault: 'preferred',
      // Special handling for the problematic module
      dynamicRequireTargets: [
        'src/internals/define-globalThis-property.js'
      ]
    }),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.browser': true,
      'global': 'globalThis',
    }),
    json(),
    // Add special handling for the direct module
    {
      name: 'inject-global-this-direct',
      resolveId(source) {
        // Direct handling for the specific import pattern
        if (source === '../internals/define-globalThis-property?commonjs-external') {
          const resolvedPath = path.resolve('./src/internals/define-globalThis-property.js');
          console.log(`[Special Case] Handling commonjs-external for ${source}`);
          return resolvedPath;
        }
        return null;
      },
      load(id) {
        // Intercept the direct load for our specific module
        if (id.includes('define-globalThis-property.js')) {
          try {
            // Instead of reading from file, provide a direct implementation
            // to avoid circular references
            console.log(`[Special Load] Injecting direct code for ${id}`);
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
export default defineGlobalProperty;
module.exports = defineGlobalProperty;
`;
          } catch (error) {
            console.error(`Error handling special module: ${error.message}`);
          }
        }
        return null;
      }
    },
    {
      name: 'debug-rollup',
      buildStart() {
        console.log('Rollup build starting with enhanced configuration...');
        console.log('Working directory:', process.cwd());
        console.log('Resolved internals path:', path.resolve('./src/internals'));
        console.log('Module exists:', fs.existsSync(path.resolve('./src/internals/define-globalThis-property.js')));
        if (fs.existsSync(path.resolve('./src/internals/define-globalThis-property.js'))) {
          console.log('Module content:', fs.readFileSync(path.resolve('./src/internals/define-globalThis-property.js'), 'utf8'));
        }
      },
      buildEnd() {
        console.log('Rollup build completed successfully!');
      },
      renderError(error) {
        console.error('Rollup build error details:', error.code, error.message);
        console.error('Error location:', error.loc ? `${error.loc.file}:${error.loc.line}:${error.loc.column}` : 'unknown');
        if (error.frame) {
          console.error('Error frame:\n', error.frame);
        }
      }
    }
  ],
  onwarn(warning, warn) {
    // Ignore circular dependency warnings - we handle them explicitly
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
      if (warning.message.includes('define-globalThis-property')) {
        console.log('Ignoring circular dependency for define-globalThis-property');
        return;
      }
    }
    
    // Ignore THIS_IS_UNDEFINED
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    
    // Better logging for specific issues
    if (warning.code === 'MISSING_EXPORT') {
      console.warn(`Warning: Missing export in ${warning.loc ? `${warning.loc.file}:${warning.loc.line}:${warning.loc.column}` : 'unknown location'}`);
      console.warn(`  Module '${warning.exporter}' does not export '${warning.missing}'`);
      return;
    }
    
    if (warning.code === 'UNRESOLVED_IMPORT') {
      console.warn(`Warning: Unresolved import in ${warning.loc ? `${warning.loc.file}:${warning.loc.line}:${warning.loc.column}` : 'unknown location'}`);
      console.warn(`  Could not resolve '${warning.source}'`);
      return;
    }
    
    // Log the warning with file path for easier debugging
    if (warning.loc) {
      console.warn(`Warning ${warning.code} in ${warning.loc.file}:${warning.loc.line}:${warning.loc.column}`);
    } else {
      console.warn(`Warning ${warning.code}: ${warning.message}`);
    }
    
    // Use default for everything else
    warn(warning);
  }
}; 