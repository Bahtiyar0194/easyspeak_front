import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(async (nuxtApp) => {
  if (process.client) {
    const Plyr = (await import('plyr')).default
    nuxtApp.provide('Plyr', Plyr)
  }
})