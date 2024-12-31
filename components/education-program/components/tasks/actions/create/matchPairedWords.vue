<template>
    <steps :currentStep="currentStep" :steps="newTaskSteps">
        <form @submit.prevent="createTaskSubmit" class="mt-2" ref="createFormRef">
            <div class="custom-grid">
                <div class="col-span-12" v-for="(step, index) in newTaskSteps" :key="index"
                :class="currentStep === (index + 1) ? 'block' : 'hidden'">
                <component v-if="step.component" :is="step.component" v-bind="step.props"></component>
            </div>
            <div class="col-span-12">
                <div class="btn-wrap justify-between">
                    <button v-if="!addWordsSectionIsVisible && currentStep === 1" type="button"
                        class="btn btn-outline-primary" @click="addSection()">
                        <i class="pi pi-plus"></i>
                        {{ $t('pages.dictionary.add_section') }}
                    </button>
                    <div v-if="wordSections.length > 0 && !addWordsSectionIsVisible" class="btn-wrap">
                        <button v-if="currentStep > 1" class="btn btn-light" @click="backToStep(currentStep - 1)"
                            type="button">
                            <i class="pi pi-arrow-left"></i>
                            <span>{{ $t("back") }}</span>
                        </button>

                        <button class="btn btn-primary" type="submit">
                            <template v-if="currentStep !== newTaskSteps.length">
                                <i class="pi pi-arrow-right"></i>
                                <span>{{ $t("continue") }}</span>
                            </template>
                            <template v-else>
                                <i class="pi pi-check"></i>
                                <span>{{ $t("save") }}</span>
                            </template>
                        </button>
                    </div>
                </div>
            </div>
            </div>
        </form>
    </steps>
</template>

<script setup>
import { useRouter } from 'nuxt/app';
import steps from '../../../../../ui/steps.vue';
import pairedWordSections from '../../pairedWordSections.vue';
import courseStructureForm from '../../../../../courses/courseStructureForm.vue';
import taskOptionsForm from '../../taskOptionsForm.vue';

const { t } = useI18n();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const createFormRef = ref(null);
const wordSections = ref([]);
const selectedWords = ref([]);
const addWordsSectionIsVisible = ref(false);
const errors = ref([]);

const wordsCount = ref(2);

const onPending = inject('onPending');
const changeModalSize = inject('changeModalSize');
const closeModal = inject('closeModal');

provide('changeModalSize', changeModalSize);

const newTaskSteps = [
    {
        title: t('pages.dictionary.select_words'),
        component: pairedWordSections,
        props: { errors, wordSections, selectedWords, addWordsSectionIsVisible, wordsCount },
        modalSize: '2xl'
    },
    {
        title: t('pages.lessons.choosing_a_lesson'),
        component: courseStructureForm,
        props: { errors },
        modalSize: '3xl'
    },
    {
        title: t('pages.tasks.task_options.title'),
        component: taskOptionsForm,
        props: {
            errors,
            showImpressionLimit: true, 
            showSecondsPerWord: true, 
        },
        modalSize: '4xl'
    }
];

const currentStep = ref(1);

const backToStep = (step) => {
    currentStep.value = step;
    changeModalSize('modal-' + newTaskSteps[step - 1].modalSize);
}

const createTaskSubmit = async () => {
    onPending(true);
    const formData = new FormData(createFormRef.value);
    formData.append('sections_count', wordSections.value.length);
    formData.append('sections', JSON.stringify(wordSections.value));
    formData.append('operation_type_id', 13);
    formData.append('step', currentStep.value);

    await $axiosPlugin.post('tasks/match_paired_words', formData)
        .then(res => {
            onPending(false);
            if (res.data.step) {
                currentStep.value = res.data.step + 1;
                changeModalSize('modal-' + newTaskSteps[currentStep.value - 1].modalSize);
            }
            else {
                closeModal();
            }
            errors.value = [];
        }).catch(err => {
            if (err.response) {
                if (err.response.status == 422) {
                    errors.value = err.response.data;
                    onPending(false);
                }
                else {
                    router.push({
                        path: '/error',
                        query: {
                            status: err.response.status,
                            message: err.response.data.message,
                            url: err.request.responseURL,
                        }
                    });
                }
            }
            else {
                router.push('/error');
            }
        });
}

const hideWordInSection = (wordIndex, sectionIndex) => {
    wordSections.value[sectionIndex].forEach((word) => {
        word.target = false;
    });

    wordSections.value[sectionIndex][wordIndex].target = true;
}

const swapInSection = (sectionIndex) => {
    if (sectionIndex >= 0 && sectionIndex < wordSections.value.length) {
        const subArray = wordSections.value[sectionIndex];
        if (subArray.length === wordsCount.value) {
            [subArray[0], subArray[1]] = [subArray[1], subArray[0]];
        }
    }
}

const deleteFromSection = (sectionIndex) => {
    if (sectionIndex >= 0 && sectionIndex < wordSections.value.length) {
        wordSections.value.splice(sectionIndex, 1);
    }
}

const addSection = () => {
    changeModalSize('modal-full');
    errors.value = [];
    selectedWords.value = [];
    addWordsSectionIsVisible.value = true;
}

const closeAddSection = () => {
    addWordsSectionIsVisible.value = false;
    selectedWords.value = [];
    changeModalSize('modal-2xl');
    errors.value = [];
}

const addWordsToSection = () => {
    if (selectedWords.value.length === wordsCount.value) {
        selectedWords.value[selectedWords.value.length - 1].target = true;
        wordSections.value.push(selectedWords.value);
        closeAddSection();
    }
    else {
        errors.value.words_count = [t('pages.dictionary.exactly_words_count_error', wordsCount.value)]
    }
}

provide('hideWordInSection', hideWordInSection);
provide('swapInSection', swapInSection);
provide('deleteFromSection', deleteFromSection);
provide('closeAddSection', closeAddSection);
provide('addWordsToSection', addWordsToSection);

onMounted(() => {
    changeModalSize('modal-2xl');
});
</script>