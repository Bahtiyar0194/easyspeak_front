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

const pendingPage = ref(true);

const tabs_data = computed(() => [
  {
    name: "current",
    title: t("pages.conference.statuses.current"),
    icon: "bi bi-broadcast",
    component: current,
  },
  {
    name: "planned",
    title: t("pages.conference.statuses.planned"),
    icon: "bi bi-calendar2-event",
    component: planned,
  },
  // {
  //     name: 'passed',
  //     title: t('pages.conference.statuses.passed'),
  //     icon: 'bi bi-check2-square'
  // },
]);

onMounted(() => {
  pendingPage.value = false;
});
</script>
