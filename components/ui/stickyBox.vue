<template>
    <div class="sticky"
        :style="{ top: '-' + (props.offsetTop || 10) + 'px', bottom: (props.offsetBottom || 10) + 'px' }">
        <slot />
    </div>
</template>

<script setup>
const props = defineProps({
    offsetTop: {
        type: Number,
        required: false
    },

    offsetBottom: {
        type: Number,
        required: false
    }
});
</script>