<template>
  <div class="col-span-12">
    <div class="page-head">
      <h2 class="page-title">
        <template v-if="pageTitle">{{ pageTitle }}</template>
        <span v-else class="skeleton inline-block h-8 w-48"></span>
        <span v-if="!pending && levels.length" class="db-count">{{
          levels.length
        }}</span>
      </h2>
    </div>
  </div>

  <!-- Загрузка: скелетоны карточек -->
  <template v-if="pending">
    <div v-for="i in 4" :key="'sk' + i" class="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3">
      <div class="skeleton aspect-[3/2] w-full !rounded-2xl"></div>
    </div>
  </template>

  <template v-else-if="levels.length">
    <div
      v-for="level in levels"
      :key="level.level_id || level.level_slug"
      class="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3"
    >
      <!-- Недоступный уровень — не ссылка, а неактивная карточка -->
      <div
        v-if="level.available_status?.is_available === false"
        class="cursor-not-allowed"
        aria-disabled="true"
      >
        <levelCard :level="level" :showProgressBar="true" />
      </div>
      <nuxt-link
        v-else
        class="block rounded-2xl"
        :to="
          localePath('/dashboard/courses/' + course_slug + '/' + level.level_slug)
        "
      >
        <levelCard :level="level" :showProgressBar="true" />
      </nuxt-link>
    </div>
  </template>

  <div v-else class="col-span-12">
    <emptyState :text="$t('pages.courses.no_levels')" icon="bi bi-journal-x" />
  </div>
</template>

<script setup>
import { useCrumbLabels } from "~/composables/useCrumbLabels";
import emptyState from "../../../../components/ui/emptyState.vue";
import levelCard from "../../../../components/levels/levelCard.vue";
import { useRouter } from "nuxt/app";
import { useRoute } from "vue-router";

const { setCrumbLabels } = useCrumbLabels();

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
      // Названия для «хлебных крошек» (components/ui/breadcrumb.vue)
      setCrumbLabels({
        course: response.data.course.course_name,
      });

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
