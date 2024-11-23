<template>
    <courseStructureForm :errors="props.errors"/>
</template>
<script setup>
import courseStructureForm from '../../../../courses/courseStructureForm.vue';
const props = defineProps({
    errors: {
        type: Object,
        required: true,
    }
});
</script>