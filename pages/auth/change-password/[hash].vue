<template>
  <div class="col-span-10 md:col-span-6 md:col-start-3 lg:col-span-4 lg:col-start-4">
    <authCard :pending="pending">
      <template v-slot:header_content>
        <h3>{{ $t("pages.change-password.title") }}</h3>
      </template>
      <template v-slot:body_content>
        <div v-if="errors.invalid && errors.invalid === true" class="text-center">
          <i class="bi bi-link-45deg text-5xl text-danger" aria-hidden="true"></i>
          <p class="mt-2">{{ $t("pages.password-recovery.invalid") }}</p>
          <nuxt-link
            class="btn btn-primary full"
            :to="localePath('/auth/password-recovery')"
          >
            {{ $t("pages.login.password_recovery") }}
          </nuxt-link>
        </div>
        <form v-else @submit.prevent="setNewPassword" ref="formRef" novalidate>
          <note
            v-if="userData"
            :message="
              $t('pages.change-password.inst_1', {
                name: userData.first_name,
              })
            "
            :className="'outline-success mb-4'"
          />
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

          <div class="form-group-border active mb-5">
            <i class="pi pi-lock"></i>
            <input
              autocomplete="new-password"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder=" "
            />
            <label :class="{ 'label-error': errors.password }">
              {{
                errors.password ? errors.password[0] : $t("form.new_password")
              }}
            </label>
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="show-password"
              :title="$t(showPassword ? 'form.hide_password' : 'form.show_password')"
              :aria-label="$t(showPassword ? 'form.hide_password' : 'form.show_password')"
              :aria-pressed="showPassword"
            >
              <i class="pi pi-eye" v-if="showPassword" aria-hidden="true"></i>
              <i class="pi pi-eye-slash" v-else aria-hidden="true"></i>
            </button>
          </div>

          <div class="form-group-border active mb-5">
            <i class="pi pi-lock"></i>
            <input
              autocomplete="new-password"
              name="password_confirmation"
              :type="showPassword ? 'text' : 'password'"
              placeholder=" "
            />
            <label :class="{ 'label-error': errors.password_confirmation }">
              {{
                errors.password_confirmation
                  ? errors.password_confirmation[0]
                  : $t("form.new_password_confirmation")
              }}
            </label>
          </div>

          <button
            type="submit"
            class="btn btn-primary full"
            :class="{ loading: pending }"
            :disabled="pending"
          >
            <i class="pi pi-check" aria-hidden="true"></i>
            {{ $t("save") }}
          </button>
        </form>
      </template>
    </authCard>
  </div>
</template>
<script setup>
import authCard from "../../components/auth/authCard.vue";
import { useRoute, useRouter } from "nuxt/app";
import note from "../../../components/ui/note.vue";
import { useNotify } from "~/composables/useNotify";

const { t, localeProperties } = useI18n();
const notify = useNotify();
const { $axiosPlugin } = useNuxtApp();
const route = useRoute();
const router = useRouter();

const hash = route.params.hash;
const showPassword = ref(false);
const pending = ref(true);
const errors = ref([]);

const formRef = ref(null);
const userData = ref(null);

useHead({
  title: t("pages.change-password.title"),
  meta: [{ name: "description", content: t("pages.home.description") }],
});

definePageMeta({
  layout: "auth",
  middleware: ["sanctum:guest"],
});

async function checkHash() {
  pending.value = true;
  await $axiosPlugin
    .get("/auth/check_email_hash/" + hash)
    .then((res) => {
      userData.value = res.data;
    })
    .catch((err) => {
      errors.value = err.response?.data || { message: t("an_error_occurred") };
    })
    .finally(() => {
      pending.value = false;
    });
}

async function setNewPassword() {
  if (pending.value) return;
  pending.value = true;
  const formData = new FormData(formRef.value);
  formData.append("lang", localeProperties.value.code);

  await $axiosPlugin
    .post("/auth/new_password/" + hash, formData)
    .then(() => {
      notify("success", t("pages.change-password.success"));
      router.push("/auth/login");
    })
    .catch((err) => {
      errors.value = err.response?.data || { message: t("an_error_occurred") };
    })
    .finally(() => {
      pending.value = false;
    });
}

onMounted(() => {
  checkHash();
});
</script>
