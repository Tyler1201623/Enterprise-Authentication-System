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
  let globalObj;
  
  // Try to get the global object using various methods
  if (typeof window !== 'undefined') {
    globalObj = window;
  } else if (typeof global !== 'undefined') {
    globalObj = global;
  } else {
    try {
      // Last resort: Try Function constructor approach
      globalObj = new Function('return this')();
    } catch (e) {
      // If everything fails, use empty object as fallback
      globalObj = {};
      console.warn('Could not find global object');
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

// Only use one export approach to avoid circular references
export default defineGlobalProperty; 