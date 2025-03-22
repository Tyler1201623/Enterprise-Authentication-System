// Add module declaration
/// <reference types="node" />

// Import polyfills correctly - ensure they're loaded first
import 'buffer'; // Import the module first
import { Buffer } from 'buffer';
import process from 'process/browser';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css'; // Tailwind CSS
import './styles.css';

// Import our custom define-globalThis-property module
import defineGlobalProperty from './internals/define-globalThis-property';

// Make sure globalThis is properly defined
defineGlobalProperty('globalThis', typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);

console.log('Enterprise Authentication System starting...');

// Set up error tracking to debug blank screen issues
let hasRendered = false;

// Ensure polyfills are available globally
(function setupPolyfills() {
  try {
    // Polyfill for Buffer
    if (typeof window.Buffer === 'undefined') {
      console.log('Buffer not defined, adding polyfill');
      window.Buffer = Buffer as any;
    }

    // Fix: Set window.process properly
    if (typeof window.process === 'undefined') {
      console.log('Process not defined, adding polyfill');
      window.process = process as any;
    }
    
    console.log('Polyfills setup complete');
  } catch (err) {
    console.error('Error setting up polyfills:', err);
  }
})();

// Add detailed error handling for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  // Log stack trace for better debugging
  if (event.error && event.error.stack) {
    console.error('Error stack:', event.error.stack);
  }
  
  // Check if we failed to render
  if (!hasRendered) {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif;">
          <h2 style="color: #d32f2f;">Error Loading Application</h2>
          <p>The application encountered an error during initialization.</p>
          <p>Please check the console for more details or try refreshing the page.</p>
          <button onclick="window.location.reload()" style="padding: 8px 16px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }
  
  // Prevent app from crashing completely
  event.preventDefault();
});

// Performance monitoring
const logPerformanceMetrics = () => {
  // Wait for page to be fully loaded
  setTimeout(() => {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      console.log('⚡️ Performance metrics:');
      console.log(`- DOM Content Loaded: ${Math.round(navigationTiming.domContentLoadedEventEnd - navigationTiming.startTime)}ms`);
      console.log(`- First Paint: ${Math.round(performance.getEntriesByName('first-paint')[0]?.startTime || 0)}ms`);
      console.log(`- Time to Interactive: ${Math.round(navigationTiming.domInteractive - navigationTiming.startTime)}ms`);
      console.log(`- Total Load Time: ${Math.round(navigationTiming.loadEventEnd - navigationTiming.startTime)}ms`);
    }
  }, 0);
};

// Initialize optimizations
const preconnectUrls = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

preconnectUrls.forEach(url => {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
});

// Simple reportWebVitals function
const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    }).catch(err => {
      console.error('Error loading web-vitals:', err);
    });
  }
};

// Enhanced function to remove loading screen with smooth transition
function removeLoadingScreen() {
  console.log('Removing loading screen');
  
  const rootLoading = document.getElementById('root-loading');
  if (rootLoading) {
    console.log('Found root-loading element, removing...');
    rootLoading.style.opacity = '0';
    rootLoading.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
      if (rootLoading.parentNode) {
        rootLoading.parentNode.removeChild(rootLoading);
        console.log('Root loading screen removed from DOM');
      }
    }, 500);
  } else {
    console.warn('No loading screen element found with ID "root-loading"');
  }
}

// Initialize application
function initApp() {
  try {
    // Find the root element
    const rootElement = document.getElementById('root');

    if (!rootElement) {
      console.error('Root element not found in DOM!');
      return;
    }
    
    console.log('Root element found, rendering application...');
    
    // Use createRoot for React 18
    const root = createRoot(rootElement);
    
    // Render the app with error boundaries
    root.render(
      <StrictMode>
        <AuthProvider>
          <App />
        </AuthProvider>
      </StrictMode>
    );
    
    console.log('React render completed!');
    hasRendered = true;
    
    // Start monitoring performance
    logPerformanceMetrics();
    
    // Success! Remove loading screen after render completes
    removeLoadingScreen();
  } catch (error) {
    console.error('Fatal error rendering application:', error);
    
    // Still try to remove loading screen even on error
    removeLoadingScreen();
    
    // Show error message in root element
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif;">
          <h2 style="color: #d32f2f;">Application Error</h2>
          <p>Sorry, the application failed to initialize correctly.</p>
          <p>Please try refreshing the page or contact support if the issue persists.</p>
          <button onclick="window.location.reload()" style="padding: 8px 16px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }
}

// Initialize the application
console.log('Calling initApp()...');
initApp();

// Extra fallback to ensure loading screen gets removed
setTimeout(() => {
  if (!hasRendered) {
    console.warn('Application may not have rendered correctly, forcing removal of loading screen');
    removeLoadingScreen();
  }
}, 5000);
