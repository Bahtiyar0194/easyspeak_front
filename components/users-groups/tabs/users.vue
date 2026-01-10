<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <div class="btn-wrap">
        <roleProvider :roles="[1, 2, 3]">
          <button
            class="btn btn-outline-primary"
            @click="inviteModalIsVisible = true"
          >
            <i class="pi pi-user-plus"></i>
            {{ $t("invite") }}
          </button>
        </roleProvider>

        <button @click="showHideUserSearchFilter" class="btn btn-light">
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
          <h5>{{ $t("pages.users.search_filter") }}</h5>
          <form @submit.prevent="debounceReset" ref="searchFormRef">
            <div class="custom-grid">
              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-user"></i>
                  <input
                    type="text"
                    name="user"
                    placeholder=" "
                    @input="debounceUsers"
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
                    @input="debounceUsers"
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
                    @input="debounceUsers"
                  />
                  <label>{{ $t("form.phone") }}</label>
                </div>
              </div>

              <div class="col-span-12">
                <multipleSelect
                  :className="'form-group-border select active label-active'"
                  :icon="'pi pi-hourglass'"
                  :label="$t('pages.users.user_status')"
                  :items="attributes.user_statuses"
                  :optionName="'statuses[]'"
                  :optionValue="'status_type_id'"
                  :optionLabel="'status_type_name'"
                  :onChange="debounceUsers"
                />
              </div>

              <div class="col-span-12">
                <multipleSelect
                  :className="'form-group-border select active label-active'"
                  :icon="'pi pi-id-card'"
                  :label="$t('pages.users.user_role')"
                  :items="attributes.user_roles"
                  :optionName="'roles[]'"
                  :optionValue="'role_type_id'"
                  :optionLabel="'user_role_type_name'"
                  :onChange="debounceUsers"
                />
              </div>

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-calendar"></i>
                  <input
                    type="date"
                    name="created_at_from"
                    @input="debounceUsers"
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
                    @input="debounceUsers"
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
          </form>
        </div>
      </stickyBox>
    </div>

    <div class="col-span-12" :class="searchFilter && 'lg:col-span-9'">
      <template v-if="users.data?.length > 0">
        <div class="table table-striped table-sm selectable">
          <loader v-if="pending" :className="'overlay'" />
          <table ref="tableRef">
            <thead>
              <tr>
                <sortTableHead
                  v-for="(head, index) in userTableHeads"
                  :key="index"
                  :title="head.title"
                  :keyName="head.keyName"
                  :sortKey="sortKey"
                  :sortDirection="sortDirection"
                  :sortType="head.sortType"
                  :sortHandler="debounceUsers"
                  @update:sortKey="sortKey = $event"
                  @update:sortDirection="sortDirection = $event"
                />
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="user in users.data"
                :key="user.user_id"
                @click="getUser(user.user_id)"
              >
                <td>
                  <div class="flex gap-x-2 items-center">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-6 h-6'"
                      :user="user"
                    />
                    {{ user.last_name }} {{ user.first_name }}
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>{{ user.phone }}</td>
                <td>{{ new Date(user.created_at).toLocaleString() }}</td>
                <td :class="user.status_color">
                  {{ user.status_type_name }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="btn-wrap mt-4">
          <pagination
            :items="users"
            :setItems="getUsers"
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
    :show="inviteModalIsVisible"
    :onClose="() => closeInviteModal()"
    :className="'modal-lg'"
    :showLoader="pendingInvite"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.users.invite_user_title") }}</h4>
    </template>
    <template v-slot:body_content>
      <subscription v-if="schoolStore.schoolData && schoolStore.schoolData.subscription_expired" />
      <form
        v-else
        class="mt-2"
        @submit.prevent="inviteUserSubmit"
        ref="inviteFormRef"
      >
        <div class="custom-grid">
          <div class="col-span-12">
            <div class="form-group-border active">
              <i class="pi pi-user"></i>
              <input
                autoComplete="new-first-name"
                name="first_name"
                type="text"
                placeholder=" "
              />
              <label :class="{ 'label-error': errors.first_name }">
                {{
                  errors.first_name
                    ? errors.first_name[0]
                    : $t("form.first_name")
                }}
              </label>
            </div>
          </div>
          <div class="col-span-12">
            <div class="form-group-border active">
              <i class="pi pi-user"></i>
              <input
                autoComplete="new-last-name"
                name="last_name"
                type="text"
                placeholder=" "
              />
              <label :class="{ 'label-error': errors.last_name }">
                {{
                  errors.last_name ? errors.last_name[0] : $t("form.last_name")
                }}
              </label>
            </div>
          </div>
          <div class="col-span-12">
            <div class="form-group-border active">
              <i class="pi pi-at"></i>
              <input
                autoComplete="new-email"
                name="email"
                type="text"
                placeholder=" "
              />
              <label :class="{ 'label-error': errors.email }">
                {{ errors.email ? errors.email[0] : $t("form.email") }}
              </label>
            </div>
          </div>
          <div class="col-span-12">
            <div class="form-group-border active">
              <i class="pi pi-mobile"></i>
              <input
                autoComplete="new-phone"
                name="phone"
                v-mask="'+7 (###) ###-####'"
                placeholder=" "
              />
              <label :class="{ 'label-error': errors.phone }">
                {{ errors.phone ? errors.phone[0] : $t("form.phone") }}
              </label>
            </div>
          </div>
        </div>

        <div class="mt-2">
          <label class="label-focus" :class="errors.roles_count && 'danger'">{{
            errors.roles_count
              ? errors.roles_count[0]
              : $t("pages.users.select_user_roles")
          }}</label>

          <div class="btn-wrap mt-2">
            <label
              v-for="role in attributes.user_roles"
              :key="role.role_type_id"
              class="custom-radio-checkbox"
            >
              <input
                class="invite_role_input"
                name="roles[]"
                :value="role.role_type_id"
                type="checkbox"
                :checked="false"
              />
              <span>{{ role.user_role_type_name }}</span>
            </label>
          </div>
        </div>

        <button class="btn btn-primary mt-4" type="submit">
          <i class="pi pi-check"></i>
          {{ $t("continue") }}
        </button>
      </form>
    </template>
  </modal>

  <modal
    :show="userModalIsVisible"
    :onClose="() => (userModalIsVisible = false)"
    :className="'modal-lg'"
    :showLoader="pendingUser"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.users.user_info") }}</h4>
    </template>
    <template v-if="user" v-slot:body_content>
      <div class="flex flex-wrap gap-x-4 gap-y-4 whitespace-nowrap">
        <userAvatar :user="user" :className="'w-12 h-12 text-2xl'" />
        <div class="flex flex-col gap-y-4">
          <h4 class="mb-0">{{ user.last_name }} {{ user.first_name }}</h4>
          <span
            ><span class="text-inactive">{{ $t("form.email") }}:</span>
            {{ user.email }}</span
          >
          <span
            ><span class="text-inactive">{{ $t("form.phone") }}:</span>
            {{ user.phone }}</span
          >
        </div>
        <div class="flex flex-col gap-y-4">
          <div v-if="user.roles?.length > 1">
            <p class="text-inactive mb-2">{{ $t("pages.users.user_role") }}:</p>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="role in user.available_roles"
                :key="role.role_type_id"
                class="badge badge-light"
              >
                <i class="pi pi-user mr-0.5 -mt-1"></i>
                {{ role.user_role_type_name }}
              </div>
            </div>
          </div>

          <div class="btn-wrap">
            <button @click="getGrade" class="btn btn-primary">
              <i class="pi pi-chart-bar"></i>
              {{ $t("pages.education-program.get_grade") }}
            </button>
            <roleProvider :roles="[1, 2, 3]">
              <button @click="getEditUser" class="btn btn-outline-primary">
                <i class="pi pi-user-edit"></i>
                {{ $t("edit") }}
              </button>
            </roleProvider>
          </div>
        </div>
      </div>
    </template>
  </modal>

  <modal
    :show="editModalIsVisible"
    :onClose="() => (editModalIsVisible = false)"
    :className="'modal-lg'"
    :showLoader="pendingEdit"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.users.edit_user_title") }}</h4>
    </template>
    <template v-if="user" v-slot:body_content>
      <form
        class="mt-2"
        @submit.prevent="editUserSubmit(user.user_id)"
        ref="editFormRef"
      >
        <div class="custom-grid">
          <div class="col-span-12">
            <div class="form-group-border active">
              <i class="pi pi-user"></i>
              <input
                autoComplete="edit-first-name"
                name="first_name"
                v-model="user.first_name"
                type="text"
                placeholder=" "
              />
              <label :class="{ 'label-error': errors.first_name }">
                {{
                  errors.first_name
                    ? errors.first_name[0]
                    : $t("form.first_name")
                }}
              </label>
            </div>
          </div>
          <div class="col-span-12">
            <div class="form-group-border active">
              <i class="pi pi-user"></i>
              <input
                autoComplete="edit-last-name"
                name="last_name"
                v-model="user.last_name"
                type="text"
                placeholder=" "
              />
              <label :class="{ 'label-error': errors.last_name }">
                {{
                  errors.last_name ? errors.last_name[0] : $t("form.last_name")
                }}
              </label>
            </div>
          </div>
          <div class="col-span-12">
            <div class="form-group-border active">
              <i class="pi pi-at"></i>
              <input
                autoComplete="new-email"
                name="email"
                v-model="user.email"
                type="text"
                placeholder=" "
              />
              <label :class="{ 'label-error': errors.email }">
                {{ errors.email ? errors.email[0] : $t("form.email") }}
              </label>
            </div>
          </div>
          <div class="col-span-12">
            <div class="form-group-border active">
              <i class="pi pi-mobile"></i>
              <input
                autoComplete="new-phone"
                name="phone"
                v-model="user.phone"
                v-mask="'+7 (###) ###-####'"
                placeholder=" "
              />
              <label :class="{ 'label-error': errors.phone }">
                {{ errors.phone ? errors.phone[0] : $t("form.phone") }}
              </label>
            </div>
          </div>
        </div>

        <div class="mt-2">
          <label class="label-focus" :class="errors.roles_count && 'danger'">{{
            errors.roles_count
              ? errors.roles_count[0]
              : $t("pages.users.user_role")
          }}</label>

          <div class="btn-wrap mt-2">
            <label
              v-for="role in user.roles"
              :key="role.role_type_id"
              class="custom-radio-checkbox"
            >
              <input
                class="edit_role_input"
                name="roles[]"
                :value="role.role_type_id"
                type="checkbox"
                :checked="role.selected"
              />
              <span>{{ role.user_role_type_name }}</span>
            </label>
          </div>
        </div>

        <button class="btn btn-primary mt-4" type="submit">
          <i class="pi pi-check"></i>
          {{ $t("continue") }}
        </button>
      </form>
    </template>
  </modal>

  <modal
    :show="gradeModalIsVisible"
    :onClose="() => closeGradeModal()"
    :className="gradeModalClass"
    :showLoader="pendingGrade"
    :showPendingText="true"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.education-program.grade") }}</h4>
    </template>
    <template v-if="user" v-slot:body_content>
      <h2>{{ user.last_name }} {{ user.first_name }}</h2>

      <template v-if="userGrade">
        <div class="custom-grid">
          <div class="col-span-12">
            <ul class="breadcrumb">
              <li>
                <button
                  @click="goToCourses()"
                  :class="!activeCourse ? 'inactive' : ''"
                >
                  <span>
                    {{ $t("pages.courses.title") }}
                  </span>
                </button>
              </li>
              <li v-if="activeCourse">
                <button
                  @click="goToLevels()"
                  :class="!activeLevel ? 'inactive' : ''"
                >
                  <span>{{ activeCourse.course_name }}</span>
                </button>
              </li>
              <li v-if="activeLevel">
                <button
                  @click="goToSections()"
                  :class="!activeSection ? 'inactive' : ''"
                >
                  <span>{{ activeLevel.level_name }}</span>
                </button>
              </li>
              <li v-if="activeSection">
                <button
                  @click="goToLessons()"
                  :class="!activeLesson ? 'inactive' : ''"
                >
                  <span>{{ activeSection.section_name }}</span>
                </button>
              </li>
              <li v-if="activeLesson">
                <button
                  @click="goToTasks()"
                  :class="!activeTask ? 'inactive' : ''"
                >
                  <span>{{ activeLesson.lesson_name }}</span>
                </button>
              </li>
              <li v-if="activeTask">
                <span>{{ activeTask.task_slug }}</span>
              </li>
            </ul>
          </div>
          <div class="col-span-12">
            <div class="custom-grid">
              <template v-if="activeTask">
                <div class="col-span-12">
                  <button class="btn btn-light" @click="goToTasks()">
                    <i class="pi pi-arrow-left"></i>
                    {{ $t("back") }}
                  </button>
                </div>

                <div class="col-span-12">
                  <taskResultChart :taskResult="activeTask.task_result" />
                </div>
              </template>
              <template v-else-if="activeLesson">
                <div class="col-span-12">
                  <button class="btn btn-light" @click="goToLessons()">
                    <i class="pi pi-arrow-left"></i>
                    {{ $t("back") }}
                  </button>
                </div>

                <div class="col-span-12">
                  <h3 class="mb-2">{{ activeLesson.lesson_name }}</h3>
                  <div class="flex flex-wrap gap-1 mb-1">
                    <span> {{ $t("pages.tasks.count") }}: </span>
                    <b>{{ activeLesson.tasks.length }}</b>
                  </div>

                  <div class="flex flex-wrap gap-1 mb-1">
                    <span> {{ $t("passed") }}: </span>
                    <b>{{ activeLesson.completed_tasks_count }}</b>
                  </div>

                  <progressBar
                    :progressPercentage="activeLesson.completed_tasks_percent"
                    :wrapClass="'!my-0'"
                    :showPercentage="true"
                    :className="'sm success'"
                  />
                </div>

                <div class="col-span-12">
                  <ul class="list-group nowrap">
                    <li
                      v-for="taskItem in activeLesson.tasks"
                      :key="taskItem.task_id"
                    >
                      <button
                        class="w-full"
                        :class="
                          taskItem.task_result.completed === false
                            ? 'cursor-auto'
                            : 'cursor-pointer'
                        "
                        @click="
                          taskItem.task_result.completed === true
                            ? selectTask(taskItem)
                            : null
                        "
                      >
                        <div class="flex items-center justify-between gap-4">
                          <div class="flex gap-2 items-center w-full">
                            <i class="text-4xl" :class="taskItem.icon"></i>
                            <div class="flex flex-col gap-y-0.5">
                              <span class="font-medium text-left">{{
                                taskItem.task_slug
                              }}</span>
                              <span class="text-inactive text-xs text-left">{{
                                taskItem.task_type_name
                              }}</span>
                              <span
                                v-if="
                                  taskItem.task_result &&
                                  taskItem.task_result.completed === true
                                "
                                class="text-xs text-success text-left"
                                >{{ $t("pages.tasks.is_completed") }}</span
                              >
                              <span
                                v-else-if="
                                  taskItem.task_result &&
                                  taskItem.task_result.answers &&
                                  taskItem.task_result.completed === false
                                "
                                class="text-xs text-warning text-left"
                                >{{ $t("pages.tasks.is_being_reviewed") }}</span
                              >

                              <span
                                v-else
                                class="text-xs text-danger text-left"
                                >{{
                                  $t("pages.tasks.not_been_completed_yet")
                                }}</span
                              >
                            </div>
                          </div>

                          <circleProgressBar
                            v-if="
                              taskItem.task_result &&
                              taskItem.task_result.completed === true
                            "
                            :progress="taskItem.task_result.percentage"
                          />
                        </div>
                      </button>
                    </li>
                  </ul>
                </div>
              </template>
              <template v-else-if="activeSection">
                <div class="col-span-12">
                  <button class="btn btn-light" @click="goToSections()">
                    <i class="pi pi-arrow-left"></i>
                    {{ $t("back") }}
                  </button>
                </div>
                <div class="col-span-12">
                  <ul class="list-group nowrap">
                    <li
                      v-for="(lesson, lessonIndex) in activeSection.lessons"
                      :key="lessonIndex"
                    >
                      <button class="w-full" @click="selectLesson(lesson)">
                        <div class="flex gap-2 justify-between items-center">
                          <div class="flex flex-col gap-y-1.5">
                            <p class="mb-0 leading-none font-bold text-left">
                              {{ lessonIndex + 1 }}. {{ lesson.lesson_name }}
                              <span class="text-inactive font-normal"
                                >({{ lesson.lesson_type_name }})</span
                              >
                            </p>
                            <span class="text-xs text-left"
                              >{{ $t("pages.tasks.count") }}:
                              <b>{{ lesson.tasks.length }}</b></span
                            >
                          </div>
                          <circleProgressBar
                            :progress="lesson.completed_tasks_percent"
                          />
                        </div>
                      </button>
                    </li>
                  </ul>
                </div>
              </template>
              <template v-else-if="activeLevel">
                <div class="col-span-12">
                  <button class="btn btn-light" @click="goToLevels()">
                    <i class="pi pi-arrow-left"></i>
                    {{ $t("back") }}
                  </button>
                </div>
                <div class="col-span-12">
                  <ul class="list-group nowrap">
                    <li
                      v-for="(section, sectionIndex) in activeLevel.sections"
                      :key="sectionIndex"
                    >
                      <button class="w-full" @click="selectSection(section)">
                        <div class="flex gap-2 justify-between items-center">
                          <div class="flex flex-col gap-y-1.5">
                            <p class="mb-0 leading-none font-bold text-left">
                              {{ section.section_name }}
                            </p>
                            <span class="text-xs"
                              >{{ $t("pages.lessons.lessons_count") }}:
                              <b>{{ section.lessons.length }}</b></span
                            >
                          </div>
                          <circleProgressBar
                            :progress="section.completed_percent"
                          />
                        </div>
                      </button>
                    </li>
                  </ul>
                </div>
              </template>
              <template v-else-if="activeCourse">
                <div class="col-span-12">
                  <button class="btn btn-light" @click="goToCourses()">
                    <i class="pi pi-arrow-left"></i>
                    {{ $t("back") }}
                  </button>
                </div>
                <div
                  v-for="(level, levelIndex) in activeCourse.levels"
                  :key="levelIndex"
                  class="col-span-12 md:col-span-4"
                >
                  <button
                    @click="
                      level.available_status.is_available === true ? selectLevel(level) : null
                    "
                    :class="
                      level.available_status.is_available === true
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed'
                    "
                  >
                    <levelCard
                      :level="level"
                      :message="'pages.courses.course_is_not_available_for_learner'"
                    />
                  </button>
                </div>
              </template>
              <template v-else>
                <div
                  v-for="(course, courseIndex) in userGrade.courses"
                  :key="courseIndex"
                  class="col-span-12"
                >
                  <button @click="selectCourse(course)">
                    <courseCard :course="course" />
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </template>
    </template>
  </modal>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import modal from "../../ui/modal.vue";
import subscription from "../../ui/subscription.vue";
import loader from "../../ui/loader.vue";
import alert from "../../ui/alert.vue";
import userAvatar from "../../ui/userAvatar.vue";
import stickyBox from "../../ui/stickyBox.vue";
import pagination from "../../ui/pagination.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import roleProvider from "../../ui/roleProvider.vue";
import multipleSelect from "../../ui/multipleSelect.vue";
import sortTableHead from "../../ui/sortTableHead.vue";
import courseCard from "../../courses/courseCard.vue";
import levelCard from "../../levels/levelCard.vue";
import progressBar from "../../ui/progressBar.vue";
import circleProgressBar from "../../ui/circleProgressBar.vue";
import taskResultChart from "../../lesson/components/tasks/taskResultChart.vue";
const router = useRouter();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const schoolStore = useSchoolStore();
const { t } = useI18n();
const pending = ref(true);
const pendingInvite = ref(false);
const pendingUser = ref(false);
const pendingEdit = ref(false);
const pendingGrade = ref(false);
const tableRef = ref(null);
const searchFormRef = ref(null);
const inviteFormRef = ref(null);
const editFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(10);
const authUser = useSanctumUser();
const { refreshIdentity } = useSanctumAuth();
const users = ref([]);
const user = ref(null);
const userGrade = ref(null);
const attributes = ref([]);

const inviteModalIsVisible = ref(false);
const userModalIsVisible = ref(false);
const editModalIsVisible = ref(false);
const gradeModalIsVisible = ref(false);

const gradeModalDefaultClass = "modal-lg";
const gradeModalClass = ref(gradeModalDefaultClass);

const activeCourse = ref(null);
const activeLevel = ref(null);
const activeSection = ref(null);
const activeLesson = ref(null);
const activeTask = ref(null);

const sortKey = ref("users.created_at"); // Ключ сортировки
const sortDirection = ref("asc"); // Направление сортировки: asc или desc

const userTableHeads = [
  {
    title: t("form.last_name") + " " + t("form.first_name"),
    keyName: "users.last_name",
    sortType: "alpha",
  },
  {
    title: t("form.email"),
    keyName: "users.email",
    sortType: "alpha",
  },
  {
    title: t("form.phone"),
    keyName: "users.phone",
    sortType: "numeric",
  },
  {
    title: t("registered_at"),
    keyName: "users.created_at",
    sortType: "numeric",
  },
  {
    title: t("status"),
    keyName: "types_of_status_lang.status_type_name",
    sortType: "alpha",
  },
];

const getUsers = async (url) => {
  pending.value = true;

  const formData = new FormData(searchFormRef.value);
  formData.append("per_page", perPage.value);
  formData.append("sort_key", sortKey.value); // Добавляем ключ сортировки
  formData.append("sort_direction", sortDirection.value); // Добавляем направление сортировки

  if (!url) {
    url = "users/get";
  }

  await $axiosPlugin
    .post(url, formData)
    .then((response) => {
      users.value = response.data;
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

const getUser = async (user_id) => {
  pendingUser.value = true;
  userModalIsVisible.value = true;
  await $axiosPlugin
    .get("users/get/" + user_id)
    .then((response) => {
      errors.value = [];
      user.value = response.data;

      if (authUser.value.user_id === user_id) {
        refreshIdentity();
      }
      pendingUser.value = false;
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

const getEditUser = async () => {
  userModalIsVisible.value = false;
  editModalIsVisible.value = true;
};

const getGrade = async () => {
  userModalIsVisible.value = false;
  gradeModalIsVisible.value = true;
  pendingGrade.value = true;
  gradeModalClass.value = gradeModalDefaultClass;

  await $axiosPlugin
    .get("courses/get_grade/" + user.value.user_id)
    .then((response) => {
      userGrade.value = response.data;
      pendingGrade.value = false;
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

const getUserAttributes = async () => {
  pending.value = true;
  await $axiosPlugin
    .get("users/get_user_attributes")
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

const inviteUserSubmit = async () => {
  pendingInvite.value = true;
  const formData = new FormData(inviteFormRef.value);

  let roles = [];
  document.querySelectorAll(".invite_role_input:checked").forEach((role) => {
    roles.push(parseInt(role.value));
  });

  formData.append("roles_count", roles.length);
  formData.append("operation_type_id", 1);

  await $axiosPlugin
    .post("users/invite", formData)
    .then((response) => {
      getUsers();
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

const editUserSubmit = async (user_id) => {
  pendingEdit.value = true;

  const formData = new FormData(editFormRef.value);
  let roles = [];
  document.querySelectorAll(".edit_role_input:checked").forEach((role) => {
    roles.push(parseInt(role.value));
  });

  formData.append("roles_count", roles.length);
  formData.append("operation_type_id", 2);
  formData.append("user_id", user_id);

  await $axiosPlugin
    .post("users/update", formData)
    .then((response) => {
      errors.value = false;
      getUser(user_id);
      getUsers();
      pendingEdit.value = false;
      editModalIsVisible.value = false;
      userModalIsVisible.value = true;
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

const closeInviteModal = () => {
  inviteModalIsVisible.value = false;
  pendingInvite.value = false;
  if(inviteFormRef.value){
    inviteFormRef.value.reset();
  }
  errors.value = [];
};

const closeGradeModal = () => {
  gradeModalIsVisible.value = false;
  pendingGrade.value = false;
  userGrade.value = null;
  userModalIsVisible.value = true;

  activeCourse.value = null;
  activeLevel.value = null;
  activeSection.value = null;
  activeLesson.value = null;
  activeTask.value = null;
};

const showHideUserSearchFilter = () => {
  if (searchFilter.value === true) {
    searchFilter.value = false;
    resetUserSearchFilter();
  } else {
    searchFilter.value = true;
  }
};

const resetUserSearchFilter = () => {
  searchFormRef.value.reset();
  getUsers();
};

const debounceUsers = debounceHandler(() => getUsers(), 1000);
const debounceReset = debounceHandler(() => resetUserSearchFilter(), 500);

const selectCourse = (course) => {
  pendingGrade.value = true;

  setTimeout(() => {
    gradeModalClass.value = "modal-4xl";
    activeCourse.value = course;
    pendingGrade.value = false;
  }, 200);
};

const goToCourses = () => {
  gradeModalClass.value = gradeModalDefaultClass;
  activeCourse.value = null;
  activeLevel.value = null;
  activeSection.value = null;
  activeLesson.value = null;
  activeTask.value = null;
};

const selectLevel = (level) => {
  pendingGrade.value = true;

  setTimeout(() => {
    gradeModalClass.value = gradeModalDefaultClass;
    activeLevel.value = level;
    pendingGrade.value = false;
  }, 200);
};

const goToLevels = () => {
  gradeModalClass.value = "modal-4xl";
  activeLevel.value = null;
  activeSection.value = null;
  activeLesson.value = null;
  activeTask.value = null;
};

const selectSection = (section) => {
  pendingGrade.value = true;

  setTimeout(() => {
    gradeModalClass.value = "modal-2xl";
    activeSection.value = section;
    pendingGrade.value = false;
  }, 200);
};

const goToSections = () => {
  gradeModalClass.value = gradeModalDefaultClass;
  activeSection.value = null;
  activeLesson.value = null;
  activeTask.value = null;
};

const selectLesson = (lesson) => {
  pendingGrade.value = true;

  setTimeout(() => {
    gradeModalClass.value = "modal-2xl";
    activeLesson.value = lesson;
    pendingGrade.value = false;
  }, 200);
};

const goToLessons = () => {
  gradeModalClass.value = gradeModalDefaultClass;
  activeLesson.value = null;
  activeTask.value = null;
};

const selectTask = (task) => {
  pendingGrade.value = true;

  setTimeout(() => {
    gradeModalClass.value = "modal-2xl";
    activeTask.value = task;
    pendingGrade.value = false;
  }, 200);
};

const goToTasks = () => {
  gradeModalClass.value = "modal-2xl";
  activeTask.value = null;
};

onMounted(() => {
  getUserAttributes();
  getUsers();
});
</script>
