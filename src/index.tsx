// This file is intentionally disabled to avoid duplicate app initialization
// The application is loaded from main.tsx

// NOTE: This file contained duplicate initialization code that was causing
// the app to load twice. All functionality from this file has been moved to main.tsx.

console.warn('index.tsx is disabled - Application is loaded from main.tsx');

// Add empty export to make this file a module (avoiding TS1208 error)
export { };
