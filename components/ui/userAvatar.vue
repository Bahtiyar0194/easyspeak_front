<template>
    <div class="rounded-full border-inactive w-fit h-fit" :class="props.padding ? ('p-' + props.padding) : 'p-0.5'">
        <template v-if="props.isChecked && props.isChecked === true">
            <div class="rounded-full bg-success flex items-center justify-center text-white overflow-hidden"
                :class="props.className ? props.className : ''">
                <i class="pi pi-check"></i>
            </div>
        </template>
        <template v-else>
            <div v-if="user.avatar"
                :style="{ 'backgroundImage': 'url(' + config.public.apiBase + '/auth/get_avatar/' + props.user.avatar + ')' }"
                class="bg-cover bg-no-repeat bg-center rounded-full" :class="props.className ? props.className : ''">
            </div>

            <div v-else class="rounded-full bg-corp flex items-center justify-center text-white overflow-hidden"
                :class="props.className ? props.className : ''">
                {{ props.user.last_name.substring(0, 1) }}{{ props.user.first_name.substring(0, 1) }}
            </div>
        </template>
    </div>
</template>

<script setup>
import { useRuntimeConfig } from "nuxt/app";
const config = useRuntimeConfig();

const props = defineProps({
    user: {
        type: Object,
        required: true
    },
    padding: {
        type: Number,
        required: false
    },
    className: {
        type: String,
        required: false
    },
    isChecked: {
        type: Boolean,
        required: false
    }
});
</script>