import Two from 'two.js';

export default defineNuxtPlugin(nuxtApp => {
    nuxtApp.provide('twoPlugin', Two);
});
