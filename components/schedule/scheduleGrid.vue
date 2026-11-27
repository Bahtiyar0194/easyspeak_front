<template>
  <div class="sg">
    <!-- Панель: навигация + заголовок периода + режимы -->
    <div class="sg-toolbar">
      <div class="sg-nav">
        <button
          type="button"
          class="btn btn-light btn-square"
          :title="navLabels.prev"
          :aria-label="navLabels.prev"
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
          :title="navLabels.next"
          :aria-label="navLabels.next"
          @click="next"
        >
          <i class="pi pi-chevron-right" aria-hidden="true"></i>
        </button>
        <h3 class="sg-title" aria-live="polite">{{ title }}</h3>
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

    <!-- Цвета групп: плашки окрашены по группе — подсказка, какая какая -->
    <ul v-if="legend.length > 1 && mode !== 'year'" class="sg-legend">
      <li v-for="item in legend" :key="item.id" :style="{ '--hue': item.hue }">
        <span class="sg-legend-dot" aria-hidden="true"></span>
        {{ item.name }}
      </li>
    </ul>

    <!-- Пустой период: подпись, а при включённом фильтре — кнопка сброса -->
    <div v-if="periodEmpty" class="sg-empty" role="status">
      <i class="pi pi-calendar-times" aria-hidden="true"></i>
      <span>{{ emptyText }}</span>
      <button
        v-if="props.filtered"
        type="button"
        class="btn btn-sm btn-light"
        @click="emit('reset-filter')"
      >
        <i class="pi pi-filter-slash" aria-hidden="true"></i>
        {{ $t("reset_search_filter") }}
      </button>
    </div>

    <!-- Сетка календаря от данных не зависит: при первой загрузке рисуем её
         сразу, а вместо занятий — скелетон-плашки. При обновлении (фильтр,
         перенос, удаление) календарь на месте, по нему идёт перелив. -->
    <div
      class="relative"
      :class="{ 'sg-refreshing': refreshing }"
      :aria-busy="pendingSchedule || undefined"
    >
      <span v-if="pendingSchedule" class="sr-only">{{ $t("loading") }}</span>

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
            empty: !skeleton && monthCount(m - 1) === 0,
          }"
          @click="selectMonth(m - 1)"
        >
          <span class="capitalize font-semibold">{{ monthName(m - 1) }}</span>
          <span class="sg-month-count">
            <span
              v-if="skeleton"
              class="skeleton inline-block h-6 w-7 align-middle"
              aria-hidden="true"
            ></span>
            <b v-else>{{ monthCount(m - 1) }}</b>
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
              :class="[dayClasses(cell.date), { selected: isSelectedOnPhone(cell.date) }]"
              role="button"
              tabindex="0"
              :aria-label="dayAriaLabel(cell.date)"
              @click="selectDay(cell.date)"
              @keydown.enter="selectDay(cell.date)"
            >
              <span class="sg-day-num">{{ cell.date.date() }}</span>

              <!-- Первая загрузка: скелетон-плашки в части дней -->
              <template v-if="skeleton">
                <div
                  v-if="skeletonCount(cell.date)"
                  class="sg-chips max-md:hidden"
                  aria-hidden="true"
                >
                  <div
                    v-for="n in skeletonCount(cell.date)"
                    :key="n"
                    class="skeleton h-6 w-full !rounded-md"
                  ></div>
                </div>
                <div
                  v-if="skeletonCount(cell.date)"
                  class="sg-dots md:hidden"
                  aria-hidden="true"
                >
                  <span
                    v-for="n in skeletonCount(cell.date)"
                    :key="n"
                    class="skeleton !bg-slate-300 dark:!bg-slate-600"
                  ></span>
                </div>
              </template>

              <!-- Компьютер: занятия плашками -->
              <div v-if="eventsOn(cell.date).length" class="sg-chips max-md:hidden">
                <button
                  type="button"
                  v-for="e in eventsOn(cell.date).slice(0, 3)"
                  :key="e.uuid"
                  class="sg-chip"
                  :class="chipClass(e, cell.date)"
                  :style="chipStyle(e)"
                  :title="chipTitle(e)"
                  @click.stop="openEvent(e, cell.date)"
                >
                  <b>{{ hhmm(e.time) }}</b>
                  <span class="truncate">{{ eventTitle(e) }}</span>
                  <i
                    v-if="e.moved"
                    class="pi pi-replay sg-chip-moved"
                    aria-hidden="true"
                  ></i>
                </button>
                <button
                  v-if="eventsOn(cell.date).length > 3"
                  type="button"
                  class="sg-more"
                  @click.stop="openDay(cell.date)"
                >
                  + {{ $t("yet_another") }} {{ eventsOn(cell.date).length - 3 }}
                </button>
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

        <!-- Телефон: уроки выбранного дня прямо под месяцем, месяц не пропадает -->
        <div v-if="!skeleton" class="sg-agenda md:hidden">
          <p class="sg-agenda-title">{{ agendaTitle }}</p>
          <ul v-if="dayEvents.length" class="sg-agenda-list">
            <li v-for="e in dayEvents" :key="e.uuid">
              <button
                type="button"
                class="sg-agenda-item"
                :class="chipClass(e, currentDate)"
                :style="chipStyle(e)"
                @click="openEvent(e, currentDate, true)"
              >
                <span class="sg-agenda-time">
                  <b>{{ hhmm(e.time) }}</b>
                  <span v-if="e.time_end" class="text-inactive">{{ hhmm(e.time_end) }}</span>
                </span>
                <span class="flex-1 min-w-0 flex flex-col text-left">
                  <span class="font-medium truncate">{{ eventTitle(e) }}</span>
                  <span v-if="e.group_name" class="text-xs text-inactive truncate">
                    {{ e.group_name }}
                  </span>
                </span>
                <i v-if="e.moved" class="pi pi-replay text-xs text-inactive" aria-hidden="true"></i>
                <i class="pi pi-chevron-right text-xs text-inactive" aria-hidden="true"></i>
              </button>
            </li>
          </ul>
          <p v-else class="mb-0 text-sm text-inactive">{{ $t("no_events") }}</p>
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

          <div v-if="skeleton" class="sg-chips" aria-hidden="true">
            <div
              v-for="n in Math.max(1, skeletonCount(d))"
              :key="n"
              class="skeleton h-12 w-full !rounded-lg"
            ></div>
          </div>
          <div v-else-if="eventsOn(d).length" class="sg-chips">
            <button
              type="button"
              v-for="e in eventsOn(d)"
              :key="e.uuid"
              class="sg-chip tall"
              :class="chipClass(e, d)"
              :style="chipStyle(e)"
              :title="chipTitle(e)"
              @click="openEvent(e, d)"
            >
              <b>
                {{ hhmm(e.time) }}
                <i v-if="e.moved" class="pi pi-replay sg-chip-moved" aria-hidden="true"></i>
              </b>
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
        <!-- Скелетон карточек занятий -->
        <div v-if="skeleton" class="flex flex-col gap-3" aria-hidden="true">
          <div
            v-for="n in 2"
            :key="n"
            class="flex gap-4 p-4 rounded-2xl border bg-active"
            style="border-color: var(--surface-border)"
          >
            <div class="skeleton w-24 h-24 shrink-0 !rounded-xl max-sm:hidden"></div>
            <div class="flex-1 min-w-0 flex flex-col gap-2.5">
              <div class="skeleton h-5 w-20 !rounded-full"></div>
              <div class="skeleton h-5 w-2/3"></div>
              <div class="skeleton h-3.5 w-1/2"></div>
              <div class="skeleton h-3.5 w-1/3"></div>
            </div>
          </div>
        </div>
        <scheduleTable
          v-else-if="dayEvents.length"
          :schedule="dayEvents"
          :openEventModal="props.openEventModal"
          :showPoster="true"
          :mode="'stack'"
        />
        <emptyState
          v-else
          :text="$t('pages.events.no_events')"
          icon="bi bi-calendar-x"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import emptyState from "~/components/ui/emptyState.vue";
import scheduleTable from "./scheduleTable.vue";
import { useRoute, useRouter } from "nuxt/app";

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

  // Помесячная загрузка (composables/useScheduleLoader.js): есть ли данные
  // для видимого периода. false — показываем скелетон, а не перелив.
  // Когда расписание передано целиком — не нужен.
  rangeLoaded: {
    type: Boolean,
    default: true,
  },

  // Режим «Год» при помесячной загрузке: 12 счётчиков с сервера (январь — [0]).
  // null — считаем по переданному расписанию.
  monthCounts: {
    type: Array,
    default: null,
  },

  // Включён фильтр — в пустом периоде показываем «Сбросить фильтр»
  filtered: {
    type: Boolean,
    default: false,
  },

  // Режим и дата в адресе (?view=week&date=2026-11-27): обновление страницы
  // и «Назад» в браузере возвращают туда же. Только для страницы расписания
  syncRoute: {
    type: Boolean,
    default: false,
  },

  // ← / → — соседний период, T — сегодня
  keyboard: {
    type: Boolean,
    default: false,
  },
});

// Видимый период — для помесячной загрузки:
// { mode, year, months: ["YYYY-MM", ...] }
const emit = defineEmits(["range", "reset-filter"]);

const route = useRoute();
const router = useRouter();

const { schedule, pendingSchedule } = toRefs(props);

// ===== Загрузка =====
// Нет данных для видимого периода (первая загрузка или ещё не загруженный
// месяц) — скелетон вместо занятий. Обновление уже показанных данных —
// календарь на месте, по нему идёт перелив (.sg-refreshing)
const loadedOnce = ref(!pendingSchedule.value);
watch(pendingSchedule, (pending) => {
  if (!pending) loadedOnce.value = true;
});

const skeleton = computed(
  () => pendingSchedule.value && (!loadedOnce.value || !props.rangeLoaded),
);
const refreshing = computed(
  () => pendingSchedule.value && loadedOnce.value && props.rangeLoaded,
);

// Сколько скелетон-плашек в дне: 0–2, стабильно для даты (не «мигает»),
// примерно в половине дней — пусто, как в настоящем расписании
const skeletonCount = (d) => [0, 1, 0, 2, 1, 0, 1][(d.date() * 3 + d.month()) % 7];

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

// Начальные режим и дата: из адреса (если включено), иначе — месяц, сегодня
const initialFromRoute = () => {
  if (!props.syncRoute) return { mode: "month", date: dayjs() };
  const view = modes.includes(route.query.view) ? route.query.view : "month";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(route.query.date || ""))
    ? dayjs(route.query.date)
    : null;
  return { mode: view, date: date && date.isValid() ? date : dayjs() };
};
const initial = initialFromRoute();

const mode = ref(initial.mode);
const currentDate = ref(initial.date);
const today = dayjs();

if (props.syncRoute) {
  watch([mode, currentDate], () => {
    const view = mode.value;
    const date = currentDate.value.format("YYYY-MM-DD");
    if (route.query.view === view && route.query.date === date) return;
    router.replace({ query: { ...route.query, view, date } });
  });
}

// Подписи стрелок по режиму: «Предыдущий месяц» / «Следующая неделя»…
const navLabels = computed(() => ({
  prev: t(`pages.schedule.nav.prev_${mode.value}`),
  next: t(`pages.schedule.nav.next_${mode.value}`),
}));

// Телефон: в режиме «Месяц» нажатие на день показывает его уроки под сеткой
const isPhone = ref(false);
let phoneQuery = null;
const onPhoneChange = (e) => (isPhone.value = e.matches);

onMounted(() => {
  phoneQuery = window.matchMedia("(max-width: 767px)");
  isPhone.value = phoneQuery.matches;
  phoneQuery.addEventListener?.("change", onPhoneChange);
  if (props.keyboard) window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  phoneQuery?.removeEventListener?.("change", onPhoneChange);
  window.removeEventListener("keydown", onKeydown);
});

const isSelectedOnPhone = (d) =>
  mode.value === "month" && d.isSame(currentDate.value, "day");

// Клавиатура: не мешаем вводу текста и открытым окнам
const onKeydown = (e) => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const target = e.target;
  if (
    target?.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName) ||
    document.querySelector(".modal-backdrop.show")
  ) {
    return;
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    prev();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    next();
  } else if (e.code === "KeyT") {
    // По коду клавиши — работает и в русской раскладке («Е»)
    goToday();
  }
};

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
  if (props.monthCounts) return props.monthCounts[m] || 0;
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

// Сообщаем видимый период: какие месяцы нужны на экране
// (неделя на стыке месяцев — оба), для «Года» — только год
watch(
  [mode, currentDate],
  () => {
    const d = currentDate.value;
    let months = [];

    if (mode.value === "week") {
      months = [
        ...new Set([
          d.startOf("isoWeek").format("YYYY-MM"),
          d.endOf("isoWeek").format("YYYY-MM"),
        ]),
      ];
    } else if (mode.value !== "year") {
      months = [d.format("YYYY-MM")];
    }

    emit("range", { mode: mode.value, year: d.year(), months });
  },
  { immediate: true },
);

const dayClasses = (d) => ({
  today: d.isSame(today, "day"),
  past: d.isBefore(today, "day"),
  weekend: d.isoWeekday() >= 6,
});

const chipClass = (e, d) => {
  const live = e.is_active === true;
  const past = d.isBefore(today, "day");
  // Цвет группы — только у предстоящих: идущие зелёные, прошедшие серые
  return { live, past, grp: Boolean(e.group_id) && !live && !past };
};

// Стабильный оттенок для группы: золотой угол разносит соседние id по кругу
const groupHue = (id) => Math.round((Number(id) * 137.508) % 360);

const chipStyle = (e) => (e.group_id ? { "--hue": groupHue(e.group_id) } : {});

const chipTitle = (e) =>
  [
    `${hhmm(e.time)}${e.time_end ? "–" + hhmm(e.time_end) : ""} ${eventTitle(e)}`,
    e.group_name,
    e.moved ? t("pages.schedule.moved") : null,
  ]
    .filter(Boolean)
    .join(" · ");

// Занятия видимого периода — для подсказки цветов и «уроков нет»
const visibleEvents = computed(() => {
  if (mode.value === "month") {
    const key = currentDate.value.format("YYYY-MM");
    return (schedule.value || []).filter((e) => dayjs(e.date).format("YYYY-MM") === key);
  }
  if (mode.value === "week") return currentWeek.value.flatMap((d) => eventsOn(d));
  if (mode.value === "day") return dayEvents.value;
  return schedule.value || [];
});

const legend = computed(() => {
  const seen = new Map();
  for (const e of visibleEvents.value) {
    if (e.group_id && !seen.has(e.group_id)) {
      seen.set(e.group_id, { id: e.group_id, name: e.group_name, hue: groupHue(e.group_id) });
    }
  }
  return [...seen.values()].slice(0, 10);
});

const periodEmpty = computed(
  () =>
    !pendingSchedule.value &&
    loadedOnce.value &&
    props.rangeLoaded &&
    (mode.value === "month" || mode.value === "week") &&
    visibleEvents.value.length === 0,
);

const emptyText = computed(() =>
  mode.value === "week" ? t("pages.schedule.empty_week") : t("pages.schedule.empty_month"),
);

const agendaTitle = computed(() =>
  capitalize(currentDate.value.locale(localeCode.value).format("dddd, D MMMM")),
);

const dayAriaLabel = (d) => {
  const count = eventsOn(d).length;
  const date = d.locale(localeCode.value).format("D MMMM");
  return count ? `${date}: ${t("pages.schedule.lessons_count", { count })}` : date;
};

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

// Открыть день целиком (режим «День»)
const openDay = (d) => {
  currentDate.value = d;
  mode.value = "day";
};

// Нажатие на день: на телефоне в «Месяце» — уроки дня под сеткой,
// в остальных случаях — режим «День»
const selectDay = (d) => {
  if (isPhone.value && mode.value === "month") {
    currentDate.value = d;
    return;
  }
  openDay(d);
};

// Клик по занятию: если есть обработчик — сразу открываем подробности,
// иначе переходим к этому дню.
const openEvent = (e, d) => {
  if (props.openEventModal) props.openEventModal(e.uuid);
  else openDay(d);
};
</script>
