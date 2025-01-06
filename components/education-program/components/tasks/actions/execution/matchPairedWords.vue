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
                    <p v-else-if="sections.length > 0" class="text-center">
                        {{ $t("pages.sections.sections_left") }}:
                        <b>{{ sections.length }}</b>
                    </p>
                </div>

                <div class="col-span-12">
                    <div class="flex justify-center items-center">
                        <countdownCircleTimer :totalSeconds="time" :startCommand="isStarted" @timeIsUp="timerIsUp()" />
                    </div>
                </div>

                <div v-if="timeIsUp || isComplete" class="col-span-12">
                    <div class="flex flex-col gap-y-4">
                        <div class="flex flex-col gap-y-2" v-if="currentStudiedSections.length > 0">
                            <p class="text-xl font-medium mb-0 text-success">
                                {{ currentReStudySections.length > 0 ? $t("right_answers") : $t("right") }}
                            </p>

                            <ul class="list-group nowrap">
                                <li v-for="(section, sIndex) in currentStudiedSections" :key="sIndex"
                                    class="flex justify-between items-center gap-x-2">
                                    <div class="btn-wrap items-center">
                                        <div :class="section.words[0].target === 1 && 'text-success'">
                                            <div class="flex flex-col">
                                                <b class="mb-0">{{ section.words[0].word }}</b>
                                                <span class="text-xs">{{ section.words[0].word_translate }}</span>
                                            </div>
                                        </div>
                                        <span>-</span>
                                        <div :class="section.words[1].target === 1 && 'text-success'">
                                            <div class="flex flex-col">
                                                <b class="mb-0">{{ section.words[1].word }}</b>
                                                <span class="text-xs">{{ section.words[1].word_translate }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="step-item xs completed">
                                        <div class="step-icon">
                                            <i class="pi pi-check"></i>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div class="flex flex-col gap-y-2" v-if="currentReStudySections.length > 0">
                            <p class="text-xl font-medium mb-0 text-danger">
                                {{ $t("for_re_examination") }}
                            </p>

                            <ul class="list-group nowrap">
                                <li v-for="(section, rIndex) in currentReStudySections" :key="rIndex"
                                    class="flex justify-between items-center gap-x-2">

                                    <div class="flex flex-wrap gap-4">
                                        <div>
                                            <p class="mb-1 text-inactive font-normal text-xs">
                                                {{ $t('your_answer') }}:
                                            </p>
                                            <div class="btn-wrap items-center">
                                                <div :class="section.words[0].target === 1 && 'text-danger'">
                                                    <div class="flex flex-col">
                                                        <b class="mb-0">{{ section.words[0].target === 1 ?
                                                            (section.words[0].userInput === "" ? "________" :
                                                                section.words[0].userInput) : section.words[0].word }}</b>
                                                        <span class="text-xs">{{ section.words[0].userInput === "" ?
                                                            "________" : (section.words[0].target === 1 ?
                                                                section.words[0].userInputTranslate :
                                                                section.words[0].word_translate) }}</span>
                                                    </div>
                                                </div>
                                                <span>-</span>
                                                <div :class="section.words[1].target === 1 && 'text-danger'">
                                                    <div class="flex flex-col">
                                                        <b class="mb-0">{{ section.words[1].target === 1 ?
                                                            (section.words[1].userInput === "" ? "________" :
                                                                section.words[1].userInput) : section.words[1].word }}</b>
                                                        <span class="text-xs">{{ section.words[1].userInput === "" ?
                                                            "________" : (section.words[1].target === 1 ?
                                                                section.words[1].userInputTranslate :
                                                                section.words[1].word_translate) }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <p class="mb-1 text-inactive font-normal text-xs">
                                                {{ $t('right_answer') }}:
                                            </p>
                                            <div class="btn-wrap items-center">
                                                <div :class="section.words[0].target === 1 && 'text-success'">
                                                    <div class="flex flex-col">
                                                        <b class="mb-0">{{ section.words[0].word }}</b>
                                                        <span class="text-xs">{{ section.words[0].word_translate
                                                            }}</span>
                                                    </div>
                                                </div>
                                                <span>-</span>
                                                <div :class="section.words[1].target === 1 && 'text-success'">
                                                    <div class="flex flex-col">
                                                        <b class="mb-0">{{ section.words[1].word }}</b>
                                                        <span class="text-xs">{{ section.words[1].word_translate
                                                            }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="step-item xs failed">
                                        <div class="step-icon">
                                            <i class="pi pi-replay"></i>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div class="btn-wrap right">
                            <button v-if="sections.length > 0" class="btn btn-outline-primary" @click="setSections()">
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
                        <div class="col-span-12 border-b-inactive">
                            <div class="btn-wrap justify-center items-center mb-4">
                                <button :draggable="taskData?.options?.match_by_drag_and_drop == 1"
                                    v-for="(word, wordIndex) in hiddenWords" :key="wordIndex" class="btn btn-light"
                                    :class="{
                                        disabled: word.disabled,
                                        dragging: isDragging,
                                        draggable: taskData?.options?.match_by_drag_and_drop == 1,
                                        'pointer-events-none': (taskData?.options?.match_by_drag_and_drop != 1 && taskData?.options?.match_by_clicking != 1)
                                    }" type="button" @dragstart="onDragStart($event, wordIndex)"
                                    @touchstart="onTouchStart($event, wordIndex)" @touchmove="onTouchMove"
                                    @touchend="onTouchEnd" @click="insertWord(word)">{{
                                        word.word }}</button>
                            </div>
                        </div>
                        <div v-for="(section, sectionIndex) in currentSections" :key="sectionIndex" class="col-span-12">
                            <div class="btn-wrap justify-center gap-2 font-medium">
                                <div v-for="(word, wordIndex) in section.words" :key="wordIndex">

                                    <div v-if="word.target == 1" class="btn flex justify-center items-center"
                                        :class="unFilledSections.includes(sectionIndex) ? 'pulse btn-danger' : 'btn-active'"
                                        @drop="onDrop($event, sectionIndex, wordIndex)" @dragover="onDragOver">
                                        <input v-model="word.userInput" :disabled="taskData?.options?.match_by_typing != 1"
                                            :style="{ 'width': (word.userInput !== '' && (word.userInput.length > word.word.length) ? (word.userInput.length + 'ch') : (word.word.length + 'ch')), 'text-align': 'center' }"
                                            @input="handleInput($event)" type="text" />
                                        <button v-if="word.userInput !== ''"
                                            @click="clearInput(sectionIndex, wordIndex)"
                                            class="text-danger ml-0.5 mt-0.5"><i class="pi pi-delete-left"></i></button>
                                    </div>

                                    <div v-else class="btn btn-active">{{
                                        word.word
                                    }}</div>
                                </div>
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
                <div class="flex flex-col gap-y-2" v-if="studiedSections.length > 0">
                    <p class="text-xl font-medium mb-0 text-success">
                        {{ $t("pages.sections.studied_sections") }}
                    </p>

                    <ul class="list-group nowrap">
                        <li v-for="(section, sIndex) in studiedSections" :key="sIndex"
                            class="flex justify-between items-center gap-x-2">
                            <div class="btn-wrap items-center">
                                <div :class="section.words[0].target === 1 && 'text-success'">
                                    <div class="flex flex-col">
                                        <b class="mb-0">{{ section.words[0].word }}</b>
                                        <span class="text-xs">{{ section.words[0].word_translate }}</span>
                                    </div>
                                </div>
                                <span>-</span>
                                <div :class="section.words[1].target === 1 && 'text-success'">
                                    <div class="flex flex-col">
                                        <b class="mb-0">{{ section.words[1].word }}</b>
                                        <span class="text-xs">{{ section.words[1].word_translate }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="step-item xs completed">
                                <div class="step-icon">
                                    <i class="pi pi-check"></i>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>

                <div class="flex flex-col gap-y-2" v-if="reStudySections.length > 0">
                    <p class="text-xl font-medium mb-0 text-danger">
                        {{ $t("pages.sections.unstudied_sections") }}
                    </p>

                    <ul class="list-group nowrap">
                        <li v-for="(section, rIndex) in reStudySections" :key="rIndex"
                            class="flex justify-between items-center gap-x-2">
                            <div class="btn-wrap items-center">
                                <div :class="section.words[0].target === 1 && 'text-danger'">
                                    <div class="flex flex-col">
                                        <b class="mb-0">{{ section.words[0].word }}</b>
                                        <span class="text-xs">{{ section.words[0].word_translate }}</span>
                                    </div>
                                </div>
                                <span>-</span>
                                <div :class="section.words[1].target === 1 && 'text-danger'">
                                    <div class="flex flex-col">
                                        <b class="mb-0">{{ section.words[1].word }}</b>
                                        <span class="text-xs">{{ section.words[1].word_translate }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="step-item xs failed">
                                <div class="step-icon">
                                    <i class="pi pi-replay"></i>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { useRouter } from "nuxt/app";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import countdownTaskTimer from "../../../../../ui/countdownTaskTimer.vue";
import progressBar from "../../../../../ui/progressBar.vue";
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();

const showTaskTimer = ref(false);
const taskData = ref(null);
const sections = ref([]);
const currentSections = ref([]);
const hiddenWords = ref([]);
const checkingStatus = ref(false);

const isDragging = ref(false);
const touchData = ref({ word: "", target: null });

const studiedSections = ref([]);
const currentStudiedSections = ref([]);

const reStudySections = ref([]);
const currentReStudySections = ref([]);

const unFilledSections = ref([]);

const isStarted = ref(false);
const isComplete = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

const isFinished = ref(false);

const progressPercentage = computed(() => {
    const totalSections = taskData.value?.word_sections?.length || 0; // Предотвращаем ошибки, если данные ещё не загружены
    if (totalSections === 0) return 0; // Если общее количество предложении равно 0, возвращаем 0
    const completedSections = totalSections - sections.value.length;
    return (completedSections / totalSections) * 100;
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
            "tasks/match_paired_words/" + props.task.task_id
        );
        showTaskTimer.value = true;
        taskData.value = res.data;
        sections.value = [...taskData.value.word_sections];

        sections.value.forEach((section) => {
            section.attempts = taskData.value.options.max_attempts;
        });

        setTimeout(() => {
            setSections();
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

const setSections = () => {
    currentStudiedSections.value = [];
    currentReStudySections.value = [];
    hiddenWords.value = [];

    if (sections.value.length > 0) {
        currentSections.value = sections.value.slice(0, taskData.value.options.impression_limit);

        currentSections.value.forEach((section) => {
            section.words.forEach((word) => {
                if (word.target == 1) {
                    word.userInput = "";
                    word.disabled = false;
                    word.userInputTranslate = "";
                    hiddenWords.value.push(word);
                }
            });
        });

        hiddenWords.value = [...hiddenWords.value].sort(() => Math.random() - 0.5);

        time.value = (taskData.value.options.seconds_per_word * currentSections.value.length);

        isComplete.value = false;
        isStarted.value = true;
        timeIsUp.value = false;
        checkingStatus.value = false;
    }
}

const onDragStart = (event, wordIndex) => {
    // Установить данные для перетаскивания
    event.dataTransfer.setData("wordIndex", wordIndex);
};

const onDrop = (event, sectionIndex, wordIndex) => {
    // Остановить поведение по умолчанию
    event.preventDefault();

    // Получить данные из события
    const wIndex = event.dataTransfer.getData("wordIndex");

    const word = hiddenWords.value[wIndex];
    word.disabled = true;

    currentSections.value[sectionIndex].words[wordIndex].userInput = word.word;
    currentSections.value[sectionIndex].words[wordIndex].userInputTranslate = word.word_translate;
};

const onDragOver = (event) => {
    // Остановить поведение по умолчанию, чтобы разрешить drop
    event.preventDefault();
};

const onTouchStart = (event, wordIndex) => {
    touchData.value.word = wordIndex;
    touchData.value.target = event.target;
    isDragging.value = true;
};

const onTouchMove = (event) => {
    event.preventDefault(); // Предотвращаем скролл
    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element && element.tagName === "INPUT") {
        touchData.value.target = element;
    }
};

const onTouchEnd = () => {
    if (touchData.value.target && touchData.value.target.tagName === "INPUT") {
        touchData.value.target.value = touchData.value.word;
    }
    isDragging.value = false;
    touchData.value.word = "";
    touchData.value.target = null;
};

const enableTheHiddenWord = (w) => {
    hiddenWords.value.forEach((word) => {
        if (w === word.word) {
            word.disabled = false;
        }
    });
}

const disableTheHiddenWord = (w) => {
    hiddenWords.value.forEach((word) => {
        if (w === word.word) {
            word.disabled = true;
        }
    });
}

const handleInput = (e) => {
    disableTheHiddenWord(e.target.value);
};

const insertWord = (w) => {
    if (taskData.value.options.match_by_clicking == 1) {
        let emptyWordFind = false;
        currentSections.value.forEach((section) => {
            section.words.forEach((word) => {
                if (word.userInput === "" && !emptyWordFind) {
                    word.userInput = w.word;
                    word.userInputTranslate = w.word_translate;
                    disableTheHiddenWord(w.word);
                    emptyWordFind = true;
                }
            });
        });
    }
}

const clearInput = (sectionIndex, wordIndex) => {
    enableTheHiddenWord(currentSections.value[sectionIndex].words[wordIndex].userInput);
    currentSections.value[sectionIndex].words[wordIndex].userInput = "";
}

const checkSections = () => {
    currentSections.value.forEach((section) => {
        sections.value = sections.value.filter((ws) => ws.word_section_id !== section.word_section_id);

        section.words.forEach((word) => {
            if (word.target == 1) {
                if (word.userInput.toLowerCase() === word.word.toLowerCase()) {
                    studiedSections.value.push(section);
                    currentStudiedSections.value.push(section);

                    if (reStudySections.value.some((ws) => ws.word_section_id === section.word_section_id)) {
                        reStudySections.value = reStudySections.value.filter((ws) => ws.word_section_id !== section.word_section_id);
                    }
                }
                else {
                    currentReStudySections.value.push(section);

                    if (section.attempts >= 1) {
                        sections.value.push(section);
                        const removeSectionAttempt = sections.value.find((ws) => ws.word_section_id === section.word_section_id);
                        removeSectionAttempt.attempts--;
                    }
                    else {
                        reStudySections.value.push(section);
                    }
                }
            }
        });
    });
}

const acceptAnswers = () => {
    checkingStatus.value = true;
    currentSections.value.forEach((section, sectionIndex) => {
        section.words.forEach((word) => {
            if (word.userInput === "") {
                unFilledSections.value.push(sectionIndex);
            }
        });
    });

    if (unFilledSections.value.length > 0) {
        setTimeout(() => {
            unFilledSections.value = [];
            checkingStatus.value = false;
        }, 1000);
    }
    else {
        isComplete.value = true;
        isStarted.value = false;
        checkSections();
    }
}

const timerIsUp = () => {
    timeIsUp.value = true;
    isStarted.value = false;
    checkSections();
};

// Инициализация при монтировании
onMounted(() => {
    getTask();
    changeModalSize("modal-lg");
});
</script>