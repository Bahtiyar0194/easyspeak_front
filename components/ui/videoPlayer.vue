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
  <loader v-if="pending" :className="'overlay'" :showPendingText="true" />
  <div class="video-container">
    <video
      ref="videoEl"
      class="plyr-player"
      controls
      playsinline
      controlsList="nodownload"
    ></video>
  </div>

  <alert v-if="processing" class="danger">
    <p class="mb-0">{{ $t("file.video.player.processing") }}</p>
  </alert>
</template>

<script setup>
import alert from "./alert.vue";
import loader from "./loader.vue";
import { useRouter, useRuntimeConfig } from "nuxt/app";
import { ref, onMounted, onBeforeUnmount } from "vue";
import Hls from "hls.js";

const router = useRouter();
const pending = ref(false);
const processing = ref(false);
const { $axiosPlugin, $Plyr } = useNuxtApp();
const config = useRuntimeConfig();
const { t } = useI18n();

const props = defineProps({
  src: { type: String, required: true },
  preview: { type: Boolean, default: false },
});

const videoEl = ref(null);
let hls = null;
let player = null;

onMounted(() => {
  const src = new URL(props.src);
  const fileName = src.pathname.split("/").pop();
  const video = videoEl.value;

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

  if (props.preview === true) {
    initPlyr(video, basePlyrOptions);
    video.src = props.src;
  } else {
    loadAndInitVideo(fileName, video, basePlyrOptions);
  }

  // Отключаем ПКМ и предотвращаем параллельное воспроизведение
  setupVideoInteractions();
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

function setupVideoInteractions() {
  const videos = document.querySelectorAll(".plyr-player");
  videos.forEach((video) => {
    video.addEventListener("contextmenu", (e) => e.preventDefault());
    video.addEventListener("play", () => {
      videos.forEach((other) => {
        if (other !== video) other.pause();
      });
    });
  });
}

function initPlyr(video, options) {
  player = new $Plyr(video, options);
}

async function loadAndInitVideo(fileName, video, baseOptions) {
  pending.value = true;
  try {
    const response = await $axiosPlugin.get(`media/check_video/${fileName}`);

    if (response.data.processing === 1) {
      processing.value = true;
    }

    if (response.data.target.endsWith(".m3u8")) {
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(
          config.public.apiBase + "/media/get/" + response.data.target
        );
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          const qualities = [...new Set(data.levels.map((l) => l.height))].sort(
            (a, b) => a - b
          );

          const plyrOptions = {
            ...baseOptions,
            quality: {
              default: qualities[qualities.length - 1],
              options: qualities,
              forced: true,
              onChange: (q) => setQuality(q),
            },
          };

          initPlyr(video, plyrOptions);

          player.on("qualitychange", (event) => {
            setQuality(event.detail.plyr.quality);
          });

          function setQuality(q) {
            const levelIndex = hls.levels.findIndex((l) => l.height === q);
            hls.currentLevel = levelIndex !== -1 ? levelIndex : -1;
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari
        video.src =
          config.public.apiBase + "/media/get/" + response.data.target;
        const safariOptions = {
          ...baseOptions,
          settings: baseOptions.settings.filter((s) => s !== "quality"),
        };
        initPlyr(video, safariOptions);
      }
    } else {
      video.src = props.src;
      initPlyr(video, baseOptions);
    }
  } catch (err) {
    handleError(err);
  } finally {
    pending.value = false;
  }
}

function handleError(err) {
  if (err.response) {
    router.push({
      path: "/error",
      query: {
        status: err.response.status,
        message: err.response.data.message,
        url: err.request.responseURL,
      },
    });
  } else {
    router.push("/error");
  }
}
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
