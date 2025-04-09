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
    :reStudyItems="reStudySections"
  >
    <template v-slot:task_content>
      <div class="col-span-12">
        <p v-if="timeIsUp" class="font-medium text-center text-danger">
          {{ $t("time_is_up") }}
        </p>
        <p v-else-if="sections.length > 0" class="text-center">
          {{ $t("pages.sections.sections_left") }}:
          <b>{{ sections.length }}</b>
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
            v-if="currentStudiedSections.length > 0"
          >
            <p class="text-xl font-medium mb-0 text-success">
              {{
                currentReStudySections.length > 0
                  ? $t("right_answers")
                  : $t("right")
              }}
            </p>

            <ul class="list-group nowrap">
              <li
                v-for="(section, sIndex) in currentStudiedSections"
                :key="sIndex"
                class="flex justify-between items-center gap-x-2"
              >
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
                                (w) =>
                                  w.word.toLowerCase() ===
                                  word.userInput.toLowerCase()
                              ).word
                            : word.word
                        }}</b>
                        <span class="text-xs text-inactive">
                          {{
                            word.target === 1
                              ? section.words.find(
                                  (w) =>
                                    w.word.toLowerCase() ===
                                    word.userInput.toLowerCase()
                                ).word_translate
                              : word.word_translate
                          }}
                        </span>
                      </div>
                      <span
                        v-if="wordIndex + 1 < section.words.length"
                        class="text-active"
                        >-</span
                      >
                    </div>
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
            v-if="currentReStudySections.length > 0"
          >
            <p class="text-xl font-medium mb-0 text-danger">
              {{ $t("for_re_examination") }}
            </p>

            <ul class="list-group nowrap">
              <li
                v-for="(section, rIndex) in currentReStudySections"
                :key="rIndex"
                class="flex justify-between items-center gap-x-2"
              >
                <div class="flex flex-col gap-4">
                  <div>
                    <p class="mb-1 text-inactive font-normal text-xs">
                      {{ $t("your_answer") }}:
                    </p>

                    <div class="btn-wrap items-center">
                      <div
                        v-for="(word, wordIndex) in section.words"
                        :key="wordIndex"
                      >
                        <div class="flex items-center gap-x-2">
                          <div class="flex flex-col">
                            <b
                              class="mb-0"
                              :class="
                                word.target === 0 ||
                                section.words.find(
                                  (w) =>
                                    w.word.toLowerCase() ===
                                    word.userInput.toLowerCase()
                                )
                                  ? 'text-success'
                                  : 'text-danger'
                              "
                              >{{
                                word.target === 1
                                  ? word.userInput === "" ||
                                    word.userInput === " "
                                    ? "________"
                                    : !section.words.find(
                                        (w) =>
                                          w.word.toLowerCase() ===
                                          word.userInput.toLowerCase()
                                      )
                                    ? word.userInput
                                    : section.words.find(
                                        (w) =>
                                          w.word.toLowerCase() ===
                                          word.userInput.toLowerCase()
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
                                      (w) =>
                                        w.word.toLowerCase() ===
                                        word.userInput.toLowerCase()
                                    )
                                    ? findTranslate(word.userInput)
                                    : section.words.find(
                                        (w) =>
                                          w.word.toLowerCase() ===
                                          word.userInput.toLowerCase()
                                      ).word_translate
                                  : word.word_translate
                              }}
                            </span>
                          </div>
                          <span
                            v-if="wordIndex + 1 < section.words.length"
                            class="text-active"
                            >-</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p class="mb-1 text-inactive font-normal text-xs">
                      {{ $t("right_answer") }}:
                    </p>
                    <div class="btn-wrap items-center">
                      <div
                        v-for="(word, wordIndex) in section.words"
                        :key="wordIndex"
                        class="text-success"
                      >
                        <div class="flex items-center gap-x-2">
                          <div class="flex flex-col">
                            <b class="mb-0">{{ word.word }}</b>
                            <span class="text-xs text-inactive">
                              {{ word.word_translate }}
                            </span>
                          </div>
                          <span
                            v-if="wordIndex + 1 < section.words.length"
                            class="text-active"
                            >-</span
                          >
                        </div>
                      </div>
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
              v-if="sections.length > 0"
              class="btn btn-outline-primary"
              @click="setSections()"
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
              <li>
                <div class="btn-wrap justify-center items-center">
                  <button
                    :draggable="taskData.options.match_by_drag_and_drop == 1"
                    v-for="(word, wordIndex) in hiddenWords"
                    :key="wordIndex"
                    class="btn btn-light font-medium"
                    :class="{
                      'disabled line-through': word.disabled,
                      draggable: taskData.options.match_by_drag_and_drop == 1,
                      'pointer-events-none':
                        taskData.options.match_by_drag_and_drop != 1 &&
                        taskData.options.match_by_clicking != 1,
                    }"
                    type="button"
                    @dragstart="onDragStart($event, wordIndex)"
                    @click="insertWord(word)"
                  >
                    <audioButtonMini
                      v-if="
                        word.audio_file && taskData.options.show_audio_button
                      "
                      :src="
                        config.public.apiBase + '/media/get/' + word.audio_file
                      "
                      @click.stop
                    />
                    <div class="flex">
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
                    </div>
                  </button>
                </div>
              </li>
              <li
                v-for="(section, sectionIndex) in currentSections"
                :key="sectionIndex"
                class="col-span-12"
              >
                <div
                  class="btn-wrap justify-center items-center gap-2 font-medium"
                >
                  <span>{{ sectionIndex + 1 }}.</span>
                  <div
                    v-for="(word, wordIndex) in section.words"
                    :key="wordIndex"
                  >
                    <div
                      v-if="word.target == 1"
                      class="btn flex justify-center items-center"
                      :class="
                        unFilledSections[sectionIndex] &&
                        unFilledSections[sectionIndex].includes(wordIndex)
                          ? 'pulse btn-danger'
                          : 'btn-active'
                      "
                      @drop="onDrop($event, sectionIndex, wordIndex)"
                      @dragover="onDragOver"
                    >
                      <audioButtonMini
                        v-if="
                          hiddenWords.find(
                            (w) =>
                              w.word.toLowerCase() ===
                              word.userInput.toLowerCase()
                          )
                        "
                        :src="
                          config.public.apiBase +
                          '/media/get/' +
                          hiddenWords.find(
                            (w) =>
                              w.word.toLowerCase() ===
                              word.userInput.toLowerCase()
                          ).audio_file
                        "
                        @click.stop
                      />
                      <input
                        v-model="word.userInput"
                        :disabled="taskData.options.match_by_typing != 1"
                        :style="{
                          width:
                            word.userInput !== ''
                              ? word.userInput.length + 0.5 + 'ch'
                              : '4ch',
                          'text-align': 'center',
                        }"
                        @input="disableTheHiddenWord()"
                        type="text"
                      />
                      <button
                        v-if="word.userInput !== ''"
                        @click="clearInput(sectionIndex, wordIndex)"
                        class="text-danger ml-0.5 mt-0.5"
                      >
                        <i class="pi pi-delete-left"></i>
                      </button>
                    </div>

                    <div v-else class="btn btn-active">
                      <audioButtonMini
                        v-if="
                          word.audio_file && taskData.options.show_audio_button
                        "
                        :src="
                          config.public.apiBase +
                          '/media/get/' +
                          word.audio_file
                        "
                        @click.stop
                      />
                      <div class="flex">
                        <span
                          v-for="(letter, letterIndex) in word.word"
                          :key="letterIndex"
                          class="select-none"
                          :class="
                            word.missingLetters &&
                            word.missingLetters.includes(letterIndex + 1) &&
                            'text-corp'
                          "
                          >{{ letter }}</span
                        >
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
      <div class="col-span-12">
        <canvas id="confetti-canvas"></canvas>
        <div class="flex flex-col gap-y-4">
          <div class="flex flex-col gap-y-2" v-if="studiedSections.length > 0">
            <p class="text-xl font-medium mb-0 text-success">
              {{ $t("pages.sections.studied_sections") }}
            </p>

            <ul class="list-group nowrap">
              <li
                v-for="(section, sIndex) in studiedSections"
                :key="sIndex"
                class="flex justify-between items-center gap-x-2"
              >
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
                                (w) =>
                                  w.word.toLowerCase() ===
                                  word.userInput.toLowerCase()
                              ).word
                            : word.word
                        }}</b>
                        <span class="text-xs text-inactive">
                          {{
                            word.target === 1
                              ? section.words.find(
                                  (w) =>
                                    w.word.toLowerCase() ===
                                    word.userInput.toLowerCase()
                                ).word_translate
                              : word.word_translate
                          }}
                        </span>
                      </div>
                      <span
                        v-if="wordIndex + 1 < section.words.length"
                        class="text-active"
                        >-</span
                      >
                    </div>
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

          <div class="flex flex-col gap-y-2" v-if="reStudySections.length > 0">
            <p class="text-xl font-medium mb-0 text-danger">
              {{ $t("pages.sections.unstudied_sections") }}
            </p>

            <ul class="list-group nowrap">
              <li
                v-for="(section, rIndex) in reStudySections"
                :key="rIndex"
                class="flex justify-between items-center gap-x-2"
              >
                <div class="btn-wrap items-center">
                  <div
                    v-for="(word, wordIndex) in section.words"
                    :key="wordIndex"
                    class="text-danger"
                  >
                    <div class="flex items-center gap-x-2">
                      <div class="flex flex-col">
                        <b class="mb-0">{{ word.word }}</b>
                        <span class="text-xs text-inactive">
                          {{ word.word_translate }}
                        </span>
                      </div>
                      <span
                        v-if="wordIndex + 1 < section.words.length"
                        class="text-active"
                        >-</span
                      >
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
        </div>
      </div>
    </template>
  </taskLayout>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { useRouter } from "nuxt/app";
import taskLayout from "../../taskLayout.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import audioButtonMini from "../../../../../ui/audioButtonMini.vue";

const config = useRuntimeConfig();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();

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
});

const onPending = inject("onPending");
const changeModalSize = inject("changeModalSize");

// Получение задачи
const getTask = async () => {
  try {
    onPending(true);
    const res = await $axiosPlugin.get(
      "tasks/get/match_same_words/" + props.task.task_id
    );
    taskData.value = res.data;
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
    currentSections.value = sections.value.slice(
      0,
      taskData.value.options.impression_limit
    );

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
      // Секция пройдена
      studiedSections.value.push(section);
      currentStudiedSections.value.push(section);

      // Убираем её из reStudySections, если она там есть
      reStudySections.value = reStudySections.value.filter(
        (ws) => ws.word_section_id !== section.word_section_id
      );
    } else {
      // Секция не пройдена
      currentReStudySections.value.push(section);

      if (section.attempts > 0) {
        section.attempts--; // Уменьшаем попытки
        sections.value.push(section);
      } else {
        reStudySections.value.push(section); // Переносим в reStudySections
      }
    }
  });
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
      if (w.toLowerCase() === word.word.toLowerCase()) {
        return word.word_translate;
      }
    }
  }

  return "________";
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
</script>
