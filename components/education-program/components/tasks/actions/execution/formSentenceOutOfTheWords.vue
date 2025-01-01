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
                </div>

                <div class="col-span-12">
                    <p v-if="timeIsUp" class="font-medium text-center text-danger">
                        {{ $t("time_is_up") }}
                    </p>
                    <p v-else-if="isComplete" class="font-medium text-center text-success">
                        {{ $t("right") }}
                    </p>
                    <p v-else-if="isWrong" class="font-medium text-center text-danger">
                        {{ $t("wrong") }}
                    </p>
                    <p v-else-if="sentencesLeft > 0" class="text-center">
                        {{ $t("pages.sentences.sentences_left") }}:
                        <b>{{ sentencesLeft }}</b>
                    </p>
                </div>

                <div class="col-span-12">
                    <div class="flex justify-center items-center">
                        <countdownCircleTimer :totalSeconds="time" :startCommand="isStarted" :isWrong="isWrong"
                            @timeIsUp="timerIsUp()" />
                    </div>
                </div>

                <div class="col-span-12">
                    <div class="bg-inactive p-4 rounded-xl font-medium text-center w-fit mx-auto"
                        :class="isComplete && 'text-success'">
                        {{
                            taskData?.options.in_the_main_lang
                                ? currentSentence?.sentence_translate
                                : currentSentence?.sentence
                        }}
                    </div>
                </div>

                <div v-if="timeIsUp || isWrong" class="col-span-12">
                    <div class="bg-inactive p-6 rounded-xl text-center">
                        <p class="text-inactive mb-2">{{ $t("right_answer") }}</p>
                        <p class="text-2xl mb-0 font-medium">
                            {{
                                taskData?.options.in_the_main_lang
                                    ? currentSentence?.sentence
                                    : currentSentence?.sentence_translate
                            }}
                        </p>
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
                                        scale: 0,
                                    },
                                    enter: {
                                        scale: 1,
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
                                            enter: {
                                                opacity: 1,
                                                scale: 1,
                                                transition: {
                                                    delay: wordIndex * 50,
                                                    type: 'spring',
                                                    stiffness: 500,
                                                    damping: 20,
                                                },
                                            },
                                        }" @click="checkSentence(word, wordIndex)" class="btn" :class="successButtonsIndex.includes(wordIndex)
                                            ? 'disabled text-hidden btn-outline-success'
                                            : errorButtonsIndex.includes(wordIndex)
                                                ? 'btn-danger wobble'
                                                : 'btn-light'
                                            ">
                                        {{ word }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="timeIsUp || isWrong" class="col-span-12">
                    <div class="flex justify-center">
                        <button class="btn btn-primary btn-lg" @click="setSentence()">
                            <i class="pi pi-arrow-right"></i> {{ $t("continue") }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <result v-else :studiedSentences="studiedSentences" :reStudySentences="reStudySentences" />
    </div>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { useRouter } from "nuxt/app";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import countdownTaskTimer from "../../../../../ui/countdownTaskTimer.vue";
import progressBar from "../../../../../ui/progressBar.vue";
import { playSuccessSound, playErrorSound } from '../../../../../../utils/playAudio';
import result from "../../results/sentences/result.vue";

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();

const showTaskTimer = ref(false);
const taskData = ref(null);
const sentences = ref([]);
const currentSentence = ref(null);
const cleanedSentence = ref(null);
const cleanedSentenceWords = ref([]);
const assembledWordsCount = ref(0);
const originalSentence = ref(null);
const successButtonsIndex = ref([]);
const errorButtonsIndex = ref([]);

const studiedSentences = ref([]);
const reStudySentences = ref([]);

const displayedSentence = ref([]);
const isStarted = ref(false);
const isComplete = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

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
        const res = await $axiosPlugin.get(
            "tasks/form_a_sentence_out_of_the_words/" + props.task.task_id
        );
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
        cleanedSentence.value = taskData.value.options.in_the_main_lang
            ? currentSentence.value.sentence
                .toLowerCase()
                .replace(/[{}|<>.,:;""!?\/]/g, "")
                .replace(/\s+/g, " ")
            : currentSentence.value.sentence_translate
                .toLowerCase()
                .replace(/[{}|<>.,:;""!?\/]/g, "")
                .replace(/\s+/g, " ");

        cleanedSentenceWords.value = cleanedSentence.value
            .split(" ")
            .sort(() => Math.random() - 0.5);

        assembledWordsCount.value = 0;

        originalSentence.value = taskData.value.options.in_the_main_lang
            ? currentSentence.value.sentence.split(" ")
            : currentSentence.value.sentence_translate.split(" ");
        displayedSentence.value = [];
        isComplete.value = false;
        isStarted.value = true;
        timeIsUp.value = false;
        isWrong.value = false;
        remainingAttempts.value = taskData.value.options.max_attempts;

        successButtonsIndex.value = [];
        errorButtonsIndex.value = [];
    } else {
        isFinished.value = true;
    }
};

const checkSentence = (word, wordIndex) => {

    if (word === cleanedSentence.value.split(" ")[assembledWordsCount.value]) {

        if (cleanedSentence.value.length > assembledWordsCount.value) {
            assembledWordsCount.value++;
        }

        successButtonsIndex.value.push(wordIndex);

        displayedSentence.value.push(
            originalSentence.value[assembledWordsCount.value - 1]
        );

        if (assembledWordsCount.value === cleanedSentence.value.split(" ").length) {
            isComplete.value = true;
            isStarted.value = false;

            if (Boolean(taskData.value.options.play_audio_with_the_correct_answer)) {
                if (currentSentence.value.audio_file) {
                    playSuccessSound(config.public.apiBase + '/media/' + currentSentence.value.audio_file)
                }
            }

            studiedSentences.value.push(currentSentence.value);

            if (
                reStudySentences.value.some(
                    (s) => s.task_sentence_id === currentSentence.value.task_sentence_id
                )
            ) {
                reStudySentences.value = reStudySentences.value.filter(
                    (s) => s.task_sentence_id !== currentSentence.value.task_sentence_id
                );
            }

            sentences.value.shift();

            setTimeout(() => {
                setSentence();
            }, 3000);
        }
    } else {
        errorButtonsIndex.value.push(wordIndex);

        if (Boolean(taskData.value.options.play_error_sound_with_the_incorrect_answer)) {
            playErrorSound();
        }

        setTimeout(() => {
            errorButtonsIndex.value = [];
        }, 1000);

        if (remainingAttempts.value >= 1) {
            --remainingAttempts.value;
        } else {
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
};

const moveToEnd = () => {
    if (
        reStudySentences.value.some(
            (s) => s.task_sentence_id === currentSentence.value.task_sentence_id
        )
    ) {
        sentences.value.shift();
    } else {
        // Перемещение первого элемента в конец
        const firstElement = sentences.value.shift(); // Удаляем первый элемент
        sentences.value.push(firstElement); // Добавляем его в конец
        reStudySentences.value.push(currentSentence.value);
    }
};

// Инициализация при монтировании
onMounted(() => {
    getTask();
    changeModalSize("modal-xl");
});
</script>