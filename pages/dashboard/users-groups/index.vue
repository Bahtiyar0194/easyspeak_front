<template>
  <loader
    v-if="pendingPage"
    :className="'full-overlay'"
    :showPendingText="true"
  />
  <client-only>
    <tabs
      :tabs="tabs_data"
      :showTabHeader="schoolStore.isAiSchoolDomain === false"
    />
  </client-only>
</template>
<script setup>
import tabs from "../../../components/ui/tabs.vue";
import users from "../../../components/users-groups/tabs/users.vue";
import groups from "../../../components/users-groups/tabs/groups.vue";
import loader from "../../../components/ui/loader.vue";
const { t } = useI18n();
const schoolStore = useSchoolStore();

useHead({
  title: t(
    schoolStore.isAiSchoolDomain
      ? "pages.users.title"
      : "pages.users-groups.title",
  ),
  meta: [{ name: "description", content: t("pages.home.description") }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const pendingPage = ref(true);

const tabs_data = computed(() => [
  {
    name: "users",
    title: t("pages.users.title"),
    icon: "pi pi-user",
    component: users,
  },
  {
    name: "groups",
    title: t("pages.groups.title"),
    icon: "pi pi-users",
    component: groups,
  },
]);

onMounted(() => {
  pendingPage.value = false;
});
</script>
