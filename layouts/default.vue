<template>
  <loader v-if="pending" :className="'full-overlay'" />
  <div class="relative flex flex-col min-h-screen">
    <stickyBox :offsetTop="0" :className="'z-10 shrink-0'">
      <div
        class="bg-active w-full flex justify-between px-4 lg:px-20 py-6 border-b-inactive"
      >
        <div>
          <nuxt-link :to="localePath('/')">
            <!-- <img class="w-full" src="~/public/logo.svg"> -->
            <span class="font-medium text-corp text-3xl">EasySpeak</span>
          </nuxt-link>
        </div>

        <div class="btn-wrap items-center">
          <themeSwitcher />
          <selectLocale />
          <authUserMenu :showAuthMenu="false" />
        </div>
      </div>
    </stickyBox>
    <div class="w-full flex-1">
      <div class="custom-grid">
        <div v-if="route && route.path != '/'" class="col-span-12 px-4 lg:px-20 pt-4">
          <breadcrumb />
        </div>
        <div
          class="col-span-12"
          :class="route && route.path != '/' ? 'px-4 lg:px-20 py-6' : ''"
        >
          <NuxtPage />
        </div>
      </div>
    </div>
    <div
      class="bg-active w-full pt-12 pb-6 px-4 lg:px-20 border-t-inactive shrink-0"
    >
      <div class="custom-grid">
        <div class="col-span-12 md:col-span-4">
          <h5 class="mb-2">Документы</h5>
          <ul class="list-none px-0">
            <li
              v-for="(item, itemIndex) in footer_menu_left"
              :key="itemIndex"
              :class="footer_menu_left.length - 1 !== itemIndex ? 'mb-2' : ''"
            >
              <nuxt-link :to="localePath('/' + item)" class="text-inactive">
                {{ $t("pages." + item + ".title") }}
              </nuxt-link>
            </li>
          </ul>
        </div>
        <div class="col-span-12 md:col-span-4">
          <h5 class="mb-2">Контакты</h5>
          <ul class="list-none px-0">
            <li
              v-for="(item, itemIndex) in footer_menu_contact"
              :key="itemIndex"
              :class="
                footer_menu_contact.length - 1 !== itemIndex ? 'mb-2' : ''
              "
            >
              <div class="flex gap-x-1 items-center">
                <i :class="item.icon" class="text-corp"></i>
                <nuxt-link
                  v-if="item.internal === true"
                  :to="localePath('/' + item)"
                  class="text-inactive"
                >
                  {{ $t("pages." + item + ".title") }}
                </nuxt-link>
                <a v-else :href="item.link">{{ item.text }}</a>
              </div>
            </li>
          </ul>
        </div>
        <div class="col-span-12">
          <hr />
          <p class="mt-6 mb-0 text-center">
            © {{ new Date().getFullYear() }} <u>EasySpeak.kz</u> -
            {{ $t("all_rights") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import breadcrumb from "../components/ui/breadcrumb.vue";
import stickyBox from "../components/ui/stickyBox.vue";
import loader from "../components/ui/loader.vue";
import themeSwitcher from "../components/ui/themeSwitcher.vue";
import selectLocale from "../components/ui/selectLocale.vue";
import authUserMenu from "../components/authUserMenu.vue";
import { onMounted } from "vue";
const pending = ref(true);

const route = useRoute();

onMounted(() => {
  pending.value = false;
});

const footer_menu_left = ["privacy-policy", "refund-policy"];

const footer_menu_contact = [
  {
    internal: false,
    icon: "pi pi-mobile",
    text: "+ 7 (702) 799 2279",
    link: "tel:+77027992279",
  },
  {
    internal: false,
    icon: "pi pi-envelope",
    text: "info@easyspeak.kz",
    link: "mailto:info@easyspeak.kz",
  },
];
</script>
