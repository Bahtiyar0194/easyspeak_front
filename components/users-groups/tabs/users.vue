<template>
  <div class="custom-grid">
    <!-- Панель: фильтр слева, главное действие справа -->
    <div class="col-span-12">
      <div class="list-toolbar">
        <button
          type="button"
          @click="showHideUserSearchFilter"
          class="btn"
          :class="searchFilter ? 'btn-outline-primary' : 'btn-light'"
          :aria-pressed="searchFilter"
          :title="searchFilter ? $t('hide_search_filter') : $t('show_search_filter')"
        >
          <i class="pi pi-filter" aria-hidden="true"></i>
          {{ $t("filter") }}
        </button>
        <span v-if="users.total" class="text-sm text-inactive">
          {{ $t("found") }}: <b class="text-active">{{ users.total }}</b>
        </span>

        <roleProvider :roles="[1, 2, 3]">
          <button
            type="button"
            class="btn btn-primary ml-auto"
            @click="inviteModalIsVisible = true"
          >
            <i class="pi pi-user-plus" aria-hidden="true"></i>
            {{ $t("invite") }}
          </button>
        </roleProvider>
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
                    autocomplete="off"
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
                    autocomplete="off"
                    autocapitalize="none"
                    spellcheck="false"
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
                    type="tel"
                    inputmode="tel"
                    autocomplete="off"
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
      <!-- Скелетон: первая загрузка или переход на другую страницу
           (при пагинации — столько же строк, сколько было, чтобы не прыгало) -->
      <listSkeleton
        v-if="pending && (paging || !users.data?.length)"
        :columns="userTableHeads.length"
        :rows="paging ? skeletonRows : 8"
      />

      <!-- Фильтр / сортировка: список на месте, по нему перелив -->
      <div
        v-else-if="users.data?.length > 0"
        :class="{ 'list-refreshing': pending }"
        :aria-busy="pending || undefined"
      >
        <span v-if="pending" class="sr-only">{{ $t("loading") }}</span>

        <!-- Компьютер: таблица -->
        <div class="table table-striped table-sm selectable max-md:!hidden">
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
                  <div class="flex gap-x-2 items-center font-medium">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-7 h-7 text-[10px]'"
                      :user="user"
                    />
                    {{ user.last_name }} {{ user.first_name }}
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td class="whitespace-nowrap">{{ user.phone }}</td>
                <td class="whitespace-nowrap">{{ formatDate(user.created_at) }}</td>
                <td>
                  <span class="status-pill" :class="user.status_color">
                    {{ user.status_type_name }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Телефон: карточки вместо широкой таблицы -->
        <ul class="entity-list md:hidden">
          <li v-for="user in users.data" :key="user.user_id">
            <button
              type="button"
              class="entity-card"
              @click="getUser(user.user_id)"
            >
              <userAvatar
                :padding="0.5"
                :className="'w-10 h-10 text-sm'"
                :user="user"
              />
              <span class="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                <span class="font-semibold truncate"
                  >{{ user.last_name }} {{ user.first_name }}</span
                >
                <span class="text-xs text-inactive truncate">{{
                  user.email
                }}</span>
                <span v-if="user.phone" class="text-xs text-inactive">{{
                  user.phone
                }}</span>
                <!-- Статус под контактами: длинный текст не сжимает имя -->
                <span class="status-pill wrap mt-1" :class="user.status_color">
                  {{ user.status_type_name }}
                </span>
              </span>
              <i class="pi pi-chevron-right text-inactive text-xs" aria-hidden="true"></i>
            </button>
          </li>
        </ul>
      </div>

      <emptyState
        v-else
        :text="$t('nothing_was_found_for_your_query')"
        icon="bi bi-search"
      />

      <!-- Вне блока списка: при переходе по страницам остаётся на месте
           под скелетоном; пока идёт загрузка — неактивна -->
      <div
        v-if="users.data?.length"
        class="btn-wrap mt-4"
        :class="{ 'pointer-events-none opacity-60': pending }"
      >
        <pagination
          :items="users"
          :setItems="getUsers"
          :onSelect="(count) => (perPage = count)"
        />
      </div>
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
      <subscription
        v-if="
          schoolStore.schoolData && schoolStore.schoolData.subscription_expired
        "
      />
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
                autocomplete="off"
                name="email"
                type="email"
                inputmode="email"
                autocapitalize="none"
                spellcheck="false"
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
                autocomplete="off"
                name="phone"
                type="tel"
                inputmode="tel"
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

        <button
          class="btn btn-primary mt-4"
          :class="{ loading: pendingInvite }"
          :disabled="pendingInvite"
          type="submit"
        >
          <i class="pi pi-check" aria-hidden="true"></i>
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
      <div class="flex flex-col gap-4">
        <!-- Шапка: аватар, имя, роли -->
        <div class="flex items-center gap-4">
          <userAvatar :user="user" :className="'w-16 h-16 text-2xl'" />
          <div class="min-w-0 flex flex-col gap-1.5">
            <h4 class="mb-0 leading-tight break-words">
              {{ user.last_name }} {{ user.first_name }}
            </h4>
            <div
              v-if="user.available_roles?.length"
              class="flex flex-wrap gap-1.5"
            >
              <span
                v-for="role in user.available_roles"
                :key="role.role_type_id"
                class="role-chip"
              >
                {{ role.user_role_type_name }}
              </span>
            </div>
          </div>
        </div>

        <!-- Контакты — кликабельные -->
        <dl class="info-list">
          <div v-if="user.email">
            <dt><i class="pi pi-at"></i> {{ $t("form.email") }}</dt>
            <dd class="break-all">
              <a :href="'mailto:' + user.email">{{ user.email }}</a>
            </dd>
          </div>
          <div v-if="user.phone">
            <dt><i class="pi pi-mobile"></i> {{ $t("form.phone") }}</dt>
            <dd>
              <a :href="'tel:' + String(user.phone).replace(/[^+\d]/g, '')">{{
                user.phone
              }}</a>
            </dd>
          </div>
        </dl>

        <div class="btn-wrap">
          <button type="button" @click="getGrade" class="btn btn-primary">
            <i class="pi pi-chart-bar" aria-hidden="true"></i>
            {{ $t("pages.education-program.get_grade") }}
          </button>
          <roleProvider :roles="[1, 2, 3]">
            <button type="button" @click="getEditUser" class="btn btn-light">
              <i class="pi pi-user-edit" aria-hidden="true"></i>
              {{ $t("edit") }}
            </button>
          </roleProvider>
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
                autocomplete="off"
                name="email"
                v-model="user.email"
                type="email"
                inputmode="email"
                autocapitalize="none"
                spellcheck="false"
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
                autocomplete="off"
                name="phone"
                type="tel"
                inputmode="tel"
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

        <button
          class="btn btn-primary mt-4"
          :class="{ loading: pendingEdit }"
          :disabled="pendingEdit"
          type="submit"
        >
          <i class="pi pi-check" aria-hidden="true"></i>
          {{ $t("save") }}
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
                <button type="button"
                  @click="goToCourses()"
                  :class="!activeCourse ? 'inactive' : ''"
                >
                  <span>
                    {{ $t("pages.courses.title") }}
                  </span>
                </button>
              </li>
              <li v-if="activeCourse">
                <button type="button"
                  @click="goToLevels()"
                  :class="!activeLevel ? 'inactive' : ''"
                >
                  <span>{{ activeCourse.course_name }}</span>
                </button>
              </li>
              <li v-if="activeLevel">
                <button type="button"
                  @click="goToSections()"
                  :class="!activeSection ? 'inactive' : ''"
                >
                  <span>{{ activeLevel.level_name }}</span>
                </button>
              </li>
              <li v-if="activeSection">
                <button type="button"
                  @click="goToLessons()"
                  :class="!activeLesson ? 'inactive' : ''"
                >
                  <span>{{ activeSection.section_name }}</span>
                </button>
              </li>
              <li v-if="activeLesson">
                <button type="button"
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
                  <button type="button" class="btn btn-light" @click="goToTasks()">
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
                  <button type="button" class="btn btn-light" @click="goToLessons()">
                    <i class="pi pi-arrow-left"></i>
                    {{ $t("back") }}
                  </button>
                </div>

                <!-- Итог по уроку -->
                <div class="col-span-12">
                  <div class="grade-summary">
                    <circleProgressBar
                      :progress="activeLesson.completed_tasks_percent"
                      :className="'w-14 h-14 shrink-0'"
                      :textClass="'text-sm'"
                    />
                    <div class="flex flex-col gap-0.5 min-w-0">
                      <b class="leading-snug">{{ activeLesson.lesson_name }}</b>
                      <span class="text-sm text-inactive">{{
                        $t("pages.tasks.completed_of", {
                          done: activeLesson.completed_tasks_count,
                          total: activeLesson.tasks.length,
                        })
                      }}</span>
                    </div>
                  </div>
                </div>

                <div class="col-span-12">
                  <ul v-if="activeLesson.tasks.length" class="task-list">
                    <li
                      v-for="taskItem in activeLesson.tasks"
                      :key="taskItem.task_id"
                    >
                      <div
                        class="task-row"
                        :class="{ done: gradeTaskState(taskItem) === 'done' }"
                      >
                        <button
                          type="button"
                          class="task-row-main"
                          :disabled="gradeTaskState(taskItem) !== 'done'"
                          :title="
                            gradeTaskState(taskItem) === 'done'
                              ? $t('pages.tasks.show_task_result')
                              : ''
                          "
                          @click="selectTask(taskItem)"
                        >
                          <span class="task-icon" aria-hidden="true">
                            <i :class="taskItem.icon"></i>
                          </span>

                          <span class="flex-1 min-w-0 flex flex-col gap-1 text-left">
                            <span class="font-semibold leading-snug">{{
                              taskItem.task_slug
                            }}</span>
                            <span class="text-xs text-inactive">{{
                              taskItem.task_type_name
                            }}</span>
                            <span class="lesson-badges">
                              <span
                                v-if="gradeTaskState(taskItem) === 'done'"
                                class="lesson-badge success"
                              >
                                <i class="pi pi-check" aria-hidden="true"></i>
                                {{ $t("pages.tasks.status.completed") }}
                              </span>
                              <span
                                v-else-if="gradeTaskState(taskItem) === 'review'"
                                class="lesson-badge warning"
                              >
                                <i class="pi pi-clock" aria-hidden="true"></i>
                                {{ $t("pages.tasks.status.reviewing") }}
                              </span>
                              <span v-else class="lesson-badge text-inactive">
                                {{ $t("pages.tasks.status.not_completed") }}
                              </span>
                            </span>
                          </span>

                          <circleProgressBar
                            v-if="gradeTaskState(taskItem) === 'done'"
                            :progress="taskItem.task_result.percentage"
                            :className="'w-11 h-11 shrink-0'"
                            :textClass="'text-[10px]'"
                          />
                        </button>
                      </div>
                    </li>
                  </ul>

                  <emptyState
                    v-else
                    :text="$t('pages.tasks.there_are_no_tasks')"
                    icon="bi bi-inbox"
                  />
                </div>
              </template>
              <template v-else-if="activeSection">
                <div class="col-span-12">
                  <button type="button" class="btn btn-light" @click="goToSections()">
                    <i class="pi pi-arrow-left"></i>
                    {{ $t("back") }}
                  </button>
                </div>

                <!-- Итог по разделу -->
                <div class="col-span-12">
                  <div class="grade-summary">
                    <circleProgressBar
                      :progress="activeSection.completed_percent"
                      :className="'w-14 h-14 shrink-0'"
                      :textClass="'text-sm'"
                    />
                    <div class="flex flex-col gap-0.5 min-w-0">
                      <b class="leading-snug">{{ activeSection.section_name }}</b>
                      <span class="text-sm text-inactive">{{
                        $t("pages.tasks.average_result")
                      }}</span>
                    </div>
                  </div>
                </div>

                <div class="col-span-12">
                  <ol v-if="activeSection.lessons.length" class="lesson-path">
                    <li
                      v-for="(lesson, lessonIndex) in activeSection.lessons"
                      :key="lessonIndex"
                    >
                      <button
                        type="button"
                        class="lesson-row"
                        :class="{ done: lesson.completed_tasks_percent >= 100 }"
                        @click="selectLesson(lesson)"
                      >
                        <span class="unit-num" aria-hidden="true">
                          <i
                            v-if="lesson.completed_tasks_percent >= 100"
                            class="pi pi-check"
                          ></i>
                          <template v-else>{{ lessonIndex + 1 }}</template>
                        </span>

                        <div class="flex-1 min-w-0 flex flex-col gap-1 text-left">
                          <span class="font-semibold leading-snug">{{
                            lesson.lesson_name
                          }}</span>
                          <span class="lesson-meta !gap-x-3">
                            <span v-if="lesson.lesson_type_name">
                              <i class="pi pi-tag" aria-hidden="true"></i>
                              {{ lesson.lesson_type_name }}
                            </span>
                            <span>
                              <i class="pi pi-pencil" aria-hidden="true"></i>
                              {{ $t("pages.tasks.tasks_count") }}:
                              {{ lesson.tasks_count }}
                            </span>
                          </span>
                        </div>

                        <circleProgressBar
                          v-if="lesson.completed_tasks_percent > 0"
                          :progress="lesson.completed_tasks_percent"
                        />
                        <i
                          v-else
                          class="pi pi-chevron-right text-inactive"
                          aria-hidden="true"
                        ></i>
                      </button>
                    </li>
                  </ol>

                  <emptyState
                    v-else
                    :text="$t('pages.lessons.there_is_no_lessons_alt')"
                    icon="bi bi-inbox"
                  />
                </div>
              </template>
              <template v-else-if="activeLevel">
                <div class="col-span-12">
                  <button type="button" class="btn btn-light" @click="goToLevels()">
                    <i class="pi pi-arrow-left"></i>
                    {{ $t("back") }}
                  </button>
                </div>

                <!-- Итог по уровню -->
                <div class="col-span-12">
                  <div class="grade-summary">
                    <circleProgressBar
                      :progress="activeLevel.completed_percent"
                      :className="'w-14 h-14 shrink-0'"
                      :textClass="'text-sm'"
                    />
                    <div class="flex flex-col gap-0.5 min-w-0">
                      <b class="leading-snug">{{ activeLevel.level_name }}</b>
                      <span class="text-sm text-inactive">{{
                        $t("pages.tasks.average_result")
                      }}</span>
                    </div>
                  </div>
                </div>

                <div class="col-span-12">
                  <div
                    v-if="activeLevel.sections.length"
                    class="grid lg:grid-cols-2 gap-3"
                  >
                    <button
                      v-for="(section, sectionIndex) in activeLevel.sections"
                      :key="sectionIndex"
                      type="button"
                      class="unit-card text-left"
                      :class="{
                        done: section.completed_percent >= 100,
                        empty: !section.lessons.length,
                      }"
                      @click="selectSection(section)"
                    >
                      <span class="unit-num" aria-hidden="true">
                        <i
                          v-if="section.completed_percent >= 100"
                          class="pi pi-check"
                        ></i>
                        <template v-else>{{ sectionIndex + 1 }}</template>
                      </span>

                      <div class="flex-1 min-w-0 flex flex-col gap-1.5">
                        <h5 class="mb-0 leading-snug">
                          {{ section.section_name }}
                        </h5>
                        <span class="text-sm text-inactive">
                          <i class="pi pi-book text-xs" aria-hidden="true"></i>
                          {{ $t("pages.lessons.lessons_count") }}:
                          <b class="text-active">{{ section.lessons.length }}</b>
                        </span>
                        <div
                          v-if="
                            section.completed_percent > 0 &&
                            section.completed_percent < 100
                          "
                          class="unit-progress"
                        >
                          <div
                            :style="{ width: section.completed_percent + '%' }"
                          ></div>
                        </div>
                      </div>

                      <span
                        v-if="section.completed_percent > 0"
                        class="unit-percent"
                        :class="{
                          'text-success': section.completed_percent >= 100,
                        }"
                        >{{ Math.round(section.completed_percent) }}%</span
                      >
                      <i
                        v-else
                        class="pi pi-chevron-right text-inactive"
                        aria-hidden="true"
                      ></i>
                    </button>
                  </div>

                  <emptyState
                    v-else
                    :text="$t('pages.courses.not_sections')"
                    icon="bi bi-inbox"
                  />
                </div>
              </template>
              <template v-else-if="activeCourse">
                <div class="col-span-12">
                  <button type="button" class="btn btn-light" @click="goToCourses()">
                    <i class="pi pi-arrow-left"></i>
                    {{ $t("back") }}
                  </button>
                </div>
                <div
                  v-for="(level, levelIndex) in activeCourse.levels"
                  :key="levelIndex"
                  class="col-span-12 md:col-span-4"
                >
                  <button type="button"
                    class="block w-full text-left"
                    @click="
                      level.available_status.is_available === true
                        ? selectLevel(level)
                        : null
                    "
                    :class="
                      level.available_status.is_available === true
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed'
                    "
                  >
                    <levelCard
                      :level="level"
                      :showProgressBar="true"
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
                  <button type="button" class="block w-full text-left" @click="selectCourse(course)">
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
import listSkeleton from "../../ui/listSkeleton.vue";
import emptyState from "~/components/ui/emptyState.vue";
import userAvatar from "../../ui/userAvatar.vue";
import stickyBox from "../../ui/stickyBox.vue";
import pagination from "../../ui/pagination.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import roleProvider from "../../ui/roleProvider.vue";
import multipleSelect from "../../ui/multipleSelect.vue";
import sortTableHead from "../../ui/sortTableHead.vue";
import courseCard from "../../courses/courseCard.vue";
import levelCard from "../../levels/levelCard.vue";
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

const gradeModalDefaultClass = "modal-2xl";
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

// Переход по страницам: пагинация передаёт url страницы (фильтр, сортировка и
// смена «по N на странице» — без url). В этом случае показываем скелетон.
const paging = ref(false);
const skeletonRows = ref(8);
const listTopRef = ref(null);

const getUsers = async (url) => {
  pending.value = true;
  paging.value = Boolean(url);

  if (paging.value) {
    skeletonRows.value = users.value.data?.length || 8;
    // Пагинация внизу — поднимаем к началу списка, если его верх не виден
    const top = listTopRef.value?.getBoundingClientRect().top;
    if (top !== undefined && top < 0) {
      listTopRef.value.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

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
      paging.value = false;
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

// «24.11.2026, 18:05» вместо полного toLocaleString с секундами
const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

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
  if (pendingInvite.value) return;
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
  if (pendingEdit.value) return;
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
  if (inviteFormRef.value) {
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
    gradeModalClass.value = "modal-4xl";
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

const selectLesson = async (lesson) => {
  pendingGrade.value = true;

  await $axiosPlugin
    .post("courses/get_lesson_grade", {
      lesson_id: lesson.lesson_id,
      user_id: user.value.user_id,
    })
    .then((response) => {
      gradeModalClass.value = "modal-4xl";
      activeLesson.value = response.data;
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

const goToLessons = () => {
  gradeModalClass.value = gradeModalDefaultClass;
  activeLesson.value = null;
  activeTask.value = null;
};

// Состояние задания в успеваемости ученика: done | review | not_completed.
// review — ответы отправлены, но часть ждёт проверки ментора.
const gradeTaskState = (taskItem) => {
  const result = taskItem.task_result;

  if (result?.completed === true) return "done";
  if (result?.answers) return "review";

  return "not_completed";
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
