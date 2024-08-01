<template>
        <div class="card card-xl mb-4">
            <loader v-if="pending" className="overlay" />
            <div class="card-header">
                <div class="title-wrap items-center">
                    <slot name="header_content" />
                    <selectLocale />
                </div>
            </div>

            <div class="card-body">
                <slot name="body_content" />
            </div>
        </div>
</template>

<script setup>
import loader from './ui/loader.vue';
import selectLocale from "./ui/selectLocale.vue";

defineProps({
    pending: {
        type: Boolean,
        required: true
    }
});
</script>