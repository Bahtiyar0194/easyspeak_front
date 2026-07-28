<template>
  <steps :currentStep="currentStep" :steps="newTaskSteps">
    <scrollFadeContainer ref="modalScrollBox" :maxHeight="500" :fadeSize="40">
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
            ref="childRef"
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

          <button
            v-if="currentStep === 2"
            class="btn btn-success"
            type="button"
            @click="addQuestion()"
          >
            <i class="pi pi-plus"></i>
            {{ $t("pages.questions.question.add") }}
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
    </scrollFadeContainer>
  </steps>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import steps from "../../../../../ui/steps.vue";
import secondStep from "../../choose_the_right_phrase/secondStep.vue";
import taskMaterialsForm from "../../taskMaterialsForm.vue";
import taskOptionsForm from "../../taskOptionsForm.vue";
import scrollFadeContainer from "../../../../../ui/scrollFadeContainer.vue";

const { t, localeProperties } = useI18n();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const childRef = ref(null);
const createFormRef = ref(null);
const taskMaterials = ref([]);
const modalScrollBox = ref(null);

const errors = ref([]);

const onPending = inject("onPending");
const changeModalSize = inject("changeModalSize");
const closeModal = inject("closeModal");

const questionItem = {
  question: "",
  answers: [
    {
      title: "",
      is_correct: false,
    },
    {
      title: "",
      is_correct: false,
    },
  ],
};

const questions = ref([structuredClone(questionItem)]);

const addQuestion = () => {
  questions.value.push(structuredClone(questionItem));
};

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
      showImpressionLimit: false,
      showOptionLabel: true,
      showSecondsPerSentence: true,
    },
    modalSize: "4xl",
  },
  {
    title: t("pages.questions.title"),
    component: secondStep,
    props: { errors, questions },
    modalSize: "2xl",
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
  formData.append("questions_count", questions.value.length);
  formData.append("questions", JSON.stringify(questions.value));
  formData.append("task_materials", JSON.stringify(taskMaterials.value));
  formData.append("operation_type_id", 13);
  formData.append("lang", localeProperties.value.code);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("tasks/create/choose_the_right_phrase/" + props.lesson_id, formData)
    .then((res) => {
      onPending(false);
      errors.value = [];
      if (res.data.step) {
        currentStep.value = res.data.step + 1;
        changeModalSize(
          "modal-" + newTaskSteps[currentStep.value - 1].modalSize,
        );
      } else {
        closeModal();
      }
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          modalScrollBox.value.scrollToTop(true);
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
</script>