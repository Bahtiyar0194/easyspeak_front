<template>
    <div>Личный кабинет</div>
</template>

<script setup>
const { t } = useI18n();
const error = ref(false);

useHead({
    title: t('pages.dashboard.title'),
    meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
    layout: "dashboard",
    middleware: ['sanctum:auth']
});
</script>