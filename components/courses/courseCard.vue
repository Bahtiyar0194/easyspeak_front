<template>
  <div class="cover-card group">
    <courseCover
      :slug="props.course.course_name_slug"
      :poster="props.course.course_poster_file"
    />
    <div class="cover-card-shade"></div>

    <div class="cover-card-content" :class="{ 'flex-col !items-stretch gap-2': currentLevel }">
      <div class="flex items-end justify-between gap-2 min-w-0">
        <div class="min-w-0">
          <h4 class="cover-card-title">{{ props.course.course_name }}</h4>
          <!-- Ученик уже занимается: на каком он уровне и сколько прошёл -->
          <p v-if="currentLevel" class="cover-card-sub truncate">
            {{ currentLevel.level_name }}
          </p>
          <p v-else-if="levelsCount" class="cover-card-sub">
            {{ $t("pages.courses.levels_count", { count: levelsCount }) }}
          </p>
        </div>
        <span
          v-if="currentLevel"
          class="text-white font-semibold tabular-nums leading-none"
          >{{ currentLevel.completed_percent }}%</span
        >
        <span v-else class="cover-card-arrow" aria-hidden="true">
          <i class="pi pi-arrow-right"></i>
        </span>
      </div>

      <div v-if="currentLevel" class="cover-card-progress">
        <div :style="{ width: currentLevel.completed_percent + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import courseCover from "./courseCover.vue";

const props = defineProps({
  course: {
    type: Object,
    required: true,
  },
});

// Число уровней показываем, только если API его отдаёт.
const levelsCount = computed(
  () => props.course.levels_count ?? props.course.levels?.length ?? 0,
);

// Уровень, над которым ученик работал последним (отдаёт courses/get)
const currentLevel = computed(() => {
  const level = props.course.current_level;
  if (!level?.level_name) return null;
  const percent = Math.round(Math.min(100, Math.max(0, Number(level.completed_percent) || 0)));
  return { level_name: level.level_name, completed_percent: percent };
});
</script>
