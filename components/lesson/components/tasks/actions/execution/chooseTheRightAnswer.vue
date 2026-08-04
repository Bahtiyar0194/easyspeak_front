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
      :reStudyItems="reStudyQuestions"
      :taskResult="taskResult"
    >
      <template v-slot:task_content>
        <div class="col-span-12">
          <p v-if="timeIsUp" class="font-medium text-center text-danger">
            ⏱️ {{ $t("time_is_up") }}
          </p>
          <p
            v-else-if="isPerfectMatch && isComplete"
            class="font-medium text-center text-success"
          >
            🎉 {{ $t("right") }}
          </p>
          <p
            v-else-if="userCorrectAnswers.length > 0 && isComplete"
            class="font-medium text-center text-warning"
          >
            ⚠️ {{ $t("parthly_right") }}
          </p>
          <p v-else-if="isWrong" class="font-medium text-center text-danger">
            ❌ {{ $t("wrong") }}
          </p>
          <p v-else-if="questionsLeft > 0" class="text-center">
            {{ $t("pages.questions.questions_left") }}:
            <b>{{ questionsLeft }}</b>
          </p>
        </div>

        <div class="col-span-12">
          <div class="flex justify-center items-center">
            <countdownCircleTimer
              :totalSeconds="time"
              :startCommand="isStarted"
              :isWrong="isWrong"
              @timeIsUp="timerIsUp()"
            />
          </div>
        </div>

        <div class="col-span-12">
          <div
            class="bg-inactive p-4 rounded-xl text-center"
            :class="isComplete && 'text-success'"
          >
            <div class="custom-grid">
              <div class="col-span-12">
                <p class="text-xl font-medium mb-0">
                  {{ currentQuestion?.question }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          class="col-span-12 text-center"
          v-if="isComplete || isWrong || timeIsUp"
        >
          <!-- 2. Что выбрал пользователь (показываем, только если он что-то выбирал и ответ не идеален) -->
          <div v-if="userSelectedAnswers.length > 0" class="mt-2">
            {{ $t("your_answer") }}: 
            <strong :class="isWrong ? 'text-danger' : 'text-success'">{{
              userAnswersText
            }}</strong>
          </div>

          <div v-else class="mt-2">
            {{ $t("your_answer") }}: 
            <strong class="text-danger">{{ $t("no_answer") }}</strong>
          </div>

          <!-- 3. Правильные ответы (показываем при частичном или неправильном ответе) -->
          <div v-if="!isPerfectMatch" class="mt-1">
            <hr>
            {{ $t("right_answer") }}: 
            <strong class="text-success"> {{ rightAnswersText }}</strong>
          </div>
        </div>

        <div v-if="isStarted" class="col-span-12">
          <div class="custom-grid">
            <div class="col-span-12">
              <b>{{}}</b>
            </div>
            <div class="col-span-12">
              <div class="flex flex-col gap-3">
                <label
                  v-for="(answer, answerIndex) in currentQuestion.answers"
                  :key="answerIndex"
                  class="custom-radio-button"
                  :class="selectError ? 'pulse bg-danger text-white' : ''"
                >
                  <input type="checkbox" v-model="answer.is_selected" />
                  <div class="flex gap-1.5 font-medium">
                    <div
                      v-if="
                        taskData.options.option_label &&
                        taskData.options.option_label !== 'hidden'
                      "
                      class="w-6 h-6 rounded-full flex justify-center items-center"
                      :class="
                        answer.is_selected
                          ? 'bg-white text-corp'
                          : 'bg-corp text-white'
                      "
                    >
                      {{
                        taskData.options.option_label === "with_letters"
                          ? letters[answerIndex]
                          : answerIndex + 1
                      }}
                    </div>
                    {{ answer.title }}
                  </div>
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <button class="btn btn-primary" @click="checkQuestion(true)">
                <i class="pi pi-arrow-right"></i>
                {{ $t("check") }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="timeIsUp || isWrong || isComplete" class="col-span-12">
          <div class="flex justify-end">
            <button class="btn btn-primary" @click="setQuestion()">
              <i class="pi pi-arrow-right"></i> {{ $t("continue") }}
            </button>
          </div>
        </div>
      </template>

      <template v-slot:task_result_content>
        <result
          :studiedQuestions="studiedQuestions"
          :reStudyQuestions="reStudyQuestions"
        />
      </template>
    </taskLayout>
  </div>
</template>

<script setup>
import alert from "../../../../../ui/alert.vue";
import { ref, onMounted, inject } from "vue";
import { useRouter } from "nuxt/app";
import { useToast } from "vue-toastification";
import taskLayout from "../../taskLayout.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import {
  playSuccessSound,
  playErrorSound,
  playAudio,
  stopAudio,
} from "../../../../../../utils/playAudio.js";
import result from "../../results/questions/result.vue";
import { letters } from "../../../../../../utils/alphabet.js";

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();
const toast = useToast();
const { t } = useI18n();

const errors = ref([]);

const showTaskTimer = ref(false);
const taskData = ref(null);
const materials = ref([]);
const showMaterialsOption = ref("");
const showMaterialsBeforeTask = ref(false);
const questions = ref([]);
const currentQuestion = ref(null);

const studiedQuestions = ref([]);
const reStudyQuestions = ref([]);

const taskResult = ref([]);
const taskResultCollection = ref([]);

const isStarted = ref(false);
const isComplete = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

const isWrong = ref(false);

const selectError = ref(false);

const questionsLeft = computed(() => questions.value.length);

const progressPercentage = computed(() => {
  const totalQuestions = taskData.value?.questions?.length || 0; // Предотвращаем ошибки, если данные ещё не загружены
  if (totalQuestions === 0) return 0; // Если общее количество предложении равно 0, возвращаем 0
  const completedQuestions = totalQuestions - questions.value.length;
  return (completedQuestions / totalQuestions) * 100;
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
      "tasks/get/choose_the_right_phrase/" + props.task.task_id,
    );

    taskData.value = res.data;
    onStartTask();
    time.value = taskData.value.options.seconds_per_sentence;
    showMaterialsOption.value = taskData.value.options.show_materials_option;
    materials.value = taskData.value.materials;

    questions.value = [...taskData.value.questions];

    questions.value.forEach((question) => {
      question.attempts = taskData.value.options.max_attempts;
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
    setQuestion();
    showTaskTimer.value = false;
  }, 3000);
};

// 1. Все правильные варианты текущего вопроса
const realCorrectAnswers = computed(() => {
  if (!currentQuestion.value?.answers) return [];
  return currentQuestion.value.answers.filter((a) => a.is_correct === true);
});

// 2. Варианты, которые выбрал пользователь
const userSelectedAnswers = computed(() => {
  if (!currentQuestion.value?.answers) return [];
  return currentQuestion.value.answers.filter((a) => a.is_selected === true);
});

// 3. Выбранные варианты, которые оказались правильными
const userCorrectAnswers = computed(() => {
  return userSelectedAnswers.value.filter((a) => a.is_correct === true);
});

// 4. Текст ответов через запятую для UI
const rightAnswersText = computed(() => {
  return realCorrectAnswers.value.map((a) => a.title).join(", ");
});

const userAnswersText = computed(() => {
  return userSelectedAnswers.value.map((a) => a.title).join(", ");
});

// 5. Флаг идеального совпадения (выбраны ВСЕ верные и ничего лишнего)
const isPerfectMatch = computed(() => {
  return (
    userSelectedAnswers.value.length === realCorrectAnswers.value.length &&
    userCorrectAnswers.value.length === realCorrectAnswers.value.length
  );
});

// Процент выполнения (от 0 до 100)
const userProgress = computed(() => {
  if (realCorrectAnswers.value.length === 0) return 0;

  const percentage =
    (userCorrectAnswers.value.length / realCorrectAnswers.value.length) * 100;
  return Math.round(percentage); // Округляем до целого числа
});

const setQuestion = () => {
  if (questions.value.length > 0) {
    // Устанавливаем текущий вопрос
    currentQuestion.value = questions.value[0];
    isComplete.value = false;
    isStarted.value = true;
    timeIsUp.value = false;
    isWrong.value = false;

    if (currentQuestion.value.answers.length > 0) {
      currentQuestion.value.answers.forEach((answer) => {
        answer.is_selected = false;
      });
    }
  } else {
    isFinished.value = true;
  }
};

const checkQuestion = (by_user) => {
  const current = currentQuestion.value;
  if (!current) return;

  // 1. Валидация выбора (используем .value из computed)
  if (userSelectedAnswers.value.length > realCorrectAnswers.value.length) {
    current.answers.forEach((answer) => {
      answer.is_selected = false;
    });

    if (by_user === true) {
      toast(
        t("pages.questions.answer.select_count", {
          count: realCorrectAnswers.value.length,
        }),
        {
          toastClassName: ["custom-toast", "warning"],
          timeout: 10000,
        },
      );

      selectError.value = true;

      setTimeout(() => {
        selectError.value = false;
      }, 1500);

      return;
    }
  }

  if (userSelectedAnswers.value.length === 0) {
    if (by_user === true) {
      toast(t("pages.questions.answer.select_one"), {
        toastClassName: ["custom-toast", "danger"],
        timeout: 10000,
      });

      selectError.value = true;

      setTimeout(() => {
        selectError.value = false;
      }, 1500);

      return;
    }
  }

  // Удаляем вопрос из очереди только после успешного прохождения проверок
  questions.value.shift();

  // 3. Проверяем наличие хотя бы одного правильного ответа
  const isPassed = userCorrectAnswers.value.length > 0;

  if (isPassed) {
    playSuccessSound();
    isComplete.value = true;
    isStarted.value = false;

    studiedQuestions.value.push(current);

    const resultPayload = {
      is_correct: true,
      right_answer: `<b class='text-success capitalize'>${rightAnswersText.value}</b>`,
      phrase_question_id: current.question_id,
      progress: userProgress.value, // Подставит 100 при идеальном ответе или процент при неидеальном
    };

    // user_answer добавляем только если ответ не идеальный
    if (!isPerfectMatch.value) {
      resultPayload.user_answer = `<b class='text-primary capitalize'>${userAnswersText.value}</b>`;
    }

    taskResultCollection.value.push(resultPayload);

    // Удаляем из повторного изучения, если он там находился
    reStudyQuestions.value = reStudyQuestions.value.filter(
      (q) => q.question_id !== current.question_id,
    );
  } else {
    // Ошибка (выбраны неправильные ответы ИЛИ таймер истек без выбора)
    playErrorSound();
    isWrong.value = true;
    isStarted.value = false;

    // Если выбор был пуст (таймер) — ставим текст "Нет ответа"
    const displayUserAnswer = userAnswersText.value || t("no_answer");

    if (current.attempts >= 1) {
      current.attempts--;
      questions.value.push(current);
    } else {
      taskResultCollection.value.push({
        is_correct: false,
        user_answer: `<b class='text-danger capitalize'>${displayUserAnswer}</b>`,
        right_answer: `<b class='text-success capitalize'>${rightAnswersText.value}</b>`,
        phrase_question_id: current.question_id,
        progress: userProgress.value,
      });

      reStudyQuestions.value.push(current);
    }
  }
};

const timerIsUp = () => {
  timeIsUp.value = true;
  checkQuestion(false);
};

const handleKeyPress = (event) => {
  if (event.key === "Enter") {
    if (!isFinished.value) {
      if (
        timeIsUp.value === true ||
        isWrong.value === true ||
        isComplete.value === true
      ) {
        setQuestion();
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
    if (newVal === taskData.value.questions.length) {
      saveTaskResult();
    }
  },
);
</script>
