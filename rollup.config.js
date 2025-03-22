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
    // Custom plugin to resolve the circular define-globalThis-property reference
    {
      name: 'resolve-globalThis-property',
      resolveId(source, importer) {
        // Handle the specific circular reference case
        if (source === '../internals/define-globalThis-property' || 
            source === '../internals/define-globalThis-property?commonjs-external') {
          const resolvedPath = path.resolve('./src/internals/define-globalThis-property.js');
          console.log(`Resolving ${source} from ${importer || 'unknown'} to ${resolvedPath}`);
          return resolvedPath;
        }
        return null;
      },
      load(id) {
        // Provide the module content directly for the problematic import
        if (id.includes('define-globalThis-property.js')) {
          try {
            const resolvedPath = path.resolve('./src/internals/define-globalThis-property.js');
            console.log(`Loading module content directly for: ${id}`);
            return fs.readFileSync(resolvedPath, 'utf8');
          } catch (error) {
            console.error(`Error loading define-globalThis-property.js: ${error.message}`);
          }
        }
        return null;
      }
    },
    nodeResolve({
      browser: true,
      preferBuiltins: false,
      dedupe: ['react', 'react-dom'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      // Add custom aliases to help resolve paths correctly
      alias: {
        'src': path.resolve('./src'),
        // Fix circular reference by providing exact file paths with extensions
        '../src/internals/define-globalThis-property': path.resolve('./src/internals/define-globalThis-property.js'),
        './internals/define-globalThis-property': path.resolve('./src/internals/define-globalThis-property.js'),
        '../internals/define-globalThis-property': path.resolve('./src/internals/define-globalThis-property.js')
      }
    }),
    // Process CommonJS modules properly
    commonjs({
      transformMixedEsModules: true,
      include: [
        /node_modules/,
        /src\/internals/  // Include the internals directory for CommonJS processing
      ],
      // Exclude our problematic module from external handling
      exclude: [
        '**/define-globalThis-property.js'
      ]
    }),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.browser': true,
      'global': 'globalThis',
    }),
    json(),
    {
      name: 'debug-rollup',
      buildStart() {
        console.log('Rollup build starting with enhanced configuration...');
        console.log('Working directory:', process.cwd());
        console.log('Resolved internals path:', path.resolve('./src/internals'));
        console.log('Checking for define-globalThis-property.js:', fs.existsSync(path.resolve('./src/internals/define-globalThis-property.js')));
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
    // Ignore certain warnings
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
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