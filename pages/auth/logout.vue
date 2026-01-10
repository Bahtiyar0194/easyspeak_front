<template>
  <loader
    :className="'full-overlay'"
    :showPendingText="true"
    :pendingText="$t('pages.logout.please_wait')"
  />
</template>
<script setup>
import loader from "../../components/ui/loader.vue";
const { t } = useI18n();
const { $axiosPlugin } = useNuxtApp();
const { logout } = useSanctumAuth();
const schoolStore = useSchoolStore();

useHead({
  title: t("pages.logout.title"),
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "default",
  middleware: ["sanctum:auth"],
});

const handleLogout = () => {
  logout().then(() => {
    $axiosPlugin.defaults.headers.common["Authorization"] = null;

    schoolStore.getSchool();
  });
};

onMounted(() => {
  handleLogout();
});
</script>
