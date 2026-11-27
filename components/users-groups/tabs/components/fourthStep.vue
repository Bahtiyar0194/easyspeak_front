<template>
  <!-- Шаг 4: всё, что будет сохранено, — блоками; «Изменить» ведёт на шаг -->
  <div v-if="data" class="flex flex-col gap-3">
    <section class="summary-block">
      <div class="summary-block-head">
        <h5 class="mb-0">{{ $t("pages.groups.group_description") }}</h5>
        <button v-if="goToStep" type="button" class="btn btn-sm btn-light" @click="goToStep(1)">
          <i class="pi pi-pencil" aria-hidden="true"></i>{{ $t("edit") }}
        </button>
      </div>
      <dl class="school-dl">
        <dt>{{ $t("pages.groups.group_name") }}</dt>
        <dd>{{ data.group_name }}</dd>

        <template v-if="data.group_description">
          <dt>{{ $t("pages.groups.group_description") }}</dt>
          <dd class="whitespace-pre-line">{{ data.group_description }}</dd>
        </template>

        <dt>{{ $t("pages.groups.level") }}</dt>
        <dd>
          <template v-if="summary.course_name">{{ summary.course_name }} · </template>{{ data.level_name }}
        </dd>

        <dt>{{ $t("mentor") }}</dt>
        <dd><userTag v-if="data.mentor" :user="data.mentor" class="w-fit" /></dd>

        <dt>{{ $t("pages.payment.payment_form") }}</dt>
        <dd>
          {{
            summary.is_legal === "1"
              ? $t("pages.payment.forms.legal_entity")
              : $t("pages.payment.forms.natural_person")
          }}
        </dd>

        <dt>{{ $t("pages.groups.price_per_lesson") }}</dt>
        <dd>{{ formatMoney(summary.lesson_price) }}</dd>

        <dt>{{ $t("pages.lessons.first_lesson_free") }}</dt>
        <dd>{{ summary.first_lesson_free ? $t("yes") : $t("no") }}</dd>
      </dl>
    </section>

    <section class="summary-block">
      <div class="summary-block-head">
        <h5 class="mb-0">{{ $t("pages.schedule.title") }}</h5>
        <button v-if="goToStep" type="button" class="btn btn-sm btn-light" @click="goToStep(2)">
          <i class="pi pi-pencil" aria-hidden="true"></i>{{ $t("edit") }}
        </button>
      </div>
      <dl class="school-dl">
        <dt>{{ $t("pages.schedule.start_date") }}</dt>
        <dd>{{ formatDate(summary.start_date) }}</dd>

        <dt>{{ $t("pages.schedule.lesson_days") }}</dt>
        <dd>
          <span v-if="summary.days?.length" class="flex flex-wrap gap-1.5">
            <span v-for="day in summary.days" :key="day.id" class="role-chip">
              {{ day.name }} · {{ day.start_time }}
            </span>
          </span>
        </dd>

        <dt>{{ $t("pages.lessons.all_lessons_is_conference") }}</dt>
        <dd>{{ summary.all_lessons_is_conference ? $t("yes") : $t("no") }}</dd>

        <template v-if="summary.schedule_option">
          <dt>{{ $t("pages.schedule.options") }}</dt>
          <dd :class="{ 'text-danger': summary.schedule_option === 'new_schedule' }">
            {{ $t(`pages.schedule.${summary.schedule_option}.title`) }}
          </dd>
        </template>
      </dl>
    </section>

    <section class="summary-block">
      <div class="summary-block-head">
        <h5 class="mb-0">
          {{ $t("pages.groups.members") }}
          <span class="db-count">{{ members.length }}</span>
        </h5>
        <button v-if="goToStep" type="button" class="btn btn-sm btn-light" @click="goToStep(3)">
          <i class="pi pi-pencil" aria-hidden="true"></i>{{ $t("edit") }}
        </button>
      </div>
      <div v-if="members.length" class="btn-wrap">
        <userTag v-for="member in members" :key="member.user_id" :user="member" />
      </div>
    </section>
  </div>
</template>
<script setup>
import userTag from "../../../ui/userTag.vue";

const props = defineProps({
  errors: { type: Object, required: true },
  groupData: { type: Object, required: true },
  // Переход на шаг мастера для правки
  goToStep: { type: Function, default: null },
});

const { $contacts } = useNuxtApp();
const { locale } = useI18n();
const intlLocale = computed(() => String(locale.value || "ru").split("-")[0]);

// Шаги мастера получают ref внутри объекта — разворачиваем
const data = computed(() => {
  const value = unref(props.groupData);
  return value && value.group_name !== undefined ? value : null;
});
const summary = computed(() => data.value?.summary || {});

const members = computed(() => {
  const raw = data.value?.members;
  if (!raw) return [];
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return [];
  }
});

const formatMoney = (value) => {
  const n = Number(value);
  if (value === "" || value === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString(intlLocale.value) + " " + ($contacts?.bank?.currency?.symbol || "");
};

const formatDate = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString(intlLocale.value, {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";
</script>
