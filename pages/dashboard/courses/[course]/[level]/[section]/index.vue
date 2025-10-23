<template>
  <loader v-if="pending" :className="'full-overlay'" :showPendingText="true" />

  <div
    v-if="lessonsData && lessonsData?.level?.is_available"
    class="col-span-12"
  >
    <div class="custom-grid">
      <div class="col-span-12">
        <div
          class="flex flex-wrap gap-x-2 gap-y-4 items-center justify-between"
        >
          <h2 class="mb-0">{{ lessonsData.section.section_name }}</h2>
          <roleProvider :roles="[1]" :redirect="false">
            <div class="btn-wrap justify-end">
              <button
                class="btn btn-primary"
                type="button"
                @click="showAddLessonModal()"
              >
                <i class="pi pi-plus-circle"></i>
                {{ $t("pages.lessons.add_lesson") }}
              </button>
            </div>
          </roleProvider>
        </div>
      </div>

      <div
        v-if="lessonsData && lessonsData.section.lessons.length"
        class="col-span-12"
      >
        <ul class="list-group">
          <li v-if="lessonsData && lessonsData.section.completed_percent > 0">
            <p class="mb-2">
              <b> {{ $t("pages.courses.section_overall_progress") }}:</b>
            </p>
            <progressBar
              :progressPercentage="lessonsData.section.completed_percent"
              :wrapClass="'!my-0'"
              :showPercentage="true"
              :className="'sm success'"
            />
          </li>

          <li
            v-for="(lesson, lessonIndex) in lessonsData.section.lessons"
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
                      section_id +
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

              <circleProgressBar :progress="lesson.completed_tasks_percent" />
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
import modal from "../../../../../../components/ui/modal.vue";
import alert from "../../../../../../components/ui/alert.vue";
import loader from "../../../../../../components/ui/loader.vue";
import progressBar from "../../../../../../components/ui/progressBar.vue";
import circleProgressBar from "../../../../../../components/ui/circleProgressBar.vue";
import roleProvider from "../../../../../../components/ui/roleProvider.vue";
import { useRouter } from "nuxt/app";
import { useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
const errors = ref([]);
const course_slug = route.params.course;
const level_slug = route.params.level;
const section_id = route.params.section;

const { $axiosPlugin } = useNuxtApp();
const lessonsData = ref([]);
const pending = ref(true);
const pendingAddLesson = ref(false);

const pageTitle = ref("");

const addLessonModalIsVisible = ref(false);
const unAvailableModalIsVisible = ref(false);

const addLessonFormRef = ref(null);

const lessonTypes = ref([]);

useHead(() => ({
  title: pageTitle.value,
  meta: [{ name: "description", content: "Section" }],
}));

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const showAddLessonModal = () => {
  addLessonModalIsVisible.value = true;
};

const getSection = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("courses/" + course_slug + "/" + level_slug + "/" + section_id)
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

      const sectionCrumbItem = document.querySelector(
        'span[data-crumb="[section]"]'
      );

      // Проверить, найден ли элемент
      if (sectionCrumbItem) {
        // Изменить текст внутри элемента
        sectionCrumbItem.textContent = response.data.section.section_name;
      }

      pageTitle.value = response.data.section.section_name;

      lessonsData.value = response.data;

      pending.value = false;
    })
    .catch((err) => {
      console.log(err);
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
        section_id +
        "/add_lesson",
      formData
    )
    .then((response) => {
      getSection();
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
  getSection();
});
</script>
