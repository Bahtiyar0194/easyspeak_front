<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <div class="btn-wrap">
        <roleProvider :roles="[1, 2, 3]">
          <button
            @click="createModalIsVisible = true"
            class="btn btn-outline-primary"
          >
            <i class="pi pi-plus"></i>
            {{ $t("pages.groups.create_group") }}
          </button>
        </roleProvider>
        <button @click="showHideGroupSearchFilter" class="btn btn-light">
          <i class="pi pi-search"></i>
          {{
            searchFilter === true
              ? $t("hide_search_filter")
              : $t("show_search_filter")
          }}
        </button>
      </div>
    </div>

    <div
      class="col-span-12 lg:col-span-3"
      :class="searchFilter ? 'block' : 'hidden'"
    >
      <stickyBox>
        <div class="card p-4">
          <h5>{{ $t("pages.groups.search_filter") }}</h5>
          <form @submit.prevent="debounceReset" ref="searchFormRef">
            <div class="custom-grid">
              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-users"></i>
                  <input
                    type="text"
                    name="group_name"
                    placeholder=" "
                    @input="debounceGroups"
                  />
                  <label>{{ $t("pages.groups.group_name") }}</label>
                </div>
              </div>

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
                  :onChange="debounceGroups"
                />
              </div>

              <div class="col-span-12">
                <multipleSelect
                  :className="'form-group-border select active label-active'"
                  :icon="'pi pi-user'"
                  :label="$t('operator')"
                  :items="attributes.group_operators"
                  :optionName="'operators[]'"
                  :optionValue="'user_id'"
                  :optionLabel="'full_name'"
                  :avatar="true"
                  :onChange="debounceGroups"
                />
              </div>

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
                  :onChange="debounceGroups"
                />
              </div>

              <div class="col-span-12">
                <multipleSelect
                  :className="'form-group-border select active label-active'"
                  :icon="'pi pi-hourglass'"
                  :label="$t('status')"
                  :items="attributes.group_statuses"
                  :optionName="'statuses[]'"
                  :optionValue="'status_type_id'"
                  :optionLabel="'status_type_name'"
                  :onChange="debounceGroups"
                />
              </div>

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-calendar"></i>
                  <input
                    type="date"
                    name="created_at_from"
                    @input="debounceGroups"
                    placeholder=" "
                  />
                  <label>{{ $t("created_at_from") }}</label>
                </div>
              </div>

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-calendar"></i>
                  <input
                    type="date"
                    name="created_at_to"
                    @input="debounceGroups"
                    placeholder=" "
                  />
                  <label>{{ $t("created_at_to") }}</label>
                </div>
              </div>

              <div class="col-span-12">
                <div class="btn-wrap">
                  <button type="submit" class="btn btn-sm btn-outline-primary">
                    <i class="pi pi-undo"></i>
                    {{ $t("reset_search_filter") }}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </stickyBox>
    </div>

    <div class="col-span-12" :class="searchFilter && 'lg:col-span-9'">
      <template v-if="groups.data?.length > 0">
        <div class="table table-striped table-sm selectable">
          <loader
            v-if="pending"
            :className="'overlay'"
            :showPendingText="true"
          />
          <table ref="tableRef">
            <thead>
              <tr>
                <sortTableHead
                  v-for="(head, index) in groupsTableHeads"
                  :key="index"
                  :title="head.title"
                  :keyName="head.keyName"
                  :sortKey="sortKey"
                  :sortDirection="sortDirection"
                  :sortType="head.sortType"
                  :sortHandler="debounceGroups"
                  @update:sortKey="sortKey = $event"
                  @update:sortDirection="sortDirection = $event"
                />
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="group in groups.data"
                :key="group.group_id"
                @click="getGroup(group.group_id)"
              >
                <td>{{ group.group_name }}</td>
                <td>{{ group.course_name }}</td>
                <td>{{ group.level_name }}</td>
                <td>
                  <div class="flex gap-x-2 items-center">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-6 h-6'"
                      :user="{
                        last_name: group.operator_last_name,
                        first_name: group.operator_first_name,
                        avatar: group.operator_avatar,
                      }"
                    />
                    {{ group.operator_last_name }}
                    {{ group.operator_first_name }}
                  </div>
                </td>
                <td>
                  <div class="flex gap-x-2 items-center">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-6 h-6'"
                      :user="{
                        last_name: group.mentor_last_name,
                        first_name: group.mentor_first_name,
                        avatar: group.mentor_avatar,
                      }"
                    />
                    {{ group.mentor_last_name }} {{ group.mentor_first_name }}
                  </div>
                </td>
                <td>{{ group.members_count }}</td>
                <td>
                  {{
                    new Date(group.started_at).toLocaleString(undefined, {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false, // можно убрать или поставить true, если нужен 12-часовой формат
                    })
                  }}
                </td>
                <td>
                  {{
                    new Date(group.created_at).toLocaleString(undefined, {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false, // можно убрать или поставить true, если нужен 12-часовой формат
                    })
                  }}
                </td>
                <td :class="group.status_color">
                  {{ group.status_type_name }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="btn-wrap mt-4">
          <pagination
            :items="groups"
            :setItems="getGroups"
            :onSelect="(count) => (perPage = count)"
          />
        </div>
      </template>
      <alert v-else :className="'light'">
        <loader v-if="pending" :className="'overlay'" :showPendingText="true" />
        <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
      </alert>
    </div>
  </div>

  <modal
    :show="groupModalIsVisible"
    :onClose="() => closeModal()"
    :className="'modal-2xl'"
    :showLoader="pendingGroup"
    :showPendingText="true"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <h4>{{ currentGroup?.group_name }}</h4>
    </template>
    <template v-slot:body_content>
      <div v-if="currentGroup" class="flex flex-col gap-y-3">
        <p v-if="currentGroup.group_description" class="mb-0">
          <span class="text-inactive"
            >{{ $t("pages.groups.group_description") }}:
          </span>
          <b>{{ currentGroup.group_description }}</b>
        </p>
        <p class="mb-0">
          <span class="text-inactive"
            >{{ $t("pages.groups.group_category") }}:
          </span>
          <b>{{ currentGroup.level.level_name }}</b>
        </p>

        <div class="flex gap-x-2 items-center">
          <p class="mb-0">
            <span class="text-inactive">{{ $t("mentor") }}: </span>
          </p>
          <userTag v-if="currentGroup.mentor" :user="currentGroup.mentor" />
        </div>

        <div class="flex gap-x-2 items-center">
          <p class="mb-0">
            <span class="text-inactive">{{ $t("operator") }}:</span>
          </p>
          <userTag v-if="currentGroup.operator" :user="currentGroup.operator" />
        </div>

        <p class="mb-0">
          <span class="text-inactive"
            >{{ $t("pages.lessons.first_lesson_free") }}:
          </span>
          <b>{{
            currentGroup.first_lesson_free === 1 ? $t("yes") : $t("no")
          }}</b>
        </p>

        <p v-if="currentGroup.current_price" class="mb-0">
          <span class="text-inactive">{{ $t("pages.lessons.price") }}: </span>
          <b
            >{{ currentGroup.current_price.toLocaleString("ru-RU") }}
            {{ $contacts.bank.currency.symbol }}</b
          >
        </p>

        <p class="mb-0">
          <span class="text-inactive"
            >{{ $t("pages.payment.payment_form") }}:
          </span>
          <b>{{
            currentGroup.is_legal === 1
              ? $t("pages.payment.forms.legal_entity")
              : $t("pages.payment.forms.natural_person")
          }}</b>
        </p>

        <p class="mb-0" v-if="currentGroup.group_members">
          <span class="text-inactive"
            >{{ $t("pages.groups.members_count") }}:
          </span>
          <b>{{ currentGroup.group_members.length }}</b>
        </p>

        <p class="mb-0">
          <span class="text-inactive">{{ $t("pages.groups.members") }}:</span>
        </p>

        <div v-if="currentGroup.group_members" class="btn-wrap">
          <userTag
            v-for="(member, index) in currentGroup.group_members"
            :key="index"
            :user="member"
          />
        </div>

        <div class="btn-wrap">
          <button @click="openScheduleModal" class="btn btn-light">
            <i class="pi pi-calendar-clock"></i>
            {{ $t("pages.schedule.show_schedule") }}
          </button>

          <roleProvider :roles="[1, 2, 3]">
            <button @click="openPaymentsModal" class="btn btn-light">
              <i class="pi pi-credit-card"></i>
              {{ $t("pages.payment.title") }}
            </button>

            <button @click="getEditGroup" class="btn btn-light">
              <i class="pi pi-pencil"></i>
              {{ $t("edit") }}
            </button>
          </roleProvider>
        </div>
      </div>
    </template>
  </modal>

  <modal
    :show="createModalIsVisible"
    :onClose="() => closeModal('create')"
    :className="currentStep != 3 ? 'modal-4xl' : ''"
    :showLoader="pendingCreate"
    :showPendingText="true"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.groups.create_group_title") }}</h4>
    </template>
    <template v-slot:body_content>
      <subscription
        v-if="
          schoolStore.schoolData && schoolStore.schoolData.subscription_expired
        "
      />
      <steps v-else :currentStep="currentStep" :steps="newGroupSteps">
        <form
          @submit.prevent="createGroupSubmit"
          class="mt-2"
          ref="createFormRef"
        >
          <div
            v-for="(step, index) in newGroupSteps"
            :key="index"
            :class="currentStep === index + 1 ? 'block' : 'hidden'"
          >
            <component
              v-if="step.component"
              :is="step.component"
              v-bind="step.props"
            ></component>
          </div>

          <div class="btn-wrap mt-4">
            <button
              v-if="currentStep > 1"
              class="btn btn-light"
              @click="currentStep = currentStep - 1"
              type="button"
            >
              <i class="pi pi-arrow-left"></i>
              {{ $t("back") }}
            </button>

            <button class="btn btn-primary" type="submit">
              <template v-if="currentStep !== newGroupSteps.length">
                <i class="pi pi-arrow-right"></i>
                {{ $t("continue") }}
              </template>
              <template v-else>
                <i class="pi pi-check"></i>
                {{ $t("save") }}
              </template>
            </button>
          </div>
        </form>
      </steps>
    </template>
  </modal>

  <modal
    :show="editModalIsVisible"
    :onClose="() => closeModal('edit')"
    :className="currentStep != 3 ? 'modal-4xl' : ''"
    :showLoader="pendingEdit"
    :showPendingText="true"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.groups.edit_group_title") }}</h4>
    </template>
    <template v-slot:body_content>
      <steps :currentStep="currentStep" :steps="editGroupSteps">
        <form @submit.prevent="editGroupSubmit" class="mt-2" ref="editFormRef">
          <div
            v-for="(step, index) in editGroupSteps"
            :key="index"
            :class="currentStep === index + 1 ? 'block' : 'hidden'"
          >
            <component
              v-if="step.component"
              :is="step.component"
              v-bind="step.props"
            ></component>
          </div>

          <div class="btn-wrap mt-4">
            <button
              v-if="currentStep > 1"
              class="btn btn-light"
              @click="currentStep = currentStep - 1"
              type="button"
            >
              <i class="pi pi-arrow-left"></i>
              {{ $t("back") }}
            </button>

            <button class="btn btn-primary" type="submit">
              <template v-if="currentStep !== editGroupSteps.length">
                <i class="pi pi-arrow-right"></i>
                {{ $t("continue") }}
              </template>
              <template v-else>
                <i class="pi pi-check"></i>
                {{ $t("save") }}
              </template>
            </button>
          </div>
        </form>
      </steps>
    </template>
  </modal>

  <modal
    :show="scheduleModalIsVisible"
    :onClose="() => closeModal('schedule')"
    :className="'modal-6xl'"
    :showLoader="false"
    :showPendingText="true"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>
        {{ currentGroup ? currentGroup.group_name : "" }} -
        {{ $t("pages.schedule.title") }}
      </h4>
    </template>
    <template v-slot:body_content>
      <scheduleGrid
        v-if="currentGroup"
        :schedule="currentGroup.schedule"
        :pendingSchedule="false"
        :openEventModal="null"
      />
    </template>
  </modal>

  <modal
    :show="paymentsModalIsVisible"
    :onClose="() => closeModal('payments')"
    :className="'modal-6xl'"
    :showLoader="pendingPaymentStatus"
    :showPendingText="true"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>
        {{ currentGroup ? currentGroup.group_name : "" }} -
        {{ $t("pages.payment.title") }}
      </h4>
    </template>
    <template v-if="currentGroup" v-slot:body_content>
      <div class="custom-grid">
        <tabs
          v-if="upcomingLessons.length || goneLessons.length"
          :tabs="tabs_data"
          :activeTabIndex="1"
        />
        <div class="col-span-12">
          <div class="btn-wrap justify-end">
            <button
              class="btn btn-primary"
              :class="!newPayments.length ? 'disabled' : ''"
              @click="closeModal('payments')"
            >
              <i class="pi pi-arrow-right"></i>
              {{ $t("continue") }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </modal>

  <modal
    :show="savePaymentsModalIsVisible"
    :onClose="() => closeModal('return_to_payments')"
    :className="'modal-xl'"
    :showLoader="pendingPaymentStatus"
    :showPendingText="true"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("save_changes.title") }}</h4>
    </template>
    <template v-if="currentGroup" v-slot:body_content>
      <div class="custom-grid">
        <div class="col-span-12">
          <p>
            {{ $t("save_changes.confirm") }}
          </p>
          <div class="btn-wrap justify-end">
            <button class="btn btn-outline-primary" @click="savePayments()">
              <i class="pi pi-save"></i>
              {{ $t("save_changes.save") }}
            </button>
            <button
              class="btn btn-light"
              @click="closeModal('unsave_payments')"
            >
              <i class="pi pi-ban"></i>
              {{ $t("save_changes.unsave") }}
            </button>
            <button
              class="btn btn-light"
              @click="closeModal('return_to_payments')"
            >
              <i class="pi pi-refresh"></i>
              {{ $t("save_changes.return") }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </modal>
</template>
<script setup>
import { useRouter } from "nuxt/app";
import modal from "../../ui/modal.vue";
import subscription from "../../ui/subscription.vue";
import scheduleGrid from "../../schedule/scheduleGrid.vue";
import loader from "../../ui/loader.vue";
import alert from "../../ui/alert.vue";
import userAvatar from "../../ui/userAvatar.vue";
import userTag from "../../ui/userTag.vue";
import stickyBox from "../../ui/stickyBox.vue";
import pagination from "../../ui/pagination.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import steps from "../../ui/steps.vue";
import createFirstStep from "./components/createFirstStep.vue";
import createSecondStep from "./components/createSecondStep.vue";
import editFirstStep from "./components/editFirstStep.vue";
import editSecondStep from "./components/editSecondStep.vue";
import thirdStep from "./components/thirdStep.vue";
import fourthStep from "./components/fourthStep.vue";
import roleProvider from "../../ui/roleProvider.vue";
import multipleSelect from "../../ui/multipleSelect.vue";
import sortTableHead from "../../ui/sortTableHead.vue";
import tabs from "../../ui/tabs.vue";
import paymentsGrid from "./components/paymentsGrid.vue";

const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const schoolStore = useSchoolStore();
const { t } = useI18n();
const pending = ref(true);
const pendingGroup = ref(false);
const pendingCreate = ref(false);
const pendingEdit = ref(false);
const pendingPaymentStatus = ref(false);
const newPayments = ref([]);
const groupData = ref([]);
const tableRef = ref(null);
const searchFormRef = ref(null);
const createFormRef = ref(null);
const editFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(10);
const groups = ref([]);
const currentGroup = ref(null);
const groupMembers = ref([]);
const attributes = ref([]);

const upcomingLessons = ref([]);
const goneLessons = ref([]);

const errors = ref([]);

const currentStep = ref(1);

const createModalIsVisible = ref(false);
const groupModalIsVisible = ref(false);
const editModalIsVisible = ref(false);
const scheduleModalIsVisible = ref(false);
const paymentsModalIsVisible = ref(false);
const savePaymentsModalIsVisible = ref(false);

const sortKey = ref("groups.created_at"); // Ключ сортировки
const sortDirection = ref("asc"); // Направление сортировки: asc или desc

const daysOfWeek = [
  { id: 1, name: t("weekdays.monday.even") },
  { id: 2, name: t("weekdays.tuesday.even") },
  { id: 3, name: t("weekdays.wednesday.even") },
  { id: 4, name: t("weekdays.thursday.even") },
  { id: 5, name: t("weekdays.friday.even") },
  { id: 6, name: t("weekdays.saturday.even") },
  { id: 7, name: t("weekdays.sunday.even") },
];

// выбранные дни
const selectedDays = ref([]); // массив чисел, например [2,5]

const sortedDays = computed(() => {
  return [...selectedDays.value].sort((a, b) => a - b);
});

const groupsTableHeads = [
  {
    title: t("pages.groups.group_name"),
    keyName: "groups.group_name",
    sortType: "alpha",
  },
  {
    title: t("pages.courses.course"),
    keyName: "courses_lang.course_name",
    sortType: "alpha",
  },
  {
    title: t("pages.groups.group_category"),
    keyName: "course_levels_lang.level_name",
    sortType: "alpha",
  },
  {
    title: t("operator"),
    keyName: "operator.last_name",
    sortType: "alpha",
  },
  {
    title: t("mentor"),
    keyName: "mentor.last_name",
    sortType: "alpha",
  },
  {
    title: t("pages.groups.members_count"),
    keyName: "members_count",
    sortType: "numeric",
  },
  {
    title: t("pages.schedule.start_date"),
    keyName: "groups.started_at",
    sortType: "numeric",
  },
  {
    title: t("created_at"),
    keyName: "groups.created_at",
    sortType: "numeric",
  },
  {
    title: t("status"),
    keyName: "types_of_status_lang.status_type_name",
    sortType: "alpha",
  },
];

const newGroupSteps = [
  {
    title: t("pages.groups.group_description"),
    component: createFirstStep,
    props: { errors, attributes },
  },
  {
    title: t("pages.schedule.title"),
    component: createSecondStep,
    props: { errors, daysOfWeek, selectedDays },
  },
  {
    title: t("pages.groups.add_members_to_group"),
    component: thirdStep,
    props: { errors, groupMembers, modalIsVisible: createModalIsVisible },
  },
  {
    title: t("pages.groups.saving_a_group"),
    component: fourthStep,
    props: { errors, groupData },
  },
];

const editGroupSteps = [
  {
    title: t("pages.groups.group_description"),
    component: editFirstStep,
    props: { errors, attributes, currentGroup },
  },
  {
    title: t("pages.schedule.title"),
    component: editSecondStep,
    props: { errors, currentGroup, daysOfWeek, selectedDays },
  },
  {
    title: t("pages.groups.edit_group_members"),
    component: thirdStep,
    props: { errors, groupMembers, modalIsVisible: editModalIsVisible },
  },
  {
    title: t("pages.groups.saving_a_group"),
    component: fourthStep,
    props: { errors, groupData },
  },
];

const tabs_data = computed(() => [
  {
    name: "gone",
    title: t("pages.lessons.gone_lessons"),
    icon: "pi pi-calendar-times",
    component: paymentsGrid,
    props: {
      schedule: goneLessons,
      newPayments: newPayments,
      changePaymentStatus: changePaymentStatus,
      emptyMessage: t("pages.lessons.no_gone_lessons"),
      editIsAvailable: currentGroup.value.is_legal === 1 ? true : false,
    },
  },
  {
    name: "upcoming",
    title: t("pages.lessons.upcoming_lessons_alt"),
    icon: "pi pi-calendar-clock",
    component: paymentsGrid,
    props: {
      schedule: upcomingLessons,
      newPayments: newPayments,
      changePaymentStatus: changePaymentStatus,
      emptyMessage: t("pages.lessons.no_upcoming_lessons"),
      editIsAvailable: currentGroup.value.is_legal === 1 ? true : false,
    },
  },
]);

const getGroups = async (url) => {
  pending.value = true;

  const formData = new FormData(searchFormRef.value);
  formData.append("per_page", perPage.value);
  formData.append("sort_key", sortKey.value); // Добавляем ключ сортировки
  formData.append("sort_direction", sortDirection.value); // Добавляем направление сортировки

  if (!url) {
    url = "groups/get";
  }

  await $axiosPlugin
    .post(url, formData)
    .then((response) => {
      groups.value = response.data;
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

const getGroup = async (group_id) => {
  pendingGroup.value = true;
  groupModalIsVisible.value = true;
  await $axiosPlugin
    .get("groups/get/" + group_id)
    .then((response) => {
      errors.value = [];
      currentGroup.value = response.data;
      groupMembers.value = response.data.group_members;
      selectedDays.value = response.data.days;
      pendingGroup.value = false;
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

const getEditGroup = async () => {
  groupModalIsVisible.value = false;
  editModalIsVisible.value = true;
};

const getGroupAttributes = async () => {
  pending.value = true;
  await $axiosPlugin
    .get("groups/get_group_attributes")
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

const createGroupSubmit = async () => {
  pendingCreate.value = true;
  const formData = new FormData(createFormRef.value);
  formData.append("members_count", groupMembers.value.length);
  formData.append("members", JSON.stringify(groupMembers.value));
  formData.append("selected_days", JSON.stringify(sortedDays.value));
  formData.append("operation_type_id", 3);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("groups/create", formData)
    .then((res) => {
      pendingCreate.value = false;
      if (res.data.step) {
        currentStep.value = res.data.step + 1;
        if (currentStep.value === 4) {
          groupData.value = res.data.data;
        }
      } else {
        closeModal("create");
        getGroups();
      }
      errors.value = [];
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingCreate.value = false;
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

const editGroupSubmit = async () => {
  pendingEdit.value = true;
  const formData = new FormData(editFormRef.value);
  formData.append("members_count", groupMembers.value.length);
  formData.append("members", JSON.stringify(groupMembers.value));
  formData.append("selected_days", JSON.stringify(sortedDays.value));
  formData.append("operation_type_id", 4);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("groups/update/" + currentGroup.value.group_id, formData)
    .then((res) => {
      pendingEdit.value = false;
      if (res.data.step) {
        currentStep.value = res.data.step + 1;
        if (currentStep.value === 4) {
          groupData.value = res.data.data;
        }
      } else {
        getGroups().then(() => {
          closeModal("edit");
        });
      }
      errors.value = [];
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

const openScheduleModal = () => {
  groupModalIsVisible.value = false;
  scheduleModalIsVisible.value = true;
};

const openPaymentsModal = () => {
  groupModalIsVisible.value = false;
  paymentsModalIsVisible.value = true;
  upcomingLessons.value = currentGroup.value.schedule.filter(
    (lesson) => lesson.is_gone === false
  );
  goneLessons.value = currentGroup.value.schedule.filter(
    (lesson) => lesson.is_gone === true
  );
  newPayments.value = [];
};

const changePaymentStatus = (userId, lessonId, checked) => {
  const index = newPayments.value.findIndex(
    (p) => p.user_id === userId && p.lesson_id === lessonId
  );

  if (index === -1) {
    newPayments.value.push({
      user_id: userId,
      lesson_id: lessonId,
      checked: checked,
    });
  } else {
    newPayments.value.splice(index, 1);
  }
};

const savePayments = async () => {
  pendingPaymentStatus.value = true;

  const formData = new FormData();
  formData.append("payments_count", newPayments.value.length);
  formData.append("payments", JSON.stringify(newPayments.value));
  formData.append("operation_type_id", 31);

  await $axiosPlugin
    .post("groups/save_payments", formData)
    .then((res) => {
      pendingPaymentStatus.value = false;
      savePaymentsModalIsVisible.value = false;
      upcomingLessons.value = [];
      goneLessons.value = [];
      getGroup(currentGroup.value.group_id);
      errors.value = [];
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingPaymentStatus.value = false;
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

const closeModal = (action) => {
  if (action === "create") {
    createModalIsVisible.value = false;
    pendingCreate.value = false;
    if (createFormRef.value) {
      createFormRef.value.reset();
    }
  } else if (action === "edit") {
    editModalIsVisible.value = false;
    pendingEdit.value = false;
    if (editFormRef.value) {
      editFormRef.value.reset();
    }
    getGroup(currentGroup.value.group_id);
  } else if (action === "schedule") {
    scheduleModalIsVisible.value = false;
    groupModalIsVisible.value = true;
  } else if (action === "payments") {
    paymentsModalIsVisible.value = false;
    if (newPayments.value.length > 0) {
      savePaymentsModalIsVisible.value = true;
    } else {
      groupModalIsVisible.value = true;
    }
    upcomingLessons.value = [];
    goneLessons.value = [];
  } else if (action === "return_to_payments") {
    savePaymentsModalIsVisible.value = false;
    paymentsModalIsVisible.value = true;
  } else if (action === "unsave_payments") {
    savePaymentsModalIsVisible.value = false;
    paymentsModalIsVisible.value = false;
    upcomingLessons.value = [];
    goneLessons.value = [];
    getGroup(currentGroup.value.group_id);
  } else {
    groupModalIsVisible.value = false;
    selectedDays.value = [];
  }

  groupData.value = [];
  groupMembers.value = [];
  currentStep.value = 1;
  errors.value = [];
};

const showHideGroupSearchFilter = () => {
  if (searchFilter.value === true) {
    searchFilter.value = false;
    resetGroupSearchFilter();
  } else {
    searchFilter.value = true;
  }
};

const resetGroupSearchFilter = () => {
  searchFormRef.value.reset();
  selectedCourseId.value = "";
  getGroups();
};

const debounceGroups = debounceHandler(() => getGroups(), 1000);
const debounceReset = debounceHandler(() => resetGroupSearchFilter(), 500);

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
  debounceGroups();
};

onMounted(() => {
  getGroupAttributes();
  getGroups();
});
</script>
