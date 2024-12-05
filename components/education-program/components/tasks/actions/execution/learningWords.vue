<template>
    <countdownTaskTimer v-if="showTaskTimer" />
    <div class="custom-grid">
        <div v-if="!isFinished" class="col-span-12 mx-1">
            <div class="custom-grid">
                <div class="col-span-12">
                    <progressBar :progressPercentage="progressPercentage" />

                    <p v-if="timeIsUp" class="font-medium text-center text-danger">{{ $t('time_is_up') }}
                    </p>
                    <p v-else-if="isComplete" class="font-medium text-center text-success">{{ $t('right')
                        }}</p>
                    <p v-else-if="isWrong" class="font-medium text-center text-danger">{{ $t('wrong') }}
                    </p>
                    <p v-else-if="wordsLeft > 0" class="text-center">{{
                        $t('pages.dictionary.words_left') }}: <b>{{ wordsLeft }}</b></p>
                </div>

                <div class="col-span-12">
                    <div class="flex justify-center">
                        <countdownCircleTimer :totalSeconds="time" :startCommand="isStarted" :isWrong="isWrong"
                            @timeIsUp="timerIsUp()" />
                    </div>
                </div>

                <div v-if="currentWord?.image_file && taskData?.options.show_image" class="col-span-12">
                    <img v-if="currentWord?.image_file && taskData?.options.show_image"
                        class="w-36 lg:w-40 h-auto mx-auto rounded-xl"
                        :src="config.public.apiBase + '/media/' + currentWord?.image_file">
                </div>

                <div class="col-span-12">
                    <div class="flex flex-wrap justify-center items-center gap-2">
                        <audioButton v-if="currentWord?.audio_file && taskData?.options.show_audio_button"
                            :key="currentWord?.audio_file"
                            :src="config.public.apiBase + '/media/' + currentWord?.audio_file" />
                        <h2 v-if="taskData?.options.show_word" class="text-center mb-2">{{
                            taskData?.options.in_the_main_lang ? currentWord?.word : currentWord?.word_translate }}
                        </h2>
                    </div>
                    <p v-if="taskData?.options.show_transcription" class="text-center text-inactive">[{{
                        currentWord?.transcription }}]</p>
                </div>

                <div v-if="timeIsUp || isWrong" class="col-span-12">
                    <div class="bg-inactive p-6 rounded-xl text-center">
                        <p class="text-inactive mb-2">{{ $t('right_answer') }}</p>
                        <p class="text-2xl mb-0 font-medium">{{ taskData?.options.in_the_main_lang ?
                            currentWord?.word_translate : currentWord?.word }}</p>
                    </div>
                </div>

                <div v-else class="col-span-12">
                    <div class="custom-grid">
                        <div v-for="(answer, index) in currentWord?.answer_options"
                            :key="`${currentWord?.word}-${index}-${currentWord?.task_word_id}`"
                            class="col-span-12 lg:col-span-6">
                            <trainingButton
                                :text="taskData?.options.in_the_main_lang ? answer.word_translate : answer.word"
                                :number="index + 1"
                                :className="successButtonIndex === index ? 'btn-success' : errorButtonIndex === index ? 'btn-danger wobble' : checkingStatus ? 'btn-inactive disabled' : 'btn-inactive'"
                                v-motion="{
                                    initial: { opacity: 0 },
                                    enter: { opacity: 1, transition: { delay: index * 50, type: 'spring', stiffness: 500, damping: 20 } }
                                }" @click="checkAnswer(index, $event)" />
                        </div>

                        <div class="col-span-12">
                            <p class="text-inactive text-center hidden lg:block mb-0">{{ $t('pages.training.keyboard')
                                }}
                            </p>
                        </div>
                    </div>
                </div>

                <div v-if="timeIsUp || isWrong" class="col-span-12">
                    <div class="flex justify-center">
                        <button class="btn btn-primary btn-lg" @click="setWord()"><i class="pi pi-arrow-right"></i>
                            {{ $t('continue') }}</button>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="col-span-12 max-h-60 overflow-auto pr-2">
            <div class="flex flex-col gap-y-4">
                <div class="flex flex-col gap-y-2" v-if="studiedWords.length > 0">
                    <p class="text-xl font-medium mb-0 text-success">{{ $t('pages.dictionary.studied_words') }}</p>
                    <div v-for="(word, sIndex) in studiedWords" :key="sIndex"
                        class="flex justify-between items-center gap-x-2">
                        <div>
                            <p class="mb-0 font-medium">{{ word.word }}</p>
                            <p class="mb-0 text-inactive">{{ word.word_translate }}</p>
                        </div>

                        <div class="flex items-center">
                            <audioButton v-if="word.audio_file"
                                :src="config.public.apiBase + '/media/' + word.audio_file" />
                            <div class="step-item xs completed">
                                <div class="step-icon">
                                    <i class="pi pi-check"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-y-2" v-if="reStudyWords.length > 0">
                    <p class="text-xl font-medium mb-0 text-danger">{{ $t('pages.dictionary.unstudied_words') }}</p>
                    <div v-for="(word, rIndex) in reStudyWords" :key="rIndex"
                        class="flex justify-between items-center gap-x-2">
                        <div>
                            <p class="mb-0 font-medium">{{ word.word }}</p>
                            <p class="mb-0 text-inactive">{{ word.word_translate }}</p>
                        </div>

                        <div class="flex items-center">
                            <audioButton v-if="word.audio_file"
                                :src="config.public.apiBase + '/media/' + word.audio_file" />
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
import trainingButton from "../../../../../ui/trainingButton.vue";
import audioButton from "../../../../../ui/audioButton.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import countdownTaskTimer from "../../../../../ui/countdownTaskTimer.vue";
import progressBar from "../../../../../ui/progressBar.vue";

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();

const showTaskTimer = ref(false);
const taskData = ref(null);
const words = ref([]);
const currentWord = ref(null);
const checkingStatus = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

const studiedWords = ref([]);
const reStudyWords = ref([]);

const isStarted = ref(false);
const isComplete = ref(false);

//Инициализированное значение попыток
const maxAttempts = 2;
const remainingAttempts = ref(0);
const isWrong = ref(false);

const wordsLeft = computed(() => words.value.length);

const progressPercentage = computed(() => {
    const totalWords = taskData.value?.words?.length || 0; // Предотвращаем ошибки, если данные ещё не загружены
    if (totalWords === 0) return 0; // Если общее количество слов равно 0, возвращаем 0
    const completedWords = totalWords - words.value.length;
    return (completedWords / totalWords) * 100;
});

const isFinished = ref(false);

const successButtonIndex = ref(null);
const errorButtonIndex = ref(null);

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
        const res = await $axiosPlugin.get("tasks/learning_words/" + props.task.task_id);
        showTaskTimer.value = true;
        taskData.value = res.data;
        time.value = taskData.value.options.seconds_per_word;
        words.value = [...taskData.value.words]; // Поверхностная копия массива, чтобы избежать изменения исходного массива taskData.value.words

        setTimeout(() => {
            setWord();
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

const setWord = () => {
    if (words.value.length > 0) {
        // Устанавливаем текущее слово
        currentWord.value = null;
        currentWord.value = words.value[0];
        checkingStatus.value = false;

        successButtonIndex.value = null;
        errorButtonIndex.value = null;

        isComplete.value = false;
        isStarted.value = true;
        timeIsUp.value = false;
        isWrong.value = false;
        remainingAttempts.value = maxAttempts;
    }
    else {
        isFinished.value = true;
    }
}

const checkAnswer = (answerIndex) => {
    checkingStatus.value = true;
    if (currentWord.value.task_word_id === currentWord.value.answer_options[answerIndex].task_word_id) {
        successButtonIndex.value = answerIndex;

        if (isStarted.value === true) {
            studiedWords.value.push(currentWord.value);
        }

        isComplete.value = true;
        isStarted.value = false;

        if (reStudyWords.value.some((w) => w.task_word_id === currentWord.value.task_word_id)) {
            reStudyWords.value = reStudyWords.value.filter((w) => w.task_word_id !== currentWord.value.task_word_id);
        }

        setTimeout(() => {
            words.value.shift();
            setWord();
        }, 2000);
    }
    else {
        errorButtonIndex.value = answerIndex;

        setTimeout(() => {
            checkingStatus.value = false;
            errorButtonIndex.value = null;
        }, 500);

        if (remainingAttempts.value >= 1) {
            --remainingAttempts.value;
        }
        else {
            isWrong.value = true;
            isStarted.value = false;
            moveToEnd();
        }
    }
};

const timerIsUp = () => {
    timeIsUp.value = true;
    isStarted.value = false;
    moveToEnd();
}

const moveToEnd = () => {
    if (reStudyWords.value.some((w) => w.task_word_id === currentWord.value.task_word_id)) {
        words.value.shift();
    }
    else {
        // Перемещение первого элемента в конец
        const firstElement = words.value.shift(); // Удаляем первый элемент
        words.value.push(firstElement); // Добавляем его в конец
        reStudyWords.value.push(currentWord.value);
    }
}

// Function to log key number and handle answer checking
const logNumber = (event) => {
    const key = event.key;
    if (checkingStatus.value === false && currentWord.value && (key >= '1' && key <= currentWord.value.answer_options.length)) {
        checkAnswer(parseInt(key - 1));
    }
};

// Инициализация при монтировании
onMounted(() => {
    getTask();
    changeModalSize("modal-2xl");
    // Добавляем обработчик событий при монтировании компонента
    window.addEventListener('keydown', logNumber);
});

onBeforeUnmount(() => {
    // Убираем обработчик событий при размонтировании компонента
    window.removeEventListener('keydown', logNumber);
});
</script>