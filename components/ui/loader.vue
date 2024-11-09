<template>
  <div :class="props.className">
    <div class="overlay-loading-circle"></div>

    <div v-if="props.progress && props.progress >= 1" class="pt-2 text-center">
      {{ $t("uploading_file") }}
      <p class="font-medium">{{ props.progress }}%</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  progress: {
    type: Number,
    required: false
  },

  className: {
    type: String,
    required: true
  },

  pending: {
    type: Boolean,
    required: false
  }
});
</script>