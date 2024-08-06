import Peer from 'peerjs';
import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app";

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();
    
    const peer = new Peer(undefined, {
        host: config.public.peerBase,
        path: '/peerjs/myapp',
    });

    nuxtApp.provide('peerPlugin', peer);
});