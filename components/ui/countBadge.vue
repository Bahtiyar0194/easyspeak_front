<template>
    <span v-if="props.count > 0" class="badge count" :class="props.class" :style="{fontSize: props.count >= 100 ? '7px' : props.count >= 10 ? '9px' : '12px'}">
        {{ props.count >= 100 ? '99+' : props.count }}
    </span>
</template>

<script setup>
const props = defineProps({
    count: {
        type: Number,
        required: true
    },

    class: {
        type: String,
        required: false
    }
});
</script>