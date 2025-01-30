<template>
    <div class="custom-grid">
        <note :message="$t('pages.tasks.missing_letters.note_1')" :className="'outline-success'" />
        <div v-for="(word, wordIndex) in selectedWords" :key="wordIndex" class="col-span-12">
            <div class="btn-wrap items-center">
                <b>{{ wordIndex + 1 }}.</b>
                <div v-for="(letter, letterIndex) in word.word" :key="letterIndex">
                    <div v-if="letter === ' ' || letter === ''" class="mx-1"></div>
                    <button v-else type="button" class="btn btn-square btn-sm lowercase font-medium"
                        :class="word.removedLetters?.includes(letterIndex) ? 'btn-outline-danger' : 'btn-light'"
                        @click="toggleLetterRemoval(letterIndex, wordIndex)">
                        {{ letter }}
                    </button>
                </div>
            </div>
        </div>
        <div v-if="errors.letters_failed" class="col-span-12">
            <p class="text-danger mb-0">{{ errors.letters_failed[0] }}</p>
        </div>
    </div>
</template>

<script setup>
import { toRefs, defineProps } from 'vue';
import note from '../../../../ui/note.vue';

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

const toggleLetterRemoval = (letterIndex, wordIndex) => {
    const word = selectedWords.value[wordIndex];
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

const { errors, selectedWords } = toRefs(props);
</script>
