<template>
  <div class="custom-grid">
    <!-- Панель: фильтр слева, главное действие справа -->
    <div class="col-span-12">
      <div class="list-toolbar">
        <button
          type="button"
          @click="showHideGroupSearchFilter"
          class="btn"
          :class="searchFilter ? 'btn-outline-primary' : 'btn-light'"
          :aria-pressed="searchFilter"
          :title="searchFilter ? $t('hide_search_filter') : $t('show_search_filter')"
        >
          <i class="pi pi-filter" aria-hidden="true"></i>
          {{ $t("filter") }}
          <span v-if="activeFilters > 0" class="chip-count">{{ activeFilters }}</span>
        </button>
        <span v-if="groups.total" class="text-sm text-inactive">
          {{ $t("found") }}: <b class="text-active">{{ groups.total }}</b>
        </span>

        <roleProvider :roles="[1, 2, 3]">
          <button
            type="button"
            @click="openCreateModal()"
            class="btn btn-primary ml-auto"
          >
            <i class="pi pi-plus" aria-hidden="true"></i>
            {{ $t("pages.groups.create_group") }}
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
        v-if="pending && (paging || !groups.data?.length)"
        :columns="groupsTableHeads.length"
        :avatar="false"
        :rows="paging ? skeletonRows : 8"
      />

      <!-- Фильтр / сортировка: список на месте, по нему перелив -->
      <div
        v-else-if="groups.data?.length > 0"
        :class="{ 'list-refreshing': pending }"
        :aria-busy="pending || undefined"
      >
        <span v-if="pending" class="sr-only">{{ $t("loading") }}</span>
        <div class="table table-striped table-sm selectable max-md:!hidden">
          <table>
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
                :class="{ 'row-highlight': highlightGroupId === group.group_id }"
                @click="getGroup(group.group_id)"
              >
                <td class="font-medium">{{ group.group_name }}</td>
                <td>
                  <span class="flex flex-col min-w-0">
                    <span>{{ group.course_name }}</span>
                    <span class="text-xs text-inactive">{{ group.level_name }}</span>
                  </span>
                </td>
                <td>
                  <div class="flex gap-x-2 items-center whitespace-nowrap">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-6 h-6 text-[9px]'"
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
                <td class="whitespace-nowrap">
                  <span class="flex flex-col">
                    <span>{{ formatDate(group.started_at) }}</span>
                    <span class="text-xs text-inactive"
                      >{{ $t("created_at") }}: {{ formatDate(group.created_at) }}</span
                    >
                  </span>
                </td>
                <td>
                  <span class="status-pill" :class="group.status_color">
                    {{ group.status_type_name }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Телефон: карточки вместо широкой таблицы -->
        <ul class="entity-list md:hidden">
          <li v-for="group in groups.data" :key="group.group_id">
            <button
              type="button"
              class="entity-card !items-start"
              :class="{ 'row-highlight': highlightGroupId === group.group_id }"
              @click="getGroup(group.group_id)"
            >
              <span class="task-icon !w-10 !h-10 !text-lg" aria-hidden="true">
                <i class="pi pi-users"></i>
              </span>
              <span class="flex-1 min-w-0 flex flex-col gap-1 text-left">
                <span class="font-semibold leading-snug">{{
                  group.group_name
                }}</span>
                <span class="text-xs text-inactive"
                  >{{ group.course_name }} · {{ group.level_name }}</span
                >
                <span class="flex items-center gap-1.5 text-xs">
                  <userAvatar
                    :padding="0.5"
                    :className="'w-5 h-5 text-[8px]'"
                    :user="{
                      last_name: group.mentor_last_name,
                      first_name: group.mentor_first_name,
                      avatar: group.mentor_avatar,
                    }"
                  />
                  <span class="truncate"
                    >{{ group.mentor_last_name }}
                    {{ group.mentor_first_name }}</span
                  >
                  <span class="text-inactive whitespace-nowrap"
                    >· <i class="pi pi-user text-[10px]"></i>
                    {{ group.members_count }}</span
                  >
                </span>
                <span class="status-pill wrap mt-0.5" :class="group.status_color">
                  {{ group.status_type_name }}
                </span>
              </span>
              <i class="pi pi-chevron-right text-inactive text-xs self-center" aria-hidden="true"></i>
            </button>
          </li>
        </ul>
      </div>
      <emptyState
        v-else-if="activeFilters > 0"
        :text="$t('nothing_was_found_for_your_query')"
        icon="bi bi-search"
      />
      <!-- Групп нет совсем — сразу предлагаем создать -->
      <emptyState v-else :text="$t('pages.groups.no_groups')" icon="bi bi-people">
        <roleProvider :roles="[1, 2, 3]">
          <button type="button" class="btn btn-primary" @click="openCreateModal()">
            <i class="pi pi-plus" aria-hidden="true"></i>
            {{ $t("pages.groups.create_group") }}
          </button>
        </roleProvider>
      </emptyState>

      <!-- Вне блока списка: при переходе по страницам остаётся на месте
           под скелетоном; пока идёт загрузка — неактивна -->
      <div
        v-if="groups.data?.length"
        class="btn-wrap mt-4"
        :class="{ 'pointer-events-none opacity-60': pending }"
      >
        <pagination
          :items="groups"
          :setItems="getGroups"
          :onSelect="(count) => (perPage = count)"
        />
      </div>
    </div>
  </div>

  <modal
    :show="groupModalIsVisible"
    :onClose="() => closeModal()"
    :className="'modal-2xl'"
    :showLoader="pendingGroup"
    :showPendingText="true"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <h4>{{ currentGroup?.group_name }}</h4>
    </template>
    <template v-slot:body_content>
      <div v-if="currentGroup" class="flex flex-col gap-4">
        <p
          v-if="currentGroup.group_description"
          class="mb-0 text-inactive whitespace-pre-line"
        >
          {{ currentGroup.group_description }}
        </p>

        <!-- Что дальше по группе: ближайший урок и сколько уже прошло -->
        <div v-if="groupSchedule.total" class="group-progress">
          <div class="flex-1 min-w-0 flex flex-col gap-1">
            <p class="mb-0 text-sm">
              <i class="pi pi-calendar text-corp text-xs" aria-hidden="true"></i>
              <template v-if="groupSchedule.next">
                {{ $t("pages.groups.next_lesson") }}:
                <b>{{ groupSchedule.next.start_time_formatted }}</b>
                <span class="text-inactive"> · {{ groupSchedule.next.lesson_name }}</span>
              </template>
              <template v-else>{{ $t("pages.groups.all_lessons_gone") }}</template>
            </p>
            <div class="unit-progress !mt-1">
              <div :style="{ width: groupSchedule.percent + '%' }"></div>
            </div>
            <p class="mb-0 text-xs text-inactive">
              {{
                $t("pages.groups.lessons_gone_of", {
                  done: groupSchedule.gone,
                  total: groupSchedule.total,
                })
              }}
            </p>
          </div>
        </div>

        <dl class="info-list">
          <div>
            <dt>
              <i class="pi pi-book"></i> {{ $t("pages.groups.group_category") }}
            </dt>
            <dd>{{ currentGroup.level.level_name }}</dd>
          </div>
          <div v-if="currentGroup.mentor">
            <dt><i class="pi pi-user"></i> {{ $t("mentor") }}</dt>
            <dd><userTag :user="currentGroup.mentor" class="w-fit" /></dd>
          </div>
          <div v-if="currentGroup.operator">
            <dt><i class="pi pi-headphones"></i> {{ $t("operator") }}</dt>
            <dd><userTag :user="currentGroup.operator" class="w-fit" /></dd>
          </div>
          <div v-if="currentGroup.current_price">
            <dt><i class="pi pi-wallet"></i> {{ $t("pages.lessons.price") }}</dt>
            <dd>
              {{ currentGroup.current_price.toLocaleString("ru-RU") }}
              {{ $contacts.bank.currency.symbol }}
            </dd>
          </div>
          <div>
            <dt>
              <i class="pi pi-credit-card"></i>
              {{ $t("pages.payment.payment_form") }}
            </dt>
            <dd>
              {{
                currentGroup.is_legal === 1
                  ? $t("pages.payment.forms.legal_entity")
                  : $t("pages.payment.forms.natural_person")
              }}
            </dd>
          </div>
          <div>
            <dt>
              <i class="pi pi-gift"></i>
              {{ $t("pages.lessons.first_lesson_free") }}
            </dt>
            <dd>
              {{ currentGroup.first_lesson_free === 1 ? $t("yes") : $t("no") }}
            </dd>
          </div>
        </dl>

        <!-- Участники: клик — успеваемость ученика -->
        <div v-if="currentGroup.group_members" class="flex flex-col gap-2">
          <p class="mb-0 font-semibold flex items-center gap-2">
            {{ $t("pages.groups.members") }}
            <span class="db-count">{{ currentGroup.group_members.length }}</span>
          </p>
          <div class="btn-wrap">
            <userTag
              v-for="member in visibleMembers"
              :key="member.user_id"
              :user="member"
              :selectable="true"
              :title="$t('pages.education-program.get_grade')"
              @click="getGrade(member)"
            />
            <button
              v-if="currentGroup.group_members.length > MEMBERS_PREVIEW"
              type="button"
              class="btn btn-sm btn-light"
              :aria-expanded="showAllMembers"
              @click="showAllMembers = !showAllMembers"
            >
              {{
                showAllMembers
                  ? $t("pages.schedule.members_collapse")
                  : $t("pages.schedule.members_more", {
                      count: currentGroup.group_members.length - MEMBERS_PREVIEW,
                    })
              }}
            </button>
          </div>
          <p class="mb-0 text-xs text-inactive">
            <i class="pi pi-info-circle" aria-hidden="true"></i>
            {{ $t("pages.groups.member_click_hint") }}
          </p>
        </div>

        <div class="btn-wrap pt-2 border-t border-dashed" style="border-top-color: var(--surface-border)">
          <button type="button" @click="openScheduleModal" class="btn btn-light">
            <i class="pi pi-calendar-clock" aria-hidden="true"></i>
            {{ $t("pages.schedule.show_schedule") }}
          </button>

          <roleProvider :roles="[1, 2, 3]">
            <button type="button" @click="openPaymentsModal" class="btn btn-light">
              <i class="pi pi-credit-card" aria-hidden="true"></i>
              {{ $t("pages.payment.title") }}
            </button>

            <button type="button" @click="getEditGroup" class="btn btn-light">
              <i class="pi pi-pencil" aria-hidden="true"></i>
              {{ $t("edit") }}
            </button>
          </roleProvider>
        </div>
      </div>
    </template>
  </modal>

  <modal
    :show="createModalIsVisible"
    :onClose="() => closeModal('create')"
    :className="wizardModalClass"
    :showLoader="pendingCreate"
    :showPendingText="true"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.groups.create_group_title") }}</h4>
    </template>
    <template v-slot:body_content>
      <subscription
        v-if="
          schoolStore.schoolData && schoolStore.schoolData.subscription_expired
        "
      />
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
    :className="wizardModalClass"
    :showLoader="pendingEdit"
    :showPendingText="true"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.groups.edit_group_title") }}</h4>
    </template>
    <template v-slot:body_content>
      <steps :currentStep="currentStep" :steps="editGroupSteps">
        <form @submit.prevent="editGroupSubmit" class="mt-2" ref="editFormRef">
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

  <modal
    :show="scheduleModalIsVisible"
    :onClose="() => closeModal('schedule')"
    :className="'modal-6xl'"
    :showLoader="false"
    :showPendingText="true"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>
        {{ currentGroup ? currentGroup.group_name : "" }} -
        {{ $t("pages.schedule.title") }}
      </h4>
    </template>
    <template v-slot:body_content>
      <scheduleGrid
        v-if="currentGroup"
        :schedule="currentGroup.schedule"
        :pendingSchedule="false"
        :openEventModal="null"
      />
    </template>
  </modal>

  <modal
    :show="paymentsModalIsVisible"
    :onClose="() => closeModal('payments')"
    :className="'modal-6xl'"
    :showLoader="pendingPaymentStatus"
    :showPendingText="true"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>
        {{ currentGroup ? currentGroup.group_name : "" }} -
        {{ $t("pages.payment.title") }}
      </h4>
    </template>
    <template v-if="currentGroup" v-slot:body_content>
      <div class="custom-grid">
        <!-- Итог по группе: сколько уроков оплачено и сколько денег не хватает -->
        <div v-if="paymentsSummary.total" class="col-span-12">
          <div class="payments-summary">
            <div>
              <span class="text-xs text-inactive">{{ $t("pages.groups.summary_paid") }}</span>
              <b class="text-success">{{ paymentsSummary.paid }} / {{ paymentsSummary.total }}</b>
            </div>
            <div>
              <span class="text-xs text-inactive">{{ $t("pages.groups.summary_unpaid") }}</span>
              <b :class="paymentsSummary.unpaid ? 'text-danger' : ''">{{ paymentsSummary.unpaid }}</b>
            </div>
            <div v-if="paymentsSummary.debt">
              <span class="text-xs text-inactive">{{ $t("pages.groups.summary_debt") }}</span>
              <b>≈ {{ formatMoney(paymentsSummary.debt) }}</b>
            </div>
          </div>
        </div>

        <tabs
          v-if="upcomingLessons.length || goneLessons.length"
          :tabs="tabs_data"
          :activeTabIndex="1"
        />
        <!-- Сохранение прямо здесь; вопрос «сохранить?» — только при
             закрытии окна с несохранёнными изменениями -->
        <div class="col-span-12">
          <div class="btn-wrap justify-end items-center">
            <span v-if="newPayments.length" class="text-sm text-inactive mr-auto">
              {{ $t("pages.groups.payments_changed", { count: newPayments.length }) }}
            </span>
            <button
              type="button"
              class="btn btn-primary"
              :class="{ loading: pendingPaymentStatus }"
              :disabled="!newPayments.length || pendingPaymentStatus"
              @click="savePayments()"
            >
              <i class="pi pi-check" aria-hidden="true"></i>
              {{
                newPayments.length
                  ? $t("pages.groups.save_payments", { count: newPayments.length })
                  : $t("save")
              }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </modal>

  <modal
    :show="savePaymentsModalIsVisible"
    :onClose="() => closeModal('return_to_payments')"
    :className="'modal-xl'"
    :showLoader="pendingPaymentStatus"
    :showPendingText="true"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("save_changes.title") }}</h4>
    </template>
    <template v-if="currentGroup" v-slot:body_content>
      <div class="custom-grid">
        <div class="col-span-12">
          <p>
            {{ $t("save_changes.confirm") }}
          </p>
          <div class="btn-wrap justify-end">
            <button type="button" class="btn btn-outline-primary" @click="savePayments()">
              <i class="pi pi-save"></i>
              {{ $t("save_changes.save") }}
            </button>
            <button type="button"
              class="btn btn-light"
              @click="closeModal('unsave_payments')"
            >
              <i class="pi pi-ban"></i>
              {{ $t("save_changes.unsave") }}
            </button>
            <button type="button"
              class="btn btn-light"
              @click="closeModal('return_to_payments')"
            >
              <i class="pi pi-refresh"></i>
              {{ $t("save_changes.return") }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </modal>

  <modal
    :show="gradeModalIsVisible"
    :onClose="() => closeModal('grade')"
    :className="gradeModalClass"
    :showLoader="pendingGrade"
    :showPendingText="true"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.education-program.grade") }}</h4>
    </template>
    <template v-if="currentGroup && currentMember" v-slot:body_content>
      <h2>{{ currentMember.last_name }} {{ currentMember.first_name }}</h2>

      <!-- Та же разметка, что во вкладке «Пользователи», но сразу с уровня группы -->
      <learnerGrade
        v-if="userGrade"
        mode="level"
        :level="{ ...userGrade, level_name: currentGroup.level.level_name }"
        :userId="currentMember.user_id"
        @size="(size) => (gradeModalClass = size)"
        @pending="(value) => (pendingGrade = value)"
      />
    </template>
  </modal>
</template>
<script setup>
import { useRouter } from "nuxt/app";
import modal from "../../ui/modal.vue";
import subscription from "../../ui/subscription.vue";
import scheduleGrid from "../../schedule/scheduleGrid.vue";
import listSkeleton from "../../ui/listSkeleton.vue";
import emptyState from "~/components/ui/emptyState.vue";
import userAvatar from "../../ui/userAvatar.vue";
import userTag from "../../ui/userTag.vue";
import stickyBox from "../../ui/stickyBox.vue";
import pagination from "../../ui/pagination.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import steps from "../../ui/steps.vue";
import groupDetailsStep from "./components/groupDetailsStep.vue";
import groupScheduleStep from "./components/groupScheduleStep.vue";
import thirdStep from "./components/thirdStep.vue";
import fourthStep from "./components/fourthStep.vue";
import roleProvider from "../../ui/roleProvider.vue";
import multipleSelect from "../../ui/multipleSelect.vue";
import sortTableHead from "../../ui/sortTableHead.vue";
import tabs from "../../ui/tabs.vue";
import paymentsGrid from "./components/paymentsGrid.vue";
import learnerGrade from "../learnerGrade.vue";
import { useNotify } from "~/composables/useNotify";

const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const schoolStore = useSchoolStore();
const { t, locale } = useI18n();
const notify = useNotify();
const pending = ref(true);
const pendingGroup = ref(false);
const pendingCreate = ref(false);
const pendingEdit = ref(false);
const pendingPaymentStatus = ref(false);
const pendingGrade = ref(false);
const newPayments = ref([]);
const groupData = ref([]);
const userGrade = ref(null);
const searchFormRef = ref(null);
const createFormRef = ref(null);
const editFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(10);
const groups = ref([]);
const currentGroup = ref(null);
const groupMembers = ref([]);
const currentMember = ref(null);
const attributes = ref([]);

const upcomingLessons = ref([]);
const goneLessons = ref([]);

const errors = ref([]);

const currentStep = ref(1);

const createModalIsVisible = ref(false);
const groupModalIsVisible = ref(false);
const editModalIsVisible = ref(false);
const scheduleModalIsVisible = ref(false);
const paymentsModalIsVisible = ref(false);
const savePaymentsModalIsVisible = ref(false);

const gradeModalIsVisible = ref(false);
const gradeModalDefaultClass = "modal-lg";
const gradeModalClass = ref(gradeModalDefaultClass);

// Новые группы сверху
const sortKey = ref("groups.created_at");
const sortDirection = ref("desc");

// Только что созданная / изменённая группа — подсвечиваем в списке
const highlightGroupId = ref(null);
let highlightTimer = null;
const highlightGroup = (id) => {
  highlightGroupId.value = id || null;
  clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => (highlightGroupId.value = null), 4000);
};

// Сколько условий фильтра заполнено — число на кнопке «Фильтр»
const activeFilters = ref(0);
const countFilters = () => {
  const names = new Set();
  if (searchFormRef.value) {
    for (const [name, value] of new FormData(searchFormRef.value).entries()) {
      if (typeof value === "string" && value.trim() !== "") names.add(name);
    }
  }
  activeFilters.value = names.size;
};

const intlLocale = computed(() => String(locale.value || "ru").split("-")[0]);
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(intlLocale.value) : "";

// Окно группы: первые участники, остальные по кнопке
const MEMBERS_PREVIEW = 10;
const showAllMembers = ref(false);
const visibleMembers = computed(() => {
  const members = currentGroup.value?.group_members || [];
  return showAllMembers.value ? members : members.slice(0, MEMBERS_PREVIEW);
});

// Итог оплат по всем урокам группы (переключатели в ведомости меняют те же
// объекты, поэтому итог обновляется сразу)
const paymentsSummary = computed(() => {
  let total = 0;
  let paid = 0;
  for (const lesson of currentGroup.value?.schedule || []) {
    for (const m of lesson.members || []) {
      total++;
      if (m.is_bought === true) paid++;
    }
  }
  const unpaid = total - paid;
  const price = Number(currentGroup.value?.current_price) || 0;
  return { total, paid, unpaid, debt: unpaid * price };
});

const { $contacts } = useNuxtApp();
const formatMoney = (value) =>
  Number(value || 0).toLocaleString(intlLocale.value) +
  " " +
  ($contacts?.bank?.currency?.symbol || "");

// Ближайший урок группы и сколько уроков уже прошло
const groupSchedule = computed(() => {
  const schedule = currentGroup.value?.schedule || [];
  const gone = schedule.filter((l) => l.is_gone === true).length;
  return {
    total: schedule.length,
    gone,
    percent: schedule.length ? Math.round((gone / schedule.length) * 100) : 0,
    next: schedule.find((l) => l.is_gone === false) || null,
  };
});

const daysArray = [
  { id: 1, name: t("weekdays.monday.even"), start_time: "", selected: false },
  { id: 2, name: t("weekdays.tuesday.even"), start_time: "", selected: false },
  {
    id: 3,
    name: t("weekdays.wednesday.even"),
    start_time: "",
    selected: false,
  },
  { id: 4, name: t("weekdays.thursday.even"), start_time: "", selected: false },
  { id: 5, name: t("weekdays.friday.even"), start_time: "", selected: false },
  { id: 6, name: t("weekdays.saturday.even"), start_time: "", selected: false },
  { id: 7, name: t("weekdays.sunday.even"), start_time: "", selected: false },
];

const selectedDays = ref([]);

const groupsTableHeads = [
  { title: t("pages.groups.group_name"), keyName: "groups.group_name", sortType: "alpha" },
  { title: t("pages.courses.course"), keyName: "courses_lang.course_name", sortType: "alpha" },
  { title: t("mentor"), keyName: "mentor.last_name", sortType: "alpha" },
  { title: t("pages.groups.members_count"), keyName: "members_count", sortType: "numeric" },
  { title: t("pages.schedule.start_date"), keyName: "groups.started_at", sortType: "numeric" },
  { title: t("status"), keyName: "types_of_status_lang.status_type_name", sortType: "alpha" },
];

const goToStep = (step) => {
  currentStep.value = step;
};

// Ширина окна мастера по шагу: расписание — узкое (поля в одну колонку,
// справа оставалось пустое место), участники — во всю ширину, остальное — 4xl
const wizardModalClass = computed(() => {
  if (currentStep.value === 2) return "modal-2xl";
  if (currentStep.value === 3) return "";
  return "modal-4xl";
});

const newGroupSteps = [
  {
    title: t("pages.groups.group_description"),
    component: groupDetailsStep,
    props: { errors, attributes },
  },
  {
    title: t("pages.schedule.title"),
    component: groupScheduleStep,
    props: { errors, selectedDays },
  },
  {
    title: t("pages.groups.add_members_to_group"),
    component: thirdStep,
    props: { errors, groupMembers, modalIsVisible: createModalIsVisible },
  },
  {
    title: t("pages.groups.saving_a_group"),
    component: fourthStep,
    props: { errors, groupData, goToStep },
  },
];

const editGroupSteps = [
  {
    title: t("pages.groups.group_description"),
    component: groupDetailsStep,
    props: { errors, attributes, currentGroup },
  },
  {
    title: t("pages.schedule.title"),
    component: groupScheduleStep,
    props: { errors, currentGroup, selectedDays },
  },
  {
    title: t("pages.groups.edit_group_members"),
    component: thirdStep,
    props: { errors, groupMembers, modalIsVisible: editModalIsVisible },
  },
  {
    title: t("pages.groups.saving_a_group"),
    component: fourthStep,
    props: { errors, groupData, goToStep },
  },
];

// Сводка перед сохранением: то, чего нет в ответе сервера, берём из формы
const buildSummary = (formEl) => {
  const form = new FormData(formEl || undefined);
  const courseId = String(form.get("course_id") || "");
  const course = (attributes.value?.courses || []).find(
    (c) => String(c.course_id) === courseId,
  );
  return {
    course_name: course?.course_name || "",
    start_date: form.get("start_date") || "",
    lesson_price: form.get("lesson_price") ?? "",
    is_legal: String(form.get("is_legal") ?? "0"),
    first_lesson_free: form.has("first_lesson_free"),
    all_lessons_is_conference: form.has("all_lessons_is_conference"),
    schedule_option: form.get("schedule_option") || "",
    days: (selectedDays.value || [])
      .filter((d) => d.selected)
      .map((d) => ({ id: d.id, name: d.name, start_time: d.start_time })),
  };
};

const tabs_data = computed(() => [
  {
    name: "gone",
    title: t("pages.lessons.gone_lessons"),
    icon: "pi pi-calendar-times",
    component: paymentsGrid,
    props: {
      schedule: goneLessons,
      newPayments: newPayments,
      changePaymentStatus: changePaymentStatus,
      emptyMessage: t("pages.lessons.no_gone_lessons"),
      editIsAvailable: currentGroup.value.is_legal === 1 ? true : false,
    },
  },
  {
    name: "upcoming",
    title: t("pages.lessons.upcoming_lessons_alt"),
    icon: "pi pi-calendar-clock",
    component: paymentsGrid,
    props: {
      schedule: upcomingLessons,
      newPayments: newPayments,
      changePaymentStatus: changePaymentStatus,
      emptyMessage: t("pages.lessons.no_upcoming_lessons"),
      editIsAvailable: currentGroup.value.is_legal === 1 ? true : false,
    },
  },
]);

// Переход по страницам: пагинация передаёт url страницы (фильтр, сортировка и
// смена «по N на странице» — без url). В этом случае показываем скелетон.
const paging = ref(false);
const skeletonRows = ref(8);
const listTopRef = ref(null);

const getGroups = async (url) => {
  pending.value = true;
  paging.value = Boolean(url);

  if (paging.value) {
    skeletonRows.value = groups.value.data?.length || 8;
    // Пагинация внизу — поднимаем к началу списка, если его верх не виден
    const top = listTopRef.value?.getBoundingClientRect().top;
    if (top !== undefined && top < 0) {
      listTopRef.value.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  countFilters();
  const formData = new FormData(searchFormRef.value || undefined);
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

const getGroup = async (group_id, open = true) => {
  pendingGroup.value = true;
  if (open) {
    groupModalIsVisible.value = true;
    showAllMembers.value = false;
  }
  await $axiosPlugin
    .get("groups/get/" + group_id)
    .then(async (response) => {
      errors.value = [];
      currentGroup.value = response.data;
      groupMembers.value = response.data.group_members;

      // Сначала пустой массив, на следующем кадре — дни группы: шаги
      // мастера заново берут расписание (раньше для этого ждали 300 мс)
      selectedDays.value = [];
      await nextTick();
      selectedDays.value = response.data.days.map((day) => ({
        ...day,
        // Применяем локализацию t() к ключам, полученным с сервера
        name: t(day.name),
      }));

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
  formData.append("selected_days", JSON.stringify(selectedDays.value));
  formData.append("operation_type_id", 3);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("groups/create", formData)
    .then((res) => {
      pendingCreate.value = false;
      if (res.data.step) {
        currentStep.value = res.data.step + 1;
        if (currentStep.value === 4) {
          groupData.value = { ...res.data.data, summary: buildSummary(createFormRef.value) };
        }
      } else {
        closeModal("create");
        notify("success", t("pages.groups.created"));
        getGroups().then(() => highlightGroup(res.data?.group_id));
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
  formData.append("selected_days", JSON.stringify(selectedDays.value));
  formData.append("operation_type_id", 4);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("groups/update/" + currentGroup.value.group_id, formData)
    .then((res) => {
      pendingEdit.value = false;
      if (res.data.step) {
        currentStep.value = res.data.step + 1;
        if (currentStep.value === 4) {
          groupData.value = { ...res.data.data, summary: buildSummary(editFormRef.value) };
        }
      } else {
        const editedId = currentGroup.value.group_id;
        getGroups().then(() => {
          closeModal("edit");
          notify("success", t("pages.groups.saved"));
          highlightGroup(editedId);
        });
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

const openScheduleModal = () => {
  groupModalIsVisible.value = false;
  scheduleModalIsVisible.value = true;
};

const openPaymentsModal = () => {
  groupModalIsVisible.value = false;
  paymentsModalIsVisible.value = true;
  upcomingLessons.value = currentGroup.value.schedule.filter(
    (lesson) => lesson.is_gone === false,
  );
  goneLessons.value = currentGroup.value.schedule.filter(
    (lesson) => lesson.is_gone === true,
  );
  newPayments.value = [];
};

const changePaymentStatus = (userId, lessonId, checked) => {
  const index = newPayments.value.findIndex(
    (p) => p.user_id === userId && p.lesson_id === lessonId,
  );

  if (index === -1) {
    newPayments.value.push({
      user_id: userId,
      lesson_id: lessonId,
      checked: checked,
    });
  } else {
    newPayments.value.splice(index, 1);
  }
};

// Сохранение оплат: из окна оплат (кнопка «Сохранить») или из вопроса при
// закрытии окна с несохранёнными изменениями
const savePayments = async () => {
  if (pendingPaymentStatus.value || !newPayments.value.length) return;
  pendingPaymentStatus.value = true;
  const fromCloseDialog = savePaymentsModalIsVisible.value;

  const formData = new FormData();
  formData.append("payments_count", newPayments.value.length);
  formData.append("payments", JSON.stringify(newPayments.value));
  formData.append("operation_type_id", 31);

  await $axiosPlugin
    .post("groups/save_payments", formData)
    .then(async () => {
      errors.value = [];
      notify("success", t("pages.groups.payments_saved"));
      if (fromCloseDialog) {
        // Окно оплат уже закрыто — возвращаемся к группе
        savePaymentsModalIsVisible.value = false;
        newPayments.value = [];
        await getGroup(currentGroup.value.group_id);
      } else {
        // Остаёмся в окне оплат со свежими данными
        await getGroup(currentGroup.value.group_id, false);
        openPaymentsModal();
      }
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
      pendingPaymentStatus.value = false;
    });
};

const getGrade = async (user) => {
  currentMember.value = user;
  groupModalIsVisible.value = false;
  gradeModalIsVisible.value = true;
  pendingGrade.value = true;
  gradeModalClass.value = gradeModalDefaultClass;

  await $axiosPlugin
    .post("courses/get_level_grade", {
      level_id: currentGroup.value.level_id,
      user_id: currentMember.value.user_id,
    })
    .then((response) => {
      userGrade.value = response.data.level;
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

const openCreateModal = () => {
  // Раньше сюда переходили участники прошлой открытой / созданной группы
  groupMembers.value = [];
  groupData.value = [];
  errors.value = [];
  currentStep.value = 1;
  createModalIsVisible.value = true;
  selectedDays.value = [];
  setTimeout(() => {
    selectedDays.value = structuredClone(daysArray);
  }, 300);
};

const closeModal = (action) => {
  if (action === "create") {
    createModalIsVisible.value = false;
    pendingCreate.value = false;
    if (createFormRef.value) {
      createFormRef.value.reset();
    }
  } else if (action === "edit") {
    editModalIsVisible.value = false;
    pendingEdit.value = false;
    if (editFormRef.value) {
      editFormRef.value.reset();
    }
    getGroup(currentGroup.value.group_id);
  } else if (action === "schedule") {
    scheduleModalIsVisible.value = false;
    groupModalIsVisible.value = true;
  } else if (action === "payments") {
    paymentsModalIsVisible.value = false;
    if (newPayments.value.length > 0) {
      savePaymentsModalIsVisible.value = true;
    } else {
      groupModalIsVisible.value = true;
    }
    upcomingLessons.value = [];
    goneLessons.value = [];
  } else if (action === "return_to_payments") {
    savePaymentsModalIsVisible.value = false;
    paymentsModalIsVisible.value = true;
  } else if (action === "unsave_payments") {
    savePaymentsModalIsVisible.value = false;
    paymentsModalIsVisible.value = false;
    upcomingLessons.value = [];
    goneLessons.value = [];
    getGroup(currentGroup.value.group_id);
  } else if (action === "grade") {
    gradeModalIsVisible.value = false;
    currentMember.value = null;
    pendingGrade.value = false;
    userGrade.value = null;
    // Успеваемость ничего не меняет — группу не перезагружаем
    groupModalIsVisible.value = true;
  } else {
    groupModalIsVisible.value = false;
    groupData.value = [];
    groupMembers.value = [];
  }

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
    (course) => course.course_id === Number(selectedCourseId.value),
  ),
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
