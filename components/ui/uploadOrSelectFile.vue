<template>
  <div class="col-span-12">
    <div class="flex flex-col gap-y-2">
      <label class="custom-radio">
        <input
          type="radio"
          :checked="uploadingNewFile === true"
          :value="uploadingNewFile"
          :name="props.radioName"
          @change="uploadingNewFile = true"
        />
        <span>{{ $t("file.uploading_a_new_file") }}</span>
      </label>

      <label class="custom-radio">
        <input
          type="radio"
          :checked="uploadingNewFile === false"
          :value="uploadingNewFile"
          :name="props.radioName"
          @change="uploadingNewFile = false"
        />
        <span>{{ $t("file.upload_from_media") }}</span>
      </label>
    </div>
  </div>
  <div v-if="uploadingNewFile === true" class="col-span-12">
    <div class="custom-grid">
      <div class="col-span-12">
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
  <div v-else class="col-span-12">
    <selectFileFromLibrary
      :name="props.libraryFileName"
      :fileType="props.accept"
      :error="errors[props.libraryFileName]"
    />
  </div>
</template>
<script setup>
import fileUploadButton from "./fileUploadButton.vue";
import selectFileFromLibrary from "./selectFileFromLibrary.vue";

const uploadingNewFile = ref(true);

const props = defineProps({
  radioName: {
    type: String,
    required: true,
  },
  fileInputName: {
    type: String,
    required: true,
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
</script>
