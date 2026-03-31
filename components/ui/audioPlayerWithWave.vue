<template>
  <div class="flex items-center gap-x-4" :class="props.className">
    <button
      type="button"
      class="btn btn-circle"
      :class="
        isLoading
          ? 'btn-loading-circle disabled btn-primary'
          : isPlaying
            ? 'btn-outline-primary'
            : 'btn-primary'
      "
      @click="toggleAudio"
      :title="
        $t(
          isPlaying
            ? 'file.audio.click_to_stop_to_the_audio'
            : 'file.audio.click_to_listen_to_the_audio',
        )
      "
    >
      <i
        :class="
          isLoading ? 'pi pi-spinner' : isPlaying ? 'bi bi-pause' : 'bi bi-play'
        "
      ></i>
    </button>
    <div v-if="isLoading" class="text-center">
      <p class="font-medium mb-0 dots whitespace-nowrap">
        {{ $t("file.audio.loading") }}
        <span class="blink animation-delay:0s">.</span>
        <span class="blink animation-delay:0.3s">.</span>
        <span class="blink animation-delay:0.6s">.</span>
      </p>
    </div>
    <div type="button" ref="waveform" style="width: 100%; height: 36px"></div>
  </div>
</template>

<script setup>
import WaveSurfer from "wavesurfer.js";
import {
  setCurrentWave,
  clearCurrentWave,
} from "../../utils/waveSurferManager";
import { ref, onMounted, onBeforeUnmount } from "vue";
const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  className: {
    type: String,
    required: false,
  },
});

const waveform = ref(null);
const isPlaying = ref(false);
const isLoading = ref(true);
let waveSurferInstance = null;

onMounted(() => {
  // Инициализация Wavesurfer
  waveSurferInstance = WaveSurfer.create({
    container: waveform.value,
    waveColor: "#ddd",
    progressColor: "#4a90e2",
    cursorColor: "#333",
    barWidth: 3,
    barRadius: 5,
    height: 36,
    responsive: true,
  });

  // Загрузка аудиофайла
  waveSurferInstance.load(props.src);

  waveSurferInstance.on("loading", (progress) => {
    // progress от 0 до 100
    isLoading.value = true;
  });

  waveSurferInstance.on("ready", () => {
    isLoading.value = false;
  });

  waveSurferInstance.on("error", () => {
    isLoading.value = false;
  });

  // Обработка изменения состояния воспроизведения
  waveSurferInstance.on("finish", () => {
    isPlaying.value = false;
    clearCurrentWave(waveSurferInstance);
  });
});

const toggleAudio = () => {
  if (waveSurferInstance.isPlaying()) {
    waveSurferInstance.pause();
    isPlaying.value = false;
    clearCurrentWave(waveSurferInstance);
  } else {
    setCurrentWave(waveSurferInstance); // 👈 останавливает другие
    waveSurferInstance.play();
    isPlaying.value = true;
  }
};

onBeforeUnmount(() => {
  if (waveSurferInstance) {
    waveSurferInstance.destroy();
  }
});
</script>
