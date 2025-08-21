<template>
  <clinet-only>
    <div class="custom-grid">
      <div class="col-span-12">
        <div class="btn-wrap">
          <client-only>
            <roleProvider :roles="[1, 2, 3]">
              <button
                @click="createModalIsVisible = true"
                class="btn btn-outline-primary"
              >
                <i class="pi pi-plus"></i>
                {{ $t("pages.groups.create_group") }}
              </button>
            </roleProvider>
          </client-only>
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
                    <button
                      type="submit"
                      class="btn btn-sm btn-outline-primary"
                    >
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
            <loader v-if="pending" :className="'overlay'" />
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
          <loader v-if="pending" :className="'overlay'" />
          <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
        </alert>
      </div>
    </div>
    <modal
      :show="groupModalIsVisible"
      :onClose="() => closeModal()"
      :className="'modal-2xl'"
      :showLoader="pendingGroup"
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
            <userTag
              v-if="currentGroup.operator"
              :user="currentGroup.operator"
            />
          </div>

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

          <roleProvider :roles="[1, 2, 3]">
            <div class="btn-wrap">
              <button @click="getEditGroup" class="btn btn-outline-primary">
                <i class="pi pi-pencil"></i>
                {{ $t("edit") }}
              </button>
            </div>
          </roleProvider>
        </div>
      </template>
    </modal>

    <modal
      :show="createModalIsVisible"
      :onClose="() => closeModal('create')"
      :className="currentStep != 2 ? 'modal-2xl' : ''"
      :showLoader="pendingCreate"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4>{{ $t("pages.groups.create_group_title") }}</h4>
      </template>
      <template v-slot:body_content>
        <subscription v-if="school?.subscription_expired" />
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
      :className="currentStep != 2 ? 'modal-2xl' : ''"
      :showLoader="pendingEdit"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4>{{ $t("pages.groups.edit_group_title") }}</h4>
      </template>
      <template v-slot:body_content>
        <steps :currentStep="currentStep" :steps="editGroupSteps">
          <form
            @submit.prevent="editGroupSubmit"
            class="mt-2"
            ref="editFormRef"
          >
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
  </clinet-only>
</template>
<script setup>
import { useRouter } from "nuxt/app";
import modal from "../../ui/modal.vue";
import subscription from "../../ui/subscription.vue";
import loader from "../../ui/loader.vue";
import alert from "../../ui/alert.vue";
import userAvatar from "../../ui/userAvatar.vue";
import userTag from "../../ui/userTag.vue";
import stickyBox from "../../ui/stickyBox.vue";
import pagination from "../../ui/pagination.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import steps from "../../ui/steps.vue";
import createFirstStep from "./components/createFirstStep.vue";
import editFirstStep from "./components/editFirstStep.vue";
import secondStep from "./components/secondStep.vue";
import thirdStep from "./components/thirdStep.vue";
import roleProvider from "../../ui/roleProvider.vue";
import multipleSelect from "../../ui/multipleSelect.vue";
import sortTableHead from "../../ui/sortTableHead.vue";

const router = useRouter();
const { $axiosPlugin, $schoolPlugin } = useNuxtApp();
const { t } = useI18n();
const pending = ref(true);
const pendingGroup = ref(false);
const pendingCreate = ref(false);
const pendingEdit = ref(false);
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
const school = $schoolPlugin;
const attributes = ref([]);
const errors = ref([]);

const currentStep = ref(1);

const createModalIsVisible = ref(false);
const groupModalIsVisible = ref(false);
const editModalIsVisible = ref(false);

const sortKey = ref("groups.created_at"); // Ключ сортировки
const sortDirection = ref("asc"); // Направление сортировки: asc или desc

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
    title: t("pages.groups.add_members_to_group"),
    component: secondStep,
    props: { errors, groupMembers, modalIsVisible: createModalIsVisible },
  },
  {
    title: t("pages.groups.saving_a_group"),
    component: thirdStep,
    props: { groupData },
  },
];

const editGroupSteps = [
  {
    title: t("pages.groups.group_description"),
    component: editFirstStep,
    props: { errors, attributes, currentGroup },
  },
  {
    title: t("pages.groups.edit_group_members"),
    component: secondStep,
    props: { errors, groupMembers, modalIsVisible: editModalIsVisible },
  },
  {
    title: t("pages.groups.saving_a_group"),
    component: thirdStep,
    props: { groupData },
  },
];

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
  formData.append("operation_type_id", 3);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("groups/create", formData)
    .then((res) => {
      pendingCreate.value = false;
      if (res.data.step) {
        currentStep.value = res.data.step + 1;
        if (currentStep.value === 3) {
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
  formData.append("operation_type_id", 4);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("groups/update/" + currentGroup.value.group_id, formData)
    .then((res) => {
      pendingEdit.value = false;
      if (res.data.step) {
        currentStep.value = res.data.step + 1;
        if (currentStep.value === 3) {
          groupData.value = res.data.data;
        }
      } else {
        closeModal("edit");
        getGroups();
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

const closeModal = (action) => {
  if (action === "create") {
    createModalIsVisible.value = false;
    pendingCreate.value = false;
    createFormRef.value.reset();
  } else if (action === "edit") {
    editModalIsVisible.value = false;
    pendingEdit.value = false;
    editFormRef.value.reset();
  } else {
    groupModalIsVisible.value = false;
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
