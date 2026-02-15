/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: '#FAF7F2',
          surface: '#FFFFFF',
          primary: '#D4756B',
          'primary-dark': '#B85C53',
          text: '#3D3232',
          'text-secondary': '#8B7E7E',
          'progress-bg': '#E8E0D8',
          success: '#7BAE6E',
          danger: '#D45D5D',
        },
      },
    },
  },
  plugins: [],
};
