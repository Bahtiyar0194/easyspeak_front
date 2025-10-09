<template>
  <div class="card relative overflow-hidden group">
    <img
      :src="
        config.public.apiBase +
        '/media/get/' +
        props.course.course_name_slug +
        '.png'
      "
    />

    <div
      class="absolute left-0 bottom-0 w-full h-12 group-hover:h-full transition-all duration-200 bg-black bg-opacity-60 flex justify-center items-center group-hover:items-center px-4"
    >
      <div class="flex flex-col gap-y-1">
        <h4 class="mb-0 text-white text-center">
          {{ props.course.course_name }}
        </h4>
      </div>
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();

const props = defineProps({
  course: {
    type: Object,
    required: true,
  },
});
</script>
