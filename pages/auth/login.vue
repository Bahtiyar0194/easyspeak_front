<template>
  <authCard :pending="pending">
    <template v-slot:header_content>
      <h2>{{ $t("pages.login.title") }}</h2>
    </template>
    <template v-slot:body_content>
      <form @submit.prevent="signIn" ref="formRef">
        <p v-if="errors.auth_failed" class="text-danger mb-6">
          {{ errors.auth_failed[0] }}
        </p>

        <client-only>
          <div class="form-group-border active mb-5">
            <i class="pi pi-graduation-cap"></i>
            <input type="text" name="school_domain" placeholder=" " />
            <label :class="{ 'label-error': errors.school_domain }">
              {{
                errors.school_domain
                  ? errors.school_domain[0]
                  : $t("form.school_domain")
              }}
            </label>
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

        <p>
          {{ $t("pages.login.forgot_password") }}
          <nuxt-link :to="localePath('/auth/login')">
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
      </form>
    </template>
  </authCard>
</template>

<script setup>
import authCard from "../../components/authCard.vue";
import { useCookie, useRoute, useRouter } from "nuxt/app";

const { t, localeProperties } = useI18n();
const { $schoolPlugin, $axiosPlugin } = useNuxtApp();
const { login } = useSanctumAuth();
const route = useRoute();
const router = useRouter();

const pending = ref(true);
const errors = ref([]);
const showPassword = ref(false);
const school = $schoolPlugin;

const formRef = ref(null);

useHead({
  title: t("pages.login.title"),
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "auth",
  middleware: ["sanctum:guest"],
});

onMounted(() => {
  pending.value = false;
});

async function signIn() {
  pending.value = true;

  const formData = new FormData(formRef.value);
  formData.append("lang", localeProperties.value.code);

  try {
    await login(formData).then(() => {
      const subDomainCookie = useCookie("subdomain");
      subDomainCookie.value = formRef.value.school_domain.value;

      const sanctumToken = useCookie("sanctum.token.cookie");

      if (sanctumToken.value) {
        $axiosPlugin.defaults.headers.common["Authorization"] =
          "Bearer " + sanctumToken.value;
      }

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
</script>
