<template>
  <div
    ref="rootRef"
    class="relative w-full h-full overflow-hidden rounded-xl bg-black select-none"
  >
    <video
      ref="videoRef"
      class="absolute inset-0 w-full h-full duration-200"
      :class="[fitClass, !stream.remote && reflected ? 'scale-x-[-1]' : '']"
      :srcObject="stream.stream"
      :muted="!stream.remote || muted"
      autoplay
      playsinline
      @loadedmetadata="updateVideoRatio"
      @resize="updateVideoRatio"
    ></video>

    <!-- Камера выключена: заглушка поверх видео (звук продолжает играть) -->
    <div
      v-if="!stream.isStream"
      class="absolute inset-0 bg-black text-white flex flex-col gap-1 justify-center items-center text-center px-2"
    >
      <span
        class="font-medium leading-tight"
        :class="compact ? 'text-xs' : 'text-lg md:text-2xl'"
        >{{ fullName }}</span
      >
      <span v-if="!compact" class="text-inactive text-xs"
        >({{ $t("pages.conference.video_turned_off") }})</span
      >
    </div>

    <div v-if="stream.isStream" :class="[badgeClass, 'left-1.5 top-1.5']">
      <span class="text-xs truncate max-w-[10rem]">{{ firstName }}</span>
    </div>

    <div :class="[badgeClass, 'right-1.5 top-1.5 gap-1', compact ? '' : 'md:gap-2']">
      <i
        class="bi text-xs"
        :class="[
          !stream.isMuted ? 'bi-mic text-success' : 'bi-mic-mute text-danger',
          compact ? '' : 'md:text-base',
        ]"
      ></i>
      <i
        class="bi text-xs"
        :class="[
          stream.isStream
            ? 'bi-camera-video text-success'
            : 'bi-camera-video-off text-danger',
          compact ? '' : 'md:text-base',
        ]"
      ></i>
    </div>

    <!-- Статистика соединения — только для удалённых участников -->
    <div
      v-if="stream.remote && stats"
      :class="[badgeClass, 'left-1.5 bottom-1.5 items-center gap-1.5']"
    >
      <div
        class="w-2 h-2 rounded-full shrink-0 transition-colors duration-300"
        :class="{
          'bg-success': stats.quality === 'excellent',
          'bg-warning': ['good', 'poor'].includes(stats.quality),
          'bg-danger': stats.quality === 'bad',
        }"
      ></div>
      <div class="flex gap-2" :class="compact ? 'text-[10px]' : 'text-xs'">
        <span>
          <span v-if="!compact" class="max-md:hidden">{{ $t("ping") }}: </span>
          <span :class="compact ? '' : 'md:font-medium'"
            >{{ stats.rtt }} {{ $t("time.millisecond.short") }}</span
          >
        </span>
        <span v-if="!compact">
          <span class="max-md:hidden"
            >{{ $t("file.video.player.speed") }}:
          </span>
          <span class="md:font-medium"
            >{{ stats.bitrate }} {{ $t("file.kilobyte_sec") }}</span
          >
        </span>
      </div>
    </div>

    <!-- Рамка «говорит сейчас» — поверх видео и только во время речи,
         поэтому в обычном состоянии видео занимает всю плитку -->
    <div
      v-if="stream.speaking"
      class="absolute inset-0 rounded-xl border-2 border-success pointer-events-none"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  stream: {
    type: Object,
    required: true,
  },

  stats: {
    type: Object,
    required: false,
    default: null,
  },

  reflected: {
    type: Boolean,
    required: false,
    default: false,
  },

  // Маленькая плитка: меньше текста, без подписей в статистике
  compact: {
    type: Boolean,
    required: false,
    default: false,
  },

  // Принудительно заглушить звук (например, миниатюра того же участника,
  // который уже показан в главном окне — иначе звук играет дважды)
  muted: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const badgeClass =
  "absolute flex py-1 px-1.5 bg-black bg-opacity-50 text-white rounded-md";

const firstName = computed(() => props.stream.userInfo?.first_name || "");
const fullName = computed(() =>
  [props.stream.userInfo?.last_name, props.stream.userInfo?.first_name]
    .filter(Boolean)
    .join(" "),
);

// Вертикальное видео с телефона в горизонтальной плитке при object-cover
// теряет верх и низ кадра (срезается голова) — показываем его целиком
// (object-contain) на чёрном фоне. Горизонтальное видео в вертикальной
// плитке оставляем cover: обрезаются только бока, а с полосами оно
// стало бы слишком мелким.
const rootRef = ref(null);
const videoRef = ref(null);
const videoRatio = ref(null);
const tileRatio = ref(null);

const updateVideoRatio = () => {
  const video = videoRef.value;
  if (video?.videoWidth && video?.videoHeight) {
    videoRatio.value = video.videoWidth / video.videoHeight;
  }
};

const fitClass = computed(() => {
  if (!videoRatio.value || !tileRatio.value) return "object-cover";
  const videoIsPortrait = videoRatio.value < 1;
  const tileIsLandscape = tileRatio.value >= 1;
  return videoIsPortrait && tileIsLandscape ? "object-contain" : "object-cover";
});

let resizeObserver = null;

onMounted(() => {
  resizeObserver = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (width && height) tileRatio.value = width / height;
  });
  resizeObserver.observe(rootRef.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>
