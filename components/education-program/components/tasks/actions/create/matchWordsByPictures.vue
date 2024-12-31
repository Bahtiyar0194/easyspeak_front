<template>
    <steps :currentStep="currentStep" :steps="newTaskSteps">
        <form @submit.prevent="createTaskSubmit" class="mt-2" ref="createFormRef">

            <div v-for="(step, index) in newTaskSteps" :key="index"
                :class="currentStep === (index + 1) ? 'block' : 'hidden'">
                <component v-if="step.component" :is="step.component" v-bind="step.props"></component>
            </div>

            <div class="btn-wrap mt-4">
                <button v-if="currentStep > 1" class="btn btn-light" @click="backToStep(currentStep - 1)" type="button">
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
        </form>
    </steps>
</template>

<script setup>
import { useRouter } from 'nuxt/app';
import steps from '../../../../../ui/steps.vue';
import selectWordsFromDictionary from '../../selectWordsFromDictionary.vue';
import courseStructureForm from '../../../../../courses/courseStructureForm.vue';
import taskOptionsForm from '../../taskOptionsForm.vue';

const { t } = useI18n();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const createFormRef = ref(null);
const selectedWords = ref([]);
const errors = ref([]);

const onPending = inject('onPending');
const changeModalSize = inject('changeModalSize');
const closeModal = inject('closeModal');

const newTaskSteps = [
    {
        title: t('pages.dictionary.select_words'),
        component: selectWordsFromDictionary,
        props: { errors, selectedWords, selectOnlyWordsWithImage: true },
        modalSize: 'full'
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
            showAudioButton: true,
            showTranslate: true,
            showTranscription: true,
            showImpressionLimit: true, 
            showSecondsPerWord: true
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
    formData.append('words_count', selectedWords.value.length);
    formData.append('words', JSON.stringify(selectedWords.value));
    formData.append('operation_type_id', 13);
    formData.append('step', currentStep.value);

    await $axiosPlugin.post('tasks/match_words_by_pictures', formData)
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

onMounted(() => {
    changeModalSize('modal-full');
});
</script>