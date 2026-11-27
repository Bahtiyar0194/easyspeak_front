<template>
  <div class="custom-grid">
    <!-- Панель: фильтр и счётчик слева, главное действие справа -->
    <div class="col-span-12">
      <div class="list-toolbar">
        <button
          type="button"
          @click="showHideSentenceSearchFilter"
          class="btn"
          :class="searchFilter ? 'btn-outline-primary' : 'btn-light'"
          :aria-pressed="searchFilter"
          :title="searchFilter ? $t('hide_search_filter') : $t('show_search_filter')"
        >
          <i class="pi pi-filter" aria-hidden="true"></i>
          {{ $t("filter") }}
        </button>
        <span v-if="sentences.total" class="text-sm text-inactive">
          {{ $t("found") }}: <b class="text-active">{{ sentences.total }}</b>
        </span>

        <roleProvider :roles="[1]">
          <button
            type="button"
            class="btn btn-primary ml-auto"
            @click="addModalIsVisible = true"
          >
            <i class="pi pi-plus" aria-hidden="true"></i>
            {{ $t("pages.sentences.add_sentence") }}
          </button>
        </roleProvider>
      </div>
    </div>

    <div
      class="col-span-12 lg:col-span-3"
      :class="searchFilter ? 'block' : 'hidden'"
    >
      <stickyBox>
        <div class="card p-4">
          <h5>{{ $t("pages.sentences.search_filter") }}</h5>
          <form @submit.prevent="debounceReset" ref="searchFormRef">
            <div class="custom-grid">
              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-align-left"></i>
                  <input
                    type="text"
                    name="sentence"
                    placeholder=" "
                    autocomplete="off"
                    @input="debounceSentences"
                  />
                  <label>{{ $t("pages.sentences.sentence") }}</label>
                </div>
              </div>

              <div class="col-span-12">
                <multipleSelect
                  :className="'form-group-border select active label-active'"
                  :icon="'pi pi-book'"
                  :label="$t('pages.courses.course')"
                  :items="attributes.courses"
                  :optionName="'courses[]'"
                  :optionValue="'course_id'"
                  :optionLabel="'course_name'"
                  :onChange="debounceSentences"
                />
              </div>

              <div class="col-span-12">
                <multipleSelect
                  :className="'form-group-border select active label-active'"
                  :icon="'pi pi-user'"
                  :label="$t('operator')"
                  :items="attributes.operators"
                  :optionName="'operators[]'"
                  :optionValue="'user_id'"
                  :optionLabel="'full_name'"
                  :avatar="true"
                  :onChange="debounceSentences"
                />
              </div>

              <div class="col-span-12">
                <multipleSelect
                  :className="'form-group-border select active label-active'"
                  :icon="'pi pi-hourglass'"
                  :label="$t('status')"
                  :items="attributes.statuses"
                  :optionName="'statuses[]'"
                  :optionValue="'status_type_id'"
                  :optionLabel="'status_type_name'"
                  :onChange="debounceSentences"
                />
              </div>

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-calendar"></i>
                  <input
                    type="date"
                    name="created_at_from"
                    @input="debounceSentences"
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
                    @input="debounceSentences"
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
        v-if="pending && (paging || !sentences.data?.length)"
        :columns="sentenceTableHeads.length + 1"
        :avatar="false"
        :statusColumn="false"
        :rows="paging ? skeletonRows : 8"
      />

      <!-- Фильтр / сортировка / сохранение: список на месте, по нему перелив -->
      <div
        v-else-if="sentences.data?.length"
        :class="{ 'list-refreshing': pending }"
        :aria-busy="pending || undefined"
      >
        <span v-if="pending" class="sr-only">{{ $t("loading") }}</span>

        <!-- Компьютер: таблица -->
        <div class="table table-striped table-sm selectable max-md:!hidden">
          <table ref="tableRef">
            <thead>
              <tr>
                <sortTableHead
                  v-for="(head, index) in sentenceTableHeads"
                  :key="index"
                  :title="head.title"
                  :keyName="head.keyName"
                  :sortKey="sortKey"
                  :sortDirection="sortDirection"
                  :sortType="head.sortType"
                  :sortHandler="debounceSentences"
                  @update:sortKey="sortKey = $event"
                  @update:sortDirection="sortDirection = $event"
                />
                <th></th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in sentences.data"
                :key="item.sentence_id"
                @click="getSentence(item.sentence_id)"
              >
                <td class="font-medium">{{ item.sentence }}</td>
                <td>{{ item.course_name }}</td>
                <td>
                  <div class="flex gap-x-2 items-center">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-6 h-6'"
                      :user="{
                        last_name: item.operator_last_name,
                        first_name: item.operator_first_name,
                        avatar: item.operator_avatar,
                      }"
                    />
                    {{ item.operator_last_name }}
                    {{ item.operator_first_name }}
                  </div>
                </td>
                <td class="whitespace-nowrap">{{ formatDate(item.created_at) }}</td>
                <td>
                  <span class="status-pill" :class="item.status_color">
                    {{ item.status_type_name }}
                  </span>
                </td>
                <td>
                  <!-- Раньше здесь же рисовалась «картинка» из аудиофайла -->
                  <audioButton
                    v-if="item.audio_file"
                    :src="mediaUrl(item.audio_file)"
                    @click.stop
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Телефон: карточки вместо широкой таблицы -->
        <ul class="entity-list md:hidden">
          <li v-for="item in sentences.data" :key="item.sentence_id">
            <div
              class="entity-card cursor-pointer"
              role="button"
              tabindex="0"
              @click="getSentence(item.sentence_id)"
              @keydown.enter.self="getSentence(item.sentence_id)"
            >
              <span class="task-icon !w-11 !h-11 !text-lg" aria-hidden="true">
                <i class="pi pi-comment"></i>
              </span>
              <span class="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                <span class="font-semibold leading-snug line-clamp-2">{{
                  item.sentence
                }}</span>
                <span class="text-xs text-inactive truncate">{{
                  item.course_name
                }}</span>
                <span class="status-pill wrap mt-1" :class="item.status_color">
                  {{ item.status_type_name }}
                </span>
              </span>
              <audioButton
                v-if="item.audio_file"
                :src="mediaUrl(item.audio_file)"
                @click.stop
              />
            </div>
          </li>
        </ul>
      </div>

      <!-- Ничего не нашлось по фильтру -->
      <emptyState
        v-else-if="filtered"
        :text="$t('nothing_was_found_for_your_query')"
        icon="bi bi-search"
      >
        <button
          type="button"
          class="btn btn-light"
          @click="resetSentenceSearchFilter"
        >
          <i class="pi pi-filter-slash" aria-hidden="true"></i>
          {{ $t("reset_search_filter") }}
        </button>
      </emptyState>

      <!-- Фраз ещё нет -->
      <emptyState
        v-else
        :text="$t('pages.sentences.empty_title')"
        :hint="$t('pages.sentences.empty_hint')"
        icon="pi pi-comment"
      >
        <roleProvider :roles="[1]">
          <button
            type="button"
            class="btn btn-primary"
            @click="addModalIsVisible = true"
          >
            <i class="pi pi-plus" aria-hidden="true"></i>
            {{ $t("pages.sentences.add_sentence") }}
          </button>
        </roleProvider>
      </emptyState>

      <!-- Вне блока списка: при переходе по страницам остаётся на месте -->
      <div
        v-if="sentences.data?.length"
        class="btn-wrap mt-4"
        :class="{ 'pointer-events-none opacity-60': pending }"
      >
        <pagination
          :items="sentences"
          :setItems="getSentences"
          :onSelect="(count) => (perPage = count)"
        />
        <client-only>
          <tableToExcelButton
            :table="tableRef"
            :fileName="
              $t('pages.sentences.title') + ' - ' + new Date().toLocaleString()
            "
            :className="'btn-sm'"
          />
        </client-only>
      </div>
    </div>
  </div>

  <modal
    :show="addModalIsVisible"
    :onClose="() => closeAddModal()"
    :className="'modal-lg'"
    :showLoader="pendingAdd"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.sentences.add_sentence_title") }}</h4>
    </template>
    <template v-slot:body_content>
      <div class="mt-2">
        <form @submit.prevent="addSentenceSubmit" ref="addFormRef">
          <div class="custom-grid">
            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  autoComplete="new-sentence"
                  v-model="newSentence.sentence"
                  name="sentence"
                  type="text"
                  placeholder=" "
                  @change="translateNew()"
                />
                <label :class="{ 'label-error': errors.sentence }">
                  {{
                    errors.sentence
                      ? errors.sentence[0]
                      : $t("pages.sentences.sentence")
                  }}
                </label>
              </div>

              <!-- Автоперевод: что происходит и «Перевести заново» -->
              <div class="auto-translate-hint" aria-live="polite">
                <span v-if="auto.translating" class="text-corp">
                  <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
                  {{ $t("auto_translate.translating_short") }}
                </span>
                <template v-else-if="newSentence.sentence.trim()">
                  <span v-if="auto.manual.size" class="text-inactive">{{
                    $t("auto_translate.manual_kept")
                  }}</span>
                  <button
                    type="button"
                    class="auto-translate-btn"
                    @click="translateNew(true)"
                  >
                    <i class="bi bi-stars" aria-hidden="true"></i>
                    {{ $t("auto_translate.retranslate") }}
                  </button>
                </template>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  autoComplete="new-sentence-kk-translate"
                  v-model="newSentence.kk"
                  name="sentence_kk"
                  type="text"
                  placeholder=" "
                  @input="auto.markManual('kk')"
                />
                <label :class="{ 'label-error': errors.sentence_kk }">
                  {{
                    errors.sentence_kk
                      ? errors.sentence_kk[0]
                      : $t("pages.sentences.translate.kk")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  autoComplete="new-sentence-ru-translate"
                  v-model="newSentence.ru"
                  name="sentence_ru"
                  type="text"
                  placeholder=" "
                  @input="auto.markManual('ru')"
                />
                <label :class="{ 'label-error': errors.sentence_ru }">
                  {{
                    errors.sentence_ru
                      ? errors.sentence_ru[0]
                      : $t("pages.sentences.translate.ru")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border select active label-active">
                <i class="pi pi-book"></i>
                <select name="course_id">
                  <option selected disabled value="">
                    {{ $t("pages.courses.choose_a_course") }}
                  </option>
                  <option
                    v-for="course in attributes.all_courses"
                    :key="course.course_id"
                    :value="course.course_id"
                  >
                    {{ course.course_name }}
                  </option>
                </select>
                <label :class="{ 'label-error': errors.course_id }">
                  {{
                    errors.course_id
                      ? errors.course_id[0]
                      : $t("pages.courses.course")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="card p-4">
                <p class="mb-2 font-medium">{{ $t("file.audio.select") }}</p>
                <div class="custom-grid">
                  <uploadOrSelectFile
                    :allowGenerate="true"
                    :generateText="newSentence.sentence"
                    :generateFileInputName="'generate_new_sentence_audio_file'"
                    :generateFileError="$t('pages.sentences.required')"
                    :radioName="'upload_new_sentence_audio_file'"
                    :fileInputName="'new_sentence_audio_file_name'"
                    :showFileInputName="false"
                    :uploadingFileName="'new_sentence_audio_file'"
                    :libraryFileName="'new_sentence_audio_file_id'"
                    :accept="'audio'"
                    :icon="'pi pi-volume-up'"
                    :errors="errors"
                  />
                </div>
              </div>
            </div>

            <div class="col-span-12">
              <div class="btn-wrap justify-end">
                <!-- Пока ИИ заполняет поля — не отправляем полуготовую форму -->
                <button
                  class="btn btn-primary"
                  type="submit"
                  :disabled="auto.translating"
                >
                  <i class="pi pi-check"></i>
                  {{ $t("add") }}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </template>
  </modal>

  <modal
    :show="sentenceModalIsVisible"
    :onClose="() => (sentenceModalIsVisible = false)"
    :className="'modal-lg'"
    :showLoader="pendingSentence"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <div class="pr-2">
        <h4>{{ sentence?.sentence }}</h4>
      </div>
    </template>
    <template v-if="sentence" v-slot:body_content>
      <div class="custom-grid">
        <div class="col-span-12">
          <div class="flex flex-col gap-y-3">
            <!-- Плеер — только если у фразы есть озвучка -->
            <audioPlayerWithWave
              v-if="sentence.audio_file"
              :src="mediaUrl(sentence.audio_file)"
              :key="sentence.audio_file"
            />

            <p class="mb-0">
              <span class="text-inactive"
                >{{ $t("pages.courses.course") }}:
              </span>
              <b>{{ sentence.course_name }}</b>
            </p>

            <p
              v-for="(translate, index) in sentence.translates"
              :key="index"
              class="mb-0"
            >
              <span class="text-inactive"
                >{{ $t("pages.sentences.translate." + translate.lang_tag) }}:
              </span>
              <b>{{ translate.sentence_translate }}</b>
            </p>

            <div class="flex gap-x-2 items-center">
              <p class="mb-0">
                <span class="text-inactive">{{ $t("operator") }}: </span>
              </p>
              <userTag v-if="sentence.operator" :user="sentence.operator" />
            </div>
          </div>
        </div>
      </div>

      <roleProvider :roles="[1]">
        <div class="btn-wrap mt-4">
          <button type="button" @click="getEditSentence" class="btn btn-outline-primary">
            <i class="pi pi-pencil"></i>
            {{ $t("edit") }}
          </button>
        </div>
      </roleProvider>
    </template>
  </modal>

  <modal
    :show="editModalIsVisible"
    :onClose="() => closeEditModal()"
    :className="'modal-lg'"
    :showLoader="pendingEdit"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <div class="pr-2">
        <h4>{{ $t("pages.sentences.edit_sentence_title") }}</h4>
      </div>
    </template>
    <template v-if="sentence" v-slot:body_content>
      <div class="mt-2">
        <form @submit.prevent="editSentenceSubmit" ref="editFormRef">
          <div class="custom-grid">
            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  autoComplete="edit-sentence"
                  v-model="sentence.sentence"
                  name="sentence"
                  type="text"
                  placeholder=" "
                />
                <label :class="{ 'label-error': errors.sentence }">
                  {{
                    errors.sentence
                      ? errors.sentence[0]
                      : $t("pages.sentences.sentence")
                  }}
                </label>
              </div>

              <!-- При редактировании переводы не перезаписываются молча:
                   фразу изменили — предлагаем обновить -->
              <div class="auto-translate-hint" aria-live="polite">
                <span v-if="editAuto.translating" class="text-corp">
                  <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
                  {{ $t("auto_translate.translating_short") }}
                </span>
                <template v-else-if="editSentenceChanged">
                  <span class="text-amber-600 dark:text-amber-400">{{
                    $t("auto_translate.changed_short")
                  }}</span>
                  <button
                    type="button"
                    class="auto-translate-btn"
                    @click="translateEdit()"
                  >
                    <i class="bi bi-stars" aria-hidden="true"></i>
                    {{ $t("auto_translate.update") }}
                  </button>
                </template>
                <button
                  v-else-if="sentence.sentence?.trim()"
                  type="button"
                  class="auto-translate-btn"
                  @click="translateEdit()"
                >
                  <i class="bi bi-stars" aria-hidden="true"></i>
                  {{ $t("auto_translate.retranslate") }}
                </button>
              </div>
            </div>

            <div
              v-for="(translate, index) in sentence.translates"
              :key="index"
              class="col-span-12"
            >
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  :autocomplete="
                    'edit-sentence-translate-' + translate.lang_tag
                  "
                  v-model="sentence.translates[index].sentence_translate"
                  :name="'sentence_' + translate.lang_tag"
                  type="text"
                  placeholder=" "
                />
                <label
                  :class="{
                    'label-error': errors['sentence_' + translate.lang_tag],
                  }"
                >
                  {{
                    errors["sentence_" + translate.lang_tag]
                      ? errors["sentence_" + translate.lang_tag][0]
                      : $t("pages.sentences.translate." + translate.lang_tag)
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border select active label-active">
                <i class="pi pi-book"></i>
                <select name="course_id">
                  <option
                    v-for="course in attributes.all_courses"
                    :key="course.course_id"
                    :value="course.course_id"
                    :selected="sentence.course_id === course.course_id"
                  >
                    {{ course.course_name }}
                  </option>
                </select>
                <label :class="{ 'label-error': errors.course_id }">
                  {{
                    errors.course_id
                      ? errors.course_id[0]
                      : $t("pages.courses.course")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <previewFileInput
                v-if="current_sentence_audio"
                :fileType="'audio'"
                :previewUrl="mediaUrl(sentence.audio_file)"
                :onChange="() => (current_sentence_audio = false)"
              />
              <div v-else class="card p-4">
                <p class="mb-2 font-medium">{{ $t("file.audio.select") }}</p>
                <div class="custom-grid">
                  <uploadOrSelectFile
                    :allowGenerate="true"
                    :generateText="sentence.sentence"
                    :generateFileInputName="'generate_edit_sentence_audio_file'"
                    :generateFileError="$t('pages.sentences.required')"
                    :radioName="'upload_edit_sentence_audio_file'"
                    :fileInputName="'edit_sentence_audio_file_name'"
                    :showFileInputName="false"
                    :uploadingFileName="'edit_sentence_audio_file'"
                    :libraryFileName="'edit_sentence_audio_file_id'"
                    :accept="'audio'"
                    :icon="'pi pi-volume-up'"
                    :errors="errors"
                  />
                </div>
              </div>
            </div>

            <div class="col-span-12">
              <div class="btn-wrap justify-end">
                <button
                  class="btn btn-primary"
                  type="submit"
                  :disabled="editAuto.translating"
                >
                  <i class="pi pi-check"></i>
                  {{ $t("save") }}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import uploadOrSelectFile from "../ui/uploadOrSelectFile.vue";
import previewFileInput from "../ui/previewFileInput.vue";
import audioButton from "../ui/audioButton.vue";
import audioPlayerWithWave from "../ui/audioPlayerWithWave.vue";
import userAvatar from "../ui/userAvatar.vue";
import userTag from "../ui/userTag.vue";
import modal from "../ui/modal.vue";
import emptyState from "~/components/ui/emptyState.vue";
import listSkeleton from "../ui/listSkeleton.vue";
import stickyBox from "../ui/stickyBox.vue";
import pagination from "../ui/pagination.vue";
import tableToExcelButton from "../ui/tableToExcelButton.vue";
import { debounceHandler } from "../../utils/debounceHandler";
import roleProvider from "../ui/roleProvider.vue";
import multipleSelect from "../ui/multipleSelect.vue";
import sortTableHead from "../ui/sortTableHead.vue";
import { useAutoTranslate } from "~/composables/useAutoTranslate";

const router = useRouter();
const config = useRuntimeConfig();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const { t } = useI18n();
const pending = ref(true);
const pendingAdd = ref(false);
const pendingSentence = ref(false);
const pendingEdit = ref(false);
const tableRef = ref(null);
const searchFormRef = ref(null);
const addFormRef = ref(null);
const editFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(10);
const sentences = ref([]);
const sentence = ref(null);
const attributes = ref([]);

const current_sentence_audio = ref(false);

const addModalIsVisible = ref(false);
const sentenceModalIsVisible = ref(false);
const editModalIsVisible = ref(false);

// Новые фразы — сверху
const sortKey = ref("sentences.created_at"); // Ключ сортировки
const sortDirection = ref("desc"); // Направление сортировки: asc или desc

const mediaUrl = (file) => config.public.apiBase + "/media/get/" + file;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const sentenceTableHeads = [
  {
    title: t("pages.sentences.sentence"),
    keyName: "sentences.sentence",
    sortType: "alpha",
  },
  {
    title: t("pages.courses.course"),
    keyName: "courses_lang.course_name",
    sortType: "alpha",
  },
  {
    title: t("operator"),
    keyName: "operator.last_name",
    sortType: "alpha",
  },
  {
    title: t("created_at"),
    keyName: "sentences.created_at",
    sortType: "numeric",
  },
  {
    title: t("status"),
    keyName: "types_of_status_lang.status_type_name",
    sortType: "alpha",
  },
];

const goToError = (err) => {
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
};

// ===== Список =====
// Переход по страницам (пагинация передаёт url) — скелетон; фильтр,
// сортировка, сохранение — перелив по текущему списку
const paging = ref(false);
const skeletonRows = ref(8);
const listTopRef = ref(null);
// Заполнен ли фильтр — чтобы отличать «ничего не найдено» от «фраз нет»
const filtered = ref(false);

const getSentences = async (url) => {
  pending.value = true;
  paging.value = Boolean(url);

  if (paging.value) {
    skeletonRows.value = sentences.value.data?.length || 8;
    const top = listTopRef.value?.getBoundingClientRect().top;
    if (top !== undefined && top < 0) {
      listTopRef.value.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const formData = new FormData(searchFormRef.value || undefined);
  filtered.value = [...formData.values()].some((v) => String(v).trim() !== "");
  formData.append("per_page", perPage.value);
  formData.append("sort_key", sortKey.value); // Добавляем ключ сортировки
  formData.append("sort_direction", sortDirection.value); // Добавляем направление сортировки

  if (!url) {
    url = "sentences/get";
  }

  await $axiosPlugin
    .post(url, formData)
    .then((response) => {
      sentences.value = response.data;
      pending.value = false;
      paging.value = false;
    })
    .catch(goToError);
};

const getSentence = async (sentence_id) => {
  sentence.value = null;
  pendingSentence.value = true;
  editModalIsVisible.value = false;
  sentenceModalIsVisible.value = true;
  await $axiosPlugin
    .get("sentences/get/" + sentence_id)
    .then((response) => {
      errors.value = [];
      sentence.value = response.data;
      current_sentence_audio.value = Boolean(sentence.value.audio_file);

      pendingSentence.value = false;
    })
    .catch(goToError);
};

// ===== Автоперевод =====
const auto = reactive(useAutoTranslate());
const editAuto = reactive(useAutoTranslate());

// Добавление: поля формы — реактивные, name остаются для FormData
const newSentence = reactive({ sentence: "", kk: "", ru: "" });

// Фразу ввели — ИИ заполняет переводы, кроме полей, которые уже поправили
// вручную. force — «Перевести заново»: все поля
const translateNew = (force = false) =>
  auto.translate(
    newSentence.sentence,
    (result) => {
      if (result.kk != null) newSentence.kk = result.kk;
      if (result.ru != null) newSentence.ru = result.ru;
    },
    { force },
  );

// Редактирование: переводы молча не перезаписываем. Если фразу изменили —
// предлагаем обновить, по кнопке
const editOriginalSentence = ref("");

const editSentenceChanged = computed(
  () =>
    Boolean(sentence.value) &&
    (sentence.value.sentence || "").trim() !== editOriginalSentence.value.trim(),
);

const translateEdit = () =>
  editAuto.translate(
    sentence.value.sentence,
    (result) => {
      sentence.value.translates.forEach((translate) => {
        if (result[translate.lang_tag] != null) {
          translate.sentence_translate = result[translate.lang_tag];
        }
      });
      editOriginalSentence.value = sentence.value.sentence;
    },
    { force: true },
  );

const getEditSentence = async () => {
  editAuto.reset();
  editOriginalSentence.value = sentence.value?.sentence || "";
  sentenceModalIsVisible.value = false;
  editModalIsVisible.value = true;
};

const getSentenceAttributes = async () => {
  await $axiosPlugin
    .get("sentences/get_sentence_attributes")
    .then((response) => {
      attributes.value = response.data;
    })
    .catch(goToError);
};

const addSentenceSubmit = async () => {
  pendingAdd.value = true;
  const formData = new FormData(addFormRef.value);

  formData.append("operation_type_id", 11);

  await $axiosPlugin
    .post("sentences/add", formData)
    .then(() => {
      getSentences();
      closeAddModal();
    })
    .catch((err) => {
      if (err.response?.status == 422) {
        errors.value = err.response.data;
        pendingAdd.value = false;
      } else {
        goToError(err);
      }
    });
};

const editSentenceSubmit = async () => {
  pendingEdit.value = true;

  const formData = new FormData(editFormRef.value);
  formData.append("current_sentence_audio", current_sentence_audio.value);
  formData.append("operation_type_id", 12);

  await $axiosPlugin
    .post("sentences/update/" + sentence.value.sentence_id, formData)
    .then((response) => {
      errors.value = [];
      getSentence(response.data.sentence_id);
      // Список не очищаем: обновится на месте (перелив)
      getSentences();
      pendingEdit.value = false;
    })
    .catch((err) => {
      if (err.response?.status == 422) {
        errors.value = err.response.data;
        pendingEdit.value = false;
      } else {
        goToError(err);
      }
    });
};

const closeAddModal = () => {
  addModalIsVisible.value = false;
  pendingAdd.value = false;
  addFormRef.value?.reset();
  Object.assign(newSentence, { sentence: "", kk: "", ru: "" });
  auto.reset();
  errors.value = [];
};

const closeEditModal = () => {
  editAuto.reset();
  editModalIsVisible.value = false;
  sentenceModalIsVisible.value = true;
};

const showHideSentenceSearchFilter = () => {
  if (searchFilter.value === true) {
    searchFilter.value = false;
    resetSentenceSearchFilter();
  } else {
    searchFilter.value = true;
  }
};

const resetSentenceSearchFilter = () => {
  searchFormRef.value?.reset();
  getSentences();
};

const debounceSentences = debounceHandler(() => getSentences(), 1000);
const debounceReset = debounceHandler(() => resetSentenceSearchFilter(), 500);

onMounted(() => {
  getSentenceAttributes();
  getSentences();
});
</script>
