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
            <!-- <form @submit.prevent="debounceReset" ref="searchFormRef">
            <div class="custom-grid">
              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-clock"></i>
                  <input
                    type="text"
                    name="task_name"
                    placeholder=" "
                    @input="debounceTasks"
                  />
                  <label
                    >{{ $t("form.last_name") }},
                    {{ $t("form.first_name") }}</label
                  >
                </div>
              </div>
              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-at"></i>
                  <input
                    type="text"
                    name="email"
                    placeholder=" "
                    @input="debounceTasks"
                  />
                  <label>{{ $t("form.email") }}</label>
                </div>
              </div>

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-mobile"></i>
                  <input
                    v-mask="'+7 (###) ###-####'"
                    name="phone"
                    placeholder=" "
                    @input="debounceTasks"
                  />
                  <label>{{ $t("form.phone") }}</label>
                </div>
              </div>

              <div class="col-span-12">
                <multipleSelect
                  :className="'form-group-border select active label-active'"
                  :icon="'pi pi-hourglass'"
                  :label="$t('pages.tasks.task_status')"
                  :items="attributes.task_statuses"
                  :optionName="'statuses[]'"
                  :optionValue="'status_type_id'"
                  :optionLabel="'status_type_name'"
                  :onChange="debounceTasks"
                />
              </div>

              <div class="col-span-12">
                <multipleSelect
                  :className="'form-group-border select active label-active'"
                  :icon="'pi pi-id-card'"
                  :label="$t('pages.tasks.task_role')"
                  :items="attributes.task_roles"
                  :optionName="'roles[]'"
                  :optionValue="'role_type_id'"
                  :optionLabel="'task_role_type_name'"
                  :onChange="debounceTasks"
                />
              </div>

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-calendar"></i>
                  <input
                    type="date"
                    name="created_at_from"
                    @input="debounceTasks"
                    placeholder=" "
                  />
                  <label>{{ $t("registered_at_from") }}</label>
                </div>
              </div>

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-calendar"></i>
                  <input
                    type="date"
                    name="created_at_to"
                    @input="debounceTasks"
                    placeholder=" "
                  />
                  <label>{{ $t("registered_at_to") }}</label>
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
          </form> -->
          </div>
        </stickyBox>
      </div>

      <div class="col-span-12" :class="searchFilter && 'lg:col-span-9'">
        <template v-if="tasks.data?.length > 0">
          <div class="table table-striped table-sm selectable">
            <loader v-if="pending" :className="'overlay'" />
            <table ref="tableRef">
              <thead>
                <!-- <tr>
                <sortTableHead
                  v-for="(head, index) in taskTableHeads"
                  :key="index"
                  :title="head.title"
                  :keyName="head.keyName"
                  :sortKey="sortKey"
                  :sortDirection="sortDirection"
                  :sortType="head.sortType"
                  :sortHandler="debounceTasks"
                  @update:sortKey="sortKey = $event"
                  @update:sortDirection="sortDirection = $event"
                />
              </tr> -->
              </thead>

              <tbody>
                <!-- <tr
                v-for="task in tasks.data"
                :key="task.task_id"
                @click="getTask(task.task_id)"
              >
                <td>
                  <div class="flex gap-x-2 items-center">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-6 h-6'"
                      :task="task"
                    />
                    {{ task.last_name }} {{ task.first_name }}
                  </div>
                </td>
                <td>{{ task.email }}</td>
                <td>{{ task.phone }}</td>
                <td>{{ new Date(task.created_at).toLocaleString() }}</td>
                <td :class="task.status_color">{{ task.status_type_name }}</td>
              </tr> -->
              </tbody>
            </table>
          </div>
          <div class="btn-wrap mt-4">
            <!-- <pagination
            :items="tasks"
            :setItems="getTasks"
            :onSelect="(count) => (perPage = count)"
          /> -->
            <!-- <client-only>
                        <tableToExcelButton :table="tableRef"
                            :fileName="$t('pages.tasks.title') + ' - ' + new Date().toLocaleString()"
                            :className="'btn-sm'" />
                    </client-only> -->
          </div>
        </template>

        <alert v-else :className="'light'">
          <loader v-if="pending" :className="'overlay'" />
          <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
        </alert>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useRouter } from "nuxt/app";
import modal from "../../../components/ui/modal.vue";
import subscription from "../../../components/ui/subscription.vue";
import loader from "../../../components/ui/loader.vue";
import alert from "../../../components/ui/alert.vue";
import userAvatar from "../../../components/ui/userAvatar.vue";
import stickyBox from "../../../components/ui/stickyBox.vue";
import pagination from "../../../components/ui/pagination.vue";
import tableToExcelButton from "../../../components/ui/tableToExcelButton.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import roleProvider from "../../../components/ui/roleProvider.vue";
import multipleSelect from "../../../components/ui/multipleSelect.vue";
import sortTableHead from "../../../components/ui/sortTableHead.vue";

const router = useRouter();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const { t } = useI18n();
const pending = ref(true);
const pendingTask = ref(false);
const tableRef = ref(null);
const searchFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(10);
const tasks = ref([]);
const task = ref(null);
const attributes = ref([]);

const taskModalIsVisible = ref(false);

useHead({
  title: t("pages.checking-tasks.title"),
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const sortKey = ref("tasks.created_at"); // Ключ сортировки
const sortDirection = ref("asc"); // Направление сортировки: asc или desc

const taskTableHeads = [
  // {
  //     title: t('form.last_name') + ' ' + t('form.first_name'),
  //     keyName: 'tasks.last_name',
  //     sortType: 'alpha'
  // },
  // {
  //     title: t('form.email'),
  //     keyName: 'tasks.email',
  //     sortType: 'alpha'
  // },
  // {
  //     title: t('form.phone'),
  //     keyName: 'tasks.phone',
  //     sortType: 'numeric'
  // },
  // {
  //     title: t('registered_at'),
  //     keyName: 'tasks.created_at',
  //     sortType: 'numeric'
  // },
  // {
  //     title: t('status'),
  //     keyName: 'types_of_status_lang.status_type_name',
  //     sortType: 'alpha'
  // }
];

const getTasks = async (url) => {
  pending.value = true;

  const formData = new FormData(searchFormRef.value);
  formData.append("per_page", perPage.value);
  formData.append("sort_key", sortKey.value); // Добавляем ключ сортировки
  formData.append("sort_direction", sortDirection.value); // Добавляем направление сортировки

  if (!url) {
    url = "checking_tasks/get";
  }

  await $axiosPlugin
    .post(url, formData)
    .then((response) => {
      tasks.value = response.data;
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

const getTask = async (task_id) => {
  pendingTask.value = true;
  taskModalIsVisible.value = true;
  await $axiosPlugin
    .get("checking_tasks/get/" + task_id)
    .then((response) => {
      errors.value = [];
      task.value = response.data;
      pendingTask.value = false;
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
  pending.value = true;
  await $axiosPlugin
    .get("tasks/get_task_attributes")
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

const inviteTaskSubmit = async () => {
  pendingInvite.value = true;
  const formData = new FormData(inviteFormRef.value);

  let roles = [];
  document.querySelectorAll(".invite_role_input:checked").forEach((role) => {
    roles.push(parseInt(role.value));
  });

  formData.append("roles_count", roles.length);
  formData.append("operation_type_id", 1);

  await $axiosPlugin
    .post("tasks/invite", formData)
    .then((response) => {
      getTasks();
      closeInviteModal();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingInvite.value = false;
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

const closeInviteModal = () => {
  inviteModalIsVisible.value = false;
  pendingInvite.value = false;
  inviteFormRef.value.reset();
  errors.value = [];
};

const showHideTaskSearchFilter = () => {
  if (searchFilter.value === true) {
    searchFilter.value = false;
    resetTaskSearchFilter();
  } else {
    searchFilter.value = true;
  }
};

const resetTaskSearchFilter = () => {
  searchFormRef.value.reset();
  getTasks();
};

const debounceTasks = debounceHandler(() => getTasks(), 1000);
const debounceReset = debounceHandler(() => resetTaskSearchFilter(), 500);

onMounted(() => {
  //getTaskAttributes();
  //getTasks();
});
</script>
