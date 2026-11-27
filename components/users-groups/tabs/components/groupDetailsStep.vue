<template>
  <!-- Шаг 1 мастера группы: описание, курс и уровень, учитель, оплата.
       Один компонент для создания и редактирования (currentGroup) -->
  <div class="custom-grid">
    <div class="col-span-12">
      <div class="form-group-border active">
        <i class="pi pi-users"></i>
        <input
          v-model="form.group_name"
          autocomplete="off"
          name="group_name"
          type="text"
          placeholder=" "
        />
        <label :class="{ 'label-error': errs.group_name }">
          {{ fieldError("group_name") || $t("pages.groups.group_name") }}
        </label>
      </div>
    </div>

    <div class="col-span-12">
      <div class="form-group-border active">
        <i class="pi pi-align-left"></i>
        <textarea
          v-model="form.group_description"
          autocomplete="off"
          name="group_description"
          placeholder=" "
        ></textarea>
        <label :class="{ 'label-error': errs.group_description }">
          {{ fieldError("group_description") || $t("pages.groups.group_description") }}
        </label>
      </div>
    </div>

    <div class="col-span-12 sm:col-span-6">
      <div class="form-group-border select active label-active">
        <i class="pi pi-book"></i>
        <select name="course_id" v-model="form.course_id" @change="onCourseChange">
          <option disabled value="">
            {{ $t("pages.courses.choose_a_course") }}
          </option>
          <option
            v-for="course in attrs.courses"
            :key="course.course_id"
            :value="String(course.course_id)"
          >
            {{ course.course_name }}
          </option>
        </select>
        <label :class="{ 'label-error': errs.course_id }">
          {{ fieldError("course_id") || $t("pages.courses.course") }}
        </label>
      </div>
    </div>

    <div class="col-span-12 sm:col-span-6">
      <div class="form-group-border select active label-active">
        <i class="pi pi-chart-bar"></i>
        <select name="level_id" v-model="form.level_id" :disabled="!form.course_id">
          <option disabled value="">{{ $t("pages.groups.choose_level") }}</option>
          <option
            v-for="level in selectedCourse?.levels"
            :key="level.level_id"
            :value="String(level.level_id)"
          >
            {{ level.level_name }}
          </option>
        </select>
        <label :class="{ 'label-error': errs.level_id }">
          {{ fieldError("level_id") || $t("pages.groups.level") }}
        </label>
      </div>
    </div>

    <div class="col-span-12">
      <div class="form-group-border select active label-active">
        <i class="pi pi-user"></i>
        <select name="mentor_id" v-model="form.mentor_id">
          <option disabled value="">{{ $t("choose_a_mentor") }}</option>
          <option
            v-for="mentor in attrs.all_mentors"
            :key="mentor.user_id"
            :value="String(mentor.user_id)"
          >
            {{ mentor.last_name }} {{ mentor.first_name }}
          </option>
        </select>
        <label :class="{ 'label-error': errs.mentor_id }">
          {{ fieldError("mentor_id") || $t("mentor") }}
        </label>
      </div>
    </div>

    <!-- Форма оплаты: от неё зависит, кто отмечает оплаты -->
    <div class="col-span-12">
      <p class="mb-2 font-medium">{{ $t("pages.payment.choose_a_payment_form") }}</p>
      <div class="grid sm:grid-cols-2 gap-2">
        <label class="choice-card" :class="{ active: form.is_legal === '0' }">
          <input v-model="form.is_legal" type="radio" value="0" name="is_legal" />
          <span class="flex flex-col gap-0.5">
            <b>{{ $t("pages.payment.forms.natural_person") }}</b>
            <span class="text-xs text-inactive">{{ $t("pages.groups.natural_person_hint") }}</span>
          </span>
        </label>
        <label class="choice-card" :class="{ active: form.is_legal === '1' }">
          <input v-model="form.is_legal" type="radio" value="1" name="is_legal" />
          <span class="flex flex-col gap-0.5">
            <b>{{ $t("pages.payment.forms.legal_entity") }}</b>
            <span class="text-xs text-inactive">{{ $t("pages.groups.legal_entity_hint") }}</span>
          </span>
        </label>
      </div>
    </div>

    <div class="col-span-12 sm:col-span-6">
      <div class="form-group-border active">
        <i class="pi pi-wallet"></i>
        <input
          v-model="form.lesson_price"
          :readonly="priceLocked"
          :class="{ 'opacity-70': priceLocked }"
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
          name="lesson_price"
          placeholder=" "
        />
        <label :class="{ 'label-error': errs.lesson_price }">
          {{ fieldError("lesson_price") || $t("pages.groups.price_per_lesson") }}
          ({{ $contacts.bank.currency.symbol }})
        </label>
      </div>
      <p class="mb-0 mt-1 text-xs text-inactive">
        <template v-if="priceLocked">
          <i class="pi pi-lock text-[10px]" aria-hidden="true"></i>
          {{ $t("pages.lessons.price_edit") }}
        </template>
        <template v-else-if="formattedPrice">{{ formattedPrice }}</template>
      </p>
    </div>

    <div class="col-span-12 sm:col-span-6 flex items-center">
      <label class="custom-radio-checkbox">
        <input v-model="form.first_lesson_free" type="checkbox" name="first_lesson_free" />
        <span>{{ $t("pages.lessons.first_lesson_free") }}</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { hasRole } from "../../../../utils/hasRole";

const props = defineProps({
  errors: { type: Object, required: true },
  attributes: { type: Object, required: true },
  // Редактирование: данные группы; при создании — нет
  currentGroup: { type: Object, required: false, default: null },
});

// Шаги мастера получают ref внутри объекта (v-bind="step.props") — разворачиваем
const errs = computed(() => unref(props.errors) || {});
const attrs = computed(() => unref(props.attributes) || {});
const { $contacts } = useNuxtApp();
const { locale } = useI18n();

const group = computed(() => unref(props.currentGroup) || null);
const isEdit = computed(() => Boolean(group.value?.group_id));

const form = reactive({
  group_name: "",
  group_description: "",
  course_id: "",
  level_id: "",
  mentor_id: "",
  is_legal: "0",
  lesson_price: "",
  first_lesson_free: true,
});

// Редактирование: заполняем форму данными группы
watch(
  group,
  (g) => {
    if (!g?.group_id) return;
    form.group_name = g.group_name || "";
    form.group_description = g.group_description || "";
    form.course_id = g.level?.course_id ? String(g.level.course_id) : "";
    form.level_id = g.level_id ? String(g.level_id) : "";
    form.mentor_id = g.mentor_id ? String(g.mentor_id) : "";
    form.is_legal = String(g.is_legal ?? 0);
    form.lesson_price = g.current_price ?? "";
    form.first_lesson_free = g.first_lesson_free === 1;
  },
  { immediate: true },
);

const selectedCourse = computed(() =>
  attrs.value.courses?.find((c) => String(c.course_id) === form.course_id),
);

// Сменили курс — уровень прошлого курса не подходит
const onCourseChange = () => {
  form.level_id = "";
  if (isRef(props.errors)) props.errors.value = [];
};

// Цену в редактировании меняют только суперадминистратор и владелец школы
const priceLocked = computed(() => isEdit.value && !hasRole([1, 2]));

const formattedPrice = computed(() => {
  const n = Number(form.lesson_price);
  if (!form.lesson_price || !Number.isFinite(n)) return "";
  return (
    n.toLocaleString(String(locale.value || "ru").split("-")[0]) +
    " " +
    ($contacts?.bank?.currency?.symbol || "")
  );
});

const fieldError = (name) => {
  const value = errs.value?.[name];
  if (!value) return "";
  return Array.isArray(value) ? value[0] : String(value);
};
</script>
