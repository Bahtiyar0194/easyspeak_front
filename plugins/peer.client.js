import Peer from 'peerjs';
import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app";

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();
    
    const peer = new Peer(undefined, {
        host: config.public.peerBase,
        port: process.env.NODE_ENV === 'development' ? 3002 : '',
        path: '/peerjs/myapp',
        secure: process.env.NODE_ENV === 'development' ? false : true
    });

    nuxtApp.provide('peerPlugin', peer);
});