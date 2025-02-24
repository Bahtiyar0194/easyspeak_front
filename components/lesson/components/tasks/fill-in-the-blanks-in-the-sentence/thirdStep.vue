<template>
  <div class="custom-grid">
    <note
      :message="$t('pages.tasks.missing_words.note_1')"
      :className="'outline-success'"
    />
    <div class="col-span-12">
      <ul class="list-group nowrap">
        <li
          class="list-item"
          v-for="(sentence, sentenceIndex) in selectedSentences"
          :key="sentenceIndex"
        >
          <div class="flex flex-col gap-y-3">
            <b class="text-xl"
              >{{ sentenceIndex + 1 }}. {{ sentence.sentence }}</b
            >

            <div class="btn-wrap items-center">
              <div
                v-for="(word, wordIndex) in sentence.sentence.split(' ')"
                :key="wordIndex"
              >
                <button
                  type="button"
                  class="btn"
                  :class="
                    ((sentence.removedWordsIndex &&
                      sentence.removedWordsIndex.includes(wordIndex)) ||
                    (sentence.removedWordIndex &&
                      sentence.removedWordIndex === wordIndex))
                      ? 'btn-outline-danger line-through'
                      : 'btn-light'
                  "
                  @click="toggleWordRemoval(wordIndex, sentenceIndex)"
                >
                  {{ word }}
                </button>
              </div>
            </div>

            <div
              class="flex flex-col gap-y-2"
              v-if="
                findWordOption === 'with_options' &&
                sentence.removedWordOptions &&
                sentence.removedWordOptions.length > 0
              "
            >
              <p class="mb-0">
                {{ $t("answer_options") }}:
                <b>{{ sentence.removedWordOptions.length }}</b>
              </p>

              <div class="btn-wrap">
                <tag
                  v-for="(option, index) in sentence.removedWordOptions"
                  :key="index"
                  :itemId="index"
                  :itemLabel="option"
                  :onDelete="
                    (optionIndex) =>
                      deleteFromOptions(sentenceIndex, optionIndex)
                  "
                  :closable="index > 0"
                  :colorClass="
                    sentence.removedWordOptions.length > 1 && index === 0
                      ? 'success'
                      : ''
                  "
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
                  v-model="sentence.addOptionInput"
                  class="border rounded-lg px-2 text-sm duration-200 ease-in"
                  :class="
                    sentence.addOptionInputError
                      ? 'border-danger bg-danger placeholder-white wobble'
                      : 'border-inactive'
                  "
                  type="text"
                  :title="$t('write_here_and_press_add')"
                  :placeholder="$t('write_here_and_press_add') + '...'"
                />
                <button
                  type="button"
                  @click="addOption(sentenceIndex)"
                  class="btn btn-sm btn-outline-primary"
                >
                  <i class="pi pi-plus-circle"></i> {{ $t("add") }}
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div v-if="errors.words_failed" class="col-span-12">
      <p class="text-danger mb-0">{{ errors.words_failed[0] }}</p>
    </div>
  </div>
</template>

<script setup>
import { toRefs, defineProps } from "vue";
import note from "../../../../ui/note.vue";
import tag from "../../../../ui/tag.vue";

const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },

  selectedSentences: {
    type: Object,
    required: true,
  },

  findWordOption: {
    type: Object,
    required: true,
  },
});

const { errors, selectedSentences, findWordOption } = toRefs(props);

const toggleWordRemoval = (wordIndex, sentenceIndex) => {
  const sentence = selectedSentences.value[sentenceIndex];

  if (findWordOption.value === "with_options") {
    sentence.addOptionInput = "";
    sentence.addOptionInputError = false;
    sentence.removedWordIndex = wordIndex;

    if (!sentence.removedWordOptions) {
      sentence.removedWordOptions = [];
    }

    sentence.removedWordOptions.shift();
    sentence.removedWordOptions.unshift(
      sentence.sentence.split(" ")[wordIndex]
    );
  } else {
    if (!sentence.removedWordsIndex) {
      sentence.removedWordsIndex = [];
    }

    const index = sentence.removedWordsIndex.indexOf(wordIndex);
    if (index === -1) {
      sentence.removedWordsIndex.push(wordIndex);
    } else {
      sentence.removedWordsIndex.splice(index, 1);
    }
  }
};

const addOption = (sentenceIndex) => {
  const sentence = selectedSentences.value[sentenceIndex];

  const trimmedInput = sentence.addOptionInput.trim();

  if (trimmedInput) {
    sentence.removedWordOptions.push(trimmedInput);
    sentence.addOptionInput = ""; // Очистить поле ввода после добавления
  } else {
    sentence.addOptionInputError = true;
    setTimeout(() => {
      sentence.addOptionInputError = false;
    }, 1000);
  }
};

const deleteFromOptions = (sentenceIndex, optionIndex) => {
  const sentence = selectedSentences.value[sentenceIndex];
  sentence.removedWordOptions.splice(optionIndex, 1);
};
</script>
