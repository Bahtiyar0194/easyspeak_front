// import Peer from 'peerjs';
// import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app";

// export default defineNuxtPlugin((nuxtApp) => {
//     const config = useRuntimeConfig();
    
//     const peer = new Peer(1, {
//         host: config.public.peerBase,
//         path: '/peerjs/myapp',
//         secure: true
//     });

//     nuxtApp.provide('peerPlugin', peer);
// });

import Peer from 'peerjs';

export default defineNuxtPlugin(nuxtApp => {
  // Экспортируйте экземпляр PeerJS в глобальную область
  nuxtApp.provide('peer', Peer);
});