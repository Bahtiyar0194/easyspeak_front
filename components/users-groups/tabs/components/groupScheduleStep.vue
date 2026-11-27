<template>
  <!-- Шаг 2 мастера группы: дата старта, дни и время уроков.
       Один компонент для создания и редактирования (currentGroup) -->
  <div class="custom-grid">
    <div class="col-span-12">
      <div class="form-group-border active">
        <i class="pi pi-calendar"></i>
        <input v-model="startDate" type="date" name="start_date" />
        <label :class="{ 'label-error': errs.start_date }">
          {{ fieldError("start_date") || $t("pages.schedule.start_date") }}
        </label>
      </div>
    </div>

    <!-- Дни недели — кнопками -->
    <div class="col-span-12">
      <p class="mb-2 font-medium" :class="{ 'text-danger': errs.selected_day }">
        {{
          errs.selected_day
            ? $t("pages.schedule.select_lesson_days")
            : $t("pages.schedule.lesson_days")
        }}
      </p>
      <div class="day-chips" role="group" :aria-label="$t('pages.schedule.lesson_days')">
        <button
          v-for="day in days"
          :key="day.id"
          type="button"
          class="day-chip"
          :class="{ active: day.selected }"
          :aria-pressed="day.selected"
          :title="day.name"
          @click="toggleDay(day)"
        >
          {{ shortDay(day.id) }}
        </button>
      </div>
    </div>

    <!-- Время — только у выбранных дней -->
    <div v-if="chosenDays.length" class="col-span-12">
      <div class="flex flex-col gap-2">
        <div
          v-for="day in chosenDays"
          :key="day.id"
          class="flex items-center gap-3"
        >
          <span class="w-28 shrink-0 text-sm font-medium capitalize">{{ day.name }}</span>
          <div class="form-group-border active flex-1">
            <i class="pi pi-clock"></i>
            <input type="time" v-model="day.start_time" />
            <label
              :class="{ 'label-error': errs.start_time && !day.start_time }"
            >
              {{
                errs.start_time && !day.start_time
                  ? fieldError("start_time")
                  : $t("pages.schedule.start_time")
              }}
            </label>
          </div>
        </div>

        <button
          v-if="chosenDays.length > 1 && firstTime"
          type="button"
          class="btn btn-sm btn-light w-fit"
          @click="sameTimeForAll"
        >
          <i class="pi pi-clone" aria-hidden="true"></i>
          {{ $t("pages.groups.same_time_for_all", { time: firstTime }) }}
        </button>
      </div>
    </div>

    <!-- Предпросмотр: сколько в неделю и когда первый урок -->
    <div v-if="preview" class="col-span-12">
      <div class="move-summary">
        <p class="mb-0">
          <i class="pi pi-calendar-clock text-corp text-xs" aria-hidden="true"></i>
          {{ $t("pages.groups.lessons_per_week", { count: chosenDays.length }) }}
          <template v-if="preview.first">
            · {{ $t("pages.groups.first_lesson") }}: <b>{{ preview.first }}</b>
          </template>
        </p>
      </div>
    </div>

    <!-- Редактирование: что делать с уже составленным расписанием -->
    <div v-if="isEdit" class="col-span-12">
      <p class="mb-2 font-medium">{{ $t("pages.schedule.options") }}</p>
      <div class="flex flex-col gap-2">
        <label class="choice-card" :class="{ active: scheduleOption === 'only_future' }">
          <input v-model="scheduleOption" type="radio" value="only_future" name="schedule_option" />
          <span class="flex flex-col gap-0.5">
            <b>{{ $t("pages.schedule.only_future.title") }}</b>
            <span class="text-xs text-inactive">{{ $t("pages.schedule.only_future.description") }}</span>
          </span>
        </label>
        <label
          class="choice-card danger"
          :class="{ active: scheduleOption === 'new_schedule' }"
        >
          <input v-model="scheduleOption" type="radio" value="new_schedule" name="schedule_option" />
          <span class="flex flex-col gap-0.5">
            <b>{{ $t("pages.schedule.new_schedule.title") }}</b>
            <span class="text-xs text-inactive">{{ $t("pages.schedule.new_schedule.description") }}</span>
          </span>
        </label>
      </div>
    </div>

    <div class="col-span-12">
      <label class="custom-radio-checkbox">
        <input
          v-model="allConference"
          type="checkbox"
          name="all_lessons_is_conference"
        />
        <span>{{ $t("pages.lessons.all_lessons_is_conference") }}</span>
      </label>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  errors: { type: Object, required: true },
  selectedDays: { type: Object, required: true },
  // Редактирование: данные группы; при создании — нет
  currentGroup: { type: Object, required: false, default: null },
});

const { locale } = useI18n();
const intlLocale = computed(() => String(locale.value || "ru").split("-")[0]);

// Шаги мастера получают ref внутри объекта (v-bind="step.props") — разворачиваем
const errs = computed(() => unref(props.errors) || {});
const days = computed(() => unref(props.selectedDays) || []);
const group = computed(() => unref(props.currentGroup) || null);
const isEdit = computed(() => Boolean(group.value?.group_id));

const startDate = ref("");
const scheduleOption = ref("only_future");
const allConference = ref(false);

watch(
  group,
  (g) => {
    if (!g?.group_id) return;
    startDate.value = g.start_date || "";
    allConference.value = g.all_lessons_is_conference === 1;
    scheduleOption.value = "only_future";
  },
  { immediate: true },
);

const chosenDays = computed(() => days.value.filter((d) => d.selected));
const firstTime = computed(() => chosenDays.value.find((d) => d.start_time)?.start_time || "");

const toggleDay = (day) => {
  day.selected = !day.selected;
  // Новый день — подставляем время уже выбранных, чтобы не вводить заново
  if (day.selected && !day.start_time && firstTime.value) day.start_time = firstTime.value;
};

const sameTimeForAll = () => {
  for (const day of chosenDays.value) day.start_time = firstTime.value;
};

// id дня: 1 — понедельник … 7 — воскресенье. 1 января 2024 — понедельник
const dayDate = (id) => new Date(2024, 0, id);
const shortDay = (id) => {
  const s = dayDate(id).toLocaleDateString(intlLocale.value, { weekday: "short" });
  return s.charAt(0).toUpperCase() + s.slice(1).replace(".", "");
};

// Первый урок: ближайший выбранный день начиная с даты старта
const preview = computed(() => {
  if (!chosenDays.value.length) return null;
  let first = "";
  if (startDate.value) {
    const start = new Date(`${startDate.value}T00:00:00`);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.getDay() === 0 ? 7 : d.getDay();
      const day = chosenDays.value.find((x) => x.id === iso);
      if (day) {
        const label = d.toLocaleDateString(intlLocale.value, {
          weekday: "short",
          day: "numeric",
          month: "long",
        });
        first = day.start_time ? `${label}, ${day.start_time}` : label;
        break;
      }
    }
  }
  return { first };
});

const fieldError = (name) => {
  const value = errs.value?.[name];
  if (!value) return "";
  return Array.isArray(value) ? value[0] : String(value);
};
</script>
