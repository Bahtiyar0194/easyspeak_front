<template>
  <div
    class="form-group-file"
    :class="[props.className, { dragging }]"
    ref="inputWrapper"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <input
      ref="fileInput"
      :id="props.id"
      type="file"
      :name="props.name"
      :accept="props.accept"
      @change="handleFileChange"
      placeholder=" "
    />
    <label :for="props.id" :class="{ 'label-error': props.error }">
      <!-- Предпросмотр картинки / аудио / видео -->
      <template v-if="previewUrl">
        <img
          v-if="selectedFile.type.startsWith('image/')"
          :key="'img_' + previewUrl"
          :src="previewUrl"
          alt=""
          class="w-auto h-14 mx-auto rounded-lg mb-2"
        />
        <audioPlayerWithWave
          v-else-if="selectedFile.type.startsWith('audio/')"
          :key="'audio_' + previewUrl"
          :src="previewUrl"
          :className="'mx-6 mb-4'"
        />
        <videoPlayer
          v-else-if="selectedFile.type.startsWith('video/')"
          :key="'video_' + previewUrl"
          :src="previewUrl"
          :preview="true"
        />
      </template>

      <i v-else-if="props.icon" :class="props.icon" aria-hidden="true"></i>

      <div v-if="selectedFile" class="mt-3 flex flex-col items-center gap-1">
        <p v-if="props.error" class="text-danger mb-0">
          {{ props.error[0] || props.error }}
        </p>
        <p class="text-sm font-medium mb-0 break-all">{{ selectedFile.name }}</p>
        <p v-if="selectedFile.size" class="text-xs text-inactive mb-0">
          {{ formatSize(selectedFile.size) }}
        </p>
      </div>
      <template v-else>
        <p class="mb-0 mt-2 font-medium">{{ props.label }}</p>
        <p class="mb-0 mt-1 text-xs text-inactive">
          {{ dragging ? $t("file.drop_release") : $t("file.drop_here") }}
        </p>
      </template>
    </label>

    <!-- Убрать выбранный файл (раньше — только выбрать другой) -->
    <button
      v-if="selectedFile"
      type="button"
      class="file-clear-btn"
      :title="$t('file.remove')"
      :aria-label="$t('file.remove')"
      @click="clearFile"
    >
      <i class="pi pi-times" aria-hidden="true"></i>
    </button>
  </div>
</template>

<script setup>
import audioPlayerWithWave from "./audioPlayerWithWave.vue";
import videoPlayer from "./videoPlayer.vue";

const { t } = useI18n();
const inputWrapper = ref(null);
const fileInput = ref(null);

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  accept: {
    type: String,
    required: true,
  },
  error: {
    type: [Object, Array, String],
    required: false,
  },
  icon: {
    type: String,
    required: false,
  },
  label: {
    type: String,
    required: false,
  },
  className: {
    type: String,
    required: false,
  },
});

const selectedFile = ref(null);
const previewUrl = ref(null);
const dragging = ref(false);
let dragDepth = 0;

// Размер — в КБ / МБ / ГБ
const formatSize = (bytes) => {
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} ${t("file.kilobyte")}`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} ${t("file.megabyte")}`;
  return `${(mb / 1024).toFixed(2)} ${t("file.gigabyte")}`;
};

// Старую ссылку предпросмотра освобождаем (раньше — утечка при каждом выборе)
const revokePreview = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = null;
};

const setFile = (file) => {
  revokePreview();
  selectedFile.value = file || null;
  if (
    file &&
    (file.type.startsWith("image/") ||
      file.type.startsWith("audio/") ||
      file.type.startsWith("video/"))
  ) {
    previewUrl.value = URL.createObjectURL(file);
  }
};

const handleFileChange = (event) => {
  setFile(event.target.files[0]);
};

// Подходит ли файл под accept («image/*», «audio/*», «.pdf» …)
const matchesAccept = (file) => {
  const rules = String(props.accept || "")
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);
  if (!rules.length) return true;
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  return rules.some((rule) => {
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    if (rule.startsWith(".")) return name.endsWith(rule);
    return type === rule;
  });
};

// Перетаскивание файла на поле
const onDragEnter = () => {
  dragDepth++;
  dragging.value = true;
};

const onDragLeave = () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dragging.value = false;
};

const onDrop = (event) => {
  dragDepth = 0;
  dragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (!file || !matchesAccept(file) || !fileInput.value) return;
  // Кладём файл в сам input — он уйдёт с формой как обычно
  const transfer = new DataTransfer();
  transfer.items.add(file);
  fileInput.value.files = transfer.files;
  setFile(file);
};

const clearFile = () => {
  if (fileInput.value) fileInput.value.value = "";
  setFile(null);
};

const handleFormReset = () => {
  revokePreview();
  selectedFile.value = null;
};

let formElement = null;

onMounted(() => {
  // Отслеживаем сброс формы
  formElement = inputWrapper.value?.closest("form") || null;
  formElement?.addEventListener("reset", handleFormReset);
});

onBeforeUnmount(() => {
  revokePreview();
  formElement?.removeEventListener("reset", handleFormReset);
});
</script>
