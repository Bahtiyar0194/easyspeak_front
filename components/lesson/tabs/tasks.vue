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
      <ul class="list-group">
        <li
          class="link"
          v-for="(task, taskIndex) in tasks"
          :key="taskIndex"
          @click="openTask(task)"
        >
          <div class="flex items-center gap-2">
            <i class="text-3xl" :class="task.icon"></i>
            <div class="flex flex-col gap-y-0.5">
              <span>{{ task.task_slug }}</span>
              <span class="text-inactive text-xs">{{
                task.task_type_name
              }}</span>
            </div>
          </div>
        </li>
      </ul>
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
</template>

<script setup>
import { useRouter } from "nuxt/app";
import { provide, shallowRef } from "vue";
import roleProvider from "../../ui/roleProvider.vue";
import dropdownMenu from "../../ui/dropdownMenu.vue";
import modal from "../../ui/modal.vue";
import alert from "../../ui/alert.vue";

const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const pendingTasks = ref(false);
const pendingModal = ref(false);

const task = ref(null);
const tasks = ref([]);
const taskAttributes = ref([]);
const modalClass = ref("modal-lg");
const modalProps = ref({});
const modalIsVisible = ref(false);
const currentModal = shallowRef(null);

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
  // currentModal.value = shallowRef(null);
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

onMounted(() => {
  getTaskAttributes();
  getLessonTasks();
});
</script>
