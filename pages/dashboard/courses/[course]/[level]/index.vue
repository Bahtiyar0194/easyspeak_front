<template>
  <!-- Загрузка: скелетон шапки, прогресса и разделов -->
  <template v-if="pending && !loaded">
    <div class="col-span-12 flex flex-col gap-4">
      <div class="skeleton h-9 w-64 max-w-full"></div>
      <div class="skeleton h-28 w-full !rounded-2xl"></div>
      <div class="grid lg:grid-cols-2 gap-3">
        <div v-for="i in 4" :key="i" class="skeleton h-24 w-full !rounded-2xl"></div>
      </div>
    </div>
  </template>

  <template v-else-if="isAvailable">

    <!-- Шапка -->
    <div class="col-span-12">
      <div class="page-head">
        <h2 class="page-title">
          {{ sectionsData.level.level_name }}
          <span v-if="sections.length" class="db-count">{{ sections.length }}</span>
        </h2>
        <roleProvider :roles="[1]" :redirect="false">
          <button
            type="button"
            @click="addSectionModalIsVisible = true"
            class="btn btn-primary"
          >
            <i class="pi pi-plus" aria-hidden="true"></i>
            {{ $t("pages.lessons.add_unit") }}
          </button>
        </roleProvider>
      </div>
    </div>

    <!-- Бесплатный доступ -->
    <div
      v-if="
        sectionsData.level.available_status.is_available_always === true &&
        sectionsData.level.price === 0
      "
      class="col-span-12"
    >
      <div class="db-notice">
        <div class="db-notice-icon" aria-hidden="true">
          <i class="pi pi-gift"></i>
        </div>
        <p class="mb-0 flex-1 font-medium">
          {{ $t("pages.courses.modal.description_alt") }}
        </p>
      </div>
    </div>

    <!-- Общий прогресс + «Продолжить» -->
    <div v-if="sections.length" class="col-span-12">
      <div class="level-progress">
        <circleProgressBar
          :progress="levelPercent"
          :className="'w-16 h-16 shrink-0'"
          :textClass="'text-sm'"
        />
        <div class="flex-1 min-w-0 flex flex-col gap-2">
          <p class="mb-0 font-semibold">
            {{ $t("pages.courses.level_overall_progress") }}
          </p>
          <div class="cover-card-progress !bg-gray-200 dark:!bg-slate-700">
            <div :style="{ width: levelPercent + '%' }"></div>
          </div>
          <p class="mb-0 text-sm text-inactive">
            {{
              $t("pages.courses.sections_completed", {
                done: completedSections,
                total: sections.length,
              })
            }}
          </p>
        </div>
        <nuxt-link
          v-if="continueLink"
          class="btn btn-primary max-sm:w-full"
          :to="continueLink"
          :title="sectionsData.next_lesson?.lesson_name || undefined"
        >
          {{
            levelPercent > 0
              ? $t("pages.courses.continue_learning")
              : $t("pages.courses.start_learning")
          }}
          <i class="pi pi-arrow-right" aria-hidden="true"></i>
        </nuxt-link>
      </div>
    </div>

    <!-- Разделы. Перезагрузка (после добавления раздела): карточки на месте,
         по ним перелив -->
    <div
      v-if="sections.length"
      class="col-span-12"
      :class="{ 'list-refreshing': pending }"
      :aria-busy="pending || undefined"
    >
      <span v-if="pending" class="sr-only">{{ $t("loading") }}</span>
      <div class="grid lg:grid-cols-2 gap-3">
        <nuxt-link
          v-for="(section, sectionIndex) in sections"
          :key="section.section_id"
          :to="sectionLink(section)"
          class="unit-card"
          :class="{
            done: percentOf(section) >= 100,
            next: nextSection && nextSection.section_id === section.section_id,
            empty: !section.lessons.length,
          }"
        >
          <span class="unit-num" aria-hidden="true">
            <i v-if="percentOf(section) >= 100" class="pi pi-check"></i>
            <template v-else>{{ sectionIndex + 1 }}</template>
          </span>

          <div class="flex-1 min-w-0 flex flex-col gap-1.5">
            <h5 class="mb-0 leading-snug">{{ section.section_name }}</h5>
            <span v-if="section.lessons.length" class="text-sm text-inactive">
              <i class="pi pi-book text-xs" aria-hidden="true"></i>
              {{ $t("pages.lessons.lessons_count") }}:
              <b class="text-active">{{ section.lessons.length }}</b>
            </span>
            <span v-else class="text-sm text-inactive">{{
              $t("pages.lessons.there_is_no_lessons")
            }}</span>

            <div
              v-if="percentOf(section) > 0 && percentOf(section) < 100"
              class="unit-progress"
            >
              <div :style="{ width: percentOf(section) + '%' }"></div>
            </div>
          </div>

          <span
            v-if="percentOf(section) > 0"
            class="unit-percent"
            :class="{ 'text-success': percentOf(section) >= 100 }"
            >{{ percentOf(section) }}%</span
          >
          <i v-else class="pi pi-chevron-right text-inactive" aria-hidden="true"></i>
        </nuxt-link>
      </div>
    </div>

    <div v-else class="col-span-12">
      <emptyState :text="$t('pages.courses.not_sections')" icon="bi bi-inbox" />
    </div>
  </template>

  <div v-else class="col-span-12">
    <emptyState
      :text="$t('pages.courses.course_is_not_available')"
      icon="bi bi-lock"
    >
      <nuxt-link
        class="btn btn-light"
        :to="localePath('/dashboard/courses/' + course_slug)"
      >
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        {{ $t("back") }}
      </nuxt-link>
    </emptyState>
  </div>

  <roleProvider :roles="[1]" :redirect="false">
    <modal
      :show="addSectionModalIsVisible"
      :onClose="() => closeAddSectionModal()"
      :className="'modal-lg'"
      :showLoader="pendingAddSection"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4>{{ $t("pages.lessons.add_unit_title") }}</h4>
      </template>
      <template v-slot:body_content>
        <form
          class="mt-2"
          @submit.prevent="addSectionSubmit"
          ref="addSectionFormRef"
        >
          <div class="custom-grid">
            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-bookmark"></i>
                <input
                  autocomplete="off"
                  name="section_name"
                  type="text"
                  placeholder=" "
                />
                <label :class="{ 'label-error': errors.section_name }">
                  {{
                    errors.section_name
                      ? errors.section_name[0]
                      : $t("pages.lessons.unit_name")
                  }}
                </label>
              </div>
            </div>
          </div>

          <button
            class="btn btn-primary mt-4"
            :class="{ loading: pendingAddSection }"
            :disabled="pendingAddSection"
            type="submit"
          >
            <i class="pi pi-plus" aria-hidden="true"></i>
            {{ $t("add") }}
          </button>
        </form>
      </template>
    </modal>
  </roleProvider>
</template>

<script setup>
import { useCrumbLabels } from "~/composables/useCrumbLabels";
import roleProvider from "../../../../../components/ui/roleProvider.vue";
import modal from "../../../../../components/ui/modal.vue";
import emptyState from "~/components/ui/emptyState.vue";
import circleProgressBar from "../../../../../components/ui/circleProgressBar.vue";
import { useRouter } from "nuxt/app";
import { useRoute } from "vue-router";

const { setCrumbLabels } = useCrumbLabels();

const errors = ref([]);
const router = useRouter();
const localePath = useLocalePath();
const route = useRoute();
const course_slug = route.params.course;
const level_slug = route.params.level;

const { $axiosPlugin } = useNuxtApp();
const pending = ref(true);
const pendingAddSection = ref(false);
const sectionsData = ref([]);
// true после первой загрузки: до этого — скелетон, а не «курс недоступен».
const loaded = ref(false);

const isAvailable = computed(
  () => sectionsData.value?.level?.available_status?.is_available === true,
);

const sections = computed(() => sectionsData.value?.sections || []);

const percentOf = (section) =>
  Math.round(Math.min(100, Math.max(0, Number(section.completed_percent) || 0)));

const levelPercent = computed(() =>
  Math.round(
    Math.min(100, Math.max(0, Number(sectionsData.value?.level?.completed_percent) || 0)),
  ),
);

const completedSections = computed(
  () => sections.value.filter((s) => percentOf(s) >= 100).length,
);

// Первый незавершённый раздел с уроками — куда ведёт «Продолжить».
const nextSection = computed(() =>
  sections.value.find((s) => s.lessons?.length && percentOf(s) < 100),
);

const sectionLink = (section) =>
  localePath(
    "/dashboard/courses/" + course_slug + "/" + level_slug + "/" + section.section_id,
  );

// «Продолжить» — сразу в первый незавершённый урок уровня (если он открыт),
// иначе в раздел, где он находится
const continueLink = computed(() => {
  const next = sectionsData.value?.next_lesson;
  if (next?.is_available) {
    return localePath(
      `/dashboard/courses/${course_slug}/${level_slug}/${next.section_id}/${next.lesson_id}`,
    );
  }
  if (next) return sectionLink({ section_id: next.section_id });
  return nextSection.value ? sectionLink(nextSection.value) : null;
});
const pageTitle = ref("");

const addSectionModalIsVisible = ref(false);
const addSectionFormRef = ref(null);

useHead(() => ({
  title: pageTitle.value,
  meta: [{ name: "description", content: "Courses" }],
}));

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const getLevel = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("courses/get_level/" + course_slug + "/" + level_slug)
    .then((response) => {
      // Названия для «хлебных крошек» (components/ui/breadcrumb.vue)
      setCrumbLabels({
        course: response.data.course.course_name,
        level: response.data.level.level_name,
      });

      pageTitle.value = response.data.level.level_name;

      sectionsData.value = response.data;
      pending.value = false;
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

const addSectionSubmit = async () => {
  if (pendingAddSection.value) return;
  pendingAddSection.value = true;
  const formData = new FormData(addSectionFormRef.value);
  formData.append("operation_type_id", 15);

  await $axiosPlugin
    .post(
      "courses/" + course_slug + "/" + level_slug + "/add_section",
      formData,
    )
    .then((response) => {
      getLevel();
      closeAddSectionModal();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingAddSection.value = false;
        } else {
          router.push({
            path: "/error",
            query: {
              status: err.response.status,
              message: err.response.data.message,
              url: err.request.responseURL,
            },
          });
        }
      } else {
        router.push("/error");
      }
    });
};

const closeAddSectionModal = () => {
  addSectionModalIsVisible.value = false;
  pendingAddSection.value = false;
  addSectionFormRef.value.reset();
  errors.value = [];
};

onMounted(() => {
  getLevel();
});
</script>
