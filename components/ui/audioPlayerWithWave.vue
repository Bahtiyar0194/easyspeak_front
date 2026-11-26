<template>
  <div class="audio-wave" :class="[props.className, { 'has-error': hasError }]">
    <button
      type="button"
      class="audio-wave-btn"
      :class="{ playing: isPlaying, loading: isLoading }"
      :disabled="isLoading || hasError"
      @click="toggleAudio"
      :title="
        $t(
          isPlaying
            ? 'file.audio.click_to_stop_to_the_audio'
            : 'file.audio.click_to_listen_to_the_audio',
        )
      "
      :aria-label="
        $t(
          isPlaying
            ? 'file.audio.click_to_stop_to_the_audio'
            : 'file.audio.click_to_listen_to_the_audio',
        )
      "
      :aria-pressed="isPlaying"
    >
      <i
        :class="
          isLoading
            ? 'pi pi-spinner btn-loading-circle'
            : hasError
              ? 'bi bi-exclamation-lg'
              : isPlaying
                ? 'bi bi-pause-fill'
                : 'bi bi-play-fill'
        "
        aria-hidden="true"
      ></i>
    </button>

    <div class="audio-wave-body">
      <!-- Пока грузится — «заглушка» волны -->
      <div v-if="isLoading" class="audio-wave-skeleton" aria-hidden="true">
        <span v-for="n in 28" :key="n" :style="{ height: barHeight(n) + '%' }"></span>
      </div>
      <p v-else-if="hasError" class="mb-0 text-xs text-danger">
        {{ $t("file.audio.load_error") }}
      </p>
      <div
        ref="waveform"
        class="audio-wave-canvas"
        :class="{ invisible: isLoading || hasError }"
      ></div>
    </div>

    <span v-if="!isLoading && !hasError" class="audio-wave-time">
      {{ formatTime(isPlaying || currentTime > 0 ? currentTime : duration) }}
    </span>
  </div>
</template>

<script setup>
import WaveSurfer from "wavesurfer.js";
import {
  setCurrentWave,
  clearCurrentWave,
} from "../../utils/waveSurferManager";
import { stopAllAudios } from "../../utils/audioTracker";
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
const hasError = ref(false);
const duration = ref(0);
const currentTime = ref(0);
let waveSurferInstance = null;
let themeObserver = null;

// Цвета волны под тему
const themeColors = () => {
  const dark = document.documentElement.classList.contains("dark");
  return {
    waveColor: dark ? "#475569" : "#cbd5e1", // slate-600 / slate-300
    progressColor: "#3b82f6",
    cursorColor: dark ? "#94a3b8" : "#64748b",
  };
};

// Разная высота столбиков «заглушки» — похоже на волну
const barHeight = (n) => 30 + Math.round(Math.abs(Math.sin(n * 1.7)) * 60);

const formatTime = (sec) => {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

onMounted(() => {
  waveSurferInstance = WaveSurfer.create({
    container: waveform.value,
    ...themeColors(),
    barWidth: 3,
    barGap: 2,
    barRadius: 5,
    height: 36,
    cursorWidth: 1,
    backend: "MediaElement", // критично для стриминга на iOS
    fillParent: true,
    preload: "auto",
  });

  waveSurferInstance.load(props.src);

  waveSurferInstance.on("loading", () => {
    isLoading.value = true;
  });

  waveSurferInstance.on("ready", (d) => {
    isLoading.value = false;
    duration.value = d || waveSurferInstance.getDuration() || 0;
  });

  waveSurferInstance.on("error", (err) => {
    console.error("Wavesurfer error:", err);
    isLoading.value = false;
    hasError.value = true;
  });

  waveSurferInstance.on("timeupdate", (time) => {
    currentTime.value = time;
  });

  // Состояние кнопки берём из событий плеера: если воспроизведение
  // остановил другой плеер (менеджер волн), кнопка тоже переключится.
  waveSurferInstance.on("play", () => {
    isPlaying.value = true;
  });

  waveSurferInstance.on("pause", () => {
    isPlaying.value = false;
  });

  waveSurferInstance.on("finish", () => {
    isPlaying.value = false;
    currentTime.value = 0;
    clearCurrentWave(waveSurferInstance);
  });

  // Смена темы — перекрашиваем волну
  themeObserver = new MutationObserver(() => {
    waveSurferInstance?.setOptions(themeColors());
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
});

const toggleAudio = () => {
  if (!waveSurferInstance || isLoading.value || hasError.value) return;

  if (waveSurferInstance.isPlaying()) {
    waveSurferInstance.pause();
    clearCurrentWave(waveSurferInstance);
  } else {
    setCurrentWave(waveSurferInstance); // останавливает другие волны
    stopAllAudios();
    waveSurferInstance.play();
  }
};

onBeforeUnmount(() => {
  themeObserver?.disconnect();
  if (waveSurferInstance) {
    clearCurrentWave(waveSurferInstance);
    waveSurferInstance.destroy();
  }
});
</script>
