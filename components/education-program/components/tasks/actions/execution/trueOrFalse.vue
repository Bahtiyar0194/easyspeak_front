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
                    <div class="bg-inactive p-4 rounded-xl text-center" :class="isComplete && 'text-success'">

                        <p class="text-xl font-medium mb-1">{{
                            currentSentence?.sentence
                        }}</p>
                        <p class="mb-0">{{
                            currentSentence?.sentence_translate
                        }}</p>
                    </div>
                </div>

                <div v-if="isStarted" class="col-span-12">
                    <div class="custom-grid">
                        <div class="col-span-12">
                            <div class="btn-wrap lg items-center justify-center">
                                <button type="button" class="btn btn-light" @click="checkSentence(1)">{{ $t('true')
                                    }}</button>
                                <button type="button" class="btn btn-light" @click="checkSentence(0)">{{ $t('false')
                                    }}</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="timeIsUp || isWrong || isComplete" class="col-span-12">
                    <div class="flex justify-end">
                        <button class="btn btn-primary" @click="setSentence()">
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

const studiedSentences = ref([]);
const reStudySentences = ref([]);

const isStarted = ref(false);
const isComplete = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

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
            "tasks/true_or_false/" + props.task.task_id
        );
        showTaskTimer.value = true;
        taskData.value = res.data;
        time.value = taskData.value.options.seconds_per_sentence;
        sentences.value = [...taskData.value.sentences];

        sentences.value.forEach((sentence) => {
            sentence.attempts = taskData.value.options.max_attempts;
        });

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
        isComplete.value = false;
        isStarted.value = true;
        timeIsUp.value = false;
        isWrong.value = false;
    } else {
        isFinished.value = true;
    }
};

const checkSentence = (state) => {

    sentences.value.shift();

    if (currentSentence.value.is_true == state) {
        isComplete.value = true;
        isStarted.value = false;

        // if (Boolean(taskData.value.options.play_audio_with_the_correct_answer)) {
        //     if (currentSentence.value.audio_file) {
        //         playSuccessSound(config.public.apiBase + '/media/' + currentSentence.value.audio_file)
        //     }
        // }

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
    }
    else {
        // if (Boolean(taskData.value.options.play_error_sound_with_the_incorrect_answer)) {
        //     playErrorSound();
        // }

        isWrong.value = true;
        isStarted.value = false;

        if (currentSentence.value.attempts >= 1) {
            currentSentence.value.attempts--;
            sentences.value.push(currentSentence.value);
        }
        else {
            reStudySentences.value.push(currentSentence.value);
        }
    }
}

const timerIsUp = () => {
    timeIsUp.value = true;
    isStarted.value = false;
    checkSentence()
};

// Инициализация при монтировании
onMounted(() => {
    getTask();
    changeModalSize("modal-xl");
});
</script>