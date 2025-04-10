<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <ul class="list-group" :class="{nowrap: answerTheQuestionsOption === 'text'}">
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
            </div>
            <div v-if="answerTheQuestionsOption === 'text'" class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-reply"></i>
                <input v-model="sentence.predefined_answer" type="text" placeholder=" " />
                <label>
                  {{
                    $t("pages.questions.predefined_answer")
                  }}
                </label>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
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

const { errors, selectedSentences, answerTheQuestionsOption } = toRefs(props);
</script>
