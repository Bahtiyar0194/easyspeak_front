<template>
  <!-- Откуда взять файл: сгенерировать / загрузить новый / из медиатеки.
       Переключатель с иконками; выбранный режим уходит на бэкенд тем же
       полем props.radioName, что и раньше: 'generate' | 'true' | 'false' -->
  <div ref="switchRef" class="col-span-12">
    <input type="hidden" :name="props.radioName" :value="mode" />
    <div class="source-switch" role="tablist">
      <button
        v-for="option in modes"
        :key="option.value"
        type="button"
        role="tab"
        class="source-switch-btn"
        :class="{ active: mode === option.value }"
        :aria-selected="mode === option.value"
        @click="mode = option.value"
      >
        <i :class="option.icon" aria-hidden="true"></i>
        <span>{{ option.label }}</span>
      </button>
    </div>
  </div>

  <div v-if="mode === 'generate'" class="col-span-12">
    <fileGenerate
      :accept="props.accept"
      :error="errors[props.generateFileInputName]"
      :generateText="props.generateText"
      :generateFileInputName="props.generateFileInputName"
      :generateFileError="props.generateFileError"
    />
  </div>
  <div v-else-if="mode === 'true'" class="col-span-12">
    <div class="custom-grid">
      <div v-if="props.showFileInputName === true" class="col-span-12">
        <div class="form-group-border active">
          <i class="pi pi-file"></i>
          <input :name="props.fileInputName" type="text" placeholder=" " />
          <label
            :class="{
              'label-error': errors[props.fileInputName],
            }"
          >
            {{
              errors[props.fileInputName]
                ? $t("file.specify_the_file_name")
                : $t("file.name")
            }}
          </label>
        </div>
      </div>
      <div class="col-span-12">
        <fileUploadButton
          :id="props.uploadingFileName"
          :name="props.uploadingFileName"
          :accept="props.accept + '/*'"
          :error="errors[props.uploadingFileName]"
          :icon="props.icon"
          :label="$t('file.' + props.accept + '.select')"
        />
      </div>
    </div>
  </div>
  <div v-else-if="mode === 'false'" class="col-span-12">
    <selectFileFromLibrary
      :name="props.libraryFileName"
      :fileType="props.accept"
      :error="errors[props.libraryFileName]"
    />
  </div>
</template>
<script setup>
import fileGenerate from "./fileGenerate.vue";
import fileUploadButton from "./fileUploadButton.vue";
import selectFileFromLibrary from "./selectFileFromLibrary.vue";

const { t } = useI18n();

const props = defineProps({
  radioName: {
    type: String,
    required: true,
  },
  allowGenerate: {
    type: Boolean,
    required: false,
    default: false,
  },
  generateText: {
    type: String,
    required: false,
    default: "",
  },

  generateFileInputName: {
    type: String,
    required: false,
  },

  generateFileError: {
    type: String,
    required: false,
    default: "",
  },

  fileInputName: {
    type: String,
    required: true,
  },

  showFileInputName: {
    type: Boolean,
    required: false,
    default: true,
  },

  uploadingFileName: {
    type: String,
    required: true,
  },

  libraryFileName: {
    type: String,
    required: true,
  },
  accept: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  errors: {
    type: Object,
    required: true,
  },
});

const { errors } = toRefs(props);

// Значения — как ждёт бэкенд: 'generate' | 'true' (новый файл) | 'false' (медиатека)
const modes = computed(() => [
  ...(props.allowGenerate
    ? [{ value: "generate", icon: "bi bi-stars", label: t("file.mode.generate") }]
    : []),
  { value: "true", icon: "pi pi-upload", label: t("file.mode.upload") },
  { value: "false", icon: "pi pi-images", label: t("file.mode.library") },
]);

const defaultMode = () => (props.allowGenerate === true ? "generate" : "true");
const mode = ref(defaultMode());

// Форму сбросили (окно закрыли) — возвращаем режим по умолчанию
const switchRef = ref(null);
let formElement = null;
const handleFormReset = () => {
  mode.value = defaultMode();
};

onMounted(() => {
  formElement = switchRef.value?.closest("form") || null;
  formElement?.addEventListener("reset", handleFormReset);
});

onBeforeUnmount(() => {
  formElement?.removeEventListener("reset", handleFormReset);
});
</script>
