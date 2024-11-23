<template>
    <tabs :tabs="tabs_data" />
</template>
<script setup>
import tabs from '../../../components/ui/tabs.vue';
import dictionary from '../../../components/education-program/dictionary.vue';
import sentences from '../../../components/education-program/sentences.vue';
import tasks from '../../../components/education-program/tasks.vue';
const { t } = useI18n();

useHead({
    title: t('pages.education-program.title'),
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
        component: sentences
    },

    {
        name: 'tasks',
        title: t('pages.tasks.title'),
        icon: 'pi pi-clock',
        component: tasks
    }
];
</script>