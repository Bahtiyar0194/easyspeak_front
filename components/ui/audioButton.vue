<template>
  <button type="button" class="btn btn-square btn-lg btn-primary" :class="props.className" @click="toggleAudio"
    :title="$t('click_to_listen_to_the_audio')">
    <i class="pi" :class="isPlaying ? 'pi-pause' : 'pi-volume-up'"></i>
  </button>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

// Глобальная переменная для хранения текущего активного аудио
let currentAudioInstance = null;

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  className: {
    type: String,
    required: false
  }
});

let audio;
const isPlaying = ref(false);

const toggleAudio = () => {
  if (audio) {
    if (isPlaying.value) {
      audio.pause();
      isPlaying.value = false;
    } else {
      // Остановить другое активное аудио
      if (currentAudioInstance && currentAudioInstance !== audio) {
        currentAudioInstance.pause();
        currentAudioInstance.currentTime = 0; // Сброс времени
      }
      // Установить текущее активное аудио
      currentAudioInstance = audio;
      audio.play();
      isPlaying.value = true;
    }
  }
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    audio = new Audio(props.src);
    audio.addEventListener('ended', () => {
      isPlaying.value = false;
      if (currentAudioInstance === audio) {
        currentAudioInstance = null; // Очистить ссылку на активное аудио
      }
    });
  }
});

onBeforeUnmount(() => {
  if (audio) {
    audio.pause();
    audio.removeEventListener('ended', () => {
      isPlaying.value = false;
    });
    if (currentAudioInstance === audio) {
      currentAudioInstance = null;
    }
  }
});
</script>