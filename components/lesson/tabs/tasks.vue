<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <div class="btn-wrap">
        <client-only>
          <roleProvider :roles="[1]">
            <dropdownMenu :dropdownArrow="false" :position="'left'">
              <template v-slot:btn_content>
                <button class="btn btn-outline-primary">
                  <i class="pi pi-plus"></i>
                  {{ $t("pages.tasks.add_a_task") }}
                </button>
              </template>

              <template v-slot:menu_content>
                <li
                  v-for="(task_type, index) in taskAttributes.all_task_types"
                  :key="index"
                >
                  <button
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
          </roleProvider>
        </client-only>
      </div>
    </div>

    <div v-if="tasks.length" class="col-span-12">
      <div class="custom-grid">
        <div class="col-span-12 lg:col-span-3">
          <stickyBox>
            <div class="card p-4">
              <div class="flex justify-between items-center gap-x-2 mb-4">
                <h2 class="mb-2">{{ props.lessonData.lesson_name }}</h2>
                <circleProgressBar
                  :progress="completedTasksPercent / tasks.length"
                />
              </div>
              <div class="flex flex-wrap justify-between mb-1">
                <span> {{ $t("pages.tasks.count") }}: </span>
                <b>{{ tasks.length }}</b>
              </div>

              <div class="flex flex-wrap justify-between">
                <span> {{ $t("passed") }}: </span>
                <b>{{ completedTasksCount }}</b>
              </div>

              <div class="btn-wrap justify-end">
                <button
                  v-if="
                    props.lessonData.lesson_type_slug === 'file_test' &&
                    completedTasksCount < tasks.length
                  "
                  class="btn btn-outline-primary mt-4"
                  @click="startTheTest()"
                >
                  <i class="pi pi-arrow-right"></i>
                  {{
                    completedTasksCount > 0
                      ? $t("pages.tasks.continue_the_test")
                      : $t("pages.tasks.start_the_test")
                  }}
                </button>
              </div>
            </div>
          </stickyBox>
        </div>

        <div class="col-span-12 lg:col-span-9">
          <TransitionGroup
            tag="ul"
            class="list-group overflow-hidden"
            :move="{ transition: { duration: 0.3 } }"
          >
            <loader v-if="pendingTasks" :className="'overlay'" />
            <li v-for="(taskItem, taskIndex) in tasks" :key="taskItem.task_id">
              <div class="flex items-center justify-between gap-4">
                <div
                  class="flex gap-2 items-center w-full"
                  :class="
                    props.lessonData.lesson_type_slug === 'file_test' &&
                    props.lessonData.is_only_learner === true &&
                    !taskItem.task_result.answers
                      ? ''
                      : 'link'
                  "
                  @click="
                    taskItem.task_result.answers
                      ? openTaskResult(taskItem)
                      : props.lessonData.lesson_type_slug === 'file_test' &&
                        props.lessonData.is_only_learner === true
                      ? false
                      : openTask(taskItem)
                  "
                >
                  <i class="text-3xl text-active" :class="taskItem.icon"></i>
                  <div class="flex flex-col gap-y-0.5">
                    <span class="font-medium text-active">{{ taskItem.task_slug }}</span>
                    <span class="text-inactive text-xs">{{
                      taskItem.task_type_name
                    }}</span>
                  </div>
                </div>

                <div>
                  <div class="flex items-center gap-x-2">
                    <roleProvider :roles="[1]">
                      <div class="flex gap-x-1 justify-end">
                        <button
                          @click="order('up', taskIndex, $event.target)"
                          class="btn btn-square btn-light btn-sm btn-up"
                          :title="$t('move_up')"
                        >
                          <i class="pi pi-arrow-up"></i>
                        </button>
                        <button
                          @click="order('down', taskIndex, $event.target)"
                          class="btn btn-square btn-light btn-sm btn-down"
                          :title="$t('move_down')"
                        >
                          <i class="pi pi-arrow-down"></i>
                        </button>
                        <button
                          @click="openEditTask(taskItem)"
                          class="btn btn-square btn-light btn-sm"
                          :title="$t('edit')"
                        >
                          <i class="pi pi-pencil"></i>
                        </button>
                        <button
                          @click="openDeleteModal(taskItem)"
                          class="btn btn-square btn-outline-danger btn-sm"
                          :title="$t('delete')"
                        >
                          <i class="pi pi-trash"></i>
                        </button>
                      </div>
                    </roleProvider>
                    <circleProgressBar
                      v-if="
                        taskItem.task_result &&
                        taskItem.task_result.completed === true
                      "
                      :progress="taskItem.task_result.percentage"
                    />
                  </div>
                </div>
              </div>
            </li>
          </TransitionGroup>
        </div>
      </div>
    </div>

    <div v-else class="col-span-12">
      <alert :className="'light'">
        <p class="mb-0">{{ $t("pages.tasks.there_are_no_tasks") }}</p>
      </alert>
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
      <h3>{{ task ? task.task_slug : $t("pages.tasks.adding_a_task") }}</h3>
    </template>
    <template v-slot:body_content>
      <component :is="currentModal" v-bind="modalProps" />
    </template>
  </modal>

  <modal
    :show="deleteModalIsVisible"
    :onClose="() => (deleteModalIsVisible = false)"
    :className="'modal-lg'"
    :showLoader="pendingDelete"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.tasks.delete_task") }}</h4>
    </template>
    <template v-slot:body_content>
      <p>{{ $t("pages.tasks.delete_confirm") }}</p>
      <div class="btn-wrap justify-end mt-4">
        <button @click="deleteTaskSubmit()" class="btn btn-outline-danger">
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

  <modal
    :show="taskResultModalIsVisible"
    :onClose="() => (taskResultModalIsVisible = false)"
    :className="'modal-xl'"
    :showLoader="false"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content v-if="task">
      <h4>{{ task.task_slug }}</h4>
    </template>
    <template v-slot:body_content v-if="task && task.task_result.answers">
      <taskResultChart :taskResult="task.task_result">
        <template
          v-slot:footer_content
          v-if="task.task_result && task.task_result.completed === true"
        >
          <div class="col-span-12">
            <div class="btn-wrap justify-end">
              <button
                v-if="
                  props.lessonData.lesson_type_slug === 'file_test' &&
                  completedTasksCount < tasks.length
                "
                class="btn btn-outline-primary"
                @click="openTask(tasks[task.taskIndex + 1])"
              >
                <i class="pi pi-arrow-right"></i>
                {{ $t("pages.tasks.next_task") }}
              </button>
              <button
                v-if="props.lessonData.lesson_type_slug !== 'file_test'"
                class="btn btn-outline-primary"
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
import loader from "../../ui/loader.vue";
import { scrollIntoView } from "seamless-scroll-polyfill";
import { useRouter } from "nuxt/app";
import { provide, shallowRef } from "vue";
import roleProvider from "../../ui/roleProvider.vue";
import dropdownMenu from "../../ui/dropdownMenu.vue";
import modal from "../../ui/modal.vue";
import alert from "../../ui/alert.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import taskResultChart from "../components/tasks/taskResultChart.vue";
import circleProgressBar from "../../ui/circleProgressBar.vue";
import stickyBox from "../../ui/stickyBox.vue";

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
const deleteModalIsVisible = ref(false);

const props = defineProps({
  lesson_id: {
    required: true,
  },

  lessonData: {
    required: true,
  },
});

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
  currentModal.value = defineAsyncComponent(() =>
    import(`../components/tasks/actions/${action}/${component}.vue`)
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

const getLessonTasks = async () => {
  pendingTasks.value = true;
  completedTasksCount.value = 0;
  completedTasksPercent.value = 0;

  await $axiosPlugin
    .get("tasks/get_lesson_tasks/" + props.lesson_id)
    .then((response) => {
      tasks.value = response.data;
      pendingTasks.value = false;

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

const openDeleteModal = (task) => {
  currentModal.value = null;
  deleteTaskId.value = task.task_id;
  deleteModalIsVisible.value = true;
};

const deleteTaskSubmit = async () => {
  pendingDelete.value = true;
  await $axiosPlugin
    .delete("tasks/delete_task/" + props.lesson_id + "/" + deleteTaskId.value, {
      params: { operation_type_id: 22 }, // Передача параметра в URL
    })
    .then((response) => {
      deleteModalIsVisible.value = false;
      getLessonTasks();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
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
