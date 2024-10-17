<template>
    <div class="alert" :class="props.className">
        <slot />
    </div>
</template>
<script setup>
const props = defineProps({
    className: {
        type: String,
        required: false
    }
});
</script>