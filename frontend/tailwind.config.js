/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0a0a0a',
        'dark-surface': '#1a1a1a',
        'dark-surface-light': '#2a2a2a',
        'primary': '#1db954',
        'primary-hover': '#1ed760',
        'text-primary': '#ffffff',
        'text-secondary': '#b3b3b3',
        'text-muted': '#6a6a6a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
