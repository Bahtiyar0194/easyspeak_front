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
      :reStudyItems="reStudySentences"
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
              <p v-else-if="sentencesLeft > 0" class="mb-0 text-inactive">
                {{ $t("pages.sentences.sentences_left") }}:
                <b class="text-active">{{ sentencesLeft }}</b>
              </p>

              <div
                v-if="currentSentence && isStarted"
                class="attempt-hearts"
                :title="$t('pages.tasks.attempts_left')"
                :aria-label="$t('pages.tasks.attempts_left') + ': ' + (currentSentence.wrongWordAttempts ?? 0)"
              >
                <i
                  v-for="n in maxWrongWordAttempts"
                  :key="n"
                  class="bi"
                  :class="n <= (currentSentence.wrongWordAttempts ?? 0) ? 'bi-heart-fill' : 'bi-heart lost'"
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

        <!-- Что нужно перевести -->
        <div class="col-span-12">
          <div class="word-prompt !p-4" :class="{ 'is-right': isComplete }">
            <p class="mb-0 text-lg font-semibold">
              {{
                taskData?.options.in_the_main_lang
                  ? currentSentence?.sentence_translate
                  : currentSentence?.sentence
              }}
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
                  ? currentSentence?.sentence
                  : currentSentence?.sentence_translate
              }}
            </p>
          </div>
        </div>

        <div v-else class="col-span-12">
          <div class="flex flex-col gap-4">
            <!-- Собираемое предложение: собранные слова + пустые места -->
            <div class="sentence-build" :class="{ 'is-complete': isComplete }">
              <span
                v-for="(word, wordIndex) in displayedSentence"
                :key="'w' + wordIndex"
                class="sentence-word"
                v-motion="{ initial: { scale: 0.6, opacity: 0 }, enter: { scale: 1, opacity: 1 } }"
                >{{ word }}</span
              >
              <span
                v-for="n in Math.max(0, totalWords - displayedSentence.length)"
                :key="'s' + n"
                class="sentence-slot"
                :class="{ next: n === 1 }"
                aria-hidden="true"
              ></span>
            </div>

            <!-- Слова: нажимайте по порядку -->
            <div class="word-bank">
              <button
                type="button"
                v-for="(word, wordIndex) in cleanedSentenceWords"
                :key="`${word}-${wordIndex}-${currentSentence?.sentence_id}`"
                v-motion="{
                  initial: { opacity: 0, y: 8 },
                  enter: {
                    opacity: 1,
                    y: 0,
                    transition: { delay: wordIndex * 40, type: 'spring', stiffness: 500, damping: 22 },
                  },
                }"
                @click="checkSentence(word, wordIndex)"
                class="word-chip"
                :class="{
                  used: successButtonsIndex.includes(wordIndex),
                  'is-wrong-chip': errorButtonsIndex.includes(wordIndex),
                }"
                :disabled="successButtonsIndex.includes(wordIndex) || isComplete"
              >
                {{ word }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="timeIsUp || isWrong" class="col-span-12">
          <div class="task-actions justify-center">
            <button type="button" class="btn btn-primary btn-lg" @click="setSentence()">
              {{ $t("continue") }}
              <i class="pi pi-arrow-right" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </template>

      <template v-slot:task_result_content>
        <result
          :studiedSentences="studiedSentences"
          :reStudySentences="reStudySentences"
        />
      </template>
    </taskLayout>
  </div>
</template>

<script setup>
import alert from "../../../../../ui/alert.vue";
import { ref, onMounted, inject } from "vue";
import { useRouter } from "nuxt/app";
import taskLayout from "../../taskLayout.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import {
  playSuccessSound,
  playErrorSound,
} from "../../../../../../utils/playAudio";
import result from "../../results/sentences/result.vue";

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();
const errors = ref([]);

const showTaskTimer = ref(false);
const taskData = ref(null);
const materials = ref([]);
const showMaterialsOption = ref("");
const showMaterialsBeforeTask = ref(false);
const sentences = ref([]);
const currentSentence = ref(null);
const cleanedSentence = ref(null);
const cleanedSentenceWords = ref([]);
const assembledWordsCount = ref(0);
const originalSentence = ref(null);
const successButtonsIndex = ref([]);
const errorButtonsIndex = ref([]);

const studiedSentences = ref([]);
const reStudySentences = ref([]);

const taskResult = ref([]);
const taskResultCollection = ref([]);

const displayedSentence = ref([]);
const isStarted = ref(false);
const isComplete = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

const maxWrongWordAttempts = ref(3);
const isWrong = ref(false);

const sentencesLeft = computed(() => sentences.value.length);

const totalWords = computed(() =>
  cleanedSentence.value ? cleanedSentence.value.split(" ").filter(Boolean).length : 0,
);

const progressPercentage = computed(() => {
  const totalSentences = taskData.value?.sentences?.length || 0; // Предотвращаем ошибки, если данные ещё не загружены
  if (totalSentences === 0) return 0; // Если общее количество предложении равно 0, возвращаем 0
  const completedSentences = totalSentences - sentences.value.length;
  return (completedSentences / totalSentences) * 100;
});

const isFinished = ref(false);

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
      "tasks/get/form_a_sentence_out_of_the_words/" + props.task.task_id
    );
    taskData.value = res.data;
    onStartTask();
    showMaterialsOption.value = taskData.value.options.show_materials_option;
    materials.value = taskData.value.materials;
    time.value = taskData.value.options.seconds_per_sentence;
    // Перемешивание предложении
    sentences.value = [...taskData.value.sentences];

    sentences.value.forEach((sentence) => {
      sentence.attempts = taskData.value.options.max_attempts;
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
    setSentence();
    showTaskTimer.value = false;
  }, 3000);
};

const setSentence = () => {
  if (sentences.value.length > 0) {
    // Устанавливаем текущее предложение
    currentSentence.value = sentences.value[0];
    currentSentence.value.wrongWordAttempts = maxWrongWordAttempts.value;

    const source = String(
      taskData.value.options.in_the_main_lang
        ? currentSentence.value.sentence
        : currentSentence.value.sentence_translate,
    ).trim();

    // Очищаем текущее предложение от знаков препинания
    cleanedSentence.value = source
      .toLowerCase()
      .replace(/[{}|<>.,:;""!?\/]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    cleanedSentenceWords.value = cleanedSentence.value
      .split(" ")
      .filter(Boolean)
      .sort(() => Math.random() - 0.5);

    assembledWordsCount.value = 0;

    originalSentence.value = source.split(/\s+/).filter(Boolean);
    displayedSentence.value = [];
    isComplete.value = false;
    isStarted.value = true;
    timeIsUp.value = false;
    isWrong.value = false;

    successButtonsIndex.value = [];
    errorButtonsIndex.value = [];
  } else {
    isFinished.value = true;
  }
};

const moveToEnd = () => {
  sentences.value.shift();

  if (currentSentence.value.attempts >= 1) {
    currentSentence.value.attempts--;
    sentences.value.push(currentSentence.value);
  } else {
    taskResultCollection.value.push({
      is_correct: false,
      right_answer: "<b>" + currentSentence.value.sentence + "</b>",
      sentence_id: currentSentence.value.sentence_id,
    });

    reStudySentences.value.push(currentSentence.value);
  }
};

const checkSentence = (word, wordIndex) => {
  if (isStarted.value !== true) return;
  if (word === cleanedSentence.value.split(" ")[assembledWordsCount.value]) {
    if (cleanedSentence.value.length > assembledWordsCount.value) {
      assembledWordsCount.value++;
    }

    successButtonsIndex.value.push(wordIndex);

    displayedSentence.value.push(
      originalSentence.value[assembledWordsCount.value - 1]
    );

    if (assembledWordsCount.value === cleanedSentence.value.split(" ").length) {
      isComplete.value = true;
      isStarted.value = false;

      if (Boolean(taskData.value.options.play_audio_with_the_correct_answer)) {
        if (currentSentence.value.audio_file) {
          playSuccessSound(
            config.public.apiBase +
              "/media/get/" +
              currentSentence.value.audio_file
          );
        }
      }

      studiedSentences.value.push(currentSentence.value);

      taskResultCollection.value.push({
        is_correct: true,
        right_answer: "<b>" + currentSentence.value.sentence + "</b>",
        sentence_id: currentSentence.value.sentence_id,
      });

      if (
        reStudySentences.value.some(
          (s) => s.task_sentence_id === currentSentence.value.task_sentence_id
        )
      ) {
        reStudySentences.value = reStudySentences.value.filter(
          (s) => s.task_sentence_id !== currentSentence.value.task_sentence_id
        );
      }

      sentences.value.shift();

      setTimeout(() => {
        setSentence();
      }, 3000);
    }
  } else {
    errorButtonsIndex.value.push(wordIndex);

    if (
      Boolean(taskData.value.options.play_error_sound_with_the_incorrect_answer)
    ) {
      playErrorSound();
    }

    setTimeout(() => {
      errorButtonsIndex.value = [];
    }, 300);

    if (currentSentence.value.wrongWordAttempts >= 1) {
      --currentSentence.value.wrongWordAttempts;
    } else {
      moveToEnd();
      isWrong.value = true;
      isStarted.value = false;
    }
  }
};

const timerIsUp = () => {
  moveToEnd();
  timeIsUp.value = true;
  isStarted.value = false;
};

const handleKeyPress = (event) => {
  if (event.key === "Enter") {
    if (!isFinished.value) {
      if (timeIsUp.value === true || isWrong.value === true) {
        setSentence();
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
    if (newVal === taskData.value.sentences.length) {
      saveTaskResult();
    }
  }
);
</script>
