<template>
  <loader v-if="pending" :className="'full-overlay'" />
  <div class="relative">
    <div class="bg-active w-full flex justify-between p-4 border-b-inactive">
      <div>
        <!-- <img class="w-full" src="~/public/logo.svg"> -->
        <span class="font-medium text-corp text-2xl">EasySpeak</span>
      </div>

      <div class="btn-wrap items-center">
        <themeSwitcher />
        <selectLocale />
        <authUserMenu :showAuthMenu="false" />
      </div>
    </div>
    <div class="w-full p-4">
      <div class="custom-grid">
        <div class="col-span-12">
          <NuxtPage />
        </div>
      </div>
    </div>
    <div class="bg-active w-full p-4 border-t-inactive">
      <div class="custom-grid">
        <div class="col-span-12 md:col-span-4">
          <nuxt-link :to="localePath('/privacy-policy')" class="text-inactive font-medium">
            {{ $t("pages.privacy-policy.title") }}
          </nuxt-link>
        </div>
        <div class="col-span-12">
          <hr />
          <p class="mt-4 mb-0 text-center">
            © {{ new Date().getFullYear() }} <u>EasySpeak.kz</u> -
            {{ $t("all_rights") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import loader from "../components/ui/loader.vue";
import themeSwitcher from "../components/ui/themeSwitcher.vue";
import selectLocale from "../components/ui/selectLocale.vue";
import authUserMenu from "../components/authUserMenu.vue";
import { onMounted } from "vue";
const pending = ref(true);

onMounted(() => {
  pending.value = false;
});
</script>
