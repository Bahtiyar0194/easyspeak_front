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
          class="w-32 lg:w-36 h-auto mx-auto rounded-xl"
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
          <h2
            :class="isComplete && 'text-success'"
            v-if="taskData?.options.show_word"
            class="text-center mb-0"
          >
            {{
              taskData?.options.in_the_main_lang
                ? currentWord?.word
                : currentWord?.word_translate
            }}
          </h2>
        </div>
        <p
          v-if="taskData?.options.show_transcription"
          class="text-center text-inactive mt-2"
        >
          [{{ currentWord?.transcription }}]
        </p>
      </div>

      <div v-if="timeIsUp || isWrong" class="col-span-12">
        <div class="bg-danger-100 p-6 rounded-xl text-center">
          <p class="text-danger mb-2">{{ $t("right_answer") }}</p>
          <p class="text-2xl text-danger mb-0 font-medium">
            {{
              taskData?.options.in_the_main_lang
                ? currentWord?.word_translate
                : currentWord?.word
            }}
          </p>
        </div>
      </div>

      <div v-else class="col-span-12">
        <div class="custom-grid">
          <div
            v-for="(answer, index) in currentWord?.answer_options"
            :key="`${currentWord?.word}-${index}-${currentWord?.task_word_id}`"
            class="col-span-12 lg:col-span-6"
          >
            <trainingButton
              :text="
                taskData?.options.in_the_main_lang
                  ? answer.word_translate
                  : answer.word
              "
              :number="index + 1"
              :className="
                successButtonIndex === index
                  ? 'btn-success'
                  : errorButtonIndex === index
                  ? 'btn-danger wobble'
                  : checkingStatus
                  ? 'btn-inactive disabled'
                  : 'btn-inactive'
              "
              v-motion="{
                initial: { opacity: 0 },
                enter: {
                  opacity: 1,
                  transition: {
                    delay: index * 50,
                    type: 'spring',
                    stiffness: 500,
                    damping: 20,
                  },
                },
              }"
              @click="checkAnswer(index)"
            />
          </div>

          <div class="col-span-12">
            <p class="text-inactive text-center hidden lg:block mb-0">
              {{ $t("pages.training.keyboard.numbers") }}
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
});

const onPending = inject("onPending");
const changeModalSize = inject("changeModalSize");

// Получение задачи
const getTask = async () => {
  try {
    onPending(true);
    const res = await $axiosPlugin.get(
      "tasks/learning_words/" + props.task.task_id
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
    reStudyWords.value.push(currentWord.value);
  }
};

const checkAnswer = (answerIndex) => {
  checkingStatus.value = true;
  if (
    currentWord.value.task_word_id ===
    currentWord.value.answer_options[answerIndex].task_word_id
  ) {
    successButtonIndex.value = answerIndex;

    if (isStarted.value === true) {
      studiedWords.value.push(currentWord.value);
    }

    isComplete.value = true;
    isStarted.value = false;

    if (Boolean(taskData.value.options.play_audio_with_the_correct_answer)) {
      if (currentWord.value.audio_file) {
        playSuccessSound(
          config.public.apiBase + "/media/get/" + currentWord.value.audio_file
        );
      }
    }

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
      moveToEnd();
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
    if (
      checkingStatus.value === false &&
      currentWord.value &&
      key >= "1" &&
      key <= currentWord.value.answer_options.length
    ) {
      checkAnswer(parseInt(key - 1));
    } else if (event.key === "Enter") {
      if (timeIsUp.value === true || isWrong.value === true) {
        setWord();
      }
    }
  }
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
</script>
