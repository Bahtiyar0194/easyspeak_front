import axios from "axios";
import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app";

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();

    const axiosPlugin = axios.create();

    axiosPlugin.defaults.baseURL = config.public.apiBase;
    axiosPlugin.defaults.headers.common['Accept-Language'] = nuxtApp.$i18n.localeProperties.value.code;

    return {
        provide: {
            axiosPlugin: axiosPlugin
        }
    }
})