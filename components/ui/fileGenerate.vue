<template>
  <div ref="inputWrapper" class="flex flex-col gap-3">
    <div class="form-group-border select active label-active">
      <i class="pi pi-microphone"></i>
      <select v-model="currentVoice" :disabled="voicesLoading || !voices.length">
        <option disabled value="">
          {{ voicesLoading ? $t("loading") : $t("file.audio.choose_a_voice") }}
        </option>
        <option
          v-for="voice in voices"
          :key="voice.voice_id"
          :value="voice.voice_id"
        >
          {{ voice.name }}
        </option>
      </select>
      <label>
        {{ $t("file.audio.voice") }}
      </label>
    </div>

    <!-- Сервис голосов не ответил — сообщение здесь, без ухода со страницы -->
    <p v-if="voicesError" class="mb-0 text-sm text-danger flex flex-wrap items-center gap-2">
      <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
      {{ $t("file.voices_failed") }}
      <button type="button" class="auto-translate-btn" @click="loadVoices(true)">
        {{ $t("file.try_again") }}
      </button>
    </p>

    <div>
      <button
        type="button"
        class="btn btn-sm"
        :class="file ? 'btn-light' : 'btn-outline-primary'"
        :disabled="pending"
        @click="generateFile()"
      >
        <i
          :class="pending ? 'pi pi-spin pi-spinner' : file ? 'pi pi-refresh' : 'bi bi-stars'"
          aria-hidden="true"
        ></i>
        {{ file ? $t("file.regenerate") : $t("generate") }}
      </button>
    </div>

    <audioPlayerWithWave
      v-if="file && props.accept === 'audio'"
      :key="'audio_' + fileKey"
      :src="'data:audio/mpeg;base64,' + file"
    />

    <p v-if="errorText && !file" class="text-danger text-sm mb-0">
      {{ errorText }}
    </p>

    <input type="hidden" :name="props.generateFileInputName" :value="file || ''" />
  </div>
</template>

<script>
// Список голосов один на всё приложение: раньше каждый компонент
// (их бывает несколько на странице) запрашивал его заново
let voicesRequest = null;
</script>

<script setup>
import audioPlayerWithWave from "./audioPlayerWithWave.vue";

const { t } = useI18n();
const inputWrapper = ref(null);
const { $axiosPlugin } = useNuxtApp();
const pending = ref(false);
const file = ref(null);
const fileKey = ref(0);
const error = ref(null);

const props = defineProps({
  accept: {
    type: String,
    required: true,
  },
  error: {
    type: [Object, Array, String],
    required: false,
  },
  generateText: {
    type: String,
    required: false,
    default: "",
  },
  generateFileInputName: {
    type: String,
    required: false,
    default: "",
  },
  generateFileError: {
    type: String,
    required: false,
    default: "",
  },
});

const currentVoice = ref("");
const voices = ref([]);
const voicesLoading = ref(false);
const voicesError = ref(false);

// Текст ошибки из любого вида ответа. Раньше обращение к
// error.error.detail.message падало, если ошибка была строкой или null
const errorText = computed(() => {
  const local = error.value;
  if (typeof local === "string" && local) return local;
  if (local && typeof local === "object") {
    return (
      local.error?.detail?.message ||
      local.detail?.message ||
      local.message ||
      (typeof local.error === "string" ? local.error : "") ||
      t("file.generate_failed")
    );
  }
  const fromForm = props.error;
  if (Array.isArray(fromForm)) return fromForm[0] || "";
  if (typeof fromForm === "string") return fromForm;
  return "";
});

const selectFirstVoice = () => {
  if (!currentVoice.value && voices.value.length) {
    currentVoice.value = voices.value[0].voice_id;
  }
};

const loadVoices = async (force = false) => {
  voicesLoading.value = true;
  voicesError.value = false;
  try {
    if (!voicesRequest || force) {
      voicesRequest = $axiosPlugin
        .get("elevenlabs/list_voices")
        .then((response) => response.data?.voices || []);
    }
    voices.value = await voicesRequest;
    selectFirstVoice();
  } catch (e) {
    voicesRequest = null; // следующая попытка — новым запросом
    voicesError.value = true;
  } finally {
    voicesLoading.value = false;
  }
};

const generateFile = async () => {
  error.value = null;
  if (!props.generateText || !props.generateText.trim()) {
    error.value = props.generateFileError || t("file.generate_failed");
    return;
  }
  pending.value = true;

  await $axiosPlugin
    .get("elevenlabs/tts", {
      params: {
        text: props.generateText,
        voice_id: currentVoice.value,
      },
    })
    .then((response) => {
      file.value = response.data.base64;
      fileKey.value++;
    })
    .catch((err) => {
      // Ошибка сервиса — сообщение здесь, форма не теряется
      error.value = err.response?.data || t("file.generate_failed");
    })
    .finally(() => {
      pending.value = false;
    });
};

// Текст или голос поменялись — прежний результат больше не подходит
watch(
  () => props.generateText,
  (newVal) => {
    if (newVal) file.value = null;
  },
);

watch(currentVoice, (newVal, oldVal) => {
  if (newVal && oldVal) file.value = null;
});

const handleFormReset = () => {
  file.value = null;
  error.value = null;
  pending.value = false;
  currentVoice.value = "";
  selectFirstVoice();
};

let formElement = null;

onMounted(() => {
  // Отслеживаем сброс формы
  formElement = inputWrapper.value?.closest("form") || null;
  formElement?.addEventListener("reset", handleFormReset);

  loadVoices();
});

onBeforeUnmount(() => {
  formElement?.removeEventListener("reset", handleFormReset);
});
</script>
