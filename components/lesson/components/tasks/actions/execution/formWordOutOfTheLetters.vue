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
        <!-- Статус: сколько осталось / итог слова + попытки + таймер -->
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

              <!-- Сколько ошибок ещё можно сделать -->
              <div
                v-if="currentWord && isStarted"
                class="attempt-hearts"
                :title="$t('pages.tasks.attempts_left')"
                :aria-label="$t('pages.tasks.attempts_left') + ': ' + (currentWord.wrongLetterAttempts ?? 0)"
              >
                <i
                  v-for="n in maxWrongLetterAttempts"
                  :key="n"
                  class="bi"
                  :class="n <= (currentWord.wrongLetterAttempts ?? 0) ? 'bi-heart-fill' : 'bi-heart lost'"
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

        <!-- Подсказки: картинка и озвучка -->
        <div
          v-if="currentWord?.image_file && taskData?.options.show_image"
          class="col-span-12"
        >
          <img
            v-skeleton="'1/1'"
            class="w-32 lg:w-40 h-auto mx-auto rounded-2xl"
            :src="config.public.apiBase + '/media/get/' + currentWord?.image_file"
            alt=""
          />
        </div>

        <div
          v-if="currentWord?.audio_file && taskData?.options.show_audio_button"
          class="col-span-12"
        >
          <div class="flex justify-center">
            <audioButton
              v-if="taskData?.options.show_image"
              :key="currentWord?.audio_file"
              :src="config.public.apiBase + '/media/get/' + currentWord?.audio_file"
            />
            <div v-else class="w-full">
              <audioPlayerWithWave
                :key="currentWord?.audio_file"
                :src="config.public.apiBase + '/media/get/' + currentWord?.audio_file"
              />
            </div>
          </div>
        </div>

        <!-- Не получилось / время вышло: правильный ответ -->
        <div v-if="timeIsUp || isWrong" class="col-span-12">
          <div class="answer-reveal">
            <p class="text-inactive text-sm mb-1">{{ $t("right_answer") }}</p>
            <p class="text-3xl mb-1 font-bold tracking-wide">{{ currentWord?.word }}</p>
            <p v-if="currentWord?.word_translate" class="mb-0 text-inactive">
              {{ currentWord?.word_translate }}
            </p>
          </div>
        </div>

        <div v-else class="col-span-12">
          <div class="flex flex-col items-center gap-4">
            <!-- Слово: готовые буквы и пропуски -->
            <div class="letter-tiles justify-center" :class="{ 'is-complete': isComplete }">
              <template v-for="(letter, letterIndex) in currentWord?.word" :key="letterIndex">
                <span v-if="letter === ' ' || letter === ''" class="letter-gap"></span>
                <span
                  v-else-if="missingLetters.includes(letterIndex + 1)"
                  class="letter-tile slot"
                  :class="{ next: missingLetters[0] === letterIndex + 1 }"
                  aria-hidden="true"
                ></span>
                <span v-else class="letter-tile big">{{ letter }}</span>
              </template>
            </div>

            <div class="text-center">
              <p class="text-lg mb-0">{{ currentWord?.word_translate }}</p>
              <p v-if="taskData?.options.show_transcription" class="text-sm text-inactive mb-0">
                [{{ currentWord?.transcription }}]
              </p>
            </div>

            <!-- Клавиатура из букв -->
            <div v-if="currentWord" class="letter-keys">
              <button
                type="button"
                v-for="(letter, lIndex) in displayedLetters"
                :key="`${currentWord?.word}-${lIndex}-${currentWord?.task_word_id}`"
                @click="checkWord(letter.toLowerCase(), $event)"
                class="letter-btn letter-key"
                :class="isComplete && 'is-used'"
                :disabled="isComplete"
                v-motion="{
                  initial: { opacity: 0, y: 8 },
                  enter: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: lIndex * 40,
                      type: 'spring',
                      stiffness: 500,
                      damping: 22,
                    },
                  },
                }"
              >
                {{ letter }}
              </button>
            </div>

            <p class="text-inactive text-sm text-center hidden lg:flex items-center gap-1.5 mb-0">
              <i class="bi bi-keyboard" aria-hidden="true"></i>
              {{ $t("pages.training.keyboard.title") }}
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
import { useNotify } from "~/composables/useNotify";
import alert from "../../../../../ui/alert.vue";
import { ref, onMounted, inject } from "vue";
import { useRouter } from "nuxt/app";
import taskLayout from "../../taskLayout.vue";
import audioButton from "../../../../../ui/audioButton.vue";
import audioPlayerWithWave from "../../../../../ui/audioPlayerWithWave.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import { debounceHandler } from "../../../../../../utils/debounceHandler";
import {
  playAudio,
  stopAudio,
  playSuccessSound,
  playErrorSound,
} from "../../../../../../utils/playAudio";
import result from "../../results/dictionary/result.vue";

const router = useRouter();
const config = useRuntimeConfig();
const notify = useNotify();
const { t } = useI18n();
const { $axiosPlugin } = useNuxtApp();
const errors = ref([]);

const showTaskTimer = ref(false);
const taskData = ref(null);
const materials = ref([]);
const showMaterialsOption = ref("");
const showMaterialsBeforeTask = ref(false);
const words = ref([]);
const currentWord = ref(null);
const missingLetters = ref([]);
const checkingStatus = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

const studiedWords = ref([]);
const reStudyWords = ref([]);

const taskResult = ref([]);
const taskResultCollection = ref([]);

const isStarted = ref(false);
const isComplete = ref(false);

const maxWrongLetterAttempts = ref(3);
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
      "tasks/get/form_a_word_out_of_the_letters/" + props.task.task_id,
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

    // Инициализация массивов
    missingLetterInputs.value = taskData.value.words.map((word) =>
      Array(word.word.length).fill(""),
    );
    results.value = taskData.value.words.map(
      (word) => Array(word.word.length).fill(null), // null - еще не проверено
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
    currentWord.value.wrongLetterAttempts = maxWrongLetterAttempts.value;
    missingLetters.value = [];
    missingLetters.value = [...currentWord.value.missingLetters];
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

const moveToEnd = () => {
  words.value.shift();

  if (currentWord.value.attempts >= 1) {
    currentWord.value.attempts--;
    words.value.push(currentWord.value);
  } else {
    taskResultCollection.value.push({
      is_correct: false,
      right_answer: "<b>" + currentWord.value.word + "</b>",
      word_id: currentWord.value.word_id,
    });

    reStudyWords.value.push(currentWord.value);
  }
};

// Кнопка-буква: по клику — сама кнопка, с клавиатуры — первая свободная
// кнопка с этой буквой
const findLetterButton = (letter, event) => {
  if (event?.currentTarget) return event.currentTarget;
  const buttons = document.getElementsByClassName("letter-btn");
  for (const button of buttons) {
    if (
      !button.classList.contains("is-used") &&
      button.innerText.trim().toLowerCase() === letter.toLowerCase()
    ) {
      return button;
    }
  }
  return null;
};

const checkWord = (letter, event) => {
  if (!currentWord.value || missingLetters.value.length === 0) return;

  const button = findLetterButton(letter, event);

  if (
    letter.toLowerCase() ===
    currentWord.value.word[missingLetters.value[0] - 1].toLowerCase()
  ) {
    missingLetters.value.shift();

    if (button) {
      button.classList.add("is-correct");
      setTimeout(() => {
        button.classList.remove("is-correct");
        button.classList.add("is-used");
        button.disabled = true;
      }, 300);
    }

    if (missingLetters.value.length === 0) {
      if (isStarted.value === true) {
        studiedWords.value.push(currentWord.value);

        taskResultCollection.value.push({
          is_correct: true,
          right_answer: "<b>" + currentWord.value.word + "</b>",
          word_id: currentWord.value.word_id,
        });
      }

      if (Boolean(taskData.value.options.play_audio_with_the_correct_answer)) {
        if (currentWord.value.audio_file) {
          playSuccessSound(
            config.public.apiBase +
              "/media/get/" +
              currentWord.value.audio_file,
          );
        }
      }

      isComplete.value = true;
      isStarted.value = false;

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
      }, 3000);
    }
  } else {
    // Неверная буква — одинаково для клика и клавиатуры (раньше с
    // клавиатуры ошибка не считалась и буквы можно было подбирать перебором).
    // Нажатие на клавиатуре буквы, которой нет среди кнопок, — опечатка, не штрафуем.
    if (!button && !event) return;

    if (button) {
      button.classList.add("is-wrong");
      setTimeout(() => button.classList.remove("is-wrong"), 400);
    }

    if (
      Boolean(taskData.value.options.play_error_sound_with_the_incorrect_answer)
    ) {
      playErrorSound();
    }

    if (currentWord.value.wrongLetterAttempts >= 1) {
      --currentWord.value.wrongLetterAttempts;
    } else {
      isWrong.value = true;
      isStarted.value = false;
      moveToEnd();
    }
  }
};

// Функция для генерации случайных букв
const generateRandomLetters = (count) => {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  return Array.from(
    { length: count },
    () => letters[Math.floor(Math.random() * letters.length)],
  );
};

// Подготовка букв для отображения
const displayedLetters = computed(() => {
  const correctLetters = currentWord.value.missingLetters.map(
    (index) => currentWord.value?.word[index - 1],
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
};

const debounceKeyboard = debounceHandler(
  () =>
    notify("warning", t("pages.training.keyboard.warning")),
  1000,
);

// Function to log key number and handle answer checking
const logKey = (event) => {
  if (!isFinished.value) {
    if (
      isComplete.value === false &&
      isStarted.value === true &&
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      event.key !== " "
    ) {
      const regex = /^[a-zA-Z0-9]$/;
      if (!regex.test(event.key)) {
        event.preventDefault();
        debounceKeyboard();
      } else {
        checkWord(event.key.toLowerCase());
      }
    }

    if (timeIsUp.value === true || isWrong.value === true) {
      if (event.key === "Enter") {
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
  window.addEventListener("keydown", logKey);
});

onBeforeUnmount(() => {
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
