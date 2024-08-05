import Peer from 'peerjs';
import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app";

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();

    console.log(config.public)

    const peer = new Peer(undefined, {
        host: config.public.peerBase
    });

    nuxtApp.provide('peerPlugin', peer);
});