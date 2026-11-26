<template>
  <div
    :class="props.className"
    class="p-4 select-none"
    role="status"
    aria-live="polite"
    :aria-busy="true"
  >
    <div class="overlay-loading-circle" aria-hidden="true"></div>

    <!-- Загрузка файла: подпись + полоса прогресса -->
    <div
      v-if="props.progress && props.progress >= 1"
      class="loader-progress"
    >
      <p class="mb-0 font-medium dots">
        {{ $t("file.uploading_file") }}
        <span class="blink animation-delay:0s">.</span>
        <span class="blink animation-delay:0.3s">.</span>
        <span class="blink animation-delay:0.6s">.</span>
      </p>
      <div class="loader-progress-track">
        <div
          class="loader-progress-fill"
          :style="{ width: Math.min(100, props.progress) + '%' }"
        ></div>
      </div>
      <p class="mb-0 font-bold tabular-nums">{{ props.progress }}%</p>
    </div>

    <div v-if="props.showPendingText === true" class="pt-3 text-center">
      <p class="mb-0 font-medium dots text-inactive">
        {{ props.pendingText || $t("loading") }}
        <span class="blink animation-delay:0s">.</span>
        <span class="blink animation-delay:0.3s">.</span>
        <span class="blink animation-delay:0.6s">.</span>
      </p>
    </div>
    <span v-else class="sr-only">{{ $t("loading") }}</span>
  </div>
</template>

<script setup>
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

  pendingText: {
    type: String,
    required: false,
  },
});
</script>
