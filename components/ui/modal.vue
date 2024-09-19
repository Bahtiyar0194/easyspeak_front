<template>
    <div class="modal-backdrop" :class="isVisible && 'show'" @click.self="closeModal">
        <div class="modal" :class="props.class">
            <div class="modal-header">
                <slot name="header_content" />
                <span :title="$t('close')" @click="closeModal" class="modal-close-button">
                    <i class="bi bi-x"></i>
                </span>
            </div>
            <div class="modal-body">
                <slot name="body_content" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { watch, ref } from 'vue';

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    },
    class: {
        type: String,
        required: false
    },
    onClose: {
        type: Function,
        required: true
    }
});

const isVisible = ref(props.show)

watch(() => props.show, (newVal) => {
    isVisible.value = newVal;
});

const closeModal = () => {
    isVisible.value = false
    if (props.onClose) {
        props.onClose()
    }
};
</script>