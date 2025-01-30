<template>
  <loader v-if="pending" :className="'full-overlay'" />
  <tabs :tabs="tabs_data" />
</template>

<script setup>
import loader from "../../../../../../components/ui/loader.vue";
import tabs from "../../../../../../components/ui/tabs.vue";
import materials from "../../../../../../components/lesson/tabs/materials.vue";
import tasks from "../../../../../../components/lesson/tabs/tasks.vue";
import { useRouter } from "nuxt/app";
import { useRoute } from "vue-router";
const { t } = useI18n();

const router = useRouter();
const route = useRoute();
const course_slug = route.params.course;
const level_slug = route.params.level;
const lesson_id = route.params.lesson;

const { $axiosPlugin } = useNuxtApp();
const pending = ref(true);
const lessonData = ref([]);
const pageTitle = ref("");

useHead(() => ({
  title: pageTitle.value,
  meta: [{ name: "description", content: "Courses" }],
}));

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const tabs_data = computed(() => [
  {
    name: "lesson",
    title: t("pages.lessons.lesson_materials"),
    icon: "pi pi-paperclip",
    component: materials,
    props: { lessonData: lessonData.value },
  },
  {
    name: "tasks",
    title: t("pages.tasks.title"),
    icon: "pi pi-clock",
    component: tasks,
    props: { lesson_id: lesson_id },
  },
]);

const getLesson = async () => {
  pending.value = true;

  await $axiosPlugin
    .get(
      "courses/" + course_slug + "/" + level_slug + "/get_lesson/" + lesson_id
    )
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

      const lessonCrumbItem = document.querySelector(
        'span[data-crumb="[lesson]"]'
      );

      // Проверить, найден ли элемент
      if (lessonCrumbItem) {
        // Изменить текст внутри элемента
        lessonCrumbItem.textContent = response.data.lesson.lesson_name;
      }

      pageTitle.value = response.data.lesson.lesson_name;

      lessonData.value = response.data.lesson;
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
  getLesson();
});
</script>
