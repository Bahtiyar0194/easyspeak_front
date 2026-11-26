<template>
  <div class="custom-grid">
    <!-- Поиск по словам + добавление (админ) -->
    <div class="col-span-12">
      <div class="flex flex-wrap items-center gap-3">
        <div
          v-if="categories.length > 0"
          class="form-group-border active flex-1 min-w-[220px] max-w-md"
        >
          <i class="pi pi-search"></i>
          <input
            v-model="search"
            type="search"
            placeholder=" "
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
          />
          <label>{{ $t("pages.dictionary.search") }}</label>
        </div>
        <roleProvider :roles="[1]">
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="
              openDictionaryModal('create', {
                lesson_id: props.lesson_id,
              })
            "
          >
            <i class="pi pi-plus" aria-hidden="true"></i>
            {{ $t("pages.dictionary.add") }}
          </button>
        </roleProvider>
      </div>
    </div>

    <div class="col-span-12 relative">
      <loader
        v-if="pendingDictionary && categories.length"
        :className="'overlay !rounded-2xl'"
      />

      <div v-if="filteredCategories.length > 0" class="flex flex-col gap-3">
        <section
          v-for="item in filteredCategories"
          :key="item.categoryIndex"
          class="dict-cat"
          :class="{ open: isOpen(item.categoryIndex) }"
        >
          <button
            type="button"
            class="dict-cat-head"
            :aria-expanded="isOpen(item.categoryIndex)"
            @click="toggleAccordion(item.categoryIndex)"
          >
            <span class="dict-cat-badge">{{ item.category.category_slug }}</span>
            <span class="flex-1 min-w-0 flex flex-col text-left">
              <span class="font-semibold leading-snug">{{
                item.category.category_name
              }}</span>
              <span class="text-xs text-inactive"
                >{{ $t("pages.dictionary.count") }}:
                {{ item.words.length }}</span
              >
            </span>
            <i class="pi pi-angle-down dict-cat-chevron" aria-hidden="true"></i>
          </button>

          <div v-show="isOpen(item.categoryIndex)" class="dict-words">
            <div v-for="word in item.words" :key="word.word_id" class="dict-word">
              <div
                v-if="word.image_file"
                class="dict-word-img"
                :style="{
                  backgroundImage:
                    'url(' + config.public.apiBase + '/media/get/' + word.image_file + ')',
                }"
                aria-hidden="true"
              ></div>
              <div class="flex-1 min-w-0">
                <p class="mb-0 font-semibold leading-snug break-words">
                  {{ word.word }}
                  <span
                    v-if="word.transcription"
                    class="font-normal text-inactive text-sm"
                    >[{{ word.transcription }}]</span
                  >
                </p>
                <p class="mb-0 text-sm text-inactive break-words">
                  {{ word.word_translate }}
                </p>
              </div>
              <audioButton
                v-if="word.audio_file"
                :src="config.public.apiBase + '/media/get/' + word.audio_file"
                @click.stop
              />
            </div>
          </div>
        </section>
      </div>

      <emptyState
        v-else-if="categories.length > 0"
        :text="$t('nothing_was_found_for_your_query')"
        icon="bi bi-search"
      />
      <emptyState
        v-else
        :pending="pendingDictionary"
        :text="$t('pages.dictionary.there_are_no_words')"
        icon="bi bi-inbox"
      />
    </div>
  </div>

  <modal
    :show="modalIsVisible"
    :onClose="() => closeModalByUser()"
    :className="modalClass + ' min-h-0 select-none'"
    :showLoader="pendingModal"
    :loaderOpacityFull="true"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h3>
        {{ category ? category.category_slug : $t("pages.dictionary.add") }}
      </h3>
    </template>
    <template v-slot:body_content>
      <component :is="currentModal" v-bind="modalProps" />
    </template>
  </modal>
</template>
<script setup>
import { useRouter } from "nuxt/app";
import loader from "../../ui/loader.vue";
import roleProvider from "../../ui/roleProvider.vue";
import modal from "../../ui/modal.vue";
import emptyState from "~/components/ui/emptyState.vue";
import audioButton from "../../ui/audioButton.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
const config = useRuntimeConfig();
const { localeProperties } = useI18n();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const pendingDictionary = ref(false);
const pendingModal = ref(false);
const pendingDelete = ref(false);

const categories = ref([]);
const category = ref(null);
const deleteCategoryId = ref(null);
const modalClass = ref("modal-lg");
const modalProps = ref({});
const modalIsVisible = ref(false);
const currentModal = shallowRef(null);
const deleteModalIsVisible = ref(false);
const activeSectionIndex = ref(null);
const search = ref("");

// Поиск по слову, переводу и транскрипции. Во время поиска раскрыты все
// категории, где что-то нашлось; пустые категории скрыты.
const filteredCategories = computed(() => {
  const q = search.value.trim().toLowerCase();
  return categories.value
    .map((category, categoryIndex) => ({
      category,
      categoryIndex,
      words: q
        ? category.dictionary.filter((w) =>
            [w.word, w.word_translate, w.transcription].some((v) =>
              String(v || "").toLowerCase().includes(q),
            ),
          )
        : category.dictionary,
    }))
    .filter((item) => !q || item.words.length > 0);
});

const isOpen = (index) =>
  search.value.trim() !== "" || activeSectionIndex.value === index;

const props = defineProps({
  lesson_id: {
    required: true,
  },
});

const onPending = (state) => {
  pendingModal.value = state;
};

const changeModalSize = (size) => {
  modalClass.value = size;
};

const closeModal = () => {
  modalIsVisible.value = false;
  pendingModal.value = false;
  category.value = null;
  getLessonDictionary();
};

const closeModalByUser = () => {
  modalIsVisible.value = false;
  pendingModal.value = false;
  currentModal.value = null;
  category.value = null;
};

const openEditDictionary = (currentDictionary) => {
  category.value = currentDictionary;
  openDictionaryModal("edit", {
    dictionary: currentDictionary,
  });
};

const openDictionaryModal = (action, props = {}) => {
  modalIsVisible.value = true;
  currentModal.value = defineAsyncComponent(() =>
    import(`../components/dictionary/${action}.vue`)
  );
  modalProps.value = props;
};

provide("onPending", onPending);
provide("changeModalSize", changeModalSize);
provide("closeModal", closeModal);

const getLessonDictionary = async () => {
  pendingDictionary.value = true;

  await $axiosPlugin
    .get("dictionary/get_lesson_dictionary/" + props.lesson_id)
    .then((response) => {
      categories.value = response.data;
      pendingDictionary.value = false;
      if (activeSectionIndex.value === null && categories.value.length) {
        activeSectionIndex.value = 0;
      }
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

const openDeleteModal = (category) => {
  currentModal.value = null;
  deleteCategoryId.value = category.category_id;
  deleteModalIsVisible.value = true;
};

const deleteDictionarySubmit = async () => {
  pendingDelete.value = true;
  await $axiosPlugin
    .delete(
      "dictionary/delete_category/" +
        props.lesson_id +
        "/" +
        deleteCategoryId.value,
      {
        params: { operation_type_id: 22 }, // Передача параметра в URL
      }
    )
    .then((response) => {
      deleteModalIsVisible.value = false;
      getLessonDictionary();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          deleteModalIsVisible.value = false;
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
      pendingDelete.value = false;
    });
};

const orderCategories = async () => {
  const form_data = new FormData();
  form_data.append("dictionary", JSON.stringify(categories.value));
  form_data.append("operation_type_id", 19);
  await $axiosPlugin
    .post("dictionary/order/" + props.lesson_id, form_data)
    .then((response) => {
      //getLessonDictionary();
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

const debounceOrder = debounceHandler(orderCategories, 2000);

const order = (direction, index, event) => {
  const parent = event.closest("li");
  if (!parent) return;

  if (direction === "up" && index > 0) {
    [categories.value[index - 1], categories.value[index]] = [
      categories.value[index],
      categories.value[index - 1],
    ];
  } else if (direction === "down" && index < categories.value.length - 1) {
    [categories.value[index], categories.value[index + 1]] = [
      categories.value[index + 1],
      categories.value[index],
    ];
  }

  scrollIntoView(parent, {
    behavior: "smooth",
    block: "center",
    inline: "center",
  });

  debounceOrder();
};

const toggleAccordion = (index) => {
  if (index === activeSectionIndex.value) {
    activeSectionIndex.value = null;
  } else {
    activeSectionIndex.value = index;
  }
};

onMounted(() => {
  getLessonDictionary();
});
</script>
