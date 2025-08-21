import axios from "axios";
import { defineNuxtPlugin, useRuntimeConfig, useCookie } from "#app";
import { watch } from "vue";

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();
    const axiosPlugin = axios.create();

    axiosPlugin.defaults.baseURL = config.public.apiBase;
    axiosPlugin.defaults.headers.common["Accept"] = "application/json";

    // 🟢 язык
    const langCookie = useCookie("lang");
    if (langCookie.value) {
        axiosPlugin.defaults.headers.common["Accept-Language"] = langCookie.value;
    }

    // 🟢 токен только из cookie
    const sanctumToken = useCookie("sanctum.token.cookie");

    if (sanctumToken.value) {
        axiosPlugin.defaults.headers.common["Authorization"] =
            "Bearer " + sanctumToken.value;
    }

    // следим за изменением токена в cookie
    watch(
        () => sanctumToken.value,
        (newVal) => {
            if (newVal) {
                axiosPlugin.defaults.headers.common["Authorization"] =
                    "Bearer " + newVal;
            } else {
                delete axiosPlugin.defaults.headers.common["Authorization"];
            }
        },
        { immediate: true }
    );

    return {
        provide: {
            axiosPlugin,
        },
    };
});