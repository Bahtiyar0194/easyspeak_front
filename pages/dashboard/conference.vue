<template>
    <videoConference />
</template>

<script setup>
import videoConference from "../../components/ui/videoConference.vue";
const { t } = useI18n();

useHead({
    title: t('pages.conference.title'),
    meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
    layout: "dashboard",
    middleware: ['sanctum:auth']
});

</script>