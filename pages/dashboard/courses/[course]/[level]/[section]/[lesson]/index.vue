<template>
  <!-- Загрузка: скелетон шапки и вкладок -->
  <template v-if="!loaded">
    <div class="col-span-12 flex flex-col gap-4">
      <div class="skeleton h-4 w-40"></div>
      <div class="skeleton h-9 w-80 max-w-full"></div>
      <div class="skeleton h-4 w-full max-w-xl"></div>
      <div class="skeleton h-11 w-72 max-w-full !rounded-2xl md:ml-auto"></div>
      <div class="skeleton h-64 w-full !rounded-2xl"></div>
    </div>
  </template>

  <template v-else-if="courseIsAvailable && lessonIsAvailable">
    <!-- Шапка урока. Пока грузятся задания, вкладка показывает свой скелетон
         (раньше страницу закрывал полноэкранный лоадер) -->
    <div class="col-span-12">
      <div class="lesson-hero">
        <nuxt-link class="lesson-back" :to="sectionLink">
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
          {{ sectionName }}
        </nuxt-link>
        <h2 class="mb-0 leading-tight">{{ lessonData.lesson_name }}</h2>
        <p
          v-if="lessonData.lesson_description"
          class="mb-0 text-inactive max-w-3xl whitespace-pre-line"
        >
          {{ lessonData.lesson_description }}
        </p>
        <div class="lesson-meta">
          <span v-if="!schoolStore.isAiSchoolDomain && lessonData.lesson_type_name">
            <i class="pi pi-tag" aria-hidden="true"></i>
            {{ lessonData.lesson_type_name }}
          </span>
          <span v-if="lessonData.materials">
            <i class="pi pi-file" aria-hidden="true"></i>
            {{ $t("materials.materials_count") }}: {{ lessonData.materials.length }}
          </span>
        </div>
      </div>
    </div>

    <tabs :tabs="tabs_data" :activeTabIndex="1" :showTabHeader="true" />
  </template>

  <div v-else class="col-span-12">
    <emptyState
      :text="
        courseIsAvailable === false
          ? $t('pages.courses.course_is_not_available')
          : $t('pages.lessons.is_unavailable_desc')
      "
      icon="bi bi-lock"
    >
      <nuxt-link class="btn btn-light" :to="sectionLink">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        {{ $t("back") }}
      </nuxt-link>
    </emptyState>
  </div>
</template>

<script setup>
import emptyState from "../../../../../../../components/ui/emptyState.vue";
import tabs from "../../../../../../../components/ui/tabs.vue";
import materials from "../../../../../../../components/lesson/tabs/materials.vue";
import tasks from "../../../../../../../components/lesson/tabs/tasks.vue";
import dictionary from "../../../../../../../components/lesson/tabs/dictionary.vue";
import { useRouter } from "nuxt/app";
import { useRoute } from "vue-router";
const { t } = useI18n();

const router = useRouter();
const route = useRoute();
const course_slug = route.params.course;
const level_slug = route.params.level;
const section_id = route.params.section;
const lesson_id = route.params.lesson;

const { $axiosPlugin } = useNuxtApp();
const pendingLesson = ref(true);
const materialTypes = ref([]);
const lessonData = ref([]);
const courseIsAvailable = ref(false);
const lessonIsAvailable = ref(false);
const pageTitle = ref("");
// true после первой загрузки: до этого — скелетон, а не «курс недоступен».
const loaded = ref(false);
const sectionName = ref("");
const localePath = useLocalePath();
const sectionLink = computed(() =>
  localePath(
    "/dashboard/courses/" + course_slug + "/" + level_slug + "/" + section_id,
  ),
);

const schoolStore = useSchoolStore();

provide("pendingLesson", pendingLesson);

useHead(() => ({
  title: pageTitle.value,
  meta: [{ name: "description", content: "Courses" }],
}));

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const tabs_data = computed(() => [
  // {
  //   name: "ai-teacher",
  //   title: t("ai-teacher"),
  //   icon: "bi bi-robot",
  //   component: materials,
  //   props: {
  //     lessonData: lessonData.value,
  //     materialTypes: materialTypes.value,
  //   },
  //   className: "primary",
  // },
  {
    name: "materials",
    title: t("ai_mentor"),
    icon: "bi bi-stars",
    component: materials,
    props: { lessonData: lessonData.value, materialTypes: materialTypes.value },
    className: "primary",
  },
  {
    name: "tasks",
    title: t("pages.tasks.title"),
    icon: "pi pi-clock",
    component: tasks,
    props: { lesson_id: lesson_id, lessonData: lessonData.value },
  },
  {
    name: "dictionary",
    title: t("pages.dictionary.title"),
    icon: "bi bi-alphabet",
    component: dictionary,
    props: { lesson_id: lesson_id },
  },
]);

const getMaterialTypes = async () => {
  await $axiosPlugin
    .get("courses/get_material_types")
    .then((response) => {
      materialTypes.value = response.data;
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

const getLesson = async () => {
  await $axiosPlugin
    .get(
      "courses/" +
        course_slug +
        "/" +
        level_slug +
        "/" +
        section_id +
        "/get_lesson/" +
        lesson_id,
    )
    .then((response) => {
      const courseCrumbItem = document.querySelector(
        'span[data-crumb="[course]"]',
      );

      // Проверить, найден ли элемент
      if (courseCrumbItem) {
        // Изменить текст внутри элемента
        courseCrumbItem.textContent = response.data.course.course_name;
      }

      const levelCrumbItem = document.querySelector(
        'span[data-crumb="[level]"]',
      );

      // Проверить, найден ли элемент
      if (levelCrumbItem) {
        // Изменить текст внутри элемента
        levelCrumbItem.textContent = response.data.level.level_name;
      }

      const sectionCrumbItem = document.querySelector(
        'span[data-crumb="[section]"]',
      );

      // Проверить, найден ли элемент
      if (sectionCrumbItem) {
        // Изменить текст внутри элемента
        sectionCrumbItem.textContent = response.data.section.section_name;
      }

      const lessonCrumbItem = document.querySelector(
        'span[data-crumb="[lesson]"]',
      );

      // Проверить, найден ли элемент
      if (lessonCrumbItem) {
        // Изменить текст внутри элемента
        lessonCrumbItem.textContent = response.data.lesson.lesson_name;
      }

      pageTitle.value = response.data.lesson.lesson_name;
      sectionName.value = response.data.section.section_name;

      lessonData.value = response.data.lesson;
      courseIsAvailable.value =
        response.data.level.available_status.is_available;
      lessonIsAvailable.value =
        response.data.lesson.available_status.is_available;
      loaded.value = true;
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

provide("getLesson", getLesson);

onMounted(() => {
  getMaterialTypes();
  getLesson();
});
</script>
