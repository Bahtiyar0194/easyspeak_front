<template>
    <countdownTaskTimer v-if="showTaskTimer" />
    <div class="custom-grid">
        <div v-if="!isFinished" class="col-span-12 mx-1">
            <div class="custom-grid">
                <div class="col-span-12">
                    <progressBar :progressPercentage="progressPercentage" />
                </div>
                <div class="col-span-12">
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
                        <audioButton
                            v-if="currentWord?.audio_file && taskData?.options.show_image && taskData?.options.show_audio_button"
                            :key="currentWord?.audio_file"
                            :src="config.public.apiBase + '/media/' + currentWord?.audio_file" />
                        <div v-else-if="currentWord?.audio_file && taskData?.options.show_audio_button" class="w-full">
                            <audioPlayerWithWave :key="currentWord?.audio_file"
                                :src="config.public.apiBase + '/media/' + currentWord?.audio_file" />
                        </div>
                    </div>
                </div>

                <div v-if="timeIsUp || isWrong" class="col-span-12">
                    <div class="bg-inactive p-6 rounded-xl text-center">
                        <p class="text-inactive mb-2">{{ $t('right_answer') }}</p>
                        <p class="text-2xl mb-0 font-medium">{{ currentWord?.word }}</p>
                    </div>
                </div>

                <div v-else class="col-span-12">
                    <div class="custom-grid">
                        <div class="col-span-12">
                            <div class="flex justify-center flex-wrap gap-x-1 mb-2">
                                <div v-for="(letter, letterIndex) in currentWord?.word" :key="letterIndex"
                                    class="text-3xl font-medium" :class="isComplete && 'text-success'">
                                    <div v-if="letter === ' ' || letter === ''" class="mx-1"></div>
                                    <div class="text-inactive" v-else-if="missingLetters.includes(letterIndex + 1)">
                                        _
                                    </div>
                                    <div v-else>
                                        {{ letter }}
                                    </div>
                                </div>
                            </div>

                            <p class="text-center text-lg text-inactive mb-1">{{ currentWord?.word_translate }}</p>
                            <p v-if="taskData?.options.show_transcription" class="text-center text-sm text-inactive">[{{
                                currentWord?.transcription }}]</p>
                        </div>

                        <div v-if="currentWord" class="col-span-12">
                            <div class="flex flex-wrap justify-center gap-1">
                                <button v-for="(letter, lIndex) in displayedLetters"
                                    :key="`${currentWord?.word}-${lIndex}-${currentWord?.task_word_id}`"
                                    @click="checkWord(letter.toLowerCase(), $event)"
                                    class="letter-btn btn btn-square btn-lg btn-light font-medium lowercase"
                                    :class="isComplete && 'disabled text-hidden'" v-motion="{
                                        initial: { opacity: 0 },
                                        enter: { opacity: 1, transition: { delay: lIndex * 50, type: 'spring', stiffness: 500, damping: 20 } }
                                    }">
                                    {{ letter }}
                                </button>
                            </div>
                        </div>

                        <div class="col-span-12">
                            <p class="text-inactive text-center hidden lg:block mb-0">{{
                                $t('pages.training.keyboard.title')
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

        <div v-else class="col-span-12 max-h-96 overflow-auto pr-2">
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
import { useToast } from 'vue-toastification';
import audioButton from "../../../../../ui/audioButton.vue";
import audioPlayerWithWave from "../../../../../ui/audioPlayerWithWave.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import countdownTaskTimer from "../../../../../ui/countdownTaskTimer.vue";
import progressBar from "../../../../../ui/progressBar.vue";
import { debounceHandler } from "../../../../../../utils/debounceHandler";
import { playAudio, pauseAudio, stopAudio } from '../../../../../../utils/playAudio';

const router = useRouter();
const config = useRuntimeConfig();
const toast = useToast();
const { t } = useI18n();
const { $axiosPlugin } = useNuxtApp();

const showTaskTimer = ref(false);
const taskData = ref(null);
const words = ref([]);
const currentWord = ref(null);
const missingLetters = ref([]);
const checkingStatus = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

const studiedWords = ref([]);
const reStudyWords = ref([]);

const isStarted = ref(false);
const isComplete = ref(false);

//Инициализированное значение попыток
const maxAttempts = 3;
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

const missingLetterInputs = ref([]);
const results = ref([]);

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
        const res = await $axiosPlugin.get("tasks/form_a_word_out_of_the_letters/" + props.task.task_id);
        showTaskTimer.value = true;
        taskData.value = res.data;
        time.value = taskData.value.options.seconds_per_word;
        words.value = [...taskData.value.words]; // Поверхностная копия массива, чтобы избежать изменения исходного массива taskData.value.words

        setTimeout(() => {
            setWord();
            showTaskTimer.value = false;
        }, 3000);

        // Инициализация массивов
        missingLetterInputs.value = taskData.value.words.map(word =>
            Array(word.word.length).fill("")
        );
        results.value = taskData.value.words.map(word =>
            Array(word.word.length).fill(null) // null - еще не проверено
        );
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
        missingLetters.value = [];
        missingLetters.value = [...currentWord.value.missingLetters];
        checkingStatus.value = false;

        if (Boolean(taskData.value.options.play_audio_at_the_begin)) {
            alert(1234)
            if (currentWord.value.audio_file) {
                stopAudio();
                playAudio(config.public.apiBase + '/media/' + currentWord.value.audio_file);
            }
        }

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

const checkWord = (letter, event) => {
    if (letter === currentWord.value.word[missingLetters.value[0] - 1].toLowerCase()) {
        missingLetters.value.shift();


        if (event) {
            event.target.classList.replace('btn-light', 'btn-success');
            setTimeout(() => {
                event.target.classList.remove('btn-success');
                event.target.classList.add('btn-inactive', 'disabled', 'text-hidden');
            }, 300);
        }
        else {
            const letterButtons = document.getElementsByClassName('letter-btn');

            for (let index = 0; index < letterButtons.length; index++) {
                const button = letterButtons[index];

                if (!button.classList.contains('disabled') && button.innerText === letter) {
                    button.classList.replace('btn-light', 'btn-success');
                    setTimeout(() => {
                        button.classList.remove('btn-success');
                        button.classList.add('btn-inactive', 'disabled', 'text-hidden');
                    }, 300);
                    break;
                }
            }
        }

        if (missingLetters.value.length === 0) {
            if (isStarted.value === true) {
                studiedWords.value.push(currentWord.value);
            }

            if (Boolean(taskData.value.options.play_audio_with_the_correct_answer)) {
                if (currentWord.value.audio_file) {
                    stopAudio();
                    playAudio(config.public.apiBase + '/media/' + currentWord.value.audio_file);
                }
            }

            isComplete.value = true;
            isStarted.value = false;

            if (reStudyWords.value.some((w) => w.task_word_id === currentWord.value.task_word_id)) {
                reStudyWords.value = reStudyWords.value.filter((w) => w.task_word_id !== currentWord.value.task_word_id);
            }

            setTimeout(() => {
                words.value.shift();
                setWord();
            }, 3000);
        }
    }
    else {
        if (event) {
            event.target.classList.remove('btn-light');
            event.target.classList.add('btn-danger', 'wobble');

            if (Boolean(taskData.value.options.play_error_sound_with_the_incorrect_answer)) {
                stopAudio();
                playErrorSound();
            }

            setTimeout(() => {
                event.target.classList.remove('btn-danger', 'wobble');
                event.target.classList.add('btn-light');
            }, 300);

            if (remainingAttempts.value >= 1) {
                --remainingAttempts.value;
            }
            else {
                isWrong.value = true;
                isStarted.value = false;
                moveToEnd();
            }
        }
    }
};

// Функция для генерации случайных букв
const generateRandomLetters = (count) => {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    return Array.from({ length: count }, () =>
        letters[Math.floor(Math.random() * letters.length)]
    );
};

// Подготовка букв для отображения
const displayedLetters = computed(() => {
    const correctLetters = currentWord.value.missingLetters.map(
        (index) => currentWord.value?.word[index - 1]
    );
    const randomLetters = generateRandomLetters(5); // 5 случайных букв
    const allLetters = [...correctLetters, ...randomLetters];

    // Перемешивание букв
    for (let i = allLetters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allLetters[i], allLetters[j]] = [allLetters[j], allLetters[i]];
    }

    return allLetters;
});

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

const debounceKeyboard = debounceHandler(() => toast(t("pages.training.keyboard.warning"), {
    toastClassName: ["custom-toast", "warning"],
    timeout: 5000,
}), 1000);

// Function to log key number and handle answer checking
const logKey = (event) => {
    if (isComplete.value === false && isStarted.value === true) {
        const regex = /^[a-zA-Z0-9]*$/;
        if (!regex.test(event.key) && event.key.length === 1) {
            event.preventDefault();
            debounceKeyboard();
        } else {
            checkWord(event.key.toLowerCase());
        }
    }
};

// Инициализация при монтировании
onMounted(() => {
    getTask();
    changeModalSize("modal-2xl");
    window.addEventListener('keydown', logKey);
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', logKey);
});
</script>