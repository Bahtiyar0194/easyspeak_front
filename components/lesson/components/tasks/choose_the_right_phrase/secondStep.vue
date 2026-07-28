<template>
  <div class="custom-grid">
    <div
      class="col-span-12"
      v-for="(question, questionIndex) in questions"
      :key="questionIndex"
    >
      <div class="custom-grid">
        <div class="col-span-12">
          <div class="flex flex-wrap justify-between items-center gap-4">
            <b class="text-xl"
              >{{ $t("pages.questions.question.title") }} №
              {{ questionIndex + 1 }}</b
            >

            <button
              v-if="questionIndex > 0"
              type="button"
              class="btn btn-sm btn-outline-danger"
              @click="removeQuestion(questionIndex)"
            >
              <i class="pi pi-trash"></i>
              {{ $t("pages.questions.question.delete") }}
            </button>
          </div>
        </div>
        <div class="col-span-12">
          <div class="form-group-border active">
            <i class="pi pi-question"></i>
            <textarea v-model="question.question" placeholder=" "></textarea>
            <label
              :class="{
                'label-error': errors[`questions.${questionIndex}.question`],
              }"
            >
              {{
                errors[`questions.${questionIndex}.question`]
                  ? $t("pages.questions.question.required")
                  : $t("pages.questions.question.title")
              }}
            </label>
          </div>
        </div>

        <div class="col-span-12">
          <span>
            <b>{{ $t("pages.questions.answers") }}: </b>
            <span
              v-if="errors[`questions.${questionIndex}.answers`]"
              class="text-danger"
              >{{ errors[`questions.${questionIndex}.answers`][0] }}</span
            >
          </span>
        </div>

        <div
          class="col-span-12"
          v-for="(answer, answerIndex) in question.answers"
          :key="answerIndex"
        >
          <div class="card p-4">
            <b>
              {{
                $t("pages.questions.answer.title") + " № " + (answerIndex + 1)
              }}
            </b>

            <div class="form-group-border active mb-2 mt-4">
              <i class="pi pi-list"></i>
              <input type="text" v-model="answer.title" placeholder=" " />
              <label
                :class="{
                  'label-error':
                    errors[
                      `questions.${questionIndex}.answers.${answerIndex}.title`
                    ],
                }"
              >
                {{
                  errors[
                    `questions.${questionIndex}.answers.${answerIndex}.title`
                  ]
                    ? $t("pages.questions.answer.required")
                    : $t("pages.questions.answer.title") +
                      " № " +
                      (answerIndex + 1)
                }}
              </label>
            </div>

            <div class="flex flex-wrap gap-4 items-center justify-between">
              <label class="custom-radio-checkbox text-nowrap">
                <input type="checkbox" v-model="answer.is_correct" />
                <span>{{ $t("right_answer") }}</span>
              </label>

              <button
                v-if="answerIndex > 1"
                type="button"
                class="btn btn-sm btn-outline-danger"
                @click="removeAnswerOption(questionIndex, answerIndex)"
              >
                <i class="pi pi-trash"></i>
                {{ $t("pages.questions.answer.delete") }}
              </button>
            </div>
          </div>
        </div>

        <div class="col-span-12">
          <button
            type="button"
            class="btn btn-sm btn-success"
            @click="addAnswerOption(questionIndex)"
          >
            <i class="pi pi-plus"></i>
            {{ $t("add_answer_option") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },

  questions: {
    type: Object,
    required: true,
  },
});

const { errors, questions } = toRefs(props);

const removeQuestion = (questionIndex) => {
  questions.value.splice(questionIndex, 1);
};

const addAnswerOption = (questionIndex) => {
  questions.value[questionIndex].answers.push({
    title: "",
    is_correct: false,
  });
};

const removeAnswerOption = (questionIndex, answerIndex) => {
  questions.value[questionIndex].answers.splice(answerIndex, 1);
};
</script>
