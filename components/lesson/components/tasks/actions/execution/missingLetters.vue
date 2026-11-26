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
                      <div class="flex gap-x-0.5">
                        <div
                          v-for="(letter, letterIndex) in word.word"
                          :key="letterIndex"
                          class="font-medium text-xl"
                        >
                          <div v-if="letter === ' ' || letter === ''" class="mx-1"></div>
                          <div
                            :class="word.missingLetters.includes(letterIndex + 1) && 'text-success'"
                            v-else
                          >
                            {{ letter }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <span class="text-sm text-inactive">{{ word.word_translate }}</span>
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

              <ul class="result-list" ref="wrongAnswers">
                <li
                  v-for="(word, rIndex) in currentReStudyWords"
                  :key="rIndex"
                  class="result-item bad"
                >
                  <div class="flex-1 min-w-0 flex flex-wrap gap-x-6 gap-y-2">
                    <div>
                      <p class="result-label">{{ $t("your_answer") }}</p>
                      <!-- Содержимое этого блока сохраняется как HTML ответа -->
                      <div :id="'user_answer_' + word.task_word_id">
                        <div class="flex gap-x-0.5">
                          <div
                            v-for="(letter, letterIndex) in word.word"
                            :key="letterIndex"
                            class="font-medium text-xl"
                          >
                            <div v-if="letter === ' ' || letter === ''" class="mx-1"></div>
                            <div
                              class="text-danger"
                              v-else-if="word.missingLetters.includes(letterIndex + 1)"
                            >
                              {{
                                word.userInput[letterIndex] === "" ||
                                word.userInput[letterIndex] === " "
                                  ? "_"
                                  : word.userInput[letterIndex]
                              }}
                            </div>
                            <div v-else>
                              {{ letter }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p class="result-label">{{ $t("right_answer") }}</p>
                      <!-- Содержимое этого блока сохраняется как HTML ответа -->
                      <div :id="'right_answer_' + word.task_word_id">
                        <div class="flex gap-x-0.5">
                          <div
                            v-for="(letter, letterIndex) in word.word"
                            :key="letterIndex"
                            class="font-medium text-xl"
                          >
                            <div v-if="letter === ' ' || letter === ''" class="mx-1"></div>
                            <div
                              :class="word.missingLetters.includes(letterIndex + 1) && 'text-success'"
                              v-else
                            >
                              {{ letter }}
                            </div>
                          </div>
                        </div>
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
          <div class="flex flex-col gap-3">
            <div
              v-for="(word, wordIndex) in currentWords"
              :key="wordIndex"
              class="blank-card"
            >
              <!-- Подсказки: картинка и озвучка -->
              <div
                v-if="word.image_file && taskData.options.show_image"
                class="letters-thumb"
                :style="{
                  backgroundImage:
                    'url(' + config.public.apiBase + '/media/get/' + word.image_file + ')',
                }"
                aria-hidden="true"
              ></div>

              <div class="flex-1 min-w-0 flex flex-col gap-2">
                <div class="letter-tiles">
                  <template v-for="(letter, letterIndex) in word.word" :key="letterIndex">
                    <span v-if="letter === ' ' || letter === ''" class="letter-gap"></span>
                    <label
                      v-else-if="word.missingLetters.includes(letterIndex + 1)"
                      class="letter-tile input"
                      :class="{
                        error: checkingStatus === true && word.userInput[letterIndex] === '',
                        filled: word.userInput[letterIndex],
                      }"
                    >
                      <input
                        v-model="word.userInput[letterIndex]"
                        @input="changeFocus($event)"
                        @keydown.backspace="backFocus($event)"
                        @focus="$event.target.select()"
                        type="text"
                        class="letter_input"
                        maxlength="1"
                        autocomplete="off"
                        autocorrect="off"
                        autocapitalize="none"
                        spellcheck="false"
                        :aria-label="$t('pages.tasks.letter_n', { n: letterIndex + 1 })"
                      />
                    </label>
                    <span v-else class="letter-tile" aria-hidden="true">{{ letter }}</span>
                  </template>
                </div>

                <div
                  v-if="taskData.options.show_transcription || taskData.options.show_translate"
                  class="flex flex-wrap gap-x-3 text-sm"
                >
                  <span v-if="taskData.options.show_transcription" class="text-inactive">
                    [{{ word.transcription }}]
                  </span>
                  <span v-if="taskData.options.show_translate" class="text-inactive">
                    {{ word.word_translate }}
                  </span>
                </div>
              </div>

              <audioButton
                v-if="word.audio_file && taskData.options.show_audio_button"
                :src="config.public.apiBase + '/media/get/' + word.audio_file"
              />
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
      "tasks/get/missing_letters/" + props.task.task_id,
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
      word.userInput = [];
      for (let letterIndex = 0; letterIndex < word.word.length; letterIndex++) {
        if (word.missingLetters.includes(letterIndex + 1)) {
          word.userInput[letterIndex] = "";
        }
      }
    });

    setTimeout(() => {
      const firstInput = document.querySelector(".letter_input");
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
      (w) => w.task_word_id !== word.task_word_id,
    );
    let wrongLetter = false;

    for (let letterIndex = 0; letterIndex < word.word.length; letterIndex++) {
      let currentLetterIndex = letterIndex;
      if (word.missingLetters.includes(currentLetterIndex + 1)) {
        if (
          word.word[currentLetterIndex].toLowerCase() !=
          word.userInput[currentLetterIndex].toLowerCase()
        ) {
          wrongLetter = true;
          break;
        }
      }
    }

    if (!wrongLetter) {
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
    "#right_answer_" + word.task_word_id,
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
      (w) => w.task_word_id !== word.task_word_id,
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
      "#user_answer_" + word.task_word_id,
    );

    const rightAnswer = wrongAnswers.value.querySelector(
      "#right_answer_" + word.task_word_id,
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

const acceptAnswers = () => {
  currentWords.value.forEach((word) => {
    for (let letterIndex = 0; letterIndex < word.word.length; letterIndex++) {
      if (
        word.userInput[letterIndex] === "" ||
        word.userInput[letterIndex] === " "
      ) {
        checkingStatus.value = true;
        break;
      }
    }
  });

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
  const value = currentInput.value.trim(); // убираем пробелы
  const inputs = Array.from(document.getElementsByClassName("letter_input"));
  const currentIndex = inputs.indexOf(currentInput);

  if (value === "") {
    // Найти предыдущий input
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (inputs[i]) {
        inputs[i].focus();
        break;
      }
    }
  } else {
    // Если введён пробел — очистить
    if (value === " ") {
      currentInput.value = "";
    } else {
      // Найти следующий пустой input
      for (let i = currentIndex + 1; i < inputs.length; i++) {
        if (inputs[i].value === "") {
          inputs[i].focus();
          break;
        }
      }
    }
  }
};

const backFocus = (event) => {
  const input = event.target;

  // если поле пустое → предыдущее поле ввода (пропуская готовые буквы)
  if (input.value === "") {
    const inputs = Array.from(document.getElementsByClassName("letter_input"));
    const prev = inputs[inputs.indexOf(input) - 1];
    if (prev) {
      event.preventDefault();
      prev.focus();
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
  },
);
</script>
