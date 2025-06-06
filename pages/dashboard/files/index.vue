<template>
  <loader v-if="pending" :className="'full-overlay'" />
  <div class="col-span-12">
    <div class="custom-grid">
      <div class="col-span-12">
        <div class="btn-wrap">
          <client-only>
            <roleProvider :roles="[1]">
              <button
                @click="addModalIsVisible = true"
                class="btn btn-outline-primary"
              >
                <i class="pi pi-file-plus"></i>
                {{ $t("file.upload_file") }}
              </button>
            </roleProvider>
          </client-only>
          <button @click="showHideFileSearchFilter" class="btn btn-light">
            <i class="pi pi-search"></i>
            {{
              searchFilter === true
                ? $t("hide_search_filter")
                : $t("show_search_filter")
            }}
          </button>

          <button @click="diskInfo = !diskInfo" class="btn btn-light">
            <i class="pi pi-chart-pie"></i>
            {{
              diskInfo === true
                ? $t("file.hide_disk_info")
                : $t("file.show_disk_info")
            }}
          </button>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-3" :class="(searchFilter || diskInfo) ? 'block' : 'hidden'">
        <stickyBox>
          <div class="custom-grid">
            <div class="col-span-12" :class="searchFilter ? 'block' : 'hidden'">
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
                      <div class="btn-wrap">
                        <button
                          type="submit"
                          class="btn btn-sm btn-outline-primary"
                        >
                          <i class="pi pi-undo"></i>
                          {{ $t("reset_search_filter") }}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div v-if="disk" class="col-span-12" :class="diskInfo ? 'block' : 'hidden'">
              <div class="card p-4">
                <h5 class="mb-2">{{ $t('file.disk_info') }}</h5>
                <ul class="list-group nowrap">
                  <li>
                    <p class="mb-0">{{ $t("file.total_space") }}: <b>{{ disk.total_space.toFixed(2) }} {{ $t('file.gigabyte') }}</b></p>
                  </li>
                  <li>
                    <p class="mb-0 text-success">{{ $t("file.free_space") }}: <b>{{ (disk.free_space).toFixed(2) }} {{ $t('file.gigabyte') }}</b></p>
                  </li>
                  <li>
                    <p class="mb-0 text-danger">{{ $t("file.used_space") }}: <b>{{ disk.used_space.toFixed(2) }} {{ $t('file.gigabyte') }}</b></p>
                    <progressBar :progressPercentage="(disk.used_space / disk.total_space) * 100" :className="'danger sm'" />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </stickyBox>
      </div>

      <div class="col-span-12" :class="(searchFilter || diskInfo) && 'lg:col-span-9'">
        <template v-if="files.data?.length > 0">
          <div class="table table-striped table-sm selectable">
            <loader v-if="pendingFiles" :className="'overlay'" />
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
                  <th></th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="file in files.data"
                  :key="file.file_id"
                  @click="getFile(file)"
                >
                  <td>{{ file.file_name }}</td>
                  <td>
                    {{ file.material_type_name }}
                    <span class="text-inactive"
                      >(.{{ getFileExtension(file.target) }})</span
                    >
                  </td>
                  <td>{{ file.size.toFixed(2) }} {{ $t("file.megabyte") }}</td>
                  <td>{{ new Date(file.created_at).toLocaleString() }}</td>
                  <td>
                    <div
                      v-if="
                        file.material_type_slug === 'video' ||
                        file.material_type_slug === 'audio'
                      "
                      class="btn btn-square btn-lg btn-light"
                    >
                      <i :class="file.icon"></i>
                    </div>
                    <div
                      v-if="file.material_type_slug === 'image'"
                      :style="{
                        backgroundImage:
                          'url(' +
                          config.public.apiBase +
                          '/media/get/' +
                          file.target +
                          ')',
                      }"
                      class="h-9 w-9 bg-cover bg-no-repeat bg-center rounded-lg"
                    ></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="btn-wrap mt-4">
            <pagination
              :items="files"
              :setItems="getFiles"
              :onSelect="(count) => (perPage = count)"
            />
          </div>
        </template>

        <alert v-else :className="'light'">
          <loader v-if="pendingFiles" :className="'overlay'" />
          <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
        </alert>
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
    :className="'modal-lg'"
    :showLoader="false"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <h3>{{ currentFile?.file_name }}</h3>
    </template>
    <template v-if="currentFile" v-slot:body_content>
      <div class="custom-grid">
        <div class="col-span-12">
          <previewFileInput
            :fileType="currentFile.material_type_slug"
            :previewUrl="
              config.public.apiBase + '/media/get/' + currentFile.target
            "
          />
        </div>
        <div class="col-span-12">
          <div class="flex flex-col gap-y-3">
            <p class="mb-0">
              <span class="text-inactive">{{ $t("file.type") }}: </span>
              <b>{{ currentFile.material_type_name }}</b>
            </p>
            <p class="mb-0">
              <span class="text-inactive">{{ $t("file.size") }}: </span>
              <b>{{ currentFile.size.toFixed(2) }} {{ $t("file.megabyte") }}</b>
            </p>
            <p class="mb-0">
              <span class="text-inactive">{{ $t("created_at") }}: </span>
              <b>{{ new Date(currentFile.created_at).toLocaleString() }}</b>
            </p>
          </div>
        </div>
      </div>
    </template>
  </modal>
</template>

<script setup>
import modal from "../../../components/ui/modal.vue";
import loader from "../../../../components/ui/loader.vue";
import roleProvider from "../../../components/ui/roleProvider.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import { useRouter } from "nuxt/app";
import stickyBox from "../../../components/ui/stickyBox.vue";
import pagination from "../../../components/ui/pagination.vue";
import multipleSelect from "../../../components/ui/multipleSelect.vue";
import sortTableHead from "../../../components/ui/sortTableHead.vue";
import alert from "../../../components/ui/alert.vue";
import fileUploadButton from "../../../components/ui/fileUploadButton.vue";
import previewFileInput from "../../../components/ui/previewFileInput.vue";
import progressBar from "../../../components/ui/progressBar.vue";

const { t } = useI18n();
const config = useRuntimeConfig();
const router = useRouter();
const errors = ref([]);

const { $axiosPlugin } = useNuxtApp();
const pending = ref(true);
const pendingAdd = ref(false);
const pendingFiles = ref(false);
const tableRef = ref(null);
const searchFormRef = ref(null);
const addFormRef = ref(null);
const searchFilter = ref(false);
const diskInfo = ref(false);

const disk = ref(null);
const fileTypes = ref([]);
const currentFileType = ref(null);
const currentFile = ref(null);
const files = ref([]);

const perPage = ref(10);
const sortKey = ref("files.file_name"); // Ключ сортировки
const sortDirection = ref("asc"); // Направление сортировки: asc или desc

const addModalIsVisible = ref(false);
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

const getAttributes = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("media/get_attributes")
    .then((response) => {
      fileTypes.value = response.data.all_file_types;
      disk.value = response.data.disk;
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

const getFiles = async (url) => {
  pendingFiles.value = true;

  const formData = new FormData(searchFormRef.value);
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

const getFile = (file) => {
  currentFile.value = file;
  fileModalIsVisible.value = true;
};

const addFileSubmit = async () => {
  pendingAdd.value = true;
  const formData = new FormData(addFormRef.value);
  formData.append("operation_type_id", 17);

  await $axiosPlugin
    .post("media/add", formData)
    .then((response) => {
      getFiles();
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

const getFileExtension = (filename) => {
  const match = filename.match(/\.([0-9a-z]+)$/i);
  return match ? match[1] : "";
};

const closeAddModal = () => {
  addModalIsVisible.value = false;
  pendingAdd.value = false;
  addFormRef.value.reset();
  currentFileType.value = null;
  errors.value = [];
};

const closeFileModal = () => {
  fileModalIsVisible.value = false;
  currentFile.value = null;
};

const selectFileType = (event) => {
  currentFileType.value = null;
  setTimeout(() => {
    currentFileType.value = fileTypes.value.find(
      (ft) => ft.material_type_id == event.target.value
    );
  }, 100);
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
  searchFormRef.value.reset();
  getFiles();
};

const debounceFiles = debounceHandler(() => getFiles(), 1000);
const debounceReset = debounceHandler(() => resetFileSearchFilter(), 500);

onMounted(() => {
  getAttributes();
  getFiles();
});
</script>
