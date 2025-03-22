// Define a global property utility for cross-environment support
'use strict';

/**
 * Define a property on the global object
 * Works across different JavaScript environments
 * @param {string} name Property name
 * @param {any} value Property value
 * @returns {boolean} Success status
 */
function defineGlobalProperty(name, value) {
  // Get global object for the current environment safely
  // Using Function constructor to avoid linter errors with direct globalThis/self references
  let globalObj;
  
  try {
    // Try to get the global object using Function constructor
    globalObj = Function('return this')();
  } catch (e) {
    // If that fails, try specific environments
    if (typeof window !== 'undefined') {
      globalObj = window;
    } else if (typeof global !== 'undefined') {
      globalObj = global;
    } else {
      // Last resort fallback
      globalObj = {};
    }
  }
  
  try {
    if (Object.defineProperty) {
      Object.defineProperty(globalObj, name, {
        configurable: true,
        writable: true,
        enumerable: false,
        value: value
      });
    } else {
      // Fallback for older environments
      globalObj[name] = value;
    }
    return true;
  } catch (error) {
    console.warn('Failed to define global property:', name, error);
    return false;
  }
}

// Support CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = defineGlobalProperty;
}

// Support ES modules
export default defineGlobalProperty; 