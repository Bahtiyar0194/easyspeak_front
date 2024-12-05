<template>
    <div class="progress">
        <div class="progress-bar" :class="props.className" :style="{ width: props.progressPercentage + '%' }"></div>
    </div>
</template>

<script setup>
const props = defineProps({
    progressPercentage: {
        type: Number,
        required: true
    },
    className: {
        type: String,
        required: false
    }
});
</script>