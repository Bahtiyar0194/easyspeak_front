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
    :taskResult="taskResult"
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

            <ul class="list-group nowrap" ref="rightAnswers">
              <li
                v-for="(section, sIndex) in currentStudiedSections"
                :key="sIndex"
                class="flex justify-between items-center gap-x-2"
              >
                <div :id="'right_answer_' + section.word_section_id">
                  <div class="btn-wrap items-center">
                    <div
                      v-for="(word, wordIndex) in section.words"
                      :key="wordIndex"
                      class="btn btn-sm pointer-events-none"
                      :class="
                        word.target == 1 ? 'btn-outline-success' : 'btn-light'
                      "
                    >
                      {{ word.word }}
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

            <ul class="list-group nowrap" ref="wrongAnswers">
              <li
                v-for="(section, rIndex) in currentReStudySections"
                :key="rIndex"
                class="flex justify-between items-center gap-x-2"
              >
                <div class="flex flex-col gap-2">
                  <div>
                    <p class="mb-1 text-inactive font-normal text-xs">
                      {{ $t("your_answer") }}:
                    </p>
                    <div :id="'user_answer_' + section.word_section_id">
                      <div class="btn-wrap items-center">
                        <div
                          v-for="(word, wordIndex) in section.words"
                          :key="wordIndex"
                          class="btn btn-sm pointer-events-none"
                          :class="
                            section.userInput === wordIndex
                              ? 'btn-outline-danger'
                              : 'btn-light'
                          "
                        >
                          {{ word.word }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p class="mb-1 text-inactive font-normal text-xs">
                      {{ $t("right_answer") }}:
                    </p>
                    <div :id="'right_answer_' + section.word_section_id">
                      <div class="btn-wrap items-center">
                        <div
                          v-for="(word, wordIndex) in section.words"
                          :key="wordIndex"
                          class="btn btn-sm pointer-events-none"
                          :class="
                            word.target == 1
                              ? 'btn-outline-success'
                              : 'btn-light'
                          "
                        >
                          {{ word.word }}
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
              <li
                class="list-item"
                v-for="(section, sectionIndex) in currentSections"
                :key="sectionIndex"
              >
                <div class="flex gap-x-2 items-center">
                  <b>{{ sectionIndex + 1 }}.</b>
                  <div class="btn-wrap">
                    <button
                      type="button"
                      v-for="(word, wordIndex) in section.words"
                      :key="wordIndex"
                      @click="selectWordInSection(wordIndex, sectionIndex)"
                      class="btn"
                      :class="
                        checkingStatus && section.userInput == null
                          ? 'pulse btn-danger'
                          : section.userInput === wordIndex
                          ? 'btn-outline-danger pointer-events-none'
                          : 'btn-active'
                      "
                      :title="
                        section.userInput === wordIndex
                          ? $t('pages.dictionary.this_word_is_extra')
                          : $t('pages.dictionary.make_this_word_extra')
                      "
                    >
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
                            'font-medium'
                          "
                          >{{ letter }}</span
                        >
                      </div>
                    </button>
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
                    class="btn btn-sm pointer-events-none"
                    :class="
                      word.target == 1 ? 'btn-outline-success' : 'btn-light'
                    "
                  >
                    {{ word.word }}
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
                    class="btn btn-sm pointer-events-none"
                    :class="
                      word.target == 1 ? 'btn-outline-danger' : 'btn-light'
                    "
                  >
                    {{ word.word }}
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
import { ref, onMounted, inject, nextTick } from "vue";
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

    section.words.forEach((word, wordIndex) => {
      if (word.target == 1) {
        if (section.userInput === wordIndex) {
          pushToStudySections(section);
        } else {
          pushToCurrentReStudySections(section);
        }
      }
    });
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
