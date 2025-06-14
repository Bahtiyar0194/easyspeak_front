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
    :reStudyItems="reStudySentences"
    :taskResult="taskResult"
  >
    <template v-slot:task_content>
      <div class="col-span-12">
        <p v-if="timeIsUp" class="font-medium text-center text-danger">
          {{ $t("time_is_up") }}
        </p>
        <p v-else-if="isComplete" class="font-medium text-center text-success">
          {{ $t("right") }}
        </p>
        <p v-else-if="isWrong" class="font-medium text-center text-danger">
          {{ $t("wrong") }}
        </p>
        <p v-else-if="sentencesLeft > 0" class="text-center">
          {{ $t("pages.sentences.sentences_left") }}:
          <b>{{ sentencesLeft }}</b>
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
                {{ currentSentence?.sentence }}
              </p>
            </div>
            <div v-if="taskData.options.show_translate" class="col-span-12">
              <p class="mb-0">{{ currentSentence?.sentence_translate }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isWrong === true" class="col-span-12">
        <div class="custom-grid">
          <div class="col-span-12 lg:col-span-6">
            <div class="card p-4 text-center">
              <p class="text-inactive text-xs font-medium mb-0">
                {{ $t("your_answer") }}
              </p>
              <p class="text-danger font-medium mb-0">
                {{ currentSentence?.userAnswer || $t("no_answer") }}
              </p>
            </div>
          </div>
          <div class="col-span-12 lg:col-span-6">
            <div class="card p-4 text-center">
              <p class="text-inactive text-xs font-medium mb-0">
                {{ $t("right_answer") }}
              </p>
              <p class="text-success font-medium mb-0">
                {{ currentSentence?.answer }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isStarted" class="col-span-12">
        <div class="custom-grid">
          <div class="col-span-12">
            <div class="btn-wrap items-center justify-center">
              <button
                v-for="button in answerButtons"
                :key="button"
                type="button"
                class="btn btn-light btn-sm"
                @click="checkSentence(button)"
              >
                {{ button }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="timeIsUp || isWrong || isComplete" class="col-span-12">
        <div class="flex justify-end">
          <button class="btn btn-primary" @click="setSentence()">
            <i class="pi pi-arrow-right"></i> {{ $t("continue") }}
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
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { useRouter } from "nuxt/app";
import taskLayout from "../../taskLayout.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import {
  playSuccessSound,
  playErrorSound,
  playAudio,
  stopAudio,
} from "../../../../../../utils/playAudio";
import result from "../../results/sentences/result.vue";

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();

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

const answerButtons = ["True", "False", "Doesn't say"];

const sentencesLeft = computed(() => sentences.value.length);

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
      "tasks/get/true_or_false/" + props.task.task_id
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
            currentSentence.value.audio_file
        );
      }
    }
  } else {
    isFinished.value = true;
  }
};

const checkSentence = (answer) => {
  sentences.value.shift();
  currentSentence.value.userAnswer = answer;
  if (currentSentence.value.answer == answer) {
    isComplete.value = true;
    isStarted.value = false;

    if (Boolean(taskData.value.options.play_audio_with_the_correct_answer)) {
      if (currentSentence.value.audio_file) {
        playSuccessSound(
          config.public.apiBase +
            "/media/get/" +
            currentSentence.value.audio_file
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
        (s) => s.task_sentence_id === currentSentence.value.task_sentence_id
      )
    ) {
      reStudySentences.value = reStudySentences.value.filter(
        (s) => s.task_sentence_id !== currentSentence.value.task_sentence_id
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
          currentSentence.value.userAnswer +
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
  }
);
</script>
