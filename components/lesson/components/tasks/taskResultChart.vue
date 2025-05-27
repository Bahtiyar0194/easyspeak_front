<template>
  <div class="custom-grid">
    <slot name="header_content" />
    <div class="col-span-12">
      <div class="flex flex-col gap-y-4">
        <div
          v-if="props.taskResult && props.taskResult.completed === true"
          class="flex gap-x-4 items-center"
        >
          <circleProgressBar
            :progress="props.taskResult.percentage"
            :className="'w-16 h-16'"
            :textClass="'text-normal'"
          />
          <div class="w-full">
            <p class="mb-0">
              {{ $t("right_answers_count") }}:
              <b class="text-success">{{
                props.taskResult.correct_answers_count
              }}</b>
            </p>
            <hr />
            <p class="mb-0">
              {{ $t("wrong_answers_count") }}:
              <b class="text-danger">{{
                props.taskResult.incorrect_answers_count
              }}</b>
            </p>
          </div>
        </div>
        <div
          class="flex flex-col gap-y-2"
          v-if="props.taskResult.answers.correct_answers.length > 0"
        >
          <p
            v-if="
              props.taskResult.answers.correct_answers.length > 0 &&
              (props.taskResult.answers.incorrect_answers.length > 0 ||
                props.taskResult.answers.unverified_answers.length > 0)
            "
            class="text-xl font-medium mb-0 text-success"
          >
            {{ $t("right_answers") }}:
          </p>
          <ul class="list-group nowrap">
            <li
              v-for="(answer, answerIndex) in props.taskResult.answers
                .correct_answers"
              :key="answerIndex"
            >
              <div class="flex gap-x-2 justify-between items-center">
                <div class="flex gap-x-2 items-center">
                  <div
                    v-if="answer.word && answer.word.image_file"
                    :key="answer.task_answer_id + '_' + answer.task_id"
                    :style="{
                      backgroundImage:
                        'url(' +
                        config.public.apiBase +
                        '/media/get/' +
                        (answer.word && answer.word.image_file) +
                        ')',
                    }"
                    class="w-16 h-16 bg-contain bg-no-repeat bg-center border-inactive rounded-xl"
                  ></div>
                  <div class="flex flex-col gap-2">
                    <div v-if="answer.question">
                      <p class="mb-1 text-xs text-inactive font-normal">
                        {{ $t("pages.questions.question") }}:
                      </p>
                      <p class="font-medium mb-0">
                        {{ answer.question.sentence }}
                      </p>
                    </div>
                    <div>
                      <p
                        v-if="answer.right_answer"
                        class="mb-1 text-xs text-inactive font-normal"
                      >
                        {{
                          authUser.user_id ===
                          props.taskResult.completed_task.learner_id
                            ? $t("your_answer")
                            : $t("learner_answer")
                        }}:
                      </p>
                      <div v-html="answer.right_answer"></div>
                    </div>
                  </div>
                </div>
                <div class="flex items-center">
                  <audioButton
                    v-if="answer.word || answer.sentence"
                    :key="answer.task_answer_id + '_' + answer.task_id"
                    :src="
                      config.public.apiBase +
                      '/media/get/' +
                      ((answer.word && answer.word.audio_file) ||
                        (answer.sentence && answer.sentence.audio_file))
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
          v-if="props.taskResult.answers.incorrect_answers.length > 0"
        >
          <p
            v-if="
              props.taskResult.answers.incorrect_answers.length > 0 &&
              (props.taskResult.answers.correct_answers.length > 0 ||
                props.taskResult.answers.unverified_answers.length > 0)
            "
            class="text-xl font-medium mb-0 text-danger"
          >
            {{ $t("wrong_answers") }}:
          </p>
          <ul class="list-group nowrap">
            <li
              v-for="(answer, answerIndex) in props.taskResult.answers
                .incorrect_answers"
              :key="answerIndex"
            >
              <div class="flex gap-x-2 justify-between items-center">
                <div class="flex gap-x-2 justify-between items-center">
                  <div
                    v-if="answer.word && answer.word.image_file"
                    :key="answer.task_answer_id + '_' + answer.task_id"
                    :style="{
                      backgroundImage:
                        'url(' +
                        config.public.apiBase +
                        '/media/get/' +
                        (answer.word && answer.word.image_file) +
                        ')',
                    }"
                    class="w-16 h-16 bg-contain bg-no-repeat bg-center border-inactive rounded-xl"
                  ></div>
                  <div class="flex gap-2" :class="!answer.word && 'flex-col'">
                    <div v-if="answer.question">
                      <p class="mb-1 text-xs text-inactive font-normal">
                        {{ $t("pages.questions.question") }}:
                      </p>
                      <p class="font-medium mb-0">
                        {{ answer.question.sentence }}
                      </p>
                    </div>

                    <div>
                      <p
                        v-if="answer.user_answer"
                        class="mb-1 text-xs text-inactive font-normal"
                      >
                        {{
                          authUser.user_id ===
                          props.taskResult.completed_task.learner_id
                            ? $t("your_answer")
                            : $t("learner_answer")
                        }}
                      </p>
                      <div v-html="answer.user_answer"></div>
                    </div>

                    <div v-if="answer.right_answer">
                      <p
                        v-if="answer.user_answer"
                        class="mb-1 text-xs text-inactive font-normal"
                      >
                        {{ $t("right_answer") }}:
                      </p>
                      <div v-html="answer.right_answer"></div>
                    </div>

                    <div v-if="answer.comment">
                      <p class="mb-1 text-xs text-inactive font-normal">
                        {{ $t("comment") }}:
                      </p>
                      <p class="text-danger" v-html="answer.comment"></p>
                    </div>
                  </div>
                </div>
                <div class="flex items-center">
                  <audioButton
                    v-if="answer.word || answer.sentence"
                    :key="answer.task_answer_id + '_' + answer.task_id"
                    :src="
                      config.public.apiBase +
                      '/media/get/' +
                      ((answer.word && answer.word.audio_file) ||
                        (answer.sentence && answer.sentence.audio_file))
                    "
                  />
                  <div class="step-item xs failed">
                    <div class="step-icon">
                      <i class="pi pi-times"></i>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <div
          class="flex flex-col gap-y-2"
          v-if="props.taskResult.answers.unverified_answers.length > 0"
        >
          <p class="text-xl font-medium mb-0 text-warning">
            {{ $t("unverified_answers") }}:
          </p>
          <ul class="list-group nowrap">
            <li
              v-for="(answer, answerIndex) in props.taskResult.answers
                .unverified_answers"
              :key="answerIndex"
            >
              <div class="flex gap-x-4 items-center">
                <div class="flex gap-x-2 w-full justify-between items-center">
                  <div
                    v-if="answer.word && answer.word.image_file"
                    :key="answer.task_answer_id + '_' + answer.task_id"
                    :style="{
                      backgroundImage:
                        'url(' +
                        config.public.apiBase +
                        '/media/get/' +
                        (answer.word && answer.word.image_file) +
                        ')',
                    }"
                    class="w-16 h-16 bg-contain bg-no-repeat bg-center border-inactive rounded-xl"
                  ></div>
                  <div
                    class="flex gap-2 w-full"
                    :class="!answer.word && 'flex-col'"
                  >
                    <div v-if="answer.question">
                      <p class="mb-1 text-xs text-inactive font-normal">
                        {{ $t("pages.questions.question") }}:
                      </p>
                      <p class="font-medium mb-0">
                        {{ answer.question.sentence }}
                      </p>
                    </div>

                    <div>
                      <p
                        v-if="answer.user_answer"
                        class="mb-1 text-xs text-inactive font-normal"
                      >
                        {{
                          authUser.user_id ===
                          props.taskResult.completed_task.learner_id
                            ? $t("your_answer")
                            : $t("learner_answer")
                        }}:
                      </p>
                      <b>{{ answer.user_answer }}</b>
                    </div>

                    <div
                      v-if="
                        props.checkingTask === true &&
                        authUser.user_id ===
                          props.taskResult.completed_task.mentor_id
                      "
                      class="flex flex-col gap-y-3"
                    >
                      <div class="flex flex-col gap-y-1">
                        <label class="custom-radio">
                          <input
                            type="radio"
                            :value="1"
                            v-model="answer.is_correct"
                          />
                          <span>{{ $t("right_answer") }}</span>
                        </label>

                        <label class="custom-radio">
                          <input
                            type="radio"
                            :value="0"
                            v-model="answer.is_correct"
                          />
                          <span>{{ $t("wrong_answer") }}</span>
                        </label>
                      </div>
                      <div
                        v-if="answer.is_correct === 0"
                        class="form-group-border active"
                      >
                        <i class="pi pi-clock"></i>
                        <input
                          v-model="answer.comment"
                          type="text"
                          placeholder=" "
                        />
                        <label
                          :class="{ 'label-error': answer.comment === '' }"
                        >
                          {{
                            answer.comment === ""
                              ? $t("write_a_comment")
                              : $t("comment")
                          }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex items-center">
                  <audioButton
                    v-if="answer.word || answer.sentence"
                    :key="answer.task_answer_id + '_' + answer.task_id"
                    :src="
                      config.public.apiBase +
                      '/media/get/' +
                      ((answer.word && answer.word.audio_file) ||
                        (answer.sentence && answer.sentence.audio_file))
                    "
                  />
                  <div class="step-item xs warning">
                    <div class="step-icon">
                      <i class="pi pi-clock"></i>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <slot name="footer_content" />
  </div>
</template>
<script setup>
import { useRuntimeConfig } from "nuxt/app";
import circleProgressBar from "../../../ui/circleProgressBar.vue";
import audioButton from "../../../ui/audioButton.vue";
const config = useRuntimeConfig();
const authUser = useSanctumUser();
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
</script>
