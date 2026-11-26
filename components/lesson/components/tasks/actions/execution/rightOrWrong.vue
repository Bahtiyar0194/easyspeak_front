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
      :reStudyItems="reStudySentences"
      :taskResult="taskResult"
    >
      <template v-slot:task_content>
        <!-- Статус: сколько осталось / итог + таймер -->
        <div class="col-span-12">
          <div class="task-status-bar">
            <p v-if="timeIsUp" class="mb-0 font-semibold text-danger flex items-center gap-1.5">
              <i class="pi pi-clock" aria-hidden="true"></i>
              {{ $t("time_is_up") }}
            </p>
            <p v-else-if="isComplete" class="mb-0 font-semibold text-success flex items-center gap-1.5">
              <i class="pi pi-check-circle" aria-hidden="true"></i>
              {{ $t("right") }}
            </p>
            <p v-else-if="isWrong" class="mb-0 font-semibold text-danger flex items-center gap-1.5">
              <i class="pi pi-times-circle" aria-hidden="true"></i>
              {{ $t("wrong") }}
            </p>
            <p v-else-if="sentencesLeft > 0" class="mb-0 text-inactive">
              {{ $t("pages.sentences.sentences_left") }}:
              <b class="text-active">{{ sentencesLeft }}</b>
            </p>
            <span v-else></span>
            <countdownCircleTimer
              :totalSeconds="time"
              :startCommand="isStarted"
              :isWrong="isWrong"
              @timeIsUp="timerIsUp()"
            />
          </div>
        </div>

        <!-- Утверждение -->
        <div class="col-span-12">
          <div
            class="word-prompt"
            :class="{ 'is-right': isComplete, 'is-wrong-prompt': isWrong }"
          >
            <p class="text-xl font-semibold mb-0">{{ currentSentence?.sentence }}</p>
            <p v-if="taskData.options.show_translate" class="mb-0 text-inactive">
              {{ currentSentence?.sentence_translate }}
            </p>
          </div>
        </div>

        <!-- Варианты: после ответа остаются на месте и подсвечиваются -->
        <div v-if="currentSentence" class="col-span-12">
          <div class="flex flex-col gap-3">
            <div class="grid gap-2 sm:grid-cols-3">
              <trainingButton
                v-for="(button, buttonIndex) in answerButtons[currentSentence.answer_type]"
                :key="button + currentSentence.task_sentence_id"
                :text="button"
                :number="buttonIndex + 1"
                :state="buttonState(button)"
                @click="isStarted && checkSentence(button)"
              />
            </div>
            <p
              v-if="isStarted"
              class="text-inactive text-sm text-center hidden lg:flex items-center justify-center gap-1.5 mb-0"
            >
              <i class="bi bi-keyboard" aria-hidden="true"></i>
              {{ $t("pages.training.keyboard.numbers") }}
            </p>
          </div>
        </div>

        <div v-if="timeIsUp || isWrong || isComplete" class="col-span-12">
          <div class="task-actions justify-center">
            <button type="button" class="btn btn-primary btn-lg" @click="setSentence()">
              {{ $t("continue") }}
              <i class="pi pi-arrow-right" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </template>

      <template v-slot:task_result_content>
        <result
          :studiedSentences="studiedSentences"
          :reStudySentences="reStudySentences"
        />
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
import trainingButton from "../../../../../ui/trainingButton.vue";
import {
  playSuccessSound,
  playErrorSound,
  playAudio,
  stopAudio,
} from "../../../../../../utils/playAudio.js";
import result from "../../results/sentences/result.vue";

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();
const errors = ref([]);

const showTaskTimer = ref(false);
const taskData = ref(null);
const materials = ref([]);
const showMaterialsOption = ref("");
const showMaterialsBeforeTask = ref(false);
const sentences = ref([]);
const currentSentence = ref(null);

const studiedSentences = ref([]);
const reStudySentences = ref([]);

const taskResult = ref([]);
const taskResultCollection = ref([]);

const isStarted = ref(false);
const isComplete = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

const isWrong = ref(false);

const answerButtons = [
  ["True", "False", "Doesn't say"],
  ["Yes", "No", "Not given"],
];

const sentencesLeft = computed(() => sentences.value.length);

// Состояние кнопки варианта: до ответа — idle; после — правильный зелёный,
// выбранный неверный красный, остальные приглушены
const buttonState = (button) => {
  if (isStarted.value) return "idle";
  if (button == currentSentence.value?.answer) return "correct";
  if (button == currentSentence.value?.userAnswer) return "wrong";
  return "locked";
};

const progressPercentage = computed(() => {
  const totalSentences = taskData.value?.sentences?.length || 0; // Предотвращаем ошибки, если данные ещё не загружены
  if (totalSentences === 0) return 0; // Если общее количество предложении равно 0, возвращаем 0
  const completedSentences = totalSentences - sentences.value.length;
  return (completedSentences / totalSentences) * 100;
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
      "tasks/get/right_or_wrong/" + props.task.task_id,
    );

    taskData.value = res.data;
    onStartTask();
    time.value = taskData.value.options.seconds_per_sentence;
    showMaterialsOption.value = taskData.value.options.show_materials_option;
    materials.value = taskData.value.materials;

    sentences.value = [...taskData.value.sentences];

    sentences.value.forEach((sentence) => {
      sentence.attempts = taskData.value.options.max_attempts;
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
    setSentence();
    showTaskTimer.value = false;
  }, 3000);
};

const setSentence = () => {
  if (sentences.value.length > 0) {
    // Устанавливаем текущее предложение
    currentSentence.value = sentences.value[0];
    currentSentence.value.userAnswer = null;
    currentSentence.value.checked = false;
    isComplete.value = false;
    isStarted.value = true;
    timeIsUp.value = false;
    isWrong.value = false;

    if (Boolean(taskData.value.options.play_audio_at_the_begin)) {
      if (currentSentence.value.audio_file) {
        stopAudio();
        playAudio(
          config.public.apiBase +
            "/media/get/" +
            currentSentence.value.audio_file,
          {
            onEnded: () => {},
            onLoading: (state) => {},
          },
        );
      }
    }
  } else {
    isFinished.value = true;
  }
};

const checkSentence = (answer) => {
  if (!currentSentence.value || currentSentence.value.checked) return;
  currentSentence.value.checked = true;

  sentences.value.shift();
  currentSentence.value.userAnswer = answer ?? null;
  if (currentSentence.value.answer == answer) {
    isComplete.value = true;
    isStarted.value = false;

    if (Boolean(taskData.value.options.play_audio_with_the_correct_answer)) {
      if (currentSentence.value.audio_file) {
        playSuccessSound(
          config.public.apiBase +
            "/media/get/" +
            currentSentence.value.audio_file,
        );
      }
    }

    studiedSentences.value.push(currentSentence.value);

    taskResultCollection.value.push({
      is_correct: true,
      right_answer:
        "<b>" +
        currentSentence.value.sentence +
        "</b><br><b class='text-success capitalize'>" +
        currentSentence.value.userAnswer +
        "</b>",
      sentence_id: currentSentence.value.sentence_id,
    });

    if (
      reStudySentences.value.some(
        (s) => s.task_sentence_id === currentSentence.value.task_sentence_id,
      )
    ) {
      reStudySentences.value = reStudySentences.value.filter(
        (s) => s.task_sentence_id !== currentSentence.value.task_sentence_id,
      );
    }
  } else {
    if (
      Boolean(taskData.value.options.play_error_sound_with_the_incorrect_answer)
    ) {
      playErrorSound();
    }

    isWrong.value = true;
    isStarted.value = false;

    if (currentSentence.value.attempts >= 1) {
      currentSentence.value.attempts--;
      sentences.value.push(currentSentence.value);
    } else {
      taskResultCollection.value.push({
        is_correct: false,
        user_answer:
          "<b>" +
          currentSentence.value.sentence +
          "</b><br><b class='text-danger capitalize'>" +
          // раньше при окончании времени здесь сохранялось «undefined»
          (currentSentence.value.userAnswer ?? "—") +
          "</b>",
        right_answer:
          "<b>" +
          currentSentence.value.sentence +
          "</b><br><b class='text-success capitalize'>" +
          currentSentence.value.answer +
          "</b>",
        sentence_id: currentSentence.value.sentence_id,
      });

      reStudySentences.value.push(currentSentence.value);
    }
  }
};

const timerIsUp = () => {
  timeIsUp.value = true;
  isStarted.value = false;
  checkSentence();
};

const handleKeyPress = (event) => {
  const options = currentSentence.value
    ? answerButtons[currentSentence.value.answer_type] || []
    : [];
  const optionNumber = /^[1-9]$/.test(event.key) ? Number(event.key) : 0;
  if (
    !isFinished.value &&
    isStarted.value === true &&
    optionNumber >= 1 &&
    optionNumber <= options.length
  ) {
    checkSentence(options[optionNumber - 1]);
    return;
  }

  if (event.key === "Enter") {
    if (!isFinished.value) {
      if (
        timeIsUp.value === true ||
        isWrong.value === true ||
        isComplete.value === true
      ) {
        setSentence();
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
    if (newVal === taskData.value.sentences.length) {
      saveTaskResult();
    }
  },
);
</script>
