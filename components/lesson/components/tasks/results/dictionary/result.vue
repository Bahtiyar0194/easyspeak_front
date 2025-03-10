<template>
  <div class="col-span-12 pr-2">
    <canvas id="confetti-canvas"></canvas>
    <div class="flex flex-col gap-y-4">
      <div class="flex flex-col gap-y-2" v-if="props.studiedWords.length > 0">
        <p class="text-xl font-medium mb-0 text-success">
          {{ $t("pages.dictionary.studied_words") }}
        </p>
        <ul class="list-group nowrap">
          <li
            v-for="(word, sIndex) in props.studiedWords"
            :key="sIndex"
            class="flex justify-between items-center gap-x-2"
          >
            <div>
              <p class="mb-0 font-medium">{{ word.word }}</p>
              <p class="mb-0 text-inactive text-xs font-medium">
                {{ word.word_translate }}
              </p>
            </div>

            <div class="flex items-center">
              <audioButton
                v-if="word.audio_file"
                :src="config.public.apiBase + '/media/get/' + word.audio_file"
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

      <div class="flex flex-col gap-y-2" v-if="props.reStudyWords.length > 0">
        <p class="text-xl font-medium mb-0 text-danger">
          {{ $t("pages.dictionary.unstudied_words") }}
        </p>
        <ul class="list-group nowrap">
          <li
            v-for="(word, rIndex) in props.reStudyWords"
            :key="rIndex"
            class="flex justify-between items-center gap-x-2"
          >
            <div>
              <p class="mb-0 font-medium">{{ word.word }}</p>
              <p class="mb-0 text-inactive text-xs font-medium">
                {{ word.word_translate }}
              </p>
            </div>

            <div class="flex items-center">
              <audioButton
                v-if="word.audio_file"
                :src="config.public.apiBase + '/media/get/' + word.audio_file"
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
  studiedWords: {
    type: Object,
    required: true,
  },
  reStudyWords: {
    type: Object,
    required: true,
  },
});
</script>