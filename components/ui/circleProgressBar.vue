<template>
  <div
    class="rounded-full flex flex-none justify-center items-center relative pointer-events-none"
    :class="props.className"
  >
    <svg
      class="w-full h-full absolute left-0 right-0 -rotate-90"
      viewBox="0 0 100 100"
    >
      <circle
        class="background-circle fill-none stroke-inactive"
        cx="50"
        cy="50"
        r="45"
      />
      <circle
        class="progress-circle fill-none"
        :class="progressClass"
        cx="50"
        cy="50"
        r="45"
        :style="circleStyle"
      />
    </svg>
    <div class="font-bold text-active" :class="props.textClass">
        {{ parseInt(displayedProgress) }}%
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  progress: {
    type: Number,
    required: true,
    default: 0, // Дефолтное значение
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
});

const displayedProgress = ref(0); // текущий отображаемый процент

watch(
  () => props.progress,
  (newVal, oldVal) => {
    const start = displayedProgress.value;
    const end = Math.min(Math.max(Number(newVal), 0), 100);
    const duration = 1000; // продолжительность анимации в мс
    const frameRate = 30;
    const totalFrames = Math.round(duration / (1000 / frameRate));
    let currentFrame = 0;

    const step = () => {
      currentFrame++;
      const progress =
        start + (end - start) * (currentFrame / totalFrames);
      displayedProgress.value = Math.round(progress);
      if (currentFrame < totalFrames) {
        requestAnimationFrame(step);
      } else {
        displayedProgress.value = end;
      }
    };

    step();
  },
  { immediate: true }
);

// Вычисляем длину окружности для прогресс-бара
const circumference = 2 * Math.PI * 45;

const numericProgress = computed(() =>
  Math.min(Math.max(Number(props.progress), 0), 100)
);

const circleStyle = computed(() => {
  return {
    strokeDasharray: `${circumference}`,
    strokeDashoffset: `${circumference * (1 - numericProgress.value / 100)}`,
  };
});


const progressClass = computed(() => {
  const p = numericProgress.value;
  if (p === 0) {
    return "stroke-inactive";
  } else if (p < 50) {
    return "stroke-danger";
  } else if (p < 75) {
    return "stroke-warning";
  } else {
    return "stroke-success";
  }
});
</script>

<style scoped>
.background-circle {
  stroke-width: 6;
}

.progress-circle {
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s ease-in-out, stroke 0.5s ease-in-out;
}
</style>
