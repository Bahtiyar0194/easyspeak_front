<template>
  <div class="custom-grid">
    <note
      :message="$t('pages.tasks.match_words_with_same_sounds.note_2')"
      :className="'outline-success'"
    />
    <div class="col-span-12">
      <ul class="list-group nowrap">
        <li v-for="(section, sectionIndex) in wordSections" :key="sectionIndex">
          <div class="btn-wrap lg items-center">
            <div v-for="(word, wordIndex) in section" :key="wordIndex">
              <!-- <p class="mb-1">{{ wordIndex + 1 }}. {{ word.word }}</p> -->
              <div class="btn-wrap items-center sm">
                <div
                  v-for="(letter, letterIndex) in word.word"
                  :key="letterIndex"
                >
                  <div
                    v-if="letter === ' ' || letter === ''"
                    class="mx-1"
                  ></div>
                  <button
                    v-else
                    type="button"
                    class="btn btn-square btn-sm font-medium"
                    :class="
                      word.removedLetters?.includes(letterIndex)
                        ? 'btn-outline-primary'
                        : 'btn-light'
                    "
                    @click="
                      toggleLetterRemoval(letterIndex, wordIndex, sectionIndex)
                    "
                  >
                    {{ letter }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div v-if="errors.letters_failed" class="col-span-12">
      <p class="text-danger mb-0">{{ errors.letters_failed[0] }}</p>
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
  wordSections: {
    type: Object,
    required: true,
  },
});

const toggleLetterRemoval = (letterIndex, wordIndex, sectionIndex) => {
  const word = wordSections.value[sectionIndex][wordIndex];
  if (!word.removedLetters) {
    word.removedLetters = [];
  }
  const index = word.removedLetters.indexOf(letterIndex);
  if (index === -1) {
    word.removedLetters.push(letterIndex);
  } else {
    word.removedLetters.splice(index, 1);
  }
};

const { errors, wordSections } = toRefs(props);
</script>
