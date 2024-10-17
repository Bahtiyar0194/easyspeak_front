<template>
    <dropdownMenu :dropdown-arrow="true">
        <template v-slot:btn_content>
            <div class="relative">
                <i :class="count > 0 ? 'bi bi-bell-fill' : 'bi bi-bell'"></i>
                <countBadge v-if="count > 0" :count="count" :class="'badge-sm badge-primary -right-2 -top-2'" />
            </div>
        </template>

        <template v-slot:menu_content>
            <li>{{ $t('pages.notifications.there_are_no_new_notifications') }}</li>
        </template>
    </dropdownMenu>
</template>
<script setup>
import dropdownMenu from './dropdownMenu';
import countBadge from './countBadge.vue';

const count = ref(0);
</script>