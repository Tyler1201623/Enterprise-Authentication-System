// Utility to get the global "this" reference across different environments
'use strict';

/* global globalThis, window, global, self */

/**
 * Returns the global "this" reference, works across different JavaScript environments
 * (browser, Node.js, WebWorker, etc.)
 * 
 * @returns {object} The global this object
 */
function getGlobalThis() {
  // Try the standard globalThis (modern browsers and Node.js >= 12)
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }

  // For browsers
  if (typeof window !== 'undefined') {
    return window;
  }
  
  // For Node.js
  if (typeof global !== 'undefined') {
    return global;
  }
  
  // For Web Workers
  if (typeof self !== 'undefined') {
    return self;
  }
  
  // Fallback - create and use a new object that becomes "this" at global scope
  // This is a last resort and shouldn't normally be needed
  try {
    // eslint-disable-next-line no-new-func
    return Function('return this')();
  } catch (e) {
    // If all else fails, use an empty object
    return {};
  }
}

// Export using both CommonJS and ES module syntax to avoid issues
module.exports = getGlobalThis;
export default getGlobalThis; 