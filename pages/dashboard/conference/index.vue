<template>
  <loader
    v-if="pendingPage"
    :className="'full-overlay'"
    :showPendingText="true"
  />
  <client-only>
    <tabs :tabs="tabs_data" />
  </client-only>
</template>
<script setup>
const { t } = useI18n();

useHead({
  title: t("pages.conference.title"),
  meta: [{ name: "description", content: t("pages.home.description") }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

import tabs from "../../../components/ui/tabs.vue";
import current from "../../../components/conference/tabs/current.vue";
import planned from "../../../components/conference/tabs/planned.vue";

import loader from "../../../components/ui/loader.vue";
import { onMounted } from "vue";

const { $axiosPlugin } = useNuxtApp();

const pendingPage = ref(true);
const attributes = ref([]);

const tabs_data = computed(() => [
  {
    name: "current",
    title: t("pages.conference.statuses.current"),
    icon: "bi bi-broadcast",
    component: current,
    props: {
      attributes,
    },
  },
  {
    name: "planned",
    title: t("pages.conference.statuses.planned"),
    icon: "bi bi-calendar2-event",
    component: planned,
    props: {
      attributes,
    },
  },
  // {
  //     name: 'passed',
  //     title: t('pages.conference.statuses.passed'),
  //     icon: 'bi bi-check2-square'
  // },
]);

const getConferenceAttributes = async () => {
  await $axiosPlugin
    .get("conferences/get_attributes")
    .then((response) => {
      attributes.value = response.data;
      pendingPage.value = false;
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
  getConferenceAttributes();
});
</script>
