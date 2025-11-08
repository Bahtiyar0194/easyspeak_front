<template>
  <div class="form-group-file" :class="props.className" ref="inputWrapper">
    <input
      :id="props.id"
      type="file"
      :name="props.name"
      :accept="props.accept"
      @change="handleFileChange"
      placeholder=" "
    />
    <label :for="props.id" :class="{ 'label-error': props.error }">
      <!-- Preview for image or audio files -->
      <template v-if="previewUrl">
        <img
          v-if="selectedFile.type.startsWith('image/')"
          :key="'img_' + previewUrl"
          :src="previewUrl"
          alt="Preview"
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

      <i v-else-if="props.icon" :class="props.icon"></i>

      <div v-if="selectedFile">
        <p v-if="props.error" class="text-danger">
          {{ props.error[0] || props.error }}
        </p>
        <p v-if="selectedFile.name" class="text-xs mb-0">
          {{ $t("file.name") }}: <i>{{ selectedFile.name }}</i>
        </p>
        <p v-if="selectedFile.size" class="text-xs mb-0">
          {{ $t("file.size") }}:
          <i
            >{{ (selectedFile.size / 1048576).toFixed(2) }}
            {{ $t("file.megabyte") }}</i
          >
        </p>
      </div>
      <p v-else class="mb-0">{{ props.label }}</p>
    </label>
  </div>
</template>

<script setup>
import audioPlayerWithWave from "./audioPlayerWithWave.vue";
import videoPlayer from "./videoPlayer.vue";

const inputWrapper = ref(null);

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
    type: Object,
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

// Define a ref to handle the selected file
const selectedFile = ref(null);
const previewUrl = ref(null);

// Watch for file selection and emit the file object
const handleFileChange = (event) => {
  selectedFile.value = null;
  const file = event.target.files[0];
  selectedFile.value = file;

  // Generate a preview URL for the image
  if (
    file &&
    (file.type.startsWith("image/") ||
      file.type.startsWith("audio/") ||
      file.type.startsWith("video/"))
  ) {
    previewUrl.value = URL.createObjectURL(file);
  } else {
    previewUrl.value = null;
  }
};

const handleFormReset = () => {
  selectedFile.value = null;
  previewUrl.value = null;
};

onMounted(() => {
  // Отслеживаем сброс формы
  const formElement = inputWrapper.value.closest("form");
  if (formElement) {
    formElement.addEventListener("reset", handleFormReset); // Слушаем сброс формы
  }
});

// Clean up the preview URL when the component is unmounted
onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }

  const formElement = inputWrapper.value.closest("form");
  if (formElement) {
    formElement.removeEventListener("reset", handleFormReset); // Слушаем сброс формы
  }
});
</script>
