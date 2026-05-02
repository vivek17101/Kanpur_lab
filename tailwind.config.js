/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a132b',
      },
      boxShadow: {
        soft: '0 12px 30px rgba(10, 19, 43, 0.08)',
      },
    },
  },
  plugins: [],
};
