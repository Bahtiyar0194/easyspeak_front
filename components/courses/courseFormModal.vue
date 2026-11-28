<template>
  <!-- Создание (courseSlug не задан) и правка курса -->
  <modal
    :show="props.show"
    :onClose="close"
    :className="'modal-lg'"
    :showLoader="loading || saving"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>
        {{
          isEdit ? $t("pages.courses.manage.edit_title") : $t("pages.courses.manage.create_title")
        }}
      </h4>
    </template>
    <template v-slot:body_content>
      <form class="mt-2 flex flex-col gap-4" ref="formRef" @submit.prevent="submit">
        <div class="form-group-border active">
          <i class="pi pi-book"></i>
          <input v-model="form.course_name_ru" autocomplete="off" type="text" placeholder=" " maxlength="100" />
          <label :class="{ 'label-error': errors.course_name_ru }">
            {{ errors.course_name_ru ? errors.course_name_ru[0] : $t("pages.courses.manage.name_ru") }}
          </label>
        </div>

        <div class="form-group-border active">
          <i class="pi pi-book"></i>
          <input v-model="form.course_name_kk" autocomplete="off" type="text" placeholder=" " maxlength="100" />
          <label :class="{ 'label-error': errors.course_name_kk }">
            {{ errors.course_name_kk ? errors.course_name_kk[0] : $t("pages.courses.manage.name_kk") }}
          </label>
        </div>

        <div class="form-group-border select active label-active">
          <i class="pi pi-globe"></i>
          <select v-model="form.target_lang">
            <option v-for="lang in languages" :key="lang.code" :value="lang.code">
              {{ lang.name }}
            </option>
          </select>
          <label :class="{ 'label-error': errors.target_lang }">
            {{ errors.target_lang ? errors.target_lang[0] : $t("pages.courses.manage.target_lang") }}
          </label>
        </div>

        <div class="form-group-border active">
          <i class="pi pi-align-left"></i>
          <textarea v-model="form.course_description_ru" placeholder=" " rows="3" maxlength="1000"></textarea>
          <label :class="{ 'label-error': errors.course_description_ru }">
            {{
              errors.course_description_ru
                ? errors.course_description_ru[0]
                : $t("pages.courses.manage.description_ru")
            }}
          </label>
        </div>

        <div class="form-group-border active">
          <i class="pi pi-align-left"></i>
          <textarea v-model="form.course_description_kk" placeholder=" " rows="3" maxlength="1000"></textarea>
          <label :class="{ 'label-error': errors.course_description_kk }">
            {{
              errors.course_description_kk
                ? errors.course_description_kk[0]
                : $t("pages.courses.manage.description_kk")
            }}
          </label>
        </div>

        <!-- Текущая обложка: заменить или убрать -->
        <div v-if="currentPoster && !removePoster && !replacingPoster" class="course-poster-current">
          <img :src="currentPosterUrl" alt="" />
          <div class="flex flex-col gap-2 min-w-0">
            <p class="mb-0 font-medium">{{ $t("pages.courses.manage.poster") }}</p>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn btn-sm btn-light" @click="replacingPoster = true">
                <i class="pi pi-replay" aria-hidden="true"></i>
                {{ $t("file.replace.replace") }}
              </button>
              <button type="button" class="btn btn-sm btn-light" @click="removePoster = true">
                <i class="pi pi-trash" aria-hidden="true"></i>
                {{ $t("delete") }}
              </button>
            </div>
          </div>
        </div>

        <template v-else>
          <fileUploadButton
            :id="'course_poster_' + (props.courseSlug || 'new')"
            :name="'poster'"
            :accept="'image/jpeg,image/png,image/webp'"
            :error="errors.poster"
            :icon="'pi pi-image'"
            :label="$t('pages.courses.manage.poster_hint')"
          />
          <button
            v-if="currentPoster"
            type="button"
            class="btn btn-sm btn-light self-start"
            @click="cancelPosterChange"
          >
            <i class="pi pi-undo" aria-hidden="true"></i>
            {{ $t("pages.courses.manage.keep_poster") }}
          </button>
        </template>

        <button
          class="btn btn-primary self-start"
          :class="{ loading: saving }"
          :disabled="saving || loading"
          type="submit"
        >
          <i :class="isEdit ? 'pi pi-check' : 'pi pi-plus'" aria-hidden="true"></i>
          {{ isEdit ? $t("save") : $t("create") }}
        </button>
      </form>
    </template>
  </modal>
</template>

<script setup>
import modal from "../ui/modal.vue";
import fileUploadButton from "../ui/fileUploadButton.vue";
import { useRouter } from "nuxt/app";

const props = defineProps({
  show: { type: Boolean, required: true },
  // slug курса для правки; пусто — создание
  courseSlug: { type: String, required: false, default: "" },
  onClose: { type: Function, required: true },
  onSaved: { type: Function, required: false },
});

const { t } = useI18n();
const notify = useNotify();
const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();

const isEdit = computed(() => !!props.courseSlug);

const emptyForm = () => ({
  course_name_ru: "",
  course_name_kk: "",
  course_description_ru: "",
  course_description_kk: "",
  target_lang: "en",
});

const form = ref(emptyForm());
const errors = ref({});
const languages = ref([]);
const loading = ref(false);
const saving = ref(false);
const formRef = ref(null);

const currentPoster = ref(null);
const removePoster = ref(false);
const replacingPoster = ref(false);
const currentPosterUrl = computed(() =>
  currentPoster.value ? `${config.public.apiBase}/media/get/${currentPoster.value}` : "",
);

const cancelPosterChange = () => {
  removePoster.value = false;
  replacingPoster.value = false;
  delete errors.value.poster;
};

const toErrorPage = (err) => {
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
};

const load = async () => {
  loading.value = true;
  errors.value = {};
  form.value = emptyForm();
  currentPoster.value = null;
  removePoster.value = false;
  replacingPoster.value = false;

  try {
    const requests = [$axiosPlugin.get("courses/manage/form_attributes")];
    if (isEdit.value) requests.push($axiosPlugin.get("courses/manage/" + props.courseSlug));
    const [attrs, course] = await Promise.all(requests);

    languages.value = attrs.data.languages;
    if (course) {
      const c = course.data;
      form.value = {
        course_name_ru: c.course_name_ru || "",
        course_name_kk: c.course_name_kk || "",
        course_description_ru: c.course_description_ru || "",
        course_description_kk: c.course_description_kk || "",
        target_lang: c.target_lang || "en",
      };
      currentPoster.value = c.course_poster_file;
    }
    loading.value = false;
  } catch (err) {
    props.onClose();
    toErrorPage(err);
  }
};

watch(
  () => props.show,
  (visible) => {
    if (visible) load();
  },
  { immediate: true },
);

const submit = async () => {
  if (saving.value) return;
  saving.value = true;
  errors.value = {};

  const formData = new FormData();
  Object.entries(form.value).forEach(([key, value]) => formData.append(key, value ?? ""));
  const file = formRef.value?.querySelector('input[name="poster"]')?.files?.[0];
  if (file) formData.append("poster", file);
  else if (removePoster.value) formData.append("remove_poster", 1);

  const url = isEdit.value
    ? "courses/manage/" + props.courseSlug + "/update"
    : "courses/manage/create";

  await $axiosPlugin
    .post(url, formData)
    .then((response) => {
      saving.value = false;
      notify("success", isEdit.value ? t("pages.courses.manage.saved") : t("pages.courses.manage.created"));
      props.onSaved?.(response.data);
      close();
    })
    .catch((err) => {
      saving.value = false;
      if (err.response?.status == 422) {
        errors.value = err.response.data;
      } else {
        close();
        toErrorPage(err);
      }
    });
};

const close = () => {
  if (saving.value) return;
  formRef.value?.reset();
  props.onClose();
};
</script>
