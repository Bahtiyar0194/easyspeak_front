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

    <!-- Соседние уроки уровня: не нужно возвращаться в раздел за следующим -->
    <div v-if="neighbors.prev || neighbors.next" class="col-span-12">
      <nav class="lesson-pager" :aria-label="$t('pages.lessons.lesson_navigation')">
        <component
          v-if="neighbors.prev"
          :is="neighbors.prev.is_available ? NuxtLink : 'span'"
          :to="neighbors.prev.is_available ? neighborLink(neighbors.prev) : undefined"
          class="lesson-pager-item"
          :class="{ locked: !neighbors.prev.is_available }"
        >
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
          <span class="min-w-0 flex flex-col">
            <span class="text-xs text-inactive">{{ $t("pages.lessons.prev_lesson") }}</span>
            <span class="font-semibold truncate">{{ neighbors.prev.lesson_name }}</span>
          </span>
        </component>
        <span v-else></span>

        <component
          v-if="neighbors.next"
          :is="neighbors.next.is_available ? NuxtLink : 'span'"
          :to="neighbors.next.is_available ? neighborLink(neighbors.next) : undefined"
          class="lesson-pager-item next"
          :class="{ locked: !neighbors.next.is_available }"
        >
          <span class="min-w-0 flex flex-col text-right">
            <span class="text-xs text-inactive">
              {{
                neighbors.next.is_available
                  ? $t("pages.lessons.next_lesson")
                  : neighbors.next.opens_at
                    ? $t("pages.lessons.opens_at", { date: formatOpensAt(neighbors.next.opens_at) })
                    : $t("pages.lessons.is_unavailable")
              }}
            </span>
            <span class="font-semibold truncate">{{ neighbors.next.lesson_name }}</span>
          </span>
          <i
            class="pi"
            :class="neighbors.next.is_available ? 'pi-arrow-right' : 'pi-lock'"
            aria-hidden="true"
          ></i>
        </component>
      </nav>
    </div>
  </template>

  <div v-else class="col-span-12">
    <emptyState
      :text="
        courseIsAvailable === false
          ? $t('pages.courses.course_is_not_available')
          : opensAt
            ? $t('pages.lessons.opens_at_desc', { lesson: pageTitle, date: formatOpensAt(opensAt) })
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
import { useCrumbLabels } from "~/composables/useCrumbLabels";
import emptyState from "../../../../../../../components/ui/emptyState.vue";
import tabs from "../../../../../../../components/ui/tabs.vue";
import materials from "../../../../../../../components/lesson/tabs/materials.vue";
import tasks from "../../../../../../../components/lesson/tabs/tasks.vue";
import dictionary from "../../../../../../../components/lesson/tabs/dictionary.vue";
import { useRouter } from "nuxt/app";
import { NuxtLink } from "#components";
import { useRoute } from "vue-router";

const { setCrumbLabels } = useCrumbLabels();
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
const { localeProperties } = useI18n();

// Соседние уроки уровня (отдаёт get_lesson) и дата открытия закрытого урока
const neighbors = ref({ prev: null, next: null });
const opensAt = ref(null);

const neighborLink = (item) =>
  localePath(
    "/dashboard/courses/" + course_slug + "/" + level_slug + "/" + item.section_id + "/" + item.lesson_id,
  );

// «4 декабря, 17:00» на языке интерфейса
const formatOpensAt = (iso) =>
  iso
    ? new Date(iso).toLocaleString(String(localeProperties.value.code || "ru").split("-")[0], {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

provide("pendingLesson", pendingLesson);

useHead(() => ({
  title: pageTitle.value,
  meta: [{ name: "description", content: "Courses" }],
}));

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
  // Переход «Следующий урок» — та же страница с другим адресом: пересоздаём её,
  // чтобы урок, задания и словарь загрузились заново
  key: (route) => route.path,
});

const tabs_data = computed(() => [
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
    icon: "pi pi-list-check",
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
      // Названия для «хлебных крошек» (components/ui/breadcrumb.vue)
      setCrumbLabels({
        course: response.data.course.course_name,
        level: response.data.level.level_name,
        section: response.data.section.section_name,
        lesson: response.data.lesson.lesson_name,
      });

      pageTitle.value = response.data.lesson.lesson_name;
      sectionName.value = response.data.section.section_name;

      lessonData.value = response.data.lesson;
      courseIsAvailable.value =
        response.data.level.available_status.is_available;
      lessonIsAvailable.value =
        response.data.lesson.available_status.is_available;
      opensAt.value = response.data.lesson.available_status.opens_at || null;
      neighbors.value = response.data.neighbors || { prev: null, next: null };
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
