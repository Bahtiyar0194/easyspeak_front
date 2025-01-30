<template>
  <div class="form-group-border select active label-active">
    <i class="pi pi-file"></i>
    <select :name="props.name" @change="selectFile($event)">
      <option selected disabled value="">
        {{ $t("file.choose_a_file") }}
      </option>
      <option
        v-for="(file, fileIndex) in files"
        :key="fileIndex"
        :value="file.file_id"
      >
        {{ file.file_name }}
      </option>
    </select>
    <label :class="{ 'label-error': props.error }">
      {{ props.error ? $t("file.choose_a_file") : $t("file.file") }}
    </label>
  </div>

  <previewFileInput
    v-if="previewFile"
    :fileType="previewFile.material_type_slug"
    :previewUrl="config.public.apiBase + '/media/get/' + previewFile.target"
    :className="'mt-4'"
  />
</template>
<script setup>
import { useRouter } from "nuxt/app";
import previewFileInput from "./previewFileInput.vue";

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();

const files = ref([]);
const previewFile = ref(null);

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
    type: Object,
    required: false,
  },
});

const perPage = ref(10000000);
const sortKey = ref("files.file_name"); // Ключ сортировки
const sortDirection = ref("asc"); // Направление сортировки: asc или desc

const getFiles = async () => {
  const formData = new FormData();
  formData.append("material_type_slug", props.fileType);
  formData.append("per_page", perPage.value);
  formData.append("sort_key", sortKey.value); // Добавляем ключ сортировки
  formData.append("sort_direction", sortDirection.value); // Добавляем направление сортировки

  await $axiosPlugin
    .post("media/get", formData)
    .then((response) => {
      files.value = response.data.data;
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

const selectFile = (event) => {
    previewFile.value = null;
    setTimeout(() => {
        previewFile.value = files.value.find((f) => f.file_id == event.target.value);
    }, 100);
};

onMounted(() => {
  getFiles();
});

onBeforeUnmount(() => {
  if (previewFile.value) {
    previewFile.value = null;
  }
});
</script>
