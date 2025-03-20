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
        time is up or is complete
        <!-- <div class="flex flex-col gap-y-4">
          <div
            class="flex flex-col gap-y-2"
            v-if="currentStudiedSentences.length > 0"
          >
            <p class="text-xl font-medium mb-0 text-success">
              {{
                currentReStudySentences.length > 0
                  ? $t("right_answers")
                  : $t("right")
              }}
            </p>

            <ul class="list-group nowrap">
              <li
                v-for="(sentence, sIndex) in currentStudiedSentences"
                :key="sIndex"
                class="flex justify-between items-center gap-x-2"
              >
                <div class="flex items-center gap-x-2">
                  <div
                    v-if="sentence.image_file"
                    :style="{
                      backgroundImage:
                        'url(' +
                        config.public.apiBase +
                        '/media/get/' +
                        sentence.image_file +
                        ')',
                    }"
                    class="w-10 h-10 bg-cover bg-no-repeat bg-center"
                  ></div>

                  <div
                    class="btn btn-square btn-outline-success pointer-events-none font-medium"
                  >
                    {{ sentence.userInput }}
                  </div>

                  <div class="flex flex-col">
                    <div class="font-medium">
                      {{ sentence.sentence }}
                    </div>
                    <span class="text-xs text-inactive">{{
                      sentence.sentence_translate
                    }}</span>
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
            v-if="currentReStudySentences.length > 0"
          >
            <p class="text-xl font-medium mb-0 text-danger">
              {{ $t("for_re_examination") }}
            </p>

            <ul class="list-group nowrap">
              <li
                v-for="(sentence, rIndex) in currentReStudySentences"
                :key="rIndex"
                class="flex justify-between items-center gap-x-2"
              >
                <div class="flex flex-col gap-2">
                  <div>
                    <p class="mb-1 text-inactive font-normal">
                      {{ $t("your_answer") }}:
                    </p>

                    <div class="flex items-center gap-x-2">
                      <div
                        class="btn btn-square btn-outline-danger pointer-events-none font-medium"
                      >
                        {{ sentence.userInput }}
                      </div>

                      <div class="flex flex-col">
                        <div class="font-medium">
                          {{ sentence.sentence }}
                        </div>
                        <span class="text-xs text-inactive">{{
                          sentence.sentence_translate
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p class="mb-1 text-inactive font-normal">
                      {{ $t("right_answer") }}:
                    </p>

                    <div class="flex items-center gap-x-2">
                      <div
                        class="btn btn-square btn-outline-success pointer-events-none font-medium"
                      >
                        {{
                          currentSentences.findIndex(
                            (p) =>
                              p.task_sentence_id === sentence.task_sentence_id
                          ) + 1
                        }}
                      </div>

                      <div class="flex flex-col">
                        <div class="font-medium">
                          {{ sentence.sentence }}
                        </div>
                        <span class="text-xs text-inactive">{{
                          sentence.sentence_translate
                        }}</span>
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
              v-if="sentences.length > 0"
              class="btn btn-outline-primary"
              @click="setSentences()"
            >
              <i class="pi pi-arrow-right"></i> {{ $t("continue") }}
            </button>
            <button v-else class="btn btn-light" @click="isFinished = true">
              <i class="pi pi-check"></i>
              {{ $t("pages.tasks.complete_the_task") }}
            </button>
          </div>
        </div> -->
      </div>

      <div v-else class="col-span-12">
        <div class="custom-grid">
          <!-- <div
            :class="
              taskData.options.sentence_material_type_slug == 'audio'
                ? 'col-span-12'
                : 'col-span-12 lg:col-span-6'
            "
            v-for="(sentence, sentenceIndex) in currentSentenceMaterials"
            :key="sentenceIndex"
          >
            <div
              v-if="taskData.options.sentence_material_type_slug == 'audio'"
              class="flex gap-3 items-center text-lg"
            >
              <div
                @click="focusInput($event)"
                class="btn btn-square btn-lg flex justify-center items-center ml-1"
                :class="
                  checkingStatus === true &&
                  (sentence.userInput === '' || sentence.userInput === ' ')
                    ? 'pulse btn-danger'
                    : 'btn-outline-primary'
                "
              >
                <input
                  v-model="sentence.userInput"
                  @input="changeFocus($event)"
                  type="text"
                  class="user_input"
                  :style="{
                    width:
                      currentSentences.length.toString().length + 0.5 + 'ch',
                    textAlign: 'center',
                  }"
                  :maxlength="currentSentences.length.toString().length"
                />
              </div>
              <div class="w-full">
                <audioPlayerWithWave
                  :src="
                    config.public.apiBase +
                    '/media/get/' +
                    sentence.material.target
                  "
                />
              </div>
            </div>
            <div v-else class="relative">
              <div class="absolute left-2 top-2 z-10">
                <div
                  @click="focusInput($event)"
                  class="btn btn-square btn-lg flex justify-center items-center ml-1"
                  :class="
                    checkingStatus === true &&
                    (sentence.userInput === '' || sentence.userInput === ' ')
                      ? 'pulse btn-danger'
                      : 'btn-active bg-active'
                  "
                >
                  <input
                    v-model="sentence.userInput"
                    @input="changeFocus($event)"
                    type="text"
                    class="user_input"
                    :style="{
                      width:
                        currentSentences.length.toString().length + 0.5 + 'ch',
                      textAlign: 'center',
                    }"
                    :maxlength="currentSentences.length.toString().length"
                  />
                </div>
              </div>
              <videoPlayer
                v-if="taskData.options.sentence_material_type_slug === 'video'"
                :src="
                  config.public.apiBase +
                  '/media/get/' +
                  sentence.material.target
                "
              />
              <img
                v-else-if="
                  taskData.options.sentence_material_type_slug === 'image'
                "
                :src="
                  config.public.apiBase +
                  '/media/get/' +
                  sentence.material.target
                "
                class="w-full h-auto"
              />
            </div>
          </div> -->

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
                      >{{ question.question }}</span
                    >
                  </div>

                  <div
                    v-if="taskData.options.answer_the_questions_option == 'text'"
                    class="col-span-12"
                  >
                    <div class="form-group-border active">
                      <i class="pi pi-reply"></i>
                      <input
                        :name="'answer_' + questionIndex"
                        type="text"
                        placeholder=" "
                      />
                      <label>
                        {{ $t("type_your_answer") }}
                      </label>
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
      <!-- <result
        :studiedSentences="studiedSentences"
        :reStudySentences="reStudySentences"
      /> -->
    </template>
  </taskLayout>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { useRouter } from "nuxt/app";
import taskLayout from "../../taskLayout.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import audioPlayerWithWave from "../../../../../ui/audioPlayerWithWave.vue";
import videoPlayer from "../../../../../ui/videoPlayer.vue";
import result from "../../results/sentences/result.vue";

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();

const showTaskTimer = ref(false);
const taskData = ref(null);
const materials = ref([]);
const showMaterialsOption = ref("");
const showMaterialsBeforeTask = ref(false);
const questions = ref([]);
const currentQuestions = ref([]);
const checkingStatus = ref(false);

const studiedSentences = ref([]);
const currentStudiedSentences = ref([]);

const reStudySentences = ref([]);
const currentReStudySentences = ref([]);

const isStarted = ref(false);
const isComplete = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

const isFinished = ref(false);

const progressPercentage = computed(() => {
  const totalSentences = taskData.value?.sentences?.length || 0; // Предотвращаем ошибки, если данные ещё не загружены
  if (totalSentences === 0) return 0; // Если общее количество фраз равно 0, возвращаем 0
  const completedSentences = totalSentences - sentences.value.length;
  return (completedSentences / totalSentences) * 100;
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
      "tasks/answer_the_questions/" + props.task.task_id
    );

    taskData.value = res.data;
    showMaterialsOption.value = taskData.value.options.show_materials_option;
    materials.value = taskData.value.materials;
    questions.value = [...taskData.value.questions];

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
    setQuestions();
    showTaskTimer.value = false;
  }, 3000);
};

const setQuestions = () => {
  currentStudiedSentences.value = [];
  currentReStudySentences.value = [];

  if (questions.value.length > 0) {
    currentQuestions.value = questions.value.slice(
      0,
      taskData.value.options.impression_limit
    );

    currentQuestions.value.forEach((question) => {
      question.userInput = "";
    });

    // setTimeout(() => {
    //   const firstInput = document.querySelector(".user_input");
    //   if (firstInput) {
    //     firstInput.focus();
    //   }
    // }, 100);

    time.value =
      taskData.value.options.seconds_per_question *
      currentQuestions.value.length;

    isComplete.value = false;
    isStarted.value = true;
    timeIsUp.value = false;
    checkingStatus.value = false;
  }
};

// Проверка всех фраз
const checkSentences = () => {
  currentSentenceMaterials.value.forEach((sentence) => {
    sentences.value = sentences.value.filter(
      (s) => s.task_sentence_id !== sentence.task_sentence_id
    );

    if (
      /^\d+$/.test(sentence.userInput) &&
      currentSentences.value[sentence.userInput - 1] &&
      sentence.task_sentence_id ===
        currentSentences.value[sentence.userInput - 1].task_sentence_id
    ) {
      studiedSentences.value.push(sentence);
      currentStudiedSentences.value.push(sentence);

      if (
        reStudySentences.value.some(
          (s) => s.task_sentence_id === sentence.task_sentence_id
        )
      ) {
        reStudySentences.value = reStudySentences.value.filter(
          (s) => s.task_sentence_id !== sentence.task_sentence_id
        );
      }
    } else {
      currentReStudySentences.value.push(sentence);

      if (sentence.attempts >= 1) {
        sentences.value.push(sentence);
        sentence.attempts--;
      } else {
        reStudySentences.value.push(sentence);
      }
    }
  });
};

const acceptAnswers = () => {
  for (
    let sentenceIndex = 0;
    sentenceIndex < currentSentences.value.length;
    sentenceIndex++
  ) {
    const sentence = currentSentences.value[sentenceIndex];

    if (sentence.userInput === "" || sentence.userInput === " ") {
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
    checkSentences();
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
  const value = currentInput.value;

  if (value == "") {
    return false;
  } else if (value == " ") {
    value = "";
  } else {
    const inputs = Array.from(document.getElementsByClassName("user_input"));
    const currentIndex = inputs.indexOf(currentInput);

    // Найти следующий пустой input
    for (let i = currentIndex + 1; i < inputs.length; i++) {
      if (inputs[i].value === "") {
        inputs[i].focus();
        break;
      }
    }
  }
};

const timerIsUp = () => {
  timeIsUp.value = true;
  isStarted.value = false;
  checkSentences();
};

const handleKeyPress = (event) => {
  if (event.key === "Enter") {
    if (!isFinished.value) {
      if (timeIsUp.value === true || isComplete.value === true) {
        if (sentences.value.length > 0) {
          setSentences();
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

// Инициализация при монтировании
onMounted(() => {
  changeModalSize("modal-xl");
  getTask();
  window.addEventListener("keydown", handleKeyPress);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyPress);
});
</script>
