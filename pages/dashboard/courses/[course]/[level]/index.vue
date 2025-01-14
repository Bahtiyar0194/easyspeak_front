<template>
  <div class="col-span-12">
    <div class="custom-grid">
      <div class="col-span-12">
        <ul class="list-group">
          <li
            v-for="(section, sectionIndex) in lessonsData"
            :key="sectionIndex"
            class="list-item"
          >
            <div>
              <div
                @click="toggleAccordion(sectionIndex)"
                class="flex justify-between items-center gap-4 hover:cursor-pointer"
              >
                <h5
                  class="mb-0"
                  :class="activeSectionIndex === sectionIndex && 'text-corp'"
                >
                  {{ section.section_name }}
                </h5>
                <div
                  v-if="section.lessons.length > 0"
                  class="btn btn-circle btn-light"
                >
                  <i
                    class="pi pi-angle-down duration-500"
                    :class="sectionIndex === activeSectionIndex && 'rotate-180'"
                  ></i>
                </div>
              </div>
            </div>

            <div
              v-if="section.lessons.length > 0"
              class="transition-all duration-500 ease-in-out overflow-hidden"
              :class="activeSectionIndex === sectionIndex ? 'h-auto' : 'h-0'"
            >
              <ul class="list-group nowrap mt-2">
                <li
                  v-for="(lesson, lessonIndex) in section.lessons"
                  :key="lessonIndex"
                  class="list-item"
                >
                  <nuxt-link
                    :to="
                      localePath(
                        '/dashboard/courses/' +
                          course_slug +
                          '/' +
                          level_slug +
                          '/lessons'
                      )
                    "
                  >
                    {{ lessonIndex + 1 }}. {{ lesson.lesson_name }}
                    <span class="text-inactive"
                      >({{ lesson.lesson_type_name }})</span
                    >
                  </nuxt-link>
                </li>
              </ul>
            </div>
          </li>
        </ul>
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
const level_slug = route.params.level;

const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const { t } = useI18n();
const pending = ref(true);
const lessonsData = ref([]);
const activeSectionIndex = ref(null);
const pageTitle = ref("");

useHead(() => ({
  title: pageTitle.value,
  meta: [{ name: "description", content: "Courses" }],
}));

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const toggleAccordion = (index) => {
  if (index === activeSectionIndex.value) {
    activeSectionIndex.value = null;
  } else {
    activeSectionIndex.value = index;
  }
};

const getLessons = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("courses/" + course_slug + "/" + level_slug + "/get_lessons")
    .then((response) => {
      const courseCrumbItem = document.querySelector(
        'span[data-crumb="[course]"]'
      );

      // Проверить, найден ли элемент
      if (courseCrumbItem) {
        // Изменить текст внутри элемента
        courseCrumbItem.textContent = response.data.course.course_name;
      }

      const levelCrumbItem = document.querySelector(
        'span[data-crumb="[level]"]'
      );

      // Проверить, найден ли элемент
      if (levelCrumbItem) {
        // Изменить текст внутри элемента
        levelCrumbItem.textContent = response.data.level.level_name;
      }

      pageTitle.value = response.data.level.level_name;

      lessonsData.value = response.data.sections;
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
  getLessons();
});
</script>
