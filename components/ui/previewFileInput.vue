<template>
  <!-- Предпросмотр файла. Два режима:
       - просмотр (без onChange): картинка / аудио / видео / прочий файл;
       - «текущий файл» (с onChange): заголовок + «Заменить», под ним превью -->
  <div
    v-if="props.previewUrl"
    class="file-preview"
    :class="[props.className, { 'file-preview-current': props.onChange }]"
  >
    <div v-if="props.onChange" class="file-preview-head">
      <span class="file-preview-icon" :class="'kind-' + kind" aria-hidden="true">
        <i :class="kindIcon"></i>
      </span>
      <span class="flex-1 min-w-0 text-sm font-medium">{{ currentTitle }}</span>
      <button type="button" class="btn btn-sm btn-light shrink-0" @click="props.onChange">
        <i class="pi pi-replay" aria-hidden="true"></i>
        {{ $t("file.replace.replace") }}
      </button>
    </div>

    <!-- Файл не загрузился — вместо «битой» иконки -->
    <div v-if="failed" class="file-preview-missing">
      <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
      <span>
        <b class="block">{{ $t("file.unavailable") }}</b>
        <span class="text-xs text-inactive">{{ $t("file.unavailable_hint") }}</span>
      </span>
    </div>

    <!-- Картинка: не выше ~60% экрана, клик — оригинал в новой вкладке -->
    <a
      v-else-if="kind === 'image'"
      :href="props.previewUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="file-preview-image"
      :class="{ compact: props.onChange }"
      :title="$t('file.open_original')"
    >
      <img
        :key="'image_' + props.previewUrl"
        v-skeleton.parent
        :src="props.previewUrl"
        alt=""
        @error="failed = true"
      />
      <span class="file-preview-zoom" aria-hidden="true">
        <i class="pi pi-external-link"></i>
      </span>
      <span class="sr-only">{{ $t("file.open_original") }}</span>
    </a>

    <audioPlayerWithWave
      v-else-if="kind === 'audio'"
      :key="'audio_' + props.previewUrl"
      :src="props.previewUrl"
    />

    <videoPlayer
      v-else-if="kind === 'video'"
      :key="'video_' + props.previewUrl"
      :src="props.previewUrl"
    />

    <!-- Другие типы (документы и т.п.) — карточка с кнопкой «Открыть» -->
    <div v-else class="file-preview-other">
      <i class="pi pi-file" aria-hidden="true"></i>
      <span class="flex-1 min-w-0 text-sm break-all">{{ fileName }}</span>
      <a :href="props.previewUrl" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-light">
        <i class="pi pi-external-link" aria-hidden="true"></i>
        {{ $t("file.open") }}
      </a>
    </div>
  </div>
</template>

<script setup>
import audioPlayerWithWave from "./audioPlayerWithWave.vue";
import videoPlayer from "./videoPlayer.vue";

const { t, te } = useI18n();

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

const KNOWN = ["image", "audio", "video"];
const kind = computed(() => (KNOWN.includes(props.fileType) ? props.fileType : "file"));

const kindIcon = computed(
  () =>
    ({
      image: "pi pi-image",
      audio: "pi pi-volume-up",
      video: "pi pi-video",
    })[kind.value] || "pi pi-file",
);

// «Текущее изображение / аудио / видео»; для прочих типов — общий заголовок
// (раньше показывался сырой ключ вроде file.document.current)
const currentTitle = computed(() => {
  const key = "file." + props.fileType + ".current";
  return te(key) ? t(key) : t("file.current_file");
});

const fileName = computed(() => {
  try {
    return decodeURIComponent(String(props.previewUrl).split("/").pop() || "");
  } catch (e) {
    return String(props.previewUrl).split("/").pop() || "";
  }
});

// Новый файл — сбрасываем отметку «не загрузился»
const failed = ref(false);
watch(
  () => props.previewUrl,
  () => {
    failed.value = false;
  },
);
</script>
