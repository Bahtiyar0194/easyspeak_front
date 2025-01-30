<template>
  <div class="custom-grid">
    <div
      v-for="(course, courseIndex) in courses"
      :key="courseIndex"
      class="col-span-6 lg:col-span-3"
    >
      <nuxt-link :to="localePath('/dashboard/courses/' + course.course_name_slug)">
        <div class="card">
          <img
            :src="
              config.public.apiBase +
              '/media/get/' +
              course.course_name_slug +
              '.png'
            "
          />

          <div class="p-4">
            <h5 class="mb-0 text-center">{{ course.course_name }}</h5>
          </div>
        </div>
      </nuxt-link>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "nuxt/app";
const config = useRuntimeConfig();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const pending = ref(true);
const courses = ref([]);

const getCourses = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("courses/get")
    .then((response) => {
      courses.value = response.data;
      pending.value = false;
    })
    .catch((err) => {
      if (err.response) {
        router.push({
          path: "/error",
          query: {
            status: err.response.status,
            message: err.response.data.message,
            url: err.request.responseURL,
          },
        });
      } else {
        router.push("/error");
      }
    });
};

onMounted(() => {
  getCourses();
});
</script>