<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <div class="flex flex-col gap-y-4">
        <div class="flex gap-x-4 items-center">
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
              props.taskResult.answers.incorrect_answers.length > 0
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
                  <div v-html="answer.right_answer"></div>
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
              props.taskResult.answers.correct_answers.length > 0 &&
              props.taskResult.answers.incorrect_answers.length > 0
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
                    <div>
                      <p
                        v-if="answer.user_answer"
                        class="mb-1 text-xs text-inactive font-normal"
                      >
                        {{ $t("your_answer") }}:
                      </p>
                      <div v-html="answer.user_answer"></div>
                    </div>

                    <div>
                      <p
                        v-if="answer.user_answer"
                        class="mb-1 text-xs text-inactive font-normal"
                      >
                        {{ $t("right_answer") }}:
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
const props = defineProps({
  taskResult: {
    type: Object,
    required: true,
  },
});
</script>
