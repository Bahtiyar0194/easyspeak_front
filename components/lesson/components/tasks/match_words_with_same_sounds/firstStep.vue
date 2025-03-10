<template>
    <div class="custom-grid">
        <note :message="$t('pages.tasks.match_words_with_same_sounds.note_1')" :className="'outline-success text-sm'" />

        <div v-if="addWordsSectionIsVisible === true" class="col-span-12">
            <selectWordsFromDictionary :selectedWords="selectedWords" :minimumWordsCount="minimumWordsCount"
                :selectWordsForSection="true" @update:selectedWords="selectedWords = $event" :errors="errors" />
        </div>

        <div v-if="!addWordsSectionIsVisible && wordSections.length > 0" class="col-span-12">
            <ul class="list-group nowrap">
                <li class="list-item" v-for="(section, sectionIndex) in wordSections" :key="sectionIndex">
                    <div class="flex justify-between flex-wrap gap-y-3">
                        <div class="btn-wrap items-center">
                            <b>{{ sectionIndex + 1 }}.</b>
                            <div
                                v-for="(word, wordIndex) in section"
                                :key="`${word + '-' + wordIndex + '-' + sectionIndex}`" class="btn btn-sm select-none"
                                :class="word.target === true ? 'btn-outline-danger pointer-events-none line-through' : 'btn-active'">{{
                                    word.word
                                }}</div>
                        </div>
                        <button @click="removeSection(sectionIndex)" class="btn btn-outline-danger btn-sm btn-square"
                            type="button" :title="$t('delete')"><i class="pi pi-times"></i></button>
                    </div>
                </li>
            </ul>

            <p class="my-3 mb-0">
                <span v-if="errors.sections_count" class="text-danger">{{ errors.sections_count[0] }}</span>
                <span v-else-if="wordSections.length > 0 && errors.target_failed" class="text-danger">{{$t('pages.tasks.find_an_extra_word.extra_words_count_error')}}</span>
                <span v-else>{{$t('pages.sections.added_sections_count')}}: <b>{{ wordSections.length }}</b></span>
            </p>
        </div>
    </div>
</template>

<script setup>
import note from '../../../../ui/note.vue';
import { inject, provide } from 'vue';
import selectWordsFromDictionary from '../selectWordsFromDictionary.vue';

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

    minimumWordsCount: {
        type: Object,
        required: true
    }
});

const { errors, wordSections, selectedWords, addWordsSectionIsVisible, minimumWordsCount } = toRefs(props);
</script>