<template>
  <!-- Загрузку показывает сам календарь (скелетон / перелив) — без
       полноэкранного лоадера -->
  <div class="col-span-12">
    <div class="custom-grid">
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

                <div class="col-span-12">
                  <button type="submit" class="btn btn-light full">
                    <i class="pi pi-filter-slash" aria-hidden="true"></i>
                    {{ $t("reset_search_filter") }}
                  </button>
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
        <scheduleGrid
          :schedule="schedule"
          :pendingSchedule="pendingSchedule"
          :rangeLoaded="scheduleHasData"
          :monthCounts="monthCounts"
          :openEventModal="openEventModal"
          :filtered="activeFilters > 0"
          :syncRoute="true"
          :keyboard="true"
          @range="setScheduleRange"
          @reset-filter="resetScheduleSearchFilter"
        >
          <template #actions>
            <roleProvider :roles="[1, 2, 3, 4]">
              <button
                type="button"
                class="btn"
                :class="searchFilter ? 'btn-outline-primary' : 'btn-light'"
                :aria-pressed="searchFilter"
                :title="
                  searchFilter
                    ? $t('hide_search_filter')
                    : $t('show_search_filter')
                "
                @click="showHideScheduleSearchFilter"
              >
                <i class="pi pi-filter" aria-hidden="true"></i>
                {{ $t("filter") }}
                <span v-if="activeFilters > 0" class="chip-count">{{
                  activeFilters
                }}</span>
              </button>
            </roleProvider>
          </template>
        </scheduleGrid>
      </div>
    </div>
  </div>

  <!-- Окно урока -->
  <modal
    :show="eventModalIsVisible"
    :onClose="() => closeEventModal()"
    :className="'modal-xl'"
    :showLoader="pendingDelete"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <h4 class="mb-0">{{ currentEvent?.lesson_name || currentEvent?.topic }}</h4>
    </template>
    <template v-if="currentEvent" v-slot:body_content>
      <div class="flex flex-col gap-4">
        <!-- Когда + метки состояния -->
        <div class="flex flex-wrap items-center gap-2">
          <p class="mb-0 font-semibold text-active">
            <i class="pi pi-clock text-sm text-inactive" aria-hidden="true"></i>
            {{ whenLabel(currentEvent) }}
          </p>
          <span v-if="currentEvent.is_active" class="status-pill text-success">
            <span class="live-dot mr-1.5" aria-hidden="true"></span>
            {{ $t("pages.conference.card_live") }}
          </span>
          <span v-if="currentEvent.moved" class="status-pill text-warning">
            <i class="pi pi-replay text-[10px] mr-1" aria-hidden="true"></i>
            {{ $t("pages.schedule.moved") }}
          </span>
        </div>

        <dl class="school-dl">
          <template v-if="!schoolStore.isAiSchoolDomain">
            <dt>{{ $t("pages.courses.course") }}</dt>
            <dd>
              {{ currentEvent.course_name }}
              <template v-if="currentEvent.level_name">· {{ currentEvent.level_name }}</template>
            </dd>

            <template v-if="currentEvent.section_name">
              <dt>{{ $t("pages.courses.course_section") }}</dt>
              <dd>{{ currentEvent.section_name }}</dd>
            </template>

            <dt>{{ $t("pages.groups.group") }}</dt>
            <dd>{{ currentEvent.group_name }}</dd>

            <template v-if="currentEvent.lesson_type_name">
              <dt>{{ $t("pages.lessons.lesson_type") }}</dt>
              <dd>{{ currentEvent.lesson_type_name }}</dd>
            </template>
          </template>
          <template v-else>
            <dt>{{ $t("pages.courses.title") }}</dt>
            <dd>
              <span class="text-list">
                <span v-for="(level, lIndex) in currentEvent.levels" :key="lIndex">
                  {{ level.level_name }}
                </span>
              </span>
            </dd>
          </template>

          <dt>{{ $t("mentor") }}</dt>
          <dd class="flex items-center gap-1.5">
            <userAvatar
              :padding="0.5"
              :className="'w-6 h-6 text-[10px]'"
              :user="mentorOf(currentEvent)"
            />
            {{ mentorOf(currentEvent).last_name }}
            {{ mentorOf(currentEvent).first_name }}
          </dd>
        </dl>

        <!-- Участники: первые несколько, остальные по кнопке -->
        <div>
          <p class="mb-2 font-medium">
            {{ $t("pages.groups.members") }}:
            <b>{{ currentEvent.members.length }}</b>
          </p>
          <div v-if="currentEvent.members.length > 0" class="btn-wrap">
            <userTag
              v-for="member in visibleMembers"
              :key="member.user_id"
              :user="member"
              :closable="false"
            />
            <button
              v-if="currentEvent.members.length > MEMBERS_PREVIEW"
              type="button"
              class="btn btn-sm btn-light"
              :aria-expanded="showAllMembers"
              @click="showAllMembers = !showAllMembers"
            >
              {{
                showAllMembers
                  ? $t("pages.schedule.members_collapse")
                  : $t("pages.schedule.members_more", {
                      count: currentEvent.members.length - MEMBERS_PREVIEW,
                    })
              }}
            </button>
          </div>
        </div>

        <div class="btn-wrap">
          <!-- Урок идёт — войти может участник, учитель и сотрудники школы -->
          <nuxt-link
            v-if="currentEvent.is_active && canJoin(currentEvent)"
            class="btn btn-success"
            :to="localePath('/dashboard/conference/' + currentEvent.uuid)"
          >
            <i class="pi pi-video" aria-hidden="true"></i>
            {{ $t("pages.conference.join") }}
          </nuxt-link>

          <roleProvider :roles="[1, 2, 3, 4]">
            <!-- Ссылка нужна только на предстоящий или идущий урок -->
            <button
              v-if="!currentEvent.is_gone"
              type="button"
              class="btn btn-light"
              @click="copyLink(currentEvent)"
            >
              <i class="pi pi-link" aria-hidden="true"></i>
              {{ $t("pages.conference.copy_link") }}
            </button>

            <!-- Переносить могут учитель урока, его создатель, а также
                 владелец / администратор школы — так же проверяет бэкенд -->
            <button
              v-if="canEdit(currentEvent)"
              type="button"
              class="btn btn-outline-primary"
              @click="openEditModal()"
            >
              <i class="pi pi-pencil" aria-hidden="true"></i>{{ $t("edit") }}
            </button>

            <button
              v-if="
                schoolStore.isAiSchoolDomain &&
                (currentEvent.mentor_id === authUser.user_id ||
                  currentEvent.operator_id === authUser.user_id)
              "
              type="button"
              class="btn btn-outline-danger"
              @click="confirmDeleteConference()"
            >
              <i class="pi pi-trash" aria-hidden="true"></i>{{ $t("delete") }}
            </button>
          </roleProvider>
        </div>
      </div>
    </template>
  </modal>

  <!-- Перенос урока -->
  <modal
    :show="editModalIsVisible"
    :onClose="() => closeEditModal(false)"
    :className="'modal-2xl'"
    :showLoader="pendingEdit"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4 class="mb-0">{{ currentEvent?.lesson_name || currentEvent?.topic }}</h4>
    </template>
    <template v-if="currentEvent" v-slot:body_content>
      <form @submit.prevent="editEventSubmit()" class="mt-2" ref="editFormRef">
        <div class="custom-grid">
          <div class="col-span-12">
            <div class="form-group-border select active">
              <i class="pi pi-user"></i>
              <select name="mentor_id" v-model="currentEvent.mentor_id">
                <option disabled value="">
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
                fieldError("mentor_id") || $t("mentor")
              }}</label>
            </div>
          </div>

          <div class="col-span-12" v-if="!schoolStore.isAiSchoolDomain">
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
                    "pages.conference.appoint_a_mentor_for_this_and_subsequent_lessons",
                  )
                }}</span>
              </label>
              <note
                v-if="mentorOnlyForThisLesson === 0"
                :message="
                  $t(
                    'pages.conference.appoint_a_mentor_for_this_and_subsequent_lessons_note',
                  )
                "
                :className="'outline-danger'"
              />
            </div>
          </div>

          <template v-else>
            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-pencil"></i>
                <input
                  type="text"
                  name="conf_topic"
                  :value="currentEvent?.topic"
                  placeholder=" "
                />
                <label :class="{ 'label-error': errors.conf_topic }">
                  {{ fieldError("conf_topic") || $t("pages.conference.topic.title") }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-pencil"></i>
                <textarea
                  name="conf_topic_description"
                  :value="currentEvent?.topic_description"
                  placeholder=" "
                ></textarea>
                <label>{{ $t("pages.conference.topic.description") }}</label>
              </div>
            </div>
          </template>

          <!-- Дата и время рядом -->
          <div class="col-span-12 sm:col-span-6">
            <div class="form-group-border active">
              <i class="pi pi-calendar"></i>
              <input
                type="date"
                v-model="currentEvent.date"
                name="start_date"
                :min="dateLimits.min"
                :max="dateLimits.max"
              />
              <label :class="{ 'label-error': errors.start_date }">
                {{ fieldError("start_date") || $t("pages.lessons.start_date") }}
              </label>
            </div>
          </div>

          <div class="col-span-12 sm:col-span-6">
            <div class="form-group-border active">
              <i class="pi pi-clock"></i>
              <!-- При сдвиге расписания меняется только дата, время уроков то же -->
              <input
                type="time"
                v-model="currentEvent.time"
                name="start_time"
                :readonly="shiftsSchedule"
                :class="{ 'opacity-60': shiftsSchedule }"
              />
              <label :class="{ 'label-error': errors.start_time }">
                {{ fieldError("start_time") || $t("pages.lessons.start_time") }}
              </label>
            </div>
          </div>

          <div class="col-span-12" v-if="!schoolStore.isAiSchoolDomain">
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

              <p class="mb-0 text-xs text-inactive">
                {{
                  shiftsSchedule
                    ? $t("pages.schedule.shift_hint")
                    : $t("pages.schedule.range_hint")
                }}
              </p>
            </div>
          </div>

          <div v-if="schoolStore.isAiSchoolDomain" class="col-span-12">
            <label class="custom-radio-checkbox">
              <input
                name="is_free"
                type="checkbox"
                :checked="currentEvent.is_free === 1"
              />
              <span>{{ $t("pages.conference.free_conference") }}</span>
            </label>
          </div>

          <!-- Что изменится -->
          <div v-if="moveSummary" class="col-span-12">
            <div class="move-summary" :class="{ danger: shiftsSchedule }">
              <p class="mb-0">
                <span class="text-inactive">{{ $t("pages.schedule.was") }}:</span>
                <b>{{ moveSummary.from }}</b>
                <i class="pi pi-arrow-right text-xs mx-1" aria-hidden="true"></i>
                <span class="text-inactive">{{ $t("pages.schedule.becomes") }}:</span>
                <b>{{ moveSummary.to }}</b>
              </p>
              <p v-if="shiftsSchedule" class="mb-0 text-sm">
                {{ $t("pages.schedule.shift_summary") }}
              </p>
            </div>
          </div>

          <div class="col-span-12">
            <button
              class="btn btn-primary"
              :class="{ loading: pendingEdit }"
              :disabled="pendingEdit"
              type="submit"
            >
              <i class="pi pi-check" aria-hidden="true"></i>
              {{ $t("save") }}
            </button>
          </div>
        </div>
      </form>
    </template>
  </modal>
</template>
<script setup>
import { ref, computed } from "vue";
import { useRouter } from "nuxt/app";
import scheduleGrid from "../../../components/schedule/scheduleGrid.vue";
import modal from "../../../components/ui/modal.vue";
import stickyBox from "../../../components/ui/stickyBox.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import roleProvider from "../../../components/ui/roleProvider.vue";
import multipleSelect from "../../../components/ui/multipleSelect.vue";
import userTag from "../../../components/ui/userTag.vue";
import note from "../../../components/ui/note.vue";
import userAvatar from "../../../components/ui/userAvatar.vue";
import { useConfirm } from "~/composables/useConfirm";
import { useNotify } from "~/composables/useNotify";
import { checkConferenceLiveNow } from "~/composables/useConferenceLive";
import { useScheduleLoader } from "~/composables/useScheduleLoader";

const router = useRouter();
const localePath = useLocalePath();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const schoolStore = useSchoolStore();
const authUser = useSanctumUser();
const attributes = ref([]);
const pendingEdit = ref(false);
const pendingDelete = ref(false);
const searchFormRef = ref(null);
const editFormRef = ref(null);
const searchFilter = ref(false);

const { t, locale } = useI18n();
const notify = useNotify();
const confirm = useConfirm();

const currentEvent = ref(null);
// Исходные дата и время — для сводки «Было → Станет» и границ переноса
const originalEvent = ref(null);

const eventModalIsVisible = ref(false);
const editModalIsVisible = ref(false);

const mentorOnlyForThisLesson = ref(1);
const dateShiftByWeek = ref(0);

const MEMBERS_PREVIEW = 10;
const showAllMembers = ref(false);

useHead({
  title: t("pages.schedule.title"),
  meta: [{ name: "description", content: t("pages.home.description") }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const goToError = (err) => {
  if (err.response) {
    router.push({
      path: "/error",
      query: {
        status: err.response.status,
        message: err.response.data?.message,
        url: err.request?.responseURL,
      },
    });
  } else {
    router.push("/error");
  }
};

const getScheduleAttributes = async () => {
  await $axiosPlugin
    .get("schedule/get_attributes")
    .then((response) => {
      attributes.value = response.data;
    })
    .catch(goToError);
};

// Сколько условий фильтра заполнено — число на кнопке «Фильтр»
const activeFilters = ref(0);

const countFilters = () => {
  if (!searchFormRef.value) {
    activeFilters.value = 0;
    return;
  }
  const names = new Set();
  for (const [name, value] of new FormData(searchFormRef.value).entries()) {
    if (typeof value === "string" && value.trim() !== "") names.add(name);
  }
  activeFilters.value = names.size;
};

// Расписание грузится помесячно — только то, что видно в календаре
// (composables/useScheduleLoader.js), с фильтрами из формы
const {
  schedule,
  pending: pendingSchedule,
  hasData: scheduleHasData,
  monthCounts,
  setRange: setScheduleRange,
  refresh: refreshSchedule,
} = useScheduleLoader({
  getFormData: () => new FormData(searchFormRef.value || undefined),
  onError: goToError,
});

// Фильтр изменился / урок перенесён или удалён — перезагружаем видимый период
const getSchedule = async () => {
  countFilters();
  await refreshSchedule();

  if (currentEvent.value && eventModalIsVisible.value) {
    openEventModal(currentEvent.value.uuid);
  }
};

/* ---------- Окно урока ---------- */

const intlLocale = computed(() => String(locale.value || "ru").split("-")[0]);

// «Пн, 24 ноября · 10:00–11:00»
const whenLabel = (event) => {
  if (!event?.date) return event?.start_time_formatted || "";
  const day = new Date(`${event.date}T00:00:00`).toLocaleDateString(intlLocale.value, {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
  const time = [event.time, event.time_end].filter(Boolean).join("–");
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${time}`;
};

const mentorOf = (event) => ({
  last_name: event.mentor_last_name || event.moderator_last_name || "",
  first_name: event.mentor_first_name || event.moderator_first_name || "",
  avatar: event.mentor_avatar || event.moderator_avatar || "",
});

const visibleMembers = computed(() => {
  const members = currentEvent.value?.members || [];
  return showAllMembers.value ? members : members.slice(0, MEMBERS_PREVIEW);
});

const isStaffRole = () => [1, 2, 3].includes(Number(authUser.value?.current_role_id));

const canEdit = (event) =>
  event.mentor_id === authUser.value?.user_id ||
  event.operator_id === authUser.value?.user_id ||
  isStaffRole();

const canJoin = (event) => event.is_member === true || canEdit(event);

const requestUrl = useRequestURL();

const writeToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    if (!document.execCommand("copy")) throw new Error("copy failed");
  } finally {
    document.body.removeChild(textarea);
  }
};

const copyLink = async (event) => {
  const url = `${requestUrl.origin}${localePath("/dashboard/conference/" + event.uuid)}`;
  try {
    await writeToClipboard(url);
    notify("success", t("pages.conference.link_copied"));
  } catch (e) {
    // Браузер не дал скопировать — показываем ссылку, чтобы скопировать вручную
    notify("warning", url, { timeout: 15000 });
  }
};

/* ---------- Перенос урока ---------- */

const shiftsSchedule = computed(
  () => !schoolStore.isAiSchoolDomain && dateShiftByWeek.value === 1,
);

// Бэкенд разрешает переносить на ±2 дня; при сдвиге расписания — не раньше −2
const dateLimits = computed(() => {
  const base = originalEvent.value?.date;
  if (!base || schoolStore.isAiSchoolDomain) return { min: undefined, max: undefined };
  const shift = (days) => {
    const d = new Date(`${base}T00:00:00`);
    d.setDate(d.getDate() + days);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  return { min: shift(-2), max: shiftsSchedule.value ? undefined : shift(2) };
});

// При сдвиге расписания время не меняется — возвращаем исходное
watch(shiftsSchedule, (shift) => {
  if (shift && currentEvent.value && originalEvent.value) {
    currentEvent.value.time = originalEvent.value.time;
  }
});

const moveSummary = computed(() => {
  const from = originalEvent.value;
  const to = currentEvent.value;
  if (!from || !to?.date || !to?.time) return null;
  if (from.date === to.date && from.time === to.time) return null;
  return {
    from: whenLabel({ date: from.date, time: from.time }),
    to: whenLabel({ date: to.date, time: to.time }),
  };
});

// Ошибка поля: сервер присылает и строку, и массив строк
const fieldError = (name) => {
  const value = errors.value?.[name];
  if (!value) return "";
  return Array.isArray(value) ? value[0] : String(value);
};

const editEventSubmit = async (force = false) => {
  if (pendingEdit.value) return;
  pendingEdit.value = true;
  const formData = new FormData(editFormRef.value);
  if (force) formData.append("force", 1);
  const uuid = currentEvent.value.uuid;

  await $axiosPlugin
    .post("schedule/update/" + uuid, formData)
    .then(() => {
      pendingEdit.value = false;
      notify("success", t("pages.schedule.moved_success"));
      closeEditModal(true);
      getSchedule();
      // Перенос мог сделать урок текущим или убрать его — обновим меню сразу
      checkConferenceLiveNow();
    })
    .catch(async (err) => {
      pendingEdit.value = false;
      const code = err.response?.status;
      if (code === 422) {
        errors.value = err.response.data;
      } else if (code === 409 && err.response.data?.message === "mentor_busy") {
        // У учителя в это время другой урок — решает пользователь
        const c = err.response.data.conflict || {};
        const start = c.start_time ? new Date(c.start_time) : null;
        const end = c.end_time ? new Date(c.end_time) : null;
        const fmt = (d) =>
          d ? d.toLocaleTimeString(intlLocale.value, { hour: "2-digit", minute: "2-digit" }) : "";
        const ok = await confirm({
          title: t("pages.schedule.conflict_title"),
          message: t("pages.schedule.conflict_message", {
            lesson: [c.title, c.group_name].filter(Boolean).join(" · "),
            date: start ? start.toLocaleDateString(intlLocale.value, { day: "numeric", month: "long" }) : "",
            time: [fmt(start), fmt(end)].filter(Boolean).join("–"),
          }),
          confirmText: t("pages.schedule.conflict_confirm"),
        });
        if (ok) editEventSubmit(true);
      } else if (code === 403) {
        // Нет прав переносить этот урок — сообщение, без ухода на /error
        notify("danger", t("errors.no_permission"));
      } else {
        goToError(err);
      }
    });
};

const confirmDeleteConference = async () => {
  const ok = await confirm({
    title: t("pages.conference.delete_conference"),
    message: t("pages.conference.delete_confirm"),
    confirmText: t("delete"),
    danger: true,
  });
  if (ok) deleteConferenceSubmit();
};

const deleteConferenceSubmit = async () => {
  if (pendingDelete.value) return;
  // Лоадер — в окне урока, где нажали «Удалить» (modal :showLoader)
  pendingDelete.value = true;
  const formData = new FormData();
  formData.append("operation_type_id", 29);
  await $axiosPlugin
    .post("conferences/delete/" + currentEvent.value.uuid, formData)
    .then(() => {
      pendingDelete.value = false;
      closeEventModal();
      getSchedule();
      checkConferenceLiveNow();
    })
    .catch((err) => {
      if (err.response?.status == 422) {
        errors.value = err.response.data;
        pendingDelete.value = false;
      } else {
        goToError(err);
      }
    });
};

const openEventModal = (uuid) => {
  const found = schedule.value.find((e) => e.uuid === uuid);
  if (!found) {
    eventModalIsVisible.value = false;
    currentEvent.value = null;
    return;
  }
  eventModalIsVisible.value = true;
  currentEvent.value = { ...found };
  originalEvent.value = { ...found };
  showAllMembers.value = false;
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

const closeEditModal = (state) => {
  editModalIsVisible.value = false;
  errors.value = [];

  if (state === false && currentEvent.value) {
    openEventModal(currentEvent.value.uuid);
  }
};

const showHideScheduleSearchFilter = () => {
  if (searchFilter.value === true) {
    searchFilter.value = false;
    if (activeFilters.value > 0) resetScheduleSearchFilter();
  } else {
    searchFilter.value = true;
  }
};

const resetScheduleSearchFilter = () => {
  searchFormRef.value?.reset();
  selectedCourseId.value = "";
  getSchedule();
};

const debounceSchedule = debounceHandler(() => getSchedule(), 1000);
const debounceReset = debounceHandler(() => resetScheduleSearchFilter(), 500);

const selectedCourseId = ref("");

const selectedCourse = computed(() =>
  attributes?.value?.courses?.find(
    (course) => course.course_id === Number(selectedCourseId.value),
  ),
);

const onCourseChange = () => {
  debounceSchedule();
};

// Само расписание календарь запросит сам (@range), когда отрисуется
onMounted(() => {
  getScheduleAttributes();
});
</script>
