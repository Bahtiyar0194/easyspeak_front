<template>
    <countdownTaskTimer v-if="showTaskTimer" />
    <div v-if="taskData?.sentences" class="custom-grid">
        <div v-if="!isFinished" class="col-span-12">
            <div class="custom-grid">
                <div class="col-span-12">
                    <p class="mb-0 text-corp font-medium">{{ props.task.task_name }}</p>
                </div>

                <div class="col-span-12">
                    <progressBar :progressPercentage="progressPercentage" />

                    <p v-if="timeIsUp" class="font-medium text-center text-danger">{{ $t('time_is_up') }}
                    </p>
                    <p v-else-if="isComplete" class="font-medium text-center text-success">{{ $t('right')
                        }}</p>
                    <p v-else-if="isWrong" class="font-medium text-center text-danger">{{ $t('wrong') }}
                    </p>
                    <p v-else-if="sentencesLeft > 0" class="text-center">{{
                        $t('pages.sentences.sentences_left') }}: <b>{{ sentencesLeft }}</b></p>
                </div>

                <div class="col-span-12">
                    <div class="flex justify-center items-center">
                        <countdownCircleTimer :totalSeconds="time" :startCommand="isStarted" :isWrong="isWrong"
                            @timeIsUp="timerIsUp()" />
                    </div>
                </div>

                <div class="col-span-12">
                    <div class="bg-inactive p-4 rounded-xl font-medium text-center w-fit mx-auto"
                        :class="isComplete && 'text-success'">{{
                            taskData?.options.in_the_main_lang ? currentSentence?.sentence_translate :
                        currentSentence?.sentence }}
                    </div>
                </div>

                <div v-if="timeIsUp || isWrong" class="col-span-12">
                    <div class="bg-inactive p-6 rounded-xl text-center">
                        <p class="text-inactive mb-2">{{ $t('right_answer') }}</p>
                        <p class="text-2xl mb-0 font-medium">{{ taskData?.options.in_the_main_lang ?
                            currentSentence?.sentence : currentSentence?.sentence_translate }}</p>
                    </div>
                </div>

                <div v-else class="col-span-12">
                    <div class="custom-grid">
                        <div class="col-span-12 border-b-inactive my-6 min-h-8">
                            <div v-if="displayedSentence.length > 0"
                                class="flex flex-wrap gap-1.5 justify-center font-medium mb-0 text-center duration-200 text-2xl"
                                :class="isComplete && 'text-success'">
                                <span v-for="(word, wordIndex) in displayedSentence" :key="wordIndex" v-motion="{
                                    initial: {
                                        scale: 0
                                    },
                                    enter: {
                                        scale: 1
                                    },

                                }">{{ word }}</span>
                            </div>
                        </div>

                        <div class="col-span-12">
                            <div class="flex justify-center">
                                <div class="btn-wrap justify-center mb-1 mx-0.5">
                                    <button v-for="(word, wordIndex) in cleanedSentenceWords"
                                        :key="`${word}-${wordIndex}-${currentSentence?.sentence_id}`" v-motion="{
                                            initial: { opacity: 0, scale: 0.5 },
                                            enter: { opacity: 1, scale: 1, transition: { delay: wordIndex * 50, type: 'spring', stiffness: 500, damping: 20 } }
                                        }" @click="checkSentence(word, wordIndex)" class="btn"
                                        :class="successButtonsIndex.includes(wordIndex) ? 'disabled text-hidden btn-outline-success' : errorButtonsIndex.includes(wordIndex) ? 'btn-danger wobble' : 'btn-light'">{{
                                            word
                                        }}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="timeIsUp || isWrong" class="col-span-12">
                    <div class="flex justify-center">
                        <button class="btn btn-primary btn-lg" @click="setSentence()"><i class="pi pi-arrow-right"></i>
                            {{ $t('continue') }}</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="col-span-12">
            <div class="flex flex-col gap-y-4">
                <div class="flex flex-col gap-y-2" v-if="studiedSentences.length > 0">
                    <p class="text-xl font-medium mb-0 text-success">{{ $t('pages.sentences.studied_sentences') }}</p>
                    <div v-for="(sentence, sIndex) in studiedSentences" :key="sIndex"
                        class="flex justify-between items-center gap-x-2">
                        <div>
                            <p class="mb-0 font-medium">{{ sentence.sentence }}</p>
                            <p class="mb-0 text-inactive">{{ sentence.sentence_translate }}</p>
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
                    <p class="text-xl font-medium mb-0 text-danger">{{ $t('pages.sentences.unstudied_sentences') }}</p>
                    <div v-for="(sentence, rIndex) in reStudySentences" :key="rIndex"
                        class="flex justify-between items-center gap-x-2">
                        <div>
                            <p class="mb-0 font-medium">{{ sentence.sentence }}</p>
                            <p class="mb-0 text-inactive">{{ sentence.sentence_translate }}</p>
                        </div>

                        <div class="flex items-center">
                            <audioButton v-if="sentence.audio_file"
                                :src="config.public.apiBase + '/media/' + sentence.audio_file" />
                            <div class="step-item xs failed">
                                <div class="step-icon">
                                    <i class="pi pi-sync"></i>
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
const currentSentence = ref(null);
const cleanedSentence = ref(null);
const cleanedSentenceWords = ref([]);
const originalSentence = ref(null);
const successButtonsIndex = ref([]);
const errorButtonsIndex = ref([]);

const studiedSentences = ref([]);
const reStudySentences = ref([]);

// Пользовательский ввод
const userInput = ref([]);
const displayedSentence = ref([]);
const isStarted = ref(false);
const isComplete = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

//Инициализированное значение попыток
const maxAttempts = 3;
const remainingAttempts = ref(0);
const isWrong = ref(false);

const sentencesLeft = computed(() => sentences.value.length);

const progressPercentage = computed(() => {
    const totalSentences = taskData.value?.sentences?.length || 0; // Предотвращаем ошибки, если данные ещё не загружены
    if (totalSentences === 0) return 0; // Если общее количество предложении равно 0, возвращаем 0
    const completedSentences = totalSentences - sentences.value.length;
    return (completedSentences / totalSentences) * 100;
});

const isFinished = ref(false);

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
        const res = await $axiosPlugin.get("tasks/form_a_sentence_out_of_the_words/" + props.task.task_id);
        showTaskTimer.value = true;
        taskData.value = res.data;
        time.value = taskData.value.options.seconds_per_sentence;
        // Перемешивание предложении
        sentences.value = [...taskData.value.sentences];

        setTimeout(() => {
            setSentence();
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

const setSentence = () => {
    if (sentences.value.length > 0) {
        // Устанавливаем текущее предложение
        currentSentence.value = sentences.value[0];

        // Очищаем текущее предложение от знаков препинания
        cleanedSentence.value = taskData.value.options.in_the_main_lang ? currentSentence.value.sentence.toLowerCase().replace(/[{}|<>.,:;""!?\/]/g, '').replace(/\s+/g, " ") : currentSentence.value.sentence_translate.toLowerCase().replace(/[{}|<>.,:;""!?\/]/g, '').replace(/\s+/g, " ");

        cleanedSentenceWords.value = cleanedSentence.value.split(' ').sort(() => Math.random() - 0.5);

        originalSentence.value = taskData.value.options.in_the_main_lang ? currentSentence.value.sentence.split(" ") : currentSentence.value.sentence_translate.split(" ");
        userInput.value = [];
        displayedSentence.value = [];
        isComplete.value = false;
        isStarted.value = true;
        timeIsUp.value = false;
        isWrong.value = false;
        remainingAttempts.value = maxAttempts;

        successButtonsIndex.value = [];
        errorButtonsIndex.value = [];
    }
    else {
        isFinished.value = true;
    }
}

const checkSentence = (word, wordIndex) => {

    userInput.value.push(word);

    const partialSentence = userInput.value.join(' ');

    if (cleanedSentence.value.startsWith(partialSentence)) {
        successButtonsIndex.value.push(wordIndex);

        displayedSentence.value.push(originalSentence.value[userInput.value.length - 1]);

        if (partialSentence === cleanedSentence.value) {
            isComplete.value = true;
            isStarted.value = false;

            studiedSentences.value.push(currentSentence.value);

            if (reStudySentences.value.some((s) => s.task_sentence_id === currentSentence.value.task_sentence_id)) {
                reStudySentences.value = reStudySentences.value.filter((s) => s.task_sentence_id !== currentSentence.value.task_sentence_id);
            }

            sentences.value.shift();

            setTimeout(() => {
                setSentence();
            }, 3000);
        }
    }
    else {
        if (userInput.value.length > 0) {
            userInput.value.pop();
        }

        errorButtonsIndex.value.push(wordIndex);

        setTimeout(() => {
            errorButtonsIndex.value = [];
        }, 1000);

        if (remainingAttempts.value >= 1) {
            --remainingAttempts.value;
        }
        else {
            moveToEnd();
            isWrong.value = true;
            isStarted.value = false;
        }
    }
};

const timerIsUp = () => {
    moveToEnd();
    timeIsUp.value = true;
    isStarted.value = false;
}

const moveToEnd = () => {
    if (reStudySentences.value.some((s) => s.task_sentence_id === currentSentence.value.task_sentence_id)) {
        sentences.value.shift();
    }
    else {
        // Перемещение первого элемента в конец
        const firstElement = sentences.value.shift(); // Удаляем первый элемент
        sentences.value.push(firstElement); // Добавляем его в конец
        reStudySentences.value.push(currentSentence.value);
    }
}

// Инициализация при монтировании
onMounted(() => {
    getTask();
    changeModalSize("modal-xl");
});
</script>