<template>
    <div v-if="taskData?.words" class="custom-grid">
        <div class="col-span-12">
            <p class="mb-0 text-corp font-medium">{{ props.task.task_name }}</p>
        </div>

        <!-- Вывод изображений -->
        <div class="col-span-12 lg:col-span-6">
            <div class="custom-grid">
                <div v-for="(picture, pictureIndex) in pictures" :key="pictureIndex"
                    class="col-span-4 lg:col-span-6 relative rounded-lg border-inactive overflow-hidden">
                    <div
                        class="absolute left-2 top-2 w-6 h-6 bg-success rounded-full flex items-center justify-center text-white text-lg">
                        {{ pictureIndex + 1 }}
                    </div>
                    <img class="w-full" :src="config.public.apiBase + '/media/' + picture.image_file" />
                </div>
            </div>
        </div>

        <!-- Вывод слов и полей для ввода -->
        <div class="col-span-12 lg:col-span-6">
            <div class="custom-grid">
                <div v-for="(word, wordIndex) in words" :key="wordIndex" class="col-span-12">
                    <div class="flex gap-3 items-center text-lg" :class="{
                        'text-success': results[wordIndex] === true,
                        'text-danger': results[wordIndex] === false,
                    }">
                        <div class="btn btn-square btn-sm flex justify-center items-center"
                            :class="results[wordIndex] === true ? 'btn-outline-success' : results[wordIndex] === false ? 'btn-outline-danger' : 'btn-light'">
                            <input v-model="userAnswers[wordIndex]" type="text"
                                :style="{ width: (words.length.toString().length + 0.5) + 'ch', textAlign: 'center' }"
                                :maxlength="words.length.toString().length" />
                        </div>

                        <div class="flex gap-x-2 items-center">
                            <audioButton v-if="word.audio_file && taskData.options.show_audio_button"
                                :src="config.public.apiBase + '/media/' + word.audio_file" />
                            <div class="flex flex-col">
                                <div class="flex flex-wrap gap-x-2">
                                    <span class="font-medium">{{ word.word }}</span>
                                    <span v-if="taskData.options.show_transcription" class="text-inactive">
                                        [{{ word.transcription }}]
                                    </span>
                                </div>

                                <span v-if="taskData.options.show_translate" class="text-inactive text-xs hidden lg:block">
                                    {{ word.word_translate }}
                                </span>
                            </div>
                        </div>
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
const words = ref([]);
const pictures = ref([]);

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
        const res = await $axiosPlugin.get("tasks/match_words_by_pictures/" + props.task.task_id);
        taskData.value = res.data;
        words.value = [...taskData.value.words]; // Поверхностная копия массива, чтобы избежать изменения исходного массива taskData.value.words
        pictures.value = [...taskData.value.pictures];

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
        const findWordIndex = words.value[index]; // Слово из перемешанного списка
        const originalIndex = taskData.value.pictures.findIndex(
            (word) => word.task_word_id === findWordIndex.task_word_id
        );
        const correctIndex = originalIndex + 1; // Номер изображения в оригинальном списке
        return parseInt(answer) === correctIndex;
    });
};

// Инициализация при монтировании
onMounted(() => {
    getTask();
    changeModalSize("modal-2xl");
});
</script>
