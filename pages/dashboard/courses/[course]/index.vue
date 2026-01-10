<template>
  <loader v-if="pending" :className="'full-overlay'" :showPendingText="true" />
  <div class="col-span-12">
    <div class="custom-grid">
      <div
        v-for="(level, levelIndex) in levels"
        :key="levelIndex"
        class="col-span-12 lg:col-span-3"
      >
        <nuxt-link
          :class="level.available_status.is_available === false ? 'cursor-not-allowed' : ''"
          :to="
            level.available_status.is_available === false
              ? null
              : localePath(
                  '/dashboard/courses/' + course_slug + '/' + level.level_slug
                )
          "
        >
          <levelCard :level="level" />
        </nuxt-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import loader from "../../../../components/ui/loader.vue";
import levelCard from "../../../../components/levels/levelCard.vue";
import { useRouter } from "nuxt/app";
import { useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
const course_slug = route.params.course;

const { $axiosPlugin } = useNuxtApp();
const pending = ref(true);
const levels = ref([]);
const pageTitle = ref("");

useHead(() => ({
  title: pageTitle.value,
  meta: [{ name: "description", content: "Courses" }],
}));

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const getLevels = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("courses/get_levels/" + course_slug)
    .then((response) => {
      const courseCrumbItem = document.querySelector(
        'span[data-crumb="[course]"]'
      );

      // Проверить, найден ли элемент
      if (courseCrumbItem) {
        // Изменить текст внутри элемента
        courseCrumbItem.textContent = response.data.course.course_name;
      }

      pageTitle.value = response.data.course.course_name;

      levels.value = response.data.levels;
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
  getLevels();
});
</script>
