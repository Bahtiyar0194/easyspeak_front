<template>
  <alert v-if="errors.length > 0" :className="'light'">
    <p class="mb-0">{{ errors[0] }}</p>
  </alert>
  <div v-else-if="taskData && errors.length === 0">
    <taskLayout
      :task="props.task"
      :lessonType="props.lessonType"
      :showTaskTimer="showTaskTimer"
      :showMaterialsOption="showMaterialsOption"
      :showMaterialsBeforeTask="showMaterialsBeforeTask"
      :materials="materials"
      :startTask="startTask"
      :isFinished="isFinished"
      :progressPercentage="progressPercentage"
      :reStudyItems="reAnswerQuestions"
      :taskResult="taskResult"
    >
      <template v-slot:task_content>
        <!-- Статус: сколько вопросов осталось / заполнено + таймер -->
        <div class="col-span-12">
          <div class="task-status-bar">
            <p v-if="timeIsUp" class="mb-0 font-semibold text-danger flex items-center gap-1.5">
              <i class="pi pi-clock" aria-hidden="true"></i>
              {{ $t("time_is_up") }}
            </p>
            <p
              v-else-if="isComplete"
              class="mb-0 font-semibold text-success flex items-center gap-1.5"
            >
              <i class="pi pi-send" aria-hidden="true"></i>
              {{ $t("pages.tasks.answer_the_questions.sent_for_review") }}
            </p>
            <p v-else-if="isStarted" class="mb-0 text-inactive">
              {{ $t("pages.tasks.answer_the_questions.filled") }}:
              <b class="text-active">{{ filledCount }}</b>
              / {{ currentQuestions.length }}
              <span v-if="questions.length > currentQuestions.length">
                · {{ $t("pages.questions.questions_left") }}:
                <b class="text-active">{{ questions.length }}</b>
              </span>
            </p>
            <span v-else></span>
            <countdownCircleTimer
              :totalSeconds="time"
              :startCommand="isStarted"
              @timeIsUp="timerIsUp()"
            />
          </div>
        </div>

        <!-- Итог текущего круга -->
        <div v-if="timeIsUp || isComplete" class="col-span-12">
          <div class="flex flex-col gap-5">
            <section v-if="currentAnsweredQuestions.length > 0" class="result-section">
              <p class="result-head pending">
                <span class="result-head-dot" aria-hidden="true"></span>
                {{ $t("pages.questions.answered_questions") }}
                <span class="result-head-count">{{ currentAnsweredQuestions.length }}</span>
              </p>
              <ul class="result-list">
                <li
                  v-for="(question, qIndex) in currentAnsweredQuestions"
                  :key="qIndex"
                  class="result-item pending"
                >
                  <div class="flex-1 min-w-0">
                    <p class="mb-1 font-medium break-words">{{ question.sentence }}</p>
                    <p class="result-label">{{ $t("your_answer") }}</p>
                    <p class="mb-0 result-answer text-corp whitespace-pre-line">
                      {{ question.userInput }}
                    </p>
                  </div>
                  <!-- Ответ ушёл учителю — ждёт проверки -->
                  <span class="result-status pending shrink-0" aria-hidden="true">
                    <i class="pi pi-clock"></i>
                  </span>
                </li>
              </ul>
            </section>

            <section v-if="currentReAnswerQuestions.length > 0" class="result-section">
              <p class="result-head bad">
                <span class="result-head-dot" aria-hidden="true"></span>
                {{ $t("pages.questions.unanswered_questions") }}
                <span class="result-head-count">{{ currentReAnswerQuestions.length }}</span>
              </p>
              <ul class="result-list">
                <li
                  v-for="(question, rIndex) in currentReAnswerQuestions"
                  :key="rIndex"
                  class="result-item bad"
                >
                  <p class="mb-0 flex-1 min-w-0 font-medium break-words">
                    {{ question.sentence }}
                  </p>
                  <span class="result-status bad shrink-0" aria-hidden="true">
                    <i class="pi pi-times"></i>
                  </span>
                </li>
              </ul>
            </section>

            <div class="task-actions">
              <button
                v-if="questions.length > 0"
                type="button"
                class="btn btn-primary"
                @click="setQuestions()"
              >
                {{ $t("continue") }}
                <i class="pi pi-arrow-right" aria-hidden="true"></i>
              </button>
              <button v-else type="button" class="btn btn-primary" @click="isFinished = true">
                <i class="pi pi-check" aria-hidden="true"></i>
                {{ $t("pages.tasks.complete_the_task") }}
              </button>
            </div>
          </div>
        </div>

        <!-- Вопросы с полями ответа -->
        <div v-else class="col-span-12">
          <div class="flex flex-col gap-3">
            <div
              v-for="(question, questionIndex) in currentQuestions"
              :key="question.task_question_id ?? questionIndex"
              class="blank-card answer-card"
              :class="{
                filled: !isEmpty(question),
                missing: checkingStatus === true && isEmpty(question),
                shake: checkingStatus === true && isEmpty(question),
              }"
            >
              <span class="blank-card-num">{{ questionIndex + 1 }}</span>
              <div class="flex-1 min-w-0 flex flex-col gap-2.5">
                <label
                  :for="'answer_' + questionIndex"
                  class="text-lg font-medium leading-snug break-words"
                >
                  {{ question.sentence }}
                </label>

                <div
                  v-if="taskData.options.answer_the_questions_option == 'text'"
                  class="answer-textarea"
                >
                  <textarea
                    :id="'answer_' + questionIndex"
                    v-model="question.userInput"
                    rows="3"
                    :placeholder="$t('type_your_answer')"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    @paste="handlePaste"
                    @drop="handlePaste"
                  ></textarea>
                  <p
                    v-if="checkingStatus === true && isEmpty(question)"
                    class="answer-textarea-error"
                  >
                    <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                    {{ $t("pages.questions.required") }}
                  </p>
                </div>

                <fileUploadButton
                  v-else
                  :id="'upload_file_' + questionIndex"
                  :name="'upload_file_' + questionIndex"
                  :accept="taskData.options.answer_the_questions_option + '/*'"
                  :error="
                    checkingStatus === true && isEmpty(question)
                      ? $t('pages.questions.required')
                      : ''
                  "
                  :icon="'pi pi-' + taskData.options.answer_the_questions_option"
                  :label="
                    $t('file.' + taskData.options.answer_the_questions_option + '.select')
                  "
                />
              </div>
            </div>

            <div class="task-actions items-center">
              <span class="hidden sm:inline text-xs text-inactive mr-auto">
                <kbd class="answer-kbd">Ctrl</kbd> + <kbd class="answer-kbd">Enter</kbd>
                — {{ $t("check") }}
              </span>
              <button
                type="button"
                class="btn btn-primary"
                :class="checkingStatus && 'disabled'"
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
        <resultList :sections="resultSections" />
      </template>
    </taskLayout>
  </div>
</template>

<script setup>
import { useNotify } from "~/composables/useNotify";
import alert from "../../../../../ui/alert.vue";
import { ref, onMounted, inject, watch, nextTick } from "vue";
import { useRouter } from "nuxt/app";
import taskLayout from "../../taskLayout.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import fileUploadButton from "../../../../../ui/fileUploadButton.vue";
import resultList from "../../results/resultList.vue";

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();
const notify = useNotify();
// раньше t не был объявлен — предупреждение о вставке падало с ошибкой
const { t } = useI18n();
const errors = ref([]);

const showTaskTimer = ref(false);
const taskData = ref(null);
const materials = ref([]);
const showMaterialsOption = ref("");
const showMaterialsBeforeTask = ref(false);
const questions = ref([]);
const currentQuestions = ref([]);
const checkingStatus = ref(false);

const answeredQuestions = ref([]);
const currentAnsweredQuestions = ref([]);

const reAnswerQuestions = ref([]);
const currentReAnswerQuestions = ref([]);

const taskResult = ref([]);
const taskResultCollection = ref([]);

const isStarted = ref(false);
const isComplete = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

const isFinished = ref(false);

// Пустой ответ — в том числе из одних пробелов/переносов строк
const isEmpty = (question) => !String(question?.userInput ?? "").trim();

const filledCount = computed(
  () => currentQuestions.value.filter((q) => !isEmpty(q)).length,
);

const resultSections = computed(() => [
  {
    title: t("pages.questions.answered_questions"),
    tone: "ok",
    icon: "pi-check",
    items: answeredQuestions.value.map((q) => ({
      title: q.sentence,
      subtitle: t("your_answer") + ": " + (q.userInput ?? ""),
      audio: q.audio_file,
    })),
  },
  {
    title: t("pages.questions.unanswered_questions"),
    tone: "bad",
    icon: "pi-replay",
    items: reAnswerQuestions.value.map((q) => ({
      title: q.sentence,
      audio: q.audio_file,
    })),
  },
]);

const progressPercentage = computed(() => {
  const totalQuestions = taskData.value?.questions?.length || 0; // Предотвращаем ошибки, если данные ещё не загружены
  if (totalQuestions === 0) return 0; // Если общее количество фраз равно 0, возвращаем 0
  const completedQuestions = totalQuestions - questions.value.length;
  return (completedQuestions / totalQuestions) * 100;
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
      "tasks/get/answer_the_questions/" + props.task.task_id,
    );

    taskData.value = res.data;
    onStartTask();
    showMaterialsOption.value = taskData.value.options.show_materials_option;
    materials.value = taskData.value.materials;

    questions.value = [...taskData.value.questions];
    questions.value.forEach((question) => {
      question.attempts = taskData.value.options.max_answer_attempts;
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
    if (err.response) {
      if (err.response.status == 422) {
        errors.value = err.response.data;
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
    setQuestions();
    showTaskTimer.value = false;
  }, 3000);
};

const setQuestions = () => {
  currentAnsweredQuestions.value = [];
  currentReAnswerQuestions.value = [];

  if (questions.value.length > 0) {
    currentQuestions.value =
      taskData.value.options.impression_limit > 0
        ? questions.value.slice(0, taskData.value.options.impression_limit)
        : questions.value;

    currentQuestions.value.forEach((question) => {
      question.userInput = "";
    });

    time.value =
      taskData.value.options.seconds_per_question *
      currentQuestions.value.length;

    isComplete.value = false;
    isStarted.value = true;
    timeIsUp.value = false;
    checkingStatus.value = false;
  }
};

// Проверка всех ответов
const checkAnswers = () => {
  currentQuestions.value.forEach((question) => {
    questions.value = questions.value.filter(
      (s) => s.task_question_id !== question.task_question_id,
    );

    if (!isEmpty(question)) {
      question.userInput = String(question.userInput).trim();
      answeredQuestions.value.push(question);
      currentAnsweredQuestions.value.push(question);

      taskResultCollection.value.push(question);

      if (
        reAnswerQuestions.value.some(
          (q) => q.task_question_id === question.task_question_id,
        )
      ) {
        reAnswerQuestions.value = reAnswerQuestions.value.filter(
          (q) => q.task_question_id !== question.task_question_id,
        );
      }
    } else {
      currentReAnswerQuestions.value.push(question);

      if (question.attempts >= 1) {
        questions.value.push(question);
        question.attempts--;
      } else {
        reAnswerQuestions.value.push(question);

        taskResultCollection.value.push(question);
      }
    }
  });
};

const acceptAnswers = () => {
  for (
    let questionIndex = 0;
    questionIndex < currentQuestions.value.length;
    questionIndex++
  ) {
    const question = currentQuestions.value[questionIndex];

    if (isEmpty(question)) {
      checkingStatus.value = true;
      break;
    }
  }

  if (checkingStatus.value === true) {
    // Переводим фокус на первый незаполненный ответ
    nextTick(() => {
      document.querySelector(".answer-card.missing textarea")?.focus();
    });
    setTimeout(() => {
      checkingStatus.value = false;
    }, 1000);
  } else {
    isComplete.value = true;
    isStarted.value = false;
    checkAnswers();
  }
};

const timerIsUp = () => {
  timeIsUp.value = true;
  isStarted.value = false;
  checkAnswers();
};

const handleKeyPress = (event) => {
  // В поле ответа Enter — перенос строки; проверка — по Ctrl/Cmd + Enter
  if (
    event.key === "Enter" &&
    event.target?.tagName === "TEXTAREA" &&
    !(event.ctrlKey || event.metaKey)
  ) {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    if (!isFinished.value) {
      if (timeIsUp.value === true || isComplete.value === true) {
        if (questions.value.length > 0) {
          setQuestions();
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

const handlePaste = (event) => {
  event?.preventDefault();

  notify("warning", t("pages.tasks.answer_the_questions.paste_prohibited"));
};

const saveTaskResult = async () => {
  onPending(true);
  const formData = new FormData();
  formData.append("questions", JSON.stringify(taskResultCollection.value));
  formData.append("operation_type_id", 25);

  await $axiosPlugin
    .post("tasks/check_answers/" + props.task.task_id, formData)
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
  changeModalSize("modal-xl");
  getTask();
  window.addEventListener("keydown", handleKeyPress);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyPress);
});

watch(
  () => taskResultCollection.value.length,
  (newVal) => {
    if (newVal === taskData.value.questions.length) {
      saveTaskResult();
    }
  },
);
</script>
