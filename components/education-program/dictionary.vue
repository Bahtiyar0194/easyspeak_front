<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <div class="btn-wrap">
        <roleProvider :roles="[1]">
          <button
            class="btn btn-outline-primary"
            @click="addModalIsVisible = true"
          >
            <i class="pi pi-plus"></i>
            {{ $t("add") }}
          </button>
        </roleProvider>
        <button @click="showHideWordSearchFilter" class="btn btn-light">
          <i class="pi pi-search"></i>
          {{
            searchFilter === true
              ? $t("hide_search_filter")
              : $t("show_search_filter")
          }}
        </button>
      </div>
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
                <multipleSelect
                  :className="'form-group-border select active label-active'"
                  :icon="'pi pi-user'"
                  :label="$t('operator')"
                  :items="attributes.operators"
                  :optionName="'operators[]'"
                  :optionValue="'user_id'"
                  :optionLabel="'full_name'"
                  :avatar="true"
                  :onChange="debounceWords"
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
                  :onChange="debounceWords"
                />
              </div>

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-calendar"></i>
                  <input
                    type="date"
                    name="created_at_from"
                    @input="debounceWords"
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
                    @input="debounceWords"
                    placeholder=" "
                  />
                  <label>{{ $t("created_at_to") }}</label>
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
                <th></th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="word in words.data"
                :key="word.word_id"
                @click="getWord(word.word_id)"
              >
                <td>{{ word.word }}</td>
                <td>[{{ word.transcription }}]</td>
                <td>{{ word.course_name }}</td>
                <td>
                  <div class="flex gap-x-2 items-center">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-6 h-6'"
                      :user="{
                        last_name: word.operator_last_name,
                        first_name: word.operator_first_name,
                        avatar: word.operator_avatar,
                      }"
                    />
                    {{ word.operator_last_name }} {{ word.operator_first_name }}
                  </div>
                </td>
                <td>{{ new Date(word.created_at).toLocaleString() }}</td>
                <td :class="word.status_color">{{ word.status_type_name }}</td>
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
              </tr>
            </tbody>
          </table>
        </div>
        <div class="btn-wrap mt-4">
          <pagination
            :items="words"
            :setItems="getWords"
            :onSelect="(count) => (perPage = count)"
          />
          <client-only>
            <tableToExcelButton
              :table="tableRef"
              :fileName="
                $t('pages.dictionary.title') +
                ' - ' +
                new Date().toLocaleString()
              "
              :className="'btn-sm'"
            />
          </client-only>
        </div>
      </template>

      <alert v-else :className="'light'">
        <loader v-if="pending" :className="'overlay'" />
        <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
      </alert>
    </div>
  </div>

  <modal
    :show="addModalIsVisible"
    :onClose="() => closeAddModal()"
    :className="'modal-4xl'"
    :showLoader="pendingAdd"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <div class="pr-2">
        <h4>{{ $t("pages.dictionary.add_word_title") }}</h4>
      </div>
    </template>
    <template v-slot:body_content>
      <div class="mt-2">
        <form @submit.prevent="addWordSubmit" ref="addFormRef">
          <div class="custom-grid">
            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  autoComplete="new-word"
                  name="word"
                  type="text"
                  placeholder=" "
                />
                <label :class="{ 'label-error': errors.word }">
                  {{
                    errors.word ? errors.word[0] : $t("pages.dictionary.word")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="bi bi-braces"></i>
                <input
                  autoComplete="new-word-transcription"
                  name="transcription"
                  type="text"
                  placeholder=" "
                />
                <label :class="{ 'label-error': errors.transcription }">
                  {{
                    errors.transcription
                      ? errors.transcription[0]
                      : $t("pages.dictionary.transcription")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  autoComplete="new-word-kk-translate"
                  name="word_kk"
                  type="text"
                  placeholder=" "
                />
                <label :class="{ 'label-error': errors.word_kk }">
                  {{
                    errors.word_kk
                      ? errors.word_kk[0]
                      : $t("pages.dictionary.translate.kk")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  autoComplete="new-word-ru-translate"
                  name="word_ru"
                  type="text"
                  placeholder=" "
                />
                <label :class="{ 'label-error': errors.word_ru }">
                  {{
                    errors.word_ru
                      ? errors.word_ru[0]
                      : $t("pages.dictionary.translate.ru")
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

            <div class="col-span-12 lg:col-span-6">
              <div class="card p-4">
                <p class="mb-2 font-medium">{{ $t("file.image.select") }}</p>
                <div class="custom-grid">
                  <uploadOrSelectFile
                    :radioName="'upload_new_word_image_file'"
                    :fileInputName="'new_word_image_file_name'"
                    :showFileInputName="false"
                    :uploadingFileName="'new_word_image_file'"
                    :libraryFileName="'new_word_image_file_id'"
                    :accept="'image'"
                    :icon="'pi pi-image'"
                    :errors="errors"
                  />
                </div>
              </div>
            </div>

            <div class="col-span-12 lg:col-span-6">
              <div class="card p-4">
                <p class="mb-2 font-medium">{{ $t("file.audio.select") }}</p>
                <div class="custom-grid">
                  <uploadOrSelectFile
                    :radioName="'upload_new_word_audio_file'"
                    :fileInputName="'new_word_audio_file_name'"
                    :showFileInputName="false"
                    :uploadingFileName="'new_word_audio_file'"
                    :libraryFileName="'new_word_audio_file_id'"
                    :accept="'audio'"
                    :icon="'pi pi-volume-up'"
                    :errors="errors"
                  />
                </div>
              </div>
            </div>

            <div class="col-span-12">
              <button class="btn btn-primary" type="submit">
                <i class="pi pi-check"></i>
                {{ $t("add") }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </template>
  </modal>

  <modal
    :show="wordModalIsVisible"
    :onClose="() => (wordModalIsVisible = false)"
    :className="word?.image_file ? 'modal-3xl' : 'modal-lg'"
    :showLoader="pendingWord"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <h3>{{ word?.word }}</h3>
    </template>
    <template v-if="word" v-slot:body_content>
      <div class="custom-grid">
        <div v-if="word.image_file" class="col-span-3 lg:col-span-4">
          <img
            class="w-full h-auto rounded-xl"
            :src="config.public.apiBase + '/media/get/' + word.image_file"
          />
        </div>
        <div
          :class="word.image_file ? 'col-span-9 lg:col-span-8' : 'col-span-12'"
        >
          <div class="flex flex-col gap-y-3">
            <audioPlayerWithWave
              :src="config.public.apiBase + '/media/get/' + word.audio_file"
            />
            <p class="mb-0">
              <span class="text-inactive"
                >{{ $t("pages.dictionary.transcription") }}:</span
              >
              <b>[{{ word.transcription }}]</b>
            </p>
            <p class="mb-0">
              <span class="text-inactive"
                >{{ $t("pages.courses.course") }}:</span
              >
              <b>{{ word.course_name }}</b>
            </p>

            <p
              v-for="(translate, index) in word.translates"
              :key="index"
              class="mb-0"
            >
              <span class="text-inactive"
                >{{
                  $t("pages.dictionary.translate." + translate.lang_tag)
                }}:</span
              >
              <b>{{ translate.word_translate }}</b>
            </p>

            <div class="flex gap-x-2 items-center">
              <p class="mb-0">
                <span class="text-inactive">{{ $t("operator") }}:</span>
              </p>
              <userTag v-if="word.operator" :user="word.operator" />
            </div>
          </div>
        </div>
      </div>

      <roleProvider :roles="[1]">
        <div class="btn-wrap mt-4">
          <button @click="getEditWord" class="btn btn-outline-primary">
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
    :className="'modal-4xl'"
    :showLoader="pendingEdit"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <div class="pr-2">
        <h4>{{ $t("pages.dictionary.edit_word_title") }}</h4>
      </div>
    </template>
    <template v-if="word" v-slot:body_content>
      <div class="mt-2">
        <form @submit.prevent="editWordSubmit" ref="editFormRef">
          <div class="custom-grid">
            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  autoComplete="edit-word"
                  v-model="word.word"
                  name="word"
                  type="text"
                  placeholder=" "
                />
                <label :class="{ 'label-error': errors.word }">
                  {{
                    errors.word ? errors.word[0] : $t("pages.dictionary.word")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="bi bi-braces"></i>
                <input
                  autoComplete="edit-word-transcription"
                  v-model="word.transcription"
                  name="transcription"
                  type="text"
                  placeholder=" "
                />
                <label :class="{ 'label-error': errors.transcription }">
                  {{
                    errors.transcription
                      ? errors.transcription[0]
                      : $t("pages.dictionary.transcription")
                  }}
                </label>
              </div>
            </div>

            <div
              v-for="(translate, index) in word.translates"
              :key="index"
              class="col-span-12"
            >
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  :autocomplete="'edit-word-kk-translate-' + translate.lang_tag"
                  v-model="translate.word_translate"
                  :name="'word_' + translate.lang_tag"
                  type="text"
                  placeholder=" "
                />
                <label
                  :class="{
                    'label-error': errors['word_' + translate.lang_tag],
                  }"
                >
                  {{
                    errors["word_" + translate.lang_tag]
                      ? errors["word_" + translate.lang_tag][0]
                      : $t("pages.dictionary.translate." + translate.lang_tag)
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
                    :selected="word.course_id === course.course_id"
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

            <div class="col-span-12 lg:col-span-6">
              <previewFileInput
                v-if="current_word_image"
                :fileType="'image'"
                :previewUrl="
                  config.public.apiBase + '/media/get/' + word.image_file
                "
                :onChange="() => (current_word_image = false)"
              />
              <div v-else class="card p-4">
                <p class="mb-2 font-medium">{{ $t("file.image.select") }}</p>
                <div class="custom-grid">
                  <uploadOrSelectFile
                    :radioName="'upload_edit_word_image_file'"
                    :fileInputName="'edit_word_image_file_name'"
                    :showFileInputName="false"
                    :uploadingFileName="'edit_word_image_file'"
                    :libraryFileName="'edit_word_image_file_id'"
                    :accept="'image'"
                    :icon="'pi pi-image'"
                    :errors="errors"
                  />
                </div>
              </div>
            </div>

            <div class="col-span-12 lg:col-span-6">
              <previewFileInput
                v-if="current_word_audio"
                :fileType="'audio'"
                :previewUrl="
                  config.public.apiBase + '/media/get/' + word.audio_file
                "
                :onChange="() => (current_word_audio = false)"
              />
              <div v-else class="card p-4">
                <p class="mb-2 font-medium">{{ $t("file.audio.select") }}</p>
                <div class="custom-grid">
                  <uploadOrSelectFile
                    :radioName="'upload_edit_word_audio_file'"
                    :fileInputName="'edit_word_audio_file_name'"
                    :showFileInputName="false"
                    :uploadingFileName="'edit_word_audio_file'"
                    :libraryFileName="'edit_word_audio_file_id'"
                    :accept="'audio'"
                    :icon="'pi pi-volume-up'"
                    :errors="errors"
                  />
                </div>
              </div>
            </div>

            <div class="col-span-12">
              <button class="btn btn-primary" type="submit">
                <i class="pi pi-check"></i>
                {{ $t("save") }}
              </button>
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
import loader from "../ui/loader.vue";
import alert from "../ui/alert.vue";
import stickyBox from "../ui/stickyBox.vue";
import pagination from "../ui/pagination.vue";
import tableToExcelButton from "../ui/tableToExcelButton.vue";
import { debounceHandler } from "../../utils/debounceHandler";
import roleProvider from "../ui/roleProvider.vue";
import multipleSelect from "../ui/multipleSelect.vue";
import sortTableHead from "../ui/sortTableHead.vue";

const router = useRouter();
const config = useRuntimeConfig();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const { t } = useI18n();
const pending = ref(true);
const pendingAdd = ref(false);
const pendingWord = ref(false);
const pendingEdit = ref(false);
const tableRef = ref(null);
const searchFormRef = ref(null);
const addFormRef = ref(null);
const editFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(10);
const words = ref([]);
const word = ref(null);
const attributes = ref([]);

const current_word_image = ref(false);
const current_word_audio = ref(false);

const addModalIsVisible = ref(false);
const wordModalIsVisible = ref(false);
const editModalIsVisible = ref(false);

const sortKey = ref("dictionary.created_at"); // Ключ сортировки
const sortDirection = ref("asc"); // Направление сортировки: asc или desc

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
    title: t("operator"),
    keyName: "operator.last_name",
    sortType: "alpha",
  },
  {
    title: t("created_at"),
    keyName: "dictionary.created_at",
    sortType: "numeric",
  },
  {
    title: t("status"),
    keyName: "types_of_status_lang.status_type_name",
    sortType: "alpha",
  },
];

const getWords = async (url) => {
  pending.value = true;

  const formData = new FormData(searchFormRef.value);
  formData.append("per_page", perPage.value);
  formData.append("sort_key", sortKey.value); // Добавляем ключ сортировки
  formData.append("sort_direction", sortDirection.value); // Добавляем направление сортировки

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

const getWord = async (word_id) => {
  word.value = null;
  pendingWord.value = true;
  editModalIsVisible.value = false;
  wordModalIsVisible.value = true;
  await $axiosPlugin
    .get("dictionary/get/" + word_id)
    .then((response) => {
      errors.value = [];
      word.value = response.data;

      current_word_image.value = Boolean(word.value.image_file);
      current_word_audio.value = Boolean(word.value.audio_file);

      pendingWord.value = false;
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

const getEditWord = async () => {
  wordModalIsVisible.value = false;
  editModalIsVisible.value = true;
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

const addWordSubmit = async () => {
  pendingAdd.value = true;
  const formData = new FormData(addFormRef.value);

  formData.append("operation_type_id", 9);

  await $axiosPlugin
    .post("dictionary/add", formData)
    .then((response) => {
      getWords();
      closeAddModal();
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

const editWordSubmit = async () => {
  pendingEdit.value = true;

  const formData = new FormData(editFormRef.value);

  formData.append("current_word_image", current_word_image.value);
  formData.append("current_word_audio", current_word_audio.value);
  formData.append("operation_type_id", 10);

  await $axiosPlugin
    .post("dictionary/update/" + word.value.word_id, formData)
    .then((response) => {
      errors.value = [];
      getWord(response.data.word_id);
      words.value = [];
      getWords();
      pendingEdit.value = false;
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingEdit.value = false;
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

const closeAddModal = () => {
  addModalIsVisible.value = false;
  pendingAdd.value = false;
  addFormRef.value.reset();
  errors.value = [];
};

const closeEditModal = () => {
  editModalIsVisible.value = false;
  wordModalIsVisible.value = true;
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
