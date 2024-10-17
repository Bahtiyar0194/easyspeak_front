<template>
    <slot v-if="hasRole" />
    <div v-else-if="!hasRole && props.redirect" class="col-span-12">
        <div class="content-center">
            <i class="pi pi-lock text-6xl mb-2 text-corp"></i>
            <div class="text-center">
                <h4 class="mb-2">{{ $t("errors.page_is_not_available") }}</h4>
                <NuxtLink class="text-corp" to="/dashboard">{{ $t("pages.dashboard.go_to_dashboard") }}</NuxtLink>
            </div>
        </div>
    </div>
</template>
<script setup>
import { computed } from 'vue';
const authUser = useSanctumUser();

const props = defineProps({
    roles: {
        type: Array,
        required: true
    },
    redirect: {
        type: Boolean,
        required: false
    }
});

const hasRole = computed(() => {
    if(authUser.value){
        return props.roles.some(role => role === authUser.value?.current_role_id);
    }
});
</script>