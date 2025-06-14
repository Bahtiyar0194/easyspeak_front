<template>
  <taskLayout
    v-if="taskData"
    :task="props.task"
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
      <div class="col-span-12">
        <p v-if="timeIsUp" class="font-medium text-center text-danger">
          {{ $t("time_is_up") }}
        </p>
        <p v-else-if="words.length > 0" class="text-center">
          {{ $t("pages.dictionary.words_left") }}:
          <b>{{ words.length }}</b>
        </p>
      </div>

      <div class="col-span-12">
        <div class="flex justify-center items-center">
          <countdownCircleTimer
            :totalSeconds="time"
            :startCommand="isStarted"
            @timeIsUp="timerIsUp()"
          />
        </div>
      </div>

      <div v-if="timeIsUp || isComplete" class="col-span-12">
        <div class="flex flex-col gap-y-4">
          <div
            class="flex flex-col gap-y-2"
            v-if="currentStudiedWords.length > 0"
          >
            <p class="text-xl font-medium mb-0 text-success">
              {{
                currentReStudyWords.length > 0
                  ? $t("right_answers")
                  : $t("right")
              }}
            </p>

            <ul class="list-group nowrap" ref="rightAnswers">
              <li
                v-for="(word, sIndex) in currentStudiedWords"
                :key="sIndex"
                class="flex justify-between items-center gap-x-2"
              >
                <div class="flex items-center gap-x-2">
                  <audioButton
                    v-if="
                      word.audio_file && taskData?.options?.show_audio_button
                    "
                    :src="
                      config.public.apiBase + '/media/get/' + word.audio_file
                    "
                  />

                  <div class="flex flex-col">
                    <div :id="'right_answer_' + word.task_word_id">
                      <div class="text-xl font-medium">
                        <span
                          v-for="(syllable, syllableIndex) in word.syllables"
                          :key="syllableIndex"
                          :class="
                            syllable.target == true && 'text-success underline'
                          "
                        >
                          {{ syllable.syllable }}
                        </span>
                      </div>
                    </div>
                    <span class="text-xs text-inactive">{{
                      word.word_translate
                    }}</span>
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

          <div
            class="flex flex-col gap-y-2"
            v-if="currentReStudyWords.length > 0"
          >
            <p class="text-xl font-medium mb-0 text-danger">
              {{ $t("for_re_examination") }}
            </p>

            <ul class="list-group nowrap" ref="wrongAnswers">
              <li
                v-for="(word, rIndex) in currentReStudyWords"
                :key="rIndex"
                class="flex justify-between items-center gap-x-2"
              >
                <div class="flex flex-wrap gap-4">
                  <div class="flex flex-wrap items-start gap-x-2">
                    <audioButton
                      v-if="
                        word.audio_file && taskData?.options?.show_audio_button
                      "
                      :src="
                        config.public.apiBase + '/media/get/' + word.audio_file
                      "
                    />

                    <div class="flex flex-col">
                      <div class="flex flex-wrap gap-2">
                        <div class="flex flex-col">
                          <p class="mb-0 text-xs text-inactive font-normal">
                            {{ $t("your_answer") }}:
                          </p>
                          <div :id="'user_answer_' + word.task_word_id">
                            <div class="text-xl font-medium">
                              <span
                                v-for="(
                                  syllable, syllableIndex
                                ) in word.syllables"
                                :key="syllableIndex"
                                :class="
                                  word.userInput === syllableIndex &&
                                  'text-danger underline'
                                "
                              >
                                {{ syllable.syllable }}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div class="flex flex-col">
                          <p class="mb-0 text-xs text-inactive font-normal">
                            {{ $t("right_answer") }}:
                          </p>
                          <div :id="'right_answer_' + word.task_word_id">
                            <div class="text-xl font-medium">
                              <span
                                v-for="(
                                  syllable, syllableIndex
                                ) in word.syllables"
                                :key="syllableIndex"
                                :class="
                                  syllable.target == true &&
                                  'text-success underline'
                                "
                              >
                                {{ syllable.syllable }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <span class="text-xs text-inactive">{{
                        word.word_translate
                      }}</span>
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
            <button
              v-if="words.length > 0"
              class="btn btn-outline-primary"
              @click="setWords()"
            >
              <i class="pi pi-arrow-right"></i> {{ $t("continue") }}
            </button>
            <button v-else class="btn btn-light" @click="isFinished = true">
              <i class="pi pi-check"></i>
              {{ $t("pages.tasks.complete_the_task") }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="col-span-12">
        <div class="custom-grid">
          <div class="col-span-12">
            <ul class="list-group nowrap">
              <li
                v-for="(word, wordIndex) in currentWords"
                :key="wordIndex"
                class="list-item"
              >
                <div class="flex gap-3 items-center text-lg">
                  <div class="flex gap-x-2 items-start">
                    <audioButton
                      v-if="
                        word.audio_file && taskData?.options?.show_audio_button
                      "
                      :src="
                        config.public.apiBase + '/media/get/' + word.audio_file
                      "
                    />
                    <div class="flex flex-col">
                      <div class="btn-group mb-1">
                        <button
                          v-for="(syllable, syllableIndex) in word.syllables"
                          :key="syllableIndex"
                          type="button"
                          class="btn btn-light"
                          :class="
                            word.userInput !== '' &&
                            word.userInput === syllableIndex
                              ? 'underline txt-corp font-medium'
                              : checkingStatus === true && word.userInput === ''
                              ? 'pulse btn-danger'
                              : ''
                          "
                          @click="selectSyllable(syllableIndex, wordIndex)"
                        >
                          {{ syllable.syllable }}
                        </button>
                      </div>
                      <div class="flex flex-wrap gap-x-2">
                        <span
                          v-if="taskData?.options?.show_transcription"
                          class="text-xs"
                        >
                          [{{ word.transcription }}]
                        </span>
                        <span
                          v-if="taskData?.options?.show_translate"
                          class="text-inactive text-xs"
                        >
                          {{ word.word_translate }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div class="col-span-12">
            <div class="btn-wrap right">
              <button
                class="btn btn-outline-primary"
                :class="checkingStatus && 'disabled'"
                @click="acceptAnswers()"
              >
                <i class="pi pi-check"></i>
                {{ $t("check") }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-slot:task_result_content>
      <result :studiedWords="studiedWords" :reStudyWords="reStudyWords" />
    </template>
  </taskLayout>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { useRouter } from "nuxt/app";
import taskLayout from "../../taskLayout.vue";
import audioButton from "../../../../../ui/audioButton.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import result from "../../results/dictionary/result.vue";

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();

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
