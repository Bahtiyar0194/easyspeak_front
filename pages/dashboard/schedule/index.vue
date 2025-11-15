<template>
  <loader v-if="pending" :className="'full-overlay'" :showPendingText="true" />
  <div class="col-span-12">
    <div class="custom-grid">
      <roleProvider :roles="[1, 2, 3, 4]">
        <div class="col-span-12">
          <div class="btn-wrap">
            <button @click="showHideScheduleSearchFilter" class="btn btn-light">
              <i class="pi pi-search"></i>
              {{
                searchFilter === true
                  ? $t("hide_search_filter")
                  : $t("show_search_filter")
              }}
            </button>
          </div>
        </div>
      </roleProvider>
      <div
        class="col-span-12 lg:col-span-3"
        :class="searchFilter ? 'block' : 'hidden'"
      >
        <stickyBox>
          <div class="card p-4">
            <h5>{{ $t("pages.schedule.search_filter") }}</h5>
            <form @submit.prevent="debounceReset" ref="searchFormRef">
              <div class="custom-grid">
                <div class="col-span-12">
                  <div class="form-group-border select active label-active">
                    <i class="pi pi-book"></i>
                    <select
                      name="course_id"
                      v-model="selectedCourseId"
                      @change="onCourseChange"
                    >
                      <option selected value="">
                        {{ $t("not_selected") }}
                      </option>
                      <option
                        v-for="(course, courseIndex) in attributes.courses"
                        :key="courseIndex"
                        :value="course.course_id"
                      >
                        {{ course.course_name }}
                      </option>
                    </select>
                    <label :class="{ 'label-error': errors.course_id }">
                      {{
                        errors.course_id
                          ? errors.course_id[0]
                          : $t("pages.courses.course")
                      }}
                    </label>
                  </div>
                </div>

                <div v-if="selectedCourseId" class="col-span-12">
                  <multipleSelect
                    :className="'form-group-border select active label-active'"
                    :icon="'pi pi-users'"
                    :label="$t('pages.groups.group_category')"
                    :items="selectedCourse?.levels"
                    :optionName="'levels[]'"
                    :optionValue="'level_id'"
                    :optionLabel="'level_name'"
                    :onChange="debounceSchedule"
                  />
                </div>

                <roleProvider :roles="[1, 2, 3]">
                  <div class="col-span-12">
                    <multipleSelect
                      :className="'form-group-border select active label-active'"
                      :icon="'pi pi-user'"
                      :label="$t('mentor')"
                      :items="attributes.group_mentors"
                      :optionName="'mentors[]'"
                      :optionValue="'user_id'"
                      :optionLabel="'full_name'"
                      :avatar="true"
                      :onChange="debounceSchedule"
                    />
                  </div>
                </roleProvider>

                <div class="col-span-12">
                  <div class="form-group-border active">
                    <i class="pi pi-users"></i>
                    <input
                      type="text"
                      name="group_name"
                      placeholder=" "
                      @input="debounceSchedule"
                    />
                    <label>{{ $t("pages.groups.group_name") }}</label>
                  </div>
                </div>

                <div class="col-span-12">
                  <div class="form-group-border active">
                    <i class="pi pi-book"></i>
                    <input
                      type="text"
                      name="lesson_name"
                      placeholder=" "
                      @input="debounceSchedule"
                    />
                    <label>{{ $t("pages.lessons.lesson_name") }}</label>
                  </div>
                </div>

                <div class="col-span-12">
                  <div class="form-group-border active">
                    <i class="pi pi-calendar"></i>
                    <input
                      type="date"
                      name="started_at_from"
                      @input="debounceSchedule"
                      placeholder=" "
                    />
                    <label>{{ $t("pages.schedule.start_date_from") }}</label>
                  </div>
                </div>

                <div class="col-span-12">
                  <div class="form-group-border active">
                    <i class="pi pi-calendar"></i>
                    <input
                      type="date"
                      name="started_at_to"
                      @input="debounceSchedule"
                      placeholder=" "
                    />
                    <label>{{ $t("pages.schedule.start_date_to") }}</label>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </stickyBox>
      </div>
      <div
        class="col-span-12 relative"
        :class="searchFilter && 'lg:col-span-9'"
      >
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
            <loader v-if="pendingSchedule" :className="'overlay !rounded-lg'" />
            <!-- Отображение по режиму -->
            <div
              v-if="mode === 'year'"
              class="grid grid-cols-3 gap-0.5 md:gap-1"
            >
              <div
                v-for="m in 12"
                :key="m"
                class="card p-4 capitalize font-medium text-center cursor-pointer"
                @click="selectMonth(m - 1)"
              >
                <span
                  :class="m - 1 === currentDate.month() && 'text-success'"
                  >{{
                    currentDate
                      .month(m - 1)
                      .locale(localeProperties.code)
                      .format("MMMM")
                  }}</span
                >
              </div>
            </div>

            <div
              v-if="mode === 'month'"
              class="grid grid-cols-7 gap-0.5 md:gap-1"
            >
              <div v-for="i in 7" :key="i" class="font-medium capitalize mb-1">
                <span class="hidden md:inline">{{ fullWeekday(i) }}</span>
                <span class="inline md:hidden">{{ shortWeekday(i) }}</span>
              </div>

              <div
                v-for="blank in blankDays"
                :key="'b' + blank"
                class="empty"
              ></div>
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
                        <span>{{ e.lesson_name }}</span>
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
                      v-for="e in eventsForDay(
                        currentDate.date(d.date())
                      ).slice(0, 2)"
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
                        <span>{{ e.lesson_name }}</span>
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
                class="table table-sm table-striped selectable"
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
                      v-for="e in eventsForDay(
                        currentDate.format('YYYY-MM-DD')
                      )"
                      :key="e.uuid"
                      @click="openEventModal(e.uuid)"
                    >
                      <td>
                        <b>{{ e.time }}</b>
                      </td>
                      <td>{{ e.lesson_name }}</td>
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
                <loader v-if="pendingSchedule" :className="'overlay'" />
                <p class="mb-0">{{ $t("pages.events.no_events") }}</p>
              </alert>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <modal
    :show="eventModalIsVisible"
    :onClose="() => closeEventModal()"
    :className="'modal-xl'"
    :showLoader="false"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <h4>{{ currentEvent?.lesson_name }}</h4>
    </template>
    <template v-if="currentEvent" v-slot:body_content>
      <div class="custom-grid">
        <div class="col-span-12">
          <p class="text-inactive">
            <i class="pi pi-book"></i> {{ $t("pages.courses.course") }}:
            <b class="text-active"
              >{{ currentEvent.course_name }} - {{ currentEvent.level_name }}</b
            >
          </p>
          <p class="text-inactive">
            <i class="pi pi-users"></i> {{ $t("pages.groups.group") }}:
            <b class="text-active">{{ currentEvent.group_name }}</b>
          </p>
          <p class="text-inactive">
            <i class="pi pi-user"></i> {{ $t("mentor") }}:
            <b class="text-active"
              >{{ currentEvent.mentor_last_name }}
              {{ currentEvent.mentor_first_name }}</b
            >
          </p>
          <p class="text-inactive">
            <i class="pi pi-clock"></i> {{ $t("start_time") }}:
            <b class="text-active">{{ currentEvent.start_time_formatted }}</b>
          </p>
          <p class="text-inactive mb-0">
            <i class="pi pi-clock"></i> {{ $t("end_time") }}:
            <b class="text-active">{{ currentEvent.end_time_formatted }}</b>
          </p>
        </div>
        <div class="col-span-12">
          <p>
            {{ $t("pages.groups.members") }}:
            <b>{{ currentEvent.members.length }}</b>
          </p>

          <div v-if="currentEvent.members.length > 0" class="btn-wrap">
            <userTag
              v-for="(member, index) in currentEvent.members"
              :key="index"
              :user="member"
              :closable="false"
            />
          </div>
        </div>

        <roleProvider :roles="[1, 2, 3]">
          <div class="col-span-12">
            <button class="btn btn-outline-primary" @click="openEditModal()">
              <i class="pi pi-pencil"></i>{{ $t("edit") }}
            </button>
          </div>
        </roleProvider>
      </div>
    </template>
  </modal>

  <modal
    :show="editModalIsVisible"
    :onClose="() => closeEditModal()"
    :className="'modal-2xl'"
    :showLoader="pendingEdit"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <h4>{{ currentEvent?.lesson_name }}</h4>
    </template>
    <template v-if="currentEvent" v-slot:body_content>
      <form @submit.prevent="editEventSubmit" class="mt-2" ref="editFormRef">
        <div class="custom-grid">
          <div class="col-span-12">
            <div class="form-group-border select active">
              <i class="pi pi-user"></i>
              <select name="mentor_id" v-model="currentEvent.mentor_id">
                <option selected disabled value="">
                  {{ $t("choose_a_mentor") }}
                </option>
                <option
                  v-for="mentor in attributes.all_mentors"
                  :key="mentor.user_id"
                  :value="mentor.user_id"
                >
                  {{ mentor.last_name }} {{ mentor.first_name }}
                </option>
              </select>
              <label :class="{ 'label-error': errors.mentor_id }">{{
                errors.mentor_id ? errors.mentor_id[0] : $t("mentor")
              }}</label>
            </div>
          </div>

          <div class="col-span-12">
            <div class="flex flex-col gap-y-2">
              <label class="custom-radio">
                <input
                  v-model="mentorOnlyForThisLesson"
                  type="radio"
                  :value="1"
                  name="mentor_only_for_this_lesson"
                />
                <span>{{
                  $t("pages.conference.assign_a_mentor_only_for_this_lesson")
                }}</span>
              </label>

              <label class="custom-radio">
                <input
                  v-model="mentorOnlyForThisLesson"
                  type="radio"
                  :value="0"
                  name="mentor_only_for_this_lesson"
                />
                <span>{{
                  $t(
                    "pages.conference.appoint_a_mentor_for_this_and_subsequent_lessons"
                  )
                }}</span>
              </label>
              <note
                v-if="mentorOnlyForThisLesson === 0"
                :message="
                  $t(
                    'pages.conference.appoint_a_mentor_for_this_and_subsequent_lessons_note'
                  )
                "
                :className="'outline-danger'"
              />
            </div>
          </div>

          <div class="col-span-12">
            <div class="form-group-border active">
              <i class="pi pi-calendar"></i>
              <input
                type="date"
                v-model="currentEvent.date"
                name="start_date"
              />
              <label :class="{ 'label-error': errors.start_date }">
                {{
                  errors.start_date
                    ? errors.start_date
                    : $t("pages.lessons.start_date")
                }}
              </label>
            </div>
          </div>

          <div class="col-span-12">
            <div class="flex flex-col gap-y-2">
              <label class="custom-radio">
                <input
                  v-model="dateShiftByWeek"
                  type="radio"
                  :value="0"
                  name="date_shift_by_week"
                />
                <span>{{ $t("pages.lessons.date_shift_couple") }}</span>
              </label>

              <label class="custom-radio">
                <input
                  v-model="dateShiftByWeek"
                  type="radio"
                  :value="1"
                  name="date_shift_by_week"
                />
                <span>{{ $t("pages.lessons.date_shift_by_week") }}</span>
              </label>

              <note
                v-if="dateShiftByWeek === 1"
                :message="$t('pages.lessons.date_shift_by_week_note')"
                :className="'outline-danger'"
              />
            </div>
          </div>

          <div class="col-span-12">
            <div class="form-group-border active">
              <i class="pi pi-clock"></i>
              <input
                type="time"
                v-model="currentEvent.time"
                name="start_time"
              />
              <label :class="{ 'label-error': errors.start_time }">
                {{
                  errors.start_time
                    ? errors.start_time[0]
                    : $t("pages.lessons.start_time")
                }}
              </label>
            </div>
          </div>

          <div class="col-span-12">
            <button class="btn btn-primary" type="submit">
              <i class="pi pi-check"></i>
              {{ $t("save") }}
            </button>
          </div>
        </div>
      </form>
      <!-- <div class="custom-grid">
        <div class="col-span-12">
          <p class="text-inactive">
            <i class="pi pi-book"></i> {{ $t("pages.courses.course") }}:
            <b class="text-active"
              >{{ currentEvent.course_name }} - {{ currentEvent.level_name }}</b
            >
          </p>
          <p class="text-inactive">
            <i class="pi pi-users"></i> {{ $t("pages.groups.group") }}:
            <b class="text-active">{{ currentEvent.group_name }}</b>
          </p>
          <p class="text-inactive">
            <i class="pi pi-user"></i> {{ $t("mentor") }}:
            <b class="text-active"
              >{{ currentEvent.mentor_last_name }}
              {{ currentEvent.mentor_first_name }}</b
            >
          </p>
          <p class="text-inactive">
            <i class="pi pi-clock"></i> {{ $t("start_time") }}:
            <b class="text-active">{{ currentEvent.start_time_formatted }}</b>
          </p>
          <p class="text-inactive mb-0">
            <i class="pi pi-clock"></i> {{ $t("end_time") }}:
            <b class="text-active">{{ currentEvent.end_time_formatted }}</b>
          </p>
        </div>
        <div class="col-span-12">
          <p>
            {{ $t("pages.groups.members") }}:
            <b>{{ currentEvent.members.length }}</b>
          </p>

          <div v-if="currentEvent.members.length > 0" class="btn-wrap">
            <userTag
              v-for="(member, index) in currentEvent.members"
              :key="index"
              :user="member"
              :closable="false"
            />
          </div>
        </div>
      </div> -->
    </template>
  </modal>
</template>
<script setup>
import { ref, computed } from "vue";
import { useRouter } from "nuxt/app";
import modal from "../../../components/ui/modal.vue";
import loader from "../../../components/ui/loader.vue";
import alert from "../../../components/ui/alert.vue";
import stickyBox from "../../../components/ui/stickyBox.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import roleProvider from "../../../components/ui/roleProvider.vue";
import multipleSelect from "../../../components/ui/multipleSelect.vue";
import userAvatar from "../../../components/ui/userAvatar.vue";
import userTag from "../../../components/ui/userTag.vue";
import note from "../../../components/ui/note.vue";

import dayjs from "dayjs";
import "dayjs/locale/ru";
import "dayjs/locale/kk";

import weekday from "dayjs/plugin/weekday";
import isoWeek from "dayjs/plugin/isoWeek";

const router = useRouter();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const attributes = ref([]);
const schedule = ref([]);
const pending = ref(true);
const pendingSchedule = ref(true);
const pendingEdit = ref(false);
const searchFormRef = ref(null);
const editFormRef = ref(null);
const searchFilter = ref(false);

const currentEvent = ref(null);

const eventModalIsVisible = ref(false);
const editModalIsVisible = ref(false);

const mentorOnlyForThisLesson = ref(1);
const dateShiftByWeek = ref(0);

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
  Array.from({ length: currentDate.value.daysInMonth() }, (_, i) => i + 1)
);

const blankDays = computed(() => {
  const first = currentDate.value.startOf("month").day();
  return Array.from({ length: first === 0 ? 6 : first - 1 });
});

const currentWeek = computed(() =>
  Array.from({ length: 7 }, (_, i) =>
    dayjs(currentDate.value)
      .startOf("isoWeek") // 👈 понедельник
      .add(i, "day")
  )
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

const selectDay = (dayNumber) => {
  currentDate.value = currentDate.value.date(dayNumber);
  mode.value = "day";
};

const eventsForDay = (day) => {
  return schedule.value.filter((s) => dayjs(s.date).isSame(day, "day"));
};

useHead({
  title: t("pages.schedule.title"),
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const getScheduleAttributes = async () => {
  pending.value = true;
  await $axiosPlugin
    .get("schedule/get_attributes")
    .then((response) => {
      attributes.value = response.data;
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

const getSchedule = async () => {
  pendingSchedule.value = true;
  const formData = new FormData(searchFormRef.value);
  await $axiosPlugin
    .post("schedule/get", formData)
    .then((response) => {
      schedule.value = response.data;
      pendingSchedule.value = false;
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

const editEventSubmit = async () => {
  pendingEdit.value = true;
  const formData = new FormData(editFormRef.value);

  await $axiosPlugin
    .post("schedule/update/" + currentEvent.value.uuid, formData)
    .then((res) => {
      pendingEdit.value = false;
      closeEditModal();
      getSchedule();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingEdit.value = false;
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

const openEventModal = (uuid) => {
  eventModalIsVisible.value = true;
  currentEvent.value = { ...schedule.value.find((e) => e.uuid === uuid) };
  mentorOnlyForThisLesson.value = 1;
  dateShiftByWeek.value = 0;
};

const closeEventModal = () => {
  eventModalIsVisible.value = false;
  currentEvent.value = null;
};

const openEditModal = () => {
  eventModalIsVisible.value = false;
  editModalIsVisible.value = true;
};

const closeEditModal = () => {
  editModalIsVisible.value = false;
  currentEvent.value = null;
  errors.value = [];
};

const showHideScheduleSearchFilter = () => {
  if (searchFilter.value === true) {
    searchFilter.value = false;
    resetScheduleSearchFilter();
  } else {
    searchFilter.value = true;
  }
};

const resetScheduleSearchFilter = () => {
  searchFormRef.value.reset();
  selectedCourseId.value = "";
  getSchedule();
};

const debounceSchedule = debounceHandler(() => getSchedule(), 1000);
const debounceReset = debounceHandler(() => resetScheduleSearchFilter(), 500);

// Реактивные свойства для отслеживания выбранных значений
const selectedCourseId = ref("");

// Вычисляемые свойства для получения выбранных данных
const selectedCourse = computed(() =>
  attributes?.value?.courses?.find(
    (course) => course.course_id === Number(selectedCourseId.value)
  )
);

// Сброс значений при изменении выбора
const onCourseChange = () => {
  debounceSchedule();
};

onMounted(() => {
  getScheduleAttributes();
  getSchedule();
});
</script>
