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
      <!-- Курс правит его школа (владелец, методист) или суперадмин -->
      <div v-if="canEdit" class="flex flex-wrap gap-2">
        <button type="button" class="btn btn-light" @click="courseModalIsVisible = true">
          <i class="pi pi-pencil" aria-hidden="true"></i>
          {{ $t("pages.courses.manage.edit") }}
        </button>
        <button type="button" class="btn btn-primary" @click="openLevelModal">
          <i class="pi pi-plus" aria-hidden="true"></i>
          {{ $t("pages.courses.manage.add_level") }}
        </button>
      </div>
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
    <emptyState
      :text="canEdit ? $t('pages.courses.manage.no_levels_editor') : $t('pages.courses.no_levels')"
      icon="bi bi-journal-x"
    >
      <button v-if="canEdit" type="button" class="btn btn-primary" @click="openLevelModal">
        <i class="pi pi-plus" aria-hidden="true"></i>
        {{ $t("pages.courses.manage.add_level") }}
      </button>
    </emptyState>
  </div>

  <template v-if="canEdit">
    <courseFormModal
      :show="courseModalIsVisible"
      :courseSlug="course_slug"
      :onClose="() => (courseModalIsVisible = false)"
      :onSaved="() => getLevels()"
    />
    <levelFormModal
      :show="levelModalIsVisible"
      :courseSlug="course_slug"
      :onClose="() => (levelModalIsVisible = false)"
      :onSaved="onLevelAdded"
    />
  </template>
</template>

<script setup>
import { useCrumbLabels } from "~/composables/useCrumbLabels";
import emptyState from "../../../../components/ui/emptyState.vue";
import levelCard from "../../../../components/levels/levelCard.vue";
import courseFormModal from "../../../../components/courses/courseFormModal.vue";
import levelFormModal from "../../../../components/levels/levelFormModal.vue";
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
const canEdit = ref(false);
const localePath = useLocalePath();
const courseModalIsVisible = ref(false);
const levelModalIsVisible = ref(false);

const openLevelModal = () => (levelModalIsVisible.value = true);

// Новый уровень пуст — сразу в него, добавлять разделы
const onLevelAdded = (data) => {
  router.push(localePath("/dashboard/courses/" + course_slug + "/" + data.level_slug));
};

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
      canEdit.value = response.data.course.can_edit === true;

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
