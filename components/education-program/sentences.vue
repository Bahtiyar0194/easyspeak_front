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
        <button @click="showHideSentenceSearchFilter" class="btn btn-light">
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
      <template v-if="sentences.data?.length > 0">
        <div class="table table-striped table-sm selectable">
          <loader v-if="pending" :className="'overlay'" :showPendingText="true" />
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
                v-for="sentence in sentences.data"
                :key="sentence.sentence_id"
                @click="getSentence(sentence.sentence_id)"
              >
                <td>{{ sentence.sentence }}</td>
                <td>{{ sentence.course_name }}</td>
                <td>
                  <div class="flex gap-x-2 items-center">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-6 h-6'"
                      :user="{
                        last_name: sentence.operator_last_name,
                        first_name: sentence.operator_first_name,
                        avatar: sentence.operator_avatar,
                      }"
                    />
                    {{ sentence.operator_last_name }}
                    {{ sentence.operator_first_name }}
                  </div>
                </td>
                <td>{{ new Date(sentence.created_at).toLocaleString() }}</td>
                <td :class="sentence.status_color">
                  {{ sentence.status_type_name }}
                </td>
                <td>
                  <div class="flex items-center gap-x-4">
                    <audioButton
                      v-if="sentence.audio_file"
                      :src="
                        config.public.apiBase +
                        '/media/get/' +
                        sentence.audio_file
                      "
                      @click.stop
                    />
                    <div
                      v-if="sentence.audio_file"
                      :style="{
                        backgroundImage:
                          'url(' +
                          config.public.apiBase +
                          '/media/get/' +
                          sentence.audio_file +
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
            :items="sentences"
            :setItems="getSentences"
            :onSelect="(count) => (perPage = count)"
          />
          <client-only>
            <tableToExcelButton
              :table="tableRef"
              :fileName="
                $t('pages.sentences.title') +
                ' - ' +
                new Date().toLocaleString()
              "
              :className="'btn-sm'"
            />
          </client-only>
        </div>
      </template>

      <alert v-else :className="'light'">
        <loader v-if="pending" :className="'overlay'" :showPendingText="true"/>
        <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
      </alert>
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
                  ref="new_sentence"
                  name="sentence"
                  type="text"
                  placeholder=" "
                  @change="handleNewSentence($event)"
                />
                <label :class="{ 'label-error': errors.sentence }">
                  {{
                    errors.sentence
                      ? errors.sentence[0]
                      : $t("pages.sentences.sentence")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  autoComplete="new-sentence-kk-translate"
                  ref="new_sentence_kk"
                  name="sentence_kk"
                  type="text"
                  placeholder=" "
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
                  ref="new_sentence_ru"
                  name="sentence_ru"
                  type="text"
                  placeholder=" "
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
                    :generateText="new_sentence?.value"
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
                <button class="btn btn-primary" type="submit">
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
    :className="sentence?.audio_file ? 'modal-3xl' : 'modal-lg'"
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
            <audioPlayerWithWave
              :src="config.public.apiBase + '/media/get/' + sentence.audio_file"
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
          <button @click="getEditSentence" class="btn btn-outline-primary">
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
                  @change="handleEditSentence()"
                />
                <label :class="{ 'label-error': errors.sentence }">
                  {{
                    errors.sentence
                      ? errors.sentence[0]
                      : $t("pages.sentences.sentence")
                  }}
                </label>
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
                :previewUrl="
                  config.public.apiBase + '/media/get/' + sentence.audio_file
                "
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
                <button class="btn btn-primary" type="submit">
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

const new_sentence = ref(null);
const new_sentence_kk = ref(null);
const new_sentence_ru = ref(null);

const current_sentence_audio = ref(false);

const addModalIsVisible = ref(false);
const sentenceModalIsVisible = ref(false);
const editModalIsVisible = ref(false);

const sortKey = ref("sentences.created_at"); // Ключ сортировки
const sortDirection = ref("asc"); // Направление сортировки: asc или desc

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

const getSentences = async (url) => {
  pending.value = true;

  const formData = new FormData(searchFormRef.value);
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

const getEditSentence = async () => {
  sentenceModalIsVisible.value = false;
  editModalIsVisible.value = true;
};

const getSentenceAttributes = async () => {
  pending.value = true;
  await $axiosPlugin
    .get("sentences/get_sentence_attributes")
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

const handleNewSentence = async (event) => {
  pendingAdd.value = true;

  await $axiosPlugin
    .get("openai/translate", {
      params: { text: event.target.value },
    })
    .then((response) => {
      new_sentence_kk.value.value = response.data.kk;
      new_sentence_ru.value.value = response.data.ru;
      pendingAdd.value = false;
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

const handleEditSentence = async () => {
  pendingEdit.value = true;

  await $axiosPlugin
    .get("openai/translate", {
      params: { text: sentence.value.sentence },
    })
    .then((response) => {
      sentence.value.translates.forEach((translate) => {
        translate.sentence_translate = response.data[translate.lang_tag];
      });
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

const addSentenceSubmit = async () => {
  pendingAdd.value = true;
  const formData = new FormData(addFormRef.value);

  formData.append("operation_type_id", 11);

  await $axiosPlugin
    .post("sentences/add", formData)
    .then((response) => {
      getSentences();
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

const editSentenceSubmit = async () => {
  pendingEdit.value = true;

  const formData = new FormData(editFormRef.value);
  formData.append("current_sentence_audio", current_sentence_audio.value);
  formData.append("operation_type_id", 12);

  await $axiosPlugin
    .post("sentences/update/" + sentence.value.sentence_id, formData)
    .then((response) => {
      errors.value = false;
      getSentence(response.data.sentence_id);
      sentences.value = [];
      getSentences();
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
  searchFormRef.value.reset();
  getSentences();
};

const debounceSentences = debounceHandler(() => getSentences(), 1000);
const debounceReset = debounceHandler(() => resetSentenceSearchFilter(), 500);

onMounted(() => {
  getSentenceAttributes();
  getSentences();
});
</script>
