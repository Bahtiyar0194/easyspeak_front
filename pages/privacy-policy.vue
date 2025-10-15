<template>
  <content />
</template>
<script setup>
import content from "../components/privacy-policy/content.vue";
const { t } = useI18n();

useHead({
  title: t("pages.privacy-policy.title"),
  meta: [{ name: "description", content: "My amazing site." }],
});
</script>
