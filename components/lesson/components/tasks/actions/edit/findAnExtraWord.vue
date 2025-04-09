<template>
  <steps v-if="task.task_id" :currentStep="currentStep" :steps="editTaskSteps">
    <form @submit.prevent="editTaskSubmit" class="mt-2" ref="editFormRef">
      <div class="custom-grid">
        <div
          class="col-span-12"
          v-for="(step, index) in editTaskSteps"
          :key="index"
          :class="currentStep === index + 1 ? 'block' : 'hidden'"
        >
          <component
            v-if="step.component"
            :is="step.component"
            v-bind="step.props"
          ></component>
        </div>
        <div class="col-span-12">
          <div class="btn-wrap justify-between">
            <button
              v-if="!addWordsSectionIsVisible && currentStep === 1"
              type="button"
              class="btn btn-outline-primary"
              @click="addSection()"
            >
              <i class="pi pi-plus"></i>
              {{ $t("pages.dictionary.add_section") }}
            </button>
            <div
              v-if="wordSections.length > 0 && !addWordsSectionIsVisible"
              class="btn-wrap"
            >
              <button
                v-if="currentStep > 1"
                class="btn btn-light"
                @click="backToStep(currentStep - 1)"
                type="button"
              >
                <i class="pi pi-arrow-left"></i>
                {{ $t("back") }}
              </button>

              <button class="btn btn-primary" type="submit">
                <template v-if="currentStep !== editTaskSteps.length">
                  <i class="pi pi-arrow-right"></i>
                  {{ $t("continue") }}
                </template>
                <template v-else>
                  <i class="pi pi-check"></i>
                  {{ $t("save") }}
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  </steps>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import steps from "../../../../../ui/steps.vue";
import firstStep from "../../find_an_extra_word/firstStep.vue";
import secondStep from "../../find_an_extra_word/secondStep.vue";
import editTaskMaterialsForm from "../../editTaskMaterialsForm.vue";
import editTaskOptionsForm from "../../editTaskOptionsForm.vue";

const { t } = useI18n();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const editFormRef = ref(null);
const wordSections = ref([]);
const selectedWords = ref([]);
const task = ref({});
const taskOptions = ref({});
const taskMaterials = ref([]);
const addWordsSectionIsVisible = ref(false);
const errors = ref([]);

const minimumWordsCount = ref(3);

const onPending = inject("onPending");
const changeModalSize = inject("changeModalSize");
const closeModal = inject("closeModal");

provide("changeModalSize", changeModalSize);

const props = defineProps({
  task: {
    required: true,
  },
});

const editTaskSteps = [
  {
    title: t("pages.dictionary.select_words"),
    component: firstStep,
    props: {
      errors,
      wordSections,
      selectedWords,
      addWordsSectionIsVisible,
      minimumWordsCount,
    },
    modalSize: "2xl",
  },
  {
    title: t("pages.tasks.missing_letters.select_letters"),
    component: secondStep,
    props: { errors, wordSections },
    modalSize: "3xl",
  },
  {
    title: t("pages.tasks.task_options.title"),
    component: editTaskOptionsForm,
    props: {
      errors,
      task,
      taskOptions,
      showAudioButton: true,
      showImpressionLimit: true,
      showSecondsPerSection: true,
    },
    modalSize: "4xl",
  },
  {
    title: t("pages.tasks.task_materials"),
    component: editTaskMaterialsForm,
    props: {
      errors,
      taskMaterials,
      taskOptions,
    },
    modalSize: "2xl",
  },
];

const currentStep = ref(1);

const backToStep = (step) => {
  currentStep.value = step;
  changeModalSize("modal-" + editTaskSteps[step - 1].modalSize);
};

// Получение задачи
const getTask = async () => {
  try {
    onPending(true);
    const res = await $axiosPlugin.get(
      "tasks/get/find_an_extra_word/" + props.task.task_id
    );
    task.value = res.data.task;
    taskOptions.value = res.data.options;
    taskMaterials.value = res.data.materials;
    wordSections.value = res.data.word_sections;

    wordSections.value.forEach((section) => {
      section.words.forEach((word) => {
        if (word.target == 1) {
          word.target = true;
        } else {
          word.target = false;
        }

        if (!word.removedLetters) {
          word.removedLetters = [];
        }

        if (word.missingLetters) {
          word.missingLetters.forEach((letter) => {
            word.removedLetters.push(letter - 1);
          });
        }
      });
    });
  } catch (err) {
    const errorRoute = err.response
      ? {
          path: "/error",
          query: {
            status: err.response.status,
            message: err.response.data.message,
            url: err.request.responseURL,
          },
        }
      : { path: "/error" };
    router.push(errorRoute);
  } finally {
    onPending(false);
  }
};

const editTaskSubmit = async () => {
  onPending(true);
  const formData = new FormData(editFormRef.value);
  formData.append("sections_count", wordSections.value.length);
  formData.append("sections", JSON.stringify(wordSections.value));
  formData.append("task_materials", JSON.stringify(taskMaterials.value));
  formData.append("operation_type_id", 14);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("tasks/edit/find_an_extra_word/" + props.task.task_id, formData)
    .then((res) => {
      onPending(false);
      if (res.data.step) {
        currentStep.value = res.data.step + 1;
        changeModalSize(
          "modal-" + editTaskSteps[currentStep.value - 1].modalSize
        );
      } else {
        closeModal();
      }
      errors.value = [];
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          onPending(false);
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

const targetWordInSection = (wordIndex, sectionIndex) => {
  wordSections.value[sectionIndex].words.forEach((word) => {
    word.target = false;
  });

  wordSections.value[sectionIndex].words[wordIndex].target = true;
};

const removeSection = (sectionIndex) => {
  if (sectionIndex >= 0 && sectionIndex < wordSections.value.length) {
    wordSections.value.splice(sectionIndex, 1);
  }
};

const addSection = () => {
  changeModalSize("modal-full");
  errors.value = [];
  selectedWords.value = [];
  addWordsSectionIsVisible.value = true;
};

const closeAddSection = () => {
  addWordsSectionIsVisible.value = false;
  selectedWords.value = [];
  changeModalSize("modal-2xl");
  errors.value = [];
};

const addWordsToSection = () => {
  if (selectedWords.value.length >= minimumWordsCount.value) {
    wordSections.value.push({
      words: selectedWords.value,
    });

    wordSections.value[wordSections.value.length - 1].words.forEach((word) => {
      word.target = false;
    });

    closeAddSection();
  } else {
    errors.value.words_count = [
      t("pages.dictionary.min_words_count_error", minimumWordsCount.value),
    ];
  }
};

provide("targetWordInSection", targetWordInSection);
provide("removeSection", removeSection);
provide("closeAddSection", closeAddSection);
provide("addWordsToSection", addWordsToSection);

onMounted(() => {
  getTask();
  changeModalSize("modal-2xl");
});
</script>
