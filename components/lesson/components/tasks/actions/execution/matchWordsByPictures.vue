<template>
  <countdownTaskTimer v-if="showTaskTimer" />
  <div class="custom-grid">
    <div v-if="!isFinished" class="col-span-12">
      <div class="custom-grid">
        <div class="col-span-12">
          <p class="mb-0 text-corp font-medium">{{ props.task.task_name }}</p>
        </div>

        <div class="col-span-12">
          <progressBar :progressPercentage="progressPercentage" />

          <p v-if="timeIsUp" class="font-medium text-center text-danger">
            {{ $t("time_is_up") }}
          </p>
          <p v-else-if="words.length > 0" class="text-center">
            {{ $t("pages.dictionary.words_left") }}:
            <b>{{ words.length }}</b>
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
              v-if="currentStudiedWords.length > 0"
            >
              <p class="text-xl font-medium mb-0 text-success">
                {{
                  currentReStudyWords.length > 0
                    ? $t("right_answers")
                    : $t("right")
                }}
              </p>

              <ul class="list-group nowrap">
                <li
                  v-for="(word, sIndex) in currentStudiedWords"
                  :key="sIndex"
                  class="flex justify-between items-center gap-x-2"
                >
                  <div class="flex items-center gap-x-2">
                    <div
                      v-if="word.image_file"
                      :style="{
                        backgroundImage:
                          'url(' +
                          config.public.apiBase +
                          '/media/get/' +
                          word.image_file +
                          ')',
                      }"
                      class="w-10 h-10 bg-cover bg-no-repeat bg-center"
                    ></div>

                    <div
                      class="btn btn-square btn-outline-success pointer-events-none font-medium"
                    >
                      {{ word.userInput }}
                    </div>

                    <div class="flex flex-col">
                      <div class="font-medium">
                        {{ word.word }}
                      </div>
                      <span class="text-xs text-inactive">{{
                        word.word_translate
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
              v-if="currentReStudyWords.length > 0"
            >
              <p class="text-xl font-medium mb-0 text-danger">
                {{ $t("for_re_examination") }}
              </p>

              <ul class="list-group nowrap">
                <li
                  v-for="(word, rIndex) in currentReStudyWords"
                  :key="rIndex"
                  class="flex justify-between items-center gap-x-2"
                >
                  <div class="flex flex-wrap gap-4">
                    <div>
                      <p class="mb-1 text-inactive font-normal">
                        {{ $t("your_answer") }}:
                      </p>

                      <div class="flex items-center gap-x-2">
                        <div
                          class="btn btn-square btn-outline-danger pointer-events-none font-medium"
                        >
                          {{ word.userInput }}
                        </div>

                        <div class="flex flex-col">
                          <div class="font-medium">
                            {{ word.word }}
                          </div>
                          <span class="text-xs text-inactive">{{
                            word.word_translate
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
                            currentPictures.findIndex(
                              (p) => p.task_word_id === word.task_word_id
                            ) + 1
                          }}
                        </div>

                        <div class="flex flex-col">
                          <div class="font-medium">
                            {{ word.word }}
                          </div>
                          <span class="text-xs text-inactive">{{
                            word.word_translate
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
                v-if="words.length > 0"
                class="btn btn-outline-primary"
                @click="setWords()"
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
            <div class="col-span-12 lg:col-span-6">
              <div class="custom-grid">
                <div
                  v-for="(picture, pictureIndex) in currentPictures"
                  :key="pictureIndex"
                  class="col-span-3 lg:col-span-6 relative rounded-xl border-inactive overflow-hidden"
                >
                  <div
                    class="absolute left-2 top-2 w-6 h-6 bg-success rounded-full flex items-center justify-center text-white text-lg"
                  >
                    {{ pictureIndex + 1 }}
                  </div>
                  <img
                    class="w-full p-3"
                    :src="
                      config.public.apiBase + '/media/get/' + picture.image_file
                    "
                  />
                </div>
              </div>
            </div>

            <div class="col-span-12 lg:col-span-6">
              <ul class="list-group nowrap">
                <li
                  v-for="(word, wordIndex) in currentWords"
                  :key="wordIndex"
                  class="list-item"
                >
                  <div class="flex gap-3 items-center text-lg">
                    <div
                      @click="focusInput($event)"
                      class="btn btn-square btn-lg flex justify-center items-center"
                      :class="
                        checkingStatus === true &&
                        (word.userInput === '' || word.userInput === ' ')
                          ? 'pulse btn-danger'
                          : 'btn-outline-primary'
                      "
                    >
                      <input
                        v-model="word.userInput"
                        @input="changeFocus($event)"
                        type="text"
                        class="user_input"
                        :style="{
                          width:
                            currentWords.length.toString().length + 0.5 + 'ch',
                          textAlign: 'center',
                        }"
                        :maxlength="currentWords.length.toString().length"
                      />
                    </div>

                    <div class="flex gap-x-2 items-center">
                      <audioButton
                        v-if="
                          word.audio_file &&
                          taskData?.options?.show_audio_button
                        "
                        :src="
                          config.public.apiBase + '/media/get/' + word.audio_file
                        "
                      />
                      <div class="flex flex-col">
                        <span class="font-medium">{{ word.word }}</span>
                        <div class="flex flex-wrap gap-x-2">
                          <span
                            v-if="taskData?.options?.show_transcription"
                            class="text-xs"
                          >
                            [{{ word.transcription }}]
                          </span>
                          <span
                            v-if="taskData?.options?.show_translate"
                            class="text-inactive text-xs"
                          >
                            {{ word.word_translate }}
                          </span>
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
      </div>
    </div>
    <result v-else :studiedWords="studiedWords" :reStudyWords="reStudyWords" />
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { useRouter } from "nuxt/app";
import audioButton from "../../../../../ui/audioButton.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import countdownTaskTimer from "../../../../../ui/countdownTaskTimer.vue";
import progressBar from "../../../../../ui/progressBar.vue";
import result from "../../results/dictionary/result.vue";

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();

const showTaskTimer = ref(false);
const taskData = ref(null);
const words = ref([]);
const currentWords = ref([]);
const currentPictures = ref([]);
const checkingStatus = ref(false);

const studiedWords = ref([]);
const currentStudiedWords = ref([]);

const reStudyWords = ref([]);
const currentReStudyWords = ref([]);

const isStarted = ref(false);
const isComplete = ref(false);

const time = ref(0);
const timeIsUp = ref(false);

const isFinished = ref(false);

const progressPercentage = computed(() => {
  const totalWords = taskData.value?.words?.length || 0; // Предотвращаем ошибки, если данные ещё не загружены
  if (totalWords === 0) return 0; // Если общее количество слов равно 0, возвращаем 0
  const completedWords = totalWords - words.value.length;
  return (completedWords / totalWords) * 100;
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
      "tasks/match_words_by_pictures/" + props.task.task_id
    );

    showTaskTimer.value = true;
    taskData.value = res.data;
    words.value = [...taskData.value.words];

    words.value.forEach((word) => {
      word.attempts = taskData.value.options.max_attempts;
    });

    setTimeout(() => {
      setWords();
      showTaskTimer.value = false;
    }, 3000);
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

const setWords = () => {
  currentStudiedWords.value = [];
  currentReStudyWords.value = [];

  if (words.value.length > 0) {
    currentWords.value = words.value.slice(
      0,
      taskData.value.options.impression_limit
    );

    currentPictures.value = [...currentWords.value].sort(
      () => Math.random() - 0.5
    );

    currentWords.value.forEach((word) => {
      word.userInput = "";
    });

    setTimeout(() => {
      const firstInput = document.querySelector(".user_input");
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);

    time.value =
      taskData.value.options.seconds_per_word * currentWords.value.length;

    isComplete.value = false;
    isStarted.value = true;
    timeIsUp.value = false;
    checkingStatus.value = false;
  }
};

// Проверка всех слов
const checkWords = () => {
  currentWords.value.forEach((word) => {
    words.value = words.value.filter(
      (w) => w.task_word_id !== word.task_word_id
    );

    if (
      /^\d+$/.test(word.userInput) &&
      currentPictures.value[word.userInput - 1] &&
      word.task_word_id ===
        currentPictures.value[word.userInput - 1].task_word_id
    ) {
      studiedWords.value.push(word);
      currentStudiedWords.value.push(word);

      if (
        reStudyWords.value.some((w) => w.task_word_id === word.task_word_id)
      ) {
        reStudyWords.value = reStudyWords.value.filter(
          (w) => w.task_word_id !== word.task_word_id
        );
      }
    } else {
      currentReStudyWords.value.push(word);

      if (word.attempts >= 1) {
        words.value.push(word);
        word.attempts--;
      } else {
        reStudyWords.value.push(word);
      }
    }
  });
};

const acceptAnswers = () => {
  for (let wordIndex = 0; wordIndex < currentWords.value.length; wordIndex++) {
    const word = currentWords.value[wordIndex];

    if (word.userInput === "" || word.userInput === " ") {
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
    checkWords();
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
  checkWords();
};

const handleKeyPress = (event) => {
  if (event.key === "Enter") {
    if (!isFinished.value) {
      if (timeIsUp.value === true || isComplete.value === true) {
        if (words.value.length > 0) {
          setWords();
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
  getTask();
  changeModalSize("modal-2xl");
  window.addEventListener("keydown", handleKeyPress);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyPress);
});
</script>
