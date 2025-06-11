<template>
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
</template>
<script setup>
import authCard from "../../components/authCard.vue";

const { t, localeProperties } = useI18n();
const { $axiosPlugin } = useNuxtApp();

const pending = ref(false);
const success = ref(false);
const errors = ref([]);

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
</script>
