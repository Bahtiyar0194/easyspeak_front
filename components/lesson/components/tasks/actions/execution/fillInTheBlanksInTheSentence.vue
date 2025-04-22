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
        <p v-else-if="sentences.length > 0" class="text-center">
          {{ $t("pages.sentences.sentences_left") }}:
          <b>{{ sentences.length }}</b>
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
            v-if="currentStudiedSentences.length > 0"
          >
            <p class="text-xl font-medium mb-0 text-success">
              {{
                currentReStudySentences.length > 0
                  ? $t("right_answers")
                  : $t("right")
              }}
            </p>
            <ul class="list-group nowrap" ref="rightAnswers">
              <li
                class="list-item"
                v-for="(sentence, sIndex) in currentStudiedSentences"
                :key="sIndex"
              >
                <div class="flex justify-between items-center gap-x-2">
                  <div>
                    <div :id="'right_answer_' + sentence.task_sentence_id">
                      <div class="flex flex-wrap gap-x-1 font-medium">
                        <div
                          v-for="(word, wordIndex) in sentence.sentence.split(
                            ' '
                          )"
                          :key="wordIndex"
                        >
                          <span
                            :class="
                              ((taskData?.options.find_word_option ==
                                'with_options' &&
                                sentence.missingWordPositionIndex ==
                                  wordIndex) ||
                                ((taskData?.options.find_word_option ==
                                  'with_hints' ||
                                  taskData?.options.find_word_option ==
                                    'without_hints') &&
                                  sentence.missingWords
                                    .find((w) => w.word_position == wordIndex)
                                    ?.userInput.toLowerCase() ==
                                    removePunctuation(word).toLowerCase()) ||
                                (taskData?.options.find_word_option ==
                                  'with_first_letter' &&
                                  removePunctuation(
                                    sentence.missingWords.find(
                                      (w) => w.word_position == wordIndex
                                    )?.userInput
                                  ).toLowerCase() ==
                                    removePunctuation(word)
                                      .toLowerCase()
                                      .slice(1) &&
                                  word.length > 1)) &&
                              'text-success'
                            "
                            >{{ word }}</span
                          >
                        </div>
                      </div>
                    </div>
                    <p class="mb-0 text-xs text-inactive font-medium">
                      {{ sentence.sentence_translate }}
                    </p>
                  </div>

                  <div class="flex items-center">
                    <audioButton
                      v-if="sentence.audio_file"
                      :src="
                        config.public.apiBase +
                        '/media/get/' +
                        sentence.audio_file
                      "
                    />
                    <div class="step-item xs completed">
                      <div class="step-icon">
                        <i class="pi pi-check"></i>
                      </div>
                    </div>
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
            <ul class="list-group nowrap" ref="wrongAnswers">
              <li
                class="list-item"
                v-for="(sentence, rIndex) in currentReStudySentences"
                :key="rIndex"
              >
                <div class="flex justify-between items-center gap-x-2">
                  <div>
                    <p class="mb-0 text-xs text-inactive font-normal">
                      {{ $t("your_answer") }}:
                    </p>
                    <div :id="'user_answer_' + sentence.task_sentence_id">
                      <div class="flex flex-wrap gap-x-1 font-medium">
                        <div
                          v-for="(word, wordIndex) in sentence.sentence.split(
                            ' '
                          )"
                          :key="wordIndex"
                        >
                          <span
                            class="underline text-danger"
                            v-if="
                              taskData?.options.find_word_option ==
                                'with_options' &&
                              wordIndex === sentence.missingWordPositionIndex &&
                              sentence.selectedOptionIndex !== undefined &&
                              sentence.selectedOptionIndex >= 0
                            "
                          >
                            {{
                              sentence.missingWords[
                                sentence.selectedOptionIndex
                              ]?.word_option
                            }}
                          </span>
                          <span
                            class="underline flex"
                            v-else-if="
                              taskData?.options.find_word_option !=
                                'with_options' &&
                              sentence.missingWords.find(
                                (w) => w.word_position == wordIndex
                              )?.userInput
                            "
                            :class="
                              ((taskData?.options.find_word_option ==
                                'with_hints' ||
                                taskData?.options.find_word_option ==
                                  'without_hints') &&
                                sentence.missingWords
                                  .find((w) => w.word_position == wordIndex)
                                  ?.userInput.toLowerCase() ==
                                  removePunctuation(word).toLowerCase()) ||
                              (taskData?.options.find_word_option ==
                                'with_first_letter' &&
                                removePunctuation(
                                  sentence.missingWords.find(
                                    (w) => w.word_position == wordIndex
                                  )?.userInput
                                ).toLowerCase() ==
                                  removePunctuation(word)
                                    .toLowerCase()
                                    .slice(1) &&
                                word.length > 1)
                                ? 'text-success'
                                : 'text-danger'
                            "
                          >
                            <span
                              v-if="
                                taskData?.options.find_word_option ==
                                'with_first_letter'
                              "
                              class="text-corp"
                              >{{ word[0] }}</span
                            >
                            {{
                              sentence.missingWords.find(
                                (w) => w.word_position == wordIndex
                              )?.userInput
                            }}
                          </span>

                          <span
                            class="text-danger"
                            v-else-if="
                              (taskData?.options.find_word_option ==
                                'with_options' &&
                                wordIndex ===
                                  sentence.missingWordPositionIndex &&
                                sentence.selectedOptionIndex === undefined) ||
                              (taskData?.options.find_word_option !=
                                'task_options' &&
                                sentence.missingWords.find(
                                  (w) => w.word_position == wordIndex
                                )?.userInput == '')
                            "
                          >
                            <span
                              v-if="
                                taskData?.options.find_word_option ==
                                'with_first_letter'
                              "
                              class="text-corp"
                              >{{ word[0] }}</span
                            >_____
                          </span>

                          <span v-else>{{ word }}</span>
                        </div>
                      </div>
                    </div>

                    <p class="mb-0 text-xs text-inactive font-normal">
                      {{ $t("right_answer") }}:
                    </p>
                    <div :id="'right_answer_' + sentence.task_sentence_id">
                      <div class="flex flex-wrap gap-x-1 font-medium">
                        <div
                          v-for="(word, wordIndex) in sentence.sentence.split(
                            ' '
                          )"
                          :key="wordIndex"
                        >
                          <span
                            class="underline text-success"
                            v-if="
                              (taskData?.options.find_word_option ==
                                'with_options' &&
                                sentence.missingWordPositionIndex ==
                                  wordIndex) ||
                              (taskData?.options.find_word_option !=
                                'with_options' &&
                                sentence.missingWords.find(
                                  (w) => w.word_position == wordIndex
                                )?.word_position == wordIndex)
                            "
                            >{{ word }}</span
                          >
                          <span v-else>{{ word }}</span>
                        </div>
                      </div>
                    </div>
                    <p class="mb-0 text-xs text-inactive font-medium">
                      {{ sentence.sentence_translate }}
                    </p>
                  </div>

                  <div class="flex items-center">
                    <audioButton
                      v-if="sentence.audio_file"
                      :src="
                        config.public.apiBase +
                        '/media/get/' +
                        sentence.audio_file
                      "
                    />
                    <div class="step-item xs failed">
                      <div class="step-icon">
                        <i class="pi pi-replay"></i>
                      </div>
                    </div>
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
        </div>
      </div>

      <div v-else class="col-span-12">
        <div class="custom-grid">
          <div
            v-if="taskData?.options.find_word_option == 'with_hints'"
            class="col-span-12 border-b-inactive"
          >
            <div class="btn-wrap justify-center items-center mb-4">
              <button
                v-for="(word, wordIndex) in hiddenWords"
                :key="wordIndex"
                type="button"
                class="btn btn btn-light draggable"
                :class="{
                  'disabled line-through': word.disabled,
                }"
                :draggable="true"
                @dragstart="onDragStart($event, wordIndex)"
                @click="insertWordToInput(word)"
              >
                {{ word.word }}
              </button>
            </div>
          </div>
          <div
            v-for="(sentence, sentenceIndex) in currentSentences"
            :key="sentenceIndex"
            class="col-span-12"
          >
            <div
              class="flex flex-wrap items-center gap-1 font-medium text-lg mb-2"
            >
              <span>{{ sentenceIndex + 1 }}.</span>
              <div
                class="select-none"
                v-for="(word, wordIndex) in sentence.sentence.split(' ')"
                :key="wordIndex"
              >
                <span
                  class="underline text-corp"
                  v-if="
                    taskData?.options.find_word_option == 'with_options' &&
                    wordIndex === sentence.missingWordPositionIndex &&
                    sentence.selectedOptionIndex >= 0
                  "
                  >{{
                    sentence.missingWords[sentence.selectedOptionIndex]
                      .word_option
                  }}</span
                >
                <div
                  v-else-if="
                    taskData?.options.find_word_option == 'with_options' &&
                    wordIndex === sentence.missingWordPositionIndex
                  "
                >
                  <span>_______</span>
                </div>
                <div
                  v-else-if="
                    (taskData?.options.find_word_option == 'with_hints' ||
                      taskData?.options.find_word_option == 'without_hints') &&
                    sentence.missingWords.find(
                      (w) => w.word_position == wordIndex
                    )
                  "
                >
                  <div
                    class="px-2 rounded-lg flex items-center border"
                    :class="
                      unFilledSentences.includes(sentenceIndex) &&
                      sentence.missingWords.find(
                        (w) => w.word_position == wordIndex
                      ).userInput === ''
                        ? 'pulse border-danger bg-danger'
                        : 'border-active'
                    "
                    @drop="onDrop($event, sentenceIndex, wordIndex)"
                    @dragover="onDragOver"
                  >
                    <input
                      v-model="
                        sentence.missingWords.find(
                          (w) => w.word_position == wordIndex
                        ).userInput
                      "
                      :disabled="false"
                      class="lowercase"
                      :style="{
                        width:
                          sentence.missingWords.find(
                            (w) => w.word_position == wordIndex
                          ).userInput !== ''
                            ? sentence.missingWords.find(
                                (w) => w.word_position == wordIndex
                              ).userInput.length +
                              0.5 +
                              'ch'
                            : '4ch',
                        'text-align': 'center',
                      }"
                      @input="disableTheHiddenWord()"
                      type="text"
                    />
                    <button
                      v-if="
                        sentence.missingWords.find(
                          (w) => w.word_position == wordIndex
                        ).userInput !== ''
                      "
                      @click="clearInput(sentenceIndex, wordIndex)"
                      class="text-danger ml-0.5 mt-1"
                    >
                      <i class="pi pi-delete-left"></i>
                    </button>
                  </div>
                </div>
                <div
                  v-else-if="
                    taskData?.options.find_word_option == 'with_first_letter' &&
                    sentence.missingWords.find(
                      (w) => w.word_position == wordIndex
                    )
                  "
                  class="flex items-center"
                >
                  <span class="text-corp">{{ word[0] }}</span>
                  <div
                    class="flex items-center"
                    :class="
                      unFilledSentences.includes(sentenceIndex) &&
                      sentence.missingWords.find(
                        (w) => w.word_position == wordIndex
                      ).userInput === ''
                        ? 'pulse border-b-danger bg-danger'
                        : 'border-b-active'
                    "
                  >
                    <input
                      v-model="
                        sentence.missingWords.find(
                          (w) => w.word_position == wordIndex
                        ).userInput
                      "
                      :disabled="false"
                      class="lowercase"
                      :style="{
                        marginTop: '0.05rem',
                        width:
                          sentence.missingWords.find(
                            (w) => w.word_position == wordIndex
                          ).userInput !== ''
                            ? sentence.missingWords.find(
                                (w) => w.word_position == wordIndex
                              ).userInput.length +
                              0.2 +
                              'ch'
                            : word.slice(1).length + 0.2 + 'ch',
                      }"
                      @input="disableTheHiddenWord()"
                      type="text"
                    />
                    <button
                      v-if="
                        sentence.missingWords.find(
                          (w) => w.word_position == wordIndex
                        ).userInput !== ''
                      "
                      @click="clearInput(sentenceIndex, wordIndex)"
                      class="text-danger ml-0.5 mt-1"
                    >
                      <i class="pi pi-delete-left"></i>
                    </button>
                  </div>
                  <span class="text-corp" v-if="endsWithPunctuation(word)">{{
                    word[word.length - 1]
                  }}</span>
                </div>
                <span v-else>{{ word }}</span>
              </div>
            </div>

            <div
              v-if="taskData?.options.find_word_option == 'with_options'"
              class="btn-wrap"
            >
              <button
                v-for="(option, optionIndex) in sentence.missingWords"
                :key="optionIndex"
                type="button"
                class="btn btn-sm btn-light"
                :class="
                  unFilledSentences.includes(sentenceIndex)
                    ? 'pulse btn-danger'
                    : sentence.selectedOptionIndex === optionIndex &&
                      'text-hidden disabled'
                "
                @click="insertWord(sentenceIndex, optionIndex)"
              >
                {{ option.word_option }}
              </button>
            </div>
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
      <result
        :studiedSentences="studiedSentences"
        :reStudySentences="reStudySentences"
      />
    </template>
  </taskLayout>
</template>

<script setup>
import { ref, onMounted, inject, nextTick } from "vue";
import { useRouter } from "nuxt/app";
import taskLayout from "../../taskLayout.vue";
import audioButton from "../../../../../ui/audioButton.vue";
import countdownCircleTimer from "../../../../../ui/countdownCircleTimer.vue";
import result from "../../results/sentences/result.vue";
import {
  endsWithPunctuation,
  removePunctuation,
} from "../../../../../../utils/endsWithPunctuation";
import { normalizeQuotes } from "../../../../../../utils/normalizeQuotes";
const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();

const showTaskTimer = ref(false);
const taskData = ref(null);
const materials = ref([]);
const showMaterialsOption = ref("");
const showMaterialsBeforeTask = ref(false);
const sentences = ref([]);
const currentSentences = ref([]);
const hiddenWords = ref([]);
const checkingStatus = ref(false);

const studiedSentences = ref([]);
const currentStudiedSentences = ref([]);

const reStudySentences = ref([]);
const currentReStudySentences = ref([]);

const unFilledSentences = ref([]);

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
  const totalSentences = taskData.value?.sentences?.length || 0; // Предотвращаем ошибки, если данные ещё не загружены
  if (totalSentences === 0) return 0; // Если общее количество предложении равно 0, возвращаем 0
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
      "tasks/get/fill_in_the_blanks_in_the_sentence/" + props.task.task_id
    );

    taskData.value = res.data;
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
    setSentences();
    showTaskTimer.value = false;
  }, 3000);
};

const setSentences = () => {
  currentStudiedSentences.value = [];
  currentReStudySentences.value = [];
  hiddenWords.value = [];

  if (sentences.value.length > 0) {
    currentSentences.value = sentences.value.slice(
      0,
      taskData.value.options.impression_limit
    );

    currentSentences.value.forEach((sentence) => {
      if (taskData.value.options.find_word_option == "with_options") {
        sentence.selectedOptionIndex = undefined;

        for (let index = 0; index < sentence.missingWords.length; index++) {
          const word = sentence.missingWords[index];
          if (word.word_position >= 0) {
            sentence.missingWordPositionIndex = word.word_position;
            break;
          }
        }
      } else {
        sentence.missingWords.forEach((word) => {
          word.userInput = "";
          hiddenWords.value.push({
            word: sentence.sentence.split(" ")[word.word_position],
            disabled: false,
          });
        });

        hiddenWords.value.sort(() => Math.random() - 0.5);
      }
    });

    time.value =
      taskData.value.options.seconds_per_sentence *
      currentSentences.value.length;

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

const onDrop = (event, sentenceIndex, wordIndex) => {
  // Остановить поведение по умолчанию
  event.preventDefault();

  // Получить данные из события
  const wIndex = event.dataTransfer.getData("wordIndex");

  const word = hiddenWords.value[wIndex];
  word.disabled = true;

  currentSentences.value[sentenceIndex].missingWords.find(
    (w) => w.word_position == wordIndex
  ).userInput = word.word;
  disableTheHiddenWord();
};

const onDragOver = (event) => {
  // Остановить поведение по умолчанию, чтобы разрешить drop
  event.preventDefault();
};

const disableTheHiddenWord = () => {
  const userInputs = [];

  currentSentences.value.forEach((sentence) => {
    sentence.missingWords.forEach((word) => {
      if (word.userInput.length > 0) {
        word.userInput = word.userInput.trim();
        userInputs.push({
          word: word.userInput.toLowerCase(),
          disabled: false,
        });
      }
    });
  });

  if (hiddenWords.value.length > 0) {
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
  }
};

const insertWord = (sentenceIndex, optionIndex) => {
  sentences.value[sentenceIndex].selectedOptionIndex = optionIndex;
};

const insertWordToInput = (w) => {
  let emptyWordFind = false;
  currentSentences.value.forEach((sentence) => {
    sentence.missingWords.forEach((missingWord) => {
      if (missingWord.userInput === "" && !emptyWordFind) {
        missingWord.userInput = w.word;
        disableTheHiddenWord();
        emptyWordFind = true;
      }
    });
  });
};

const clearInput = (sentenceIndex, wordIndex) => {
  currentSentences.value[sentenceIndex].missingWords.find(
    (w) => w.word_position == wordIndex
  ).userInput = "";

  disableTheHiddenWord();
};

const checkSentences = () => {
  currentSentences.value.forEach((sentence) => {
    sentences.value = sentences.value.filter(
      (s) => s.task_sentence_id !== sentence.task_sentence_id
    );

    if (taskData.value.options.find_word_option != "with_options") {
      let sentenceFail = false;
      for (
        let missingWordIndex = 0;
        missingWordIndex < sentence.missingWords.length;
        missingWordIndex++
      ) {
        const missingWord = sentence.missingWords[missingWordIndex];

        let wordFromSentence = sentence.sentence
          .split(" ")
          [missingWord.word_position].toLowerCase();

        if (endsWithPunctuation(wordFromSentence)) {
          wordFromSentence = wordFromSentence.slice(0, -1);
        }

        if (endsWithPunctuation(missingWord.userInput)) {
          missingWord.userInput = missingWord.userInput.slice(0, -1);
        }

        missingWord.userInput = normalizeQuotes(missingWord.userInput);

        if (taskData.value.options.find_word_option == "with_first_letter") {
          if (
            wordFromSentence.slice(1) != missingWord.userInput.toLowerCase()
          ) {
            pushToCurrentReStudySentences(sentence);
            sentenceFail = true;
            break;
          }
        } else {
          if (wordFromSentence != missingWord.userInput.toLowerCase()) {
            pushToCurrentReStudySentences(sentence);
            sentenceFail = true;
            break;
          }
        }
      }

      if (sentenceFail === false) {
        pushToStudySentences(sentence);
      }
    } else if (taskData.value.options.find_word_option == "with_options") {
      if (
        sentence.selectedOptionIndex >= 0 &&
        sentence.missingWords[sentence.selectedOptionIndex].word_option ===
          sentence.sentence.split(" ")[sentence.missingWordPositionIndex]
      ) {
        pushToStudySentences(sentence);
      } else {
        pushToCurrentReStudySentences(sentence);
      }
    }
  });
};

const pushToStudySentences = async (sentence) => {
  studiedSentences.value.push(sentence);
  currentStudiedSentences.value.push(sentence);

  await nextTick();
  const answer = rightAnswers.value.querySelector(
    "#right_answer_" + sentence.task_sentence_id
  );

  if (answer) {
    taskResultCollection.value.push({
      is_correct: true,
      right_answer: answer.innerHTML,
      sentence_id: sentence.sentence_id,
    });
  }

  if (
    reStudySentences.value.some(
      (s) => s.task_sentence_id === sentence.task_sentence_id
    )
  ) {
    reStudySentences.value = reStudySentences.value.filter(
      (s) => s.task_sentence_id !== sentence.task_sentence_id
    );
  }
};

const pushToCurrentReStudySentences = async (sentence) => {
  currentReStudySentences.value.push(sentence);

  if (sentence.attempts >= 1) {
    sentences.value.push(sentence);
    sentence.attempts--;
  } else {
    await nextTick();

    const userAnswer = wrongAnswers.value.querySelector(
      "#user_answer_" + sentence.task_sentence_id
    );

    const rightAnswer = wrongAnswers.value.querySelector(
      "#right_answer_" + sentence.task_sentence_id
    );

    if (userAnswer && rightAnswer) {
      taskResultCollection.value.push({
        is_correct: false,
        user_answer: userAnswer.innerHTML,
        right_answer: rightAnswer.innerHTML,
        sentence_id: sentence.sentence_id,
      });
    }

    reStudySentences.value.push(sentence);
  }
};

const acceptAnswers = () => {
  checkingStatus.value = true;
  currentSentences.value.forEach((sentence, sentenceIndex) => {
    if (taskData.value.options.find_word_option == "with_options") {
      if (sentence.selectedOptionIndex === undefined) {
        unFilledSentences.value.push(sentenceIndex);
      }
    } else {
      let emptyWordFind = false;

      sentence.missingWords.forEach((missingWord) => {
        if (missingWord.userInput === "" && !emptyWordFind) {
          unFilledSentences.value.push(sentenceIndex);
          emptyWordFind = true;
        }
      });
    }
  });

  if (unFilledSentences.value.length > 0) {
    setTimeout(() => {
      unFilledSentences.value = [];
      checkingStatus.value = false;
    }, 1000);
  } else {
    isComplete.value = true;
    isStarted.value = false;
    checkSentences();
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

const saveTaskResult = async () => {
  onPending(true);
  const formData = new FormData();
  formData.append("task_result", JSON.stringify(taskResultCollection.value));
  formData.append("operation_type_id", 25);

  await $axiosPlugin
    .post("tasks/save_result/" + props.task.task_id, formData)
    .then((res) => {
      taskResult.value = res.data;
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
