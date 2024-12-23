<template>
    <div v-if="show" class="col-span-12">
        <div class="note" :class="props.className">
            {{ props.message }}

            <button @click="show = false" :title="$t('close')">
                <i class="pi pi-times text-xs"></i>
            </button>
        </div>
    </div>
</template>
<script setup>
const show = ref(true);

const props = defineProps({
    message: {
        type: String,
        required: true
    },
    className: {
        type: String,
        required: true
    }
});
</script>