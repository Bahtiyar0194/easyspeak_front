<template>
  <div
    class="ring-progress"
    :class="props.className"
    role="progressbar"
    :aria-valuenow="Math.round(numericProgress)"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <svg class="ring-progress-svg" viewBox="0 0 100 100" aria-hidden="true">
      <!-- Дорожка -->
      <circle class="ring-progress-track" cx="50" cy="50" r="42" />
      <!-- Дуга прогресса -->
      <circle
        class="ring-progress-arc"
        :class="levelClass"
        cx="50"
        cy="50"
        r="42"
        :style="arcStyle"
      />
    </svg>
    <span class="ring-progress-value" :class="props.textClass">
      {{ Math.round(displayedProgress) }}<small>%</small>
    </span>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  progress: {
    type: Number,
    required: true,
    default: 0,
  },

  className: {
    type: String,
    required: false,
    default: "w-12 h-12",
  },

  textClass: {
    type: String,
    required: false,
    default: "text-xs",
  },

  duration: {
    type: Number,
    required: false,
    default: 1000,
  },
});

const numericProgress = computed(() =>
  Math.min(Math.max(Number(props.progress) || 0, 0), 100),
);

// Плавный счётчик числа (с замедлением к концу)
const displayedProgress = ref(0);
let frame = null;

watch(
  numericProgress,
  (end) => {
    if (frame) cancelAnimationFrame(frame);
    const start = displayedProgress.value;
    const startedAt = performance.now();
    const duration = Math.max(1, props.duration);

    const step = (now) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
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

const circumference = 2 * Math.PI * 42;

// Дуга рисуется CSS-переходом той же длительности, что и счётчик
const arcStyle = computed(() => ({
  strokeDasharray: `${circumference}`,
  strokeDashoffset: `${circumference * (1 - numericProgress.value / 100)}`,
  transitionDuration: `${props.duration}ms`,
}));

// Цвет по результату: <50 — красный, <75 — янтарный, иначе — зелёный
const levelClass = computed(() => {
  const p = numericProgress.value;
  if (p === 0) return "is-empty";
  if (p < 50) return "is-low";
  if (p < 75) return "is-mid";
  return "is-high";
});
</script>
