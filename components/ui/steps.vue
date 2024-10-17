<template>
    <div class="steps">
        <div class="progress">
            <div class="progress-bar success sm" :style="{ width: progressPercentage + '%' }"></div>
        </div>

        <div class="steps-wrap">
            <div v-for="(step, index) in props.steps" :key="index" class="step-item" :class="{
                'current': props.currentStep === (index + 1),
                'completed': props.currentStep > (index + 1)
            }">
                <div class="step-icon">
                    <i v-if="props.currentStep > (index + 1)" class="fas fa-check"></i>
                    <span v-else>{{ index + 1 }}</span>
                </div>
                <div class="step-label">{{ step.title }}</div>
            </div>
        </div>
    </div>

    <slot />
</template>

<script setup>
const props = defineProps({
    currentStep: {
        type: Number,
        required: true
    },

    steps: {
        type: Array,
        required: true
    }
});

const progressPercentage = computed(() => {
    return ((props.currentStep - 1) / (props.steps.length - 1)) * 100;
});
</script>