<template>
  <div class="cover-card group">
    <img
      v-skeleton="'3/2'"
      class="cover-card-img"
      :src="`/images/courses/${props.course.course_name_slug}.png`"
      alt=""
    />
    <div class="cover-card-shade"></div>

    <div class="cover-card-content">
      <div class="min-w-0">
        <h4 class="cover-card-title">{{ props.course.course_name }}</h4>
        <p v-if="levelsCount" class="cover-card-sub">
          {{ $t("pages.courses.levels_count", { count: levelsCount }) }}
        </p>
      </div>
      <span class="cover-card-arrow" aria-hidden="true">
        <i class="pi pi-arrow-right"></i>
      </span>
    </div>
  </div>
</template>

<script setup>
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
</script>
