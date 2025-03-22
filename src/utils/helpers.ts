export const formatDate = (date: Date): string => {
  return date.toLocaleDateString();
};

/**
 * Generates a random string of specified length
 * @param length Length of the random string to generate
 * @returns Random string
 */
export const generateRandomString = (length: number = 16): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  // Use crypto API if available for better randomness
  if (window.crypto && window.crypto.getRandomValues) {
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      result += chars.charAt(randomValues[i] % chars.length);
    }

    return result;
  }

  // Fallback to Math.random if crypto is not available
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};

/**
 * Gets the current timestamp in milliseconds
 * @returns Current timestamp
 */
export const getCurrentTimestamp = (): number => {
  return Date.now();
};

/**
 * Formats a timestamp into a human-readable date string
 * @param timestamp Timestamp to format
 * @param format Format to use (default: 'full')
 * @returns Formatted date string
 */
export const formatTimestamp = (
  timestamp: number,
  format: "full" | "date" | "time" | "relative" = "full"
): string => {
  const date = new Date(timestamp);

  switch (format) {
    case "date":
      return date.toLocaleDateString();
    case "time":
      return date.toLocaleTimeString();
    case "relative":
      return getRelativeTimeString(timestamp);
    case "full":
    default:
      return date.toLocaleString();
  }
};

/**
 * Converts a timestamp to a relative time string (e.g., "5 minutes ago")
 * @param timestamp Timestamp to convert
 * @returns Relative time string
 */
export const getRelativeTimeString = (timestamp: number): string => {
  const now = getCurrentTimestamp();
  const diffSeconds = Math.floor((now - timestamp) / 1000);

  if (diffSeconds < 60) {
    return `${diffSeconds} second${diffSeconds !== 1 ? "s" : ""} ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
};

/**
 * Converts a file size in bytes to a human-readable format
 * @param bytes File size in bytes
 * @param decimals Number of decimal places to show
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
  );
};

/**
 * Debounces a function call to limit how often it can be called
 * @param func Function to debounce
 * @param wait Time to wait in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * Throttles a function call to limit how often it can be called
 * @param func Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Creates a unique ID with an optional prefix
 * @param prefix Optional prefix for the ID
 * @returns Unique ID
 */
export const createUniqueId = (prefix: string = "id"): string => {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
};

/**
 * Delays execution for a specified time
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Deep clones an object
 * @param obj Object to clone
 * @returns Cloned object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  return JSON.parse(JSON.stringify(obj));
};

/**
 * Safely parses a JSON string with error handling
 * @param jsonString JSON string to parse
 * @param fallback Fallback value in case of error
 * @returns Parsed object or fallback
 */
export const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return fallback;
  }
};
