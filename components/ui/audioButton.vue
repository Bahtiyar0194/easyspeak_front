<template>
    <button type="button" class="btn btn-square btn-lg btn-primary" :class="props.className" @click="toggleAudio" :title="$t('click_to_listen_to_the_audio')">
        <i class="pi" :class="isPlaying ? 'pi-pause' : 'pi-volume-up'"></i>
    </button>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

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

// Замените URL на путь к вашему удаленному аудиофайлу
let audio;
const isPlaying = ref(false);

const toggleAudio = () => {
  if (audio) {
    if (isPlaying.value) {
      audio.pause()
    } else {
      audio.play()
    }
    isPlaying.value = !isPlaying.value
  }
}

onMounted(() => {
  // Убедимся, что код выполняется только в браузере
  if (typeof window !== 'undefined') {
    audio = new Audio(props.src)
    audio.addEventListener('ended', () => {
      isPlaying.value = false
    })
  }
});

onBeforeUnmount(() => {
  if (audio) {
    audio.pause()
    audio.removeEventListener('ended', () => {
      isPlaying.value = false
    })
  }
});
</script>