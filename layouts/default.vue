<template>
  <loader v-if="pending" :className="'full-overlay'" :showPendingText="true" />
  <div class="relative flex flex-col min-h-screen">
    <stickyBox :offsetTop="0" :className="'z-10 shrink-0'">
      <div
        class="bg-active w-full flex items-center justify-between px-4 lg:px-12 py-4 border-b-inactive"
      >
        <div>
          <nuxt-link :to="localePath('/')">
            <div class="logo">
              <img
                class="w-28 logo-light"
                src="~/public/images/logo-light.svg"
              />
              <img class="w-28 logo-dark" src="~/public/images/logo-dark.svg" />
            </div>
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
        <div
          v-if="route && route.path != '/'"
          class="col-span-12 px-4 lg:px-12 pt-4"
        >
          <breadcrumb />
        </div>
        <div
          class="col-span-12"
          :class="route && route.path != '/' ? 'px-4 lg:px-12 py-6' : ''"
        >
          <NuxtPage />
        </div>
      </div>
    </div>
    <div
      class="bg-active w-full pt-12 pb-6 px-4 lg:px-12 border-t-inactive shrink-0"
    >
      <div class="custom-grid !gap-x-6">
        <div class="col-span-12 md:col-span-2">
          <div>
            <nuxt-link :to="localePath('/')">
              <div class="logo">
                <img
                  class="w-full logo-light"
                  src="~/public/images/logo-light.svg"
                />
                <img
                  class="w-full logo-dark"
                  src="~/public/images/logo-dark.svg"
                />
              </div>
            </nuxt-link>
          </div>
        </div>
        <div class="col-span-12 md:col-span-4">
          <h5 class="mb-4">{{ $t("contacts") }}</h5>
          <ul class="list-none px-0">
            <li
              v-for="(item, itemIndex) in footer_menu_contact"
              :key="itemIndex"
              :class="
                footer_menu_contact.length - 1 !== itemIndex ? 'mb-5' : ''
              "
            >
              <div class="flex gap-x-2 text-inactive items-baseline">
                <i :class="[item.icon, item.link ? 'text-corp' : '']"></i>
                <template v-if="item.link">
                  <nuxt-link
                    v-if="item.internal === true"
                    :to="localePath('/' + item)"
                    class="text-inactive leading-none"
                  >
                    {{ $t("pages." + item + ".title") }}
                  </nuxt-link>
                  <a
                    v-else
                    class="leading-none"
                    :href="item.link"
                    :target="item.blank === true ? '_blank' : '_self'"
                    >{{ item.text }}</a
                  >
                </template>
                <span v-else>{{ item.text }}</span>
              </div>
            </li>
          </ul>
        </div>

        <div class="col-span-12 md:col-span-3">
          <h5 class="mb-4">{{ $t("requisites") }}</h5>
          <ul class="list-none px-0">
            <li
              v-for="(item, itemIndex) in footer_menu_requisites"
              :key="itemIndex"
              :class="
                footer_menu_requisites.length - 1 !== itemIndex ? 'mb-2' : ''
              "
            >
              <div class="flex gap-x-1 text-inactive">
                <span v-if="item.attr">{{ item.attr }}:</span>
                <b>{{ item.text }}</b>
              </div>
            </li>
          </ul>
        </div>

        <div class="col-span-12 md:col-span-3">
          <h5 class="mb-4">{{ $t("documents") }}</h5>
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

        <div class="col-span-12">
          <hr />
          <p class="mt-6 mb-0 text-center">
            © {{ new Date().getFullYear() }}
            <u
              ><nuxt-link to="/" class="text-active">{{
                $contacts.site_name
              }}</nuxt-link></u
            >
            -
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
import authUserMenu from "../components/auth/authUserMenu.vue";
import { onMounted } from "vue";

const route = useRoute();
const { $contacts } = useNuxtApp();
const { t, localeProperties } = useI18n();

const pending = ref(true);

onMounted(() => {
  pending.value = false;
});

const footer_menu_left = [
  "the-offer-agreement",
  "privacy-policy",
  "refund-policy",
];

const footer_menu_contact = [
  {
    icon: "pi pi-id-card",
    text: $contacts.legal_name_full[localeProperties.value.code],
  },
  {
    internal: false,
    icon: "pi pi-mobile",
    text: $contacts.phone,
    link: "tel:" + $contacts.phone,
    blank: false,
  },
  {
    internal: false,
    icon: "pi pi-envelope",
    text: $contacts.email,
    link: "mailto:" + $contacts.email,
    blank: false,
  },
  {
    internal: false,
    icon: "pi pi-map-marker",
    text: $contacts.legal_address[localeProperties.value.code],
    link: $contacts.legal_address.map_link,
    blank: true,
  },
];

const footer_menu_requisites = [
  {
    attr: t("form.bin"),
    text: $contacts.bin,
  },
  {
    attr: t("form.card.bank"),
    text: $contacts.bank.name[localeProperties.value.code],
  },
  {
    attr: t("form.bik"),
    text: $contacts.bank.bik,
  },
  {
    attr: t("form.iik"),
    text: $contacts.bank.iik,
  },
];
</script>
