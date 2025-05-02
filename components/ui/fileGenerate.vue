<template>
  <div ref="inputWrapper">
    <loader v-if="pending" :className="'overlay'" />
    <div class="form-group-border select active label-active mb-4">
      <i class="pi pi-microphone"></i>
      <select v-model="currentVoice">
        <option v-for="(voice, voiceIndex) in voices" :key="voiceIndex">
          {{ voice }}
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
const currentVoice = ref("Alloy");
const voices = [
  "Alloy",
  "Ash",
  "Coral",
  "Echo",
  "Fable",
  "Nova",
  "Onyx",
  "Sage",
  "Shimmer",
];

const generateFile = async () => {
  error.value = null;
  if (props.generateText == "") {
    error.value = props.generateFileError;
    return;
  }
  pending.value = true;

  await $axiosPlugin
    .get("openai/tts", {
      params: {
        text: props.generateText,
        voice: currentVoice.value.toLowerCase(),
      },
    })
    .then((response) => {
      file.value = response.data.base64;
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 500) {
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
  currentVoice.value = "Alloy";
  instructions.value = "";
  pending.value = false;
};

onMounted(() => {
  // Отслеживаем сброс формы
  const formElement = inputWrapper.value.closest("form");
  if (formElement) {
    formElement.addEventListener("reset", handleFormReset); // Слушаем сброс формы
  }
});

onBeforeUnmount(() => {
  const formElement = inputWrapper.value.closest("form");
  if (formElement) {
    formElement.removeEventListener("reset", handleFormReset); // Слушаем сброс формы
  }
});
</script>
