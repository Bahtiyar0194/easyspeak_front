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
                <i class="pi pi-plus"></i>
                {{ $t("materials.add_material") }}
              </button>
            </template>

            <template v-slot:menu_content>
              <li v-for="(material_type, index) in materialTypes" :key="index">
                <button
                  type="button"
                  @click="
                    addMaterial(material_type)
                  "
                >
                  <i :class="material_type.icon"></i>
                  {{ material_type.material_type_name }}
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
              <p class="mb-0">{{ $t("materials.material") }} № {{ materialIndex + 1 }}</p>
              <button
                type="button"
                @click="removeMaterial(materialIndex)"
                :title="$t('delete')"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>
          <uploadOrSelectFile
            v-if="material.material_type_category === 'file'"
            :radioName="'upload_task_file_' + materialIndex"
            :fileInputName="'file_name_' + materialIndex"
            :uploadingFileName="'file_' + materialIndex"
            :libraryFileName="'file_from_library_' + materialIndex"
            :accept="material.material_type_slug"
            :icon="material.icon"
            :errors="errors"
          />
          <textEditor
            v-else-if="material.material_type_slug === 'text'"
            :inputName="'text_' + materialIndex"
            :errors="errors"
          />
          <editableTable
            v-else-if="material.material_type_slug === 'table'"
            :tableName="'table_' + materialIndex"
            :errors="errors"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import dropdownMenu from "../../../ui/dropdownMenu.vue";
import loader from "../../../ui/loader.vue";
import uploadOrSelectFile from "../../../ui/uploadOrSelectFile.vue";
import textEditor from "../../../ui/textEditor.vue";
import editableTable from "../../../ui/editableTable.vue";

const { $axiosPlugin } = useNuxtApp();
const pending = ref(false);
const materialTypes = ref([]);

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

const addMaterial = (material_type) => {
  taskMaterials.value.push(material_type);
};

const removeMaterial = (materialIndex) => {
  if (materialIndex >= 0 && materialIndex < taskMaterials.value.length) {
    taskMaterials.value.splice(materialIndex, 1);
  }
};

const getMaterialTypes = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("courses/get_material_types")
    .then((response) => {
      materialTypes.value = response.data;
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
  getMaterialTypes();
});
</script>
