<template>
  <div class="col-span-12 lg:col-span-4 lg:col-start-4">
    <authCard :pending="pending">
      <template v-slot:header_content>
        <h2>{{ $t("pages.login.title") }}</h2>
      </template>
      <template v-slot:body_content>
        <form @submit.prevent="signIn" ref="formRef">
          <p
            v-if="errors.auth_failed || errors.message"
            class="text-danger mb-6"
          >
            {{ errors.auth_failed ? errors.auth_failed[0] : errors.message }}
          </p>
          <client-only>
            <div
              v-if="schoolStore.schoolData === null"
              class="form-group-border active mb-5"
            >
              <i class="pi pi-graduation-cap"></i>
              <input
                type="text"
                name="school_domain"
                v-model="schoolDomain"
                placeholder=" "
              />
              <label :class="{ 'label-error': errors.school_domain }">
                {{
                  errors.school_domain
                    ? errors.school_domain[0]
                    : $t("form.school_domain")
                }}
              </label>
            </div>

            <div v-else class="border-inactive p-4 mb-5 rounded-xl">
              <p class="mb-1">
                {{ $t("form.school_name") }}:
                <b>{{ schoolStore.schoolData.school_name }}</b>
              </p>
              <p class="mb-0">
                {{ $t("form.school_domain") }}:
                <b>{{ schoolStore.schoolData.school_domain }}</b>
              </p>

              <div v-if="!isSubdomain()" class="btn-wrap justify-end mt-4">
                <button
                  type="button"
                  class="btn btn-sm btn-light"
                  @click="resetSchool()"
                >
                  {{ $t("form.reset_school") }}
                </button>
              </div>
            </div>
          </client-only>
          <div class="form-group-border active mb-5">
            <i class="pi pi-at"></i>
            <input
              autoComplete="login-email"
              name="email"
              type="text"
              placeholder=" "
            />
            <label :class="{ 'label-error': errors.email }">
              {{ errors.email ? errors.email[0] : $t("form.email") }}
            </label>
          </div>

          <div class="form-group-border active mb-5">
            <i class="pi pi-lock"></i>
            <input
              autoComplete="login-password"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder=" "
            />
            <label :class="{ 'label-error': errors.password }">
              {{ errors.password ? errors.password[0] : $t("form.password") }}
            </label>
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="show-password"
            >
              <i class="pi pi-eye" v-if="showPassword"></i>
              <i class="pi pi-eye-slash" v-else></i>
            </button>
          </div>

          <p class="mb-1">
            {{ $t("pages.login.forgot_password") }}
            <nuxt-link :to="localePath('/auth/password-recovery')">
              {{ $t("pages.login.password_recovery") }}
            </nuxt-link>
          </p>

          <p>
            {{ $t("pages.login.dont_have_an_account") }}
            <nuxt-link :to="localePath('/auth/register')">
              {{ $t("pages.register.title") }}
            </nuxt-link>
          </p>

          <button type="submit" class="btn btn-primary">
            <i class="pi pi-arrow-right"></i>
            {{ $t("continue") }}
          </button>

          <div class="relative flex justify-between items-center my-5">
            <div class="flex-1 !border-t-0 border-inactive"></div>
            <div class="px-4 font-medium select-none">
              <div>{{ $t("or") }}</div>
            </div>
            <div class="flex-1 !border-t-0 border-inactive"></div>
          </div>

          <div class="btn-wrap">
            <button
              type="button"
              class="btn btn-lg btn-light !w-full"
              @click="redirectToGoogle"
            >
              <img :src="'/images/google/google-icon-logo.svg'" class="w-4 mr-0.5" />
              {{ $t("pages.login.methods.google") }}
            </button>
          </div>
        </form>
      </template>
    </authCard>
  </div>
</template>

<script setup>
import authCard from "../../components/auth/authCard.vue";
import { useCookie, useRoute, useRouter } from "nuxt/app";
import { useRuntimeConfig } from "nuxt/app";
import { isSubdomain } from "../../utils/isSubdomain";

const { t, localeProperties } = useI18n();
const { $axiosPlugin } = useNuxtApp();
const { login } = useSanctumAuth();
const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();

const gtm = ref(null);

const pending = ref(true);
const errors = ref([]);
const showPassword = ref(false);

const schoolDomain = ref("");
const schoolStore = useSchoolStore();

const formRef = ref(null);

useHead({
  title: t("pages.login.title"),
  meta: [{ name: "description", content: t("pages.home.description") }],
});

definePageMeta({
  layout: "auth",
  middleware: ["sanctum:guest"],
});

onMounted(() => {
  pending.value = false;
  gtm.value = window.dataLayer;

  if (route.query.gcode) {
    exchangeGoogleCode();
  }
});

async function signIn() {
  pending.value = true;

  const formData = new FormData(formRef.value);
  formData.append("lang", localeProperties.value.code);

  if (schoolStore.schoolData) {
    formData.append("school_domain", schoolStore.schoolData.school_domain);
  }

  try {
    await login(formData).then(() => {
      localStorage.setItem(
        "subdomain",
        schoolStore.schoolData
          ? schoolStore.schoolData.school_domain
          : formRef.value.school_domain.value,
      );

      schoolStore.getSchool();

      const sanctumToken = useCookie("sanctum.token.cookie");

      if (sanctumToken.value) {
        $axiosPlugin.defaults.headers.common["Authorization"] =
          "Bearer " + sanctumToken.value;
      }

      gtm.value?.push({
        event: "sign_in",
        method: "email",
        user_type: "student",
      });

      // ✅ Перенаправление обратно на сохранённый путь или на /dashboard
      const redirectPath = route.query.redirect || "/dashboard";
      router.push(redirectPath);
    });
  } catch (err) {
    if (err.response.status) {
      errors.value = err.response._data;
    }
  } finally {
    pending.value = false;
  }
}

const redirectToGoogle = async () => {
  pending.value = true;

  schoolStore.getSchool();

  await $axiosPlugin
    .post("/school/get_school_by_domain", {
      school_domain: schoolStore.schoolData ? schoolStore.schoolData.school_domain : schoolDomain.value,
      lang: localeProperties.value.code,
    })
    .then((res) => {
      errors.value = [];

      const currentOrigin = window.location.origin;

      // Формируем URL к роуту Laravel
      const backendUrl = `${config.public.apiBase}/auth/google/redirect?return_url=${encodeURIComponent(currentOrigin)}&school_id=${res.data.school_id}&lang_tag=${localeProperties.value.code}`;

      window.location.href = backendUrl;
    })
    .catch((err) => {
      errors.value = err.response.data;
      pending.value = false;
      return;
    });
};

const exchangeGoogleCode = async () => {
  pending.value = true;

  await $axiosPlugin
    .post("/auth/google/exchange", {
      code: route.query.gcode,
      lang: localeProperties.value.code,
    })
    .then((res) => {
      errors.value = [];

      localStorage.setItem(
        "subdomain",
        schoolStore.schoolData
          ? schoolStore.schoolData.school_domain
          : res.data.school_domain,
      );

      schoolStore.getSchool();

      const sanctumToken = useCookie("sanctum.token.cookie");

      sanctumToken.value = res.data.token;

      if (sanctumToken.value) {
        $axiosPlugin.defaults.headers.common["Authorization"] =
          "Bearer " + sanctumToken.value;
      }

      gtm.value?.push({
        event: "sign_in",
        method: "gmail",
        user_type: "student",
      });

      window.location.href = "/dashboard";
    })
    .catch((err) => {
      errors.value = err.response.data;
      pending.value = false;
      return;
    });
};

async function resetSchool() {
  await schoolStore.resetSchool();
}
</script>
