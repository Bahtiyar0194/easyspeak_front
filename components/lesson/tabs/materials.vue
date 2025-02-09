<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <h2>{{ props.lessonData?.lesson_name }}</h2>
      <p class="mb-0">{{ props.lessonData?.lesson_description }}</p>
    </div>

    <roleProvider :roles="[1]">
      <div class="col-span-12">
        <div class="btn-wrap">
          <client-only>
            <dropdownMenu
              :dropdownArrow="false"
              :position="'left'"
              :noAbsolute="false"
            >
              <template v-slot:btn_content>
                <button type="button" class="btn btn-outline-primary">
                  <i class="pi pi-plus"></i>
                  {{ $t("materials.add_material") }}
                </button>
              </template>

              <template v-slot:menu_content>
                <li
                  v-for="(material_type, index) in materialTypes"
                  :key="index"
                >
                  <button
                    type="button"
                    @click="
                      addMaterial(
                        material_type.material_type_slug,
                        material_type.material_type_category,
                        material_type.icon
                      )
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
    </roleProvider>

    <div
      v-if="props.lessonData.materials && props.lessonData.materials.length"
      class="col-span-12"
    >
      <div class="custom-grid">
        <materialsList
          :materials="props.lessonData.materials"
          :showTitle="false"
        />
      </div>
    </div>
  </div>

  <modal
    :show="addModalIsVisible"
    :onClose="() => closeAddModal()"
    :className="
      currentMaterial && currentMaterial.material_type_category === 'block'
        ? 'modal-4xl'
        : 'modal-lg'
    "
    :showLoader="pendingAdd"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("materials.add_material") }}</h4>
    </template>
    <template v-slot:body_content>
      <form @submit.prevent="addMaterialSubmit" ref="addFormRef">
        <div v-if="currentMaterial" class="custom-grid">
          <uploadOrSelectFile
            v-if="currentMaterial.material_type_category === 'file'"
            :radioName="'upload_lesson_file'"
            :fileInputName="'lesson_file_name'"
            :uploadingFileName="'lesson_file'"
            :libraryFileName="'lesson_file_from_library'"
            :accept="currentMaterial.material_type_slug"
            :icon="currentMaterial.icon"
            :errors="errors"
          />
          <textEditor
            v-else-if="currentMaterial.material_type_slug === 'text'"
            :inputName="'lesson_text'"
            :errors="errors"
          />
          <editableTable
            v-else-if="currentMaterial.material_type_slug === 'table'"
            :tableName="'lesson_table'"
            :errors="errors"
          />
        </div>
        <div class="btn-wrap justify-end mt-4">
          <button class="btn btn-primary" type="submit">
            <i class="pi pi-check"></i>
            {{ $t("add") }}
          </button>
        </div>
      </form>
    </template>
  </modal>
</template>
<script setup>
import { useRouter } from "nuxt/app";
import dropdownMenu from "../../ui/dropdownMenu.vue";
import roleProvider from "../../ui/roleProvider.vue";
import modal from "../../ui/modal.vue";
import uploadOrSelectFile from "../../ui/uploadOrSelectFile.vue";
import textEditor from "../../ui/textEditor.vue";
import editableTable from "../../ui/editableTable.vue";
import materialsList from "../components/materialsList.vue";

const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const addModalIsVisible = ref(false);
const addFormRef = ref(null);
const pendingAdd = ref(false);
const currentMaterial = ref(null);
const errors = ref([]);

const getLesson = inject("getLesson");

const props = defineProps({
  lessonData: {
    type: Object,
    required: true,
  },
  materialTypes: {
    type: Object,
    required: true,
  },
});

const addMaterial = (material_type_slug, material_type_category, icon) => {
  currentMaterial.value = {
    material_type_slug,
    material_type_category,
    icon,
  };
  addModalIsVisible.value = true;
};

const closeAddModal = () => {
  pendingAdd.value = false;
  addModalIsVisible.value = false;
  currentMaterial.value = null;
  errors.value = [];
};

const addMaterialSubmit = async () => {
  pendingAdd.value = true;
  const formData = new FormData(addFormRef.value);
  formData.append("operation_type_id", 17);
  formData.append(
    "material_type_slug",
    currentMaterial.value.material_type_slug
  );

  await $axiosPlugin
    .post("courses/add_material/" + props.lessonData.lesson_id, formData)
    .then((response) => {
      closeAddModal();
      getLesson();
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
</script>
