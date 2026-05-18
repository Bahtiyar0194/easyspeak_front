export default defineNuxtConfig({
  devtools: { enabled: false },
  css: [
    '@fortawesome/fontawesome-free/css/all.css',
    'primeicons/primeicons.css',
    'bootstrap-icons/font/bootstrap-icons.css',
    'plyr/dist/plyr.css',
    //'vue3-carousel/dist/carousel.css',
    'keen-slider/keen-slider.min.css',
    'vue-toastification/dist/index.css',
    '@/assets/css/main.css',
    '@/assets/css/slider-animate.css'
  ],

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'mailru-domain', content: 'YjGjpsYdyCkQxXzx' },
        { name: "yandex-verification", content: "1cf8ade847a957c4" }
      ],
      script: [
        {
          src: "https://checkout.tiptoppay.kz/checkout.js",
          defer: true
        },
        {
          children: `
            (function() {
              const savedTheme = document.cookie.match(new RegExp('(^| )theme=([^;]+)'))?.[2];
              if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            })();
          `,
          type: 'text/javascript',
        },
        {
          innerHTML: `
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();

              for (var j = 0; j < document.scripts.length; j++) {
                if (document.scripts[j].src === r) {
                  return;
                }
              }

              k=e.createElement(t),
              a=e.getElementsByTagName(t)[0],
              k.async=1,
              k.src=r,
              a.parentNode.insertBefore(k,a)

            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=103898375', 'ym');

            ym(103898375, 'init', {
              ssr:true,
              webvisor:true,
              clickmap:true,
              ecommerce:"dataLayer",
              referrer: document.referrer,
              url: location.href,
              accurateTrackBounce:true,
              trackLinks:true
            });
          `,
          type: 'text/javascript',
        },
        {
          innerHTML: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-KDHBKT4F');
            `,
          type: 'text/javascript',
        }
      ],
      noscript: [
        {
          innerHTML: `
            <div>
              <img
                src="https://mc.yandex.ru/watch/103898375"
                style="position:absolute; left:-9999px;"
                alt=""
              />
            </div>
          `,
        },
        {
          innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KDHBKT4F" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
        }
      ],
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'EasySpeak',
      short_name: 'EasySpeak',
      description: 'EasySpeak Progressive Web App',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      start_url: '/dashboard',
      scope: '/',
      display: 'standalone',
      lang: 'ru',
      icons: [
        {
          src: '/public/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/public/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.destination === 'document',
          handler: 'NetworkFirst',
        },
        {
          urlPattern: ({ request }) =>
            ['style', 'script', 'image', 'font'].includes(request.destination),
          handler: 'CacheFirst',
          options: {
            cacheName: 'assets-cache',
          },
        },
      ],
    },
  },

  modules: ["@nuxtjs/i18n", 'nuxt-auth-sanctum', '@pinia/nuxt', '@vueuse/motion/nuxt', "nuxt-pdfmake"],

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
      stunURL: process.env.STUN_URL,
      turnURL: process.env.TURN_URL,
      turnUSERNAME: process.env.TURN_USERNAME,
      turnPASSWORD: process.env.TURN_PASSWORD,
      telegramBotName: process.env.TELEGRAM_BOT_NAME,

      sanctum: {
        mode: 'token',
        baseUrl: process.env.NODE_ENV === 'development' ? process.env.DEV_API_URL : process.env.PROD_API_URL,
        endpoints: {
          login: '/auth/login',
          logout: '/auth/logout',
          user: '/auth/me',
        },
        redirect: {
          keepRequestedRoute: true,
          onLogin: '/dashboard',
          onLogout: '/auth/login',
          onAuthOnly: '/auth/login',
          onGuestOnly: '/dashboard',
        },
        // Добавляем хук для передачи языка
        token: {
          property: 'token',
          type: 'Bearer',
          global: true,
          required: true,
          // Добавляем хук token:before
          maxAge: 1800
        },
        hooks: {
          'token:before': (token, { $i18n }) => {
            // Получаем текущий язык из i18n
            const currentLocale = $i18n.locale;
            // Добавляем его в заголовки
            token.headers['Accept-Language'] = currentLocale;
          }
        }
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

  build: {
    // vue-toastification - old commonjs module 
    transpile: ['vue-toastification'],
  },


  compatibilityDate: '2024-07-24'
})