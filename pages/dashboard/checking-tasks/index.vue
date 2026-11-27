<template>
  <div class="col-span-12">
    <div class="custom-grid">
      <!-- Панель: фильтр, вкладки статуса, сколько найдено -->
      <div class="col-span-12">
        <div class="list-toolbar">
          <button
            type="button"
            @click="showHideTaskSearchFilter"
            class="btn"
            :class="searchFilter ? 'btn-outline-primary' : 'btn-light'"
            :aria-pressed="searchFilter"
            :title="searchFilter ? $t('hide_search_filter') : $t('show_search_filter')"
          >
            <i class="pi pi-filter" aria-hidden="true"></i>
            {{ $t("filter") }}
          </button>

          <div class="type-chips" role="group" :aria-label="$t('status')">
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              type="button"
              class="type-chip"
              :class="{ active: status === tab.value }"
              :aria-pressed="status === tab.value"
              @click="setStatus(tab.value)"
            >
              <i v-if="tab.icon" :class="tab.icon" aria-hidden="true"></i>
              {{ tab.label }}
              <span
                v-if="tab.value === 'pending' && pendingCount > 0"
                class="chip-count"
                >{{ pendingCount }}</span
              >
            </button>
          </div>

          <span v-if="completedTasks.total" class="text-sm text-inactive ml-auto">
            {{ $t("found") }}: <b class="text-active">{{ completedTasks.total }}</b>
          </span>
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
                    <i class="pi pi-pencil"></i>
                    <input
                      type="text"
                      name="task_name"
                      autocomplete="off"
                      placeholder=" "
                      @input="debounceCompletedTasks"
                    />
                    <label>{{ $t("pages.tasks.task_name") }}</label>
                  </div>
                </div>
                <div class="col-span-12">
                  <div class="form-group-border active">
                    <i class="pi pi-hashtag"></i>
                    <input
                      type="text"
                      name="task_slug"
                      autocomplete="off"
                      placeholder=" "
                      @input="debounceCompletedTasks"
                    />
                    <label>{{ $t("pages.tasks.task_slug") }}</label>
                  </div>
                </div>

                <div class="col-span-12">
                  <multipleSelect
                    :className="'form-group-border select active label-active'"
                    :icon="'pi pi-th-large'"
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
                        v-for="course in taskAttributes.courses"
                        :key="course.course_id"
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
                    <i class="pi pi-chart-bar"></i>
                    <select
                      name="level_id"
                      v-model="selectedLevelId"
                      @change="onLevelChange"
                    >
                      <option selected disabled value="">
                        {{ $t("pages.courses.choose_a_course_level") }}
                      </option>
                      <option
                        v-for="level in selectedCourse?.levels"
                        :key="level.level_id"
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
                    <i class="pi pi-folder"></i>
                    <select
                      name="section_id"
                      v-model="selectedSectionId"
                      @change="onSectionChange"
                    >
                      <option selected disabled value="">
                        {{ $t("pages.courses.choose_a_course_section") }}
                      </option>
                      <option
                        v-for="section in selectedLevel?.sections"
                        :key="section.section_id"
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
                    <i class="pi pi-file"></i>
                    <select
                      name="lesson_id"
                      v-model="selectedLessonId"
                      @change="debounceCompletedTasks"
                    >
                      <option selected disabled value="">
                        {{ $t("pages.lessons.choose_a_lesson") }}
                      </option>
                      <option
                        v-for="lesson in selectedSection?.lessons"
                        :key="lesson.lesson_id"
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
                      autocomplete="off"
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
        ref="listTopRef"
        class="col-span-12 relative scroll-mt-24"
        :class="searchFilter && 'lg:col-span-9'"
      >
        <!-- Скелетон: первая загрузка или переход на другую страницу -->
        <listSkeleton
          v-if="pending && (paging || !completedTasks.data?.length)"
          :columns="taskTableHeads.length"
          :rows="paging ? skeletonRows : 8"
          :statusColumn="true"
        />

        <!-- Фильтр / сортировка: список на месте, по нему перелив -->
        <div
          v-else-if="completedTasks.data?.length > 0"
          :class="{ 'list-refreshing': pending }"
          :aria-busy="pending || undefined"
        >
          <span v-if="pending" class="sr-only">{{ $t("loading") }}</span>

          <!-- Компьютер: таблица -->
          <div class="table table-striped table-sm selectable max-md:!hidden">
            <table>
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
                  :key="task.completed_task_id + '-' + (task.group_id || 0)"
                  @click="openTask(task)"
                >
                  <td>
                    <span class="flex flex-col min-w-0">
                      <span class="font-medium">{{ task.task_name }}</span>
                      <span class="text-xs text-inactive">
                        {{ task.task_slug }} · {{ task.task_type_name }}
                      </span>
                    </span>
                  </td>
                  <td>
                    <span class="flex flex-col min-w-0">
                      <span>{{ task.lesson_name }}</span>
                      <span class="text-xs text-inactive">{{ lessonPath(task) }}</span>
                    </span>
                  </td>
                  <td>
                    <span v-if="task.group_id">{{ task.group_name }}</span>
                    <span v-else class="italic text-inactive">{{
                      $t("pages.groups.not_member")
                    }}</span>
                  </td>
                  <td>
                    <div class="flex gap-x-2 items-center whitespace-nowrap">
                      <userAvatar
                        :padding="0.5"
                        :className="'w-6 h-6 text-[9px]'"
                        :user="learnerOf(task)"
                      />
                      {{ task.learner_last_name }} {{ task.learner_first_name }}
                    </div>
                  </td>
                  <td>
                    <div class="flex gap-x-2 items-center whitespace-nowrap">
                      <userAvatar
                        :padding="0.5"
                        :className="'w-6 h-6 text-[9px]'"
                        :user="mentorOf(task)"
                      />
                      {{ task.mentor_last_name }} {{ task.mentor_first_name }}
                    </div>
                  </td>
                  <td class="whitespace-nowrap">{{ formatDateTime(task.created_at) }}</td>
                  <td>
                    <circleProgressBar
                      v-if="isChecked(task)"
                      :progress="task.task_result.percentage"
                    />
                    <span v-else class="status-pill text-warning">
                      {{ $t("not_verified") }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Телефон: карточки -->
          <ul class="entity-list md:hidden">
            <li
              v-for="task in completedTasks.data"
              :key="task.completed_task_id + '-' + (task.group_id || 0)"
            >
              <button type="button" class="entity-card" @click="openTask(task)">
                <userAvatar
                  :padding="0.5"
                  :className="'w-10 h-10 text-sm'"
                  :user="learnerOf(task)"
                />
                <span class="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                  <span class="font-semibold truncate"
                    >{{ task.learner_last_name }} {{ task.learner_first_name }}</span
                  >
                  <span class="text-sm truncate">{{ task.task_name }}</span>
                  <span class="text-xs text-inactive truncate">
                    {{ task.lesson_name }} · {{ formatDateTime(task.created_at) }}
                  </span>
                  <span
                    v-if="!isChecked(task)"
                    class="status-pill wrap mt-1 text-warning"
                    >{{ $t("not_verified") }}</span
                  >
                </span>
                <circleProgressBar
                  v-if="isChecked(task)"
                  :progress="task.task_result.percentage"
                />
                <i
                  v-else
                  class="pi pi-chevron-right text-inactive text-xs"
                  aria-hidden="true"
                ></i>
              </button>
            </li>
          </ul>
        </div>

        <emptyState
          v-else-if="!filtered && status === 'pending'"
          :text="$t('pages.checking-tasks.all_checked')"
          :hint="$t('pages.checking-tasks.all_checked_hint')"
          icon="bi bi-check2-circle"
        />
        <emptyState
          v-else
          :text="$t('nothing_was_found_for_your_query')"
          icon="bi bi-search"
        />

        <!-- Вне блока списка: при переходе по страницам остаётся на месте -->
        <div
          v-if="completedTasks.data?.length"
          class="btn-wrap mt-4"
          :class="{ 'pointer-events-none opacity-60': pending }"
        >
          <pagination
            :items="completedTasks"
            :setItems="getCompletedTasks"
            :onSelect="(count) => (perPage = count)"
          />
        </div>
      </div>
    </div>
  </div>

  <modal
    :show="taskModalIsVisible"
    :onClose="() => closeTaskModal()"
    :className="'modal-2xl'"
    :showLoader="pendingTask"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4 class="mb-0">{{ currentTask?.task_name }}</h4>
    </template>
    <template v-if="currentTask" v-slot:body_content>
      <taskResultChart
        :key="currentTask.completed_task_id"
        :taskResult="currentTask.task_result"
        :checkingTask="canCheck(currentTask) && !isChecked(currentTask)"
      >
        <template v-slot:header_content>
          <div class="col-span-12 checking-head">
            <div class="flex gap-4 flex-wrap">
              <div class="flex gap-x-2 items-center">
                <userAvatar
                  :padding="0.5"
                  :className="'w-9 h-9 text-xs'"
                  :user="learnerOf(currentTask)"
                />
                <div>
                  <p class="text-inactive text-xs mb-0">{{ $t("learner") }}</p>
                  <p class="font-medium mb-0">
                    {{ currentTask.learner_last_name }}
                    {{ currentTask.learner_first_name }}
                  </p>
                </div>
              </div>

              <div class="flex gap-x-2 items-center">
                <userAvatar
                  :padding="0.5"
                  :className="'w-9 h-9 text-xs'"
                  :user="mentorOf(currentTask)"
                />
                <div>
                  <p class="text-inactive text-xs mb-0">{{ $t("mentor") }}</p>
                  <p class="font-medium mb-0">
                    {{ currentTask.mentor_last_name }}
                    {{ currentTask.mentor_first_name }}
                  </p>
                </div>
              </div>
            </div>

            <p class="mb-0 text-sm text-inactive">
              <i class="pi pi-book text-xs" aria-hidden="true"></i>
              {{ currentTask.lesson_name }}
              <span v-if="lessonPath(currentTask)"> · {{ lessonPath(currentTask) }}</span>
            </p>
            <p class="mb-0 text-sm text-inactive">
              <i class="pi pi-clock text-xs" aria-hidden="true"></i>
              {{ $t("completed_at") }}: {{ formatDateTime(currentTask.created_at) }}
              <span v-if="currentTask.task_slug"> · {{ currentTask.task_slug }}</span>
            </p>
          </div>
        </template>

        <template v-slot:footer_content>
          <div v-if="!isChecked(currentTask)" class="col-span-12 checking-footer">
            <template v-if="canCheck(currentTask)">
              <span v-if="nextTask" class="text-sm text-inactive mr-auto">
                {{ $t("pages.checking-tasks.left_to_check", { count: pendingCount }) }}
              </span>
              <button
                type="button"
                class="btn"
                :class="nextTask ? 'btn-light' : 'btn-primary'"
                :disabled="pendingSave"
                @click="saveTaskResult(false)"
              >
                <i class="pi pi-check" aria-hidden="true"></i>
                {{ $t("save") }}
              </button>
              <button
                v-if="nextTask"
                type="button"
                class="btn btn-primary"
                :class="{ loading: pendingSave }"
                :disabled="pendingSave"
                @click="saveTaskResult(true)"
              >
                {{ $t("pages.checking-tasks.save_and_next") }}
                <i class="pi pi-arrow-right" aria-hidden="true"></i>
              </button>
            </template>
            <p v-else class="mb-0 text-sm text-inactive">
              <i class="pi pi-lock text-xs" aria-hidden="true"></i>
              {{
                $t("pages.checking-tasks.only_mentor_can_check", {
                  name: `${currentTask.mentor_last_name} ${currentTask.mentor_first_name}`,
                })
              }}
            </p>
          </div>
        </template>
      </taskResultChart>
    </template>
  </modal>
</template>

<script setup>
import { useNotify } from "~/composables/useNotify";
import { useRouter, useRoute } from "nuxt/app";
import modal from "../../../components/ui/modal.vue";
import emptyState from "~/components/ui/emptyState.vue";
import listSkeleton from "../../../components/ui/listSkeleton.vue";
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
const route = useRoute();
const notify = useNotify();
const { $axiosPlugin } = useNuxtApp();
const { t, locale } = useI18n();
const pending = ref(true);
const pendingTask = ref(false);
const pendingSave = ref(false);
const searchFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(10);
const completedTasks = ref([]);
const currentTask = ref(null);
const taskAttributes = ref([]);
const pendingCount = ref(0);

const taskModalIsVisible = ref(false);

useHead({
  title: t("pages.checking-tasks.title"),
  meta: [{ name: "description", content: t("pages.home.description") }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

// Старые работы первыми — очередь проверяется по порядку
const sortKey = ref("completed_tasks.created_at");
const sortDirection = ref("asc");

// Вкладка статуса: pending — ждут проверки, checked — проверенные, all — все
const status = ref("pending");
const STATUS_VALUE = { pending: "0", checked: "1", all: "" };

const statusTabs = computed(() => [
  { value: "pending", label: t("pages.checking-tasks.tabs.pending"), icon: "pi pi-hourglass" },
  { value: "checked", label: t("pages.checking-tasks.tabs.checked"), icon: "pi pi-check-circle" },
  { value: "all", label: t("all") },
]);

// Есть ли условия поиска — чтобы отличить «всё проверено» от «ничего не найдено»
const filtered = ref(false);

const selectedCourseId = ref("");
const selectedLevelId = ref("");
const selectedSectionId = ref("");
const selectedLessonId = ref("");

const taskTableHeads = [
  { title: t("pages.checking-tasks.task"), keyName: "tasks_lang.task_name", sortType: "alpha" },
  { title: t("pages.lessons.lesson"), keyName: "lessons.lesson_name", sortType: "alpha" },
  { title: t("pages.groups.group"), keyName: "groups.group_name", sortType: "alpha" },
  { title: t("learner"), keyName: "learner_last_name", sortType: "alpha" },
  { title: t("mentor"), keyName: "mentor_last_name", sortType: "alpha" },
  { title: t("completed_at"), keyName: "completed_tasks.created_at", sortType: "numeric" },
  { title: t("result"), keyName: "completed_tasks.is_completed", sortType: "alpha" },
];

const intlLocale = computed(() => String(locale.value || "ru").split("-")[0]);

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(intlLocale.value, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const lessonPath = (task) =>
  [task.course_name, task.level_name, task.section_name].filter(Boolean).join(" · ");

const learnerOf = (task) => ({
  last_name: task.learner_last_name,
  first_name: task.learner_first_name,
  avatar: task.learner_avatar,
});

const mentorOf = (task) => ({
  last_name: task.mentor_last_name,
  first_name: task.mentor_first_name,
  avatar: task.mentor_avatar,
});

const isChecked = (task) =>
  Number(task?.is_completed) === 1 || task?.task_result?.completed === true;

// Оценить может учитель работы, а также владелец и администратор школы
const canCheck = (task) =>
  Boolean(task) &&
  (Number(task.mentor_id) === Number(authUser.value?.user_id) ||
    [1, 2, 3].includes(Number(authUser.value?.current_role_id)));

// Следующая непроверенная работа из текущего списка, которую можно проверить
const nextTask = computed(() => {
  const current = currentTask.value;
  if (!current) return null;
  return (
    (completedTasks.value.data || []).find(
      (task) =>
        task.completed_task_id !== current.completed_task_id &&
        !isChecked(task) &&
        canCheck(task),
    ) || null
  );
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

// Переход по страницам: пагинация передаёт url страницы — тогда скелетон
const paging = ref(false);
const skeletonRows = ref(8);
const listTopRef = ref(null);

// Ответ на устаревший запрос не должен перетирать свежий
let requestSeq = 0;

const getCompletedTasks = async (url) => {
  pending.value = true;
  paging.value = Boolean(url);
  const seq = ++requestSeq;

  if (paging.value) {
    skeletonRows.value = completedTasks.value.data?.length || 8;
    const top = listTopRef.value?.getBoundingClientRect().top;
    if (top !== undefined && top < 0) {
      listTopRef.value.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const formData = new FormData(searchFormRef.value || undefined);
  filtered.value = [...formData.values()].some(
    (v) => typeof v === "string" && v.trim() !== "",
  );

  formData.append("is_completed", STATUS_VALUE[status.value]);
  formData.append("per_page", perPage.value);
  formData.append("sort_key", sortKey.value);
  formData.append("sort_direction", sortDirection.value);

  await $axiosPlugin
    .post(url || "tasks/get_task_results", formData)
    .then((response) => {
      if (seq !== requestSeq) return;
      completedTasks.value = response.data;
      pendingCount.value = Number(response.data.pending_count) || 0;
      pending.value = false;
      paging.value = false;
    })
    .catch((err) => {
      if (seq === requestSeq) goToError(err);
    });
};

const setStatus = (value) => {
  if (status.value === value) return;
  status.value = value;
  getCompletedTasks();
};

const openTask = (task) => {
  currentTask.value = task;
  taskModalIsVisible.value = true;
};

const closeTaskModal = () => {
  if (pendingSave.value) return;
  taskModalIsVisible.value = false;
};

// Переход из уведомления: ?task=<id> — открываем эту работу
const openTaskFromQuery = async () => {
  const id = Number(route.query.task);
  if (!id) return;

  taskModalIsVisible.value = true;
  pendingTask.value = true;
  currentTask.value = null;

  await $axiosPlugin
    .post("tasks/get_task_results", { completed_task_id: id, is_completed: "" })
    .then((response) => {
      const task = response.data.data?.[0];
      if (task) {
        currentTask.value = task;
      } else {
        taskModalIsVisible.value = false;
        notify("warning", t("pages.checking-tasks.not_found"));
      }
    })
    .catch(() => {
      taskModalIsVisible.value = false;
      notify("danger", t("pages.checking-tasks.not_found"));
    })
    .finally(() => {
      pendingTask.value = false;
    });

  // Убираем параметр, чтобы обновление страницы не открывало окно снова
  const { task, ...query } = route.query;
  router.replace({ query });
};

const getTaskAttributes = async () => {
  await $axiosPlugin
    .get("tasks/get_task_attributes")
    .then((response) => {
      taskAttributes.value = response.data;
    })
    .catch(goToError);
};

// Сохранение оценки. goNext — сразу открыть следующую непроверенную работу
const saveTaskResult = async (goNext) => {
  const task = currentTask.value;
  if (!task || pendingSave.value) return;
  pendingSave.value = true;
  pendingTask.value = true;

  const formData = new FormData();
  formData.append(
    "answers",
    JSON.stringify(task.task_result?.answers?.unverified_answers || []),
  );
  formData.append("operation_type_id", 26);

  let saved = false;

  await $axiosPlugin
    .post("tasks/change_result/" + task.completed_task_id, formData)
    .then(() => {
      saved = true;
      notify("success", t("pages.checking-tasks.saved"));
    })
    .catch((err) => {
      const code = err.response?.status;
      if (code === 422) {
        notify("danger", err.response.data);
      } else if (code === 409) {
        saved = true;
        notify("warning", t("pages.checking-tasks.already_checked"));
      } else if (code === 403) {
        notify("danger", t("errors.no_permission"));
      } else {
        goToError(err);
      }
    });

  if (!saved) {
    pendingSave.value = false;
    pendingTask.value = false;
    return;
  }

  // Следующую запоминаем до обновления списка — проверенная из него уйдёт
  const nextId = goNext ? nextTask.value?.completed_task_id : null;

  await getCompletedTasks();
  pendingSave.value = false;
  pendingTask.value = false;

  const next = nextId
    ? completedTasks.value.data?.find((item) => item.completed_task_id === nextId)
    : null;

  if (next) {
    currentTask.value = next;
  } else {
    taskModalIsVisible.value = false;
    if (goNext && status.value === "pending" && !completedTasks.value.data?.length) {
      notify("success", t("pages.checking-tasks.all_checked"));
    }
  }
};

const showHideTaskSearchFilter = () => {
  if (searchFilter.value === true) {
    searchFilter.value = false;
    // Скрытый фильтр не должен продолжать действовать
    if (filtered.value) resetTaskSearchFilter();
  } else {
    searchFilter.value = true;
  }
};

const resetTaskSearchFilter = () => {
  searchFormRef.value?.reset();
  selectedCourseId.value = "";
  selectedLevelId.value = "";
  selectedSectionId.value = "";
  selectedLessonId.value = "";
  getCompletedTasks();
};

const selectedCourse = computed(() =>
  taskAttributes.value.courses?.find(
    (course) => course.course_id === Number(selectedCourseId.value),
  ),
);

const selectedLevel = computed(() =>
  selectedCourse.value?.levels.find(
    (level) => level.level_id === Number(selectedLevelId.value),
  ),
);

const selectedSection = computed(() =>
  selectedLevel.value?.sections.find(
    (section) => section.section_id === Number(selectedSectionId.value),
  ),
);

// Смена курса / уровня / раздела сбрасывает выбор ниже по цепочке
const onCourseChange = () => {
  selectedLevelId.value = "";
  selectedSectionId.value = "";
  selectedLessonId.value = "";
  debounceCompletedTasks();
};

const onLevelChange = () => {
  selectedSectionId.value = "";
  selectedLessonId.value = "";
  debounceCompletedTasks();
};

const onSectionChange = () => {
  selectedLessonId.value = "";
  debounceCompletedTasks();
};

const debounceCompletedTasks = debounceHandler(() => getCompletedTasks(), 1000);
const debounceReset = debounceHandler(() => resetTaskSearchFilter(), 500);

// Уведомление открыто, когда страница уже на экране
watch(
  () => route.query.task,
  (value) => {
    if (value) openTaskFromQuery();
  },
);

onMounted(() => {
  getTaskAttributes();
  getCompletedTasks();
  openTaskFromQuery();
});
</script>
