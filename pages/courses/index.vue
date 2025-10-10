<template>
  <div class="custom-grid">
    <loader v-if="pending" :className="'full-overlay'" :showPendingText="true" />
    <div class="col-span-12">
      <h1 class="text-4xl">{{ $t("pages.courses.title") }}</h1>
    </div>
    <div
      v-for="(course, courseIndex) in courses"
      :key="courseIndex"
      class="col-span-12 lg:col-span-6"
    >
      <nuxt-link :to="localePath('/courses/' + course.course_name_slug)">
        <courseCard :course="course" />
      </nuxt-link>
    </div>
  </div>
</template>

<script setup>
import loader from "../../components/ui/loader.vue";
import { useRouter } from "nuxt/app";
import courseCard from "../../components/courses/courseCard.vue";

const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const pending = ref(true);
const courses = ref([]);

const { t } = useI18n();

useHead({
  title: t("pages.courses.title"),
  meta: [{ name: "description", content: "Courses" }],
});

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
