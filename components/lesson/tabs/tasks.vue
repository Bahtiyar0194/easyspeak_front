<template>
  <div class="custom-grid">
    <roleProvider :roles="[1]">
      <div class="col-span-12">
        <div class="btn-wrap">
          <client-only>
            <dropdownMenu :dropdownArrow="false" :position="'left'">
              <template v-slot:btn_content>
                <button type="button" class="btn btn-outline-primary">
                  <i class="pi pi-plus" aria-hidden="true"></i>
                  {{ $t("pages.tasks.add_a_task") }}
                </button>
              </template>

              <template v-slot:menu_content>
                <li
                  v-for="(task_type, index) in taskAttributes.all_task_types"
                  :key="index"
                >
                  <button
                    type="button"
                    @click="
                      openTaskModal(task_type.task_type_component, 'create', {
                        lesson_id: props.lesson_id,
                      })
                    "
                  >
                    <i :class="task_type.icon"></i>
                    {{ task_type.task_type_name }}
                  </button>
                </li>
              </template>
            </dropdownMenu>
          </client-only>
        </div>
      </div>
    </roleProvider>

    <!-- Первая загрузка: скелетон той же формы, что и вкладка (сводка + строки) -->
    <template v-if="firstRequest">
      <div class="col-span-12 lg:col-span-3" aria-hidden="true">
        <div class="tasks-summary">
          <div class="flex items-center gap-4">
            <div class="skeleton w-20 h-20 shrink-0 !rounded-full"></div>
            <div class="flex flex-col gap-2 flex-1 min-w-0">
              <div class="skeleton h-3 w-24"></div>
              <div class="skeleton h-5 w-32 max-w-full"></div>
            </div>
          </div>
          <div class="skeleton h-2 w-full !rounded-full"></div>
          <div class="skeleton h-11 w-full !rounded-xl"></div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-9" aria-busy="true">
        <span class="sr-only">{{ $t("loading") }}</span>
        <ul class="task-list" aria-hidden="true">
          <li v-for="n in TASK_SKELETON_ROWS" :key="n">
            <div class="task-row">
              <div class="task-row-main">
                <div class="skeleton w-11 h-11 shrink-0 !rounded-xl"></div>
                <div class="flex flex-col gap-2 flex-1 min-w-0">
                  <!-- Разная ширина названий — выглядит естественнее -->
                  <div
                    class="skeleton h-4 max-w-full"
                    :style="{ width: ['55%', '40%', '65%', '48%'][(n - 1) % 4] }"
                  ></div>
                  <div class="skeleton h-3 w-28"></div>
                </div>
                <div class="skeleton w-11 h-11 shrink-0 !rounded-full"></div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </template>

    <template v-else-if="tasks.length">
      <!-- Прогресс по заданиям урока -->
      <div class="col-span-12 lg:col-span-3">
        <stickyBox>
          <div class="tasks-summary">
            <div class="flex items-center gap-4">
              <circleProgressBar
                :progress="averagePercent"
                :className="'w-20 h-20 shrink-0'"
                :textClass="'text-base'"
              />
              <div class="flex flex-col gap-1 min-w-0">
                <span class="text-sm text-inactive">{{
                  $t("pages.tasks.average_result")
                }}</span>
                <b class="text-lg leading-tight">{{
                  $t("pages.tasks.completed_of", {
                    done: completedTasksCount,
                    total: tasks.length,
                  })
                }}</b>
              </div>
            </div>

            <div class="cover-card-progress !bg-gray-200 dark:!bg-slate-700">
              <div
                :style="{
                  width: (completedTasksCount / tasks.length) * 100 + '%',
                }"
              ></div>
            </div>

            <p
              v-if="completedTasksCount === tasks.length"
              class="mb-0 text-success font-medium flex items-center gap-1.5"
            >
              <i class="pi pi-check-circle" aria-hidden="true"></i>
              {{ $t("pages.tasks.all_done") }}
            </p>

            <button
              v-else-if="canStart"
              type="button"
              class="btn btn-primary full"
              @click="startNext()"
            >
              {{
                isTest
                  ? completedTasksCount > 0
                    ? $t("pages.tasks.continue_the_test")
                    : $t("pages.tasks.start_the_test")
                  : completedTasksCount > 0
                    ? $t("pages.tasks.continue_tasks")
                    : $t("pages.tasks.start_tasks")
              }}
              <i class="pi pi-arrow-right" aria-hidden="true"></i>
            </button>
          </div>
        </stickyBox>
      </div>

      <!-- Список заданий -->
      <!-- Обновление (после выполнения/удаления задания): список остаётся
           на месте, по строкам идёт перелив, клики на это время отключены -->
      <div
        class="col-span-12 lg:col-span-9 relative"
        :aria-busy="pendingTasks || undefined"
      >
        <span v-if="pendingTasks" class="sr-only">{{ $t("loading") }}</span>
        <TransitionGroup
          tag="ul"
          class="task-list"
          :class="{ refreshing: pendingTasks }"
          :move="{ transition: { duration: 0.3 } }"
        >
          <li v-for="(taskItem, taskIndex) in tasks" :key="taskItem.task_id">
            <div
              class="task-row"
              :class="{
                done: isDone(taskItem),
                locked: isLocked(taskItem),
                next: nextTask && nextTask.task_id === taskItem.task_id,
              }"
            >
              <button
                type="button"
                class="task-row-main"
                :disabled="isLocked(taskItem)"
                :title="isLocked(taskItem) ? $t('pages.tasks.locked_hint') : ''"
                @click="onTaskClick(taskItem)"
              >
                <span class="task-icon" aria-hidden="true">
                  <i :class="taskItem.icon"></i>
                </span>
                <span class="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                  <span class="font-semibold leading-snug">{{
                    taskItem.task_slug
                  }}</span>
                  <span class="text-xs text-inactive">{{
                    taskItem.task_type_name
                  }}</span>
                </span>

                <!-- Результат выполненного задания — внутри строки, справа -->
                <circleProgressBar
                  v-if="isDone(taskItem)"
                  :progress="taskItem.task_result.percentage"
                  :className="'w-11 h-11 shrink-0'"
                  :textClass="'text-[10px]'"
                />
                <span
                  v-else-if="isLocked(taskItem)"
                  class="lesson-badge text-inactive"
                >
                  <i class="pi pi-lock" aria-hidden="true"></i>
                </span>
              </button>

              <div class="task-row-actions">
                <roleProvider :roles="[1]">
                  <div class="flex gap-x-1">
                    <button
                      type="button"
                      @click="order('up', taskIndex, $event.target)"
                      class="btn btn-square btn-light btn-sm btn-up"
                      :title="$t('move_up')"
                      :aria-label="$t('move_up')"
                    >
                      <i class="pi pi-arrow-up"></i>
                    </button>
                    <button
                      type="button"
                      @click="order('down', taskIndex, $event.target)"
                      class="btn btn-square btn-light btn-sm btn-down"
                      :title="$t('move_down')"
                      :aria-label="$t('move_down')"
                    >
                      <i class="pi pi-arrow-down"></i>
                    </button>
                    <button
                      type="button"
                      @click="openEditTask(taskItem)"
                      class="btn btn-square btn-light btn-sm"
                      :title="$t('edit')"
                      :aria-label="$t('edit')"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button
                      type="button"
                      @click="confirmDeleteTask(taskItem)"
                      class="btn btn-square btn-light btn-delete btn-sm"
                      :title="$t('delete')"
                      :aria-label="$t('delete')"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </roleProvider>
              </div>
            </div>
          </li>
        </TransitionGroup>
      </div>
    </template>

    <div v-else class="col-span-12">
      <emptyState
        :text="$t('pages.tasks.there_are_no_tasks')"
        icon="bi bi-inbox"
      />
    </div>
  </div>

  <modal
    :show="modalIsVisible"
    :onClose="() => closeModalByUser()"
    :className="modalClass + ' min-h-60 select-none'"
    :showLoader="pendingModal"
    :showPendingText="true"
    :loaderOpacityFull="true"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h5>{{ task ? task.task_slug : $t("pages.tasks.adding_a_task") }}</h5>
    </template>
    <template v-slot:body_content>
      <component :is="currentModal" v-bind="modalProps" />
    </template>
  </modal>

  <modal
    :show="taskResultModalIsVisible"
    :onClose="() => (taskResultModalIsVisible = false)"
    :className="'modal-xl'"
    :showLoader="false"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content v-if="task">
      <h5>{{ task.task_slug }}</h5>
    </template>
    <template v-slot:body_content v-if="task && task.task_result.answers">
      <taskResultChart :taskResult="task.task_result">
        <template
          v-slot:footer_content
          v-if="task.task_result && task.task_result.completed === true"
        >
          <div class="col-span-12">
            <div class="btn-wrap justify-end">
              <button type="button"
                v-if="
                  props.lessonData.lesson_type_slug === 'file_test' &&
                  completedTasksCount < tasks.length
                "
                class="btn btn-primary"
                @click="openTask(tasks[task.taskIndex + 1])"
              >
                <i class="pi pi-arrow-right"></i>
                {{ $t("pages.tasks.next_task") }}
              </button>
              <button type="button"
                v-if="props.lessonData.lesson_type_slug !== 'file_test'"
                class="btn btn-primary"
                @click="openTask(task)"
              >
                <i class="pi pi-replay"></i>
                {{ $t("pages.tasks.try_again") }}
              </button>
            </div>
          </div>
        </template>
      </taskResultChart>
    </template>
  </modal>
</template>

<script setup>
import { scrollIntoView } from "seamless-scroll-polyfill";
import { useRouter } from "nuxt/app";
import { provide, shallowRef } from "vue";
import roleProvider from "../../ui/roleProvider.vue";
import dropdownMenu from "../../ui/dropdownMenu.vue";
import modal from "../../ui/modal.vue";
import emptyState from "~/components/ui/emptyState.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import taskResultChart from "../components/tasks/taskResultChart.vue";
import circleProgressBar from "../../ui/circleProgressBar.vue";
import stickyBox from "../../ui/stickyBox.vue";
import { useConfirm } from "~/composables/useConfirm";
import { useNotify } from "~/composables/useNotify";

const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const pendingTasks = ref(false);
const pendingModal = ref(false);
const pendingDelete = ref(false);

const tasks = ref([]);
const task = ref(null);
const completedTasksCount = ref(0);
const completedTasksPercent = ref(0);
const deleteTaskId = ref(null);
const taskAttributes = ref([]);
const modalClass = ref("modal-lg");
const modalProps = ref({});
const modalIsVisible = ref(false);
const currentModal = shallowRef(null);
const taskResultModalIsVisible = ref(false);

const props = defineProps({
  lesson_id: {
    required: true,
  },

  lessonData: {
    required: true,
  },
});

const { t } = useI18n();
const confirm = useConfirm();
const notify = useNotify();

const isTest = computed(() => props.lessonData?.lesson_type_slug === "file_test");

// Ученик в тесте проходит задания строго по порядку — по клику не открываются.
const isOnlyLearnerTest = computed(
  () =>
    isTest.value && props.lessonData?.available_status?.is_only_learner === true,
);

const isDone = (taskItem) => taskItem.task_result?.completed === true;

const isLocked = (taskItem) =>
  isOnlyLearnerTest.value && !taskItem.task_result?.answers;

// Средний результат по всем заданиям урока (невыполненные — как 0%).
const averagePercent = computed(() =>
  tasks.value.length
    ? Math.round(completedTasksPercent.value / tasks.value.length)
    : 0,
);

// Первое невыполненное задание — подсвечивается и открывается кнопкой.
const nextTask = computed(() =>
  isTest.value
    ? tasks.value.find((t) => t.task_result && !t.task_result.answers)
    : tasks.value.find((t) => !isDone(t)),
);

const canStart = computed(() => Boolean(nextTask.value));

const startNext = () => {
  if (isTest.value) startTheTest();
  else if (nextTask.value) openTask(nextTask.value);
};

const onTaskClick = (taskItem) => {
  if (taskItem.task_result?.answers) openTaskResult(taskItem);
  else if (!isLocked(taskItem)) openTask(taskItem);
};

const onPending = (state) => {
  pendingModal.value = state;
};

const onStartTask = () => {
  console.log("task is started");
};

const onCompleteTask = () => {
  getLessonTasks();
};

const changeModalSize = (size) => {
  modalClass.value = size;
};

const closeModal = () => {
  modalIsVisible.value = false;
  pendingModal.value = false;
  task.value = null;
  getTaskAttributes();
  getLessonTasks();
};

const closeModalByUser = () => {
  modalIsVisible.value = false;
  pendingModal.value = false;
  currentModal.value = null;
  task.value = null;
};

const openTask = (currentTask) => {
  task.value = currentTask;
  taskResultModalIsVisible.value = false;
  openTaskModal(task.value.task_type_component, "execution", {
    task: currentTask,
    lessonType: props.lessonData.lesson_type_slug,
  });
};

const openTaskResult = (currentTask) => {
  task.value = currentTask;
  currentModal.value = null;
  taskResultModalIsVisible.value = true;
};

const openEditTask = (currentTask) => {
  task.value = currentTask;
  openTaskModal(task.value.task_type_component, "edit", {
    task: currentTask,
  });
};

const openTaskModal = (component, action, props = {}) => {
  modalIsVisible.value = true;
  currentModal.value = defineAsyncComponent(
    () => import(`../components/tasks/actions/${action}/${component}.vue`),
  );
  modalProps.value = props;
};

const startTheTest = () => {
  for (let index = 0; index < tasks.value.length; index++) {
    const task = tasks.value[index];
    if (task.task_result && !task.task_result.answers) {
      openTask(task);
      break;
    }
  }
};

provide("onPending", onPending);
provide("onStartTask", onStartTask);
provide("onCompleteTask", onCompleteTask);
provide("changeModalSize", changeModalSize);
provide("closeModal", closeModal);

provide("tasks", tasks);
provide("completedTasksCount", completedTasksCount);
provide("openTask", openTask);

const pendingLesson = inject("pendingLesson");
// true до первого ответа — показываем скелетон, а не «Заданий нет»
const firstRequest = ref(true);
const TASK_SKELETON_ROWS = 4;

const getLessonTasks = async () => {
  pendingTasks.value = true;
  completedTasksCount.value = 0;
  completedTasksPercent.value = 0;

  await $axiosPlugin
    .get("tasks/get_lesson_tasks/" + props.lesson_id)
    .then((response) => {
      tasks.value = response.data;
      pendingTasks.value = false;

      if (firstRequest.value === true) {
        pendingLesson.value = false;
        firstRequest.value = false;
      }

      for (let taskIndex = 0; taskIndex < tasks.value.length; taskIndex++) {
        const task = tasks.value[taskIndex];
        task.taskIndex = taskIndex;
        if (task.task_result && task.task_result.completed === true) {
          completedTasksCount.value++;
          completedTasksPercent.value += task.task_result.percentage;
        }
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

const confirmDeleteTask = async (taskItem) => {
  const ok = await confirm({
    title: t("pages.tasks.delete_task"),
    message: t("pages.tasks.delete_confirm"),
    confirmText: t("delete"),
    danger: true,
  });
  if (!ok) return;
  currentModal.value = null;
  deleteTaskId.value = taskItem.task_id;
  deleteTaskSubmit();
};

const deleteTaskSubmit = async () => {
  if (pendingDelete.value) return;
  pendingDelete.value = true;
  pendingTasks.value = true;

  const form_data = new FormData();
  form_data.append("operation_type_id", 22);

  await $axiosPlugin
    .post("tasks/delete_task/" + props.lesson_id + "/" + deleteTaskId.value, form_data)
    .then(() => {
      getLessonTasks();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          // Раньше здесь была ссылка на несуществующую переменную errors.
          pendingTasks.value = false;
          notify(
            "danger",
            err.response.data?.message || t("an_error_occurred"),
          );
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
    })
    .finally(() => {
      pendingDelete.value = false;
    });
};

const orderTasks = async () => {
  const form_data = new FormData();
  form_data.append("tasks", JSON.stringify(tasks.value));
  form_data.append("operation_type_id", 19);
  await $axiosPlugin
    .post("tasks/order/" + props.lesson_id, form_data)
    .then((response) => {
      //getLessonTasks();
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

const debounceOrder = debounceHandler(orderTasks, 2000);

const order = (direction, index, event) => {
  const parent = event.closest("li");
  if (!parent) return;

  if (direction === "up" && index > 0) {
    [tasks.value[index - 1], tasks.value[index]] = [
      tasks.value[index],
      tasks.value[index - 1],
    ];
  } else if (direction === "down" && index < tasks.value.length - 1) {
    [tasks.value[index], tasks.value[index + 1]] = [
      tasks.value[index + 1],
      tasks.value[index],
    ];
  }

  scrollIntoView(parent, {
    behavior: "smooth",
    block: "center",
    inline: "center",
  });

  debounceOrder();
};

onMounted(() => {
  getTaskAttributes();
  getLessonTasks();
});
</script>
