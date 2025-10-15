<template>
  <div class="col-span-12 lg:col-span-4 lg:col-start-4">
    <authCard :pending="pending">
      <template v-slot:header_content>
        <h3>{{ $t("pages.password-recovery.title") }}</h3>
      </template>
      <template v-slot:body_content>
        <div v-if="success === true">
          <p class="mb-0">{{ $t("pages.password-recovery.send") }}</p>
        </div>
        <form v-else @submit.prevent="passwordRecovery" ref="formRef">
          <p v-if="errors.auth_failed" class="text-danger mb-6">
            {{ errors.auth_failed[0] }}
          </p>

          <client-only>
            <div
              v-if="schoolStore.schoolData === null"
              class="form-group-border active mb-5"
            >
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

          <button type="submit" class="btn btn-primary">
            <i class="pi pi-arrow-right"></i>
            {{ $t("continue") }}
          </button>
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
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "auth",
  middleware: ["sanctum:guest"],
});

async function passwordRecovery() {
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
      errors.value = err.response.data;
      pending.value = false;
      return;
    });
}

async function resetSchool() {
  await schoolStore.resetSchool();
}
</script>
