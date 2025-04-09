<template>
  <steps v-if="task.task_id" :currentStep="currentStep" :steps="editTaskSteps">
    <form @submit.prevent="editTaskSubmit" class="mt-2" ref="editFormRef">
      <div
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
    </form>
  </steps>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import steps from "../../../../../ui/steps.vue";
import selectSentences from "../../selectSentences.vue";
import editTaskOptionsForm from "../../editTaskOptionsForm.vue";
import editTaskMaterialsForm from "../../editTaskMaterialsForm.vue";

const props = defineProps({
  task: {
    required: true,
  },
});

const { t } = useI18n();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const editFormRef = ref(null);
const selectedSentences = ref([]);
const task = ref({});
const taskOptions = ref({});
const taskMaterials = ref([]);

const errors = ref([]);

const onPending = inject("onPending");
const changeModalSize = inject("changeModalSize");
const closeModal = inject("closeModal");

const editTaskSteps = [
  {
    title: t("pages.sentences.select_sentences"),
    component: selectSentences,
    props: { errors, selectedSentences },
    modalSize: "full",
  },
  {
    title: t("pages.tasks.task_options.title"),
    component: editTaskOptionsForm,
    props: {
      task,
      taskOptions,
      errors,
      showPlayAudioWithTheCorrectAnswer: true,
      showPlayErrorSoundWithTheInCorrectAnswer: true,
      showSecondsPerSentence: true,
      showSelectMainLang: true,
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
      "tasks/get/form_a_sentence_out_of_the_words/" + props.task.task_id
    );
    task.value = res.data.task;
    taskOptions.value = res.data.options;
    taskMaterials.value = res.data.materials;
    selectedSentences.value = res.data.sentences;
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
  formData.append("sentences_count", selectedSentences.value.length);
  formData.append("sentences", JSON.stringify(selectedSentences.value));
  formData.append("task_materials", JSON.stringify(taskMaterials.value));
  formData.append("operation_type_id", 14);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post(
      "tasks/edit/form_a_sentence_out_of_the_words/" + props.task.task_id,
      formData
    )
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

onMounted(() => {
  getTask();
  changeModalSize("modal-full");
});
</script>
