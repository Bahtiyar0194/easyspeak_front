<template>
  <div class="col-span-12 lg:col-span-6 lg:col-start-3">
    <authCard :pending="pending">
      <template v-slot:header_content>
        <h2>{{ $t("pages.register.title") }}</h2>
      </template>
      <template v-slot:body_content>
        <client-only>
          <form @submit.prevent="register" ref="formRef">
            <template v-if="schoolStore.schoolData === null">
              <steps :currentStep="currentStep" :steps="registerSteps">
                <div
                  v-for="(step, index) in registerSteps"
                  :key="index"
                  :class="currentStep === index + 1 ? 'block' : 'hidden'"
                >
                  <component
                    v-if="step.component"
                    :is="step.component"
                    v-bind="step.props"
                  ></component>
                </div>
              </steps>
            </template>
            <template v-else>
              <secondStep :errors="errors" />
            </template>

            <p class="mt-4 mb-0">
              {{ $t("pages.register.have_an_account") }}
              <nuxt-link :to="localePath('/auth/login')">
                {{ $t("pages.login.sign_in") }}
              </nuxt-link>
            </p>

            <template v-if="schoolStore.schoolData === null">
              <div class="btn-wrap mt-4">
                <button
                  v-if="currentStep > 1"
                  class="btn btn-light"
                  @click="backToStep(currentStep - 1)"
                  type="button"
                >
                  <i class="pi pi-arrow-left"></i>
                  {{ $t("back") }}
                </button>

                <button class="btn btn-primary" type="submit">
                  <template v-if="currentStep !== registerSteps.length">
                    <i class="pi pi-arrow-right"></i>
                    {{ $t("continue") }}
                  </template>
                  <template v-else>
                    <i class="pi pi-check"></i>
                    {{ $t("save") }}
                  </template>
                </button>
              </div>
            </template>
            <button v-else class="btn btn-primary mt-4" type="submit">
              <i class="pi pi-arrow-right"></i>
              {{ $t("continue") }}
            </button>
          </form>
        </client-only>
      </template>
    </authCard>
  </div>
</template>

<script setup>
import authCard from "../../components/authCard.vue";
import { useRouter } from "vue-router";
import steps from "../../components/ui/steps.vue";
import firstStep from "../../components/auth/register/firstStep.vue";
import secondStep from "../../components/auth/register/secondStep.vue";

const { t, localeProperties } = useI18n();
const { $axiosPlugin } = useNuxtApp();
const router = useRouter();

const pending = ref(true);
const errors = ref([]);
const locations = ref([]);
const schoolStore = useSchoolStore();

const formRef = ref(null);

const registerSteps = [
  {
    title: t("form.school_data"),
    component: firstStep,
    props: { errors, locations },
  },
  {
    title: t("form.school_owner_data"),
    component: secondStep,
    props: {
      errors,
    },
  },
];

const currentStep = ref(1);

const backToStep = (step) => {
  currentStep.value = step;
};

useHead({
  title: t("pages.register.title"),
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "auth",
  middleware: ["sanctum:guest"],
});

const register = async () => {
  pending.value = true;
  const formData = new FormData(formRef.value);
  formData.append("lang", localeProperties.value.code);
  formData.append("step", currentStep.value);

  if (schoolStore.schoolData) {
    formData.append("first_registration", false);
    formData.append("school_domain", schoolStore.schoolData.school_domain);
  } else {
    formData.append("first_registration", true);
  }

  await $axiosPlugin
    .post("/auth/register", formData)
    .then((res) => {
      errors.value = [];
      if (res.data.step) {
        currentStep.value = res.data.step + 1;
        pending.value = false;
      } else {
        if (schoolStore.schoolData) {
          router.push("/auth/login");
        } else {
          window.location.replace(
            "http://" +
              res.data.school_domain +
              "." +
              window.location.host +
              "/auth/login"
          );
        }
      }
    })
    .catch((err) => {
      errors.value = err.response.data;
      pending.value = false;
      return;
    });
};

const getCities = async () => {
  await $axiosPlugin
    .get("/locations/get")
    .then((res) => {
      locations.value = res.data;
    })
    .catch((err) => {
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
};

onMounted(() => {
  pending.value = false;
  getCities();
});
</script>
