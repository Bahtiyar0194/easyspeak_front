<template>
  <div
    class="card relative overflow-hidden group"
    :class="
      props.level.available_status.is_available === false ? 'grayscale' : ''
    "
  >
    <img :src="`/images/courses/${props.level.course_name_slug}.png`" />

    <div
      class="absolute left-0 bottom-0 w-full group-hover:h-full transition-all duration-200 bg-black bg-opacity-80 flex justify-center items-center group-hover:items-center px-4"
      :class="
        props.level.available_status.is_available === false ? 'h-full' : 'h-14'
      "
    >
      <div class="flex flex-col gap-y-2 w-full">
        <div
          class="flex gap-x-2 flex-wrap w-full"
          :class="
            props.level.available_status.is_available === false
              ? 'justify-center'
              : 'justify-between'
          "
        >
          <p class="mb-0 text-white leading-none font-bold text-lg">
            {{ props.level.level_name }}
          </p>

          <p
            v-if="props.level.available_status.is_available === true"
            class="mb-0 text-white leading-none text-lg"
            :class="displayedProgress > 0 ? 'text-success' : ''"
          >
            {{ displayedProgress.toFixed(2) }}%
          </p>
        </div>

        <p
          v-if="props.level.available_status.is_available === false"
          class="mb-0 text-white text-center text-sm"
        >
          {{ $t(props.message) }}
        </p>
        <template v-if="props.level.available_status.is_available === true">
          <progressBar
            :progressPercentage="displayedProgress"
            :wrapClass="'!my-0 !bg-white'"
            :showPercentage="false"
            :className="'sm success'"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import progressBar from "../ui/progressBar.vue";
const props = defineProps({
  level: {
    type: Object,
    required: true,
  },

  message: {
    type: String,
    required: false,
    default: "pages.courses.course_is_not_available",
  },
});

const displayedProgress = ref(0); // текущий отображаемый процент

watch(
  () => props.level.completed_percent,
  (newVal, oldVal) => {
    const start = displayedProgress.value;
    const end = Math.min(Math.max(Number(newVal), 0), 100);
    const duration = 1000; // продолжительность анимации в мс
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
