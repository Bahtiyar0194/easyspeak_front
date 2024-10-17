import axios from "axios";
import { defineNuxtPlugin, useRuntimeConfig, useCookie } from "nuxt/app";

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();

    const axiosPlugin = axios.create();

    axiosPlugin.defaults.baseURL = config.public.apiBase;
    axiosPlugin.defaults.headers.common['Accept'] = 'application/json';

    const langCookie = useCookie('lang');

    if(langCookie.value){
        axiosPlugin.defaults.headers.common['Accept-Language'] = langCookie.value;
    }

    const subDomainCookie = useCookie('subdomain');

    if(subDomainCookie.value){
        axiosPlugin.defaults.headers.common['Subdomain'] = subDomainCookie.value;
    }

    const sanctumToken = useCookie('sanctum.token.cookie');

    if(sanctumToken.value){
        axiosPlugin.defaults.headers.common['Authorization'] = 'Bearer ' + sanctumToken.value;
    }

    return {
        provide: {
            axiosPlugin: axiosPlugin
        }
    }
})