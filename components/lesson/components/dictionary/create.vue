<template>
  <steps :currentStep="currentStep" :steps="newDictionarySteps">
    <form
      @submit.prevent="createDictionarySubmit"
      class="mt-2"
      ref="createFormRef"
    >
      <div
        v-for="(step, index) in newDictionarySteps"
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
          <template v-if="currentStep !== newDictionarySteps.length">
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
import steps from "../../../ui/steps.vue";
import selectWordsFromDictionary from "../tasks/selectWordsFromDictionary.vue";
import secondStep from "./secondStep.vue";

const { t } = useI18n();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const createFormRef = ref(null);
const selectedWords = ref([]);
const errors = ref([]);

const onPending = inject("onPending");
const changeModalSize = inject("changeModalSize");
const closeModal = inject("closeModal");

const props = defineProps({
  lesson_id: {
    required: true,
  },
});

const newDictionarySteps = [
  {
    title: t("pages.dictionary.select_words"),
    component: selectWordsFromDictionary,
    props: { errors, selectedWords, minimumWordsCount: 2 },
    modalSize: "full",
  },
  {
    title: t("pages.dictionary.options"),
    component: secondStep,
    props: {
      errors,
    },
    modalSize: "2xl",
  },
];

const currentStep = ref(1);

const backToStep = (step) => {
  currentStep.value = step;
  changeModalSize("modal-" + newDictionarySteps[step - 1].modalSize);
};

const createDictionarySubmit = async () => {
  onPending(true);
  const formData = new FormData(createFormRef.value);
  formData.append("words_count", selectedWords.value.length);
  formData.append("words", JSON.stringify(selectedWords.value));
  formData.append("operation_type_id", 13);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("dictionary/add_lesson_dictionary/" + props.lesson_id, formData)
    .then((res) => {
      onPending(false);
      if (res.data.step) {
        currentStep.value = res.data.step + 1;
        changeModalSize(
          "modal-" + newDictionarySteps[currentStep.value - 1].modalSize
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
  changeModalSize("modal-full");
});
</script>
