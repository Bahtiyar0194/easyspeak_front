<template>
  <div class="custom-grid">
    <div v-if="route.query.course" class="col-span-12">
      <div class="bg-corp text-white p-4 rounded-xl">
        <p class="mb-1">
          <b>
            {{ $t("pages.courses.modal.description") }}
          </b>
        </p>
      </div>
    </div>
    <div class="col-span-12" v-if="schoolStore.schoolData">
      <div class="border-inactive p-4 rounded-xl">
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
    </div>

    <div class="col-span-12 md:col-span-6">
      <div class="form-group-border active">
        <i class="pi pi-user"></i>
        <input
          autocomplete="given-name"
          name="first_name"
          type="text"
          placeholder=" "
        />
        <label :class="{ 'label-error': errors.first_name }">
          {{ errors.first_name ? errors.first_name[0] : $t("form.first_name") }}
        </label>
      </div>
    </div>

    <div class="col-span-12 md:col-span-6">
      <div class="form-group-border active">
        <i class="pi pi-user"></i>
        <input
          autocomplete="family-name"
          name="last_name"
          type="text"
          placeholder=" "
        />
        <label :class="{ 'label-error': errors.last_name }">
          {{ errors.last_name ? errors.last_name[0] : $t("form.last_name") }}
        </label>
      </div>
    </div>
    <div class="col-span-12 md:col-span-6">
      <div class="form-group-border active">
        <i class="pi pi-mobile"></i>
        <input
          autocomplete="tel"
          name="phone"
          type="tel"
          inputmode="tel"
          v-mask="'+7 (###) ###-####'"
          placeholder=" "
        />
        <label :class="{ 'label-error': errors.phone }">
          {{ errors.phone ? errors.phone[0] : $t("form.phone") }}
        </label>
      </div>
    </div>
    <div class="col-span-12 md:col-span-6">
      <div class="form-group-border active">
        <i class="pi pi-at"></i>
        <input
          autocomplete="email"
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
    </div>
    <div class="col-span-12 md:col-span-6">
      <div class="form-group-border active">
        <i class="pi pi-lock"></i>
        <input
          autocomplete="new-password"
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
          :title="$t(showPassword ? 'form.hide_password' : 'form.show_password')"
          :aria-label="$t(showPassword ? 'form.hide_password' : 'form.show_password')"
          :aria-pressed="showPassword"
        >
          <i class="pi pi-eye" v-if="showPassword" aria-hidden="true"></i>
          <i class="pi pi-eye-slash" v-else aria-hidden="true"></i>
        </button>
      </div>
    </div>
    <div class="col-span-12 md:col-span-6">
      <div class="form-group-border active">
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
              : $t("form.password_confirmation")
          }}
        </label>
      </div>
    </div>
  </div>
</template>
<script setup>
import { isSubdomain } from "../../../utils/isSubdomain";
const route = useRoute();
const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },
});

const { errors } = toRefs(props);
const schoolStore = useSchoolStore();
const showPassword = ref(false);

async function resetSchool() {
  await schoolStore.resetSchool();
}
</script>
