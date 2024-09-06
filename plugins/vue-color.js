import { defineNuxtPlugin } from '#app';
import { Chrome, Twitter, Compact, Material, Slider, Swatches, Photoshop, Sketch, Hue, Alpha, Checkboard } from '@ckpack/vue-color';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('Chrome', Chrome);
  nuxtApp.vueApp.component('Twitter', Twitter);
  nuxtApp.vueApp.component('Compact', Compact);
  nuxtApp.vueApp.component('Material', Material);
  nuxtApp.vueApp.component('Slider', Slider);
  nuxtApp.vueApp.component('Swatches', Swatches);
  nuxtApp.vueApp.component('Photoshop', Photoshop);
  nuxtApp.vueApp.component('Sketch', Sketch);
  nuxtApp.vueApp.component('Hue', Hue);
  nuxtApp.vueApp.component('Alpha', Alpha);
  nuxtApp.vueApp.component('Checkboard', Checkboard);
});