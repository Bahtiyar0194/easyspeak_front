<template>
  <div class="col-span-10 md:col-span-6 md:col-start-3 lg:col-span-4 lg:col-start-4">
    <authCard :pending="pending">
      <template v-slot:header_content>
        <h3>{{ $t("pages.password-recovery.title") }}</h3>
      </template>
      <template v-slot:body_content>
        <div v-if="success === true" class="text-center" role="status">
          <i class="bi bi-envelope-check text-5xl text-success" aria-hidden="true"></i>
          <p class="mt-2">{{ $t("pages.password-recovery.send") }}</p>
          <nuxt-link class="btn btn-light full" :to="localePath('/auth/login')">
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
            {{ $t("pages.login.back_to_login") }}
          </nuxt-link>
        </div>
        <form v-else @submit.prevent="passwordRecovery" ref="formRef" novalidate>
          <div
            v-if="errors.auth_failed || errors.message"
            class="form-error"
            role="alert"
          >
            <i class="pi pi-exclamation-circle mt-0.5" aria-hidden="true"></i>
            <span>{{
              errors.auth_failed ? errors.auth_failed[0] : errors.message
            }}</span>
          </div>

          <client-only>
            <div
              v-if="schoolStore.schoolData === null"
              class="form-group-border active mb-5"
            >
              <i class="pi pi-graduation-cap"></i>
              <input
                type="text"
                name="school_domain"
                autocomplete="off"
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
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
              autocomplete="username"
              name="email"
              type="email"
              inputmode="email"
              autocapitalize="none"
              spellcheck="false"
              placeholder=" "
            />
            <label :class="{ 'label-error': errors.email }">
              {{ errors.email ? errors.email[0] : $t("form.email") }}
            </label>
          </div>

          <button
            type="submit"
            class="btn btn-primary full"
            :class="{ loading: pending }"
            :disabled="pending"
          >
            <i class="pi pi-arrow-right" aria-hidden="true"></i>
            {{ $t("continue") }}
          </button>

          <p class="mt-4 mb-0 text-center">
            <nuxt-link :to="localePath('/auth/login')">
              {{ $t("pages.login.back_to_login") }}
            </nuxt-link>
          </p>
        </form>
      </template>
    </authCard>
  </div>
</template>
<script setup>
import authCard from "../../components/auth/authCard.vue";
import { isSubdomain } from "../../utils/isSubdomain";

const { t, localeProperties } = useI18n();
const { $axiosPlugin } = useNuxtApp();

const pending = ref(false);
const success = ref(false);
const errors = ref([]);

const schoolStore = useSchoolStore();

const formRef = ref(null);

useHead({
  title: t("pages.password-recovery.title"),
  meta: [{ name: "description", content: t("pages.home.description") }],
});

definePageMeta({
  layout: "auth",
  middleware: ["sanctum:guest"],
});

async function passwordRecovery() {
  if (pending.value) return;
  pending.value = true;
  const formData = new FormData(formRef.value);
  formData.append("lang", localeProperties.value.code);

  if (schoolStore.schoolData) {
    formData.append("school_domain", schoolStore.schoolData.school_domain);
  }

  await $axiosPlugin
    .post("/auth/password_recovery", formData)
    .then((res) => {
      errors.value = [];
      success.value = true;
      pending.value = false;
    })
    .catch((err) => {
      errors.value = err.response?.data || { message: t("an_error_occurred") };
      pending.value = false;
      return;
    });
}

async function resetSchool() {
  await schoolStore.resetSchool();
}
</script>
