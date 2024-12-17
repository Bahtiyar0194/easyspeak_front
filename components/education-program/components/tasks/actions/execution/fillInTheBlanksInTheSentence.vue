<template>
    <countdownTaskTimer v-if="showTaskTimer" />
    <div class="custom-grid">
        <div v-if="!isFinished" class="col-span-12">
            <div class="custom-grid">
                <div class="col-span-12">
                    <p class="mb-0 text-corp font-medium">{{ props.task.task_name }}</p>
                </div>

                <div class="col-span-12">
                    <progressBar :progressPercentage="progressPercentage" />

                    <p v-if="timeIsUp" class="font-medium text-center text-danger">
                        {{ $t("time_is_up") }}
                    </p>
                    <p v-else-if="sentences.length > 0" class="text-center">
                        {{ $t("pages.sentences.sentences_left") }}:
                        <b>{{ sentences.length }}</b>
                    </p>
                </div>

                <div class="col-span-12">
                    <div class="flex justify-center items-center">
                        <countdownCircleTimer :totalSeconds="time" :startCommand="isStarted" @timeIsUp="timerIsUp()" />
                    </div>
                </div>

                <div v-if="timeIsUp || isComplete" class="col-span-12">
                    <div class="flex flex-col gap-y-4">
                        <div class="flex flex-col gap-y-2" v-if="currentStudiedSentences.length > 0">
                            <p class="text-xl font-medium mb-0 text-success">
                                {{ currentReStudySentences.length > 0 ? $t("right_answers") : $t("right") }}
                            </p>
                            <div v-for="(sentence, sIndex) in currentStudiedSentences" :key="sIndex"
                                class="flex justify-between items-center gap-x-2">
                                <div>
                                    <p class="mb-0 font-medium">{{ sentence.sentence }}</p>
                                    <p class="mb-0 text-inactive">
                                        {{ sentence.sentence_translate }}
                                    </p>
                                </div>

                                <div class="flex items-center">
                                    <audioButton v-if="sentence.audio_file"
                                        :src="config.public.apiBase + '/media/' + sentence.audio_file" />
                                    <div class="step-item xs completed">
                                        <div class="step-icon">
                                            <i class="pi pi-check"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col gap-y-2" v-if="currentReStudySentences.length > 0">
                            <p class="text-xl font-medium mb-0 text-danger">
                                {{ $t("for_re_examination") }}
                            </p>
                            <div v-for="(sentence, rIndex) in currentReStudySentences" :key="rIndex"
                                class="flex justify-between items-center gap-x-2">
                                <div>
                                    <div v-if="sentence.selectedOptionIndex >= 0"
                                        class="flex flex-wrap gap-x-1 font-medium">
                                        <p class="mb-0 text-inactive font-normal">
                                            {{ $t('your_answer') }}:
                                        </p>
                                        <div v-for="(word, wordIndex) in sentence.sentence.split(' ')" :key="wordIndex">
                                            <span class="underline text-danger"
                                                v-if="wordIndex === sentence.missing_word_position && sentence.selectedOptionIndex >= 0">{{
                                                    sentence.missingWords[sentence.selectedOptionIndex].word }}</span>
                                            <span class="underline text-success"
                                                v-else-if="wordIndex === sentence.missing_word_position">{{ word
                                                }}</span>
                                            <span v-else>{{ word }}</span>
                                        </div>
                                    </div>
                                    <div class="flex flex-wrap gap-x-1 font-medium">
                                        <p class="mb-0 text-inactive font-normal">
                                            {{ $t('right_answer') }}:
                                        </p>
                                        <div v-for="(word, wordIndex) in sentence.sentence.split(' ')" :key="wordIndex">
                                            <span class="underline text-success"
                                                v-if="wordIndex === sentence.missing_word_position">{{ word }}</span>
                                            <span v-else>{{ word }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-center">
                                    <audioButton v-if="sentence.audio_file"
                                        :src="config.public.apiBase + '/media/' + sentence.audio_file" />
                                    <div class="step-item xs failed">
                                        <div class="step-icon">
                                            <i class="pi pi-replay"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="btn-wrap right">
                            <button v-if="sentences.length > 0" class="btn btn-outline-primary" @click="setSentences()">
                                <i class="pi pi-arrow-right"></i> {{ $t("continue") }}
                            </button>
                            <button v-else class="btn btn-light" @click="isFinished = true">
                                <i class="pi pi-check"></i> {{ $t("pages.tasks.complete_the_task") }}
                            </button>
                        </div>
                    </div>
                </div>

                <div v-else class="col-span-12">
                    <div class="custom-grid">
                        <div v-for="(sentence, sentenceIndex) in currentSentences" :key="sentenceIndex"
                            class="col-span-12">
                            <div class="flex flex-wrap gap-1 font-medium text-lg mb-2">
                                <span>{{ sentenceIndex + 1 }}.</span>
                                <div v-for="(word, wordIndex) in sentence.sentence.split(' ')" :key="wordIndex">
                                    <span class="underline text-corp"
                                        v-if="wordIndex === sentence.missing_word_position && sentence.selectedOptionIndex >= 0">{{
                                            sentence.missingWords[sentence.selectedOptionIndex].word }}</span>
                                    <span v-else-if="wordIndex === sentence.missing_word_position">_______</span>
                                    <span v-else>{{ word }}</span>
                                </div>
                            </div>

                            <div class="btn-wrap">
                                <button v-for="(option, optionIndex) in sentence.missingWords" :key="optionIndex"
                                    type="button" class="btn btn-sm btn-light"
                                    :class="unFilledSentences.includes(sentenceIndex) ? 'pulse btn-danger' : sentence.selectedOptionIndex === optionIndex && 'text-hidden disabled'"
                                    @click="insertWord(sentenceIndex, optionIndex)">
                                    {{ option.word }}
                                </button>
                            </div>
                        </div>

                        <div class="col-span-12">
                            <div class="btn-wrap right">
                                <button class="btn btn-outline-primary" :class="checkingStatus && 'disabled'"
                                    @click="acceptAnswers()">
                                    <i class="pi pi-check"></i>
                                    {{ $t('check') }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="col-span-12">
            <div class="flex flex-col gap-y-4">
                <div class="flex flex-col gap-y-2" v-if="studiedSentences.length > 0">
                    <p class="text-xl font-medium mb-0 text-success">
                        {{ $t("pages.sentences.studied_sentences") }}
                    </p>
                    <div v-for="(sentence, sIndex) in studiedSentences" :key="sIndex"
                        class="flex justify-between items-center gap-x-2">
                        <div>
                            <p class="mb-0 font-medium">{{ sentence.sentence }}</p>
                            <p class="mb-0 text-inactive">
                                {{ sentence.sentence_translate }}
                            </p>
                        </div>

                        <div class="flex items-center">
                            <audioButton v-if="sentence.audio_file"
                                :src="config.public.apiBase + '/media/' + sentence.audio_file" />
                            <div class="step-item xs completed">
                                <div class="step-icon">
                                    <i class="pi pi-check"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-y-2" v-if="reStudySentences.length > 0">
                    <p class="text-xl font-medium mb-0 text-danger">
                        {{ $t("pages.sentences.unstudied_sentences") }}
                    </p>
                    <div v-for="(sentence, rIndex) in reStudySentences" :key="rIndex"
                        class="flex justify-between items-center gap-x-2">
                        <div>
                            <p class="mb-0 font-medium">{{ sentence.sentence }}</p>
                            <p class="mb-0 text-inactive">
                                {{ sentence.sentence_translate }}
                            </p>
                        </div>

                        <div class="flex items-center">
                            <audioButton v-if="sentence.audio_file"
                                :src="config.public.apiBase + '/media/' + sentence.audio_file" />
                            <div class="step-item xs failed">
                                <div class="step-icon">
                                    <i class="pi pi-replay"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { useRouter } from "nuxt/app";
import audioButton from "../../../../../ui/audioButton.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import countdownTaskTimer from "../../../../../ui/countdownTaskTimer.vue";
import progressBar from "../../../../../ui/progressBar.vue";
const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();

const showTaskTimer = ref(false);
const taskData = ref(null);
const sentences = ref([]);
const currentSentences = ref([]);
const checkingStatus = ref(false);

const studiedSentences = ref([]);
const currentStudiedSentences = ref([]);

const reStudySentences = ref([]);
const currentReStudySentences = ref([]);

const unFilledSentences = ref([]);

const isStarted = ref(false);
const isComplete = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

const isFinished = ref(false);

//Инициализированное значение попыток
const maxAttempts = 0;

const progressPercentage = computed(() => {
    const totalSentences = taskData.value?.sentences?.length || 0; // Предотвращаем ошибки, если данные ещё не загружены
    if (totalSentences === 0) return 0; // Если общее количество предложении равно 0, возвращаем 0
    const completedSentences = totalSentences - sentences.value.length;
    return (completedSentences / totalSentences) * 100;
});

// Получаем данные задачи из пропсов
const props = defineProps({
    task: {
        type: Object,
        required: true,
    },
});


const onPending = inject("onPending");
const changeModalSize = inject("changeModalSize");


// Получение задачи
const getTask = async () => {
    try {
        onPending(true);
        const res = await $axiosPlugin.get(
            "tasks/fill_in_the_blanks_in_the_sentence/" + props.task.task_id
        );
        showTaskTimer.value = true;
        taskData.value = res.data;
        sentences.value = [...taskData.value.sentences];

        sentences.value.forEach((sentence) => {
            sentence.attempts = maxAttempts;
        });

        setTimeout(() => {
            setSentences();
            showTaskTimer.value = false;
        }, 3000);
    } catch (err) {
        const errorRoute = err.response
            ? {
                path: "/error",
                query: {
                    status: err.response.status,
                    message: err.response.data.message,
                    url: err.request.responseURL,
                },
            }
            : { path: "/error" };
        router.push(errorRoute);
    } finally {
        onPending(false);
    }
};

const setSentences = () => {
    currentStudiedSentences.value = [];
    currentReStudySentences.value = [];

    if (sentences.value.length > 0) {
        currentSentences.value = sentences.value.slice(0, taskData.value.options.impression_limit);

        currentSentences.value.forEach((sentence) => {
            const removeSentenceOptionIndex = sentences.value.find((s) => s.task_sentence_id === sentence.task_sentence_id);
            removeSentenceOptionIndex.selectedOptionIndex = undefined;
        });

        time.value = (taskData.value.options.seconds_per_sentence * currentSentences.value.length);

        isComplete.value = false;
        isStarted.value = true;
        timeIsUp.value = false;
        checkingStatus.value = false;
    }
}

const insertWord = (sentenceIndex, optionIndex) => {
    sentences.value[sentenceIndex].selectedOptionIndex = optionIndex;
}

const checkSentences = () => {
    currentSentences.value.forEach((sentence) => {
        sentences.value = sentences.value.filter((s) => s.task_sentence_id !== sentence.task_sentence_id);
        if (sentence.selectedOptionIndex >= 0 && (sentence.missingWords[sentence.selectedOptionIndex].word === sentence.sentence.split(" ")[sentence.missing_word_position])) {
            studiedSentences.value.push(sentence);
            currentStudiedSentences.value.push(sentence);

            if (reStudySentences.value.some((s) => s.task_sentence_id === sentence.task_sentence_id)) {
                reStudySentences.value = reStudySentences.value.filter((s) => s.task_sentence_id !== sentence.task_sentence_id);
            }
        }
        else {
            currentReStudySentences.value.push(sentence);

            if (sentence.attempts >= 1) {
                sentences.value.push(sentence);
                const removeSentenceAttempt = sentences.value.find((s) => s.task_sentence_id === sentence.task_sentence_id);
                removeSentenceAttempt.attempts--;
            }
            else {
                reStudySentences.value.push(sentence);
            }
        }
    });
}

const acceptAnswers = () => {
    checkingStatus.value = true;
    currentSentences.value.forEach((sentence, sentenceIndex) => {
        if (sentence.selectedOptionIndex === undefined) {
            unFilledSentences.value.push(sentenceIndex);
        }
    });

    if (unFilledSentences.value.length > 0) {
        setTimeout(() => {
            unFilledSentences.value = [];
            checkingStatus.value = false;
        }, 1000);
    }
    else {
        isComplete.value = true;
        isStarted.value = false;
        checkSentences();
    }
}

const timerIsUp = () => {
    timeIsUp.value = true;
    isStarted.value = false;
    checkSentences();
};

// Инициализация при монтировании
onMounted(() => {
    getTask();
    changeModalSize("modal-xl");
});
</script>