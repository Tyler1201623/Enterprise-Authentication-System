const webpack = require('webpack');
const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Disable chunking for simplicity - this helps with loading issues
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        runtimeChunk: false,
        splitChunks: {
          chunks: 'async',  // Only split async chunks to avoid loading issues
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
        minimize: env === 'production',
      };

      // Configure fallbacks for compatibility with browser environment
      webpackConfig.resolve.fallback = {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        util: require.resolve('util/'),
        process: require.resolve('process/browser'),
        vm: require.resolve('vm-browserify'),
        assert: require.resolve('assert/'),
        fs: false,
        path: require.resolve('path-browserify'),
        zlib: require.resolve('browserify-zlib'),
      };

      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        process: 'process/browser',
      };

      // Use development mode for better debugging
      webpackConfig.mode = env === 'production' ? 'production' : 'development';
      
      // Ensure source maps in development
      webpackConfig.devtool = env === 'production' ? false : 'eval-source-map';

      return webpackConfig;
    },
    plugins: {
      add: [
        // Polyfill Node.js globals
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
        
        // Add environment variables
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
          'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
        }),
        
        // Compression for production builds
        process.env.NODE_ENV === 'production' && 
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 10240, // Only compress assets > 10kb
          minRatio: 0.8, // Only compress assets that compress well
        }),
      ].filter(Boolean), // Remove falsy values
    },
  },
  // Improve TypeScript compilation performance
  typescript: {
    enableTypeChecking: true,
    typescriptLoaderOptions: {
      transpileOnly: true, // Skip full type checking to improve build speed
    },
  },
  style: {
    // Add source maps for CSS only in development
    css: {
      loaderOptions: {
        sourceMap: true, // Always include source maps for easier debugging
      },
    },
  },
  // Enable caching for faster rebuilds
  babel: {
    loaderOptions: {
      cacheDirectory: true,
      cacheCompression: false,
    },
  },
  // Configure Jest
  jest: {
    configure: {
      moduleNameMapper: {
        "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
      },
    },
  },
  // Ensure development server is properly configured
  devServer: {
    historyApiFallback: true, // For SPA routing
    hot: true,
    open: true,
    port: 3000,
  },
}; 