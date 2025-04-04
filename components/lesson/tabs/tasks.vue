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
      <TransitionGroup
        tag="ul"
        class="list-group"
        :move="{ transition: { duration: 0.3 } }"
      >
        <li v-for="(task, taskIndex) in tasks" :key="task.task_id">
          <div class="flex items-center justify-between gap-4">
            <div
              class="flex gap-2 items-center link w-full"
              @click="openTask(task)"
            >
              <i class="text-3xl" :class="task.icon"></i>
              <div class="flex flex-col gap-y-0.5">
                <span>{{ task.task_slug }}</span>
                <span class="text-inactive text-xs">{{
                  task.task_type_name
                }}</span>
              </div>
            </div>

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
                  @click="openEditTask(task)"
                  class="btn btn-square btn-light btn-sm"
                  :title="$t('edit')"
                >
                  <i class="pi pi-pencil"></i>
                </button>
                <button
                  @click="openDeleteModal(task)"
                  class="btn btn-square btn-outline-danger btn-sm"
                  :title="$t('delete')"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </roleProvider>
          </div>
        </li>
      </TransitionGroup>
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
    :className="modalClass"
    :showLoader="pendingModal"
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
</template>

<script setup>
import { scrollIntoView } from "seamless-scroll-polyfill";
import { useRouter } from "nuxt/app";
import { provide, shallowRef } from "vue";
import roleProvider from "../../ui/roleProvider.vue";
import dropdownMenu from "../../ui/dropdownMenu.vue";
import modal from "../../ui/modal.vue";
import alert from "../../ui/alert.vue";
import { debounceHandler } from "../../../utils/debounceHandler";

const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const pendingTasks = ref(false);
const pendingModal = ref(false);
const pendingDelete = ref(false);

const task = ref(null);
const deleteTaskId = ref(null);
const tasks = ref([]);
const taskAttributes = ref([]);
const modalClass = ref("modal-lg");
const modalProps = ref({});
const modalIsVisible = ref(false);
const currentModal = shallowRef(null);
const deleteModalIsVisible = ref(false);

const props = defineProps({
  lesson_id: {
    required: true,
  },
});

const onPending = (state) => {
  pendingModal.value = state;
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

provide("onPending", onPending);
provide("changeModalSize", changeModalSize);
provide("closeModal", closeModal);

const openTask = (currentTask) => {
  task.value = currentTask;
  openTaskModal(task.value.task_type_component, "execution", {
    task: currentTask,
  });
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

const getLessonTasks = async () => {
  pendingTasks.value = true;

  await $axiosPlugin
    .get("tasks/get_lesson_tasks/" + props.lesson_id)
    .then((response) => {
      tasks.value = response.data;
      pendingTasks.value = false;
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
    .delete(
      "tasks/delete_task/" + props.lesson_id + "/" + deleteTaskId.value,
      {
        params: { operation_type_id: 22 }, // Передача параметра в URL
      }
    )
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
