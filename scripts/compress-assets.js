/**
 * Asset compression script for production builds
 * Compresses JS, CSS, HTML, and SVG files to improve load times
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

// Promisify fs and zlib functions
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);
const writeFile = promisify(fs.writeFile);

// Configuration
const BUILD_DIR = path.resolve(__dirname, '../build');
const EXTENSIONS_TO_COMPRESS = ['.js', '.css', '.html', '.svg', '.json'];
const COMPRESSION_LEVEL = 9; // Maximum compression (0-9)
const SIZE_THRESHOLD = 1024; // Skip files smaller than 1KB

// Options for Brotli compression
const BROTLI_OPTIONS = {
  params: {
    [zlib.constants.BROTLI_PARAM_QUALITY]: 11, // Maximum quality (0-11)
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
  }
};

// Format file size
const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  else return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Calculate compression ratio
const compressionRatio = (original, compressed) => {
  return ((1 - compressed / original) * 100).toFixed(2);
};

// Get all files in a directory recursively
async function* getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      yield* getFiles(fullPath);
    } else {
      yield fullPath;
    }
  }
}

// Compress a single file
async function compressFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  
  if (!EXTENSIONS_TO_COMPRESS.includes(extension)) {
    return null;
  }
  
  const fileStats = await stat(filePath);
  
  // Skip small files
  if (fileStats.size < SIZE_THRESHOLD) {
    return null;
  }
  
  try {
    // Read file content
    const content = fs.readFileSync(filePath);
    
    // Compress with Gzip
    const gzipResult = await gzip(content, { level: COMPRESSION_LEVEL });
    await writeFile(`${filePath}.gz`, gzipResult);
    
    // Compress with Brotli
    const brotliResult = await brotli(content, BROTLI_OPTIONS);
    await writeFile(`${filePath}.br`, brotliResult);
    
    return {
      file: path.relative(BUILD_DIR, filePath),
      originalSize: fileStats.size,
      gzipSize: gzipResult.length,
      brotliSize: brotliResult.length,
      gzipRatio: compressionRatio(fileStats.size, gzipResult.length),
      brotliRatio: compressionRatio(fileStats.size, brotliResult.length)
    };
  } catch (error) {
    console.error(`Error compressing ${filePath}:`, error.message);
    return null;
  }
}

// Main function
async function main() {
  console.log('🔍 Scanning build directory for files to compress...');
  
  const results = [];
  let totalOriginalSize = 0;
  let totalGzipSize = 0;
  let totalBrotliSize = 0;
  
  for await (const file of getFiles(BUILD_DIR)) {
    const result = await compressFile(file);
    if (result) {
      results.push(result);
      totalOriginalSize += result.originalSize;
      totalGzipSize += result.gzipSize;
      totalBrotliSize += result.brotliSize;
    }
  }
  
  // Sort by compression ratio (best savings first)
  results.sort((a, b) => parseFloat(b.brotliRatio) - parseFloat(a.brotliRatio));
  
  // Log results
  console.log('\n📊 Compression Results:');
  console.log('-'.repeat(100));
  console.log('| File'.padEnd(50) + '| Original'.padEnd(15) + '| Gzip'.padEnd(15) + '| Brotli'.padEnd(15) + '|');
  console.log('-'.repeat(100));
  
  for (const result of results) {
    const fileName = result.file.length > 47 ? '...' + result.file.slice(-44) : result.file;
    console.log(
      `| ${fileName.padEnd(47)} | ${formatSize(result.originalSize).padEnd(12)} | ` +
      `${formatSize(result.gzipSize).padEnd(12)} | ${formatSize(result.brotliSize).padEnd(12)} |`
    );
  }
  
  console.log('-'.repeat(100));
  console.log(
    `| ${'TOTAL'.padEnd(47)} | ${formatSize(totalOriginalSize).padEnd(12)} | ` +
    `${formatSize(totalGzipSize).padEnd(12)} | ${formatSize(totalBrotliSize).padEnd(12)} |`
  );
  console.log('-'.repeat(100));
  console.log(`Overall savings: Gzip: ${compressionRatio(totalOriginalSize, totalGzipSize)}%, ` +
    `Brotli: ${compressionRatio(totalOriginalSize, totalBrotliSize)}%`);
  
  console.log('\n✅ Compression complete!');
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 