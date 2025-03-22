// Define a global property for environments
// This is a polyfill to ensure global properties are available in all environments

'use strict';

/**
 * Define a property on the global object 
 * Works across different JavaScript environments
 */
function defineGlobalProperty(name, value) {
  try {
    // For Node.js environment
    if (typeof global !== 'undefined') {
      if (Object.defineProperty) {
        Object.defineProperty(global, name, {
          configurable: true,
          writable: true,
          enumerable: false,
          value: value
        });
      } else {
        global[name] = value;
      }
    }
    
    // For browser environment
    if (typeof window !== 'undefined') {
      if (Object.defineProperty) {
        Object.defineProperty(window, name, {
          configurable: true,
          writable: true,
          enumerable: false,
          value: value
        });
      } else {
        window[name] = value;
      }
    }
    
    return true;
  } catch (error) {
    // Handle errors gracefully
    console.warn('Failed to define global property:', name, error);
    return false;
  }
}

// Export the function using multiple module formats to ensure compatibility
module.exports = defineGlobalProperty;
// Also export as default for ES modules
export default defineGlobalProperty; 