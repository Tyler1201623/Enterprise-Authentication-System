// Add module declaration
/// <reference types="node" />

// Import polyfills correctly - ensure they're loaded first
import 'buffer'; // Import the module first
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import './index.css'; // Tailwind CSS
import './styles.css';

// Import the global property definer utility
import defineGlobalProperty from './internals/define-globalThis-property';

// Ensure proper buffer and process globals for browser environment
defineGlobalProperty('process', { env: {} });
defineGlobalProperty('Buffer', Buffer || {});

console.log('Enterprise Authentication System starting...');

// Simple initialization for window objects
if (typeof window !== 'undefined') {
  // @ts-ignore - Simple shim for process
  window.process = { env: { NODE_ENV: 'production' } };
}

// Track if app has rendered
let hasRendered = false;

// Function to remove loading screen
function removeLoadingScreen() {
  const loadingElement = document.getElementById('root-loading');
  if (loadingElement) {
    loadingElement.style.opacity = '0';
    setTimeout(() => {
      loadingElement.style.display = 'none';
    }, 500);
  }
}

// Error handler
window.addEventListener('error', (event) => {
  console.error('Application error:', event.error);
  
  if (!hasRendered) {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: system-ui, sans-serif;">
          <h2 style="color: #d32f2f;">Error Loading Application</h2>
          <p>The application encountered a problem while starting up.</p>
          <p>Please try refreshing the page or contact support if the issue persists.</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }
});

// Initialize the application
try {
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <AuthProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </AuthProvider>
      </React.StrictMode>
    );
    
    hasRendered = true;
    removeLoadingScreen();
  } else {
    console.error('Root element not found');
  }
} catch (error) {
  console.error('Fatal application error:', error);
  removeLoadingScreen();
}

// Backup timeout to remove loading screen
setTimeout(() => {
  if (!hasRendered) {
    removeLoadingScreen();
  }
}, 5000);
