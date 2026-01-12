<template>
  <div ref="inputWrapper">
    <loader v-if="pending" :className="'overlay'" :showPendingText="true"/>
    <div class="form-group-border select active label-active mb-4">
      <i class="pi pi-microphone"></i>
      <select v-model="currentVoice">
        <option disabled value="">
          {{ $t("file.audio.choose_a_voice") }}
        </option>
        <option
          v-for="(voice, voiceIndex) in voices"
          :key="voiceIndex"
          :value="voice.voice_id"
        >
          {{ voice.name }}
        </option>
      </select>
      <label>
        {{ $t("file.audio.voice") }}
      </label>
    </div>

    <div
      v-if="props.accept === 'image'"
      class="form-group-border active label-active mb-2"
    >
      <i class="pi pi-list"></i>
      <textarea v-model="instructions"></textarea>
      <label>{{ $t("instructions") }}</label>
    </div>

    <button
      v-if="file === null"
      @click="generateFile()"
      type="button"
      class="btn btn-sm btn-outline-primary mb-2"
    >
      <i class="pi pi-asterisk"></i>
      {{ $t("generate") }}
    </button>

    <div v-if="file">
      <audioPlayerWithWave
        v-if="props.accept === 'audio'"
        :key="'audio_' + file"
        :src="'data:audio/mpeg;base64,' + file"
      />
    </div>

    <p v-if="(error || props.error) && !file" class="text-danger mb-0">
      {{ error || props.error[0] || props.error }}
    </p>

    <input type="hidden" :name="props.generateFileInputName" :value="file" />
  </div>
</template>

<script setup>
import loader from "./loader.vue";
import { useRouter } from "nuxt/app";
import audioPlayerWithWave from "./audioPlayerWithWave.vue";
const inputWrapper = ref(null);
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const pending = ref(false);
const file = ref(null);
const error = ref(null);

const props = defineProps({
  accept: {
    type: String,
    required: true,
  },
  error: {
    type: Object,
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

const instructions = ref("");
const currentVoice = ref("");
const voices = ref([]);

const getVoices = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("elevenlabs/list_voices")
    .then((response) => {
      voices.value = response.data.voices;
    })
    .catch((err) => {
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
    })
    .finally(() => {
      pending.value = false;
    });
};

const generateFile = async () => {
  error.value = null;
  if (props.generateText == "") {
    error.value = props.generateFileError;
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
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status) {
          error.value = err.response.data;
        } else {
          router.push({
            path: "/error",
            query: {
              status: err.response.status,
              message: err.response.data.message,
              url: err.request.responseURL,
            },
          });
        }
      } else {
        router.push("/error");
      }
    })
    .finally(() => {
      pending.value = false;
    });
};

watch(
  () => props.generateText,
  (newVal) => {
    if (newVal) {
      file.value = null;
    }
  }
);

watch(
  () => currentVoice.value,
  (newVal) => {
    if (newVal) {
      file.value = null;
    }
  }
);

const handleFormReset = () => {
  file.value = null;
  error.value = null;
  currentVoice.value = "";
  instructions.value = "";
  pending.value = false;
};

onMounted(() => {
  // Отслеживаем сброс формы
  const formElement = inputWrapper.value.closest("form");
  if (formElement) {
    formElement.addEventListener("reset", handleFormReset); // Слушаем сброс формы
  }

  getVoices();
});

onBeforeUnmount(() => {
  const formElement = inputWrapper.value.closest("form");
  if (formElement) {
    formElement.removeEventListener("reset", handleFormReset); // Слушаем сброс формы
  }
});
</script>
