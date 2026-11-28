<template>
  <!-- Добавление (levelSlug не задан) и правка уровня курса -->
  <modal
    :show="props.show"
    :onClose="close"
    :className="'modal-lg'"
    :showLoader="loading || saving"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>
        {{ isEdit ? $t("pages.courses.manage.edit_level_title") : $t("pages.courses.manage.add_level_title") }}
      </h4>
    </template>
    <template v-slot:body_content>
      <form class="mt-2 flex flex-col gap-4" @submit.prevent="submit">
        <div class="form-group-border active">
          <i class="pi pi-bookmark"></i>
          <input v-model="form.level_name_ru" autocomplete="off" type="text" placeholder=" " maxlength="100" />
          <label :class="{ 'label-error': errors.level_name_ru }">
            {{ errors.level_name_ru ? errors.level_name_ru[0] : $t("pages.courses.manage.level_name_ru") }}
          </label>
        </div>

        <div class="form-group-border active">
          <i class="pi pi-bookmark"></i>
          <input v-model="form.level_name_kk" autocomplete="off" type="text" placeholder=" " maxlength="100" />
          <label :class="{ 'label-error': errors.level_name_kk }">
            {{ errors.level_name_kk ? errors.level_name_kk[0] : $t("pages.courses.manage.level_name_kk") }}
          </label>
        </div>

        <div class="form-group-border active">
          <i class="pi pi-align-left"></i>
          <textarea v-model="form.level_description_ru" placeholder=" " rows="3" maxlength="1000"></textarea>
          <label :class="{ 'label-error': errors.level_description_ru }">
            {{
              errors.level_description_ru
                ? errors.level_description_ru[0]
                : $t("pages.courses.manage.description_ru")
            }}
          </label>
        </div>

        <div class="form-group-border active">
          <i class="pi pi-align-left"></i>
          <textarea v-model="form.level_description_kk" placeholder=" " rows="3" maxlength="1000"></textarea>
          <label :class="{ 'label-error': errors.level_description_kk }">
            {{
              errors.level_description_kk
                ? errors.level_description_kk[0]
                : $t("pages.courses.manage.description_kk")
            }}
          </label>
        </div>

        <button
          class="btn btn-primary self-start"
          :class="{ loading: saving }"
          :disabled="saving || loading"
          type="submit"
        >
          <i :class="isEdit ? 'pi pi-check' : 'pi pi-plus'" aria-hidden="true"></i>
          {{ isEdit ? $t("save") : $t("add") }}
        </button>
      </form>
    </template>
  </modal>
</template>

<script setup>
import modal from "../ui/modal.vue";
import { useRouter } from "nuxt/app";

const props = defineProps({
  show: { type: Boolean, required: true },
  courseSlug: { type: String, required: true },
  // slug уровня для правки; пусто — добавление
  levelSlug: { type: String, required: false, default: "" },
  onClose: { type: Function, required: true },
  onSaved: { type: Function, required: false },
});

const { t } = useI18n();
const notify = useNotify();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();

const isEdit = computed(() => !!props.levelSlug);

const emptyForm = () => ({
  level_name_ru: "",
  level_name_kk: "",
  level_description_ru: "",
  level_description_kk: "",
});

const form = ref(emptyForm());
const errors = ref({});
const loading = ref(false);
const saving = ref(false);

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
  errors.value = {};
  form.value = emptyForm();
  if (!isEdit.value) return;

  loading.value = true;
  await $axiosPlugin
    .get(`courses/manage/${props.courseSlug}/${props.levelSlug}`)
    .then((response) => {
      const l = response.data;
      form.value = {
        level_name_ru: l.level_name_ru || "",
        level_name_kk: l.level_name_kk || "",
        level_description_ru: l.level_description_ru || "",
        level_description_kk: l.level_description_kk || "",
      };
      loading.value = false;
    })
    .catch((err) => {
      loading.value = false;
      props.onClose();
      toErrorPage(err);
    });
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

  const url = isEdit.value
    ? `courses/manage/${props.courseSlug}/${props.levelSlug}/update`
    : `courses/manage/${props.courseSlug}/add_level`;

  await $axiosPlugin
    .post(url, form.value)
    .then((response) => {
      saving.value = false;
      notify("success", isEdit.value ? t("pages.courses.manage.level_saved") : t("pages.courses.manage.level_added"));
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
  props.onClose();
};
</script>
