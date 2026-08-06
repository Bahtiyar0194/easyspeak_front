<template>
  <div class="custom-grid">
    <!-- <note :message="$t('pages.tasks.missing_words.note_1')" :className="'outline-success'" /> -->
    <div class="col-span-12">
      <ul class="list-group nowrap">
        <li
          class="list-item"
          v-for="(sentence, sentenceIndex) in selectedSentences"
          :key="sentenceIndex"
        >
          <div class="flex flex-col gap-y-6">
            <b class="text-xl"
              >{{ sentenceIndex + 1 }}. {{ sentence.sentence }}</b
            >

            <div class="flex flex-wrap gap-4 w-full">
              <div class="form-group-border select active label-active">
                <i class="bi bi-braces"></i>
                <select
                  v-model="sentence.answer_type"
                  @change="selectAnswerType(sentenceIndex)"
                >
                  <option
                    v-for="(type, typeIndex) in answerButtons"
                    :key="typeIndex"
                    :value="typeIndex"
                  >
                    {{ type.join(", ") }}
                  </option>
                </select>
                <label :class="{ 'label-error': errors.show_transcription }">
                  {{ $t("answer_options") }}
                </label>
              </div>

              <div class="btn-wrap">
                <button
                  v-for="button in answerButtons[sentence.answer_type]"
                  :key="button"
                  type="button"
                  class="btn"
                  :class="
                    sentence.answer === button
                      ? 'btn-outline-primary'
                      : 'btn-light'
                  "
                  @click="selectAnswer(sentenceIndex, button)"
                >
                  {{ button }}
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div v-if="errors.answers_failed" class="col-span-12">
      <p class="text-danger mb-0">{{ $t("choose_answer_option") }}</p>
    </div>
  </div>
</template>

<script setup>
import { toRefs, defineProps } from "vue";

const answerButtons = [
  ["True", "False", "Doesn't say"],
  ["Yes", "No", "Not given"],
];

const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },

  selectedSentences: {
    type: Object,
    required: true,
  },
});

const { errors, selectedSentences } = toRefs(props);

const selectAnswerType = (sentenceIndex) => {
  selectedSentences.value[sentenceIndex].answer = null;
};

const selectAnswer = (sentenceIndex, answer) => {
  selectedSentences.value[sentenceIndex].answer = answer;
};
</script>
