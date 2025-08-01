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
        <div
          class="card relative overflow-hidden group"
        >
          <img
            :src="
              config.public.apiBase +
              '/media/get/' +
              course.course_name_slug +
              '.png'
            "
          />

          <div
            class="absolute left-0 bottom-0 w-full h-12 group-hover:h-full transition-all duration-200 bg-black bg-opacity-60 flex justify-center items-center group-hover:items-center px-4"
          >
            <div class="flex flex-col gap-y-1">
              <h4 class="mb-0 text-white text-center">
                {{ course.course_name }}
              </h4>
            </div>
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
