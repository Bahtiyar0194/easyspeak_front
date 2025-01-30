<template>
    <tabs :tabs="tabs_data" />
</template>

<script setup>
import tabs from '../../../components/ui/tabs.vue';
import operations from '../../../components/operations-requests/tabs/operations.vue';
import requests from '../../../components/operations-requests/tabs/requests.vue';
const { t } = useI18n();

const tabs_data = computed(() => [
    {
        name: 'operations',
        title: t('pages.operations.title'),
        icon: 'pi pi-file',
        component: operations
    },
    {
        name: 'requests',
        title: t('pages.requests.title'),
        icon: 'pi pi-file-import',
        component: requests
    }
]);

useHead({
    title: t('pages.operations-requests.title'),
    meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
    layout: "dashboard",
    middleware: ['sanctum:auth']
});
</script>