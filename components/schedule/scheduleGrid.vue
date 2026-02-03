<template>
  <div class="custom-grid">
    <!-- Переключатель режима -->
    <div class="col-span-12">
      <div class="flex justify-between gap-x-1">
        <button
          v-for="m in modes"
          :key="m"
          class="btn !w-full max-md:!px-2 max-md:!py-1 max-md:!text-sm max-md:!rounded-lg !font-medium"
          :class="mode === m ? 'btn-success' : 'btn-light'"
          @click="mode = m"
        >
          {{ modeLabels[m] }}
        </button>
      </div>
    </div>

    <!-- Общий заголовок -->
    <div class="col-span-12">
      <div class="flex items-center justify-between">
        <button class="btn btn-circle btn-success" @click="prev">
          <i class="pi pi-chevron-left"></i>
        </button>
        <span class="font-medium md:text-xl">{{ title }}</span>
        <button class="btn btn-circle btn-success" @click="next">
          <i class="pi pi-chevron-right"></i>
        </button>
      </div>
    </div>

    <div class="col-span-12 relative">
      <loader
        v-if="pendingSchedule"
        :className="'overlay !rounded-lg'"
        :showPendingText="true"
      />
      <!-- Отображение по режиму -->
      <div v-if="mode === 'year'" class="grid grid-cols-3 gap-0.5 md:gap-1">
        <div
          v-for="m in 12"
          :key="m"
          class="card p-4 capitalize font-medium text-center cursor-pointer"
          @click="selectMonth(m - 1)"
        >
          <span
            :class="{
              'text-success':
                m - 1 === currentDate.month() &&
                currentDate.year() === dayjs().year(),
            }"
          >
            {{
              dayjs()
                .year(currentDate.year())
                .month(m - 1)
                .locale(localeProperties.code)
                .format("MMMM")
            }}
          </span>

          <!-- количество событий -->
          <div class="text-xs text-gray-500 mt-1">
            {{ $t("pages.lessons.lessons_count") }}:
            {{ eventsForMonth(m - 1).length }}
          </div>
        </div>
      </div>

      <div v-if="mode === 'month'" class="grid grid-cols-7 gap-0.5 md:gap-1">
        <div v-for="i in 7" :key="i" class="font-medium capitalize mb-1">
          <span class="hidden md:inline">{{ fullWeekday(i) }}</span>
          <span class="inline md:hidden">{{ shortWeekday(i) }}</span>
        </div>

        <div v-for="blank in blankDays" :key="'b' + blank" class="empty"></div>
        <div
          v-for="d in daysInMonth"
          :key="d"
          class="card p-2 !rounded-lg max-h-28 flex flex-col justify-between gap-y-2 cursor-pointer duration-200 hover:!border-green-500"
          @click="selectDay(d)"
        >
          <div class="flex items-center">
            <div
              class="font-medium w-5 lg:w-6 h-5 lg:h-6 rounded-full flex justify-center items-center text-xs lg:text-sm"
              :class="isToday(d) ? 'bg-danger text-white' : 'bg-inactive'"
            >
              {{ d }}
            </div>
          </div>

          <div>
            <div
              v-if="eventsForDay(currentDate.date(d)).length > 0"
              class="flex flex-col gap-y-0.5 text-[8px] md:text-xs overflow-hidden"
            >
              <div
                v-for="e in eventsForDay(currentDate.date(d)).slice(0, 2)"
                :key="e.uuid"
                :class="[
                  'py-0.5 px-1 rounded',
                  currentDate.date(d).isBefore(dayjs(), 'day')
                    ? 'bg-inactive text-inactive'
                    : 'bg-success text-white',
                ]"
              >
                <div class="flex gap-1.5 text-nowrap">
                  <span class="font-medium">{{ e.time }}</span>
                  <span>{{ e.section_name }} - {{ e.lesson_name }}</span>
                </div>
              </div>

              <div
                v-if="eventsForDay(currentDate.date(d)).length > 2"
                class="text-nowrap font-medium cursor-pointer lowercase"
              >
                + {{ $t("yet_another") }}
                {{ eventsForDay(currentDate.date(d)).length - 2 }}
              </div>
            </div>

            <span
              v-else
              class="text-inactive text-[8px] md:text-xs text-nowrap"
              >{{ $t("no_events") }}</span
            >
          </div>
        </div>
      </div>

      <div
        v-if="mode === 'week'"
        class="grid grid-cols-1 md:grid-cols-7 gap-1 md:gap-1"
      >
        <div
          v-for="d in currentWeek"
          :key="d"
          class="card p-2 !rounded-lg max-h-28 flex flex-col justify-between gap-y-2 cursor-pointer duration-200 hover:!border-green-500"
          @click="selectDay(d.date())"
        >
          <div class="flex items-center gap-2">
            <div
              class="font-medium w-5 lg:w-6 h-5 lg:h-6 rounded-full flex justify-center items-center text-xs lg:text-sm"
              :class="
                isToday(d.date()) ? 'bg-danger text-white' : 'bg-inactive'
              "
            >
              {{ d.date() }}
            </div>

            <div class="font-medium capitalize">
              {{ d.locale(localeProperties.code).format("dd") }}
            </div>
          </div>

          <div>
            <div
              v-if="eventsForDay(currentDate.date(d.date())).length > 0"
              class="flex flex-col gap-y-0.5 text-[8px] md:text-xs overflow-hidden"
            >
              <div
                v-for="e in eventsForDay(currentDate.date(d.date())).slice(
                  0,
                  2,
                )"
                :key="e.uuid"
                :class="[
                  'py-0.5 px-1 rounded text-white',
                  currentDate.date(d.date()).isBefore(dayjs(), 'day')
                    ? 'bg-inactive text-inactive'
                    : 'bg-success text-white',
                ]"
              >
                <div class="flex gap-1.5 text-nowrap">
                  <span class="font-medium">{{ e.time }}</span>
                  <span>{{ e.section_name }} - {{ e.lesson_name }}</span>
                </div>
              </div>

              <div
                v-if="eventsForDay(currentDate.date(d.date())).length > 2"
                class="text-nowrap font-medium cursor-pointer lowercase"
              >
                + {{ $t("yet_another") }}
                {{ eventsForDay(currentDate.date(d.date())).length - 2 }}
              </div>
            </div>

            <span v-else class="text-inactive text-xs">{{
              $t("no_events")
            }}</span>
          </div>
        </div>
      </div>

      <div v-if="mode === 'day'">
        <div
          v-if="eventsForDay(currentDate.format('YYYY-MM-DD')).length > 0"
          class="table table-sm table-striped"
          :class="props.openEventModal ? 'selectable' : ''"
        >
          <table>
            <thead>
              <tr>
                <th>{{ $t("start_time") }}</th>
                <th>{{ $t("pages.lessons.lesson_name") }}</th>
                <th>{{ $t("pages.lessons.lesson_type") }}</th>
                <th>{{ $t("pages.groups.group") }}</th>
                <th>{{ $t("pages.courses.course") }}</th>
                <th>{{ $t("pages.groups.group_category") }}</th>
                <th>{{ $t("mentor") }}</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="e in eventsForDay(currentDate.format('YYYY-MM-DD'))"
                :key="e.uuid"
                @click="props.openEventModal && props.openEventModal(e.uuid)"
              >
                <td>
                  <b>{{ e.time }}</b>
                </td>
                <td>{{ e.section_name }} - {{ e.lesson_name }}</td>
                <td>{{ e.lesson_type_name }}</td>
                <td>{{ e.group_name }}</td>
                <td>{{ e.course_name }}</td>
                <td>{{ e.level_name }}</td>
                <td>
                  <div class="flex gap-x-1 items-center">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-6 h-6'"
                      :user="{
                        last_name: e.mentor_last_name,
                        first_name: e.mentor_first_name,
                        avatar: e.mentor_avatar,
                      }"
                    />
                    {{ e.mentor_last_name }}
                    {{ e.mentor_first_name }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <alert v-else :className="'light'">
          <loader
            v-if="pendingSchedule"
            :className="'overlay'"
            :showPendingText="true"
          />
          <p class="mb-0">{{ $t("pages.events.no_events") }}</p>
        </alert>
      </div>
    </div>
  </div>
</template>
<script setup>
import loader from "../ui/loader.vue";
import alert from "../ui/alert.vue";
import userAvatar from "../ui/userAvatar.vue";

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

const { t } = useI18n();
const { localeProperties } = useI18n();

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

const title = computed(() => {
  const locale = localeProperties.value.code.split("-")[0]; // на всякий случай обрезаем лишнее

  switch (mode.value) {
    case "year":
      return currentDate.value.locale(locale).format("YYYY");

    case "month":
      return currentDate.value.locale(locale).format("MMMM YYYY");

    case "week": {
      const start = currentDate.value.startOf("isoweek").locale(locale);
      const end = currentDate.value.endOf("isoweek").locale(locale);
      return `${start.format("D MMM")} - ${end.format("D MMM YYYY")}`;
    }

    case "day":
      return currentDate.value.locale(locale).format("D MMMM YYYY");
  }
});

const fullWeekday = (i) =>
  dayjs().day(i).locale(localeProperties.value.code).format("dddd");

const shortWeekday = (i) =>
  dayjs().day(i).locale(localeProperties.value.code).format("dd");

const daysInMonth = computed(() =>
  Array.from({ length: currentDate.value.daysInMonth() }, (_, i) => i + 1),
);

const blankDays = computed(() => {
  const first = currentDate.value.startOf("month").day();
  return Array.from({ length: first === 0 ? 6 : first - 1 });
});

const currentWeek = computed(() =>
  Array.from({ length: 7 }, (_, i) =>
    dayjs(currentDate.value)
      .startOf("isoWeek") // 👈 понедельник
      .add(i, "day"),
  ),
);

const isToday = (day) => {
  return currentDate.value.date(day).isSame(dayjs(), "day");
};

const prev = () => {
  switch (mode.value) {
    case "year":
      currentDate.value = currentDate.value.subtract(1, "year");
      break;
    case "month":
      currentDate.value = currentDate.value.subtract(1, "month");
      break;
    case "week":
      currentDate.value = currentDate.value.subtract(1, "week");
      break;
    case "day":
      currentDate.value = currentDate.value.subtract(1, "day");
      break;
  }
};

const next = () => {
  switch (mode.value) {
    case "year":
      currentDate.value = currentDate.value.add(1, "year");
      break;
    case "month":
      currentDate.value = currentDate.value.add(1, "month");
      break;
    case "week":
      currentDate.value = currentDate.value.add(1, "week");
      break;
    case "day":
      currentDate.value = currentDate.value.add(1, "day");
      break;
  }
};

const selectMonth = (monthIndex) => {
  currentDate.value = currentDate.value.month(monthIndex);
  mode.value = "month";
};

const eventsForMonth = (monthIndex) => {
  return schedule.value.filter((event) => {
    const d = dayjs(event.date);
    return d.year() === currentDate.value.year() && d.month() === monthIndex;
  });
};

const selectDay = (dayNumber) => {
  currentDate.value = currentDate.value.date(dayNumber);
  mode.value = "day";
};

const eventsForDay = (day) => {
  return schedule.value.filter((s) => dayjs(s.date).isSame(day, "day"));
};
</script>
