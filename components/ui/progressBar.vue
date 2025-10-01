<template>
  <div class="progress relative" :class="props.wrapClass">
    <div
      class="progress-bar relative z-10"
      :class="props.className"
      :style="{ width: props.progressPercentage + '%' }"
    >
      <!-- Белый текст поверх полоски -->
      <b
        v-if="props.showPercentage"
        class="text-xs"
      >
        {{ props.progressPercentage.toFixed(2) }}%
      </b>
    </div>

    <!-- Чёрный текст позади, всегда слева -->
    <b
      v-if="props.showPercentage"
      class="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-active z-0"
    >
      {{ props.progressPercentage.toFixed(2) }}%
    </b>
  </div>
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
</script>
