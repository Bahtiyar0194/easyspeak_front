<template>
  <div class="custom-grid">
    <loader v-if="pending" :className="'full-overlay'" />
    <div class="col-span-12">
      <div class="btn-wrap">
        <client-only>
          <dropdownMenu
            :dropdownArrow="false"
            :position="'left'"
            :noAbsolute="taskMaterials.length === 0 ? true : false"
          >
            <template v-slot:btn_content>
              <button type="button" class="btn btn-outline-primary">
                <i class="pi pi-file-plus"></i>
                <span>{{ $t("file.upload_file") }}</span>
              </button>
            </template>

            <template v-slot:menu_content>
              <li v-for="(file_type, index) in fileTypes" :key="index">
                <button
                  type="button"
                  @click="
                    addMaterial(file_type.material_type_slug, file_type.icon)
                  "
                >
                  <i :class="file_type.icon"></i>
                  {{ file_type.material_type_name }}
                </button>
              </li>
            </template>
          </dropdownMenu>
        </client-only>
      </div>
    </div>

    <div
      v-for="(material, materialIndex) in taskMaterials"
      :key="materialIndex"
      class="col-span-12"
      v-motion="{
        initial: {
          y: -100,
          opacity: 0,
        },
        enter: {
          y: 0,
          opacity: 1,
        },
      }"
    >
      <div class="card p-4">
        <div class="custom-grid">
          <div class="col-span-12">
            <div class="btn-wrap justify-between">
              <p class="mb-0">{{ $t("file.file") }}: {{ materialIndex + 1 }}</p>
              <button type="button" @click="removeMaterial(materialIndex)" :title="$t('delete')">
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>
          <div class="col-span-12">
            <div class="flex flex-col gap-y-2">
              <label class="custom-radio">
                <input
                  type="radio"
                  :checked="material.uploadingNewFile === true"
                  :name="'upload_task_file_' + materialIndex"
                  @change="material.uploadingNewFile = true"
                />
                <span>{{ $t("file.uploading_a_new_file") }}</span>
              </label>

              <label class="custom-radio">
                <input
                  type="radio"
                  :checked="material.uploadingNewFile === false"
                  :name="'upload_task_file_' + materialIndex"
                  @change="material.uploadingNewFile = false"
                />
                <span>{{ $t("file.upload_from_media") }}</span>
              </label>
            </div>
          </div>
          <div v-if="material.uploadingNewFile === true" class="col-span-12">
            <div class="custom-grid">
              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-file"></i>
                  <input
                    :name="'file_name_' + materialIndex"
                    type="text"
                    placeholder=" "
                  />
                  <label
                    :class="{
                      'label-error': errors[`file_name_${materialIndex}`],
                    }"
                  >
                    {{
                      errors[`file_name_${materialIndex}`]
                        ? $t("file.specify_the_file_name")
                        : $t("file.name")
                    }}
                  </label>
                </div>
              </div>
              <div class="col-span-12">
                <fileUploadButton
                  :id="'file_' + materialIndex"
                  :name="'file_' + materialIndex"
                  :accept="material.material_type_slug + '/*'"
                  :error="errors[`file_${materialIndex}`]"
                  :icon="material.icon"
                  :label="$t('file.' + material.material_type_slug + '.select')"
                />
              </div>
            </div>
          </div>
          <div v-else class="col-span-12">
            <selectFileFromLibrary :name="'file_from_library_' + materialIndex" :fileType="material.material_type_slug" :error="errors[`file_from_library_${materialIndex}`]"/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import dropdownMenu from "../../../ui/dropdownMenu.vue";
import loader from "../../../ui/loader.vue";
import fileUploadButton from "../../../ui/fileUploadButton.vue";
import selectFileFromLibrary from "../../../ui/selectFileFromLibrary.vue";
const { $axiosPlugin } = useNuxtApp();
const pending = ref(false);
const fileTypes = ref([]);

const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },

  taskMaterials: {
    type: Object,
    required: true,
  },
});

const { errors, taskMaterials } = toRefs(props);

const addMaterial = (material_type_slug, icon) => {
  taskMaterials.value.push({
    uploadingNewFile: true,
    material_type_slug: material_type_slug,
    icon: icon,
  });
};

const removeMaterial = (materialIndex) => {
  if (materialIndex >= 0 && materialIndex < taskMaterials.value.length) {
    taskMaterials.value.splice(materialIndex, 1);
  }
};

const getFileTypes = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("media/get_attributes")
    .then((response) => {
      fileTypes.value = response.data.all_file_types;
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

onMounted(() => {
  getFileTypes();
});
</script>
