<template>
  <video
    ref="videoPlayer"
    class="video-js vjs-default-skin"
    controls
    preload="auto"
  >
    <source :src="src" :type="type" />
  </video>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

// Пропсы
const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: false,
    default: "video/mp4",
  },
});

// Референс для видео
const videoPlayer = ref(null);
let player = null;

onMounted(() => {
  const { $videojs } = useNuxtApp();
  player = $videojs(videoPlayer.value, {
    controls: true,
    responsive: true,
    fluid: true,
    autoplay: false,
    preload: "auto",
  });

  // Пример обработки события
  player.on("ended", () => {
    console.log("Видео завершилось");
  });
});

onBeforeUnmount(() => {
  if (player) {
    player.dispose(); // Уничтожаем плеер перед удалением компонента
  }
});
</script>