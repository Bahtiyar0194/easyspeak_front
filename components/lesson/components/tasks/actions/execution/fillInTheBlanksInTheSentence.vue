<template>
  <countdownTaskTimer v-if="showTaskTimer" />
  <div v-if="showMaterials" class="custom-grid">
    <materialsList :materials="materials" />
    <div class="col-span-12">
      <div class="btn-wrap justify-end">
        <button class="btn btn-light" @click="startTask()">
          <i class="pi pi-arrow-right"></i>
          {{ $t("pages.tasks.start_the_task") }}
        </button>
      </div>
    </div>
  </div>
  <div v-else class="custom-grid">
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
          <p v-else-if="sentences.length > 0" class="text-center">
            {{ $t("pages.sentences.sentences_left") }}:
            <b>{{ sentences.length }}</b>
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
              v-if="currentStudiedSentences.length > 0"
            >
              <p class="text-xl font-medium mb-0 text-success">
                {{
                  currentReStudySentences.length > 0
                    ? $t("right_answers")
                    : $t("right")
                }}
              </p>
              <ul class="list-group nowrap">
                <li
                  class="list-item"
                  v-for="(sentence, sIndex) in currentStudiedSentences"
                  :key="sIndex"
                >
                  <div class="flex justify-between items-center gap-x-2">
                    <div>
                      <div class="flex flex-wrap gap-x-1 font-medium">
                        <div
                          v-for="(word, wordIndex) in sentence.sentence.split(
                            ' '
                          )"
                          :key="wordIndex"
                        >
                          <span
                            :class="
                              wordIndex === sentence.missing_word_position &&
                              'text-success'
                            "
                            >{{ word }}</span
                          >
                        </div>
                      </div>
                      <p class="mb-0 text-xs text-inactive">
                        {{ sentence.sentence_translate }}
                      </p>
                    </div>

                    <div class="flex items-center">
                      <audioButton
                        v-if="sentence.audio_file"
                        :src="
                          config.public.apiBase +
                          '/media/get/' +
                          sentence.audio_file
                        "
                      />
                      <div class="step-item xs completed">
                        <div class="step-icon">
                          <i class="pi pi-check"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div
              class="flex flex-col gap-y-2"
              v-if="currentReStudySentences.length > 0"
            >
              <p class="text-xl font-medium mb-0 text-danger">
                {{ $t("for_re_examination") }}
              </p>
              <ul class="list-group nowrap">
                <li
                  class="list-item"
                  v-for="(sentence, rIndex) in currentReStudySentences"
                  :key="rIndex"
                >
                  <div class="flex justify-between items-center gap-x-2">
                    <div>
                      <p class="mb-0 text-xs text-inactive font-normal">
                        {{ $t("your_answer") }}:
                      </p>
                      <div class="flex flex-wrap gap-x-1 font-medium mb-2">
                        <div
                          v-for="(word, wordIndex) in sentence.sentence.split(
                            ' '
                          )"
                          :key="wordIndex"
                        >
                          <span
                            class="underline text-danger"
                            v-if="
                              wordIndex === sentence.missing_word_position &&
                              ((taskData?.options.find_word_with_options == 1 &&
                                sentence.selectedOptionIndex >= 0) ||
                                (taskData?.options.find_word_with_options ==
                                  0 &&
                                  sentence.userInput != ''))
                            "
                            >{{
                              taskData?.options.find_word_with_options == 1
                                ? sentence.missingWords[
                                    sentence.selectedOptionIndex
                                  ].word
                                : sentence.userInput
                            }}</span
                          >
                          <span
                            class="text-danger"
                            v-else-if="
                              wordIndex === sentence.missing_word_position &&
                              ((taskData?.options.find_word_with_options == 1 &&
                                !sentence.selectedOptionIndex) ||
                                (taskData?.options.find_word_with_options ==
                                  0 &&
                                  sentence.userInput === ''))
                            "
                            >____</span
                          >
                          <span v-else>{{ word }}</span>
                        </div>
                      </div>
                      <p class="mb-0 text-xs text-inactive font-normal">
                        {{ $t("right_answer") }}:
                      </p>
                      <div class="flex flex-wrap gap-x-1 font-medium">
                        <div
                          v-for="(word, wordIndex) in sentence.sentence.split(
                            ' '
                          )"
                          :key="wordIndex"
                        >
                          <span
                            class="underline text-success"
                            v-if="wordIndex === sentence.missing_word_position"
                            >{{ word }}</span
                          >
                          <span v-else>{{ word }}</span>
                        </div>
                        <p class="mb-0 text-xs text-inactive">
                          {{ sentence.sentence_translate }}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center">
                      <audioButton
                        v-if="sentence.audio_file"
                        :src="
                          config.public.apiBase +
                          '/media/get/' +
                          sentence.audio_file
                        "
                      />
                      <div class="step-item xs failed">
                        <div class="step-icon">
                          <i class="pi pi-replay"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div class="btn-wrap right">
              <button
                v-if="sentences.length > 0"
                class="btn btn-outline-primary"
                @click="setSentences()"
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
              <div class="btn-wrap">
                <button
                  v-for="(word, wordIndex) in hiddenWords"
                  :key="wordIndex"
                  type="button"
                  class="btn btn-light"
                  :class="{
                    disabled: word.disabled,
                    dragging: isDragging,
                    draggable: true,
                  }"
                  :draggable="true"
                  @dragstart="onDragStart($event, wordIndex)"
                  @touchstart="onTouchStart($event, wordIndex)"
                  @touchmove="onTouchMove"
                  @touchend="onTouchEnd"
                  @click="insertWordToInput(word)"
                >
                  {{ word.word }}
                </button>
              </div>
            </div>
            <div
              v-for="(sentence, sentenceIndex) in currentSentences"
              :key="sentenceIndex"
              class="col-span-12"
            >
              <div
                class="flex flex-wrap items-center gap-1 font-medium text-lg mb-2"
              >
                <span>{{ sentenceIndex + 1 }}.</span>
                <div
                  class="select-none"
                  v-for="(word, wordIndex) in sentence.sentence.split(' ')"
                  :key="wordIndex"
                >
                  <span
                    class="underline text-corp"
                    v-if="
                      wordIndex === sentence.missing_word_position &&
                      sentence.selectedOptionIndex >= 0
                    "
                    >{{
                      sentence.missingWords[sentence.selectedOptionIndex].word
                    }}</span
                  >
                  <div v-else-if="wordIndex === sentence.missing_word_position">
                    <div
                      v-if="taskData?.options.find_word_with_options == 0"
                      class="btn flex justify-center items-center"
                      :class="
                        unFilledSentences.includes(sentenceIndex)
                          ? 'pulse btn-danger'
                          : 'btn-active'
                      "
                      @drop="onDrop($event, sentenceIndex)"
                      @dragover="onDragOver"
                    >
                      <input
                        v-model="sentence.userInput"
                        :disabled="false"
                        :style="{
                          width:
                            sentence.userInput !== ''
                              ? sentence.userInput.length + 0.5 + 'ch'
                              : '4ch',
                          'text-align': 'center',
                        }"
                        @input="handleInput($event)"
                        type="text"
                      />
                      <button
                        v-if="sentence.userInput !== ''"
                        @click="clearInput(sentenceIndex)"
                        class="text-danger ml-0.5 mt-0.5"
                      >
                        <i class="pi pi-delete-left"></i>
                      </button>
                    </div>
                    <span v-else>_______</span>
                  </div>
                  <span v-else>{{ word }}</span>
                </div>
              </div>

              <div
                v-if="taskData?.options.find_word_with_options == 1"
                class="btn-wrap"
              >
                <button
                  v-for="(option, optionIndex) in sentence.missingWords"
                  :key="optionIndex"
                  type="button"
                  class="btn btn-sm btn-light"
                  :class="
                    unFilledSentences.includes(sentenceIndex)
                      ? 'pulse btn-danger'
                      : sentence.selectedOptionIndex === optionIndex &&
                        'text-hidden disabled'
                  "
                  @click="insertWord(sentenceIndex, optionIndex)"
                >
                  {{ option.word }}
                </button>
              </div>
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
      </div>
    </div>
    <result
      v-else
      :studiedSentences="studiedSentences"
      :reStudySentences="reStudySentences"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { useRouter } from "nuxt/app";
import audioButton from "../../../../../ui/audioButton.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import countdownTaskTimer from "../../../../../ui/countdownTaskTimer.vue";
import progressBar from "../../../../../ui/progressBar.vue";
import result from "../../results/sentences/result.vue";
import materialsList from "../../../materialsList.vue";
const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();

const showTaskTimer = ref(false);
const taskData = ref(null);
const materials = ref([]);
const showMaterials = ref(false);
const sentences = ref([]);
const currentSentences = ref([]);
const hiddenWords = ref([]);
const checkingStatus = ref(false);

const isDragging = ref(false);
const touchData = ref({ word: "", target: null });

const studiedSentences = ref([]);
const currentStudiedSentences = ref([]);

const reStudySentences = ref([]);
const currentReStudySentences = ref([]);

const unFilledSentences = ref([]);

const isStarted = ref(false);
const isComplete = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

const isFinished = ref(false);

const progressPercentage = computed(() => {
  const totalSentences = taskData.value?.sentences?.length || 0; // Предотвращаем ошибки, если данные ещё не загружены
  if (totalSentences === 0) return 0; // Если общее количество предложении равно 0, возвращаем 0
  const completedSentences = totalSentences - sentences.value.length;
  return (completedSentences / totalSentences) * 100;
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
      "tasks/fill_in_the_blanks_in_the_sentence/" + props.task.task_id
    );
    taskData.value = res.data;
    sentences.value = [...taskData.value.sentences];
    materials.value = taskData.value.materials;

    sentences.value.forEach((sentence) => {
      sentence.attempts = taskData.value.options.max_attempts;
    });

    if (materials.value.length > 0) {
      showMaterials.value = true;
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
  showMaterials.value = false;
  showTaskTimer.value = true;
  setTimeout(() => {
    setSentences();
    showTaskTimer.value = false;
  }, 3000);
};

const setSentences = () => {
  currentStudiedSentences.value = [];
  currentReStudySentences.value = [];
  hiddenWords.value = [];

  if (sentences.value.length > 0) {
    currentSentences.value = sentences.value.slice(
      0,
      taskData.value.options.impression_limit
    );

    currentSentences.value.forEach((sentence) => {
      if (taskData.value.options.find_word_with_options == 1) {
        sentence.selectedOptionIndex = undefined;
      } else {
        sentence.userInput = "";
        hiddenWords.value.push({
          word: sentence.sentence.split(" ")[sentence.missing_word_position],
          disabled: false,
        });
        hiddenWords.value.sort(() => Math.random() - 0.5);
      }
    });

    time.value =
      taskData.value.options.seconds_per_sentence *
      currentSentences.value.length;

    isComplete.value = false;
    isStarted.value = true;
    timeIsUp.value = false;
    checkingStatus.value = false;
  }
};

const onDragStart = (event, wordIndex) => {
  // Установить данные для перетаскивания
  event.dataTransfer.setData("wordIndex", wordIndex);
};

const onDrop = (event, sentenceIndex) => {
  // Остановить поведение по умолчанию
  event.preventDefault();

  // Получить данные из события
  const wIndex = event.dataTransfer.getData("wordIndex");

  const word = hiddenWords.value[wIndex];
  word.disabled = true;

  currentSentences.value[sentenceIndex].userInput = word.word;
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
};

const disableTheHiddenWord = (w) => {
  hiddenWords.value.forEach((word) => {
    if (w === word.word) {
      word.disabled = true;
    }
  });
};

const handleInput = (e) => {
  disableTheHiddenWord(e.target.value);
};

const insertWord = (sentenceIndex, optionIndex) => {
  sentences.value[sentenceIndex].selectedOptionIndex = optionIndex;
};

const insertWordToInput = (w) => {
  let emptyWordFind = false;
  currentSentences.value.forEach((sentence) => {
    if (sentence.userInput === "" && !emptyWordFind) {
      sentence.userInput = w.word;
      disableTheHiddenWord(w.word);
      emptyWordFind = true;
    }
  });
};

const clearInput = (sentenceIndex) => {
  enableTheHiddenWord(currentSentences.value[sentenceIndex].userInput);
  currentSentences.value[sentenceIndex].userInput = "";
};

const checkSentences = () => {
  currentSentences.value.forEach((sentence) => {
    sentences.value = sentences.value.filter(
      (s) => s.task_sentence_id !== sentence.task_sentence_id
    );

    if (
      (taskData.value.options.find_word_with_options == 0 &&
        sentence.userInput ===
          sentence.sentence.split(" ")[sentence.missing_word_position]) ||
      (taskData.value.options.find_word_with_options == 1 &&
        (sentence.selectedOptionIndex >= 0 &&
          sentence.missingWords[sentence.selectedOptionIndex].word) ===
          sentence.sentence.split(" ")[sentence.missing_word_position])
    ) {
      studiedSentences.value.push(sentence);
      currentStudiedSentences.value.push(sentence);

      if (
        reStudySentences.value.some(
          (s) => s.task_sentence_id === sentence.task_sentence_id
        )
      ) {
        reStudySentences.value = reStudySentences.value.filter(
          (s) => s.task_sentence_id !== sentence.task_sentence_id
        );
      }
    } else {
      currentReStudySentences.value.push(sentence);

      if (sentence.attempts >= 1) {
        sentences.value.push(sentence);
        sentence.attempts--;
      } else {
        reStudySentences.value.push(sentence);
      }
    }
  });
};

const acceptAnswers = () => {
  checkingStatus.value = true;
  currentSentences.value.forEach((sentence, sentenceIndex) => {
    if (taskData.value.options.find_word_with_options == 1) {
      if (sentence.selectedOptionIndex === undefined) {
        unFilledSentences.value.push(sentenceIndex);
      }
    } else {
      if (sentence.userInput === "") {
        unFilledSentences.value.push(sentenceIndex);
      }
    }
  });

  if (unFilledSentences.value.length > 0) {
    setTimeout(() => {
      unFilledSentences.value = [];
      checkingStatus.value = false;
    }, 1000);
  } else {
    isComplete.value = true;
    isStarted.value = false;
    checkSentences();
  }
};

const timerIsUp = () => {
  timeIsUp.value = true;
  isStarted.value = false;
  checkSentences();
};

const handleKeyPress = (event) => {
  if (event.key === "Enter") {
    if (!isFinished.value) {
      if (timeIsUp.value === true || isComplete.value === true) {
        if (sentences.value.length > 0) {
          setSentences();
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

// Инициализация при монтировании
onMounted(() => {
  getTask();
  changeModalSize("modal-xl");
  window.addEventListener("keydown", handleKeyPress);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyPress);
});
</script>
