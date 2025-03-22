import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

/**
 * Enhanced Rollup configuration for better Node.js polyfill handling
 * This works alongside Vite's built-in Rollup configuration
 */
export default {
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false,
      dedupe: ['react', 'react-dom'],
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    }),
    commonjs({
      transformMixedEsModules: true,
      include: [
        /node_modules/
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
      console.warn(`Warning: Missing export in ${warning.loc.file}:${warning.loc.line}:${warning.loc.column}`);
      console.warn(`  Module '${warning.exporter}' does not export '${warning.missing}'`);
      return;
    }
    
    if (warning.code === 'UNRESOLVED_IMPORT') {
      console.warn(`Warning: Unresolved import in ${warning.loc.file}:${warning.loc.line}:${warning.loc.column}`);
      console.warn(`  Could not resolve '${warning.source}'`);
      return;
    }
    
    // Log the warning with file path for easier debugging
    if (warning.loc) {
      console.warn(`Warning ${warning.code} in ${warning.loc.file}:${warning.loc.line}:${warning.loc.column}`);
    }
    
    // Use default for everything else
    warn(warning);
  }
}; 