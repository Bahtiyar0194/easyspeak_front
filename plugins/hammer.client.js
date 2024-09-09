import Hammer from 'hammerjs';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('hammer', Hammer);
});