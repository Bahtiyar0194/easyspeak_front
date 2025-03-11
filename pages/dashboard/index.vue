<template>
<div class="col-span-12">
    <p class="font-medium">🚀 {{ authUser?.first_name }}, <span class="lowercase">{{ $t('welcome') }}</span></p>
</div>
</template>

<script setup>
const { t } = useI18n();
const error = ref(false);
const authUser = useSanctumUser();

useHead({
    title: t('pages.dashboard.title'),
    meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
    layout: "dashboard",
    middleware: ['sanctum:auth']
});
</script>