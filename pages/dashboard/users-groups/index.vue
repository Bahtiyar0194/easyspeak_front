<template>
    <tabs :tabs="tabs_data" />
</template>
<script setup>
import tabs from '../../../components/ui/tabs.vue';
import users from '../../../components/users-groups/tabs/users.vue';
import groups from '../../../components/users-groups/tabs/groups.vue';
const { t } = useI18n();

useHead({
    title: t('pages.users-groups.title'),
    meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
    layout: "dashboard",
    middleware: ['sanctum:auth']
});

const tabs_data = [
    {
        name: 'users',
        title: t('pages.users.title'),
        icon: 'pi pi-user',
        component: users
    },
    {
        name: 'groups',
        title: t('pages.groups.title'),
        icon: 'pi pi-users',
        component: groups
    }
];
</script>