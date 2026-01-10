/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'], // Set as default font
      },
      colors: {
        primary: { DEFAULT: '#2563eb', dark: '#1e40af', light: '#60a5fa' },
        slate: { 850: '#1e293b' } // Custom dark slate
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(37, 99, 235, 0.2)',
      }
    },
  },
  plugins: [],
}