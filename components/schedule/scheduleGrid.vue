<template>
  <div class="sg">
    <!-- Панель: навигация + заголовок периода + режимы -->
    <div class="sg-toolbar">
      <div class="sg-nav">
        <button
          type="button"
          class="btn btn-light btn-square"
          :title="$t('back')"
          :aria-label="$t('back')"
          @click="prev"
        >
          <i class="pi pi-chevron-left" aria-hidden="true"></i>
        </button>
        <button type="button" class="btn btn-light" @click="goToday">
          {{ $t("today") }}
        </button>
        <button
          type="button"
          class="btn btn-light btn-square"
          :title="$t('continue')"
          :aria-label="$t('continue')"
          @click="next"
        >
          <i class="pi pi-chevron-right" aria-hidden="true"></i>
        </button>
        <h3 class="sg-title">{{ title }}</h3>
      </div>

      <div class="sg-right">
        <slot name="actions" />
        <div class="conf-modes" role="group">
          <button
            type="button"
            v-for="m in modes"
            :key="m"
            class="conf-mode"
            :class="{ active: mode === m }"
            :aria-pressed="mode === m"
            @click="mode = m"
          >
            {{ modeLabels[m] }}
          </button>
        </div>
      </div>
    </div>

    <div class="relative">
      <loader
        v-if="pendingSchedule"
        :className="'overlay !rounded-xl'"
        :showPendingText="true"
      />

      <!-- ГОД -->
      <div v-if="mode === 'year'" class="sg-year">
        <button
          type="button"
          v-for="m in 12"
          :key="m"
          class="sg-month-card"
          :class="{
            current:
              m - 1 === today.month() && currentDate.year() === today.year(),
            empty: monthCount(m - 1) === 0,
          }"
          @click="selectMonth(m - 1)"
        >
          <span class="capitalize font-semibold">{{ monthName(m - 1) }}</span>
          <span class="sg-month-count">
            <b>{{ monthCount(m - 1) }}</b>
            <span class="text-inactive text-xs lowercase">{{
              $t("pages.lessons.lessons_count")
            }}</span>
          </span>
        </button>
      </div>

      <!-- МЕСЯЦ -->
      <div v-if="mode === 'month'">
        <div class="sg-weekdays">
          <span v-for="i in 7" :key="i">
            <span class="max-md:hidden">{{ fullWeekday(i) }}</span>
            <span class="md:hidden">{{ shortWeekday(i) }}</span>
          </span>
        </div>
        <div class="sg-month">
          <template v-for="cell in monthCells" :key="cell.key">
            <div v-if="!cell.date" class="sg-day blank" aria-hidden="true"></div>
            <div
              v-else
              class="sg-day"
              :class="dayClasses(cell.date)"
              role="button"
              tabindex="0"
              @click="selectDay(cell.date)"
              @keydown.enter="selectDay(cell.date)"
            >
              <span class="sg-day-num">{{ cell.date.date() }}</span>

              <!-- Компьютер: занятия плашками -->
              <div v-if="eventsOn(cell.date).length" class="sg-chips max-md:hidden">
                <button
                  type="button"
                  v-for="e in eventsOn(cell.date).slice(0, 3)"
                  :key="e.uuid"
                  class="sg-chip"
                  :class="chipClass(e, cell.date)"
                  :title="`${hhmm(e.time)} ${eventTitle(e)}`"
                  @click.stop="openEvent(e, cell.date)"
                >
                  <b>{{ hhmm(e.time) }}</b>
                  <span class="truncate">{{ eventTitle(e) }}</span>
                </button>
                <span
                  v-if="eventsOn(cell.date).length > 3"
                  class="sg-more"
                >
                  + {{ $t("yet_another") }} {{ eventsOn(cell.date).length - 3 }}
                </span>
              </div>

              <!-- Телефон: точки по числу занятий -->
              <div v-if="eventsOn(cell.date).length" class="sg-dots md:hidden">
                <span
                  v-for="n in Math.min(eventsOn(cell.date).length, 3)"
                  :key="n"
                ></span>
                <b v-if="eventsOn(cell.date).length > 3" class="text-[9px]"
                  >+{{ eventsOn(cell.date).length - 3 }}</b
                >
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- НЕДЕЛЯ -->
      <div v-if="mode === 'week'" class="sg-week">
        <div
          v-for="d in currentWeek"
          :key="d.format('YYYY-MM-DD')"
          class="sg-week-col"
          :class="dayClasses(d)"
        >
          <button type="button" class="sg-week-head" @click="selectDay(d)">
            <span class="capitalize text-xs text-inactive">{{
              d.locale(localeCode).format("dd")
            }}</span>
            <span class="sg-day-num">{{ d.date() }}</span>
          </button>

          <div v-if="eventsOn(d).length" class="sg-chips">
            <button
              type="button"
              v-for="e in eventsOn(d)"
              :key="e.uuid"
              class="sg-chip tall"
              :class="chipClass(e, d)"
              @click="openEvent(e, d)"
            >
              <b>{{ hhmm(e.time) }}</b>
              <span class="sg-chip-title">{{ eventTitle(e) }}</span>
            </button>
          </div>
          <span v-else class="text-inactive text-xs px-1">{{
            $t("no_events")
          }}</span>
        </div>
      </div>

      <!-- ДЕНЬ: карточки занятий -->
      <div v-if="mode === 'day'">
        <scheduleTable
          v-if="dayEvents.length"
          :schedule="dayEvents"
          :openEventModal="props.openEventModal"
          :showPoster="true"
          :mode="'stack'"
        />
        <emptyState
          v-else
          :pending="pendingSchedule"
          :text="$t('pages.events.no_events')"
          icon="bi bi-calendar-x"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import loader from "../ui/loader.vue";
import emptyState from "~/components/ui/emptyState.vue";
import scheduleTable from "./scheduleTable.vue";

import dayjs from "dayjs";
import "dayjs/locale/ru";
import "dayjs/locale/kk";

import weekday from "dayjs/plugin/weekday";
import isoWeek from "dayjs/plugin/isoWeek";

const props = defineProps({
  schedule: {
    type: Object,
    required: true,
  },

  pendingSchedule: {
    type: Boolean,
    required: true,
  },

  openEventModal: {
    type: Function,
    default: null,
  },
});

const { schedule, pendingSchedule } = toRefs(props);

const { t, localeProperties } = useI18n();

dayjs.extend(weekday);
dayjs.extend(isoWeek);

const modes = ["year", "month", "week", "day"];

const modeLabels = computed(() => ({
  year: t("year"),
  month: t("month"),
  week: t("week"),
  day: t("day"),
}));

const mode = ref("month");
const currentDate = ref(dayjs());
const today = dayjs();

const localeCode = computed(() => localeProperties.value.code.split("-")[0]);

const title = computed(() => {
  const d = currentDate.value.locale(localeCode.value);
  switch (mode.value) {
    case "year":
      return d.format("YYYY");
    case "month":
      return capitalize(d.format("MMMM YYYY"));
    case "week": {
      const start = d.startOf("isoWeek");
      const end = d.endOf("isoWeek");
      return `${start.format("D MMM")} – ${end.format("D MMM YYYY")}`;
    }
    case "day":
      return capitalize(d.format("dddd, D MMMM YYYY"));
  }
  return "";
});

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const fullWeekday = (i) =>
  dayjs().isoWeekday(i).locale(localeCode.value).format("dddd");

const shortWeekday = (i) =>
  dayjs().isoWeekday(i).locale(localeCode.value).format("dd");

const monthName = (m) =>
  dayjs().year(currentDate.value.year()).month(m).locale(localeCode.value).format("MMMM");

const hhmm = (time) => (time ? String(time).slice(0, 5) : "");

const eventTitle = (e) =>
  e.topic ||
  (e.section_name && e.lesson_name
    ? `${e.section_name} – ${e.lesson_name}`
    : e.lesson_name || "");

// Занятия, сгруппированные по дате (YYYY-MM-DD) и отсортированные по времени.
const eventsByDate = computed(() => {
  const map = {};
  for (const e of schedule.value || []) {
    const key = dayjs(e.date).format("YYYY-MM-DD");
    (map[key] ||= []).push(e);
  }
  for (const key in map) {
    map[key].sort((a, b) => String(a.time).localeCompare(String(b.time)));
  }
  return map;
});

const eventsOn = (d) => eventsByDate.value[d.format("YYYY-MM-DD")] || [];

const dayEvents = computed(() => eventsOn(currentDate.value));

const monthCount = (m) => {
  const y = currentDate.value.year();
  return (schedule.value || []).filter((e) => {
    const d = dayjs(e.date);
    return d.year() === y && d.month() === m;
  }).length;
};

// Ячейки месяца: пустые до первого дня (неделя с понедельника) + все дни.
const monthCells = computed(() => {
  const start = currentDate.value.startOf("month");
  const blanks = start.isoWeekday() - 1;
  const cells = Array.from({ length: blanks }, (_, i) => ({ key: "b" + i }));
  for (let i = 0; i < start.daysInMonth(); i++) {
    const date = start.add(i, "day");
    cells.push({ key: date.format("YYYY-MM-DD"), date });
  }
  return cells;
});

// Неделя с понедельника — дни берутся как даты, а не как число месяца,
// поэтому неделя на стыке месяцев отображается правильно.
const currentWeek = computed(() =>
  Array.from({ length: 7 }, (_, i) =>
    currentDate.value.startOf("isoWeek").add(i, "day"),
  ),
);

const dayClasses = (d) => ({
  today: d.isSame(today, "day"),
  past: d.isBefore(today, "day"),
  weekend: d.isoWeekday() >= 6,
});

const chipClass = (e, d) => ({
  live: e.is_active === true,
  past: d.isBefore(today, "day"),
});

const step = { year: "year", month: "month", week: "week", day: "day" };

const prev = () => {
  currentDate.value = currentDate.value.subtract(1, step[mode.value]);
};

const next = () => {
  currentDate.value = currentDate.value.add(1, step[mode.value]);
};

const goToday = () => {
  currentDate.value = dayjs();
};

const selectMonth = (monthIndex) => {
  currentDate.value = currentDate.value.month(monthIndex);
  mode.value = "month";
};

const selectDay = (d) => {
  currentDate.value = d;
  mode.value = "day";
};

// Клик по занятию: если есть обработчик — сразу открываем подробности,
// иначе переходим к этому дню.
const openEvent = (e, d) => {
  if (props.openEventModal) props.openEventModal(e.uuid);
  else selectDay(d);
};
</script>
