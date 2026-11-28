<template>
  <div class="cover-card group" :class="{ locked: isLocked }">
    <courseCover
      :slug="props.level.course_name_slug"
      :poster="props.level.course_poster_file"
    />
    <div class="cover-card-shade"></div>

    <!-- Недоступный уровень: замок и пояснение по центру -->
    <div v-if="isLocked" class="cover-card-lock">
      <i class="pi pi-lock" aria-hidden="true"></i>
      <p class="mb-0 font-semibold text-lg">{{ props.level.level_name }}</p>
      <p class="mb-0 text-sm text-white/85">{{ $t(props.message) }}</p>
    </div>

    <div v-else class="cover-card-content flex-col !items-stretch gap-2">
      <div class="flex items-end justify-between gap-2">
        <div class="min-w-0">
          <h4 class="cover-card-title">{{ props.level.level_name }}</h4>
          <!-- Чем уровни отличаются: картинка у всех уровней курса одна -->
          <p v-if="props.level.sections_count" class="cover-card-sub">
            {{
              $t("pages.courses.level_structure", {
                sections: props.level.sections_count,
                lessons: props.level.lessons_count || 0,
              })
            }}
          </p>
        </div>
        <span
          v-if="showProgress"
          class="text-white font-semibold tabular-nums leading-none"
          >{{ Math.round(displayedProgress) }}%</span
        >
        <span v-else class="cover-card-arrow" aria-hidden="true">
          <i class="pi pi-arrow-right"></i>
        </span>
      </div>

      <div v-if="showProgress" class="cover-card-progress">
        <div :style="{ width: displayedProgress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import courseCover from "../courses/courseCover.vue";

const schoolStore = useSchoolStore();

const props = defineProps({
  level: {
    type: Object,
    required: true,
  },

  showProgressBar: {
    type: Boolean,
    required: true,
  },

  message: {
    type: String,
    required: false,
    default: "pages.courses.course_is_not_available",
  },
});

const isAvailable = computed(
  () => props.level.available_status?.is_available !== false,
);

// В AI-школе недоступные уровни не закрываются замком (как и раньше).
const isLocked = computed(
  () => !schoolStore.isAiSchoolDomain && !isAvailable.value,
);

const showProgress = computed(
  () => props.showProgressBar === true && isAvailable.value,
);

const displayedProgress = ref(0); // текущий отображаемый процент

watch(
  () => props.level.completed_percent,
  (newVal) => {
    const start = displayedProgress.value;
    const end = Math.min(Math.max(Number(newVal) || 0, 0), 100);
    const duration = 1000; // продолжительность анимации в мс
    const frameRate = 30;
    const totalFrames = Math.round(duration / (1000 / frameRate));
    let currentFrame = 0;

    const step = () => {
      currentFrame++;
      displayedProgress.value =
        start + (end - start) * (currentFrame / totalFrames);
      if (currentFrame < totalFrames) {
        requestAnimationFrame(step);
      } else {
        displayedProgress.value = end;
      }
    };

    step();
  },
  { immediate: true },
);
</script>
