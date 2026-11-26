<template>
  <!-- Шапка: заголовок + число курсов + действие администратора -->
  <div class="col-span-12">
    <div class="page-head">
      <h2 class="page-title">
        {{ $t("pages.courses.title") }}
        <span v-if="!pending && courses.length" class="db-count">{{
          courses.length
        }}</span>
      </h2>
      <roleProvider :roles="[1]" :redirect="false">
        <button type="button" class="btn btn-primary">
          <i class="pi pi-plus" aria-hidden="true"></i>
          {{ $t("add_course") }}
        </button>
      </roleProvider>
    </div>
  </div>

  <!-- Загрузка: скелетоны карточек -->
  <template v-if="pending">
    <div v-for="i in 4" :key="'sk' + i" class="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3">
      <div class="skeleton aspect-[3/2] w-full !rounded-2xl"></div>
    </div>
  </template>

  <template v-else-if="courses.length">
    <div
      v-for="course in courses"
      :key="course.course_id || course.course_name_slug"
      class="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3"
    >
      <nuxt-link
        class="block rounded-2xl"
        :to="localePath('/dashboard/courses/' + course.course_name_slug)"
      >
        <courseCard :course="course" />
      </nuxt-link>
    </div>
  </template>

  <div v-else class="col-span-12">
    <emptyState :text="$t('pages.courses.no_courses')" icon="bi bi-journal-x" />
  </div>
</template>
<script setup>
import { useRouter } from "nuxt/app";
import courseCard from "../../../components/courses/courseCard.vue";
import roleProvider from "../../../components/ui/roleProvider.vue";
import emptyState from "../../../components/ui/emptyState.vue";

const { t } = useI18n();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const pending = ref(true);
const courses = ref([]);

useHead({
  title: t("pages.courses.title"),
  meta: [{ name: "description", content: "Courses" }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
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
