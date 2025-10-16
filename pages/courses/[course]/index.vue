<template>
  <loader v-if="pending" :className="'full-overlay'" :showPendingText="true" />
  <div class="custom-grid">
    <div class="col-span-12">
      <h1>{{ pageTitle }}</h1>
    </div>
    <div
      v-for="(level, levelIndex) in levels"
      :key="levelIndex"
      class="col-span-12 lg:col-span-4"
    >
      <button @click="selectLevel(levelIndex)">
        <div class="card relative overflow-hidden group">
          <img :src="`/images/courses/${level.course_name_slug}.png`" />

          <div
            class="absolute left-0 bottom-0 w-full h-12 group-hover:h-full transition-all duration-200 bg-black bg-opacity-60 flex justify-center items-center group-hover:items-center p-4"
          >
            <div class="flex flex-col gap-y-1">
              <h3 class="mb-0 text-white text-center">
                {{ level.level_name }}
              </h3>
            </div>
          </div>
        </div>
      </button>
    </div>
  </div>

  <client-only>
    <modal
      :show="levelModalIsVisible"
      :onClose="() => (levelModalIsVisible = false)"
      :className="'modal-lg'"
      :showLoader="pendingSend"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4 v-if="currentLevel">{{ currentLevel.level_name }}</h4>
      </template>
      <template v-slot:body_content>
        <form @submit.prevent="sendRequest" ref="formRef">
          <div class="custom-grid">
            <div class="col-span-12">
              <div class="bg-corp text-white p-4 rounded-xl">
                <p class="mb-1">
                  <b>
                    {{ $t("pages.courses.modal.description") }}
                  </b>
                </p>
              </div>
            </div>
            <div
              v-for="(level, index) in selections"
              :key="index"
              class="col-span-12"
            >
              <div class="form-group-border select active label-active">
                <i class="pi pi-map-marker"></i>
                <select
                  v-model="level.selectedId"
                  @change="onSelectLocation(index)"
                  :name="index === selections.length - 1 ? 'location_id' : null"
                >
                  <option disabled value="">
                    {{ $t("form.select_a_point") }}
                  </option>
                  <option
                    v-for="option in level.options"
                    :key="option.location_id"
                    :value="option.location_id"
                  >
                    {{ option.location_name }}
                  </option>
                </select>
                <label
                  :class="{
                    'label-error':
                      errors.location_id && index === selections.length - 1,
                  }"
                >
                  {{
                    $t(
                      index > 0
                        ? "form.select_an_internal_point"
                        : "form.select_a_point"
                    )
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12" v-if="schools.length > 0">
              <div class="form-group-border select active label-active">
                <i class="pi pi-building-columns"></i>
                <select name="school_id">
                  <option disabled selected value="">
                    {{ $t("form.select_a_school") }}
                  </option>
                  <option
                    v-for="school in schools"
                    :key="school.school_id"
                    :value="school.school_id"
                    v-html="
                      `${school.school_name} (${school.full_school_name})`
                    "
                  />
                </select>
                <label
                  :class="{
                    'label-error': errors.school_id,
                  }"
                >
                  {{ $t("form.select_a_school") }}
                </label>
              </div>
            </div>

            <div
              v-if="
                errors.school_id && schools.length === 0 && selectedLocationId
              "
              class="col-span-12"
            >
              <p class="text-danger mb-0">
                {{ $t("form.schools_not_found") }}
              </p>
            </div>

            <button type="submit" class="btn btn-primary">
              <i class="pi pi-arrow-right"></i>
              {{ $t("continue") }}
            </button>
          </div>
        </form>
      </template>
    </modal>
  </client-only>
</template>

<script setup>
import modal from "../../../components/ui/modal.vue";
import loader from "../../../../components/ui/loader.vue";
import { isSubdomain } from "../../../utils/isSubdomain";
import { useRouter } from "nuxt/app";
import { useRoute } from "vue-router";
const authUser = useSanctumUser();
const { localeProperties } = useI18n();
const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();
const course_slug = route.params.course;

const { $axiosPlugin } = useNuxtApp();
const pending = ref(true);
const levels = ref([]);
const currentLevel = ref(null);
const levelModalIsVisible = ref(false);
const pendingSend = ref(false);
const errors = ref([]);
const formRef = ref(null);

const locations = ref([]);
const selectedLocationId = ref(null);
const selections = ref([]);
const schools = ref([]);

const pageTitle = ref("");

useHead(() => ({
  title: pageTitle.value,
  meta: [{ name: "description", content: "Courses" }],
}));

const getLevels = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("courses/get_levels_index/" + course_slug)
    .then((response) => {
      const courseCrumbItem = document.querySelector(
        'span[data-crumb="[course]"]'
      );

      // Проверить, найден ли элемент
      if (courseCrumbItem) {
        // Изменить текст внутри элемента
        courseCrumbItem.textContent = response.data.course.course_name;
      }

      pageTitle.value = response.data.course.course_name;

      levels.value = response.data.levels;
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

const getCities = async () => {
  await $axiosPlugin
    .get("/locations/get")
    .then((res) => {
      locations.value = res.data;
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

const getSchools = async (location_id) => {
  pendingSend.value = true;
  schools.value = [];
  await $axiosPlugin
    .get("/school/get_schools_from_city/" + location_id)
    .then((res) => {
      pendingSend.value = false;
      schools.value = res.data;
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

const selectLevel = (levelIndex) => {
  currentLevel.value = levels.value[levelIndex];
  if (!isSubdomain()) {
    levelModalIsVisible.value = true;
  } else {
    if (authUser.value) {
      router.push(
        "/dashboard/courses/" +
          currentLevel.value.course_name_slug +
          "/" +
          currentLevel.value.level_slug
      );
    } else {
      router.push(
        "/auth/register?course=" + currentLevel.value.course_name_slug
      );
    }
  }
};

const onSelectLocation = (levelIndex) => {
  selectedLocationId.value = null;
  const selectedLevel = selections.value[levelIndex];
  const selectedOption = selectedLevel.options.find(
    (opt) => opt.location_id === selectedLevel.selectedId
  );

  // Удалить все уровни ниже текущего
  selections.value.splice(levelIndex + 1);

  // Если есть дети — добавить новый select
  if (selectedOption?.childs?.length) {
    selections.value.push({
      options: selectedOption.childs,
      selectedId: "",
    });
  } else {
    getSchools(selectedOption.location_id);
    selectedLocationId.value = selectedOption.location_id;
  }
};

const sendRequest = async () => {
  pendingSend.value = true;
  const formData = new FormData(formRef.value);
  formData.append("lang", localeProperties.value.code);

  await $axiosPlugin
    .post("/courses/send_request", formData)
    .then((res) => {
      const url =
        window.location.protocol +
        "//" +
        res.data +
        "." +
        window.location.host +
        "/auth/register?course=" +
        currentLevel.value.course_name_slug;
      window.location.href = url;
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingSend.value = false;
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

onMounted(() => {
  getCities();
  getLevels();
});

watch(
  () => locations.value,
  (newTree) => {
    if (Array.isArray(newTree) && newTree.length > 0) {
      selections.value = [
        {
          options: newTree[0].childs,
          selectedId: "",
        },
      ];
    }
  },
  { immediate: true } // сразу при монтировании если данные уже есть
);
</script>
