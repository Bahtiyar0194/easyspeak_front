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
        <!-- Статус: сколько осталось / итог + попытки + таймер -->
        <div class="col-span-12">
          <div class="task-status-bar">
            <div class="flex flex-col gap-1 min-w-0">
              <p v-if="timeIsUp" class="mb-0 font-semibold text-danger flex items-center gap-1.5">
                <i class="pi pi-clock" aria-hidden="true"></i>
                {{ $t("time_is_up") }}
              </p>
              <p v-else-if="isComplete" class="mb-0 font-semibold text-success flex items-center gap-1.5">
                <i class="pi pi-check-circle" aria-hidden="true"></i>
                {{ $t("right") }}
              </p>
              <p v-else-if="isWrong" class="mb-0 font-semibold text-danger flex items-center gap-1.5">
                <i class="pi pi-times-circle" aria-hidden="true"></i>
                {{ $t("wrong") }}
              </p>
              <p v-else-if="wordsLeft > 0" class="mb-0 text-inactive">
                {{ $t("pages.dictionary.words_left") }}:
                <b class="text-active">{{ wordsLeft }}</b>
              </p>

              <div
                v-if="currentWord && isStarted"
                class="attempt-hearts"
                :title="$t('pages.tasks.attempts_left')"
                :aria-label="$t('pages.tasks.attempts_left') + ': ' + (currentWord.wrongWordAttempts ?? 0)"
              >
                <i
                  v-for="n in maxWrongWordAttempts"
                  :key="n"
                  class="bi"
                  :class="n <= (currentWord.wrongWordAttempts ?? 0) ? 'bi-heart-fill' : 'bi-heart lost'"
                  aria-hidden="true"
                ></i>
              </div>
            </div>
            <countdownCircleTimer
              :totalSeconds="time"
              :startCommand="isStarted"
              :isWrong="isWrong"
              @timeIsUp="timerIsUp()"
            />
          </div>
        </div>

        <!-- Карточка слова: картинка, слово, транскрипция, озвучка -->
        <div class="col-span-12">
          <div class="word-prompt" :class="{ 'is-right': isComplete }">
            <img
              v-if="currentWord?.image_file && taskData?.options.show_image"
              v-skeleton="'1/1'"
              class="w-28 lg:w-36 h-auto mx-auto rounded-2xl"
              :src="config.public.apiBase + '/media/get/' + currentWord?.image_file"
              alt=""
            />

            <div class="flex flex-wrap justify-center items-center gap-3">
              <audioButton
                v-if="
                  currentWord?.audio_file &&
                  taskData?.options.show_audio_button &&
                  (taskData?.options.show_image || taskData?.options.show_word)
                "
                :key="currentWord?.audio_file"
                :src="config.public.apiBase + '/media/get/' + currentWord?.audio_file"
              />
              <h2 v-if="taskData?.options.show_word" class="word-prompt-text">
                {{
                  taskData?.options.in_the_main_lang
                    ? currentWord?.word
                    : currentWord?.word_translate
                }}
              </h2>
            </div>

            <!-- Только звук: плеер во всю ширину -->
            <div
              v-if="
                currentWord?.audio_file &&
                taskData?.options.show_audio_button &&
                !taskData?.options.show_image &&
                !taskData?.options.show_word
              "
              class="w-full"
            >
              <audioPlayerWithWave
                :key="currentWord?.audio_file"
                :src="config.public.apiBase + '/media/get/' + currentWord?.audio_file"
              />
            </div>

            <p v-if="taskData?.options.show_transcription" class="mb-0 text-inactive">
              [{{ currentWord?.transcription }}]
            </p>
          </div>
        </div>

        <!-- Не получилось / время вышло -->
        <div v-if="timeIsUp || isWrong" class="col-span-12">
          <div class="answer-reveal">
            <p class="text-inactive text-sm mb-1">{{ $t("right_answer") }}</p>
            <p class="text-2xl mb-0 font-bold">
              {{
                taskData?.options.in_the_main_lang
                  ? currentWord?.word_translate
                  : currentWord?.word
              }}
            </p>
          </div>
        </div>

        <!-- Варианты ответа -->
        <div v-else class="col-span-12">
          <div class="flex flex-col gap-3">
            <div class="grid gap-2 lg:grid-cols-2">
              <trainingButton
                v-for="(answer, index) in currentWord?.answer_options"
                :key="`${currentWord?.word}-${index}-${currentWord?.task_word_id}`"
                :text="taskData?.options.in_the_main_lang ? answer.word_translate : answer.word"
                :number="index + 1"
                :state="
                  successButtonIndex === index
                    ? 'correct'
                    : errorButtonIndex === index
                      ? 'wrong'
                      : checkingStatus
                        ? 'locked'
                        : 'idle'
                "
                v-motion="{
                  initial: { opacity: 0, y: 8 },
                  enter: {
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 50, type: 'spring', stiffness: 500, damping: 22 },
                  },
                }"
                @click="checkAnswer(index)"
              />
            </div>

            <p class="text-inactive text-sm text-center hidden lg:flex items-center justify-center gap-1.5 mb-0">
              <i class="bi bi-keyboard" aria-hidden="true"></i>
              {{ $t("pages.training.keyboard.numbers") }}
            </p>
          </div>
        </div>

        <div v-if="timeIsUp || isWrong" class="col-span-12">
          <div class="task-actions justify-center">
            <button type="button" class="btn btn-primary btn-lg" @click="setWord()">
              {{ $t("continue") }}
              <i class="pi pi-arrow-right" aria-hidden="true"></i>
            </button>
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
import trainingButton from "../../../../../ui/trainingButton.vue";
import audioButton from "../../../../../ui/audioButton.vue";
import audioPlayerWithWave from "../../../../../ui/audioPlayerWithWave.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import {
  playAudio,
  stopAudio,
  playSuccessSound,
  playErrorSound,
} from "../../../../../../utils/playAudio";
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
const currentWord = ref(null);
const checkingStatus = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

const studiedWords = ref([]);
const reStudyWords = ref([]);

const taskResult = ref([]);
const taskResultCollection = ref([]);

const isStarted = ref(false);
const isComplete = ref(false);

const maxWrongWordAttempts = ref(3);
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
      "tasks/get/learning_words/" + props.task.task_id,
    );
    taskData.value = res.data;
    onStartTask();
    showMaterialsOption.value = taskData.value.options.show_materials_option;
    materials.value = taskData.value.materials;

    time.value = taskData.value.options.seconds_per_word;
    words.value = [...taskData.value.words]; // Поверхностная копия массива, чтобы избежать изменения исходного массива taskData.value.words

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
    setWord();
    showTaskTimer.value = false;
  }, 3000);
};

const setWord = () => {
  if (words.value.length > 0) {
    // Устанавливаем текущее слово
    currentWord.value = null;
    currentWord.value = words.value[0];
    currentWord.value.wrongWordAttempts = maxWrongWordAttempts.value;
    currentWord.value.userInput = "";
    checkingStatus.value = false;

    if (Boolean(taskData.value.options.play_audio_at_the_begin)) {
      if (currentWord.value.audio_file) {
        stopAudio();
        playAudio(
          config.public.apiBase + "/media/get/" + currentWord.value.audio_file,
          {
            onEnded: () => {},
            onLoading: (state) => {},
          },
        );
      }
    }

    successButtonIndex.value = null;
    errorButtonIndex.value = null;

    isComplete.value = false;
    isStarted.value = true;
    timeIsUp.value = false;
    isWrong.value = false;
  } else {
    isFinished.value = true;
  }
};

const moveToEnd = (answerIndex) => {
  words.value.shift();

  if (currentWord.value.attempts >= 1) {
    currentWord.value.attempts--;
    words.value.push(currentWord.value);
  } else {
    if (answerIndex !== undefined) {
      const userInput = currentWord.value.answer_options[answerIndex].word;
      currentWord.value.userInput = userInput;
    }

    taskResultCollection.value.push({
      is_correct: false,
      user_answer:
        "<b class='text-danger'>" +
        (currentWord.value.userInput || "______") +
        "</b>",
      right_answer:
        "<b class='text-success'>" +
        currentWord.value.word +
        "</b><br><b class='text-inactive text-xs'>" +
        currentWord.value.word_translate +
        "</b>",
      word_id: currentWord.value.word_id,
    });

    reStudyWords.value.push(currentWord.value);
  }
};

const checkAnswer = (answerIndex) => {
  // Слово уже засчитано (верно/неверно) или время вышло — повторная проверка
  // по клавише 1–4 раньше снова штрафовала и дублировала слово в результатах
  if (isStarted.value !== true || checkingStatus.value === true) return;
  if (!currentWord.value?.answer_options?.[answerIndex]) return;
  checkingStatus.value = true;
  if (
    currentWord.value.task_word_id ===
    currentWord.value.answer_options[answerIndex].task_word_id
  ) {
    successButtonIndex.value = answerIndex;

    if (isStarted.value === true) {
      studiedWords.value.push(currentWord.value);

      taskResultCollection.value.push({
        is_correct: true,
        right_answer:
          "<b class='text-success'>" +
          currentWord.value.word +
          "</b><br><b class='text-inactive text-xs'>" +
          currentWord.value.word_translate +
          "</b>",
        word_id: currentWord.value.word_id,
      });
    }

    isComplete.value = true;
    isStarted.value = false;

    if (Boolean(taskData.value.options.play_audio_with_the_correct_answer)) {
      if (currentWord.value.audio_file) {
        playSuccessSound(
          config.public.apiBase + "/media/get/" + currentWord.value.audio_file,
        );
      }
    }

    if (
      reStudyWords.value.some(
        (w) => w.task_word_id === currentWord.value.task_word_id,
      )
    ) {
      reStudyWords.value = reStudyWords.value.filter(
        (w) => w.task_word_id !== currentWord.value.task_word_id,
      );
    }

    setTimeout(() => {
      words.value.shift();
      setWord();
    }, 2000);
  } else {
    errorButtonIndex.value = answerIndex;

    if (
      Boolean(taskData.value.options.play_error_sound_with_the_incorrect_answer)
    ) {
      stopAudio();
      playErrorSound();
    }

    setTimeout(() => {
      checkingStatus.value = false;
      errorButtonIndex.value = null;
    }, 500);

    if (currentWord.value.wrongWordAttempts >= 1) {
      --currentWord.value.wrongWordAttempts;
    } else {
      isWrong.value = true;
      isStarted.value = false;
      moveToEnd(answerIndex);
    }
  }
};

const timerIsUp = () => {
  timeIsUp.value = true;
  isStarted.value = false;
  moveToEnd();
};

// Function to log key number and handle answer checking
const logKey = (event) => {
  if (!isFinished.value) {
    const key = event.key;
    const optionNumber = /^[1-9]$/.test(key) ? Number(key) : 0;
    if (
      isStarted.value === true &&
      checkingStatus.value === false &&
      currentWord.value &&
      optionNumber >= 1 &&
      optionNumber <= currentWord.value.answer_options.length
    ) {
      checkAnswer(optionNumber - 1);
    } else if (event.key === "Enter") {
      if (timeIsUp.value === true || isWrong.value === true) {
        setWord();
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
  // Добавляем обработчик событий при монтировании компонента
  window.addEventListener("keydown", logKey);
});

onBeforeUnmount(() => {
  // Убираем обработчик событий при размонтировании компонента
  window.removeEventListener("keydown", logKey);
});

watch(
  () => taskResultCollection.value.length,
  (newVal) => {
    if (newVal === taskData.value.words.length) {
      saveTaskResult();
    }
  },
);
</script>
