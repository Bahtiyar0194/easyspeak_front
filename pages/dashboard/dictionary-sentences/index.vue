<template>
    <tabs :tabs="tabs_data" />
</template>
<script setup>
import tabs from '../../../components/ui/tabs.vue';
import dictionary from '../../../components/dictionary-sentences/dictionary.vue';
const { t } = useI18n();

useHead({
    title: t('pages.dictionary-sentences.title'),
    meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
    layout: "dashboard",
    middleware: ['sanctum:auth']
});

const tabs_data = [
    {
        name: 'dictionary',
        title: t('pages.dictionary.title'),
        icon: 'bi bi-alphabet',
        component: dictionary
    },
    {
        name: 'sentences',
        title: t('pages.sentences.title'),
        icon: 'pi pi-comment',
        //component: groups
    }
];
</script>