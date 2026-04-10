/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        racing: {
          orange: '#F47321',
          black: '#1A1A1A',
          carbon: '#121212',
          cream: '#FAF5E4',
          danger: '#FF4B2B'
        }
      },
      fontFamily: {
        racing: ['Rajdhani', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
