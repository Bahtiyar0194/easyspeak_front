<template>
  <alert v-if="errors.length > 0" :className="'light'">
    <p class="mb-0">{{ errors[0] }}</p>
  </alert>
  <div v-else-if="taskData && errors.length === 0">
    <taskLayout
      :task="props.task"
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
        <div class="col-span-12">
          <p v-if="timeIsUp" class="font-medium text-center text-danger">
            {{ $t("time_is_up") }}
          </p>
          <p v-else-if="questions.length > 0" class="text-center">
            {{ $t("pages.questions.questions_left") }}:
            <b>{{ questions.length }}</b>
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
              v-if="currentAnsweredQuestions.length > 0"
            >
              <p class="text-xl font-medium mb-0 text-success">
                {{ $t("pages.questions.answered_questions") }}
              </p>

              <ul class="list-group nowrap">
                <li
                  v-for="(question, qIndex) in currentAnsweredQuestions"
                  :key="qIndex"
                  class="flex justify-between items-center gap-x-2"
                >
                  <div class="flex flex-col">
                    <p class="mb-1">
                      <span class="text-inactive"
                        >{{ $t("pages.questions.question") }}:
                      </span>
                      <span class="font-medium">{{ question.sentence }}</span>
                    </p>

                    <p class="mb-0">
                      <span class="text-inactive"
                        >{{ $t("your_answer") }}:
                      </span>
                      <span class="text-corp font-medium">{{
                        question.userInput
                      }}</span>
                    </p>
                  </div>

                  <div class="step-item xs completed">
                    <div class="step-icon">
                      <i class="pi pi-clock"></i>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div
              class="flex flex-col gap-y-2"
              v-if="currentReAnswerQuestions.length > 0"
            >
              <p class="text-xl font-medium mb-0 text-danger">
                {{ $t("pages.questions.unanswered_questions") }}
              </p>

              <ul class="list-group nowrap">
                <li
                  v-for="(question, rIndex) in currentReAnswerQuestions"
                  :key="rIndex"
                  class="flex justify-between items-center gap-x-2"
                >
                  <p class="mb-0">
                    <span class="font-medium">{{ question.sentence }}</span>
                  </p>

                  <div class="step-item xs failed">
                    <div class="step-icon">
                      <i class="pi pi-times-circle"></i>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div class="btn-wrap right">
              <button
                v-if="questions.length > 0"
                class="btn btn-outline-primary"
                @click="setQuestions()"
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
                  v-for="(question, questionIndex) in currentQuestions"
                  :key="questionIndex"
                  class="list-item"
                >
                  <div class="custom-grid">
                    <div class="col-span-12">
                      <span class="font-medium text-lg"
                        ><span class="text-corp">{{ questionIndex + 1 }}. </span
                        >{{ question.sentence }}</span
                      >
                    </div>

                    <div class="col-span-12">
                      <div
                        v-if="
                          taskData.options.answer_the_questions_option == 'text'
                        "
                        class="form-group-border"
                        :class="
                          checkingStatus === true && !question.userInput
                            ? 'pulse danger'
                            : 'active'
                        "
                      >
                        <i class="pi pi-reply"></i>
                        <input
                          v-model="question.userInput"
                          type="text"
                          placeholder=" "
                        />
                        <label
                          :class="
                            checkingStatus === true && !question.userInput
                              ? 'label-error'
                              : ''
                          "
                        >
                          {{ $t("type_your_answer") }}
                        </label>
                      </div>

                      <fileUploadButton
                        v-else
                        :id="'upload_file_' + questionIndex"
                        :name="'upload_file_' + questionIndex"
                        :accept="
                          taskData.options.answer_the_questions_option + '/*'
                        "
                        :error="
                          checkingStatus === true && !question.userInput
                            ? $t('pages.questions.required')
                            : ''
                        "
                        :icon="
                          'pi pi-' +
                          taskData.options.answer_the_questions_option
                        "
                        :label="
                          $t(
                            'file.' +
                              taskData.options.answer_the_questions_option +
                              '.select'
                          )
                        "
                      />
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
          <div class="flex flex-col gap-y-4">
            <div
              class="flex flex-col gap-y-2"
              v-if="answeredQuestions.length > 0"
            >
              <p class="text-xl font-medium mb-0 text-success">
                {{ $t("pages.questions.answered_questions") }}
              </p>

              <ul class="list-group nowrap">
                <li
                  v-for="(question, qIndex) in answeredQuestions"
                  :key="qIndex"
                  class="flex justify-between items-center gap-x-2"
                >
                  <div>
                    <p class="mb-0 font-medium">{{ question.sentence }}</p>
                    <p class="mb-0">
                      <span class="text-inactive"
                        >{{ $t("your_answer") }}:
                      </span>
                      <span class="text-corp font-medium">{{
                        question.userInput
                      }}</span>
                    </p>
                  </div>

                  <div class="flex items-center">
                    <audioButton
                      v-if="question.audio_file"
                      :src="
                        config.public.apiBase +
                        '/media/get/' +
                        question.audio_file
                      "
                    />
                    <div class="step-item xs completed">
                      <div class="step-icon">
                        <i class="pi pi-check"></i>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div class="flex flex-col gap-y-2" v-if="reAnswerQuestions > 0">
              <p class="text-xl font-medium mb-0 text-danger">
                {{ $t("pages.questions.unanswered_questions") }}
              </p>
              <ul class="list-group nowrap">
                <li
                  v-for="(question, qIndex) in reAnswerQuestions"
                  :key="qIndex"
                  class="flex justify-between items-center gap-x-2"
                >
                  <div>
                    <p class="mb-0 font-medium">{{ question.sentence }}</p>
                  </div>

                  <div class="flex items-center">
                    <audioButton
                      v-if="question.audio_file"
                      :src="
                        config.public.apiBase +
                        '/media/get/' +
                        question.audio_file
                      "
                    />
                    <div class="step-item xs failed">
                      <div class="step-icon">
                        <i class="pi pi-replay"></i>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </template>
    </taskLayout>
  </div>
</template>

<script setup>
import alert from "../../../../../ui/alert.vue";
import { ref, onMounted, inject, watch } from "vue";
import { useRouter } from "nuxt/app";
import taskLayout from "../../taskLayout.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import fileUploadButton from "../../../../../ui/fileUploadButton.vue";
import audioButton from "../../../../../ui/audioButton.vue";

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();
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
});

const onPending = inject("onPending");
const onCompleteTask = inject("onCompleteTask");
const changeModalSize = inject("changeModalSize");

// Получение задачи
const getTask = async () => {
  try {
    onPending(true);
    const res = await $axiosPlugin.get(
      "tasks/get/answer_the_questions/" + props.task.task_id
    );

    taskData.value = res.data;
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
        console.log(errors.value);
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
    currentQuestions.value = questions.value.slice(
      0,
      taskData.value.options.impression_limit
    );

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
      (s) => s.task_question_id !== question.task_question_id
    );

    if (question.userInput !== "" && question.userInput !== " ") {
      answeredQuestions.value.push(question);
      currentAnsweredQuestions.value.push(question);

      taskResultCollection.value.push(question);

      if (
        reAnswerQuestions.value.some(
          (q) => q.task_question_id === question.task_question_id
        )
      ) {
        reAnswerQuestions.value = reAnswerQuestions.value.filter(
          (q) => q.task_question_id !== question.task_question_id
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

    if (question.userInput === "" || question.userInput === " ") {
      checkingStatus.value = true;
      break;
    }
  }

  if (checkingStatus.value === true) {
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
  if (event.key === "Enter") {
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
  }
);
</script>
