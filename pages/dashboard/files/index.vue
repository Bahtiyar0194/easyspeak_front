<template>
  <div class="col-span-12">
    <div class="custom-grid">
      <!-- Панель: фильтр, счётчик, место на диске, загрузка -->
      <div class="col-span-12 flex flex-col gap-3">
        <div class="list-toolbar">
          <button
            type="button"
            class="btn"
            :class="searchFilter ? 'btn-outline-primary' : 'btn-light'"
            :aria-pressed="searchFilter"
            :title="searchFilter ? $t('hide_search_filter') : $t('show_search_filter')"
            @click="showHideFileSearchFilter"
          >
            <i class="pi pi-filter" aria-hidden="true"></i>
            {{ $t("filter") }}
          </button>
          <span v-if="files.total" class="text-sm text-inactive">
            {{ $t("found") }}: <b class="text-active">{{ files.total }}</b>
          </span>

          <!-- Место на диске — всегда на виду, краснеет, когда его мало -->
          <div
            v-if="disk"
            class="disk-meter"
            :class="{ low: diskLow }"
            :title="$t('file.disk_info')"
          >
            <i class="pi pi-database" aria-hidden="true"></i>
            <div class="flex flex-col gap-1 min-w-0">
              <span class="text-xs whitespace-nowrap">
                {{ $t("file.used_of", { used: formatNumber(disk.used_space), total: formatNumber(disk.total_space) }) }}
                <b v-if="diskLow" class="text-danger"> · {{ $t("file.low_space") }}</b>
              </span>
              <div class="disk-meter-bar" aria-hidden="true">
                <div :style="{ width: diskPercent + '%' }"></div>
              </div>
            </div>
          </div>

          <client-only>
            <roleProvider :roles="[1]">
              <button
                type="button"
                class="btn btn-primary ml-auto"
                @click="addModalIsVisible = true"
              >
                <i class="pi pi-upload" aria-hidden="true"></i>
                {{ $t("file.upload_file") }}
              </button>
            </roleProvider>
          </client-only>
        </div>

        <!-- Быстрый фильтр по типу -->
        <div v-if="fileTypes.length" class="type-chips" role="group" :aria-label="$t('file.type')">
          <button
            type="button"
            class="type-chip"
            :class="{ active: quickType === null }"
            :aria-pressed="quickType === null"
            @click="setQuickType(null)"
          >
            {{ $t("file.all_types") }}
          </button>
          <button
            v-for="fileType in fileTypes"
            :key="fileType.material_type_id"
            type="button"
            class="type-chip"
            :class="['kind-' + fileType.material_type_slug, { active: quickType === fileType.material_type_id }]"
            :aria-pressed="quickType === fileType.material_type_id"
            @click="setQuickType(fileType.material_type_id)"
          >
            <i :class="fileType.icon" aria-hidden="true"></i>
            {{ fileType.material_type_name }}
          </button>
        </div>
      </div>

      <div
        class="col-span-12 lg:col-span-3"
        :class="searchFilter ? 'block' : 'hidden'"
      >
        <stickyBox>
          <div class="card p-4">
            <h5>{{ $t("file.search_filter") }}</h5>
            <form @submit.prevent="debounceReset" ref="searchFormRef">
              <div class="custom-grid">
                <div class="col-span-12">
                  <div class="form-group-border active">
                    <i class="pi pi-file"></i>
                    <input
                      type="text"
                      name="file_name"
                      placeholder=" "
                      autocomplete="off"
                      @input="debounceFiles"
                    />
                    <label>{{ $t("file.name") }}</label>
                  </div>
                </div>

                <div class="col-span-12">
                  <multipleSelect
                    :className="'form-group-border select active label-active'"
                    :icon="'pi pi-file'"
                    :label="$t('file.type')"
                    :items="fileTypes"
                    :optionName="'material_types[]'"
                    :optionValue="'material_type_id'"
                    :optionLabel="'material_type_name'"
                    :onChange="debounceFiles"
                  />
                </div>

                <div class="col-span-12">
                  <div class="form-group-border active">
                    <i class="pi pi-calendar"></i>
                    <input
                      type="date"
                      name="created_at_from"
                      @input="debounceFiles"
                      placeholder=" "
                    />
                    <label>{{ $t("created_at_from") }}</label>
                  </div>
                </div>

                <div class="col-span-12">
                  <div class="form-group-border active">
                    <i class="pi pi-calendar"></i>
                    <input
                      type="date"
                      name="created_at_to"
                      @input="debounceFiles"
                      placeholder=" "
                    />
                    <label>{{ $t("created_at_to") }}</label>
                  </div>
                </div>

                <div class="col-span-12">
                  <button type="submit" class="btn btn-light full">
                    <i class="pi pi-filter-slash" aria-hidden="true"></i>
                    {{ $t("reset_search_filter") }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </stickyBox>
      </div>

      <div
        ref="listTopRef"
        class="col-span-12 relative scroll-mt-24"
        :class="searchFilter && 'lg:col-span-9'"
      >
        <!-- Скелетон: первая загрузка или переход на другую страницу -->
        <listSkeleton
          v-if="pendingFiles && (paging || !files.data?.length)"
          :columns="filesTableHeads.length"
          :avatar="false"
          :statusColumn="false"
          :rows="paging ? skeletonRows : 8"
        />

        <!-- Фильтр / сортировка / загрузка файла: список на месте, перелив -->
        <div
          v-else-if="files.data?.length"
          :class="{ 'list-refreshing': pendingFiles }"
          :aria-busy="pendingFiles || undefined"
        >
          <span v-if="pendingFiles" class="sr-only">{{ $t("loading") }}</span>

          <!-- Компьютер: таблица -->
          <div class="table table-striped table-sm selectable max-md:!hidden">
            <table ref="tableRef">
              <thead>
                <tr>
                  <sortTableHead
                    v-for="(head, index) in filesTableHeads"
                    :key="index"
                    :title="head.title"
                    :keyName="head.keyName"
                    :sortKey="sortKey"
                    :sortDirection="sortDirection"
                    :sortType="head.sortType"
                    :sortHandler="debounceFiles"
                    @update:sortKey="sortKey = $event"
                    @update:sortDirection="sortDirection = $event"
                  />
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="file in files.data"
                  :key="file.file_id"
                  @click="getFile(file.file_id)"
                >
                  <td>
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="file-thumb" :class="'kind-' + file.material_type_slug">
                        <img
                          v-if="file.material_type_slug === 'image'"
                          v-skeleton="'1/1'"
                          :src="mediaUrl(file.target)"
                          alt=""
                          loading="lazy"
                        />
                        <i v-else :class="file.icon" aria-hidden="true"></i>
                      </span>
                      <span class="font-medium break-words min-w-0">{{ file.file_name }}</span>
                      <span v-if="file.processing === 1" class="status-pill text-amber-600 dark:text-amber-400 shrink-0">
                        <i class="pi pi-spin pi-spinner mr-1 text-[10px]" aria-hidden="true"></i>
                        {{ $t("file.processing") }}
                      </span>
                    </div>
                  </td>
                  <td class="whitespace-nowrap">
                    {{ file.material_type_name }}
                    <span class="text-inactive uppercase text-xs">.{{ getFileExtension(file.target) }}</span>
                  </td>
                  <td class="whitespace-nowrap tabular-nums">{{ formatSize(file.size) }}</td>
                  <td class="whitespace-nowrap">{{ formatDate(file.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Телефон: карточки -->
          <ul class="entity-list md:hidden">
            <li v-for="file in files.data" :key="file.file_id">
              <button type="button" class="entity-card" @click="getFile(file.file_id)">
                <span class="file-thumb !w-11 !h-11" :class="'kind-' + file.material_type_slug">
                  <img
                    v-if="file.material_type_slug === 'image'"
                    v-skeleton="'1/1'"
                    :src="mediaUrl(file.target)"
                    alt=""
                    loading="lazy"
                  />
                  <i v-else :class="file.icon" aria-hidden="true"></i>
                </span>
                <span class="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                  <span class="font-semibold leading-snug line-clamp-2">{{ file.file_name }}</span>
                  <span class="text-xs text-inactive">
                    {{ file.material_type_name }} · {{ formatSize(file.size) }} · {{ formatDate(file.created_at) }}
                  </span>
                  <span v-if="file.processing === 1" class="status-pill text-amber-600 dark:text-amber-400 w-fit mt-1">
                    {{ $t("file.processing") }}
                  </span>
                </span>
                <i class="pi pi-chevron-right text-inactive text-xs" aria-hidden="true"></i>
              </button>
            </li>
          </ul>
        </div>

        <!-- Ничего не нашлось по фильтру -->
        <emptyState
          v-else-if="filtered"
          :text="$t('nothing_was_found_for_your_query')"
          icon="bi bi-search"
        >
          <button type="button" class="btn btn-light" @click="resetAllFilters">
            <i class="pi pi-filter-slash" aria-hidden="true"></i>
            {{ $t("reset_search_filter") }}
          </button>
        </emptyState>

        <!-- Файлов ещё нет -->
        <emptyState
          v-else
          :text="$t('file.no_files')"
          :hint="$t('file.no_files_hint')"
          icon="bi bi-folder2-open"
        >
          <roleProvider :roles="[1]">
            <button type="button" class="btn btn-primary" @click="addModalIsVisible = true">
              <i class="pi pi-upload" aria-hidden="true"></i>
              {{ $t("file.upload_file") }}
            </button>
          </roleProvider>
        </emptyState>

        <!-- Вне блока списка: при переходе по страницам остаётся на месте -->
        <div
          v-if="files.data?.length"
          class="btn-wrap mt-4"
          :class="{ 'pointer-events-none opacity-60': pendingFiles }"
        >
          <pagination
            :items="files"
            :setItems="getFiles"
            :onSelect="(count) => (perPage = count)"
          />
        </div>
      </div>
    </div>
  </div>

  <modal
    :show="addModalIsVisible"
    :onClose="() => closeAddModal()"
    :className="'modal-lg'"
    :showLoader="pendingAdd"
    :progress="uploadProgress"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("file.upload_file") }}</h4>
    </template>
    <template v-slot:body_content>
      <form class="mt-2" @submit.prevent="addFileSubmit" ref="addFormRef">
        <div class="custom-grid">
          <div class="col-span-12">
            <div class="form-group-border select active">
              <i class="pi pi-file"></i>
              <select name="material_type_id" @change="selectFileType($event)">
                <option selected disabled value="">
                  {{ $t("file.choose_a_file_type") }}
                </option>
                <option
                  v-for="(fileType, fileTypeIndex) in fileTypes"
                  :key="fileTypeIndex"
                  :value="fileType.material_type_id"
                >
                  {{ fileType.material_type_name }}
                </option>
              </select>
              <label :class="{ 'label-error': errors.material_type_id }">
                {{
                  errors.material_type_id
                    ? $t("file.specify_the_file_type")
                    : $t("file.type")
                }}
              </label>
            </div>
          </div>
          <div class="col-span-12">
            <div class="form-group-border active">
              <i class="pi pi-file"></i>
              <input
                autoComplete="new-file-name"
                name="file_name"
                type="text"
                placeholder=" "
              />
              <label :class="{ 'label-error': errors.file_name }">
                {{ errors.file_name ? errors.file_name[0] : $t("file.name") }}
              </label>
            </div>
          </div>

          <div v-if="currentFileType" class="col-span-12">
            <fileUploadButton
              :id="'upload_file'"
              :name="'upload_file'"
              :accept="currentFileType.material_type_slug + '/*'"
              :error="errors.upload_file"
              :icon="currentFileType.icon"
              :label="
                $t('file.' + currentFileType.material_type_slug + '.select')
              "
            />
          </div>

          <!-- <div
            v-if="
              currentFileType && currentFileType.material_type_slug === 'video'
            "
            class="col-span-12"
          >
            <div class="card p-4">
              <div class="custom-grid">
                <div class="col-span-12">
                  <p class="mb-0">
                    <b>{{ $t("file.video.markers.title") }}</b>
                  </p>
                </div>

                <div v-if="markers.length > 0" class="col-span-12">
                  <div class="custom-grid">
                    <div
                      v-for="(marker, markerIndex) in markers"
                      :key="markerIndex"
                      class="col-span-12"
                    >
                      <div class="bg-corp text-white rounded-xl p-3">
                        <div
                          class="flex flex-wrap items-center justify-between gap-4"
                        >
                          <span
                            >{{ formatSecondsToTime(marker.second) }} -
                            <b>{{ marker.name }}</b></span
                          >

                          <button
                            type="button"
                            @click="removeMarker(markerIndex)"
                          >
                            <i class="pi pi-times"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-span-7">
                  <div class="form-group-border active">
                    <i class="pi pi-thumbtack"></i>
                    <input type="text" v-model="markerName" placeholder=" " />
                    <label
                      :class="markerErrorName === true ? 'label-error' : ''"
                      >{{
                        $t(
                          markerErrorName === true
                            ? "file.video.markers.name_error"
                            : "file.video.markers.name"
                        )
                      }}</label
                    >
                  </div>
                </div>
                <div class="col-span-5">
                  <div class="form-group-border active">
                    <i class="pi pi-clock"></i>
                    <input
                      type="number"
                      v-model="markerSecond"
                      placeholder=" "
                    />
                    <label
                      :class="markerErrorSecond === true ? 'label-error' : ''"
                      >{{
                        $t(
                          markerErrorSecond === true
                            ? "file.video.markers.second_error"
                            : "file.video.markers.second"
                        )
                      }}</label
                    >
                  </div>
                </div>
                <div class="col-span-12">
                  <div class="btn-wrap justify-end">
                    <button
                      class="btn btn-sm btn-light"
                      type="button"
                      @click="addMarker"
                    >
                      <i class="pi pi-plus"></i>
                      {{ $t("file.video.markers.add") }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div> -->
        </div>

        <button class="btn btn-primary mt-4" type="submit">
          <i class="pi pi-check"></i>
          {{ $t("file.upload") }}
        </button>
      </form>
    </template>
  </modal>

  <modal
    :show="replaceModalIsVisible"
    :onClose="() => closeReplaceModal()"
    :className="'modal-lg'"
    :showLoader="pendingReplace"
    :progress="uploadProgress"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("file.replace.title") }}</h4>
    </template>
    <template v-if="currentFile" v-slot:body_content>
      <form
        class="mt-2"
        @submit.prevent="replaceFileSubmit(currentFile.file_id)"
        ref="replaceFormRef"
      >
        <div class="custom-grid">
          <div class="col-span-12">
            <fileUploadButton
              :id="'upload_file'"
              :name="'upload_file'"
              :accept="currentFile.material_type_slug + '/*'"
              :error="errors.upload_file"
              :icon="currentFile.icon"
              :label="$t('file.' + currentFile.material_type_slug + '.select')"
            />
          </div>
        </div>

        <button class="btn btn-primary mt-4" type="submit">
          <i class="pi pi-check"></i>
          {{ $t("file.upload") }}
        </button>
      </form>
    </template>
  </modal>

  <modal
    :show="fileModalIsVisible"
    :onClose="() => closeFileModal()"
    :className="'modal-2xl'"
    :showLoader="pendingFile"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <h4 class="break-words">{{ currentFile?.file_name }}</h4>
    </template>
    <template v-if="currentFile" v-slot:body_content>
      <div class="flex flex-col gap-4">
        <!-- Видео ещё преобразуется — превью нет, окно обновится само -->
        <div v-if="currentFile.processing === 1" class="db-notice">
          <div class="db-notice-icon" aria-hidden="true">
            <i class="pi pi-spin pi-spinner"></i>
          </div>
          <p class="mb-0 flex-1 text-sm">
            <b>{{ $t("file.processing") }}.</b>
            {{ $t("file.processing_hint") }}
          </p>
        </div>
        <previewFileInput
          v-else
          :fileType="currentFile.material_type_slug"
          :previewUrl="mediaUrl(currentFile.target)"
        />

        <dl class="school-dl">
          <dt>{{ $t("file.type") }}</dt>
          <dd>{{ currentFile.material_type_name }}</dd>
          <dt>{{ $t("file.extension") }}</dt>
          <dd class="uppercase">{{ getFileExtension(currentFile.target) || "—" }}</dd>
          <dt>{{ $t("file.size") }}</dt>
          <dd class="tabular-nums">{{ formatSize(currentFile.size) }}</dd>
          <dt>{{ $t("created_at") }}</dt>
          <dd>{{ formatDate(currentFile.created_at) }}</dd>
        </dl>

        <div class="btn-wrap">
          <button
            v-if="currentFile.material_type_slug !== 'video'"
            type="button"
            class="btn btn-light"
            :disabled="downloading"
            @click="downloadFile(mediaUrl(currentFile.target), currentFile.file_name, currentFile.target)"
          >
            <i class="pi" :class="downloading ? 'pi-spin pi-spinner' : 'pi-download'" aria-hidden="true"></i>
            {{ $t("download") }}
          </button>

          <button type="button" class="btn btn-light" @click="copyFileLink(currentFile)">
            <i
              class="pi"
              :class="linkCopied ? 'pi-check text-success' : 'pi-link'"
              aria-hidden="true"
            ></i>
            {{ linkCopied ? $t("file.link_copied") : $t("file.copy_link") }}
          </button>

          <roleProvider :roles="[1]">
            <button
              type="button"
              class="btn btn-light"
              @click="replaceFile(currentFile.file_id)"
            >
              <i class="pi pi-replay" aria-hidden="true"></i>
              {{ $t("file.replace.replace") }}
            </button>
          </roleProvider>

          <roleProvider :roles="[1]">
            <button
              v-if="
                getFileExtension(currentFile.target) === 'mp4' &&
                currentFile.processing === 0
              "
              type="button"
              class="btn btn-light"
              @click="convertFileSubmit(currentFile.file_id)"
            >
              <i class="pi pi-cog" aria-hidden="true"></i>
              {{ $t("file.convert") }}
            </button>
          </roleProvider>
        </div>

        <p
          v-if="currentFile.material_type_slug === 'video'"
          class="mb-0 text-xs text-inactive"
        >
          <i class="pi pi-info-circle" aria-hidden="true"></i>
          {{ $t("file.video_no_download") }}
        </p>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { formatSecondsToTime } from "../../../utils/formatSecondsToTime";
import modal from "../../../components/ui/modal.vue";
import roleProvider from "../../../components/ui/roleProvider.vue";
import listSkeleton from "../../../components/ui/listSkeleton.vue";
import { useNotify } from "~/composables/useNotify";
import { debounceHandler } from "../../../utils/debounceHandler";
import { useRouter } from "nuxt/app";
import stickyBox from "../../../components/ui/stickyBox.vue";
import pagination from "../../../components/ui/pagination.vue";
import multipleSelect from "../../../components/ui/multipleSelect.vue";
import sortTableHead from "../../../components/ui/sortTableHead.vue";
import emptyState from "~/components/ui/emptyState.vue";
import fileUploadButton from "../../../components/ui/fileUploadButton.vue";
import previewFileInput from "../../../components/ui/previewFileInput.vue";

const { t, localeProperties } = useI18n();
const config = useRuntimeConfig();
const router = useRouter();
const notify = useNotify();
const errors = ref([]);

const { $axiosPlugin } = useNuxtApp();
const pendingAdd = ref(false);
const pendingReplace = ref(false);
const pendingFile = ref(false);
// true с самого начала: до первого ответа — скелетон, а не «файлов нет»
const pendingFiles = ref(true);
const tableRef = ref(null);
const searchFormRef = ref(null);
const addFormRef = ref(null);
const replaceFormRef = ref(null);
const searchFilter = ref(false);

// ===== Отображение =====
const mediaUrl = (target) => config.public.apiBase + "/media/get/" + target;

const locale = computed(() => localeProperties.value?.iso || localeProperties.value?.code || undefined);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(locale.value, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const formatNumber = (value) =>
  Number(value || 0).toLocaleString(locale.value, { maximumFractionDigits: 1 });

// Размер приходит в МБ — показываем в КБ / МБ / ГБ
const formatSize = (mb) => {
  const value = Number(mb);
  if (!Number.isFinite(value)) return "—";
  if (value < 1) return `${formatNumber(Math.max(value * 1024, 0.1))} ${t("file.kilobyte")}`;
  if (value >= 1024) return `${formatNumber(value / 1024)} ${t("file.gigabyte")}`;
  return `${formatNumber(value)} ${t("file.megabyte")}`;
};

// Место на диске: полоса всегда на виду, краснеет при < 10% свободного
const diskPercent = computed(() =>
  disk.value?.total_space
    ? Math.min(100, (disk.value.used_space / disk.value.total_space) * 100)
    : 0,
);
const diskLow = computed(() => Boolean(disk.value) && diskPercent.value >= 90);

// ===== Список: быстрый фильтр, скелетон при пагинации =====
const quickType = ref(null); // material_type_id или null — «Все»
const filtered = ref(false);
const paging = ref(false);
const skeletonRows = ref(8);
const listTopRef = ref(null);

const setQuickType = (typeId) => {
  if (quickType.value === typeId) return;
  quickType.value = typeId;
  getFiles();
};

const resetAllFilters = () => {
  quickType.value = null;
  resetFileSearchFilter();
};

// ===== Окно файла: ссылка, скачивание, статус обработки видео =====
const downloading = ref(false);
const linkCopied = ref(false);
let linkCopiedTimer = null;

const copyFileLink = async (file) => {
  try {
    await navigator.clipboard.writeText(mediaUrl(file.target));
    linkCopied.value = true;
    notify("success", t("file.link_copied"));
    clearTimeout(linkCopiedTimer);
    linkCopiedTimer = setTimeout(() => (linkCopied.value = false), 2500);
  } catch (e) {
    notify("warning", mediaUrl(file.target), { timeout: 15000 });
  }
};

// Видео преобразуется — тихо проверяем статус, пока окно открыто
const PROCESSING_POLL_MS = 5000;
let processingTimer = null;

const stopProcessingPoll = () => {
  clearTimeout(processingTimer);
  processingTimer = null;
};

const scheduleProcessingPoll = () => {
  stopProcessingPoll();
  if (!fileModalIsVisible.value || currentFile.value?.processing !== 1) return;
  const fileId = currentFile.value.file_id;
  processingTimer = setTimeout(async () => {
    try {
      const response = await $axiosPlugin.get("media/get/file_info/" + fileId);
      if (!fileModalIsVisible.value || currentFile.value?.file_id !== fileId) return;
      const wasProcessing = currentFile.value.processing === 1;
      currentFile.value = response.data;
      // Готово — обновим и список (там тоже была отметка «Обрабатывается»)
      if (wasProcessing && response.data.processing !== 1) getFiles();
    } catch (e) {
      /* фоновая проверка: при ошибке попробуем позже */
    }
    scheduleProcessingPoll();
  }, PROCESSING_POLL_MS);
};

const markers = ref([]);
const markerName = ref("");
const markerErrorName = ref(false);
const markerSecond = ref("");
const markerErrorSecond = ref(false);

const uploadProgress = ref(0);

const disk = ref(null);
const fileTypes = ref([]);
const currentFileType = ref(null);
const currentFile = ref(null);
const files = ref([]);

const perPage = ref(10);
const sortKey = ref("files.created_at"); // Ключ сортировки
const sortDirection = ref("desc"); // Направление сортировки: asc или desc

const addModalIsVisible = ref(false);
const replaceModalIsVisible = ref(false);
const fileModalIsVisible = ref(false);

const filesTableHeads = [
  {
    title: t("file.name"),
    keyName: "files.file_name",
    sortType: "alpha",
  },
  {
    title: t("file.type"),
    keyName: "types_of_materials_lang.material_type_name",
    sortType: "alpha",
  },
  {
    title: t("file.size"),
    keyName: "files.size",
    sortType: "alpha",
  },
  {
    title: t("created_at"),
    keyName: "files.created_at",
    sortType: "alpha",
  },
];

useHead(() => ({
  title: t("pages.files.title"),
  meta: [{ name: "description", content: "Files" }],
}));

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

// Типы файлов и место на диске (без полноэкранного лоадера: список
// показывает свой скелетон)
const getAttributes = async () => {
  await $axiosPlugin
    .get("media/get_attributes")
    .then((response) => {
      fileTypes.value = response.data.all_file_types;
      disk.value = response.data.disk;
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

const getFiles = async (url) => {
  pendingFiles.value = true;
  // Переход по страницам (пагинация передаёт url) — скелетон с тем же
  // числом строк и подъём к началу списка
  paging.value = Boolean(url);
  if (paging.value) {
    skeletonRows.value = files.value.data?.length || 8;
    const top = listTopRef.value?.getBoundingClientRect().top;
    if (top !== undefined && top < 0) {
      listTopRef.value.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const formData = new FormData(searchFormRef.value || undefined);
  // Быстрый фильтр по типу (плашки над списком)
  if (quickType.value !== null) formData.append("material_types[]", quickType.value);
  filtered.value = [...formData.values()].some((v) => String(v).trim() !== "");
  formData.append("per_page", perPage.value);
  formData.append("sort_key", sortKey.value); // Добавляем ключ сортировки
  formData.append("sort_direction", sortDirection.value); // Добавляем направление сортировки

  if (!url) {
    url = "media/get";
  }

  await $axiosPlugin
    .post(url, formData)
    .then((response) => {
      files.value = response.data;
      pendingFiles.value = false;
      paging.value = false;
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

const getFile = async (file_id) => {
  pendingFile.value = true;
  fileModalIsVisible.value = true;
  await $axiosPlugin
    .get("media/get/file_info/" + file_id)
    .then((response) => {
      currentFile.value = response.data;
      pendingFile.value = false;
      scheduleProcessingPoll();
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

const addFileSubmit = async () => {
  pendingAdd.value = true;
  uploadProgress.value = 0;
  const formData = new FormData(addFormRef.value);
  formData.append("operation_type_id", 17);

  await $axiosPlugin
    .post("media/add", formData, {
      onUploadProgress: (e) => {
        if (e.total) {
          uploadProgress.value = Math.round((e.loaded * 100) / e.total);
        }
      },
    })
    .then((response) => {
      getFiles();
      closeAddModal();
      getFile(response.data.file_id);
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingAdd.value = false;
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
    });
};

const replaceFileSubmit = async (fileId) => {
  pendingReplace.value = true;
  uploadProgress.value = 0;
  const formData = new FormData(replaceFormRef.value);
  formData.append("operation_type_id", 17);

  await $axiosPlugin
    .post("media/replace/" + fileId, formData, {
      onUploadProgress: (e) => {
        if (e.total) {
          uploadProgress.value = Math.round((e.loaded * 100) / e.total);
        }
      },
    })
    .then((response) => {
      currentFile.value = null;
      getFiles();
      closeReplaceModal();
      getFile(fileId);
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingReplace.value = false;
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
    });
};

const convertFileSubmit = async (fileId) => {
  pendingFile.value = true;
  const formData = new FormData(replaceFormRef.value);
  formData.append("operation_type_id", 17);

  await $axiosPlugin
    .post("media/convert/" + fileId, formData)
    .then(() => {
      currentFile.value = null;
      getFile(fileId);
      getFiles(); // в списке появится «Обрабатывается»
    })
    .catch((err) => {
      // Раньше без ответа сервера лоадер в окне оставался навсегда
      pendingFile.value = false;
      if (err.response && err.response.status >= 500) {
        router.push({
          path: "/error",
          query: {
            status: err.response.status,
            message: err.response.data.message,
            url: err.request.responseURL,
          },
        });
      } else {
        notify("danger", err.response?.data?.message || t("file.convert_failed"));
      }
    });
};

const addMarker = () => {
  markerErrorName.value = false;
  markerErrorSecond.value = false;

  if (markerName.value === "") {
    markerErrorName.value = true;
  }

  if (markerSecond.value === "") {
    markerErrorSecond.value = true;
  }

  if (markerErrorName.value === false && markerErrorSecond.value === false) {
    markers.value.push({
      name: markerName.value,
      second: markerSecond.value,
    });

    // сортировка по возрастанию
    markers.value.sort((a, b) => a.second - b.second);

    markerName.value = "";
    markerSecond.value = "";
  }
};

const removeMarker = (markerIndex) => {
  if (markerIndex >= 0 && markerIndex < markers.value.length) {
    markers.value.splice(markerIndex, 1);
  }
};

const getFileExtension = (filename) => {
  const match = String(filename || "").match(/\.([0-9a-z]+)$/i);
  return match ? match[1] : "";
};

const closeAddModal = () => {
  addModalIsVisible.value = false;
  pendingAdd.value = false;
  addFormRef.value.reset();
  currentFileType.value = null;
  markers.value = [];
  errors.value = [];
};

const closeReplaceModal = () => {
  replaceModalIsVisible.value = false;
  pendingReplace.value = false;
  replaceFormRef.value.reset();
  markers.value = [];
  errors.value = [];
};

const closeFileModal = () => {
  stopProcessingPoll();
  fileModalIsVisible.value = false;
  currentFile.value = null;
  linkCopied.value = false;
};

const selectFileType = (event) => {
  currentFileType.value = null;
  setTimeout(() => {
    currentFileType.value = fileTypes.value.find(
      (ft) => ft.material_type_id == event.target.value,
    );
  }, 100);
};

// Скачивание с индикатором на кнопке; ошибка — уведомление (раньше молча)
const downloadFile = async (filePath, fileName, target = "") => {
  if (downloading.value) return;
  downloading.value = true;

  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error("HTTP " + response.status);
    const blob = await response.blob();

    // Имя с расширением исходного файла, если в названии его нет
    const ext = getFileExtension(target);
    let name = sanitizeFileName(fileName) || "file";
    if (ext && !name.toLowerCase().endsWith("." + ext.toLowerCase())) name += "." + ext;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();

    // Чистим за собой
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (e) {
    notify("danger", t("file.download_failed"));
  } finally {
    downloading.value = false;
  }
};

const replaceFile = (fileId) => {
  fileModalIsVisible.value = false;
  replaceModalIsVisible.value = true;
};

const sanitizeFileName = (name) => {
  return name
    .replace(/[<>:"/\\|?*]+/g, "") // убираем запрещённые символы
    .replace(/\s+/g, " ") // нормализуем пробелы
    .trim();
};

const showHideFileSearchFilter = () => {
  if (searchFilter.value === true) {
    searchFilter.value = false;
    resetFileSearchFilter();
  } else {
    searchFilter.value = true;
  }
};

const resetFileSearchFilter = () => {
  searchFormRef.value?.reset();
  getFiles();
};

const debounceFiles = debounceHandler(() => getFiles(), 1000);
const debounceReset = debounceHandler(() => resetFileSearchFilter(), 500);

onMounted(() => {
  getAttributes();
  getFiles();
});

onBeforeUnmount(() => {
  stopProcessingPoll();
  clearTimeout(linkCopiedTimer);
});
</script>
