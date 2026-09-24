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
        <scheduleGrid
          :schedule="schedule"
          :pendingSchedule="pendingSchedule"
          :openEventModal="openEventModal"
        />
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
      <h4>{{ currentEvent?.lesson_name || currentEvent?.topic }}</h4>
    </template>
    <template v-if="currentEvent" v-slot:body_content>
      <div class="custom-grid">
        <div class="col-span-12">
          <template v-if="!schoolStore.isAiSchoolDomain">
            <p class="text-inactive">
              <i class="pi pi-book"></i> {{ $t("pages.courses.course") }}:
              <b class="text-active"
                >{{ currentEvent.course_name }} -
                {{ currentEvent.level_name }}</b
              >
            </p>
            <p class="text-inactive">
              <i class="pi pi-users"></i> {{ $t("pages.groups.group") }}:
              <b class="text-active">{{ currentEvent.group_name }}</b>
            </p>
            <p class="text-inactive">
              <i class="pi pi-users"></i> {{ $t("pages.groups.group") }}:
              <b class="text-active">{{ currentEvent.group_name }}</b>
            </p>
          </template>
          <template v-else>
            <p class="text-inactive">
              <i class="pi pi-book"></i> {{ $t("pages.courses.title") }}:
              <b class="text-active">
                <span class="text-list">
                  <span
                    v-for="(level, lIndex) in currentEvent.levels"
                    :key="lIndex"
                  >
                    {{ level.level_name }}
                  </span>
                </span>
              </b>
            </p>
          </template>

          <p class="text-inactive">
            <i class="pi pi-user"></i> {{ $t("mentor") }}:
            <b class="text-active"
              >{{
                currentEvent.mentor_last_name ||
                currentEvent.moderator_last_name ||
                ""
              }}
              {{
                currentEvent.mentor_first_name ||
                currentEvent.moderator_first_name ||
                ""
              }}</b
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

        <roleProvider :roles="[1, 2, 3, 4]">
          <div class="col-span-12">
            <div class="btn-wrap">
              <button
                v-if="
                  currentEvent.mentor_id === authUser.user_id ||
                  currentEvent.operator_id === authUser.user_id
                "
                class="btn btn-outline-primary"
                @click="openEditModal()"
              >
                <i class="pi pi-pencil"></i>{{ $t("edit") }}
              </button>

              <button
                v-if="
                  schoolStore.isAiSchoolDomain &&
                  (currentEvent.mentor_id === authUser.user_id ||
                    currentEvent.operator_id === authUser.user_id)
                "
                class="btn btn-outline-danger"
                @click="openDeleteModal()"
              >
                <i class="pi pi-trash"></i>{{ $t("delete") }}
              </button>
            </div>
          </div>
        </roleProvider>
      </div>
    </template>
  </modal>

  <modal
    :show="editModalIsVisible"
    :onClose="() => closeEditModal(false)"
    :className="'modal-2xl'"
    :showLoader="pendingEdit"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ currentEvent?.lesson_name || currentEvent?.topic }}</h4>
    </template>
    <template v-if="currentEvent" v-slot:body_content>
      <form @submit.prevent="editEventSubmit" class="mt-2" ref="editFormRef">
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
                errors.mentor_id ? errors.mentor_id[0] : $t("mentor")
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
                  {{
                    errors.conf_topic
                      ? errors.conf_topic[0]
                      : $t("pages.conference.topic.title")
                  }}
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

  <modal
    :show="deleteModalIsVisible"
    :onClose="() => closeDeleteModal()"
    :className="'modal-lg'"
    :showLoader="pendingDelete"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.conference.delete_conference") }}</h4>
    </template>
    <template v-slot:body_content>
      <p>{{ $t("pages.conference.delete_confirm") }}</p>
      <div class="btn-wrap justify-end mt-4">
        <button
          @click="deleteConferenceSubmit()"
          class="btn btn-outline-danger"
        >
          <i class="pi pi-trash"></i>
          {{ $t("yes") }}
        </button>
        <button @click="deleteModalIsVisible = false" class="btn btn-light">
          <i class="pi pi-ban"></i>
          {{ $t("no") }}
        </button>
      </div>
    </template>
  </modal>
</template>
<script setup>
import { ref, computed } from "vue";
import { useRouter } from "nuxt/app";
import scheduleGrid from "../../../components/schedule/scheduleGrid.vue";
import modal from "../../../components/ui/modal.vue";
import loader from "../../../components/ui/loader.vue";
import stickyBox from "../../../components/ui/stickyBox.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import roleProvider from "../../../components/ui/roleProvider.vue";
import multipleSelect from "../../../components/ui/multipleSelect.vue";
import userTag from "../../../components/ui/userTag.vue";
import note from "../../../components/ui/note.vue";

const router = useRouter();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const schoolStore = useSchoolStore();
const authUser = useSanctumUser();
const attributes = ref([]);
const schedule = ref([]);
const pending = ref(true);
const pendingSchedule = ref(true);
const pendingEdit = ref(false);
const pendingDelete = ref(false);
const searchFormRef = ref(null);
const editFormRef = ref(null);
const searchFilter = ref(false);

const { t } = useI18n();

const currentEvent = ref(null);

const eventModalIsVisible = ref(false);
const editModalIsVisible = ref(false);
const deleteModalIsVisible = ref(false);

const mentorOnlyForThisLesson = ref(1);
const dateShiftByWeek = ref(0);

useHead({
  title: t("pages.schedule.title"),
  meta: [{ name: "description", content: t("pages.home.description") }],
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

      if (currentEvent.value) {
        openEventModal(currentEvent.value.uuid);
      }
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
  const uuid = currentEvent.value.uuid;

  await $axiosPlugin
    .post("schedule/update/" + uuid, formData)
    .then((res) => {
      pendingEdit.value = false;
      closeEditModal(true);
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

const deleteConferenceSubmit = async () => {
  pendingDelete.value = true;
  const formData = new FormData();
  formData.append("operation_type_id", 29);
  await $axiosPlugin
    .post("conferences/delete/" + currentEvent.value.uuid, formData)
    .then((response) => {
      pendingDelete.value = false;
      closeDeleteModal();
      closeEventModal();
      getSchedule();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingDelete.value = false;
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
  currentEvent.value = null;
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

const closeEditModal = (state) => {
  editModalIsVisible.value = false;
  errors.value = [];

  if (state === false) {
    openEventModal(currentEvent.value.uuid);
  }
};

const openDeleteModal = () => {
  deleteModalIsVisible.value = true;
};

const closeDeleteModal = () => {
  deleteModalIsVisible.value = false;
  pendingDelete.value = false;
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
    (course) => course.course_id === Number(selectedCourseId.value),
  ),
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
