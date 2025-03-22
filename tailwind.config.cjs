/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4285f4',
        secondary: '#34a853',
        warning: '#fbbc05',
        danger: '#ea4335',
        dark: '#202124',
        light: '#f8f9fa'
      },
    },
  },
  plugins: [],
} 