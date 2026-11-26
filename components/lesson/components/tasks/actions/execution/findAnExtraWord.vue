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
                          class="btn btn-sm pointer-events-none"
                          :class="word.target == 1 ? 'btn-outline-success' : 'btn-light'"
                        >
                          {{ word.word }}
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
                          <div
                            v-for="(word, wordIndex) in section.words"
                            :key="wordIndex"
                            class="btn btn-sm pointer-events-none"
                            :class="section.userInput === wordIndex ? 'btn-outline-danger' : 'btn-light'"
                          >
                            {{ word.word }}
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
                            class="btn btn-sm pointer-events-none"
                            :class="word.target == 1 ? 'btn-outline-success' : 'btn-light'"
                          >
                            {{ word.word }}
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
          <div class="flex flex-col gap-3">
            <p class="mb-0 text-sm text-inactive flex items-center gap-1.5">
              <i class="pi pi-info-circle" aria-hidden="true"></i>
              {{ $t("pages.tasks.extra_word_hint") }}
            </p>

            <div
              v-for="(section, sectionIndex) in currentSections"
              :key="sectionIndex"
              class="blank-card items-center"
              :class="{ shake: checkingStatus && section.userInput == null }"
            >
              <span class="blank-card-num !mt-0" aria-hidden="true">{{ sectionIndex + 1 }}</span>
              <div class="flex flex-wrap gap-2" role="radiogroup">
                <button
                  type="button"
                  v-for="(word, wordIndex) in section.words"
                  :key="wordIndex"
                  role="radio"
                  :aria-checked="section.userInput === wordIndex"
                  @click="selectWordInSection(wordIndex, sectionIndex)"
                  class="word-chip extra-pick gap-2"
                  :class="{
                    error: checkingStatus && section.userInput == null,
                    picked: section.userInput === wordIndex,
                  }"
                  :title="
                    section.userInput === wordIndex
                      ? $t('pages.dictionary.this_word_is_extra')
                      : $t('pages.dictionary.make_this_word_extra')
                  "
                >
                  <audioButtonMini
                    v-if="word.audio_file && taskData.options.show_audio_button"
                    :src="config.public.apiBase + '/media/get/' + word.audio_file"
                    @click.stop
                  />
                  <span class="extra-pick-text">
                    <span
                      v-for="(letter, letterIndex) in word.word"
                      :key="letterIndex"
                      :class="
                        word.missingLetters &&
                        word.missingLetters.includes(letterIndex + 1) &&
                        'font-bold'
                      "
                      >{{ letter }}</span
                    >
                  </span>
                </button>
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
                  <div class="flex-1 min-w-0 flex flex-wrap gap-2">
                    <span
                      v-for="(word, wordIndex) in section.words"
                      :key="wordIndex"
                      class="pair-word !text-base"
                      :class="{ 'extra-word-mark ok': word.target == 1 }"
                      >{{ word.word }}</span
                    >
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
                  <div class="flex-1 min-w-0 flex flex-wrap gap-2">
                    <span
                      v-for="(word, wordIndex) in section.words"
                      :key="wordIndex"
                      class="pair-word !text-base"
                      :class="{ 'extra-word-mark bad': word.target == 1 }"
                      >{{ word.word }}</span
                    >
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
import { ref, onMounted, inject, nextTick } from "vue";
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
      "tasks/get/find_an_extra_word/" + props.task.task_id
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

  if (sections.value.length > 0) {
    currentSections.value =
      taskData.value.options.impression_limit > 0
        ? sections.value.slice(0, taskData.value.options.impression_limit)
        : sections.value;

    currentSections.value.forEach((section) => {
      section.userInput = null;
    });

    time.value =
      taskData.value.options.seconds_per_section * currentSections.value.length;

    isComplete.value = false;
    isStarted.value = true;
    timeIsUp.value = false;
    checkingStatus.value = false;
  }
};

const checkSections = () => {
  currentSections.value.forEach((section) => {
    sections.value = sections.value.filter(
      (ws) => ws.word_section_id !== section.word_section_id
    );

    const isCorrect = section.words.some(
      (word, wordIndex) => word.target == 1 && section.userInput === wordIndex,
    );

    if (isCorrect) {
      pushToStudySections(section);
    } else {
      pushToCurrentReStudySections(section);
    }
  });
};

const pushToStudySections = async (section) => {
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

  if (
    reStudySections.value.some(
      (ws) => ws.word_section_id === section.word_section_id
    )
  ) {
    reStudySections.value = reStudySections.value.filter(
      (ws) => ws.word_section_id !== section.word_section_id
    );
  }
};

const pushToCurrentReStudySections = async (section) => {
  currentReStudySections.value.push(section);

  if (section.attempts >= 1) {
    sections.value.push(section);
    const removeSectionAttempt = sections.value.find(
      (ws) => ws.word_section_id === section.word_section_id
    );
    removeSectionAttempt.attempts--;
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

    reStudySections.value.push(section);
  }
};

const selectWordInSection = (wordIndex, sectionIndex) => {
  currentSections.value[sectionIndex].userInput = wordIndex;
};

const acceptAnswers = () => {
  checkingStatus.value = true;
  currentSections.value.forEach((section, sectionIndex) => {
    if (section.userInput == null) {
      unFilledSections.value.push(sectionIndex);
    }
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
