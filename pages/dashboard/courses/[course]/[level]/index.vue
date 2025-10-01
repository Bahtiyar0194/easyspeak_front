<template>
  <loader v-if="pending" :className="'full-overlay'" />
  <div
    v-if="lessonsData && lessonsData?.level?.is_available"
    class="col-span-12"
  >
    <div class="custom-grid">
      <div class="col-span-12">
        <div
          class="flex flex-wrap gap-x-2 gap-y-4 items-center justify-between"
        >
          <h2 class="mb-0">{{ lessonsData.level.level_name }}</h2>
          <roleProvider :roles="[1]" :redirect="false">
            <div class="btn-wrap justify-end">
              <button
                @click="addSectionModalIsVisible = true"
                class="btn btn-primary"
              >
                <i class="pi pi-plus"></i> {{ $t("pages.lessons.add_unit") }}
              </button>
            </div>
          </roleProvider>
        </div>
      </div>

      <div
        v-if="lessonsData && lessonsData.level.completed_percent > 0"
        class="col-span-12"
      >
        <div class="card p-4">
          <p class="mb-2">{{ $t("pages.courses.level_overall_progress") }}:</p>
          <progressBar
            :progressPercentage="lessonsData.level.completed_percent"
            :wrapClass="'!my-0'"
            :showPercentage="true"
            :className="'sm success'"
          />
        </div>
      </div>
      <div
        v-if="lessonsData && lessonsData.sections.length"
        class="col-span-12"
      >
        <ul class="list-group">
          <li
            v-for="(section, sectionIndex) in lessonsData.sections"
            :key="sectionIndex"
            class="list-item"
          >
            <div>
              <div
                @click="toggleAccordion(sectionIndex)"
                class="flex justify-between items-center gap-4 hover:cursor-pointer"
              >
                <div class="flex flex-col w-full">
                  <h5
                    class="mb-0"
                    :class="activeSectionIndex === sectionIndex && 'text-corp'"
                  >
                    {{ section.section_name }}
                  </h5>
                  <span
                    v-if="section.lessons.length"
                    class="text-active text-sm"
                    >{{ $t("pages.lessons.lessons_count") }}:
                    <b>{{ section.lessons.length }}</b></span
                  >
                  <span v-else class="text-inactive text-sm">{{
                    $t("pages.lessons.there_is_no_lessons")
                  }}</span>
                  <progressBar
                    v-if="section.completed_percent > 0"
                    :progressPercentage="section.completed_percent"
                    :wrapClass="'!mb-0'"
                    :showPercentage="true"
                    :className="'sm'"
                  />
                </div>
                <div class="btn btn-circle btn-light">
                  <i
                    class="pi pi-angle-down duration-500"
                    :class="sectionIndex === activeSectionIndex && 'rotate-180'"
                  ></i>
                </div>
              </div>
            </div>

            <div
              class="transition-all duration-500 ease-in-out overflow-hidden"
              :class="activeSectionIndex === sectionIndex ? 'h-auto' : 'h-0'"
            >
              <ul class="list-group nowrap mt-2">
                <li
                  v-for="(lesson, lessonIndex) in section.lessons"
                  :key="lessonIndex"
                  class="list-item cursor-pointer"
                  @click="
                    lesson.is_available
                      ? openLesson(
                          '/dashboard/courses/' +
                            course_slug +
                            '/' +
                            level_slug +
                            '/' +
                            lesson.lesson_id
                        )
                      : openUnAvailableModal()
                  "
                >
                  <div class="flex justify-between items-center gap-x-2">
                    <div class="flex flex-col">
                      <div
                        class="font-medium"
                        :class="
                          lesson.is_available === true
                            ? 'text-corp'
                            : 'text-inactive line-through'
                        "
                      >
                        {{ lessonIndex + 1 }}. {{ lesson.lesson_name }}
                      </div>
                      <div class="flex gap-x-2 gap-y-0.5 flex-wrap">
                        <div class="flex gap-2">
                          <span
                            v-if="lesson.lesson_type_slug !== 'file_test'"
                            class="text-xs"
                            :class="
                              lesson.is_available === true
                                ? 'text-active'
                                : 'text-inactive'
                            "
                            >{{ $t("materials.materials_count") }}:
                            <b>{{ lesson.materials.length }}</b></span
                          >
                          <span
                            class="text-xs"
                            :class="
                              lesson.is_available === true
                                ? 'text-active'
                                : 'text-inactive'
                            "
                            >{{ $t("pages.tasks.tasks_count") }}:
                            <b>{{ lesson.tasks.length }}</b></span
                          >
                        </div>
                        <span class="text-xs text-inactive"
                          >({{ lesson.lesson_type_name }})</span
                        >
                      </div>
                    </div>

                    <circleProgressBar
                      :progress="lesson.completed_tasks_percent"
                    />
                  </div>
                </li>
                <roleProvider :roles="[1]" :redirect="false">
                  <li class="list-item mt-1.5">
                    <button
                      class="btn btn-sm btn-outline-primary"
                      type="button"
                      @click="showAddLessonModal(section.section_id)"
                    >
                      <i class="pi pi-plus-circle"></i>
                      {{ $t("pages.lessons.add_lesson") }}
                    </button>
                  </li>
                </roleProvider>
              </ul>
            </div>
          </li>
        </ul>
      </div>

      <div v-else class="col-span-12">
        <alert :className="'light'">
          <p class="mb-0">{{ $t("pages.courses.not_sections") }}</p>
        </alert>
      </div>
    </div>
  </div>
  <div v-else class="col-span-12">
    <alert :className="'light'">
      <p class="mb-0">{{ $t("pages.courses.course_is_not_available") }}</p>
    </alert>
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
                  autoComplete="new-section-name"
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

          <button class="btn btn-primary mt-4" type="submit">
            <i class="pi pi-plus"></i>
            {{ $t("add") }}
          </button>
        </form>
      </template>
    </modal>

    <modal
      :show="addLessonModalIsVisible"
      :onClose="() => closeAddLessonModal()"
      :className="'modal-xl'"
      :showLoader="pendingAddLesson"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4>{{ $t("pages.add-lesson.title") }}</h4>
      </template>
      <template v-slot:body_content>
        <form
          class="mt-2"
          @submit.prevent="addLessonSubmit"
          ref="addLessonFormRef"
        >
          <div class="custom-grid">
            <div class="col-span-12">
              <div class="form-group-border active label-active">
                <i class="pi pi-book"></i>
                <input
                  autoComplete="new-lesson-name"
                  name="lesson_name"
                  type="text"
                  placeholder=" "
                />
                <label :class="{ 'label-error': errors.lesson_name }">
                  {{
                    errors.lesson_name
                      ? errors.lesson_name[0]
                      : $t("pages.lessons.lesson_name")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active label-active">
                <i class="pi pi-book"></i>
                <textarea
                  autoComplete="new-lesson-description"
                  name="lesson_description"
                  placeholder=" "
                ></textarea>
                <label :class="{ 'label-error': errors.lesson_description }">
                  {{
                    errors.lesson_description
                      ? errors.lesson_description[0]
                      : $t("pages.lessons.lesson_description")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border select active label-active">
                <i class="pi pi-book"></i>
                <select name="lesson_type_id">
                  <option selected disabled value="">
                    {{ $t("pages.lessons.choose_a_lesson_type") }}
                  </option>
                  <option
                    v-for="(item, index) in lessonTypes"
                    :key="index"
                    :value="item.lesson_type_id"
                  >
                    {{ item.lesson_type_name }}
                  </option>
                </select>
                <label :class="{ 'label-error': errors.lesson_type_id }">
                  {{
                    errors.lesson_type_id
                      ? errors.lesson_type_id[0]
                      : $t("pages.lessons.lesson_type")
                  }}
                </label>
              </div>
            </div>
          </div>
          <button class="btn btn-primary mt-4" type="submit">
            <i class="pi pi-plus"></i>
            {{ $t("add") }}
          </button>
        </form>
      </template>
    </modal>
  </roleProvider>

  <modal
    :show="unAvailableModalIsVisible"
    :onClose="() => (unAvailableModalIsVisible = false)"
    :className="'modal-xl'"
    :showLoader="false"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.lessons.is_unavailable") }}</h4>
    </template>
    <template v-slot:body_content>
      <p class="mb-0">{{ $t("pages.lessons.is_unavailable_desc") }}</p>
    </template>
  </modal>
</template>

<script setup>
import roleProvider from "../../../../../components/ui/roleProvider.vue";
import loader from "../../../../../components/ui/loader.vue";
import modal from "../../../../../components/ui/modal.vue";
import alert from "../../../../../components/ui/alert.vue";
import progressBar from "../../../../../components/ui/progressBar.vue";
import circleProgressBar from "../../../../../components/ui/circleProgressBar.vue";
import { useRouter } from "nuxt/app";
import { useRoute } from "vue-router";

const errors = ref([]);
const router = useRouter();
const route = useRoute();
const course_slug = route.params.course;
const level_slug = route.params.level;
const currentSectionId = ref(null);

const { $axiosPlugin } = useNuxtApp();
const pending = ref(true);
const pendingAddSection = ref(false);
const pendingAddLesson = ref(false);
const lessonsData = ref([]);
const activeSectionIndex = ref(null);
const pageTitle = ref("");

const addSectionModalIsVisible = ref(false);
const addLessonModalIsVisible = ref(false);
const unAvailableModalIsVisible = ref(false);

const addSectionFormRef = ref(null);
const addLessonFormRef = ref(null);

const lessonTypes = ref([]);

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

const showAddLessonModal = (section_id) => {
  addLessonModalIsVisible.value = true;
  currentSectionId.value = section_id;
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

      lessonsData.value = response.data;

      if (
        lessonsData.value.sections.length > 0 &&
        lessonsData.value.sections.length === 1
      ) {
        activeSectionIndex.value = 0;
      }
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

const addSectionSubmit = async () => {
  pendingAddSection.value = true;
  const formData = new FormData(addSectionFormRef.value);
  formData.append("operation_type_id", 15);

  await $axiosPlugin
    .post(
      "courses/" + course_slug + "/" + level_slug + "/add_section",
      formData
    )
    .then((response) => {
      getLessons();
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

const addLessonSubmit = async () => {
  pendingAddLesson.value = true;
  const formData = new FormData(addLessonFormRef.value);

  formData.append("operation_type_id", 7);

  await $axiosPlugin
    .post(
      "courses/" +
        course_slug +
        "/" +
        level_slug +
        "/" +
        currentSectionId.value +
        "/add_lesson",
      formData
    )
    .then((response) => {
      getLessons();
      closeAddLessonModal();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingAddLesson.value = false;
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

const getLessonTypes = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("courses/get_lesson_types")
    .then((response) => {
      lessonTypes.value = response.data;
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

const closeAddSectionModal = () => {
  addSectionModalIsVisible.value = false;
  pendingAddSection.value = false;
  addSectionFormRef.value.reset();
  errors.value = [];
};

const closeAddLessonModal = () => {
  addLessonModalIsVisible.value = false;
  pendingAddLesson.value = false;
  addLessonFormRef.value.reset();
  errors.value = [];
};

const openLesson = (url) => {
  router.push(url);
};

const openUnAvailableModal = () => {
  unAvailableModalIsVisible.value = true;
};

onMounted(() => {
  getLessonTypes();
  getLessons();
});
</script>
