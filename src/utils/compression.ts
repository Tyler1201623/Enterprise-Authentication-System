import * as pako from "pako";

/**
 * Compresses a string using pako (zlib)
 * @param data String data to compress
 * @returns Base64 encoded compressed data
 */
export const compressData = (data: string): string => {
  try {
    // Convert string to Uint8Array
    const uint8Array = new TextEncoder().encode(data);

    // Compress the data
    const compressed = pako.deflate(uint8Array, { level: 9 });

    // Convert to Base64 for storage - use Uint8Array directly
    return arrayBufferToBase64(compressed);
  } catch (error) {
    console.error("Compression failed:", error);
    return data; // Return original data on failure
  }
};

/**
 * Decompresses a base64 encoded string
 * @param compressedData Base64 encoded compressed data
 * @returns Original decompressed string
 */
export const decompressData = (compressedData: string): string => {
  try {
    // Convert Base64 to ArrayBuffer
    const arrayBuffer = base64ToArrayBuffer(compressedData);

    // Decompress the data
    const decompressed = pako.inflate(new Uint8Array(arrayBuffer));

    // Convert Uint8Array back to string
    return new TextDecoder().decode(decompressed);
  } catch (error) {
    console.error("Decompression failed:", error);
    return compressedData; // Return compressed data on failure
  }
};

/**
 * Parses a decompressed string into a JavaScript object
 * @param decompressedString The string to parse
 * @returns Parsed JavaScript object
 */
export const parseDecompressedData = (decompressedString: string): any => {
  try {
    return JSON.parse(decompressedString);
  } catch (error) {
    console.error("Error parsing decompressed data:", error);
    return decompressedString; // Return the string on failure
  }
};

/**
 * Converts an ArrayBuffer to a Base64 string
 * @param buffer ArrayBuffer to convert
 * @returns Base64 string
 */
export const arrayBufferToBase64 = (
  buffer: Uint8Array | ArrayBuffer
): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
};

/**
 * Converts a Base64 string to an ArrayBuffer
 * @param base64 Base64 string to convert
 * @returns ArrayBuffer
 */
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
};

/**
 * Calculates compression ratio
 * @param originalSize Original data size
 * @param compressedSize Compressed data size
 * @returns Compression ratio (percentage)
 */
export const calculateCompressionRatio = (
  originalSize: number,
  compressedSize: number
): number => {
  if (originalSize === 0) return 0;
  return Math.round((1 - compressedSize / originalSize) * 100);
};

/**
 * Tests compression on sample data to determine if it's beneficial
 * @param sampleData Sample data to test compression on
 * @returns Object containing test results
 */
export const testCompression = (
  sampleData: string
): {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  isWorthwhile: boolean;
  compressionTime: number;
  decompressionTime: number;
} => {
  const originalSize = new TextEncoder().encode(sampleData).length;

  // Test compression
  const compressionStart = performance.now();
  const compressed = compressData(sampleData);
  const compressionTime = performance.now() - compressionStart;

  // Get compressed size
  const compressedSize = new TextEncoder().encode(compressed).length;

  // Test decompression
  const decompressionStart = performance.now();
  decompressData(compressed);
  const decompressionTime = performance.now() - decompressionStart;

  // Calculate ratio
  const compressionRatio = calculateCompressionRatio(
    originalSize,
    compressedSize
  );

  // Determine if compression is worthwhile
  // Only use compression if it saves at least 10% and the sample is at least 1KB
  const isWorthwhile = compressionRatio > 10 && originalSize > 1024;

  return {
    originalSize,
    compressedSize,
    compressionRatio,
    isWorthwhile,
    compressionTime,
    decompressionTime,
  };
};
