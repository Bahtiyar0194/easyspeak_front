<!-- <template>
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
  // player.on("ended", () => {
  //   console.log("Видео завершилось");
  // });

  // Глобальный обработчик, предотвращающий параллельное воспроизведение
  player.on("play", () => {
    document.querySelectorAll("video").forEach((video) => {
      if (video !== videoPlayer.value && !video.paused) {
        video.pause();
      }
    });
  });
});

onBeforeUnmount(() => {
  if (player) {
    player.dispose(); // Уничтожаем плеер перед удалением компонента
  }
});
</script> -->

<template>
  <video class="video-player" controls controlsList="nodownload">
    <source :src="props.src" :type="props.type" />
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

onMounted(() => {
  const videos = document.querySelectorAll(".video-player");

  videos.forEach((video) => {
    // Отключаем ПКМ
    video.addEventListener('contextmenu', event => event.preventDefault())

    // Предотвращаем параллельное воспроизведение
    video.addEventListener("play", () => {
      videos.forEach((otherVideo) => {
        if (otherVideo !== video) {
          otherVideo.pause(); // Ставим другие видео на паузу
        }
      });
    });
  });
});

// onBeforeUnmount(() => {
//   if (player.value && plyrInstances.has(player.value)) {
//     plyrInstances.get(player.value).destroy();
//     plyrInstances.delete(player.value);
//   }
// });
</script>
