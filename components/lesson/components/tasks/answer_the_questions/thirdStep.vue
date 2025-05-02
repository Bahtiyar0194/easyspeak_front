<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <ul class="list-group nowrap">
        <li
          class="list-item"
          v-for="(sentence, sentenceIndex) in selectedSentences"
          :key="sentenceIndex"
        >
          <div class="custom-grid">
            <div class="col-span-12">
              <b class="text-xl"
                >{{ sentenceIndex + 1 }}. {{ sentence.sentence }}</b
              >

              <div class="mt-2">
                <label class="custom-radio text-nowrap">
                  <input
                    type="radio"
                    @change="sentence.checking_by = 'by_ai'"
                    :checked="sentence.checking_by === 'by_ai'"
                  />
                  <span>{{ $t("pages.tasks.check.by_ai") }}</span>
                </label>
              </div>
              <div>
                <label class="custom-radio text-nowrap">
                  <input
                    type="radio"
                    @change="sentence.checking_by = 'by_mentor'"
                    :checked="sentence.checking_by === 'by_mentor'"
                  />
                  <span>{{ $t("pages.tasks.check.by_mentor") }}</span>
                </label>
              </div>

              <div v-if="sentence.checking_by === 'by_mentor'">
                <p class="mb-1">
                  {{ $t("answer_options") }}:
                  <b>{{
                    sentence.answerOptions ? sentence.answerOptions.length : 0
                  }}</b>
                </p>

                <div
                  v-if="
                    sentence.answerOptions && sentence.answerOptions.length > 0
                  "
                  class="btn-wrap mb-4"
                >
                  <tag
                    v-for="(option, index) in sentence.answerOptions"
                    :key="index"
                    :itemId="index"
                    :itemLabel="option"
                    :onDelete="
                      (optionIndex) =>
                        deleteFromAnswers(sentenceIndex, optionIndex)
                    "
                    :closable="true"
                    v-motion="{
                      initial: {
                        y: -100,
                        opacity: 0,
                      },
                      enter: {
                        y: 0,
                        opacity: 1,
                      },
                    }"
                  />
                </div>

                <div class="btn-wrap">
                  <input
                    v-model="sentence.addAnswerInput"
                    class="border rounded-lg px-2 text-sm duration-200 ease-in"
                    :class="
                      sentence.addAnswerInputError
                        ? 'border-danger bg-danger placeholder-white wobble'
                        : 'border-inactive'
                    "
                    type="text"
                    :title="$t('write_here_and_press_add')"
                    :placeholder="$t('write_here_and_press_add') + '...'"
                  />
                  <button
                    type="button"
                    @click="addAnswer(sentenceIndex)"
                    class="btn btn-sm btn-outline-primary"
                  >
                    <i class="pi pi-plus-circle"></i> {{ $t("add") }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import tag from "../../../../ui/tag.vue";
import { toRefs, defineProps } from "vue";

const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },

  selectedSentences: {
    type: Object,
    required: true,
  },

  answerTheQuestionsOption: {
    type: Object,
    required: true,
  },
});

const addAnswer = (sentenceIndex) => {
  const sentence = selectedSentences.value[sentenceIndex];

  const trimmedInput = sentence.addAnswerInput.trim();

  if (trimmedInput) {
    sentence.answerOptions.push(trimmedInput);
    sentence.addAnswerInput = ""; // Очистить поле ввода после добавления
  } else {
    sentence.addAnswerInputError = true;
    setTimeout(() => {
      sentence.addAnswerInputError = false;
    }, 1000);
  }
};

const deleteFromAnswers = (sentenceIndex, optionIndex) => {
  const sentence = selectedSentences.value[sentenceIndex];
  sentence.answerOptions.splice(optionIndex, 1);
};

const { errors, selectedSentences, answerTheQuestionsOption } = toRefs(props);
</script>
