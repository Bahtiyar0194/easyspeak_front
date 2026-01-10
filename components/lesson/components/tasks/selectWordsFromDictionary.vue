<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <button
        type="button"
        @click="showHideWordSearchFilter"
        class="btn btn-light"
      >
        <i class="pi pi-search"></i>
        {{
          searchFilter === true
            ? $t("hide_search_filter")
            : $t("show_search_filter")
        }}
      </button>
    </div>

    <div
      class="col-span-12 lg:col-span-3"
      :class="searchFilter ? 'block' : 'hidden'"
    >
      <stickyBox>
        <div class="card p-4">
          <h5>{{ $t("pages.dictionary.search_filter") }}</h5>
          <form @submit.prevent="debounceReset" ref="searchFormRef">
            <div class="custom-grid">
              <div class="col-span-12">
                <multipleSelect
                  :className="'form-group-border select active label-active'"
                  :icon="'pi pi-book'"
                  :label="$t('pages.courses.course')"
                  :items="attributes.courses"
                  :optionName="'courses[]'"
                  :optionValue="'course_id'"
                  :optionLabel="'course_name'"
                  :onChange="debounceWords"
                />
              </div>

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-align-left"></i>
                  <input
                    type="text"
                    name="word"
                    placeholder=" "
                    @input="debounceWords"
                  />
                  <label>{{ $t("pages.dictionary.word") }}</label>
                </div>
              </div>

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="bi bi-braces"></i>
                  <input
                    type="text"
                    name="transcription"
                    placeholder=" "
                    @input="debounceWords"
                  />
                  <label>{{ $t("pages.dictionary.transcription") }}</label>
                </div>
              </div>

              <div class="col-span-12">
                <div class="btn-wrap">
                  <button type="submit" class="btn btn-sm btn-outline-primary">
                    <i class="pi pi-undo"></i>
                    {{ $t("reset_search_filter") }}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </stickyBox>
    </div>

    <div class="col-span-12" :class="searchFilter && 'lg:col-span-9'">
      <template v-if="words.data?.length > 0">
        <div class="table table-striped table-sm selectable">
          <loader v-if="pending" :className="'overlay'" />
          <table ref="tableRef">
            <thead>
              <tr>
                <th>{{ $t("file.files") }}</th>
                <sortTableHead
                  v-for="(head, index) in wordTableHeads"
                  :key="index"
                  :title="head.title"
                  :keyName="head.keyName"
                  :sortKey="sortKey"
                  :sortDirection="sortDirection"
                  :sortType="head.sortType"
                  :sortHandler="debounceWords"
                  @update:sortKey="sortKey = $event"
                  @update:sortDirection="sortDirection = $event"
                />
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="word in words.data"
                :key="word.word_id"
                @click="addToWordsGroup(word)"
              >
                <td>
                  <div class="flex items-center gap-x-4">
                    <audioButton
                      v-if="word.audio_file"
                      :src="
                        config.public.apiBase + '/media/get/' + word.audio_file
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
                <td>
                  {{ word.word }}
                  <i
                    v-if="selectedWords.some((w) => w.word_id === word.word_id)"
                    class="text-success"
                    >({{ $t("added") }})</i
                  >
                </td>
                <td>[{{ word.transcription }}]</td>
                <td>{{ word.course_name }}</td>
                <td>{{ new Date(word.created_at).toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="btn-wrap mt-4 light">
          <pagination
            :items="words"
            :setItems="getWords"
            :bgClassName="'bg_active'"
            :defaultPerPage="5"
            :onSelect="(count) => (perPage = count)"
          />
        </div>
      </template>

      <alert v-else :className="'light'">
        <loader v-if="pending" :className="'overlay'" />
        <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
      </alert>
    </div>

    <div class="col-span-12">
      <p
        :class="{
          'text-danger':
            errors.words_count &&
            (selectedWords.length < props.minimumWordsCount ||
              selectedWords.length < props.maximumWordsCount ||
              selectedWords.length !== wordsCount),
        }"
      >
        <span
          v-if="
            errors.words_count &&
            (selectedWords.length < props.minimumWordsCount ||
              selectedWords.length < props.maximumWordsCount ||
              selectedWords.length !== wordsCount)
          "
          >{{ errors.words_count[0] }}</span
        >
        <span v-else>
          {{ $t("pages.dictionary.added_words_count") }}:
          <b>{{ selectedWords.length }}</b></span
        >
      </p>

      <div v-if="selectedWords.length > 0" class="btn-wrap">
        <tag
          v-for="(word, index) in selectedWords"
          :key="index"
          :itemId="word.word_id"
          :itemLabel="word.word"
          :onDelete="(word_id) => deleteFromGroup(word_id)"
          :closable="true"
          v-motion="{
            initial: {
              y: -100,
              opacity: 0,
            },
            enter: {
              y: 0,
              opacity: 1,
            },
          }"
        />
      </div>
    </div>

    <div class="col-span-12" v-if="props.selectWordsForSection">
      <div class="btn-wrap">
        <button
          type="button"
          class="btn btn-inactive"
          @click="closeAddSection()"
        >
          <i class="pi pi-arrow-left"></i>
          {{ $t("back") }}
        </button>
        <button
          type="button"
          v-if="selectedWords.length > 0"
          @click="addWordsToSection()"
          class="btn btn-outline-primary"
        >
          <i class="pi pi-angle-double-right"></i>
          {{ $t("pages.dictionary.add_these_words_to_the_section") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from "vue";
import { useRouter } from "nuxt/app";
import audioButton from "../../../ui/audioButton.vue";
import loader from "../../../ui/loader.vue";
import alert from "../../../ui/alert.vue";
import stickyBox from "../../../ui/stickyBox.vue";
import pagination from "../../../ui/pagination.vue";
import { debounceHandler } from "../../../../utils/debounceHandler";
import multipleSelect from "../../../ui/multipleSelect.vue";
import sortTableHead from "../../../ui/sortTableHead.vue";
import tag from "../../../ui/tag.vue";

const emit = defineEmits();

// null для того чтобы игнорировать если родитель не передал provide
const closeAddSection = inject("closeAddSection", null);
const addWordsToSection = inject("addWordsToSection", null);

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();
const { t } = useI18n();
const pending = ref(true);
const tableRef = ref(null);
const searchFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(5);
const words = ref([]);
const attributes = ref([]);

const sortKey = ref("dictionary.created_at"); // Ключ сортировки
const sortDirection = ref("asc"); // Направление сортировки: asc или desc

const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },

  selectWordsForSection: {
    default: false,
    type: Boolean,
    required: false,
  },

  selectedWords: {
    type: Object,
    required: true,
  },

  selectOnlyWordsWithImage: {
    default: false,
    type: Boolean,
    required: false,
  },

  wordsCount: {
    type: Number,
    required: false,
  },

  minimumWordsCount: {
    default: 1,
    type: Number,
    required: false,
  },

  maximumWordsCount: {
    type: Number,
    required: false,
  },
});

const { errors, selectedWords } = toRefs(props);

const wordTableHeads = [
  {
    title: t("pages.dictionary.word"),
    keyName: "dictionary.word",
    sortType: "alpha",
  },
  {
    title: t("pages.dictionary.transcription"),
    keyName: "dictionary.transcription",
    sortType: "alpha",
  },
  {
    title: t("pages.courses.course"),
    keyName: "courses_lang.course_name",
    sortType: "alpha",
  },
  {
    title: t("created_at"),
    keyName: "dictionary.created_at",
    sortType: "numeric",
  },
];

const getWords = async (url) => {
  pending.value = true;

  const formData = new FormData(searchFormRef.value);
  formData.append("per_page", perPage.value);
  formData.append("sort_key", sortKey.value); // Добавляем ключ сортировки
  formData.append("sort_direction", sortDirection.value); // Добавляем направление сортировки

  if (props.selectOnlyWordsWithImage === true) {
    formData.append("image_file", true);
  }

  if (!url) {
    url = "dictionary/get";
  }

  await $axiosPlugin
    .post(url, formData)
    .then((response) => {
      words.value = response.data;
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

const getDictionaryAttributes = async () => {
  pending.value = true;
  await $axiosPlugin
    .get("dictionary/get_dictionary_attributes")
    .then((response) => {
      attributes.value = response.data;
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

const addToWordsGroup = (word) => {
  if (!selectedWords.value.some((w) => w.word_id === word.word_id)) {
    if (!props.selectWordsForSection) {
      let newArr = JSON.parse(JSON.stringify(selectedWords.value));
      newArr.push(word);
      selectedWords.value = newArr;
    } else {
      emit("update:selectedWords", [...props.selectedWords, word]);
    }
  } else {
    if (!props.selectWordsForSection) {
      selectedWords.value = selectedWords.value.filter(
        (w) => w.word_id !== word.word_id
      );
    } else {
      emit(
        "update:selectedWords",
        props.selectedWords.filter((w) => w.word_id !== word.word_id)
      );
    }
  }
};

const deleteFromGroup = (word_id) => {
  if (!props.selectWordsForSection) {
    const wordToRemove = selectedWords.value.find((w) => w.word_id === word_id);

    if (wordToRemove) {
      selectedWords.value = selectedWords.value.filter(
        (w) => w.word_id !== word_id
      );
    }
  } else {
    const wordToRemove = props.selectedWords.find((w) => w.word_id === word_id);

    if (wordToRemove) {
      emit(
        "update:selectedWords",
        props.selectedWords.filter((w) => w.word_id !== word_id)
      );
    }
  }
};

const showHideWordSearchFilter = () => {
  if (searchFilter.value === true) {
    searchFilter.value = false;
    resetWordSearchFilter();
  } else {
    searchFilter.value = true;
  }
};

const resetWordSearchFilter = () => {
  searchFormRef.value.reset();
  getWords();
};

const debounceWords = debounceHandler(() => getWords(), 1000);
const debounceReset = debounceHandler(() => resetWordSearchFilter(), 500);

onMounted(() => {
  getDictionaryAttributes();
  getWords();
});
</script>
