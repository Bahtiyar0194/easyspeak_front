import { defineNuxtPlugin } from "nuxt/app";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

export default defineNuxtPlugin(nuxtApp => {
    nuxtApp.vueApp.use(Toast, {
        // Внешний вид — .custom-toast в assets/css/main.css, иконки — useNotify.js
        hideProgressBar: false,
        position: 'top-right',
        icon: false,
        // Настоящая кнопка: доступна с клавиатуры и для экранных дикторов
        closeButton: 'button',
        closeButtonClassName: "close-button",
        // Мягкое появление вместо bounce по умолчанию (анимация — в main.css)
        transition: 'toast-slide',
        closeOnClick: true,
        pauseOnHover: true,
        // Не больше 4 уведомлений одновременно, новые — сверху.
        maxToasts: 4,
        newestOnTop: true,
    });
});