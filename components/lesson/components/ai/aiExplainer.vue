<template>
  <div class="card">
    <loader v-if="pendingChat" :className="'overlay'" :showPendingText="true" />
    <div class="border-b-inactive p-4">
      <div class="flex flex-wrap justify-between items-center gap-4">
        <h3 class="mb-0"><i class="bi bi-stars text-corp"></i> EasySpeak AI</h3>
      </div>
    </div>
    <div class="p-4">
      <scrollFadeContainer ref="scrollBox" :maxHeight="400" :fadeSize="60">
        <div class="custom-grid">
          <div class="col-span-12">
            <h4 class="mb-0">
              {{
                $t("materials.chat.title", {
                  name: authUser.first_name,
                })
              }}
            </h4>
          </div>
          <div v-if="chat.length === 0" class="col-span-12">
            <p class="whitespace-pre-line">
              {{ $t("materials.chat." + props.explainMode + ".description") }}
            </p>
          </div>

          <div v-if="chat.length" class="col-span-12 select-none">
            <div ref="chatContainer" class="flex flex-col gap-y-4">
              <template v-for="message in chat" :key="message.uuid">
                <div
                  v-if="message.user_prompt"
                  class="w-full flex justify-end pl-4"
                >
                  <div
                    class="bg-corp text-white px-3 py-2 rounded-2xl text-right w-fit"
                    :data-u-message-id="message.uuid"
                    v-html="sanitize(message.user_prompt)"
                  ></div>
                </div>

                <div
                  v-if="message.ai_content"
                  class="w-full flex flex-col gap-y-2"
                >
                  <div
                    class="text-justify"
                    :data-ai-message-id="message.uuid"
                    v-html="sanitize(message.ai_content)"
                  ></div>

                  <div class="mb-4">
                    <audioPlayerWithWave
                      :src="
                        config.public.apiBase +
                        '/' +
                        props.explainMode +
                        '/audio_explain/' +
                        message.uuid
                      "
                    />
                  </div>

                  <div v-if="message.ai_content !== '...'" class="btn-wrap">
                    <button
                      class="btn btn-light btn-sm btn-square"
                      @click="copyText(message.uuid)"
                      :title="message.copied ? $t('copied') : $t('copy')"
                    >
                      <i
                        class="pi"
                        :class="message.copied ? 'pi-check' : 'pi-clone'"
                      ></i>
                    </button>

                    <button
                      class="btn btn-light btn-sm btn-square"
                      @click="
                        sendFeedback(
                          message.like === 1 ? null : 1,
                          message.uuid,
                        )
                      "
                      :title="$t('like')"
                    >
                      <i
                        class="pi"
                        :class="
                          message.like === 1
                            ? 'pi-thumbs-up-fill'
                            : 'pi-thumbs-up'
                        "
                      ></i>
                    </button>

                    <button
                      class="btn btn-light btn-sm btn-square"
                      @click="
                        sendFeedback(
                          message.like === 0 ? null : 0,
                          message.uuid,
                        )
                      "
                      :title="$t('dislike')"
                    >
                      <i
                        class="pi"
                        :class="
                          message.like === 0
                            ? 'pi-thumbs-down-fill'
                            : 'pi-thumbs-down'
                        "
                      ></i>
                    </button>

                    <!-- <button
                              class="btn btn-light btn-sm btn-square"
                              v-if="
                                currentExplainId === message.uuid &&
                                message.target
                              "
                              @click="backwardExplain()"
                              :title="$t('file.video.player.backward')"
                            >
                              <i class="bi bi-skip-backward"></i>
                            </button>

                            <button
                              class="btn btn-light btn-sm btn-square"
                              :class="
                                currentExplainId === message.uuid &&
                                pendingAudioExplain === true
                                  ? 'disabled'
                                  : ''
                              "
                              :title="
                                currentExplainId === message.uuid
                                  ? pendingAudioExplain === true
                                    ? $t('loading')
                                    : audioExplainStatus === 'play'
                                      ? $t('file.video.player.pause')
                                      : $t('file.video.player.play')
                                  : $t('listen')
                              "
                              @click="
                                toggleAudioExplain(
                                  message.uuid,
                                  currentExplainId === message.uuid &&
                                    audioExplainStatus === 'play'
                                    ? 'pause'
                                    : 'play',
                                )
                              "
                            >
                              <i
                                :class="[
                                  currentExplainId === message.uuid
                                    ? pendingAudioExplain === true
                                      ? 'pi pi-spinner btn-loading-circle'
                                      : audioExplainStatus === 'play'
                                        ? 'bi bi-pause'
                                        : 'bi bi-play'
                                    : 'bi bi-volume-up',
                                ]"
                              />
                            </button> -->
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </scrollFadeContainer>
    </div>

    <div class="px-4 pb-4">
      <div
        v-if="chat.length === 0 && prompts.length"
        class="flex flex-wrap gap-1.5 mb-4"
      >
        <button
          v-for="prompt in prompts"
          :key="prompt"
          @click="() => (promptInput = prompt)"
          class="btn btn-sm btn-light !rounded-2xl"
        >
          {{ prompt }}
        </button>
      </div>

      <div class="flex items-center gap-x-2 w-full">
        <div class="bg-inactive border-inactive p-2 rounded-full w-full">
          <div class="flex items-center gap-x-1">
            <div
              v-if="pendingPrompt === true || recording === true"
              class="w-full pl-2"
            >
              <p class="text-inactive mb-0 dots select-none">
                <span class="blink">
                  {{
                    pendingPrompt === true
                      ? pendingAudio === true
                        ? $t("handling")
                        : $t("thinking")
                      : $t("recording")
                  }}</span
                >
                <span class="blink animation-delay:0s">.</span>
                <span class="blink animation-delay:0.3s">.</span>
                <span class="blink animation-delay:0.6s">.</span>
              </p>
            </div>
            <input
              v-else
              class="w-full px-2"
              type="text"
              :placeholder="$t('type_your_message')"
              v-model="promptInput"
            />
            <!-- <button
                    @click="
                      promptInput === ''
                        ? recording === true
                          ? stopRecord()
                          : startRecord()
                        : sendPrompt()
                    "
                    class="btn btn-circle btn-active-invert relative"
                    :class="pendingPrompt === true ? 'disabled' : ''"
                  >
                    <i
                      :class="
                        pendingPrompt === true
                          ? 'pi pi-spinner btn-loading-circle'
                          : promptInput === ''
                            ? recording === true
                              ? 'bi bi-record-fill text-danger pulse'
                              : 'bi bi-mic-fill'
                            : 'pi pi-arrow-up'
                      "
                    ></i>

                    <tooltip
                      :show="tooltipIsShow"
                      :title="tooltipTitle"
                      :className="''"
                    />
                  </button> -->

            <button
              @pointerdown="startRecord()"
              @pointerup="stopRecord()"
              @pointerleave="stopRecord()"
              @pointercancel="stopRecord()"
              v-if="promptInput === ''"
              class="btn btn-circle btn-active-invert relative"
              :class="pendingPrompt === true ? 'disabled' : ''"
            >
              <i
                :class="
                  pendingPrompt === true
                    ? 'pi pi-spinner btn-loading-circle'
                    : recording === true
                      ? 'bi bi-record-fill text-danger pulse'
                      : 'bi bi-mic-fill'
                "
              ></i>

              <tooltip
                :show="tooltipIsShow"
                :title="tooltipTitle"
                :className="''"
              />
            </button>
            <button
              v-else
              @click="sendPrompt()"
              class="btn btn-circle btn-active-invert relative"
              :class="pendingPrompt === true ? 'disabled' : ''"
            >
              <i
                :class="
                  pendingPrompt === true
                    ? 'pi pi-spinner btn-loading-circle'
                    : 'pi pi-arrow-up'
                "
              ></i>
            </button>
          </div>
        </div>
        <!-- <button
          @click="toggleMute()"
          class="btn btn-circle btn-lg relative"
          :class="isMuted ? 'btn-light' : 'btn-success'"
        >
          <i
            class="bi"
            :class="isMuted ? 'bi-volume-mute-fill' : 'bi-broadcast'"
          ></i>
        </button> -->
      </div>
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

const isMuted = ref(false);
const promptInput = ref("");
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
    return "Microphone access denied";
  }

  if (error?.name === "NotFoundError") {
    return "Microphone not found";
  }

  return "Could not record audio";
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
  if (promptInput.value !== "") {
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

const handleKeyPress = (event) => {
  if (event.key === "Enter") {
    sendPrompt();
  }
};

onMounted(async () => {
  getChat();
  window.addEventListener("keydown", handleKeyPress);
});

onBeforeUnmount(() => {
  if (typedInstance) {
    typedInstance.destroy();
  }
  stopAudio();
  window.removeEventListener("keydown", handleKeyPress);
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
