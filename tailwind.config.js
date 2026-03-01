/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'bg-primary': '#0B0E11',
        'bg-secondary': '#1E2026',
        'bg-tertiary': '#2B2F36',
        'border-base': '#2E3340',
        'accent': '#F0B90B',
        'accent-hover': '#D4A009',
        'text-primary': '#EAECEF',
        'text-secondary': '#848E9C',
        'text-muted': '#474D57',
        'success': '#0ECB81',
        'danger': '#F6465D',
      },
      tabularNums: {
        'nums': 'tabular-nums',
      },
    },
  },
  plugins: [],
};