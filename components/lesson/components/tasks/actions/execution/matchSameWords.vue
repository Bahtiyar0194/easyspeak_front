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
      :reStudyItems="reStudySections"
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
            <p v-else-if="sections.length > 0" class="mb-0 text-inactive">
              {{ $t("pages.sections.sections_left") }}:
              <b class="text-active">{{ sections.length }}</b>
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
            <section v-if="currentStudiedSections.length > 0" class="result-section">
              <p class="result-head ok">
                <span class="result-head-dot" aria-hidden="true"></span>
                {{ currentReStudySections.length > 0 ? $t("right_answers") : $t("right") }}
                <span class="result-head-count">{{ currentStudiedSections.length }}</span>
              </p>

              <ul class="result-list" ref="rightAnswers">
                <li
                  v-for="(section, sIndex) in currentStudiedSections"
                  :key="sIndex"
                  class="result-item ok"
                >
                  <div class="flex-1 min-w-0">
                    <!-- Содержимое этого блока сохраняется как HTML ответа -->
                    <div :id="'right_answer_' + section.word_section_id">
                      <div class="btn-wrap items-center">
                        <div
                          v-for="(word, wordIndex) in section.words"
                          :key="wordIndex"
                          class="text-success"
                        >
                          <div class="flex items-center gap-x-2">
                            <div class="flex flex-col">
                              <b class="mb-0">{{
                                word.target === 1
                                  ? section.words.find(
                                      (w) => w.word.toLowerCase() === word.userInput.toLowerCase(),
                                    ).word
                                  : word.word
                              }}</b>
                              <span class="text-xs text-inactive">
                                {{
                                  word.target === 1
                                    ? section.words.find(
                                        (w) => w.word.toLowerCase() === word.userInput.toLowerCase(),
                                      ).word_translate
                                    : word.word_translate
                                }}
                              </span>
                            </div>
                            <span v-if="wordIndex + 1 < section.words.length" class="text-active">-</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span class="result-status ok shrink-0" aria-hidden="true">
                    <i class="pi pi-check"></i>
                  </span>
                </li>
              </ul>
            </section>

            <section v-if="currentReStudySections.length > 0" class="result-section">
              <p class="result-head bad">
                <span class="result-head-dot" aria-hidden="true"></span>
                {{ $t("for_re_examination") }}
                <span class="result-head-count">{{ currentReStudySections.length }}</span>
              </p>

              <ul class="result-list" ref="wrongAnswers">
                <li
                  v-for="(section, rIndex) in currentReStudySections"
                  :key="rIndex"
                  class="result-item bad"
                >
                  <div class="flex-1 min-w-0 flex flex-col gap-3">
                    <div>
                      <p class="result-label">{{ $t("your_answer") }}</p>
                      <!-- Содержимое этого блока сохраняется как HTML ответа -->
                      <div :id="'user_answer_' + section.word_section_id">
                        <div class="btn-wrap items-center">
                          <div v-for="(word, wordIndex) in section.words" :key="wordIndex">
                            <div class="flex items-center gap-x-2">
                              <div class="flex flex-col">
                                <b
                                  class="mb-0"
                                  :class="
                                    word.target === 0 ||
                                    section.words.find(
                                      (w) => w.word.toLowerCase() === word.userInput.toLowerCase(),
                                    )
                                      ? 'text-success'
                                      : 'text-danger'
                                  "
                                  >{{
                                    word.target === 1
                                      ? word.userInput === "" || word.userInput === " "
                                        ? "________"
                                        : !section.words.find(
                                              (w) =>
                                                w.word.toLowerCase() === word.userInput.toLowerCase(),
                                            )
                                          ? word.userInput
                                          : section.words.find(
                                              (w) =>
                                                w.word.toLowerCase() === word.userInput.toLowerCase(),
                                            ).word
                                      : word.word
                                  }}</b
                                >
                                <span class="text-xs text-inactive">
                                  {{
                                    word.target === 1
                                      ? word.userInput === "" ||
                                        word.userInput === " " ||
                                        !section.words.find(
                                          (w) => w.word.toLowerCase() === word.userInput.toLowerCase(),
                                        )
                                        ? findTranslate(word.userInput)
                                        : section.words.find(
                                            (w) => w.word.toLowerCase() === word.userInput.toLowerCase(),
                                          ).word_translate
                                      : word.word_translate
                                  }}
                                </span>
                              </div>
                              <span v-if="wordIndex + 1 < section.words.length" class="text-active">-</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p class="result-label">{{ $t("right_answer") }}</p>
                      <!-- Содержимое этого блока сохраняется как HTML ответа -->
                      <div :id="'right_answer_' + section.word_section_id">
                        <div class="btn-wrap items-center">
                          <div
                            v-for="(word, wordIndex) in section.words"
                            :key="wordIndex"
                            class="text-success"
                          >
                            <div class="flex items-center gap-x-2">
                              <div class="flex flex-col">
                                <b class="mb-0">{{ word.word }}</b>
                                <span class="text-xs text-inactive">{{ word.word_translate }}</span>
                              </div>
                              <span v-if="wordIndex + 1 < section.words.length" class="text-active">-</span>
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
                v-if="sections.length > 0"
                class="btn btn-primary"
                @click="setSections()"
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
            <!-- Банк слов -->
            <div class="word-bank">
              <button
                v-for="(word, wordIndex) in hiddenWords"
                :key="wordIndex"
                type="button"
                class="word-chip gap-2"
                :class="{ used: word.disabled }"
                :disabled="
                  word.disabled ||
                  (taskData.options.match_by_drag_and_drop != 1 &&
                    taskData.options.match_by_clicking != 1)
                "
                :draggable="taskData.options.match_by_drag_and_drop == 1 && !word.disabled"
                @dragstart="onDragStart($event, wordIndex)"
                @click="insertWord(word)"
              >
                <audioButtonMini
                  v-if="word.audio_file && taskData.options.show_audio_button && !word.disabled"
                  :src="config.public.apiBase + '/media/get/' + word.audio_file"
                  @click.stop
                />
                <span>
                  <span
                    v-for="(letter, letterIndex) in word.word"
                    :key="letterIndex"
                    :class="
                      !word.disabled &&
                      word.missingLetters &&
                      word.missingLetters.includes(letterIndex + 1) &&
                      'text-corp'
                    "
                    >{{ letter }}</span
                  >
                </span>
              </button>
            </div>

            <!-- Группы слов: найдите пару -->
            <div
              v-for="(section, sectionIndex) in currentSections"
              :key="sectionIndex"
              class="blank-card items-center"
            >
              <span class="blank-card-num !mt-0" aria-hidden="true">{{ sectionIndex + 1 }}</span>
              <div class="pair-row">
                <template v-for="(word, wordIndex) in section.words" :key="wordIndex">
                  <span v-if="wordIndex > 0" class="pair-link" aria-hidden="true">=</span>

                  <!-- Пропуск: вписать, нажать слово или перетащить -->
                  <div
                    v-if="word.target == 1"
                    class="blank-input"
                    :class="{
                      error:
                        unFilledSections[sectionIndex] &&
                        unFilledSections[sectionIndex].includes(wordIndex),
                    }"
                    @drop="onDrop($event, sectionIndex, wordIndex)"
                    @dragover="onDragOver"
                  >
                    <audioButtonMini
                      v-if="
                        hiddenWords.find(
                          (w) => w.word.toLowerCase() === word.userInput.toLowerCase(),
                        )?.audio_file
                      "
                      :src="
                        config.public.apiBase +
                        '/media/get/' +
                        hiddenWords.find(
                          (w) => w.word.toLowerCase() === word.userInput.toLowerCase(),
                        ).audio_file
                      "
                      @click.stop
                    />
                    <input
                      v-model="word.userInput"
                      :disabled="taskData.options.match_by_typing != 1"
                      :style="{
                        width: word.userInput !== '' ? word.userInput.length + 1 + 'ch' : '6ch',
                      }"
                      type="text"
                      autocomplete="off"
                      autocorrect="off"
                      autocapitalize="none"
                      spellcheck="false"
                      :aria-label="$t('pages.tasks.blank_n', { n: sectionIndex + 1 })"
                      @input="disableTheHiddenWord()"
                    />
                    <button
                      type="button"
                      v-if="word.userInput !== ''"
                      @click="clearInput(sectionIndex, wordIndex)"
                      class="blank-clear"
                      :aria-label="$t('reset_search_filter')"
                    >
                      <i class="pi pi-times" aria-hidden="true"></i>
                    </button>
                  </div>

                  <!-- Данное слово -->
                  <span v-else class="pair-word">
                    <audioButtonMini
                      v-if="word.audio_file && taskData.options.show_audio_button"
                      :src="config.public.apiBase + '/media/get/' + word.audio_file"
                      @click.stop
                    />
                    <span>
                      <span
                        v-for="(letter, letterIndex) in word.word"
                        :key="letterIndex"
                        :class="
                          word.missingLetters &&
                          word.missingLetters.includes(letterIndex + 1) &&
                          'text-corp'
                        "
                        >{{ letter }}</span
                      >
                    </span>
                  </span>
                </template>
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
        <div class="col-span-12">
          <canvas id="confetti-canvas"></canvas>
          <div class="flex flex-col gap-5">
            <section v-if="studiedSections.length > 0" class="result-section">
              <p class="result-head ok">
                <span class="result-head-dot" aria-hidden="true"></span>
                {{ $t("pages.sections.studied_sections") }}
                <span class="result-head-count">{{ studiedSections.length }}</span>
              </p>
              <ul class="result-list">
                <li
                  v-for="(section, sIndex) in studiedSections"
                  :key="sIndex"
                  class="result-item ok"
                >
                  <div class="flex-1 min-w-0 pair-row">
                    <template v-for="(word, wordIndex) in section.words" :key="wordIndex">
                      <span v-if="wordIndex > 0" class="pair-link" aria-hidden="true">=</span>
                      <span class="flex flex-col">
                        <b class="text-success">{{
                          word.target === 1
                            ? section.words.find(
                                (w) => w.word.toLowerCase() === word.userInput.toLowerCase(),
                              )?.word || word.word
                            : word.word
                        }}</b>
                        <span class="text-xs text-inactive">{{ word.word_translate }}</span>
                      </span>
                    </template>
                  </div>
                  <span class="result-status ok shrink-0" aria-hidden="true">
                    <i class="pi pi-check"></i>
                  </span>
                </li>
              </ul>
            </section>

            <section v-if="reStudySections.length > 0" class="result-section">
              <p class="result-head bad">
                <span class="result-head-dot" aria-hidden="true"></span>
                {{ $t("pages.sections.unstudied_sections") }}
                <span class="result-head-count">{{ reStudySections.length }}</span>
              </p>
              <ul class="result-list">
                <li
                  v-for="(section, rIndex) in reStudySections"
                  :key="rIndex"
                  class="result-item bad"
                >
                  <div class="flex-1 min-w-0 pair-row">
                    <template v-for="(word, wordIndex) in section.words" :key="wordIndex">
                      <span v-if="wordIndex > 0" class="pair-link" aria-hidden="true">=</span>
                      <span class="flex flex-col">
                        <b>{{ word.word }}</b>
                        <span class="text-xs text-inactive">{{ word.word_translate }}</span>
                      </span>
                    </template>
                  </div>
                  <span class="result-status bad shrink-0" aria-hidden="true">
                    <i class="pi pi-replay"></i>
                  </span>
                </li>
              </ul>
            </section>
          </div>
        </div>
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
import audioButtonMini from "../../../../../ui/audioButtonMini.vue";

const config = useRuntimeConfig();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const errors = ref([]);

const showTaskTimer = ref(false);
const taskData = ref(null);
const materials = ref([]);
const showMaterialsOption = ref("");
const showMaterialsBeforeTask = ref(false);
const sections = ref([]);
const currentSections = ref([]);
const hiddenWords = ref([]);
const checkingStatus = ref(false);

const studiedSections = ref([]);
const currentStudiedSections = ref([]);

const reStudySections = ref([]);
const currentReStudySections = ref([]);

const unFilledSections = ref([]);

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
  const totalSections = taskData.value?.word_sections?.length || 0; // Предотвращаем ошибки, если данные ещё не загружены
  if (totalSections === 0) return 0; // Если общее количество предложении равно 0, возвращаем 0
  const completedSections = totalSections - sections.value.length;
  return (completedSections / totalSections) * 100;
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
      "tasks/get/match_same_words/" + props.task.task_id
    );
    taskData.value = res.data;
    onStartTask();
    showMaterialsOption.value = taskData.value.options.show_materials_option;
    materials.value = taskData.value.materials;

    sections.value = [...taskData.value.word_sections];

    sections.value.forEach((section) => {
      section.attempts = taskData.value.options.max_attempts;
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
    setSections();
    showTaskTimer.value = false;
  }, 3000);
};

const setSections = () => {
  currentStudiedSections.value = [];
  currentReStudySections.value = [];
  hiddenWords.value = [];

  if (sections.value.length > 0) {
    currentSections.value =
      taskData.value.options.impression_limit > 0
        ? sections.value.slice(0, taskData.value.options.impression_limit)
        : sections.value;

    currentSections.value.forEach((section) => {
      section.words.forEach((word) => {
        if (word.target == 1) {
          word.userInput = "";
          word.disabled = false;
          hiddenWords.value.push(word);
        }
      });
    });

    hiddenWords.value = [...hiddenWords.value].sort(() => Math.random() - 0.5);

    time.value =
      taskData.value.options.seconds_per_section * currentSections.value.length;

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

const onDrop = (event, sectionIndex, wordIndex) => {
  // Остановить поведение по умолчанию
  event.preventDefault();

  // Получить данные из события
  const wIndex = event.dataTransfer.getData("wordIndex");

  const word = hiddenWords.value[wIndex];
  word.disabled = true;

  currentSections.value[sectionIndex].words[wordIndex].userInput = word.word;
  disableTheHiddenWord();
};

const onDragOver = (event) => {
  // Остановить поведение по умолчанию, чтобы разрешить drop
  event.preventDefault();
};

const disableTheHiddenWord = () => {
  const userInputs = [];

  currentSections.value.forEach((section) => {
    section.words.forEach((word) => {
      if (word.target === 1 && word.userInput.length > 0) {
        userInputs.push({
          word: word.userInput.toLowerCase(),
          disabled: false,
        });
      }
    });
  });

  hiddenWords.value.forEach((word) => {
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

const insertWord = (w) => {
  if (taskData.value.options.match_by_clicking == 1) {
    let emptyWordFind = false;
    currentSections.value.forEach((section) => {
      section.words.forEach((word) => {
        if (word.userInput === "" && !emptyWordFind) {
          word.userInput = w.word;
          disableTheHiddenWord();
          emptyWordFind = true;
        }
      });
    });
  }
};

const clearInput = (sectionIndex, wordIndex) => {
  currentSections.value[sectionIndex].words[wordIndex].userInput = "";
  disableTheHiddenWord();
};

const checkSections = () => {
  currentSections.value.forEach((section) => {
    // Удаляем секцию из общего списка
    sections.value = sections.value.filter(
      (ws) => ws.word_section_id !== section.word_section_id
    );

    // Формируем множества правильных и введённых слов
    const correctWords = section.words
      .filter((word) => word.target === 1)
      .map((word) => word.word.toLowerCase())
      .sort(); // Сортируем для корректного сравнения

    const userWords = section.words
      .filter((word) => word.target === 1)
      .map((word) => word.userInput.toLowerCase())
      .sort();

    // Проверяем, совпадают ли списки (игнорируем порядок)
    const sectionFailed =
      JSON.stringify(correctWords) !== JSON.stringify(userWords);

    if (!sectionFailed) {
      pushToStudySections(section);
    } else {
      pushToCurrentReStudySections(section);
    }
  });
};

const pushToStudySections = async (section) => {
  // Секция пройдена
  studiedSections.value.push(section);
  currentStudiedSections.value.push(section);

  await nextTick();
  const answer = rightAnswers.value.querySelector(
    "#right_answer_" + section.word_section_id
  );

  if (answer) {
    taskResultCollection.value.push({
      is_correct: true,
      right_answer: answer.innerHTML,
    });
  }

  // Убираем её из reStudySections, если она там есть
  reStudySections.value = reStudySections.value.filter(
    (ws) => ws.word_section_id !== section.word_section_id
  );
};

const pushToCurrentReStudySections = async (section) => {
  // Секция не пройдена
  currentReStudySections.value.push(section);

  if (section.attempts > 0) {
    section.attempts--; // Уменьшаем попытки
    sections.value.push(section);
  } else {
    await nextTick();
    const userAnswer = wrongAnswers.value.querySelector(
      "#user_answer_" + section.word_section_id
    );

    const rightAnswer = wrongAnswers.value.querySelector(
      "#right_answer_" + section.word_section_id
    );

    if (userAnswer && rightAnswer) {
      taskResultCollection.value.push({
        is_correct: false,
        user_answer: userAnswer.innerHTML,
        right_answer: rightAnswer.innerHTML,
      });
    }

    reStudySections.value.push(section); // Переносим в reStudySections
  }
};

const acceptAnswers = () => {
  checkingStatus.value = true;
  currentSections.value.forEach((section, sectionIndex) => {
    section.words.forEach((word, wordIndex) => {
      if (word.userInput === "") {
        if (!unFilledSections.value[sectionIndex]) {
          unFilledSections.value[sectionIndex] = [];
        }
        unFilledSections.value[sectionIndex].push(wordIndex);
      }
    });
  });

  if (unFilledSections.value.length > 0) {
    setTimeout(() => {
      unFilledSections.value = [];
      checkingStatus.value = false;
    }, 1000);
  } else {
    isComplete.value = true;
    isStarted.value = false;
    checkSections();
  }
};

const timerIsUp = () => {
  timeIsUp.value = true;
  isStarted.value = false;
  checkSections();
};

const handleKeyPress = (event) => {
  if (event.key === "Enter") {
    if (!isFinished.value) {
      if (timeIsUp.value === true || isComplete.value === true) {
        if (sections.value.length > 0) {
          setSections();
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

const findTranslate = (w) => {
  for (const section of currentSections.value) {
    for (const word of section.words) {
      if (String(w || "").toLowerCase() === word.word.toLowerCase()) {
        return word.word_translate;
      }
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
    if (newVal === taskData.value.word_sections.length) {
      saveTaskResult();
    }
  }
);
</script>
