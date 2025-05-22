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
        <p v-else-if="isComplete" class="font-medium text-center text-success">
          {{ $t("right") }}
        </p>
        <p v-else-if="isWrong" class="font-medium text-center text-danger">
          {{ $t("wrong") }}
        </p>
        <p v-else-if="wordsLeft > 0" class="text-center">
          {{ $t("pages.dictionary.words_left") }}: <b>{{ wordsLeft }}</b>
        </p>
      </div>

      <div class="col-span-12">
        <div class="flex justify-center">
          <countdownCircleTimer
            :totalSeconds="time"
            :startCommand="isStarted"
            :isWrong="isWrong"
            @timeIsUp="timerIsUp()"
          />
        </div>
      </div>

      <div
        v-if="currentWord?.image_file && taskData?.options.show_image"
        class="col-span-12"
      >
        <img
          v-if="currentWord?.image_file && taskData?.options.show_image"
          class="w-36 lg:w-40 h-auto mx-auto rounded-xl"
          :src="config.public.apiBase + '/media/get/' + currentWord?.image_file"
        />
      </div>

      <div class="col-span-12">
        <div class="flex flex-wrap justify-center items-center gap-2">
          <audioButton
            v-if="
              currentWord?.audio_file &&
              taskData?.options.show_image &&
              taskData?.options.show_audio_button
            "
            :key="currentWord?.audio_file"
            :src="
              config.public.apiBase + '/media/get/' + currentWord?.audio_file
            "
          />
          <div
            v-else-if="
              currentWord?.audio_file && taskData?.options.show_audio_button
            "
            class="w-full"
          >
            <audioPlayerWithWave
              :key="currentWord?.audio_file"
              :src="
                config.public.apiBase + '/media/get/' + currentWord?.audio_file
              "
            />
          </div>
        </div>
      </div>

      <div v-if="timeIsUp || isWrong" class="col-span-12">
        <div class="bg-inactive p-6 rounded-xl text-center">
          <p class="text-inactive mb-2">{{ $t("right_answer") }}</p>
          <p class="text-2xl mb-0 font-medium">{{ currentWord?.word }}</p>
        </div>
      </div>

      <div v-else class="col-span-12">
        <div class="custom-grid">
          <div class="col-span-12">
            <div class="flex justify-center flex-wrap gap-x-1 mb-2">
              <div
                v-for="(letter, letterIndex) in currentWord?.word"
                :key="letterIndex"
                class="text-3xl font-medium"
                :class="isComplete && 'text-success'"
              >
                <div v-if="letter === ' ' || letter === ''" class="mx-1"></div>
                <div
                  class="text-inactive"
                  v-else-if="missingLetters.includes(letterIndex + 1)"
                >
                  _
                </div>
                <div v-else>
                  {{ letter }}
                </div>
              </div>
            </div>

            <p class="text-center text-lg text-inactive mb-1">
              {{ currentWord?.word_translate }}
            </p>
            <p
              v-if="taskData?.options.show_transcription"
              class="text-center text-sm text-inactive"
            >
              [{{ currentWord?.transcription }}]
            </p>
          </div>

          <div v-if="currentWord" class="col-span-12">
            <div class="flex flex-wrap justify-center gap-1">
              <button
                v-for="(letter, lIndex) in displayedLetters"
                :key="`${currentWord?.word}-${lIndex}-${currentWord?.task_word_id}`"
                @click="checkWord(letter.toLowerCase(), $event)"
                class="letter-btn btn btn-square btn-lg btn-light font-medium lowercase"
                :class="isComplete && 'disabled text-hidden'"
                v-motion="{
                  initial: { opacity: 0 },
                  enter: {
                    opacity: 1,
                    transition: {
                      delay: lIndex * 50,
                      type: 'spring',
                      stiffness: 500,
                      damping: 20,
                    },
                  },
                }"
              >
                {{ letter }}
              </button>
            </div>
          </div>

          <div class="col-span-12">
            <p class="text-inactive text-center hidden lg:block mb-0">
              {{ $t("pages.training.keyboard.title") }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="timeIsUp || isWrong" class="col-span-12">
        <div class="flex justify-center">
          <button class="btn btn-primary btn-lg" @click="setWord()">
            <i class="pi pi-arrow-right"></i> {{ $t("continue") }}
          </button>
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
import { useToast } from "vue-toastification";
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
const toast = useToast();
const { t } = useI18n();
const { $axiosPlugin } = useNuxtApp();

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
});

const onPending = inject("onPending");
const onCompleteTask = inject("onCompleteTask");
const changeModalSize = inject("changeModalSize");

// Получение задачи
const getTask = async () => {
  try {
    onPending(true);
    const res = await $axiosPlugin.get(
      "tasks/get/form_a_word_out_of_the_letters/" + props.task.task_id
    );
    taskData.value = res.data;
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
      Array(word.word.length).fill("")
    );
    results.value = taskData.value.words.map(
      (word) => Array(word.word.length).fill(null) // null - еще не проверено
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
          config.public.apiBase + "/media/get/" + currentWord.value.audio_file
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

const checkWord = (letter, event) => {
  if (
    letter.toLowerCase() ===
    currentWord.value.word[missingLetters.value[0] - 1].toLowerCase()
  ) {
    missingLetters.value.shift();

    if (event) {
      event.target.classList.replace("btn-light", "btn-success");
      setTimeout(() => {
        event.target.classList.remove("btn-success");
        event.target.classList.add("btn-inactive", "disabled", "text-hidden");
      }, 300);
    } else {
      const letterButtons = document.getElementsByClassName("letter-btn");

      for (let index = 0; index < letterButtons.length; index++) {
        const button = letterButtons[index];

        if (
          !button.classList.contains("disabled") &&
          button.innerText.toLowerCase() === letter.toLowerCase()
        ) {
          button.classList.replace("btn-light", "btn-success");
          setTimeout(() => {
            button.classList.remove("btn-success");
            button.classList.add("btn-inactive", "disabled", "text-hidden");
          }, 300);
          break;
        }
      }
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
            config.public.apiBase + "/media/get/" + currentWord.value.audio_file
          );
        }
      }

      isComplete.value = true;
      isStarted.value = false;

      if (
        reStudyWords.value.some(
          (w) => w.task_word_id === currentWord.value.task_word_id
        )
      ) {
        reStudyWords.value = reStudyWords.value.filter(
          (w) => w.task_word_id !== currentWord.value.task_word_id
        );
      }

      setTimeout(() => {
        words.value.shift();
        setWord();
      }, 3000);
    }
  } else {
    if (event) {
      event.target.classList.remove("btn-light");
      event.target.classList.add("btn-danger", "wobble");

      if (
        Boolean(
          taskData.value.options.play_error_sound_with_the_incorrect_answer
        )
      ) {
        playErrorSound();
      }

      setTimeout(() => {
        event.target.classList.remove("btn-danger", "wobble");
        event.target.classList.add("btn-light");
      }, 300);

      if (currentWord.value.wrongLetterAttempts >= 1) {
        --currentWord.value.wrongLetterAttempts;
      } else {
        isWrong.value = true;
        isStarted.value = false;
        moveToEnd();
      }
    }
  }
};

// Функция для генерации случайных букв
const generateRandomLetters = (count) => {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  return Array.from(
    { length: count },
    () => letters[Math.floor(Math.random() * letters.length)]
  );
};

// Подготовка букв для отображения
const displayedLetters = computed(() => {
  const correctLetters = currentWord.value.missingLetters.map(
    (index) => currentWord.value?.word[index - 1]
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
    toast(t("pages.training.keyboard.warning"), {
      toastClassName: ["custom-toast", "warning"],
      timeout: 5000,
    }),
  1000
);

// Function to log key number and handle answer checking
const logKey = (event) => {
  if (!isFinished.value) {
    if (isComplete.value === false && isStarted.value === true) {
      const regex = /^[a-zA-Z0-9]*$/;
      if (!regex.test(event.key) && event.key.length === 1) {
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
  }
);
</script>
