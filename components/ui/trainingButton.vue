<template>
    <button
        class="btn full" :class="props.className">
        <div v-if="props.number" class="hidden lg:flex rounded-lg w-8 h-8 border-inactive bg-active justify-center items-center" :class="props.className === 'btn-inactive disabled' ? 'text-inactive' : 'text-active'">{{ props.number }}</div>
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
    },
    className: {
        default: 'btn-inactive',
        type: String,
        required: false
    }
});
</script>