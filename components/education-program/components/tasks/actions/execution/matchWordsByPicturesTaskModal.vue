<template>
    <div v-if="taskData?.words" class="custom-grid">
        <div class="col-span-12">
            <p class="mb-0 text-corp font-medium">{{ props.task.task_name }}</p>
        </div>

        <!-- Вывод изображений -->
        <div class="col-span-12 lg:col-span-6">
            <div class="custom-grid">
                <div v-for="(word, wordIndex) in taskData.words" :key="wordIndex"
                    class="col-span-4 lg:col-span-4 relative rounded-lg border-inactive overflow-hidden">
                    <div
                        class="absolute left-2 top-2 w-6 h-6 bg-success rounded-full flex items-center justify-center text-white text-lg">
                        {{ wordIndex + 1 }}
                    </div>
                    <img class="w-full" :src="config.public.apiBase + '/media/' + word.image_file" />
                </div>
            </div>
        </div>

        <!-- Вывод слов и полей для ввода -->
        <div class="col-span-12 lg:col-span-6">
            <div class="custom-grid">
                <div v-for="(word, wordIndex) in shuffledWords" :key="wordIndex" class="col-span-12">
                    <div class="flex gap-3 items-center flex-wrap text-lg" :class="{
                        'text-success': results[wordIndex] === true,
                        'text-danger': results[wordIndex] === false,
                    }">
                        <div class="btn btn-square btn-sm flex justify-center items-center"
                            :class="results[wordIndex] === true ? 'btn-outline-success' : results[wordIndex] === false ? 'btn-outline-danger' : 'btn-light'">
                            <input v-model="userAnswers[wordIndex]" type="text"
                                style="width: 1.5ch; text-align: center;" maxlength="2" />
                        </div>
                        <audioButton v-if="word.audio_file && taskData.options.show_audio_button"
                            :src="config.public.apiBase + '/media/' + word.audio_file" />
                        <span class="font-medium">{{ word.word }}</span>
                        <span v-if="taskData.options.show_transcription" class="text-inactive">
                            <i>[{{ word.transcription }}]</i>
                        </span>
                        <span v-if="taskData.options.show_translate" class="text-inactive hidden lg:block">
                            <i>{{ word.word_translate }}</i>
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Кнопка проверки -->
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
const shuffledWords = ref([]);

// Состояние ответов и результатов
const userAnswers = ref([]);
const results = ref([]);

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
        const res = await $axiosPlugin.get("tasks/missing_letters/" + props.task.task_id);
        taskData.value = res.data;

        // Перемешивание слов
        shuffledWords.value = [...taskData.value.words].sort(() => Math.random() - 0.5);

        userAnswers.value = Array(taskData.value.words.length).fill(""); // Инициализация ответов
        results.value = Array(taskData.value.words.length).fill(null); // Инициализация результатов
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

// Проверка ответов
const checkWords = () => {
    results.value = userAnswers.value.map((answer, index) => {
        const shuffledWord = shuffledWords.value[index]; // Слово из перемешанного списка
        const originalIndex = taskData.value.words.findIndex(
            (word) => word.task_word_id === shuffledWord.task_word_id
        );
        const correctIndex = originalIndex + 1; // Номер изображения в оригинальном списке
        return parseInt(answer) === correctIndex;
    });
};

// Инициализация при монтировании
onMounted(() => {
    getTask();
    changeModalSize("modal-4xl");
});
</script>
