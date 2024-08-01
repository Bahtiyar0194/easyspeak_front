<template>
    <div>
        <div class="db__header">
            <div class="w-32 lg:w-56">
                <!-- <img class="w-full" src="~/public/logo.svg"> -->
                 <span class="font-medium text-corp sm:text-xl md:text-2xl">NURBOLASHAK</span>
            </div>

            <div class="btn-wrap items-center">
                <selectLocale />
                <authUserMenu />
            </div>
        </div>
        <div class="flex">
            <div class="db__sidebar__menu">
                <nuxt-link v-for="(item, index) in menu" :key="index" :to="localePath(item.link)">
                    <i :class='item.icon'></i>
                    <span>{{ $t(item.title) }}</span>
                </nuxt-link>
            </div>
            <div class="db__content">
                <loader v-if="pending" class="full-overlay" />
                <div class="custom-grid">
                    <NuxtPage />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import loader from "../components/ui/loader.vue";
import selectLocale from "../components/ui/selectLocale.vue";
import authUserMenu from "../components/authUserMenu.vue";

const menu = ref([
    {
        title: 'pages.dashboard.title',
        icon: 'pi pi-home',
        link: '/dashboard'
    },
    {
        title: 'pages.conference.title',
        icon: 'pi pi-video',
        link: '/dashboard/conference'
    }
]);

const pending = ref(false);
</script>