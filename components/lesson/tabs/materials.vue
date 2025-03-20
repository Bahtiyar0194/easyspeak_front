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
      <TransitionGroup
        tag="ul"
        class="list-group"
        :move="{ transition: { duration: 0.3 } }"
      >
        <li
          v-for="(material, materialIndex) in props.lessonData.materials"
          :key="material.lesson_material_id"
        >
          <div class="flex items-center justify-between gap-4">
            <div
              class="flex gap-2 items-center link w-full"
              @click="openMaterial(material)"
            >
              <i
                class="text-3xl"
                :class="material.file_icon || material.block_icon"
              ></i>
              <div class="flex flex-col gap-y-0.5">
                <span>{{ material.annotation }}</span>
                <span class="text-inactive text-xs">{{
                  material.file_material_type_name ||
                  material.block_material_type_name
                }}</span>
              </div>
            </div>

            <roleProvider :roles="[1]">
              <div class="flex gap-x-1 justify-end">
                <button
                  @click="order('up', materialIndex, $event.target)"
                  class="btn btn-square btn-light btn-sm btn-up"
                  :title="$t('move_up')"
                >
                  <i class="pi pi-arrow-up"></i>
                </button>
                <button
                  @click="order('down', materialIndex, $event.target)"
                  class="btn btn-square btn-light btn-sm btn-down"
                  :title="$t('move_down')"
                >
                  <i class="pi pi-arrow-down"></i>
                </button>
                <button
                  @click="openDeleteModal(material)"
                  class="btn btn-square btn-outline-danger btn-sm"
                  :title="$t('delete')"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </roleProvider>
          </div>
        </li>
      </TransitionGroup>
    </div>

    <div v-else class="col-span-12">
      <alert :className="'light'">
        <p class="mb-0">{{ $t("pages.lessons.there_are_no_materials") }}</p>
      </alert>
    </div>
  </div>

  <modal
    :show="materialModalIsVisible"
    :onClose="() => closeMaterialModal()"
    :className="'modal-4xl'"
    :showLoader="false"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ currentMaterial?.annotation }}</h4>
    </template>
    <template v-slot:body_content>
      <materialViewer
        v-if="currentMaterial?.lesson_material_id"
        :material="currentMaterial"
      />
    </template>
  </modal>

  <modal
    :show="addModalIsVisible"
    :onClose="() => closeAddModal()"
    :className="
      currentMaterialType &&
      currentMaterialType.material_type_category === 'block'
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
        <div v-if="currentMaterialType" class="custom-grid">
          <div class="col-span-12 mt-2">
            <div class="form-group-border active">
              <i class="pi pi-thumbtack"></i>
              <input name="annotation" type="text" placeholder=" " />
              <label :class="{ 'label-error': errors.annotation }">
                {{
                  errors.annotation
                    ? errors.annotation[0]
                    : $t("materials.annotation")
                }}
              </label>
            </div>
          </div>
          <uploadOrSelectFile
            v-if="currentMaterialType.material_type_category === 'file'"
            :radioName="'upload_lesson_file'"
            :fileInputName="'lesson_file_name'"
            :uploadingFileName="'lesson_file'"
            :libraryFileName="'lesson_file_from_library'"
            :accept="currentMaterialType.material_type_slug"
            :icon="currentMaterialType.icon"
            :errors="errors"
          />
          <textEditor
            v-else-if="currentMaterialType.material_type_slug === 'text'"
            :inputName="'lesson_text'"
            :errors="errors"
          />
          <editableTable
            v-else-if="currentMaterialType.material_type_slug === 'table'"
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

  <modal
    :show="deleteModalIsVisible"
    :onClose="() => (deleteModalIsVisible = false)"
    :className="'modal-lg'"
    :showLoader="pendingDelete"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <h4>{{ $t("materials.delete_material") }}</h4>
    </template>
    <template v-slot:body_content>
      <p>{{ $t("materials.delete_confirm") }}</p>
      <div class="btn-wrap justify-end mt-4">
        <button @click="deleteMaterialSubmit()" class="btn btn-outline-danger">
          <i class="pi pi-trash"></i>
          {{ $t("yes") }}
        </button>
        <button @click="deleteModalIsVisible = false" class="btn btn-light">
          <i class="pi pi-ban"></i>
          {{ $t("no") }}
        </button>
      </div>
    </template>
  </modal>
</template>
<script setup>
import { scrollIntoView } from "seamless-scroll-polyfill";
import { useRouter } from "nuxt/app";
import dropdownMenu from "../../ui/dropdownMenu.vue";
import roleProvider from "../../ui/roleProvider.vue";
import modal from "../../ui/modal.vue";
import uploadOrSelectFile from "../../ui/uploadOrSelectFile.vue";
import textEditor from "../../ui/textEditor.vue";
import editableTable from "../../ui/editableTable.vue";
import materialViewer from "../components/materialViewer.vue";
import alert from "../../ui/alert.vue";
import { debounceHandler } from "../../../utils/debounceHandler";

const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const materialModalIsVisible = ref(false);
const addModalIsVisible = ref(false);
const deleteModalIsVisible = ref(false);
const addFormRef = ref(null);
const pendingAdd = ref(false);
const pendingDelete = ref(false);
const currentMaterial = ref(null);
const currentMaterialType = ref(null);
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

const openMaterial = (material) => {
  currentMaterial.value = null;
  setTimeout(() => {
    currentMaterial.value = material;
    materialModalIsVisible.value = true;
  }, 100);
};

const closeMaterialModal = () => {
  currentMaterial.value = null;
  materialModalIsVisible.value = false;
};

const addMaterial = (material_type_slug, material_type_category, icon) => {
  currentMaterialType.value = {
    material_type_slug,
    material_type_category,
    icon,
  };
  addModalIsVisible.value = true;
};

const closeAddModal = () => {
  pendingAdd.value = false;
  addModalIsVisible.value = false;
  currentMaterialType.value = null;
  errors.value = [];
};

const addMaterialSubmit = async () => {
  pendingAdd.value = true;
  const formData = new FormData(addFormRef.value);
  formData.append("operation_type_id", 17);
  formData.append(
    "material_type_slug",
    currentMaterialType.value.material_type_slug
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

const orderMaterials = async () => {
  const form_data = new FormData();
  form_data.append(
    "lesson_materials",
    JSON.stringify(props.lessonData.materials)
  );
  form_data.append("operation_type_id", 20);
  await $axiosPlugin
    .post("courses/order_materials/" + props.lessonData.lesson_id, form_data)
    .then((response) => {
      //getLessonTasks();
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

const debounceOrder = debounceHandler(orderMaterials, 2000);

const order = (direction, index, event) => {
  const parent = event.closest("li");

  if (direction === "up" && index > 0) {
    [props.lessonData.materials[index - 1], props.lessonData.materials[index]] =
      [
        props.lessonData.materials[index],
        props.lessonData.materials[index - 1],
      ];
  } else if (
    direction === "down" &&
    index < props.lessonData.materials.length - 1
  ) {
    [props.lessonData.materials[index], props.lessonData.materials[index + 1]] =
      [
        props.lessonData.materials[index + 1],
        props.lessonData.materials[index],
      ];
  }

  scrollIntoView(parent, {
    behavior: "smooth",
    block: "center",
    inline: "center",
  });

  debounceOrder();
};

const openDeleteModal = (material) => {
  currentMaterial.value = material;
  deleteModalIsVisible.value = true;
};

const deleteMaterialSubmit = async () => {
  pendingDelete.value = true;
  const formData = new FormData();
  formData.append("operation_type_id", 23);

  await $axiosPlugin
    .post(
      "courses/delete_material/" +
        props.lessonData.lesson_id +
        "/" +
        currentMaterial.value.lesson_material_id,
      formData
    )
    .then((response) => {
      deleteModalIsVisible.value = false;
      getLesson();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
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
    })
    .finally(() => {
      pendingDelete.value = false;
    });
};
</script>
