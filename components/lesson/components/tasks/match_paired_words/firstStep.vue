<template>
    <div class="custom-grid">
        <note :message="$t('pages.tasks.match_paired_words.note_1')"
        :className="'outline-success text-sm'" />

        <div v-if="addWordsSectionIsVisible === true" class="col-span-12">
            <selectWordsFromDictionary :selectedWords="selectedWords" :wordsCount="wordsCount"
                :selectWordsForSection="true" @update:selectedWords="selectedWords = $event" :errors="errors" />
        </div>

        <div v-if="!addWordsSectionIsVisible && wordSections.length > 0" class="col-span-12">
            <ul class="list-group nowrap">
                <li class="list-item" v-for="(section, sectionIndex) in wordSections" :key="sectionIndex">
                    <div class="flex justify-between flex-wrap gap-y-3">
                        <div class="btn-wrap">
                            <button @click="hideWordInSection(wordIndex, sectionIndex)" type="button"
                                v-for="(word, wordIndex) in section"
                                :key="`${word + '-' + wordIndex + '-' + sectionIndex}`" class="btn btn-sm"
                                :class="word.target === true ? 'btn-inactive disabled line-through' : 'btn-active'"
                                :title="word.target === true ? $t('pages.dictionary.this_word_is_hidden') : $t('pages.dictionary.hide_this_word')">{{
                                    word.word
                                }}</button>
                        </div>
                        <div class="btn-wrap">
                            <button @click="swapInSection(sectionIndex)"
                                class="btn btn-outline-primary btn-sm btn-square" type="button"
                                :title="$t('swap_places')"><i class="pi pi-arrow-right-arrow-left"></i></button>
                            <button @click="removeSection(sectionIndex)"
                                class="btn btn-outline-danger btn-sm btn-square" type="button" :title="$t('delete')"><i
                                    class="pi pi-times"></i></button>
                        </div>
                    </div>
                </li>
            </ul>

            <p v-if="errors.sections_count" class="text-danger my-3 mb-0">{{ errors.sections_count[0] }}</p>
        </div>
    </div>
</template>

<script setup>
import note from '../../../../ui/note.vue';
import { inject, provide } from 'vue';
import selectWordsFromDictionary from '../selectWordsFromDictionary.vue';

const hideWordInSection = inject('hideWordInSection');
const swapInSection = inject('swapInSection');
const removeSection = inject('removeSection');

const closeAddSection = inject('closeAddSection');
provide('closeAddSection', closeAddSection);

const addWordsToSection = inject('addWordsToSection');
provide('addWordsToSection', addWordsToSection);

const props = defineProps({
    errors: {
        type: Object,
        required: true
    },

    wordSections: {
        type: Object,
        required: true
    },

    selectedWords: {
        type: Object,
        required: true
    },

    addWordsSectionIsVisible: {
        type: Object,
        required: true
    },

    wordsCount: {
        type: Object,
        required: true
    }
});

const { errors, wordSections, selectedWords, addWordsSectionIsVisible, wordsCount } = toRefs(props);
</script>