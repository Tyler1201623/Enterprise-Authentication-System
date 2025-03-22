import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

/**
 * This is a custom Rollup configuration that helps with resolving Node.js polyfills.
 * It's used in combination with Vite's built-in Rollup configuration.
 */
export default {
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false,
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
      'global': 'window',
    }),
    json(),
    {
      name: 'debug-rollup',
      buildStart() {
        console.log('Rollup build starting...');
      },
      buildEnd() {
        console.log('Rollup build completed successfully!');
      },
      renderError(error) {
        console.error('Rollup build error:', error);
      }
    }
  ],
  onwarn(warning, warn) {
    // Ignore certain warnings
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    
    // Log the warning with file path for easier debugging
    if (warning.loc) {
      console.warn(`Warning ${warning.code} in ${warning.loc.file}:${warning.loc.line}:${warning.loc.column}`);
    }
    
    // Use default for everything else
    warn(warning);
  }
}; 