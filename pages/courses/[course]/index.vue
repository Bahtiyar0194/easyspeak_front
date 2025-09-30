<template>
  <loader v-if="pending" :className="'full-overlay'" />
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
          <img
            :src="
              config.public.apiBase +
              '/media/get/' +
              level.course_name_slug +
              '.png'
            "
          />

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
        <p class="mb-0" v-if="requestIsSended === true">
          {{ $t("pages.courses.modal.sended") }}
        </p>
        <template v-else>
          <p>
            {{ $t("pages.courses.modal.description") }}
          </p>
          <form @submit.prevent="sendRequest" ref="formRef">
            <div class="custom-grid">
              <template v-if="!isSubdomain()">
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
                      :name="
                        index === selections.length - 1 ? 'location_id' : null
                      "
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
              </template>

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

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-user"></i>
                  <input
                    autoComplete="new-user-name"
                    name="first_name"
                    type="text"
                    placeholder=" "
                  />
                  <label :class="{ 'label-error': errors.first_name }">
                    {{
                      errors.first_name
                        ? errors.first_name[0]
                        : $t("form.first_name")
                    }}
                  </label>
                </div>
              </div>

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-mobile"></i>
                  <input
                    autoComplete="phone"
                    name="phone"
                    v-mask="'+7 (###) ###-####'"
                    placeholder=" "
                  />
                  <label :class="{ 'label-error': errors.phone }">
                    {{ errors.phone ? errors.phone[0] : $t("form.phone") }}
                  </label>
                </div>
              </div>

              <div class="col-span-12">
                <label class="custom-radio-checkbox">
                  <input type="checkbox" v-model="accept" />
                  <span
                    ><p>
                      {{ $t("pages.home.demo_modal.consent.text") }}
                      <nuxt-link to="/privacy-policy" target="_blank">{{
                        $t("pages.home.demo_modal.consent.link")
                      }}</nuxt-link
                      >{{ $t("pages.home.demo_modal.consent.text_2") }}
                    </p></span
                  >
                </label>
              </div>

              <button
                type="submit"
                class="btn btn-primary"
                :class="!accept ? 'disabled' : ''"
              >
                <i class="pi pi-arrow-right"></i>
                {{ $t("continue") }}
              </button>
            </div>
          </form>
        </template>
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
const requestIsSended = ref(false);
const accept = ref(false);
const errors = ref([]);
const formRef = ref(null);

const locations = ref([]);
const selectedLocationId = ref(null);
const selections = ref([]);
const schoolStore = useSchoolStore();
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
  levelModalIsVisible.value = true;
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

const sendRequest = async (course_id) => {
  pendingSend.value = true;
  const formData = new FormData(formRef.value);
  formData.append("lang", localeProperties.value.code);

  if (isSubdomain) {
    formData.append("school_domain", schoolStore.schoolData.school_domain);
    formData.append("school_id", schoolStore.schoolData.school_id);
  }

  await $axiosPlugin
    .post("/courses/send_request/" + currentLevel.value.level_id, formData)
    .then((res) => {
      requestIsSended.value = true;
      pendingSend.value = false;
      errors.value = [];
    })
    .catch((err) => {
      errors.value = err.response.data;
      pendingSend.value = false;
      return;
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
