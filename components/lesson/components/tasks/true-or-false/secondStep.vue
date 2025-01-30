<template>
    <div class="custom-grid">
        <!-- <note :message="$t('pages.tasks.missing_words.note_1')" :className="'outline-success'" /> -->
        <div class="col-span-12">
            <ul class="list-group nowrap">
                <li class="list-item" v-for="(sentence, sentenceIndex) in selectedSentences" :key="sentenceIndex">
                    <div class="flex flex-col gap-y-3">
                        <b class="text-xl">{{ sentenceIndex + 1 }}. {{ sentence.sentence }}</b>

                        <div class="btn-wrap">
                            <button type="button" class="btn btn-sm" :class="sentence.isTrue === true ? 'btn-outline-primary' : 'btn-light'" @click="selectAnswer(sentenceIndex, true)">{{ $t('true') }}</button>
                            <button type="button" class="btn btn-sm" :class="sentence.isTrue === false ? 'btn-outline-primary' : 'btn-light'" @click="selectAnswer(sentenceIndex, false)">{{ $t('false') }}</button>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
        <div v-if="errors.answers_failed" class="col-span-12">
            <p class="text-danger mb-0">{{ errors.answers_failed[0] }}</p>
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

    selectedSentences: {
        type: Object,
        required: true,
    }
});

const { errors, selectedSentences } = toRefs(props);

const selectAnswer = (sentenceIndex, state) => {
    selectedSentences.value[sentenceIndex].isTrue = state;
}
</script>