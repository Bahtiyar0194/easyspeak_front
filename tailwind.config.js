import colors from 'tailwindcss/colors'

// Фирменная палитра — единственное место, где задаются цвета бренда и
// статусов. Классы bg-corp, text-danger, border-success и т.п. в main.css
// берут значения отсюда через theme(), а Tailwind дополнительно даёт
// модификаторы: hover:bg-corp, bg-corp/10, ring-corp, dark:text-success...
const brand = {
  corp: { DEFAULT: colors.blue[500], 100: colors.blue[200] },
  info: { DEFAULT: colors.blue[500], 100: colors.blue[200] },
  success: { DEFAULT: colors.green[500], 100: colors.green[200] },
  danger: { DEFAULT: colors.red[500], 100: colors.red[100] },
  warning: { DEFAULT: colors.yellow[300], 100: colors.yellow[100] },
}

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
        ...brand,

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
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(34, 197, 94, 0.5), 0 0 10px rgba(34, 197, 94, 0.5)',
          },
          '50%': {
            boxShadow: '0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.8)',
          },
        },
      },
    },
  },
  plugins: [],
}