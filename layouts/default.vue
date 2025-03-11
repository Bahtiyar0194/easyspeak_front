<template>
  <div class="relative">
    <div
      class="fixed top-0 left-0 right-0 bg-active w-full flex justify-between p-4 border-b-inactive"
    >
      <div>
        <!-- <img class="w-full" src="~/public/logo.svg"> -->
        <span class="font-medium text-corp text-2xl"
          >EasySpeak</span
        >
      </div>

      <div class="btn-wrap items-center">
        <themeSwitcher />
        <selectLocale />
        <authUserMenu :showAuthMenu="false"/>
      </div>
    </div>
    <div class="h-screen w-full pt-16 pb-12">
      <NuxtPage />
    </div>
    <div
      class="fixed bottom-0 left-0 right-0 bg-active w-full flex justify-center text-center px-4 py-2 border-t-inactive"
    >
      <p class="mb-0">
        © {{ new Date().getFullYear() }} <u>EasySpeak.kz</u> -
        {{ $t("all_rights") }}
      </p>
    </div>
  </div>
</template>
<script setup>
import themeSwitcher from "../components/ui/themeSwitcher.vue";
import selectLocale from "../components/ui/selectLocale.vue";
import authUserMenu from "../components/authUserMenu.vue";
</script>
