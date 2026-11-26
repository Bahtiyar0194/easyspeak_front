<template>
  <alert v-if="errors.length > 0" :className="'light'">
    <p class="mb-0">{{ errors[0] }}</p>
  </alert>
  <div v-else-if="taskData && errors.length === 0">
    <taskLayout
      v-if="taskData"
      :task="props.task"
      :lessonType="props.lessonType"
      :showTaskTimer="showTaskTimer"
      :showMaterialsOption="showMaterialsOption"
      :showMaterialsBeforeTask="showMaterialsBeforeTask"
      :materials="materials"
      :startTask="startTask"
      :isFinished="isFinished"
      :progressPercentage="progressPercentage"
      :reStudyItems="reStudyWords"
      :taskResult="taskResult"
    >
      <template v-slot:task_content>
        <!-- Статус: сколько осталось + таймер -->
        <div class="col-span-12">
          <div class="task-status-bar">
            <p v-if="timeIsUp" class="mb-0 font-semibold text-danger flex items-center gap-1.5">
              <i class="pi pi-clock" aria-hidden="true"></i>
              {{ $t("time_is_up") }}
            </p>
            <p v-else-if="words.length > 0" class="mb-0 text-inactive">
              {{ $t("pages.dictionary.words_left") }}:
              <b class="text-active">{{ words.length }}</b>
            </p>
            <span v-else></span>
            <countdownCircleTimer
              :totalSeconds="time"
              :startCommand="isStarted"
              @timeIsUp="timerIsUp()"
            />
          </div>
        </div>

        <!-- Разбор после проверки -->
        <div v-if="timeIsUp || isComplete" class="col-span-12">
          <div class="flex flex-col gap-5">
            <section v-if="currentStudiedWords.length > 0" class="result-section">
              <p class="result-head ok">
                <span class="result-head-dot" aria-hidden="true"></span>
                {{ currentReStudyWords.length > 0 ? $t("right_answers") : $t("right") }}
                <span class="result-head-count">{{ currentStudiedWords.length }}</span>
              </p>

              <ul class="result-list" ref="rightAnswers">
                <li
                  v-for="(word, sIndex) in currentStudiedWords"
                  :key="sIndex"
                  class="result-item ok"
                >
                  <div class="flex-1 min-w-0 flex flex-col">
                    <!-- Содержимое этого блока сохраняется как HTML ответа -->
                    <div :id="'right_answer_' + word.task_word_id">
                      <div class="text-xl font-medium">
                        <span
                          v-for="(syllable, syllableIndex) in word.syllables"
                          :key="syllableIndex"
                          :class="syllable.target == true && 'text-success underline'"
                        >
                          {{ syllable.syllable }}
                        </span>
                      </div>
                    </div>
                    <span class="text-sm text-inactive">{{ word.word_translate }}</span>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <audioButtonMini
                      v-if="word.audio_file && taskData?.options?.show_audio_button"
                      :src="config.public.apiBase + '/media/get/' + word.audio_file"
                    />
                    <span class="result-status ok" aria-hidden="true">
                      <i class="pi pi-check"></i>
                    </span>
                  </div>
                </li>
              </ul>
            </section>

            <section v-if="currentReStudyWords.length > 0" class="result-section">
              <p class="result-head bad">
                <span class="result-head-dot" aria-hidden="true"></span>
                {{ $t("for_re_examination") }}
                <span class="result-head-count">{{ currentReStudyWords.length }}</span>
              </p>

              <ul class="result-list" ref="wrongAnswers">
                <li
                  v-for="(word, rIndex) in currentReStudyWords"
                  :key="rIndex"
                  class="result-item bad"
                >
                  <div class="flex-1 min-w-0 flex flex-col gap-1">
                    <div class="flex flex-wrap gap-x-6 gap-y-2">
                      <div>
                        <p class="result-label">{{ $t("your_answer") }}</p>
                        <!-- Содержимое этого блока сохраняется как HTML ответа -->
                        <div :id="'user_answer_' + word.task_word_id">
                          <div class="text-xl font-medium">
                            <span
                              v-for="(syllable, syllableIndex) in word.syllables"
                              :key="syllableIndex"
                              :class="word.userInput === syllableIndex && 'text-danger underline'"
                            >
                              {{ syllable.syllable }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p class="result-label">{{ $t("right_answer") }}</p>
                        <!-- Содержимое этого блока сохраняется как HTML ответа -->
                        <div :id="'right_answer_' + word.task_word_id">
                          <div class="text-xl font-medium">
                            <span
                              v-for="(syllable, syllableIndex) in word.syllables"
                              :key="syllableIndex"
                              :class="syllable.target == true && 'text-success underline'"
                            >
                              {{ syllable.syllable }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span class="text-sm text-inactive">{{ word.word_translate }}</span>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <audioButtonMini
                      v-if="word.audio_file && taskData?.options?.show_audio_button"
                      :src="config.public.apiBase + '/media/get/' + word.audio_file"
                    />
                    <span class="result-status bad" aria-hidden="true">
                      <i class="pi pi-replay"></i>
                    </span>
                  </div>
                </li>
              </ul>
            </section>

            <div class="task-actions">
              <button
                type="button"
                v-if="words.length > 0"
                class="btn btn-primary"
                @click="setWords()"
              >
                {{ $t("continue") }}
                <i class="pi pi-arrow-right" aria-hidden="true"></i>
              </button>
              <button type="button" v-else class="btn btn-success" @click="isFinished = true">
                <i class="pi pi-check" aria-hidden="true"></i>
                {{ $t("pages.tasks.complete_the_task") }}
              </button>
            </div>
          </div>
        </div>

        <!-- Выполнение -->
        <div v-else class="col-span-12">
          <div class="flex flex-col gap-3">
            <p class="mb-0 text-sm text-inactive flex items-center gap-1.5">
              <i class="pi pi-info-circle" aria-hidden="true"></i>
              {{ $t("pages.tasks.stress_hint") }}
            </p>

            <div
              v-for="(word, wordIndex) in currentWords"
              :key="wordIndex"
              class="blank-card items-center"
              :class="{ shake: checkingStatus === true && word.userInput === '' }"
            >
              <audioButton
                v-if="word.audio_file && taskData?.options?.show_audio_button"
                :src="config.public.apiBase + '/media/get/' + word.audio_file"
              />
              <div class="flex-1 min-w-0 flex flex-col gap-2">
                <div class="syllables" role="radiogroup">
                  <button
                    v-for="(syllable, syllableIndex) in word.syllables"
                    :key="syllableIndex"
                    type="button"
                    role="radio"
                    :aria-checked="word.userInput !== '' && word.userInput === syllableIndex"
                    class="syllable"
                    :class="{
                      picked: word.userInput !== '' && word.userInput === syllableIndex,
                      error: checkingStatus === true && word.userInput === '',
                    }"
                    @click="selectSyllable(syllableIndex, wordIndex)"
                  >
                    {{ syllable.syllable }}
                  </button>
                </div>
                <div
                  v-if="taskData?.options?.show_transcription || taskData?.options?.show_translate"
                  class="flex flex-wrap gap-x-3 text-sm text-inactive"
                >
                  <span v-if="taskData?.options?.show_transcription">[{{ word.transcription }}]</span>
                  <span v-if="taskData?.options?.show_translate">{{ word.word_translate }}</span>
                </div>
              </div>
            </div>

            <div class="task-actions">
              <button
                type="button"
                class="btn btn-primary"
                :disabled="checkingStatus"
                @click="acceptAnswers()"
              >
                <i class="pi pi-check" aria-hidden="true"></i>
                {{ $t("check") }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <template v-slot:task_result_content>
        <result :studiedWords="studiedWords" :reStudyWords="reStudyWords" />
      </template>
    </taskLayout>
  </div>
</template>

<script setup>
import alert from "../../../../../ui/alert.vue";
import { ref, onMounted, inject } from "vue";
import { useRouter } from "nuxt/app";
import taskLayout from "../../taskLayout.vue";
import audioButton from "../../../../../ui/audioButton.vue";
import audioButtonMini from "../../../../../ui/audioButtonMini.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import result from "../../results/dictionary/result.vue";

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();
const errors = ref([]);

const showTaskTimer = ref(false);
const taskData = ref(null);
const materials = ref([]);
const showMaterialsOption = ref("");
const showMaterialsBeforeTask = ref(false);
const words = ref([]);
const currentWords = ref([]);
const checkingStatus = ref(false);

const studiedWords = ref([]);
const currentStudiedWords = ref([]);

const reStudyWords = ref([]);
const currentReStudyWords = ref([]);

const rightAnswers = ref(null);
const wrongAnswers = ref(null);
const taskResult = ref([]);
const taskResultCollection = ref([]);

const isStarted = ref(false);
const isComplete = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

const isFinished = ref(false);

const progressPercentage = computed(() => {
  const totalWords = taskData.value?.words?.length || 0; // Предотвращаем ошибки, если данные ещё не загружены
  if (totalWords === 0) return 0; // Если общее количество слов равно 0, возвращаем 0
  const completedWords = totalWords - words.value.length;
  return (completedWords / totalWords) * 100;
});

// Получаем данные задачи из пропсов
const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
  lessonType: {
    type: String,
    required: true,
  },
});

const onPending = inject("onPending");
const onStartTask = inject("onStartTask");
const onCompleteTask = inject("onCompleteTask");
const changeModalSize = inject("changeModalSize");

// Получение задачи
const getTask = async () => {
  try {
    onPending(true);
    const res = await $axiosPlugin.get(
      "tasks/get/find_the_stressed_syllable/" + props.task.task_id
    );

    taskData.value = res.data;
    onStartTask();
    showMaterialsOption.value = taskData.value.options.show_materials_option;
    materials.value = taskData.value.materials;
    words.value = [...taskData.value.words];

    words.value.forEach((word) => {
      word.attempts = taskData.value.options.max_attempts;
    });

    if (
      materials.value.length > 0 &&
      (showMaterialsOption.value == "before_starting_a_task" ||
        showMaterialsOption.value == "use_both")
    ) {
      showMaterialsBeforeTask.value = true;
    } else {
      startTask();
    }
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

const startTask = () => {
  showMaterialsBeforeTask.value = false;

  if (
    materials.value.length > 0 &&
    (showMaterialsOption.value == "during_a_task" ||
      showMaterialsOption.value == "use_both")
  ) {
    changeModalSize("modal-6xl");
  }

  showTaskTimer.value = true;
  setTimeout(() => {
    setWords();
    showTaskTimer.value = false;
  }, 3000);
};

const setWords = () => {
  currentStudiedWords.value = [];
  currentReStudyWords.value = [];

  if (words.value.length > 0) {
    currentWords.value =
      taskData.value.options.impression_limit > 0
        ? words.value.slice(0, taskData.value.options.impression_limit)
        : words.value;

    currentWords.value.forEach((word) => {
      word.userInput = "";
    });

    setTimeout(() => {
      const firstInput = document.querySelector(".user_input");
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);

    time.value =
      taskData.value.options.seconds_per_word * currentWords.value.length;

    isComplete.value = false;
    isStarted.value = true;
    timeIsUp.value = false;
    checkingStatus.value = false;
  }
};

// Проверка всех слов
const checkWords = () => {
  currentWords.value.forEach((word) => {
    words.value = words.value.filter(
      (w) => w.task_word_id !== word.task_word_id
    );

    if (
      word.userInput !== "" &&
      word.syllables[word.userInput].target == true
    ) {
      pushToStudyWords(word);
    } else {
      pushToCurrentReStudyWords(word);
    }
  });
};

const pushToStudyWords = async (word) => {
  studiedWords.value.push(word);
  currentStudiedWords.value.push(word);

  await nextTick();
  const answer = rightAnswers.value.querySelector(
    "#right_answer_" + word.task_word_id
  );

  if (answer) {
    taskResultCollection.value.push({
      is_correct: true,
      right_answer: answer.innerHTML,
      word_id: word.word_id,
    });
  }

  if (reStudyWords.value.some((w) => w.task_word_id === word.task_word_id)) {
    reStudyWords.value = reStudyWords.value.filter(
      (w) => w.task_word_id !== word.task_word_id
    );
  }
};

const pushToCurrentReStudyWords = async (word) => {
  currentReStudyWords.value.push(word);

  if (word.attempts >= 1) {
    words.value.push(word);
    word.attempts--;
  } else {
    await nextTick();
    const userAnswer = wrongAnswers.value.querySelector(
      "#user_answer_" + word.task_word_id
    );

    const rightAnswer = wrongAnswers.value.querySelector(
      "#right_answer_" + word.task_word_id
    );

    if (userAnswer && rightAnswer) {
      taskResultCollection.value.push({
        is_correct: false,
        user_answer: userAnswer.innerHTML,
        right_answer: rightAnswer.innerHTML,
        word_id: word.word_id,
      });
    }
    reStudyWords.value.push(word);
  }
};

const selectSyllable = (syllableIndex, wordIndex) => {
  currentWords.value[wordIndex].userInput = syllableIndex;
};

const acceptAnswers = () => {
  for (let wordIndex = 0; wordIndex < currentWords.value.length; wordIndex++) {
    const word = currentWords.value[wordIndex];

    if (word.userInput === "" || word.userInput === " ") {
      checkingStatus.value = true;
      break;
    }
  }

  if (checkingStatus.value === true) {
    setTimeout(() => {
      checkingStatus.value = false;
    }, 1000);
  } else {
    isComplete.value = true;
    isStarted.value = false;
    checkWords();
  }
};

const timerIsUp = () => {
  timeIsUp.value = true;
  isStarted.value = false;
  checkWords();
};

const handleKeyPress = (event) => {
  if (event.key === "Enter") {
    if (!isFinished.value) {
      if (timeIsUp.value === true || isComplete.value === true) {
        if (words.value.length > 0) {
          setWords();
        } else {
          isFinished.value = true;
        }
      } else {
        if (checkingStatus.value === false) {
          acceptAnswers();
        }
      }
    }
  }
};

const saveTaskResult = async () => {
  onPending(true);
  const formData = new FormData();
  formData.append("task_result", JSON.stringify(taskResultCollection.value));
  formData.append("operation_type_id", 25);

  await $axiosPlugin
    .post("tasks/save_result/" + props.task.task_id, formData)
    .then((res) => {
      taskResult.value = res.data;
      onCompleteTask();
      onPending(false);
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          onPending(false);
        } else {
          router.push({
            path: "/error",
            query: {
              status: err.response.status,
              message: err.response.data.message,
              url: err.request.responseURL,
            },
          });
        }
      } else {
        router.push("/error");
      }
    });
};

// Инициализация при монтировании
onMounted(() => {
  changeModalSize("modal-2xl");
  getTask();
  window.addEventListener("keydown", handleKeyPress);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyPress);
});

watch(
  () => taskResultCollection.value.length,
  (newVal) => {
    if (newVal === taskData.value.words.length) {
      saveTaskResult();
    }
  }
);
</script>
