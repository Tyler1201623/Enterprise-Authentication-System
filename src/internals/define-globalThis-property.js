// Simple utility to define properties on the global object
'use strict';

/**
 * Get the global object across different JavaScript environments
 * @returns {object} The global object
 */
function getGlobalObject() {
  // eslint-disable-next-line no-undef
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  // eslint-disable-next-line no-restricted-globals
  if (typeof self !== 'undefined') return self;
  return Function('return this')();
}

/**
 * Define a property on the global object
 * @param {string} name Property name
 * @param {any} value Property value
 * @returns {boolean} Success status
 */
function defineGlobalProperty(name, value) {
  const globalObj = getGlobalObject();
  
  try {
    if (Object.defineProperty) {
      Object.defineProperty(globalObj, name, {
        configurable: true,
        writable: true,
        enumerable: false,
        value: value
      });
    } else {
      globalObj[name] = value;
    }
    return true;
  } catch (error) {
    console.warn('Failed to define global property:', name, error);
    return false;
  }
}

// Export for ES modules
export default defineGlobalProperty;

// Support CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = defineGlobalProperty;
} 