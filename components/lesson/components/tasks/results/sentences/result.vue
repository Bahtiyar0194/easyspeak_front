<template>
  <div class="col-span-12">
    <canvas id="confetti-canvas"></canvas>
    <div class="flex flex-col gap-y-4">
      <div
        class="flex flex-col gap-y-2"
        v-if="props.studiedSentences.length > 0"
      >
        <p class="text-xl font-medium mb-0 text-success">
          {{ $t("pages.sentences.studied_sentences") }}
        </p>

        <ul class="list-group nowrap">
          <li
            v-for="(sentence, sIndex) in props.studiedSentences"
            :key="sIndex"
            class="flex justify-between items-center gap-x-2"
          >
            <div>
              <p class="mb-0 font-medium">{{ sentence.sentence }}</p>
              <p class="mb-0 text-inactive text-xs font-medium">
                {{ sentence.sentence_translate }}
              </p>
            </div>

            <div class="flex items-center">
              <audioButton
                v-if="sentence.audio_file"
                :src="
                  config.public.apiBase + '/media/get/' + sentence.audio_file
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

      <div class="flex flex-col gap-y-2" v-if="reStudySentences.length > 0">
        <p class="text-xl font-medium mb-0 text-danger">
          {{ $t("pages.sentences.unstudied_sentences") }}
        </p>
        <ul class="list-group nowrap">
          <li
            v-for="(sentence, rIndex) in reStudySentences"
            :key="rIndex"
            class="flex justify-between items-center gap-x-2"
          >
            <div>
              <p class="mb-0 font-medium">{{ sentence.sentence }}</p>
              <p class="mb-0 text-inactive text-xs font-medium">
                {{ sentence.sentence_translate }}
              </p>
            </div>

            <div class="flex items-center">
              <audioButton
                v-if="sentence.audio_file"
                :src="
                  config.public.apiBase + '/media/get/' + sentence.audio_file
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

<script setup>
import audioButton from "../../../../../ui/audioButton.vue";

const config = useRuntimeConfig();
const props = defineProps({
  studiedSentences: {
    type: Object,
    required: true,
  },
  reStudySentences: {
    type: Object,
    required: true,
  },
});
</script>
