<template>
    <tabs :tabs="tabs_data" />
</template>
<script setup>
import tabs from '../../../components/ui/tabs.vue';
import courses from '../../../components/courses/courses.vue';
const { t } = useI18n();

useHead({
    title: t('pages.courses.title'),
    meta: [{ name: "description", content: "Courses" }],
});

definePageMeta({
    layout: "dashboard",
    middleware: ['sanctum:auth']
});

const tabs_data = [
    {
        name: 'courses',
        title: t('pages.courses.title'),
        icon: 'pi pi-book',
        component: courses
    },
    {
        name: 'my_courses',
        title: t('pages.courses.my_courses'),
        icon: 'pi pi-book',
        //component: sentences
    }
];
</script>