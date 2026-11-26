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

              <ul class="result-list">
                <li
                  v-for="(word, sIndex) in currentStudiedWords"
                  :key="sIndex"
                  class="result-item ok"
                >
                  <div
                    v-if="word.image_file"
                    class="result-thumb"
                    :style="{
                      backgroundImage:
                        'url(' + config.public.apiBase + '/media/get/' + word.image_file + ')',
                    }"
                    aria-hidden="true"
                  ></div>
                  <span
                    v-if="taskData.options.match_words_by_pictures_option === 'match_by_number'"
                    class="match-sentence-num !bg-success"
                    >{{ word.userInput }}</span
                  >
                  <div class="flex-1 min-w-0">
                    <p class="mb-0 font-medium">{{ word.word }}</p>
                    <p class="mb-0 text-sm text-inactive">{{ word.word_translate }}</p>
                  </div>
                  <span class="result-status ok shrink-0" aria-hidden="true">
                    <i class="pi pi-check"></i>
                  </span>
                </li>
              </ul>
            </section>

            <section v-if="currentReStudyWords.length > 0" class="result-section">
              <p class="result-head bad">
                <span class="result-head-dot" aria-hidden="true"></span>
                {{ $t("for_re_examination") }}
                <span class="result-head-count">{{ currentReStudyWords.length }}</span>
              </p>

              <ul class="result-list">
                <li
                  v-for="(word, rIndex) in currentReStudyWords"
                  :key="rIndex"
                  class="result-item bad"
                >
                  <div
                    v-if="word.image_file"
                    class="result-thumb"
                    :style="{
                      backgroundImage:
                        'url(' + config.public.apiBase + '/media/get/' + word.image_file + ')',
                    }"
                    aria-hidden="true"
                  ></div>

                  <div class="flex-1 min-w-0 flex flex-wrap gap-x-6 gap-y-2">
                    <div>
                      <p class="result-label">{{ $t("your_answer") }}</p>
                      <!-- По номеру -->
                      <div
                        v-if="taskData.options.match_words_by_pictures_option === 'match_by_number'"
                        class="flex items-center gap-2"
                      >
                        <span class="match-sentence-num !bg-danger">{{ word.userInput || "–" }}</span>
                        <span class="font-medium">{{ word.word }}</span>
                      </div>
                      <!-- Вписанное слово -->
                      <div v-else>
                        <p class="mb-0 font-medium result-answer strike">
                          {{ typedAnswerFor(word) || "_______" }}
                        </p>
                        <p class="mb-0 text-sm text-inactive">
                          {{ findTranslate(typedAnswerFor(word)) }}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p class="result-label">{{ $t("right_answer") }}</p>
                      <div
                        v-if="taskData.options.match_words_by_pictures_option === 'match_by_number'"
                        class="flex items-center gap-2"
                      >
                        <span class="match-sentence-num !bg-success">{{
                          currentPictures.findIndex((p) => p.task_word_id === word.task_word_id) + 1
                        }}</span>
                        <span class="font-medium">{{ word.word }}</span>
                      </div>
                      <div v-else>
                        <p class="mb-0 font-medium text-success">{{ word.word }}</p>
                        <p class="mb-0 text-sm text-inactive">{{ word.word_translate }}</p>
                      </div>
                    </div>
                  </div>

                  <span class="result-status bad shrink-0" aria-hidden="true">
                    <i class="pi pi-replay"></i>
                  </span>
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
          <div class="flex flex-col gap-4">
            <!-- ===== Режим «по номеру» ===== -->
            <template v-if="taskData.options.match_words_by_pictures_option === 'match_by_number'">
              <p class="mb-0 text-sm text-inactive flex items-center gap-1.5">
                <i class="pi pi-info-circle" aria-hidden="true"></i>
                {{ $t("pages.tasks.match_pictures_hint") }}
              </p>

              <div class="grid gap-4 lg:grid-cols-2">
                <!-- Пронумерованные картинки -->
                <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2 content-start">
                  <div
                    v-for="(picture, pictureIndex) in currentPictures"
                    :key="pictureIndex"
                    class="picture-card"
                  >
                    <span class="picture-num">{{ pictureIndex + 1 }}</span>
                    <img
                      v-skeleton="'1/1'"
                      class="w-full aspect-square object-contain p-2"
                      :src="config.public.apiBase + '/media/get/' + picture.image_file"
                      alt=""
                    />
                  </div>
                </div>

                <!-- Слова с полем для номера картинки -->
                <ul class="flex flex-col gap-2 list-none p-0 m-0">
                  <li
                    v-for="(word, wordIndex) in currentWords"
                    :key="wordIndex"
                    class="word-row"
                  >
                    <label
                      class="match-number"
                      :class="{
                        error:
                          checkingStatus === true &&
                          (word.userInput === '' || word.userInput === ' '),
                        filled: word.userInput,
                      }"
                    >
                      <span class="sr-only">{{ $t("pages.tasks.picture_number") }}</span>
                      <input
                        v-model="word.userInput"
                        @input="changeFocus($event)"
                        @focus="$event.target.select()"
                        type="text"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        autocomplete="off"
                        class="user_input"
                        placeholder="#"
                        :maxlength="currentWords.length.toString().length"
                      />
                    </label>

                    <div class="flex-1 min-w-0">
                      <p class="mb-0 font-semibold text-lg leading-tight">{{ word.word }}</p>
                      <div class="flex flex-wrap gap-x-2 text-sm text-inactive">
                        <span v-if="taskData?.options?.show_transcription">[{{ word.transcription }}]</span>
                        <span v-if="taskData?.options?.show_translate">{{ word.word_translate }}</span>
                      </div>
                    </div>

                    <audioButtonMini
                      v-if="word.audio_file && taskData?.options?.show_audio_button"
                      :src="config.public.apiBase + '/media/get/' + word.audio_file"
                    />
                  </li>
                </ul>
              </div>
            </template>

            <!-- ===== Режим «впиши слово» ===== -->
            <template v-else-if="taskData.options.match_words_by_pictures_option === 'match_by_typing'">
              <!-- Банк слов: нажать или перетащить на картинку -->
              <div class="word-bank !justify-start">
                <button
                  v-for="(word, wordIndex) in currentWords"
                  :key="wordIndex"
                  type="button"
                  class="word-chip gap-2"
                  :class="{ used: word.disabled }"
                  :disabled="word.disabled"
                  :draggable="!word.disabled"
                  @dragstart="onDragStart($event, wordIndex)"
                  @click="insertWordToInput(word)"
                >
                  <audioButtonMini
                    v-if="word.audio_file && taskData.options.show_audio_button && !word.disabled"
                    :src="config.public.apiBase + '/media/get/' + word.audio_file"
                    @click.stop
                  />
                  <span class="flex flex-col items-start leading-tight">
                    <span>{{ word.word }}</span>
                    <span
                      v-if="taskData?.options?.show_transcription || taskData?.options?.show_translate"
                      class="text-xs font-normal"
                      :class="word.disabled ? 'text-transparent' : 'text-inactive'"
                    >
                      <template v-if="taskData?.options?.show_transcription">[{{ word.transcription }}]</template>
                      <template v-if="taskData?.options?.show_translate"> {{ word.word_translate }}</template>
                    </span>
                  </span>
                </button>
              </div>

              <!-- Картинки с полем для слова -->
              <div class="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div
                  v-for="(picture, pictureIndex) in currentPictures"
                  :key="pictureIndex"
                  class="picture-card"
                  @drop="onDrop($event, pictureIndex)"
                  @dragover="onDragOver"
                >
                  <img
                    v-skeleton="'1/1'"
                    class="w-full aspect-square object-contain p-3"
                    :src="config.public.apiBase + '/media/get/' + picture.image_file"
                    alt=""
                  />
                  <div class="picture-answer">
                    <div
                      class="blank-input w-full"
                      :class="{
                        error:
                          checkingStatus === true &&
                          (picture.userInput === '' || picture.userInput === ' '),
                      }"
                    >
                      <input
                        v-model="picture.userInput"
                        class="!w-full"
                        type="text"
                        autocomplete="off"
                        autocorrect="off"
                        autocapitalize="none"
                        spellcheck="false"
                        :placeholder="$t('pages.tasks.type_or_drop_word')"
                        :aria-label="$t('pages.tasks.picture_n', { n: pictureIndex + 1 })"
                        @input="disableTheHiddenWord()"
                      />
                      <button
                        type="button"
                        v-if="picture.userInput !== ''"
                        @click="clearInput(pictureIndex)"
                        class="blank-clear"
                        :aria-label="$t('reset_search_filter')"
                      >
                        <i class="pi pi-times" aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>

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
const currentPictures = ref([]);
const checkingStatus = ref(false);

const studiedWords = ref([]);
const currentStudiedWords = ref([]);

const reStudyWords = ref([]);
const currentReStudyWords = ref([]);

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
      "tasks/get/match_words_by_pictures/" + props.task.task_id
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
    const currentWordsCollection =
      taskData.value.options.impression_limit > 0
        ? words.value.slice(0, taskData.value.options.impression_limit)
        : words.value;

    currentWords.value =
      taskData.value.options.random_order === 1
        ? [...currentWordsCollection].sort(() => Math.random() - 0.5)
        : [...currentWordsCollection];

    currentPictures.value =
      taskData.value.options.random_order_pictures === 1
        ? [...currentWordsCollection].sort(() => Math.random() - 0.5)
        : [...currentWordsCollection];

    if (
      taskData.value.options.match_words_by_pictures_option ===
      "match_by_typing"
    ) {
      currentPictures.value.forEach((picture) => {
        picture.userInput = "";
      });

      currentWords.value.forEach((word) => {
        word.disabled = false;
      });
    } else if (
      taskData.value.options.match_words_by_pictures_option ===
      "match_by_number"
    ) {
      currentWords.value.forEach((word) => {
        word.userInput = "";
      });
    }

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

const onDragStart = (event, wordIndex) => {
  // Установить данные для перетаскивания
  event.dataTransfer.setData("wordIndex", wordIndex);
};

const onDrop = (event, pictureIndex) => {
  // Остановить поведение по умолчанию
  event.preventDefault();

  // Получить данные из события
  const wIndex = event.dataTransfer.getData("wordIndex");

  const word = currentWords.value[wIndex];
  word.disabled = true;

  currentPictures.value[pictureIndex].userInput = word.word;
  disableTheHiddenWord();
};

const onDragOver = (event) => {
  // Остановить поведение по умолчанию, чтобы разрешить drop
  event.preventDefault();
};

const disableTheHiddenWord = () => {
  const userInputs = [];

  currentPictures.value.forEach((picture) => {
    if (picture.userInput.length > 0) {
      userInputs.push({
        word: picture.userInput.toLowerCase(),
        disabled: false,
      });
    }
  });

  currentWords.value.forEach((word) => {
    const userInput = userInputs.find(
      (w) => w.word === word.word.toLowerCase() && w.disabled === false
    );
    if (userInput) {
      word.disabled = true;
      userInput.disabled = true;
    } else {
      word.disabled = false;
    }
  });
};

const insertWordToInput = (w) => {
  let emptyWordFind = false;
  currentPictures.value.forEach((picture) => {
    if (picture.userInput === "" && !emptyWordFind) {
      picture.userInput = w.word;
      disableTheHiddenWord();
      emptyWordFind = true;
    }
  });
};

const clearInput = (pictureIndex) => {
  currentPictures.value[pictureIndex].userInput = "";
  disableTheHiddenWord();
};

// Проверка всех слов
const checkWords = () => {
  if (
    taskData.value.options.match_words_by_pictures_option === "match_by_typing"
  ) {
    currentPictures.value.forEach((picture) => {
      const word = currentWords.value.find(
        (w) => picture.task_word_id === w.task_word_id
      );

      words.value = words.value.filter(
        (w) => w.task_word_id !== word.task_word_id
      );

      if (word.word.toLowerCase() === picture.userInput.toLowerCase()) {
        pushToStudyWords(word);
      } else {
        pushToCurrentReStudyWords(word);
      }
    });
  } else if (
    taskData.value.options.match_words_by_pictures_option === "match_by_number"
  ) {
    currentWords.value.forEach((word) => {
      words.value = words.value.filter(
        (w) => w.task_word_id !== word.task_word_id
      );

      if (
        /^\d+$/.test(word.userInput) &&
        currentPictures.value[word.userInput - 1] &&
        word.task_word_id ===
          currentPictures.value[word.userInput - 1].task_word_id
      ) {
        pushToStudyWords(word);
      } else {
        pushToCurrentReStudyWords(word);
      }
    });
  }
};

const pushToStudyWords = async (word) => {
  studiedWords.value.push(word);
  currentStudiedWords.value.push(word);

  taskResultCollection.value.push({
    is_correct: true,
    right_answer:
      taskData.value.options.match_words_by_pictures_option ===
      "match_by_typing"
        ? "<b class='text-success'>" + word.word + "</b>"
        : "<div class='flex items-center gap-x-2'><div class='btn btn-square btn-outline-success pointer-events-none font-medium'>" +
          (currentPictures.value.findIndex(
            (p) => p.task_word_id === word.task_word_id
          ) +
            1) +
          "</div><div class='flex flex-col'><div class='font-medium'>" +
          word.word +
          "</div><span class='text-xs text-inactive'>" +
          word.word_translate +
          "</span></div></div>",
    word_id: word.word_id,
  });

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
    taskResultCollection.value.push({
      is_correct: false,
      user_answer:
        taskData.value.options.match_words_by_pictures_option ===
        "match_by_typing"
          ? "<b class='text-danger'>" +
            (currentPictures.value.find(
              (p) => p.task_word_id === word.task_word_id
            )?.userInput || "______") +
            "</b>"
          : "<div class='flex items-center gap-x-2'><div class='btn btn-square btn-outline-danger pointer-events-none font-medium'>" +
            currentWords.value.find((w) => w.task_word_id === word.task_word_id)
              .userInput +
            "</div><div class='flex flex-col'><div class='font-medium'>" +
            word.word +
            "</div><span class='text-xs text-inactive'>" +
            word.word_translate +
            "</span></div></div>",

      right_answer:
        taskData.value.options.match_words_by_pictures_option ===
        "match_by_typing"
          ? "<b class='text-success'>" + word.word + "</b>"
          : "<div class='flex items-center gap-x-2'><div class='btn btn-square btn-outline-success pointer-events-none font-medium'>" +
            (currentPictures.value.findIndex(
              (p) => p.task_word_id === word.task_word_id
            ) +
              1) +
            "</div><div class='flex flex-col'><div class='font-medium'>" +
            word.word +
            "</div><span class='text-xs text-inactive'>" +
            word.word_translate +
            "</span></div></div>",
      word_id: word.word_id,
    });

    reStudyWords.value.push(word);
  }
};

const acceptAnswers = () => {
  if (
    taskData.value.options.match_words_by_pictures_option === "match_by_typing"
  ) {
    for (
      let pictureIndex = 0;
      pictureIndex < currentPictures.value.length;
      pictureIndex++
    ) {
      const picture = currentPictures.value[pictureIndex];

      if (picture.userInput === "" || picture.userInput === " ") {
        checkingStatus.value = true;
        break;
      }
    }
  } else if (
    taskData.value.options.match_words_by_pictures_option === "match_by_number"
  ) {
    for (
      let wordIndex = 0;
      wordIndex < currentWords.value.length;
      wordIndex++
    ) {
      const word = currentWords.value[wordIndex];

      if (word.userInput === "" || word.userInput === " ") {
        checkingStatus.value = true;
        break;
      }
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

const focusInput = (event) => {
  const input = event.currentTarget.querySelector("input");
  if (input) {
    input.focus();
  }
};

const changeFocus = (event) => {
  const currentInput = event.target;
  // в поле номера — только цифры
  const digits = currentInput.value.replace(/\D/g, "");
  if (digits !== currentInput.value) {
    currentInput.value = digits;
    currentInput.dispatchEvent(new Event("input"));
    return false;
  }
  const value = currentInput.value;

  if (value === "") {
    return false;
  } else if (value === " ") {
    currentInput.value = ""; // ← исправлено
  } else {
    const inputs = Array.from(document.getElementsByClassName("user_input"));
    const currentIndex = inputs.indexOf(currentInput);

    // Найти следующий пустой input
    for (let i = currentIndex + 1; i < inputs.length; i++) {
      if (inputs[i].value === "") {
        inputs[i].focus();
        break;
      }
    }
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

// Что ученик вписал под картинкой этого слова
const typedAnswerFor = (word) =>
  currentPictures.value.find((p) => p.task_word_id === word.task_word_id)
    ?.userInput?.trim() || "";

const findTranslate = (w) => {
  for (const picture of currentPictures.value) {
    if (String(w || "").toLowerCase() === picture.word.toLowerCase()) {
      return picture.word_translate;
    }
  }

  return "________";
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
