<template>
  <!-- Выбор файла из медиатеки: поиск по названию, сетка с превью,
       подгрузка по PER_PAGE. На бэкенд уходит file_id под тем же именем
       поля (props.name), что и раньше у <select> -->
  <div class="library-picker" :class="{ 'has-error': props.error }">
    <input type="hidden" :name="props.name" :value="selectedId || ''" />

    <div class="participants-search !w-full">
      <i class="pi pi-search" aria-hidden="true"></i>
      <input
        v-model="query"
        type="search"
        :placeholder="$t('file.library_search')"
        :aria-label="$t('file.library_search')"
        autocomplete="off"
        @input="debounceSearch"
        @keydown.enter.prevent
      />
      <i v-if="loading && files.length" class="pi pi-spin pi-spinner" aria-hidden="true"></i>
    </div>

    <p v-if="props.error && !selectedId" class="mb-0 text-sm text-danger">
      {{ $t("file.choose_a_file") }}
    </p>

    <!-- Первая загрузка -->
    <div v-if="loading && !files.length" class="library-grid" aria-busy="true">
      <span class="sr-only">{{ $t("loading") }}</span>
      <div v-for="n in 8" :key="n" class="library-item" aria-hidden="true">
        <div class="skeleton aspect-[4/3] w-full !rounded-lg"></div>
        <div class="skeleton h-3 w-3/4 mt-1.5"></div>
      </div>
    </div>

    <p v-else-if="loadFailed" class="mb-0 text-sm text-danger flex flex-wrap items-center gap-2">
      <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
      {{ $t("file.library_failed") }}
      <button type="button" class="auto-translate-btn" @click="loadFiles(true)">
        {{ $t("file.try_again") }}
      </button>
    </p>

    <p v-else-if="!files.length" class="mb-0 py-4 text-sm text-center text-inactive">
      {{ query ? $t("file.library_not_found") : $t("file.library_empty") }}
    </p>

    <div v-else class="library-grid" role="listbox" :aria-label="$t('file.choose_a_file')">
      <button
        v-for="file in files"
        :key="file.file_id"
        type="button"
        role="option"
        class="library-item"
        :class="{ selected: selectedId === file.file_id }"
        :aria-selected="selectedId === file.file_id"
        :title="file.file_name"
        @click="selectFile(file)"
      >
        <span class="library-thumb" :class="'kind-' + file.material_type_slug">
          <img
            v-if="file.material_type_slug === 'image'"
            :src="mediaUrl(file.target)"
            alt=""
            loading="lazy"
          />
          <i v-else :class="file.icon || 'pi pi-file'" aria-hidden="true"></i>
          <span v-if="selectedId === file.file_id" class="library-check" aria-hidden="true">
            <i class="pi pi-check"></i>
          </span>
        </span>
        <span class="library-name">{{ file.file_name }}</span>
      </button>
    </div>

    <div v-if="hasMore && files.length" class="flex justify-center">
      <button type="button" class="btn btn-sm btn-light" :disabled="loading" @click="loadMore">
        <i v-if="loading" class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        {{ $t("file.library_load_more") }}
      </button>
    </div>

    <!-- Превью выбранного (аудио можно прослушать, видео — посмотреть) -->
    <div v-if="selectedFile" class="flex flex-col gap-2">
      <p class="mb-0 text-xs text-inactive">
        {{ $t("file.selected_file") }}: <b class="text-active">{{ selectedFile.file_name }}</b>
      </p>
      <previewFileInput
        :key="selectedFile.file_id"
        :fileType="selectedFile.material_type_slug"
        :previewUrl="mediaUrl(selectedFile.target)"
      />
    </div>
  </div>
</template>
<script setup>
import previewFileInput from "./previewFileInput.vue";
import { debounceHandler } from "../../utils/debounceHandler";

const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  error: {
    type: [Object, Array, String],
    required: false,
  },
});

// Раньше грузились все файлы типа разом (per_page = 10 000 000)
const PER_PAGE = 24;

const files = ref([]);
const page = ref(1);
const lastPage = ref(1);
const loading = ref(false);
const loadFailed = ref(false);
const query = ref("");
const selectedFile = ref(null);
const selectedId = computed(() => selectedFile.value?.file_id ?? null);
const hasMore = computed(() => page.value < lastPage.value);

const mediaUrl = (target) => config.public.apiBase + "/media/get/" + target;

// Запросы могут прийти не по порядку (быстрый ввод) — берём только последний
let requestId = 0;

const loadFiles = async (reset = true) => {
  const id = ++requestId;
  loading.value = true;
  loadFailed.value = false;
  if (reset) page.value = 1;

  const formData = new FormData();
  formData.append("material_type_slug", props.fileType);
  formData.append("file_name", query.value.trim());
  formData.append("per_page", PER_PAGE);
  formData.append("sort_key", "files.created_at"); // новые — первыми
  formData.append("sort_direction", "desc");

  try {
    const response = await $axiosPlugin.post("media/get?page=" + page.value, formData);
    if (id !== requestId) return;
    const data = response.data || {};
    files.value = reset ? data.data || [] : [...files.value, ...(data.data || [])];
    lastPage.value = data.last_page || 1;
  } catch (e) {
    if (id !== requestId) return;
    loadFailed.value = true;
    if (reset) files.value = [];
  } finally {
    if (id === requestId) loading.value = false;
  }
};

const loadMore = () => {
  if (loading.value || !hasMore.value) return;
  page.value++;
  loadFiles(false);
};

const debounceSearch = debounceHandler(() => loadFiles(true), 400);

const selectFile = (file) => {
  selectedFile.value = selectedId.value === file.file_id ? null : file;
};

onMounted(() => {
  loadFiles(true);
});
</script>
