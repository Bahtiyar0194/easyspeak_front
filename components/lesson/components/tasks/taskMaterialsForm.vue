<template>
  <div class="custom-grid">
    <loader v-if="pending" :className="'full-overlay'" :showPendingText="true" />
    <div v-if="taskMaterials.length > 0" class="col-span-12">
      <TransitionGroup
        tag="ul"
        class="list-group"
        :move="{ transition: { duration: 0.3 } }"
      >
        <li
          v-for="(material, materialIndex) in taskMaterials"
          :key="materialIndex"
        >
          <div class="custom-grid">
            <div class="col-span-12">
              <div class="btn-wrap justify-between">
                <p class="mb-0 font-medium">
                  {{ $t("materials.material") }} № {{ materialIndex + 1 }}
                </p>
                <div class="flex gap-x-1 justify-end">
                  <button
                    type="button"
                    @click="order('up', materialIndex, $event.target)"
                    class="btn btn-square btn-light btn-sm btn-up"
                    :title="$t('move_up')"
                  >
                    <i class="pi pi-arrow-up"></i>
                  </button>
                  <button
                    type="button"
                    @click="order('down', materialIndex, $event.target)"
                    class="btn btn-square btn-light btn-sm btn-down"
                    :title="$t('move_down')"
                  >
                    <i class="pi pi-arrow-down"></i>
                  </button>
                  <button
                    type="button"
                    @click="removeMaterial(materialIndex)"
                    class="btn btn-square btn-outline-danger btn-sm"
                    :title="$t('delete')"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                </div>
              </div>
            </div>
            <uploadOrSelectFile
              v-if="material.material_type_category === 'file'"
              :key="'upload_task_file_' + materialIndex"
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
              :key="'upload_task_text_' + materialIndex"
              :inputName="'text_' + materialIndex"
              :errors="errors"
            />
            <tableEditor
              v-else-if="material.material_type_slug === 'table'"
              :key="'upload_task_table_' + materialIndex"
              :tableName="'table_' + materialIndex"
              :errors="errors"
            />
          </div>
        </li>
      </TransitionGroup>
    </div>

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
                <button type="button" @click="addMaterial(material_type)">
                  <i :class="material_type.icon"></i>
                  {{ material_type.material_type_name }}
                </button>
              </li>
            </template>
          </dropdownMenu>
        </client-only>
      </div>
    </div>

    <div v-if="taskMaterials.length > 0" class="col-span-12">
      <div class="flex flex-col gap-y-2">
        <label class="custom-radio">
          <input
            type="radio"
            value="use_both"
            :checked="true"
            name="show_materials_option"
          />
          <span>{{
            $t("materials.show_materials_option.use_both_options")
          }}</span>
        </label>

        <label class="custom-radio">
          <input
            type="radio"
            value="during_a_task"
            name="show_materials_option"
          />
          <span>{{
            $t("materials.show_materials_option.show_materials_during_a_task")
          }}</span>
        </label>

        <label class="custom-radio">
          <input
            type="radio"
            value="before_starting_a_task"
            name="show_materials_option"
          />
          <span>{{
            $t(
              "materials.show_materials_option.show_materials_before_starting_a_task"
            )
          }}</span>
        </label>
      </div>
    </div>
  </div>
</template>
<script setup>
import { scrollIntoView } from "seamless-scroll-polyfill";
import dropdownMenu from "../../../ui/dropdownMenu.vue";
import loader from "../../../ui/loader.vue";
import uploadOrSelectFile from "../../../ui/uploadOrSelectFile.vue";
import textEditor from "../../../ui/textEditor.vue";
import tableEditor from "../../../ui/tableEditor.vue";

const { $axiosPlugin } = useNuxtApp();
const pending = ref(false);
const materialTypes = ref([]);

const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },

  sentenceMaterialTypes: {
    type: Object,
    required: false,
  },

  taskMaterials: {
    type: Object,
    required: true,
  },
});

const { errors, sentenceMaterialTypes, taskMaterials } = toRefs(props);

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
      if (props.sentenceMaterialTypes) {
        materialTypes.value.forEach((material_type) => {
          if (material_type.material_type_category == "file") {
            sentenceMaterialTypes.value.push(material_type);
          }
        });
      }
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

const order = (direction, index, event) => {
  const parent = event.closest("li");

  if (direction === "up" && index > 0) {
    [taskMaterials.value[index - 1], taskMaterials.value[index]] = [
      taskMaterials.value[index],
      taskMaterials.value[index - 1],
    ];
  } else if (direction === "down" && index < taskMaterials.value.length - 1) {
    [taskMaterials.value[index], taskMaterials.value[index + 1]] = [
      taskMaterials.value[index + 1],
      taskMaterials.value[index],
    ];
  }

  scrollIntoView(parent, {
    behavior: "smooth",
    block: "center",
    inline: "center",
  });
};

onMounted(() => {
  getMaterialTypes();
});
</script>
