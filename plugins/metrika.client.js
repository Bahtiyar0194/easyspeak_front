export default defineNuxtPlugin(() => {
    const runtimeConfig = useRuntimeConfig()

        ; (function (m, e, t, r, i, k, a) {
            // @ts-ignore
            m[i] =
                m[i] ||
                function () {
                    // @ts-ignore
                    ; (m[i].a = m[i].a || []).push(arguments)
                }

            // @ts-ignore
            m[i].l = 1 * new Date()

            k = e.createElement(t)
            a = e.getElementsByTagName(t)[0]

            k.async = true
            k.src = r

            a.parentNode?.insertBefore(k, a)
        })(
            window,
            document,
            'script',
            'https://mc.yandex.ru/metrika/tag.js',
            'ym',
        )

    // @ts-ignore
    ym(runtimeConfig.public.metrikaId, 'init', {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true,
    })
})