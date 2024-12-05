<template>
    <div v-if="taskData?.words" class="custom-grid">
        <div class="col-span-12">
            <p class="mb-0 text-corp font-medium">{{ props.task.task_name }}</p>
        </div>

        <div v-for="(word, wordIndex) in taskData.words" :key="wordIndex" class="col-span-12">
            <div class="flex gap-3 items-center flex-wrap">
                <audioButton v-if="word.audio_file && taskData.options.show_audio_button"
                    :src="config.public.apiBase + '/media/' + word.audio_file" />
                <div v-if="word.image_file && taskData.options.show_image" :style="{
                    backgroundImage: 'url(' + config.public.apiBase + '/media/' + word.image_file + ')',
                }" class="h-9 w-9 bg-cover bg-no-repeat bg-center rounded-lg border-inactive"></div>
                <div class="flex gap-x-0.5">
                    <div v-for="(letter, letterIndex) in word.word" :key="letterIndex" class="font-medium">
                        <div v-if="letter === ' ' || letter === ''" class="mx-1"></div>
                        <div v-else-if="word.missingLetters.includes(letterIndex + 1)"
                            class="btn btn-square btn-sm flex justify-center items-center" :class="results[wordIndex]?.[letterIndex] === 'correct' ? 'btn-outline-success' :
                                results[wordIndex]?.[letterIndex] === 'incorrect' ? 'btn-outline-danger' :
                                    'btn-outline-primary'">
                            <input v-model="missingLetterInputs[wordIndex][letterIndex]" type="text"
                                style="width: 1.5ch; text-align: center;" maxlength="1" @focus="clearIncorrect(wordIndex, letterIndex)" />
                        </div>

                        <div class="btn btn-square btn-sm pointer-events-none btn-light" v-else>
                            {{ letter }}
                        </div>
                    </div>
                </div>
                <span v-if="taskData.options.show_transcription" class="text-inactive">
                    <i>[{{ word.transcription }}]</i>
                </span>
                <span v-if="taskData.options.show_translate" class="text-inactive">
                    <i>{{ word.word_translate }}</i>
                </span>
            </div>
        </div>
        <div class="col-span-12">
            <button class="btn btn-primary" @click="checkWords">{{ $t('check') }}</button>
        </div>
    </div>
</template>


<script setup>
import { ref, onMounted, inject } from "vue";
import { useRouter } from "nuxt/app";
import audioButton from "../../../../../ui/audioButton.vue";

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();

const taskData = ref(null);
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
        const res = await $axiosPlugin.get("tasks/missing_letters/" + props.task.task_id);
        taskData.value = res.data;

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

// Проверка всех слов
const checkWords = () => {
    taskData.value.words.forEach((word, wordIndex) => {
        const missingLetters = word.missingLetters;

        word.word.split("").forEach((letter, letterIndex) => {
            if (missingLetters.includes(letterIndex + 1)) {
                const userInput = missingLetterInputs.value[wordIndex][letterIndex];

                if (userInput === "") {
                    results.value[wordIndex][letterIndex] = "incorrect"; // Поле пустое
                } else if (userInput.toLowerCase() === letter.toLowerCase()) {
                    results.value[wordIndex][letterIndex] = "correct"; // Буква правильная
                } else {
                    results.value[wordIndex][letterIndex] = "incorrect"; // Буква неверная
                }
            }
        });
    });
};

// Очистка поля при фокусе, если оно "incorrect"
const clearIncorrect = (wordIndex, letterIndex) => {
    if (results.value[wordIndex]?.[letterIndex] === "incorrect") {
        missingLetterInputs.value[wordIndex][letterIndex] = ""; // Очищаем поле
        results.value[wordIndex][letterIndex] = null; // Сбрасываем статус
    }
};

// Инициализация при монтировании
onMounted(() => {
    getTask();
    changeModalSize("modal-xl");
});
</script>
