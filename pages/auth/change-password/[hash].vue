<template>
  <div class="col-span-12 lg:col-span-4 lg:col-start-4">
    <authCard :pending="pending">
      <template v-slot:header_content>
        <h3>{{ $t("pages.change-password.title") }}</h3>
      </template>
      <template v-slot:body_content>
        <div v-if="errors.invalid && errors.invalid === true">
          <p class="text-danger mb-0">
            {{ $t("pages.password-recovery.invalid") }}
            <nuxt-link :to="localePath('/auth/password-recovery')">
              {{ $t("pages.login.password_recovery") }}
            </nuxt-link>
          </p>
        </div>
        <form v-else @submit.prevent="setNewPassword" ref="formRef">
          <note
            v-if="userData"
            :message="
              $t('pages.change-password.inst_1', {
                name: userData.first_name,
              })
            "
            :className="'outline-success mb-4'"
          />
          <p v-if="errors.auth_failed" class="text-danger mb-6">
            {{ errors.auth_failed[0] }}
          </p>

          <div class="form-group-border active mb-5">
            <i class="pi pi-lock"></i>
            <input
              autoComplete="register-password"
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
            >
              <i class="pi pi-eye" v-if="showPassword"></i>
              <i class="pi pi-eye-slash" v-else></i>
            </button>
          </div>

          <div class="form-group-border active mb-5">
            <i class="pi pi-lock"></i>
            <input
              autoComplete="register-password-confirmation"
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
import authCard from "../../components/authCard.vue";
import { useRoute, useRouter } from "nuxt/app";
import note from "../../../components/ui/note.vue";

const { t, localeProperties } = useI18n();
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
  meta: [{ name: "description", content: "My amazing site." }],
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
      errors.value = err.response.data;
    })
    .finally(() => {
      pending.value = false;
    });
}

async function setNewPassword() {
  pending.value = true;
  const formData = new FormData(formRef.value);
  formData.append("lang", localeProperties.value.code);

  await $axiosPlugin
    .post("/auth/new_password/" + hash, formData)
    .then((res) => {
      router.push("/auth/login");
    })
    .catch((err) => {
      errors.value = err.response.data;
    })
    .finally(() => {
      pending.value = false;
    });
}

onMounted(() => {
  checkHash();
});
</script>
