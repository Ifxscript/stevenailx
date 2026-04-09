/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: '#8B3A4A',
          dark: '#6B2D3E',
        },
        cream: '#F5EDE8',
        'white-warm': '#FFFAF7',
      },
    },
  },
  plugins: [],
}
