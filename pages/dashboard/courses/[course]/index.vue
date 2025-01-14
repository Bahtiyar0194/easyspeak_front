<template>
  <div class="col-span-12">
    <div class="custom-grid">
      <div
        v-for="(level, levelIndex) in levels"
        :key="levelIndex"
        class="col-span-12 lg:col-span-3"
      >
        <nuxt-link
          :to="
            localePath(
              '/dashboard/courses/' + course_slug + '/' + level.level_slug
            )
          "
        >
          <div class="card">
            <img
              :src="
                config.public.apiBase +
                '/media/' +
                level.course_name_slug +
                '.png'
              "
            />

            <div
              class="absolute left-0 top-0 w-full h-full flex justify-center items-center p-4 bg-black bg-opacity-50"
            >
              <h6 class="mb-0 text-center text-white">
                {{ level.level_name }}
              </h6>
            </div>
          </div>
        </nuxt-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import { useRoute } from "vue-router";

const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();
const course_slug = route.params.course;

const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const { t } = useI18n();
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
      const courseCrumbItem = document.querySelector('span[data-crumb="[course]"]');

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