<template>
  <client-only>
    <div class="progress-wrap" :class="props.wrapClass">
      <div
        class="progress"
        role="progressbar"
        :aria-valuenow="Math.round(target)"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="progress-bar"
          :class="props.className"
          :style="{ width: target + '%' }"
        ></div>
      </div>

      <!-- Процент — справа от полосы, целым числом -->
      <span v-if="props.showPercentage" class="progress-value">
        {{ Math.round(displayedProgress) }}%
      </span>
    </div>
  </client-only>
</template>

<script setup>
const props = defineProps({
  progressPercentage: {
    type: Number,
    required: true,
  },
  wrapClass: {
    type: String,
    required: false,
    default: "",
  },
  showPercentage: {
    type: Boolean,
    required: false,
    default: false,
  },
  className: {
    type: String,
    required: false,
  },
});

// Ширина полосы анимируется CSS-переходом, число — плавным счётчиком
const target = computed(() =>
  Math.min(Math.max(Number(props.progressPercentage) || 0, 0), 100),
);

const displayedProgress = ref(0);
let frame = null;

watch(
  target,
  (end) => {
    if (frame) cancelAnimationFrame(frame);
    const start = displayedProgress.value;
    const duration = 1000;
    const startedAt = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // плавное замедление в конце
      displayedProgress.value = start + (end - start) * eased;
      if (t < 1) frame = requestAnimationFrame(step);
    };

    if (typeof requestAnimationFrame === "function") {
      frame = requestAnimationFrame(step);
    } else {
      displayedProgress.value = end;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame);
});
</script>
