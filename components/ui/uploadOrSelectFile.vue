<template>
  <div class="col-span-12">
    <div class="flex flex-col gap-y-2">
      <label v-if="props.allowGenerate === true" class="custom-radio">
        <input
          type="radio"
          :checked="uploadingNewFileMethod === 'generate'"
          :value="uploadingNewFileMethod"
          :name="props.radioName"
          @change="uploadingNewFileMethod = 'generate'"
        />
        <span>{{ $t("file.generate") }}</span>
      </label>

      <label class="custom-radio">
        <input
          type="radio"
          :checked="uploadingNewFileMethod === 'true'"
          :value="uploadingNewFileMethod"
          :name="props.radioName"
          @change="uploadingNewFileMethod = 'true'"
        />
        <span>{{ $t("file.uploading_a_new_file") }}</span>
      </label>

      <label class="custom-radio">
        <input
          type="radio"
          :checked="uploadingNewFileMethod === 'false'"
          :value="uploadingNewFileMethod"
          :name="props.radioName"
          @change="uploadingNewFileMethod = 'false'"
        />
        <span>{{ $t("file.upload_from_media") }}</span>
      </label>
    </div>
  </div>
  <div v-if="uploadingNewFileMethod === 'generate'" class="col-span-12">
    <fileGenerate
      :accept="props.accept"
      :error="errors[props.generateFileInputName]"
      :generateText="props.generateText"
      :generateFileInputName="props.generateFileInputName"
      :generateFileError="props.generateFileError"
    />
  </div>
  <div v-else-if="uploadingNewFileMethod === 'true'" class="col-span-12">
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
  <div v-else-if="uploadingNewFileMethod === 'false'" class="col-span-12">
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

const uploadingNewFileMethod = ref(
  props.allowGenerate === true ? "generate" : "true"
);
</script>
