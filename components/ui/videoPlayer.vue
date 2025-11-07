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

<!-- <template>
  <video class="video-player" controls controlsList="nodownload">
    <source :src="props.src" :type="props.type" />
  </video>
</template> -->

<!-- <script setup>
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
</script> -->

<template>
  <div class="video-container">
    <video
      ref="videoEl"
      class="plyr-player"
      controls
      playsinline
      controlsList="nodownload"
    ></video>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import Hls from "hls.js";

const { t } = useI18n();

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
});

const videoEl = ref(null);
let hls = null;
let player = null;

const { $Plyr } = useNuxtApp();

// 🔧 Общие настройки Plyr
const basePlyrOptions = {
  controls: [
    "play-large",
    "play",
    "progress",
    "current-time",
    "settings",
    "fullscreen",
  ],
  settings: ["speed", "quality"],
  speed: { selected: 1, options: [0.5, 1, 1.5, 2] },
  markers: {
    enabled: false,
    points: [
      { time: 5, label: "Вступление" },
      { time: 100, label: "Основная часть" },
    ],
  },
  i18n: {
    play: t("file.video.player.play"),
    pause: t("file.video.player.pause"),
    mute: t("file.video.player.mute"),
    unmute: t("file.video.player.unmute"),
    settings: t("file.video.player.settings"),
    speed: t("file.video.player.speed"),
    normal: t("file.video.player.normal"),
    quality: t("file.video.player.quality"),
    fullscreen: t("file.video.player.fullscreen"),
    exitFullscreen: t("file.video.player.exitFullscreen"),
  },
};

onMounted(() => {
  const video = videoEl.value;

  // --- если HLS (m3u8) ---
  if (props.src.endsWith(".m3u8")) {
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(props.src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const qualities = data.levels
          .map((l) => l.height)
          .filter((v, i, a) => a.indexOf(v) === i)
          .sort((a, b) => a - b);

        // объединяем базовые настройки + качество
        const plyrOptions = {
          ...basePlyrOptions,
          quality: {
            default: qualities[qualities.length - 1],
            options: qualities,
            forced: true,
            onChange: (q) => setQuality(q),
          },
        };

        player = new $Plyr(video, plyrOptions);

        player.on("qualitychange", (event) => {
          setQuality(event.detail.plyr.quality);
        });

        function setQuality(q) {
          const levelIndex = hls.levels.findIndex((l) => l.height === q);
          hls.currentLevel = levelIndex !== -1 ? levelIndex : -1;
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // --- Safari (нативный HLS) ---
      video.src = props.src;

      // убираем пункт "качество", т.к. Safari управляет им сам
      const safariOptions = {
        ...basePlyrOptions,
        settings: basePlyrOptions.settings.filter((s) => s !== "quality"),
      };

      player = new $Plyr(video, safariOptions);
    }
  } else {
    // --- обычное видео ---
    video.src = props.src;
    player = new $Plyr(video, basePlyrOptions);
  }

  const videos = document.querySelectorAll(".plyr-player");

  videos.forEach((video) => {
    // Отключаем ПКМ
    video.addEventListener("contextmenu", (event) => event.preventDefault());

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

onBeforeUnmount(() => {
  if (hls) {
    hls.destroy();
    hls = null;
  }
  if (player) {
    player.destroy();
    player = null;
  }
});
</script>

<style scoped>
.video-container {
  max-width: 100%;
  margin: auto;
  border-radius: 10px;
  overflow: hidden;
}

.plyr-player {
  width: 100%;
  height: auto;
  border-radius: 10px;
}
</style>
