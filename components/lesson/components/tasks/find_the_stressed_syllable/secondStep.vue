<template>
  <div class="custom-grid">
    <note
      :message="$t('pages.tasks.find_the_stressed_syllable.note_1')"
      :className="'outline-success'"
    />
    <div class="col-span-12">
      <ul class="list-group nowrap">
        <li v-for="(word, wordIndex) in selectedWords" :key="wordIndex">
          <!-- <p class="mb-2">{{ wordIndex + 1 }}. {{ word.word }}</p> -->
          <div class="btn-wrap items-center">
            <div v-for="(letter, letterIndex) in word.word" :key="letterIndex">
              <div v-if="letter === ' ' || letter === ''" class="mx-1"></div>
              <div v-else class="flex gap-2 items-center">
                <div class="select-none text-corp font-medium text-xl">
                  {{ letter }}
                </div>
                <button
                  v-if="word.word.length > letterIndex + 1"
                  type="button"
                  class="px-1 border-inactive"
                  :class="
                    word.syllableIndexes &&
                    word.syllableIndexes.length > 0 &&
                    word.syllableIndexes.includes(letterIndex)
                      ? 'border-danger text-danger'
                      : 'border-inactive'
                  "
                  @click="toggleSyllable(letterIndex, wordIndex)"
                >
                  |
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="word.wordSyllables && word.wordSyllables.length > 1"
            class="btn-wrap mt-2"
          >
            <button
              v-for="(syllable, syllableIndex) in word.wordSyllables"
              :key="syllableIndex"
              type="button"
              class="btn btn-sm lowercase"
              :class="
                syllable.target === true ? 'btn-outline-primary underline' : 'btn-light'
              "
              @click="selectSyllable(syllableIndex, wordIndex)"
              v-motion="{
                initial: {
                  y: -10,
                  opacity: 0,
                },
                enter: {
                  y: 0,
                  opacity: 1,
                },
              }"
            >
              {{ syllable.syllable }}
            </button>
          </div>
        </li>
      </ul>
    </div>
    <div v-if="errors.syllables_failed" class="col-span-12">
      <p class="text-danger mb-0">{{ errors.syllables_failed[0] }}</p>
    </div>
  </div>
</template>

<script setup>
import { toRefs, defineProps } from "vue";
import note from "../../../../ui/note.vue";

const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },
  selectedWords: {
    type: Object,
    required: true,
  },
});

const toggleSyllable = (letterIndex, wordIndex) => {
  const word = selectedWords.value[wordIndex];
  if (!word.syllableIndexes) {
    word.syllableIndexes = [];
  }
  const index = word.syllableIndexes.indexOf(letterIndex);
  if (index === -1) {
    word.syllableIndexes.push(letterIndex);
  } else {
    word.syllableIndexes.splice(index, 1);
  }

  if (word.syllableIndexes.length > 0) {
    word.syllableIndexes.sort((a, b) => a - b);
  }

  // Разделение слова на части
  word.wordSyllables = splitWordBySyllables(word.word, word.syllableIndexes);
};

const splitWordBySyllables = (word, syllableIndexes) => {
  const syllables = [];
  let lastIndex = 0;

  syllableIndexes.forEach((index) => {
    syllables.push({
      syllable: word.slice(lastIndex, index + 1),
      target: false,
    });
    lastIndex = index + 1;
  });

  if (lastIndex < word.length) {
    syllables.push({
      syllable: word.slice(lastIndex),
      target: false,
    });
  }

  return syllables.filter((syllable) => syllable.syllable.length > 0); // Проверяем длину строки в объекте
};

const selectSyllable = (syllableIndex, wordIndex) => {
  selectedWords.value[wordIndex].wordSyllables.forEach((syllable) => {
    syllable.target = false;
  });

  selectedWords.value[wordIndex].wordSyllables[syllableIndex].target = true;
};

const { errors, selectedWords } = toRefs(props);
</script>
