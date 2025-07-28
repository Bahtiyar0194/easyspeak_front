<template>
  <div class="custom-grid">
    <roleProvider :roles="[1]">
      <div class="col-span-12">
        <div class="btn-wrap">
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="
              openDictionaryModal('create', {
                lesson_id: props.lesson_id,
              })
            "
          >
            <i class="pi pi-plus"></i>
            {{ $t("pages.dictionary.add") }}
          </button>
        </div>
      </div>
    </roleProvider>
    <div class="col-span-12">
      <ul class="list-group">
        <li
          v-for="(category, categoryIndex) in categories"
          :key="categoryIndex"
          class="list-item"
        >
          <div>
            <div
              @click="toggleAccordion(categoryIndex)"
              class="flex justify-between items-center gap-4 hover:cursor-pointer"
            >
              <div class="flex flex-col">
                <h5
                  class="mb-0"
                  :class="activeSectionIndex === categoryIndex && 'text-corp'"
                >
                  {{ category.category_slug }} - {{ category.category_name }}
                </h5>
                <span
                  v-if="category.dictionary.length"
                  class="text-active text-sm"
                  >{{ $t("pages.dictionary.count") }}:
                  <b>{{ category.dictionary.length }}</b></span
                >
              </div>
              <div class="btn btn-circle btn-light">
                <i
                  class="pi pi-angle-down duration-500"
                  :class="categoryIndex === activeSectionIndex && 'rotate-180'"
                ></i>
              </div>
            </div>
          </div>

          <div
            class="transition-all duration-500 ease-in-out overflow-hidden"
            :class="activeSectionIndex === categoryIndex ? 'h-auto' : 'h-0'"
          >
            <div class="table table-striped table-sm mt-4">
              <table>
                <thead>
                  <tr>
                    <th>{{ $t("pages.dictionary.word") }}</th>
                    <th>
                      {{
                        $t(
                          "pages.dictionary.translate." + localeProperties.code
                        )
                      }}
                    </th>
                    <th class="hidden md:block">
                      {{ $t("pages.dictionary.transcription") }}
                    </th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="word in category.dictionary" :key="word.word_id">
                    <td class="font-medium">{{ word.word }}</td>
                    <td>{{ word.word_translate }}</td>
                    <td class="hidden md:block">[{{ word.transcription }}]</td>
                    <td>
                      <div class="flex items-center gap-x-4">
                        <audioButton
                          v-if="word.audio_file"
                          :src="
                            config.public.apiBase +
                            '/media/get/' +
                            word.audio_file
                          "
                          @click.stop
                        />
                        <div
                          v-if="word.image_file"
                          :style="{
                            backgroundImage:
                              'url(' +
                              config.public.apiBase +
                              '/media/get/' +
                              word.image_file +
                              ')',
                          }"
                          class="h-9 w-9 bg-cover bg-no-repeat bg-center rounded-lg"
                        ></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </li>
      </ul>
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
import alert from "../../ui/alert.vue";
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
          errors.value = err.response.data;
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
