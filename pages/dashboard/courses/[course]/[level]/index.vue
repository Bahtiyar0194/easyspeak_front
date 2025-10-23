<template>
  <loader v-if="pending" :className="'full-overlay'" :showPendingText="true" />
  <div
    v-if="sectionsData && sectionsData?.level?.is_available"
    class="col-span-12"
  >
    <div class="custom-grid">
      <div class="col-span-12">
        <div
          class="flex flex-wrap gap-x-2 gap-y-4 items-center justify-between"
        >
          <h2 class="mb-0">{{ sectionsData.level.level_name }}</h2>
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
        v-if="sectionsData.level.is_available_always === 1"
        class="col-span-12"
      >
        <div class="bg-corp text-white p-4 rounded-xl">
          <p class="mb-1">
            <b>
              {{ $t("pages.courses.modal.description_alt") }}
            </b>
          </p>
        </div>
      </div>

      <div
        v-if="sectionsData && sectionsData.sections.length"
        class="col-span-12"
      >
        <ul class="list-group">
          <li v-if="sectionsData && sectionsData.level.completed_percent > 0">
            <p class="mb-2">
              <b>{{ $t("pages.courses.level_overall_progress") }}:</b>
            </p>
            <progressBar
              :progressPercentage="sectionsData.level.completed_percent"
              :wrapClass="'!my-0'"
              :showPercentage="true"
              :className="'sm success'"
            />
          </li>
          <li
            v-for="(section, sectionIndex) in sectionsData.sections"
            :key="sectionIndex"
            class="list-item"
          >
            <nuxt-link
              :to="
                localePath(
                  '/dashboard/courses/' +
                    course_slug +
                    '/' +
                    level_slug +
                    '/' +
                    section.section_id
                )
              "
            >
              <div class="flex justify-between items-center gap-x-2">
                <div class="flex flex-col">
                  <h5 class="mb-0">
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
                </div>
                <circleProgressBar
                  v-if="section.completed_percent > 0"
                  :progress="section.completed_percent"
                />
              </div>
            </nuxt-link>
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
  </roleProvider>
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

const { $axiosPlugin } = useNuxtApp();
const pending = ref(true);
const pendingAddSection = ref(false);
const sectionsData = ref([]);
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

      sectionsData.value = response.data;
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
