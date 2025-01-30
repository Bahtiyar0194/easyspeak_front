<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <h2>{{ props.lessonData?.lesson_name }}</h2>
      <p>{{ props.lessonData?.lesson_description }}</p>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  lessonData: {
    type: Object,
    required: true,
  },
});
</script>
