<template>
  <div class="card ai-chat !rounded-2xl">
    <loader v-if="pendingChat" :className="'overlay'" :showPendingText="true" />

    <!-- Шапка -->
    <div class="ai-chat-head">
      <span class="ai-avatar" aria-hidden="true"><i class="bi bi-stars"></i></span>
      <div class="min-w-0">
        <h4 class="mb-0 leading-tight">EasySpeak AI</h4>
        <p class="mb-0 text-xs text-inactive flex items-center gap-1.5">
          <span class="ai-online-dot" aria-hidden="true"></span>
          {{ $t("online") }}
        </p>
      </div>
    </div>

    <!-- Сообщения -->
    <div class="px-4 pt-4">
      <scrollFadeContainer ref="scrollBox" :maxHeight="400" :fadeSize="60">
        <div ref="chatContainer" class="flex flex-col gap-4 pb-2" aria-live="polite">
          <!-- Приветствие, пока чат пустой -->
          <div v-if="chat.length === 0" class="ai-msg">
            <span class="ai-avatar sm" aria-hidden="true"><i class="bi bi-stars"></i></span>
            <div class="ai-bubble">
              <p class="mb-2 font-semibold">
                {{ $t("materials.chat.title", { name: authUser?.first_name }) }}
              </p>
              <p class="mb-0 whitespace-pre-line text-sm">
                {{ $t("materials.chat." + props.explainMode + ".description") }}
              </p>
            </div>
          </div>

          <template v-for="message in chat" :key="message.uuid">
            <!-- Сообщение пользователя -->
            <div v-if="message.user_prompt" class="user-msg">
              <div
                class="user-bubble"
                :data-u-message-id="message.uuid"
                v-html="sanitize(message.user_prompt)"
              ></div>
            </div>

            <!-- Ответ AI -->
            <div v-if="message.ai_content" class="ai-msg">
              <span class="ai-avatar sm" aria-hidden="true"><i class="bi bi-stars"></i></span>
              <div class="flex-1 min-w-0 flex flex-col gap-2">
                <div
                  class="ai-bubble ai-content"
                  :data-ai-message-id="message.uuid"
                  v-html="sanitize(message.ai_content)"
                ></div>

                <audioPlayerWithWave
                  v-if="message.ai_content !== '...'"
                  :src="
                    config.public.apiBase +
                    '/' +
                    props.explainMode +
                    '/audio_explain/' +
                    message.uuid
                  "
                />

                <div v-if="message.ai_content !== '...'" class="ai-actions">
                  <button
                    type="button"
                    class="ai-action"
                    @click="copyText(message.uuid)"
                    :title="message.copied ? $t('copied') : $t('copy')"
                    :aria-label="message.copied ? $t('copied') : $t('copy')"
                  >
                    <i
                      class="pi"
                      :class="message.copied ? 'pi-check text-success' : 'pi-clone'"
                    ></i>
                  </button>
                  <button
                    type="button"
                    class="ai-action"
                    :class="{ active: message.like === 1 }"
                    @click="sendFeedback(message.like === 1 ? null : 1, message.uuid)"
                    :title="$t('like')"
                    :aria-label="$t('like')"
                    :aria-pressed="message.like === 1"
                  >
                    <i
                      class="pi"
                      :class="message.like === 1 ? 'pi-thumbs-up-fill' : 'pi-thumbs-up'"
                    ></i>
                  </button>
                  <button
                    type="button"
                    class="ai-action"
                    :class="{ active: message.like === 0 }"
                    @click="sendFeedback(message.like === 0 ? null : 0, message.uuid)"
                    :title="$t('dislike')"
                    :aria-label="$t('dislike')"
                    :aria-pressed="message.like === 0"
                  >
                    <i
                      class="pi"
                      :class="message.like === 0 ? 'pi-thumbs-down-fill' : 'pi-thumbs-down'"
                    ></i>
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- «Печатает…» пока ждём ответ -->
          <div v-if="pendingPrompt && !pendingAudio" class="ai-msg">
            <span class="ai-avatar sm" aria-hidden="true"><i class="bi bi-stars"></i></span>
            <div class="ai-bubble ai-typing" :aria-label="$t('thinking')">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </scrollFadeContainer>
    </div>

    <!-- Ввод -->
    <div class="p-4">
      <div v-if="chat.length === 0 && prompts.length" class="flex flex-wrap gap-1.5 mb-3">
        <button
          type="button"
          v-for="prompt in prompts"
          :key="prompt"
          @click="usePrompt(prompt)"
          class="ai-chip"
        >
          {{ prompt }}
        </button>
      </div>

      <form class="ai-input" @submit.prevent="sendPrompt()">
        <div v-if="pendingPrompt === true || recording === true" class="flex-1 pl-2">
          <p class="mb-0 select-none flex items-center gap-2" :class="recording ? 'text-danger' : 'text-inactive'">
            <span v-if="recording" class="live-dot !w-2.5 !h-2.5" aria-hidden="true"></span>
            <span class="dots">
              {{
                pendingPrompt === true
                  ? pendingAudio === true
                    ? $t("handling")
                    : $t("thinking")
                  : $t("recording")
              }}
              <span class="blink animation-delay:0s">.</span>
              <span class="blink animation-delay:0.3s">.</span>
              <span class="blink animation-delay:0.6s">.</span>
            </span>
          </p>
        </div>
        <input
          v-else
          ref="promptInputRef"
          class="flex-1 min-w-0 px-2 bg-transparent"
          type="text"
          :placeholder="$t('type_your_message')"
          :aria-label="$t('type_your_message')"
          enterkeyhint="send"
          autocomplete="off"
          v-model="promptInput"
        />

        <!-- Пустое поле — микрофон (удерживать), иначе — отправить -->
        <button
          type="button"
          v-if="promptInput === ''"
          @pointerdown="startRecord()"
          @pointerup="stopRecord()"
          @pointerleave="stopRecord()"
          @pointercancel="stopRecord()"
          @contextmenu.prevent
          class="ai-send"
          :class="{ recording: recording, disabled: pendingPrompt === true }"
          :title="$t('hold_to_record')"
          :aria-label="$t('hold_to_record')"
        >
          <i
            :class="
              pendingPrompt === true
                ? 'pi pi-spinner btn-loading-circle'
                : recording === true
                  ? 'bi bi-mic-fill'
                  : 'bi bi-mic'
            "
          ></i>

          <tooltip :show="tooltipIsShow" :title="tooltipTitle" :className="''" />
        </button>
        <button
          type="submit"
          v-else
          class="ai-send primary"
          :class="{ disabled: pendingPrompt === true }"
          :disabled="pendingPrompt === true"
          :title="$t('pages.conference.send')"
          :aria-label="$t('pages.conference.send')"
        >
          <i
            :class="
              pendingPrompt === true ? 'pi pi-spinner btn-loading-circle' : 'pi pi-arrow-up'
            "
          ></i>
        </button>
      </form>
      <p
        v-if="promptInput === '' && !recording && !pendingPrompt"
        class="mb-0 mt-2 text-xs text-inactive text-center"
      >
        <i class="bi bi-mic" aria-hidden="true"></i>
        {{ $t("hold_to_record") }}
      </p>
    </div>
  </div>
</template>
<script setup>
import { useRouter } from "nuxt/app";
import {
  backward,
  pauseAudio,
  playAudio,
  resumeAudio,
  stopAudio,
} from "../../../../utils/playAudio";
import { debounceHandler } from "../../../../utils/debounceHandler";
import { sanitize } from "../../../../utils/sanitize";
import { useAudioRecorder } from "../../../../composables/useAudioRecorder";
import Typed from "typed.js";
import loader from "../../../ui/loader.vue";
import scrollFadeContainer from "../../../ui/scrollFadeContainer.vue";
import tooltip from "../../../ui/tooltip.vue";
import audioPlayerWithWave from "../../../ui/audioPlayerWithWave.vue";
import { onMounted } from "vue";

const props = defineProps({
  explainMode: {
    type: String,
    required: true,
  },
  material: {
    type: Object,
    required: false,
  },
});

const config = useRuntimeConfig();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const { startRecording, stopRecording, isSilentBlob, getFileExtension } =
  useAudioRecorder();
const authUser = useSanctumUser();
const { t, localeProperties } = useI18n();

const prompts =
  props.explainMode === "material"
    ? [
        t("materials.chat.material.prompts.explain"),
        t("materials.chat.material.prompts.example"),
      ]
    : [
        t("materials.chat.speaking.prompts.text_1"),
        t("materials.chat.speaking.prompts.text_2"),
        t("materials.chat.speaking.prompts.text_3"),
        t("materials.chat.speaking.prompts.text_4"),
      ];

const isMuted = ref(true);
const promptInput = ref("");
const promptInputRef = ref(null);

// Подсказка-заготовка: подставляем в поле и ставим курсор — можно дописать.
const usePrompt = (prompt) => {
  promptInput.value = prompt;
  nextTick(() => promptInputRef.value?.focus());
};
const chatContainer = ref(null);
const chat = ref([]);
const pendingChat = ref(false);
const pendingPrompt = ref(false);
const pendingAudio = ref(false);

const tooltipTitle = ref("");
const tooltipIsShow = ref(false);
let tooltipTimer = null;

let pressTime = 0;
const recording = ref(false);
const stoppingRecord = ref(false);

const currentExplainId = ref(null);
const audioExplainStatus = ref(null);
const pendingAudioExplain = ref(false);

const scrollBox = ref(null);

let typedInstance = null;

const initTyped = (content) => {
  const lastMessage = chat.value.at(-1);
  if (!lastMessage) return;

  const el = chatContainer.value?.querySelector(
    `[data-ai-message-id="${lastMessage.uuid}"]`,
  );

  if (!el) return;

  typedInstance = new Typed(el, {
    strings: [content],
    contentType: "html",
    typeSpeed: 5,
    backSpeed: 20,
    backDelay: 1000,
    loop: false,
    smartBackspace: false,
    showCursor: false,
    cursorChar: "|",
    onComplete: () => {
      lastMessage.ai_content = content;
    },
  });
};

const toggleMute = () => {
  isMuted.value = !isMuted.value;

  if (isMuted.value === true) {
    stopAudio();
  }
};

const showTooltip = (title, duration = 2000) => {
  tooltipTitle.value = title;
  tooltipIsShow.value = true;

  stopAudio();
  playAudio("/audio/error-short.mp3", {
    onEnded: () => {},
    onLoading: (state) => {},
  });

  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
  }

  tooltipTimer = setTimeout(() => {
    tooltipIsShow.value = false;
    tooltipTimer = null;
  }, duration);
};

const getRecordingErrorMessage = (error) => {
  if (error?.name === "NotAllowedError") {
    return t("mic_access_denied");
  }

  if (error?.name === "NotFoundError") {
    return t("mic_not_found");
  }

  return t("mic_record_failed");
};

const startRecord = async () => {
  if (pendingPrompt.value === true || recording.value === true) {
    return;
  }

  stoppingRecord.value = false;
  stopAudio();

  try {
    await startRecording();

    recording.value = true;
    pressTime = Date.now();

    playAudio("/audio/rec-start.mp3", {
      onEnded: () => {},
      onLoading: (state) => {},
    });
  } catch (error) {
    recording.value = false;
    pressTime = 0;
    showTooltip(getRecordingErrorMessage(error), 3000);
  }
};

const stopRecord = async () => {
  if (recording.value === false || stoppingRecord.value === true) {
    return;
  }

  recording.value = false;
  stoppingRecord.value = true;
  const recordDuration = Date.now() - pressTime;

  let blob = null;

  try {
    blob = await stopRecording();
  } catch (error) {
    showTooltip(getRecordingErrorMessage(error), 3000);
    return;
  } finally {
    stoppingRecord.value = false;
    pressTime = 0;
  }

  if (!blob) {
    return;
  }

  if (recordDuration < 500) {
    // Recording is too short, cancel it.
    showTooltip(t("recording_too_short"), 3000);
    return;
  } else if (recordDuration > 20000) {
    // Recording is too long, cancel it. 20 sec
    showTooltip(t("recording_too_long"), 3000);
    return;
  }

  if (await isSilentBlob(blob)) {
    showTooltip(t("recording_silent"), 3000);
    return;
  }

  pendingPrompt.value = true;
  pendingAudio.value = true;

  stopAudio();
  playAudio("/audio/rec-stop.mp3", {
    onEnded: () => {},
    onLoading: (state) => {},
  });

  // Prepare the form payload.
  const formData = new FormData();
  formData.append("audio", blob, `speech.${getFileExtension(blob.type)}`);

  promptInput.value = "";

  try {
    // Send the STT request.
    const response = await $axiosPlugin.post("/openai/stt", formData);

    promptInput.value = response.data.text;
  } catch (err) {
    if (err.response) {
      router.push({
        path: "/error",
        query: {
          status: err.response.status,
          message:
            err.response.data.message.error.message ||
            err.response.data.message,
          url: err.request.responseURL,
        },
      });
    } else {
      router.push("/error");
    }
  } finally {
    pendingPrompt.value = false;
    pendingAudio.value = false;
  }
};

const toggleAudioExplain = (uuid, action) => {
  if (currentExplainId.value && currentExplainId.value !== uuid) {
    stopAudio();
    audioExplainStatus.value = null;
  }

  currentExplainId.value = uuid;

  if (action === "play") {
    if (audioExplainStatus.value === "pause") {
      resumeAudio();
    } else {
      playAudio(
        config.public.apiBase +
          "/" +
          props.explainMode +
          "/audio_explain/" +
          uuid,
        {
          onEnded: () => {
            audioExplainStatus.value = null;
            currentExplainId.value = null;
          },
          onLoading: (state) => {
            pendingAudioExplain.value = state;
          },
        },
      );
    }

    audioExplainStatus.value = "play";
  }

  if (action === "pause") {
    pauseAudio();
    audioExplainStatus.value = "pause";
  }
};

const backwardExplain = () => {
  audioExplainStatus.value = "pause";
  backward();
  audioExplainStatus.value = "play";
};

const copyText = async (uuid) => {
  const mess = chat.value.find((m) => m.uuid === uuid);
  if (mess) {
    // 1. Copy HTML to the clipboard.
    const htmlBlob = new Blob([sanitize(mess.ai_content)], {
      type: "text/html",
    });

    // 2. Copy plain text without tags.
    const temp = document.createElement("div");
    temp.innerHTML = sanitize(mess.ai_content);
    const text = temp.innerText;

    const textBlob = new Blob([text], { type: "text/plain" });

    const item = new ClipboardItem({
      "text/html": htmlBlob,
      "text/plain": textBlob,
    });

    await navigator.clipboard.write([item]);

    mess.copied = true;

    setTimeout(() => {
      mess.copied = null;
    }, 3000);
  }
};

const sendFeedback = async (like, uuid) => {
  const mess = chat.value.find((m) => m.uuid === uuid);
  if (mess) {
    mess.like = like;

    debounceFeedback(mess.like, uuid);
  }
};

const debounceFeedback = debounceHandler(async (like, uuid) => {
  const formData = new FormData();

  if (like !== null) {
    formData.append("feedback", like);
  }

  try {
    // Send the feedback request.
    const response = await $axiosPlugin.post(
      "/" + props.explainMode + "/feedback/" + uuid,
      formData,
    );
  } catch (err) {
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
}, 1000);

const sendPrompt = async () => {
  if (pendingPrompt.value) return;
  if (promptInput.value.trim() !== "") {
    // Add the user message to the chat.
    chat.value.push({
      uuid: crypto.randomUUID(),
      user_prompt: promptInput.value,
    });

    pendingPrompt.value = true;

    // Prepare the request payload.
    const formData = new FormData();
    formData.append("lang", localeProperties.value.name);
    formData.append("prompt", promptInput.value);

    switch (props.explainMode) {
      case "material":
        formData.append("material", JSON.stringify(props.material));
        break;

      default:
        break;
    }

    promptInput.value = "";

    try {
      // Send the explain request.
      const response = await $axiosPlugin.post(
        props.explainMode + "/explain",
        formData,
      );

      // Add the assistant response placeholder.
      chat.value.push({
        uuid: response.data.uuid,
        ai_content: "...", // Placeholder for Typed animation.
      });

      await nextTick();

      initTyped(response.data.text);

      if (isMuted.value === false) {
        playAudio(
          config.public.apiBase +
            "/" +
            props.explainMode +
            "/audio_explain/" +
            response.data.uuid,
          {
            onEnded: () => {},
            onLoading: (state) => {},
          },
        );
      }
    } catch (err) {
      if (err.response) {
        router.push({
          path: "/error",
          query: {
            status: err.response.status,
            message:
              err.response.data.message.error.message ||
              err.response.data.message,
            url: err.request.responseURL,
          },
        });
      } else {
        router.push("/error");
      }
    } finally {
      pendingPrompt.value = false;
    }
  }
};

const getChat = async () => {
  pendingChat.value = true;

  let url;

  switch (props.explainMode) {
    case "material":
      url = "/material/get_chat/" + props.material.lesson_material_id;
      break;

    case "speaking":
      url = "/speaking/get_chat";
      break;

    default:
      break;
  }

  await $axiosPlugin
    .get(url)
    .then((response) => {
      chat.value = response.data;
      pendingChat.value = false;
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
    });
};

onMounted(async () => {
  getChat();
});

onBeforeUnmount(() => {
  if (typedInstance) {
    typedInstance.destroy();
  }
  stopAudio();
});

watch(
  () => chat.value.length,
  async () => {
    await nextTick();
    if (scrollBox.value) {
      scrollBox.value.scrollToBottom(true); // `true` enables smooth scrolling.
    }
  },
  { immediate: true },
);
</script>
