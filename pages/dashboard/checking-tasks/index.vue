<template>
  <div class="col-span-12">
    <div class="custom-grid">
      <div class="col-span-12">
        <div class="btn-wrap">
          <button @click="showHideTaskSearchFilter" class="btn btn-light">
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
            <h5>{{ $t("pages.tasks.search_filter") }}</h5>
            <form @submit.prevent="debounceReset" ref="searchFormRef">
              <div class="custom-grid">
                <div class="col-span-12">
                  <div class="form-group-border active">
                    <i class="pi pi-clock"></i>
                    <input
                      type="text"
                      name="task_name"
                      placeholder=" "
                      @input="debounceCompletedTasks"
                    />
                    <label>{{ $t("pages.tasks.task_name") }}</label>
                  </div>
                </div>
                <div class="col-span-12">
                  <div class="form-group-border active">
                    <i class="pi pi-clock"></i>
                    <input
                      type="text"
                      name="task_slug"
                      placeholder=" "
                      @input="debounceCompletedTasks"
                    />
                    <label>{{ $t("pages.tasks.task_slug") }}</label>
                  </div>
                </div>

                <div class="col-span-12">
                  <multipleSelect
                    :className="'form-group-border select active label-active'"
                    :icon="'pi pi-clock'"
                    :label="$t('pages.tasks.task_type')"
                    :items="taskAttributes.task_types"
                    :optionName="'task_types[]'"
                    :optionValue="'task_type_id'"
                    :optionLabel="'task_type_name'"
                    :onChange="debounceCompletedTasks"
                  />
                </div>

                <div class="col-span-12">
                  <div class="form-group-border select active label-active">
                    <i class="pi pi-book"></i>
                    <select
                      name="course_id"
                      v-model="selectedCourseId"
                      @change="onCourseChange"
                    >
                      <option selected disabled value="">
                        {{ $t("pages.courses.choose_a_course") }}
                      </option>
                      <option
                        v-for="(course, courseIndex) in taskAttributes.courses"
                        :key="courseIndex"
                        :value="course.course_id"
                      >
                        {{ course.course_name }}
                      </option>
                    </select>
                    <label>
                      {{ $t("pages.courses.course") }}
                    </label>
                  </div>
                </div>

                <div v-if="selectedCourseId" class="col-span-12">
                  <div class="form-group-border select active label-active">
                    <i class="pi pi-book"></i>
                    <select
                      name="level_id"
                      v-model="selectedLevelId"
                      @change="onLevelChange"
                    >
                      <option selected disabled value="">
                        {{ $t("pages.courses.choose_a_course_level") }}
                      </option>
                      <option
                        v-for="(level, levelIndex) in selectedCourse?.levels"
                        :key="levelIndex"
                        :value="level.level_id"
                      >
                        {{ level.level_name }}
                      </option>
                    </select>
                    <label>
                      {{ $t("pages.courses.course_level") }}
                    </label>
                  </div>
                </div>

                <div v-if="selectedLevelId" class="col-span-12">
                  <multipleSelect
                    :className="'form-group-border select active label-active'"
                    :icon="'pi pi-users'"
                    :label="$t('pages.groups.group')"
                    :items="selectedLevel?.groups"
                    :optionName="'groups[]'"
                    :optionValue="'group_id'"
                    :optionLabel="'group_name'"
                    :avatar="false"
                    :onChange="debounceCompletedTasks"
                  />
                </div>

                <div v-if="selectedLevelId" class="col-span-12">
                  <div class="form-group-border select active label-active">
                    <i class="pi pi-book"></i>
                    <select
                      name="section_id"
                      v-model="selectedSectionId"
                      @change="onSectionChange"
                    >
                      <option selected disabled value="">
                        {{ $t("pages.courses.choose_a_course_section") }}
                      </option>
                      <option
                        v-for="(
                          section, sectionIndex
                        ) in selectedLevel?.sections"
                        :key="sectionIndex"
                        :value="section.section_id"
                      >
                        {{ section.section_name }}
                      </option>
                    </select>
                    <label>
                      {{ $t("pages.courses.course_section") }}
                    </label>
                  </div>
                </div>

                <div v-if="selectedSectionId" class="col-span-12">
                  <div class="form-group-border select active label-active">
                    <i class="pi pi-book"></i>
                    <select
                      name="lesson_id"
                      v-model="selectedLessonId"
                      @change="onLessonChange"
                    >
                      <option selected disabled value="">
                        {{ $t("pages.lessons.choose_a_lesson") }}
                      </option>
                      <option
                        v-for="(
                          lesson, lessonIndex
                        ) in selectedSection?.lessons"
                        :key="lessonIndex"
                        :value="lesson.lesson_id"
                      >
                        {{ lesson.lesson_name }} ({{ lesson.lesson_type_name }})
                      </option>
                    </select>
                    <label>
                      {{ $t("pages.lessons.lesson") }}
                    </label>
                  </div>
                </div>

                <div class="col-span-12">
                  <div class="form-group-border active">
                    <i class="pi pi-user"></i>
                    <input
                      type="text"
                      name="learner"
                      placeholder=" "
                      @input="debounceCompletedTasks"
                    />
                    <label>{{ $t("learner") }}</label>
                  </div>
                </div>

                <roleProvider :roles="[1, 2, 3]" :redirect="false">
                  <div class="col-span-12">
                    <multipleSelect
                      :className="'form-group-border select active label-active'"
                      :icon="'pi pi-user'"
                      :label="$t('mentor')"
                      :items="taskAttributes.mentors"
                      :optionName="'mentors[]'"
                      :optionValue="'user_id'"
                      :optionLabel="'full_name'"
                      :avatar="true"
                      :onChange="debounceCompletedTasks"
                    />
                  </div>
                </roleProvider>

                <div class="col-span-12">
                  <div class="form-group-border active">
                    <i class="pi pi-calendar"></i>
                    <input
                      type="date"
                      name="created_at_from"
                      @input="debounceCompletedTasks"
                      placeholder=" "
                    />
                    <label>{{ $t("completed_at_from") }}</label>
                  </div>
                </div>

                <div class="col-span-12">
                  <div class="form-group-border active">
                    <i class="pi pi-calendar"></i>
                    <input
                      type="date"
                      name="created_at_to"
                      @input="debounceCompletedTasks"
                      placeholder=" "
                    />
                    <label>{{ $t("completed_at_to") }}</label>
                  </div>
                </div>

                <div class="col-span-12">
                  <div class="form-group-border select active label-active">
                    <i class="pi pi-check"></i>
                    <select
                      name="is_completed"
                      :onChange="debounceCompletedTasks"
                    >
                      <option selected value="'0'">
                        {{ $t("not_verified") }}
                      </option>
                      <option value="1">
                        {{ $t("verified") }}
                      </option>
                      <option value="">
                        {{ $t("all") }}
                      </option>
                    </select>
                    <label>
                      {{ $t("status") }}
                    </label>
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
        <template v-if="completedTasks.data?.length > 0">
          <div class="table table-striped table-sm selectable">
            <loader v-if="pending" :className="'overlay'" :showPendingText="true"/>
            <table ref="tableRef">
              <thead>
                <tr>
                  <sortTableHead
                    v-for="(head, index) in taskTableHeads"
                    :key="index"
                    :title="head.title"
                    :keyName="head.keyName"
                    :sortKey="sortKey"
                    :sortDirection="sortDirection"
                    :sortType="head.sortType"
                    :sortHandler="debounceCompletedTasks"
                    @update:sortKey="sortKey = $event"
                    @update:sortDirection="sortDirection = $event"
                  />
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="task in completedTasks.data"
                  :key="task.completed_task_id"
                  @click="getCompletedTask(task)"
                >
                  <td>{{ task.task_name }}</td>
                  <td>{{ task.task_slug }}</td>
                  <td>{{ task.task_type_name }}</td>
                  <td>{{ task.lesson_name }}</td>
                  <td>{{ task.section_name }}</td>
                  <td>{{ task.level_name }}</td>
                  <td>{{ task.course_name }}</td>
                  <td>
                    <span v-if="task.group_id">{{ task.group_name }}</span>
                    <span v-else class="italic text-inactive">{{
                      $t("pages.groups.not_member")
                    }}</span>
                  </td>
                  <td>
                    <div class="flex gap-x-2 items-center">
                      <userAvatar
                        :padding="0.5"
                        :className="'w-6 h-6'"
                        :user="{
                          last_name: task.learner_last_name,
                          first_name: task.learner_first_name,
                          avatar: task.learner_avatar,
                        }"
                      />
                      {{ task.learner_last_name }} {{ task.learner_first_name }}
                    </div>
                  </td>
                  <td>
                    <div class="flex gap-x-2 items-center">
                      <userAvatar
                        :padding="0.5"
                        :className="'w-6 h-6'"
                        :user="{
                          last_name: task.mentor_last_name,
                          first_name: task.mentor_first_name,
                          avatar: task.mentor_avatar,
                        }"
                      />
                      {{ task.mentor_last_name }} {{ task.mentor_first_name }}
                    </div>
                  </td>
                  <td>{{ new Date(task.created_at).toLocaleString() }}</td>
                  <td>
                    <circleProgressBar
                      v-if="
                        task.task_result &&
                        task.task_result.completed === true
                      "
                      :progress="task.task_result.percentage"
                    />
                    <b v-else class="text-warning">{{ $t("not_verified") }}</b>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="btn-wrap mt-4">
            <pagination
              :items="completedTasks"
              :setItems="getCompletedTasks"
              :onSelect="(count) => (perPage = count)"
            />
          </div>
        </template>

        <alert v-else :className="'light'">
          <loader v-if="pending" :className="'overlay'" :showPendingText="true"/>
          <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
        </alert>
      </div>
    </div>
  </div>

  <modal
    :show="taskModalIsVisible"
    :onClose="() => (taskModalIsVisible = false)"
    :className="'modal-2xl'"
    :showLoader="pendingTask"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ currentTask?.task_name }}</h4>
    </template>
    <template v-if="currentTask" v-slot:body_content>
      <div class="col-span-12">
        <taskResultChart
          :taskResult="currentTask.task_result"
          :checkingTask="true"
        >
          <template v-slot:header_content>
            <div class="col-span-12">
              <div class="flex gap-4 flex-wrap mb-3">
                <div class="flex gap-x-2 items-center">
                  <userAvatar
                    :padding="0.5"
                    :className="'w-8 h-8'"
                    :user="{
                      last_name: currentTask.learner_last_name,
                      first_name: currentTask.learner_first_name,
                      avatar: currentTask.learner_avatar,
                    }"
                  />
                  <div>
                    <p class="text-inactive text-xs mb-0">
                      {{ $t("learner") }}:
                    </p>
                    <p class="font-medium mb-0">
                      {{ currentTask.learner_last_name }}
                      {{ currentTask.learner_first_name }}
                    </p>
                  </div>
                </div>

                <div class="flex gap-x-2 items-center">
                  <userAvatar
                    :padding="0.5"
                    :className="'w-8 h-8'"
                    :user="{
                      last_name: currentTask.mentor_last_name,
                      first_name: currentTask.mentor_first_name,
                      avatar: currentTask.mentor_avatar,
                    }"
                  />
                  <div>
                    <p class="text-inactive text-xs mb-0">
                      {{ $t("mentor") }}:
                    </p>
                    <p class="font-medium mb-0">
                      {{ currentTask.mentor_last_name }}
                      {{ currentTask.mentor_first_name }}
                    </p>
                  </div>
                </div>
              </div>

              <hr />
            </div>
          </template>
          <template
            v-slot:footer_content
            v-if="
              authUser.user_id === currentTask.mentor_id &&
              currentTask.is_completed == 0
            "
          >
            <div class="col-span-12">
              <div class="btn-wrap justify-end">
                <button
                  class="btn btn-outline-primary"
                  @click="saveTaskResult()"
                >
                  <i class="pi pi-check"></i>
                  {{ $t("save") }}
                </button>
              </div>
            </div>
          </template>
        </taskResultChart>
      </div>
    </template>
  </modal>
</template>
<script setup>
import { useRouter } from "nuxt/app";
import { useToast } from "vue-toastification";
import modal from "../../../components/ui/modal.vue";
import loader from "../../../components/ui/loader.vue";
import alert from "../../../components/ui/alert.vue";
import userAvatar from "../../../components/ui/userAvatar.vue";
import stickyBox from "../../../components/ui/stickyBox.vue";
import pagination from "../../../components/ui/pagination.vue";
import circleProgressBar from "../../../components/ui/circleProgressBar.vue";
import taskResultChart from "../../../components/lesson/components/tasks/taskResultChart.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import roleProvider from "../../../components/ui/roleProvider.vue";
import multipleSelect from "../../../components/ui/multipleSelect.vue";
import sortTableHead from "../../../components/ui/sortTableHead.vue";

const authUser = useSanctumUser();
const router = useRouter();
const toast = useToast();
const { $axiosPlugin } = useNuxtApp();
const { t } = useI18n();
const pending = ref(true);
const pendingTask = ref(false);
const tableRef = ref(null);
const searchFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(10);
const completedTasks = ref([]);
const currentTask = ref(null);
const taskAttributes = ref([]);

const taskModalIsVisible = ref(false);

useHead({
  title: t("pages.checking-tasks.title"),
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const sortKey = ref("completed_tasks.created_at"); // Ключ сортировки
const sortDirection = ref("asc"); // Направление сортировки: asc или desc

// Реактивные свойства для отслеживания выбранных значений
const selectedCourseId = ref("");
const selectedLevelId = ref("");
const selectedGroupId = ref("");
const selectedSectionId = ref("");
const selectedLessonId = ref("");

const taskTableHeads = [
  {
    title: t("pages.tasks.task_name"),
    keyName: "tasks_lang.task_name",
    sortType: "alpha",
  },
  {
    title: t("pages.tasks.task_slug"),
    keyName: "tasks.task_slug",
    sortType: "alpha",
  },
  {
    title: t("pages.tasks.task_type"),
    keyName: "types_of_tasks_lang.task_type_name",
    sortType: "alpha",
  },
  {
    title: t("pages.lessons.lesson"),
    keyName: "lessons_lang.lesson_name",
    sortType: "alpha",
  },
  {
    title: t("pages.courses.course_section"),
    keyName: "course_sections.section_name",
    sortType: "alpha",
  },
  {
    title: t("pages.courses.course_level"),
    keyName: "course_levels_lang.level_name",
    sortType: "alpha",
  },
  {
    title: t("pages.courses.course"),
    keyName: "courses_lang.course_name",
    sortType: "alpha",
  },
  {
    title: t("pages.groups.group"),
    keyName: "groups.group_name",
    sortType: "alpha",
  },
  {
    title: t("learner"),
    keyName: "learner_last_name",
    sortType: "alpha",
  },
  {
    title: t("mentor"),
    keyName: "mentor_last_name",
    sortType: "alpha",
  },
  {
    title: t("completed_at"),
    keyName: "completed_tasks.created_at",
    sortType: "numeric",
  },
  {
    title: t("result"),
    keyName: "completed_tasks.is_completed",
    sortType: "alpha",
  },
];

const getCompletedTasks = async (url) => {
  pending.value = true;

  const formData = new FormData(searchFormRef.value);
  formData.append("per_page", perPage.value);
  formData.append("sort_key", sortKey.value); // Добавляем ключ сортировки
  formData.append("sort_direction", sortDirection.value); // Добавляем направление сортировки

  if (!url) {
    url = "tasks/get_task_results";
  }

  await $axiosPlugin
    .post(url, formData)
    .then((response) => {
      completedTasks.value = response.data;
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

const getCompletedTask = (task) => {
  taskModalIsVisible.value = true;
  currentTask.value = task;
};

const getTaskAttributes = async () => {
  await $axiosPlugin
    .get("tasks/get_task_attributes")
    .then((response) => {
      taskAttributes.value = response.data;
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

const saveTaskResult = async () => {
  pendingTask.value = true;

  const formData = new FormData();
  formData.append(
    "answers",
    JSON.stringify(currentTask.value.task_result.answers.unverified_answers)
  );
  formData.append("operation_type_id", 26);

  await $axiosPlugin
    .post(
      "tasks/change_result/" + currentTask.value.completed_task_id,
      formData
    )
    .then((res) => {
      pendingTask.value = false;
      taskModalIsVisible.value = false;
      currentTask.value = null;
      getTaskAttributes();
      getCompletedTasks();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          toast(err.response.data, {
            toastClassName: ["custom-toast", "danger"],
            timeout: 5000,
          });
          pendingTask.value = false;
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

const showHideTaskSearchFilter = () => {
  if (searchFilter.value === true) {
    searchFilter.value = false;
  } else {
    searchFilter.value = true;
  }
};

const resetTaskSearchFilter = () => {
  searchFormRef.value.reset();
  selectedCourseId.value = "";
  selectedLevelId.value = "";
  selectedGroupId.value = "";
  selectedSectionId.value = "";
  selectedLessonId.value = "";
  getCompletedTasks();
};

// Вычисляемые свойства для получения выбранных данных
const selectedCourse = computed(() =>
  taskAttributes.value.courses.find(
    (course) => course.course_id === Number(selectedCourseId.value)
  )
);

const selectedLevel = computed(() =>
  selectedCourse.value?.levels.find(
    (level) => level.level_id === Number(selectedLevelId.value)
  )
);

const selectedGroup = computed(() =>
  selectedLevel.value?.groups.find(
    (group) => group.group_id === Number(selectedGroupId.value)
  )
);

const selectedSection = computed(() =>
  selectedLevel.value?.sections.find(
    (section) => section.section_id === Number(selectedSectionId.value)
  )
);

// Сброс значений при изменении выбора
const onCourseChange = () => {
  if (
    selectedLevelId.value ||
    selectedGroupId.value ||
    selectedSectionId.value ||
    selectedLessonId.value
  ) {
    selectedLevelId.value = "";
    selectedGroupId.value = "";
    selectedSectionId.value = "";
    selectedLessonId.value = "";
  }
  debounceCompletedTasks();
};

const onLevelChange = () => {
  if (
    selectedGroupId.value ||
    selectedSectionId.value ||
    selectedLessonId.value
  ) {
    selectedGroupId.value = "";
    selectedSectionId.value = "";
    selectedLessonId.value = "";
  }
  debounceCompletedTasks();
};

const onGroupChange = () => {
  debounceCompletedTasks();
};

const onSectionChange = () => {
  if (selectedLessonId.value) {
    selectedLessonId.value = "";
  }
  debounceCompletedTasks();
};

const onLessonChange = () => {
  debounceCompletedTasks();
};

const debounceCompletedTasks = debounceHandler(() => getCompletedTasks(), 1000);
const debounceReset = debounceHandler(() => resetTaskSearchFilter(), 500);

onMounted(() => {
  getTaskAttributes();
  getCompletedTasks();
});
</script>
