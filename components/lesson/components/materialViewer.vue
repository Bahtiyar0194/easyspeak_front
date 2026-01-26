<template>
  <client-only>
    <div class="custom-grid">
      <div
        :class="
          props.showChat === true ? 'col-span-12 lg:col-span-8' : 'col-span-12'
        "
      >
        <videoPlayer
          v-if="props.material.file_material_type_slug === 'video'"
          :src="config.public.apiBase + '/media/get/' + props.material.target"
        />
        <audioPlayerWithWave
          v-else-if="props.material.file_material_type_slug === 'audio'"
          :src="config.public.apiBase + '/media/get/' + props.material.target"
        />
        <img
          v-else-if="props.material.file_material_type_slug === 'image'"
          :src="config.public.apiBase + '/media/get/' + props.material.target"
          class="w-full h-auto"
        />
        <textViewer
          v-else-if="props.material.block_material_type_slug === 'text'"
          :htmlData="props.material.content"
        />
        <tableViewer
          v-else-if="props.material.block_material_type_slug === 'table'"
          :tableData="props.material.content"
          :options="JSON.parse(props.material.options)"
        />
      </div>
      <div v-if="props.showChat === true" class="col-span-12 lg:col-span-4">
        <stickyBox>
          <div class="card">
            <loader
              v-if="pending"
              :className="'overlay'"
              :showPendingText="true"
            />
            <div class="bg-inactive border-b-inactive p-4">
              <h3 class="mb-0">
                EasySpeak AI <i class="pi pi-sparkles text-corp"></i>
              </h3>
            </div>
            <div class="p-4">
              <scrollFadeContainer
                ref="scrollBox"
                :maxHeight="400"
                :fadeSize="60"
              >
                <div class="custom-grid">
                  <div class="col-span-12">
                    <h4 class="mb-0">
                      {{
                        $t("materials.chat.welcome.title", {
                          name: authUser.first_name,
                        })
                      }}
                    </h4>
                  </div>
                  <div v-if="chat.length === 0" class="col-span-12">
                    <p>
                      {{ $t("materials.chat.welcome.text_1") }}
                    </p>

                    <p class="mb-0">
                      {{ $t("materials.chat.welcome.text_2") }}
                    </p>
                  </div>

                  <div v-if="chat.length" class="col-span-12">
                    <div ref="chatContainer" class="flex flex-col gap-y-4">
                      <div
                        v-for="message in chat"
                        :key="message.id"
                        :data-message-id="message.id"
                        class="w-full"
                        :class="
                          message.role === 'user' ? 'flex justify-end pl-4' : ''
                        "
                      >
                        <div
                          :class="
                            message.role === 'user'
                              ? 'bg-corp text-white px-3 py-2 rounded-2xl text-right w-fit'
                              : 'text-justify'
                          "
                          v-html="message.content"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div v-if="pendingPrompt === true" class="col-span-12">
                    <p class="text-inactive mb-0 dots select-none">
                      {{ $t("thinking") }}
                      <span class="blink animation-delay:0s">.</span>
                      <span class="blink animation-delay:0.3s">.</span>
                      <span class="blink animation-delay:0.6s">.</span>
                    </p>
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
              <div class="bg-inactive border-inactive p-2 rounded-full">
                <div class="flex gap-x-2">
                  <input
                    class="w-full px-2"
                    :disabled="pendingPrompt === true"
                    type="text"
                    :placeholder="$t('type_your_message')"
                    v-model="promptInput"
                  />
                  <button
                    @click="sendPrompt()"
                    class="btn btn-circle btn-active-invert"
                    :class="pendingPrompt === true ? 'disabled' : ''"
                  >
                    <i
                      class="pi"
                      :class="
                        pendingPrompt === true
                          ? 'pi-spinner btn-loading-circle'
                          : promptInput === ''
                          ? 'pi-microphone'
                          : 'pi-arrow-up'
                      "
                    ></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </stickyBox>
      </div>
    </div>
  </client-only>
</template>
<script setup>
import { useRouter } from "nuxt/app";
import Typed from "typed.js";
import loader from "../../ui/loader.vue";
import stickyBox from "../../ui/stickyBox.vue";
import scrollFadeContainer from "../../ui/scrollFadeContainer.vue";
import videoPlayer from "../../ui/videoPlayer.vue";
import audioPlayerWithWave from "../../ui/audioPlayerWithWave.vue";
import textViewer from "../../ui/textViewer.vue";
import tableViewer from "../../ui/tableViewer.vue";
import { onMounted } from "vue";

const config = useRuntimeConfig();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const authUser = useSanctumUser();
const { t, localeProperties } = useI18n();

const chatContainer = ref(null);
const chat = ref([]);
const pending = ref(false);
const pendingPrompt = ref(false);

const scrollBox = ref(null);

const props = defineProps({
  material: {
    type: Object,
    required: true,
  },

  showChat: {
    type: Boolean,
    required: false,
    default: false,
  },
});

let typedInstance = null;

const initTyped = (content) => {
  const lastMessage = chat.value.at(-1);
  if (!lastMessage) return;

  const el = chatContainer.value?.querySelector(
    `[data-message-id="${lastMessage.id}"]`
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
  });
};

const prompts = [
  t("materials.chat.prompts.explain"),
  t("materials.chat.prompts.example"),
];

const promptInput = ref("");

const sendPrompt = async () => {
  // добавляем сообщение пользователя
  chat.value.push({
    id: crypto.randomUUID(),
    role: "user",
    content: promptInput.value,
  });

  pendingPrompt.value = true;

  // подготовка формы
  const formData = new FormData();
  formData.append("lang", localeProperties.value.name);
  formData.append("prompt", promptInput.value);
  formData.append("material", JSON.stringify(props.material));

  promptInput.value = "";

  try {
    // отправка запроса
    const response = await $axiosPlugin.post("/material/explain", formData);

    // добавляем ответ ассистента
    chat.value.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: "", // пустое место для Typed,
    });

    setTimeout(() => {
      initTyped(response.data);
    }, 100);
  } catch (err) {
    if (err.response) {
      router.push({
        path: "/error",
        query: {
          status: err.response.status,
          message: err.response.data.message.error.message || err.response.data.message,
          url: err.request.responseURL,
        },
      });
    } else {
      router.push("/error");
    }
  } finally {
    pendingPrompt.value = false;
  }
};

const getChat = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("/material/get_chat/" + props.material.lesson_material_id)
    .then((response) => {
      chat.value = response.data;
      pending.value = false;
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
  props.showChat === true && getChat();
});

onBeforeUnmount(() => {
  if (typedInstance) {
    typedInstance.destroy();
  }
});

watch(
  () => chat.value.length,
  async (newVal) => {
    await nextTick();
    scrollBox.value.scrollToBottom(true); // true это плавно
  },
  { immediate: true }
);
</script>
