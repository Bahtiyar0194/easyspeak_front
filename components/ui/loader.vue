<template>
  <div :class="props.className">
    <div class="overlay-loading-circle"></div>

    <div
      v-if="props.progress && props.progress >= 1"
      class="pt-2 text-center mt-1"
    >
      {{ $t("uploading_file") }}
      <p class="font-medium">{{ props.progress }}%</p>
    </div>
    <div v-if="props.showPendingText === true" class="pt-2 text-center mt-1">
      <p class="font-medium mb-0 dots">
        {{ $t("loading") }}
        <span class="blink animation-delay:0s">.</span>
        <span class="blink animation-delay:0.3s">.</span>
        <span class="blink animation-delay:0.6s">.</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from "vue";

const props = defineProps({
  progress: {
    type: Number,
    required: false,
  },

  className: {
    type: String,
    required: true,
  },

  pending: {
    type: Boolean,
    required: false,
  },

  showPendingText: {
    type: Boolean,
    required: false,
    default: false,
  },
});
</script>
