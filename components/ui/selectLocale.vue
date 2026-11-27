<template>
  <dropdownMenu :dropdown-arrow="false">
    <template v-slot:btn_content>
      <!-- Квадратная кнопка с кодом языка — того же размера, что и соседние -->
      <button
        type="button"
        class="header-icon-btn header-locale-btn"
        :title="$t('choose_your_language')"
        :aria-label="$t('choose_your_language') + ': ' + localeProperties.name"
      >
        {{ localeProperties.short_name }}
      </button>
    </template>

    <template v-slot:menu_content>
      <li v-for="l in locales" :key="l.code">
        <button
          type="button"
          class="locale-item"
          :class="{ active: l.code === localeProperties.code }"
          :aria-current="l.code === localeProperties.code ? 'true' : undefined"
          :disabled="pending"
          @click="changeLocale(l.code)"
        >
          <span class="locale-code">{{ l.short_name }}</span>
          <span class="flex-1">{{ l.name }}</span>
          <i
            v-if="pending && pendingCode === l.code"
            class="pi pi-spinner btn-loading-circle"
            aria-hidden="true"
          ></i>
          <i
            v-else-if="l.code === localeProperties.code"
            class="pi pi-check text-corp"
            aria-hidden="true"
          ></i>
        </button>
      </li>
    </template>
  </dropdownMenu>
</template>
<script setup>
import { useNuxtApp } from "nuxt/app";
import dropdownMenu from "./dropdownMenu";
import { useRouter } from "nuxt/app";

const { localeProperties, locales, setLocale } = useI18n();
const authUser = useSanctumUser();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();

const pending = ref(false);
const pendingCode = ref(null);

const changeLocale = (value) => {
  // Тот же язык — ничего не делаем (раньше страница перезагружалась впустую)
  if (value === localeProperties.value.code || pending.value) return;

  pending.value = true;
  pendingCode.value = value;
  setLocale(value);

  setTimeout(async () => {
    if (authUser.value) {
      await $axiosPlugin
        .post("auth/change_language/" + value)
        .then(() => {
          window.location.reload();
        })
        .catch((err) => {
          pending.value = false;
          if (err.response) {
            router.push({
              path: "/error",
              query: {
                status: err.response.status,
                message: err.response.data.message,
                url: err.request.responseURL,
              },
            });
          } else {
            router.push("/error");
          }
        });
    } else {
      window.location.reload();
    }
  }, 200);
};
</script>
