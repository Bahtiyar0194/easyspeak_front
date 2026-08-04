<template>
  <div class="col-span-12">
    <canvas id="confetti-canvas"></canvas>
    <div class="flex flex-col gap-y-4">
      <div
        class="flex flex-col gap-y-2"
        v-if="props.studiedQuestions.length > 0"
      >
        <p class="text-xl font-medium mb-0 text-success">
          {{ $t("pages.questions.studied_questions") }}
        </p>

        <ul class="list-group nowrap">
          <li
            v-for="(question, sIndex) in props.studiedQuestions"
            :key="sIndex"
            class="flex justify-between items-center gap-x-2"
          >
            <div>
              <p class="mb-0 font-medium">{{ question.question }}</p>
            </div>

            <div class="step-item xs completed">
              <div class="step-icon">
                <i class="pi pi-check"></i>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div class="flex flex-col gap-y-2" v-if="reStudyQuestions.length > 0">
        <p class="text-xl font-medium mb-0 text-danger">
          {{ $t("pages.questions.unstudied_questions") }}
        </p>
        <ul class="list-group nowrap">
          <li
            v-for="(question, rIndex) in reStudyQuestions"
            :key="rIndex"
            class="flex justify-between items-center gap-x-2"
          >
            <div>
              <p class="mb-0 font-medium">{{ question.question }}</p>
            </div>

            <div class="step-item xs failed">
              <div class="step-icon">
                <i class="pi pi-replay"></i>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const props = defineProps({
  studiedQuestions: {
    type: Object,
    required: true,
  },
  reStudyQuestions: {
    type: Object,
    required: true,
  },
});
</script>
