<template>
  <steps :currentStep="currentStep" :steps="newTaskSteps">
    <form @submit.prevent="createTaskSubmit" class="mt-2" ref="createFormRef">
      <div
        v-for="(step, index) in newTaskSteps"
        :key="index"
        :class="currentStep === index + 1 ? 'block' : 'hidden'"
      >
        <component
          v-if="step.component"
          :is="step.component"
          v-bind="step.props"
        ></component>
      </div>

      <div class="btn-wrap mt-4">
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
          <template v-if="currentStep !== newTaskSteps.length">
            <i class="pi pi-arrow-right"></i>
            {{ $t("continue") }}
          </template>
          <template v-else>
            <i class="pi pi-check"></i>
            {{ $t("save") }}
          </template>
        </button>
      </div>
    </form>
  </steps>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import steps from "../../../../../ui/steps.vue";
import selectSentences from "../../selectSentences.vue";
import thirdStep from "../../answer_the_questions/thirdStep.vue";
import taskMaterialsForm from "../../taskMaterialsForm.vue";
import taskOptionsForm from "../../taskOptionsForm.vue";

const { t } = useI18n();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const createFormRef = ref(null);
const selectedSentences = ref([]);
const taskMaterials = ref([]);
const answerTheQuestionsOption = ref("text");

const errors = ref([]);

const onPending = inject("onPending");
const changeModalSize = inject("changeModalSize");
const closeModal = inject("closeModal");

const props = defineProps({
  lesson_id: {
    required: true,
  },
});

const newTaskSteps = [
  {
    title: t("pages.tasks.task_options.title"),
    component: taskOptionsForm,
    props: {
      errors,
      showImpressionLimit: true,
      showAnswerTheQuestionsOptions: true,
      answerTheQuestionsOption,
      showSecondsPerQuestion: true,
      showMaxAttempts: false,
      showMaxAnswerAttempts: true,
    },
    modalSize: "4xl",
  },
  {
    title: t("pages.questions.select_questions"),
    component: selectSentences,
    props: {
      errors,
      selectedSentences,
      minimumSentencesCount: 1,
      showQuestionsCount: true,
    },
    modalSize: "full",
  },
  {
    title: t("pages.questions.question_settings"),
    component: thirdStep,
    props: { errors, selectedSentences, answerTheQuestionsOption },
    modalSize: "3xl",
  },
  {
    title: t("pages.tasks.task_materials"),
    component: taskMaterialsForm,
    props: {
      errors,
      taskMaterials,
    },
    modalSize: "2xl",
  },
];

const currentStep = ref(1);

const backToStep = (step) => {
  currentStep.value = step;
  changeModalSize("modal-" + newTaskSteps[step - 1].modalSize);
};

const createTaskSubmit = async () => {
  onPending(true);
  const formData = new FormData(createFormRef.value);
  formData.append("questions_count", selectedSentences.value.length);
  formData.append("questions", JSON.stringify(selectedSentences.value));
  formData.append("task_materials", JSON.stringify(taskMaterials.value));
  formData.append(
    "answer_the_questions_option",
    answerTheQuestionsOption.value
  );
  formData.append("operation_type_id", 13);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("tasks/create/answer_the_questions/" + props.lesson_id, formData)
    .then((res) => {
      onPending(false);
      errors.value = [];
      if (res.data.step) {
        currentStep.value = res.data.step + 1;
        changeModalSize(
          "modal-" + newTaskSteps[currentStep.value - 1].modalSize
        );
      } else {
        closeModal();
      }
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

onMounted(() => {
  changeModalSize("modal-4xl");
});

watch(
  () => selectedSentences.value,
  (newVal) => {
    selectedSentences.value.forEach((sentence) => {
      if (sentence.addOptionInput === undefined) {
        sentence.answerOptions = [];
        sentence.addAnswerInput = "";
        sentence.addAnswerInputError = false;
        sentence.checking_by = 'by_ai';
      }
    });
  }
);
</script>
