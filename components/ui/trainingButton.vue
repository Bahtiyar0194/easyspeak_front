<template>
    <button
        class="flex items-center w-full bg-gray-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 p-3 rounded-2xl border-inactive duration-200">
        <div v-if="props.number" class="hidden lg:flex rounded-lg w-8 h-8 border-inactive justify-center items-center">{{ props.number }}</div>
        <div class="w-full text-center">
            <span>{{ props.text }}</span>
        </div>
    </button>
</template>
<script setup>
const props = defineProps({
    text: {
        type: String,
        required: true
    },
    number: {
        type: Number,
        required: false
    }
});
</script>