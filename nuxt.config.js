export default defineNuxtConfig({
  devtools: { enabled: false },
  css: [
    '@/assets/css/main.css',
    '@fortawesome/fontawesome-free/css/all.css',
    'primeicons/primeicons.css'
  ],

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    }
  },

  modules: ["@nuxtjs/i18n", 'nuxt-auth-sanctum', '@pinia/nuxt'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NODE_ENV === 'development' ? process.env.DEV_API_URL : process.env.PROD_API_URL,
      socketBase: process.env.NODE_ENV === 'development' ? process.env.DEV_SOCKET_URL : process.env.PROD_SOCKET_URL,
      peerBase: process.env.NODE_ENV === 'development' ? process.env.DEV_PEER_URL : process.env.PROD_PEER_URL,
      sanctum: {
        mode: 'token',
        baseUrl: process.env.NODE_ENV === 'development' ? process.env.DEV_API_URL : process.env.PROD_API_URL,
        endpoints: {
          login: '/auth/login',
          logout: '/auth/logout',
          user: '/auth/me',
        },
        redirect: {
          keepRequestedRoute: false,
          onLogin: '/dashboard',
          onLogout: '/',
          onAuthOnly: '/auth/sign-in',
          onGuestOnly: '/',
        },
      },
    },
  },

  i18n: {
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'lang',
      alwaysRedirect: true
    },
    locales: [
      {
        name: 'Қазақша',
        short_name: 'Қаз',
        code: 'kk',
        iso: 'kk-KK',
        file: 'kk-KK.js',
        flag_img: 'kk.svg'
      },
      {
        name: 'Русский',
        short_name: 'Рус',
        code: 'ru',
        iso: 'ru-RU',
        file: 'ru-RU.js',
        flag_img: 'ru.svg'
      }
    ],
    lazy: true,
    langDir: 'lang/',
    strategy: 'no_prefix',
    defaultLocale: 'ru',
  },

  compatibilityDate: '2024-07-24'
})