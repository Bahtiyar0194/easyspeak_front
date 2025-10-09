<template>
  <div class="custom-grid">
    <div
      v-for="(course, courseIndex) in courses"
      :key="courseIndex"
      class="col-span-12 lg:col-span-3"
    >
      <nuxt-link
        :to="localePath('/dashboard/courses/' + course.course_name_slug)"
      >
        <courseCard :course="course" />
      </nuxt-link>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import courseCard from "./courseCard.vue";
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
