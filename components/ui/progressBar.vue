<template>
  <client-only>
    <div class="progress relative" :class="props.wrapClass">
      <div
        class="progress-bar relative z-10"
        :class="props.className"
        :style="{ width: displayedProgress.toFixed(2) + '%' }"
      >
        <!-- Белый текст поверх полоски -->
        <b v-if="props.showPercentage" class="text-xs">
          {{ displayedProgress.toFixed(2) }}%
        </b>
      </div>

      <b
        v-if="props.showPercentage"
        class="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-active z-0"
        :class="
          props.progressPercentage === 0
            ? 'text-center left-1/2 -translate-x-1/2'
            : 'left-0'
        "
      >
        {{ displayedProgress.toFixed(2) }}%
      </b>
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

const displayedProgress = ref(0);


watch(
  () => props.progressPercentage,
  (newVal) => {

    const start = displayedProgress.value;
    const end = Math.min(Math.max(Number(newVal), 0), 100);

    const duration = 2000;
    const frameRate = 30;
    const totalFrames = Math.round(duration / (1000 / frameRate));
    let currentFrame = 0;

    const step = () => {
      currentFrame++;
      const progress = start + (end - start) * (currentFrame / totalFrames);
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
</script>
