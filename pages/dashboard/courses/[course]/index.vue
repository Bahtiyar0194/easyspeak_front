<template>
  <loader v-if="pending" :className="'full-overlay'" />
  <div class="col-span-12">
    <div class="custom-grid">
      <div
        v-for="(level, levelIndex) in levels"
        :key="levelIndex"
        class="col-span-12 lg:col-span-3"
      >
        <nuxt-link
          :class="level.is_available === false ? 'cursor-not-allowed' : ''"
          :to="
            level.is_available === false
              ? null
              : localePath(
                  '/dashboard/courses/' + course_slug + '/' + level.level_slug
                )
          "
        >
          <div
            class="card relative overflow-hidden group"
            :class="level.is_available === false ? 'grayscale' : ''"
          >
            <img
              :src="
                config.public.apiBase +
                '/media/get/' +
                level.course_name_slug +
                '.png'
              "
            />

            <div
              class="absolute left-0 bottom-0 w-full group-hover:h-full transition-all duration-200 bg-black bg-opacity-60 flex justify-center items-center group-hover:items-center p-4"
              :class="level.is_available === false ? 'h-full' : 'h-12'"
            >
              <div class="flex flex-col gap-y-1">
                <h4 class="mb-0 text-white text-center">
                  {{ level.level_name }}
                </h4>

                <p
                  v-if="level.is_available === false"
                  class="mb-0 text-white text-center text-sm"
                >
                  {{ $t("pages.courses.course_is_not_available") }}
                </p>
              </div>
            </div>
          </div>
        </nuxt-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import loader from "../../../../components/ui/loader.vue";
import { useRouter } from "nuxt/app";
import { useRoute } from "vue-router";

const config = useRuntimeConfig();
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
