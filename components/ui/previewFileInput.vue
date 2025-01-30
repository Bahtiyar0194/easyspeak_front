<template>
  <!-- Preview for image or audio files -->
  <div
    :class="{
      [props.className]: props.className,
      'card p-4': props.onChange,
    }"
  >
    <template v-if="props.previewUrl">
      <div v-if="props.fileType === 'image'" class="flex gap-x-4 items-center">
        <img
          :src="props.previewUrl"
          :key="'image_' + props.previewUrl"
          class="rounded-xl" :class="props.onChange ? 'w-auto h-16' : 'w-full'"
        />
        <div v-if="props.onChange" class="flex flex-col gap-y-2">
          <p class="mb-0 text-center">
            {{ $t("file." + props.fileType + ".current") }}
          </p>
          <button
            type="button"
            class="btn btn-sm btn-light mx-auto"
            @click="props.onChange"
          >
            {{ $t("file.change_file") }}
          </button>
        </div>
      </div>

      <div v-else class="flex justify-center flex-col gap-y-2">
        <audioPlayerWithWave
          v-if="props.fileType === 'audio'"
          :key="'audio_' + props.previewUrl"
          :src="props.previewUrl"
        />
        <videoPlayer
          v-else-if="props.fileType === 'video'"
          :key="'video_' + props.previewUrl"
          :src="props.previewUrl"
        />
        <div v-if="props.onChange">
          <p class="mb-0 text-center">
            {{ $t("file." + props.fileType + ".current") }}
          </p>
          <button
            type="button"
            class="btn btn-sm btn-light mx-auto"
            @click="props.onChange"
          >
            {{ $t("file.change_file") }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import audioPlayerWithWave from "./audioPlayerWithWave.vue";
import videoPlayer from "./videoPlayer.vue";

const props = defineProps({
  fileType: {
    type: String,
    required: true,
  },
  previewUrl: {
    type: String,
    required: true,
  },
  className: {
    type: String,
    required: false,
  },
  onChange: {
    type: Function,
    required: false,
  },
});
</script>
