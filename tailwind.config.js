/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          200: '#424242',
          500: '#212121',
          900: '#141414'
        },

        accent: {
          100: '#cde4ff',
          300: '#56a4ff'
        },

        current: {
          500: '#828282'
        }
      }
    },
  },
  plugins: [],
}