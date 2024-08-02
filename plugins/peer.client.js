import Peer from 'peerjs';
import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app";

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();

    const peer = new Peer(undefined, {
        host: 'localhost',
        port: 9000,
        path: '/peerjs'
    });

    nuxtApp.provide('peerPlugin', peer);
});