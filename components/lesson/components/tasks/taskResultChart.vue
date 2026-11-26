<template>
  <div class="custom-grid select-none">
    <slot name="header_content" />
    <div class="col-span-12">
      <div class="flex flex-col gap-5">
        <!-- Сводка: кольцо + плитки со счётчиками -->
        <div
          v-if="props.taskResult && props.taskResult.completed === true"
          class="result-summary"
        >
          <circleProgressBar
            :progress="props.taskResult.percentage"
            :className="'w-20 h-20'"
            :textClass="'text-lg'"
          />
          <div class="result-stats">
            <div class="result-stat ok">
              <b>{{ props.taskResult.correct_answers_count }}</b>
              <span>{{ $t("right_answers_count") }}</span>
            </div>
            <div
              v-if="props.taskResult.partly_correct_answers_count > 0"
              class="result-stat partly"
            >
              <b>{{ props.taskResult.partly_correct_answers_count }}</b>
              <span>{{ $t("partly_correct_answers_count") }}</span>
            </div>
            <div class="result-stat bad">
              <b>{{ props.taskResult.incorrect_answers_count }}</b>
              <span>{{ $t("wrong_answers_count") }}</span>
            </div>
          </div>
        </div>

        <!-- Группы ответов -->
        <section
          v-for="group in groups"
          :key="group.key"
          class="result-section"
        >
          <p v-if="showGroupTitle(group)" class="result-head" :class="group.tone">
            <span class="result-head-dot" aria-hidden="true"></span>
            {{ $t(group.title) }}
            <span class="result-head-count">{{ group.items.length }}</span>
          </p>

          <ul class="result-list">
            <li
              v-for="(answer, answerIndex) in group.items"
              :key="answerIndex"
              class="result-item"
              :class="group.tone"
            >
              <!-- Картинка слова -->
              <div
                v-if="answer.word && answer.word.image_file"
                class="result-thumb"
                :style="{
                  backgroundImage:
                    'url(' + config.public.apiBase + '/media/get/' + answer.word.image_file + ')',
                }"
                aria-hidden="true"
              ></div>

              <div class="flex-1 min-w-0 flex flex-col gap-2">
                <div v-if="answer.question">
                  <p class="result-label">{{ $t("pages.questions.question.title") }}</p>
                  <p class="font-medium mb-0">
                    {{ answer.question.sentence || answer.question.question }}
                  </p>
                </div>

                <!-- Правильный ответ (группа «правильные»): это и есть ответ ученика -->
                <div v-if="group.key === 'correct'">
                  <p v-if="answer.right_answer" class="result-label">{{ whoseAnswer }}</p>
                  <div class="result-answer" v-html="answer.right_answer"></div>
                </div>

                <template v-else>
                  <div v-if="answer.user_answer !== undefined && answer.user_answer !== null">
                    <p v-if="answer.user_answer" class="result-label">{{ whoseAnswer }}</p>
                    <div
                      v-if="group.key !== 'unverified'"
                      class="result-answer"
                      :class="{ strike: group.key === 'incorrect' }"
                      v-html="answer.user_answer"
                    ></div>
                    <b v-else class="result-answer">{{ answer.user_answer }}</b>
                  </div>

                  <div v-if="answer.right_answer && group.key !== 'unverified'">
                    <p v-if="answer.user_answer" class="result-label">{{ $t("right_answer") }}</p>
                    <div class="result-answer text-success" v-html="answer.right_answer"></div>
                  </div>

                  <div v-if="answer.comment && group.key !== 'unverified'" class="result-comment">
                    <p class="result-label">
                      <i class="pi pi-comment" aria-hidden="true"></i> {{ $t("comment") }}
                    </p>
                    <p class="mentor_comment mb-0" v-html="answer.comment"></p>
                  </div>

                  <!-- Проверка учителем -->
                  <div
                    v-if="
                      group.key === 'unverified' &&
                      props.checkingTask === true &&
                      authUser.user_id === props.taskResult.completed_task.mentor_id
                    "
                    class="flex flex-col gap-3"
                  >
                    <div class="result-verdict" role="radiogroup">
                      <label class="result-verdict-option ok" :class="{ active: answer.is_correct === 1 }">
                        <input type="radio" class="sr-only" :value="1" v-model="answer.is_correct" />
                        <i class="pi pi-check" aria-hidden="true"></i>
                        {{ $t("right_answer") }}
                      </label>
                      <label class="result-verdict-option bad" :class="{ active: answer.is_correct === 0 }">
                        <input type="radio" class="sr-only" :value="0" v-model="answer.is_correct" />
                        <i class="pi pi-times" aria-hidden="true"></i>
                        {{ $t("wrong_answer") }}
                      </label>
                    </div>
                    <div v-if="answer.is_correct === 0" class="form-group-border active">
                      <i class="pi pi-comment"></i>
                      <input v-model="answer.comment" type="text" placeholder=" " />
                      <label :class="{ 'label-error': answer.comment === '' }">
                        {{ answer.comment === "" ? $t("write_a_comment") : $t("comment") }}
                      </label>
                    </div>
                  </div>
                </template>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <audioButtonMini
                  v-if="audioOf(answer)"
                  :src="config.public.apiBase + '/media/get/' + audioOf(answer)"
                />
                <span class="result-status" :class="group.tone" aria-hidden="true">
                  <i class="pi" :class="group.icon"></i>
                </span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
    <slot name="footer_content" />
  </div>
</template>
<script setup>
import { useRuntimeConfig } from "nuxt/app";
import circleProgressBar from "../../../ui/circleProgressBar.vue";
import audioButtonMini from "../../../ui/audioButtonMini.vue";

const config = useRuntimeConfig();
const authUser = useSanctumUser();
const { t } = useI18n();

const props = defineProps({
  taskResult: {
    type: Object,
    required: true,
  },

  checkingTask: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const answers = computed(() => props.taskResult?.answers || {});

// Порядок и оформление групп ответов
const groups = computed(() =>
  [
    { key: "correct", title: "right_answers", tone: "ok", icon: "pi-check", items: answers.value.correct_answers || [] },
    { key: "partly", title: "partly_correct_answers", tone: "partly", icon: "pi-check", items: answers.value.partly_correct_answers || [] },
    { key: "incorrect", title: "wrong_answers", tone: "bad", icon: "pi-times", items: answers.value.incorrect_answers || [] },
    { key: "unverified", title: "unverified_answers", tone: "pending", icon: "pi-clock", items: answers.value.unverified_answers || [] },
  ].filter((g) => g.items.length > 0),
);

// Заголовок группы нужен, только если групп несколько (непроверенные — всегда)
const showGroupTitle = (group) => group.key === "unverified" || groups.value.length > 1;

const whoseAnswer = computed(() =>
  authUser.value?.user_id === props.taskResult?.completed_task?.learner_id
    ? t("your_answer")
    : t("learner_answer"),
);

const audioOf = (answer) =>
  (answer.word && answer.word.audio_file) ||
  (answer.sentence && answer.sentence.audio_file) ||
  null;
</script>
