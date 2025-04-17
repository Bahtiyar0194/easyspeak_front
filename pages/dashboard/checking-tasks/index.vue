<template>
    123
</template>
<script setup>
const { t } = useI18n();
useHead({
  title: t("pages.checking-tasks.title"),
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});
</script>