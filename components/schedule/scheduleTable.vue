<template>
  <div
    v-if="props.mode === 'table'"
    class="table table-striped selectable"
    :class="props.miniTable === false ? 'table-sm' : ''"
  >
    <table>
      <thead>
        <tr>
          <th>{{ $t("start_time") }}</th>
          <th>{{ $t("pages.lessons.lesson_name") }}</th>
          <template v-if="!schoolStore.isAiSchoolDomain">
            <roleProvider :roles="[1, 2, 3, 4]">
              <th>{{ $t("pages.lessons.lesson_type") }}</th>
              <th>{{ $t("pages.groups.group") }}</th>
              <th>{{ $t("pages.courses.course") }}</th>
              <th>{{ $t("pages.groups.group_category") }}</th>
            </roleProvider>
          </template>
          <template v-else>
            <th v-if="props.miniTable === false">
              {{ $t("pages.courses.title") }}
            </th>
          </template>
          <th v-if="props.miniTable === false">{{ $t("mentor") }}</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="e in schedule"
          :key="e.uuid"
          @click="openEventModal(e.uuid)"
          :class="e.is_active === true ? 'success' : ''"
        >
          <td>
            <b class="text-nowrap">{{
              e.is_active === true
                ? $t("already_started")
                : e.start_time_formatted
            }}</b>
            <!-- <br />
                          <b
                            v-if="e.is_bought_status != null"
                            class="text-xs"
                            :class="
                              e.is_bought_status.is_bought === true
                                ? 'text-success'
                                : 'text-danger'
                            "
                            >{{
                              e.is_bought_status.is_bought === true
                                ? e.is_bought_status.is_free
                                  ? $t("pages.lessons.free_lesson")
                                  : $t("pages.payment-result.success_alt")
                                : $t("pages.payment-result.fail_alt_2")
                            }}</b
                          > -->
          </td>
          <td>
            <div class="flex flex-wrap gap-1">
              {{ e.lesson_name || e.topic }}
              <div
                v-if="schoolStore.isAiSchoolDomain"
                class="px-2 py-1 w-fit rounded-md flex items-center gap-1 text-xs border font-medium"
                :class="
                  e.is_free
                    ? 'text-success border-success'
                    : 'text-danger border-danger'
                "
              >
                <i class="pi" :class="e.is_free ? 'pi-gift' : 'pi-crown'"></i>
                {{ e.is_free ? "Free" : "Premium" }}
              </div>

              <div
                v-if="e.is_member"
                class="px-2 py-1 text-success border border-success w-fit rounded-md flex gap-1 items-center text-xs font-medium"
              >
                <i class="pi pi-check"></i>
                {{ $t("pages.conference.accept.already_exists_alt") }}
              </div>
            </div>
          </td>
          <template v-if="!schoolStore.isAiSchoolDomain">
            <roleProvider :roles="[1, 2, 3, 4]">
              <td>{{ e.lesson_type_name }}</td>
              <td>{{ e.group_name }}</td>
              <td>{{ e.course_name }}</td>
              <td>{{ e.level_name }}</td>
            </roleProvider>
          </template>
          <template v-else>
            <td v-if="props.miniTable === false">
              <div class="text-list text-nowrap">
                <span v-for="(level, lIndex) in e.levels" :key="lIndex">
                  {{ level.level_name }}
                </span>
              </div>
            </td>
          </template>
          <td v-if="props.miniTable === false">
            <div class="flex gap-x-1 items-center">
              <userAvatar
                :padding="0.5"
                :className="'w-6 h-6'"
                :user="{
                  last_name: e.mentor_last_name || e.moderator_last_name || '',
                  first_name:
                    e.mentor_first_name || e.moderator_first_name || '',
                  avatar: e.mentor_avatar || e.moderator_avatar || '',
                }"
              />
              <span class="text-nowrap">
                {{ e.mentor_last_name || e.moderator_last_name || "" }}
                {{ e.mentor_first_name || e.moderator_first_name || "" }}</span
              >
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <template v-if="props.mode === 'stack'">
    <div class="flex flex-col gap-y-2">
      <div
        v-for="e in schedule"
        :key="e.uuid"
        class="bg-active border-inactive rounded-xl p-4 text-left flex flex-col gap-y-2 select-none"
      >
        <p class="mb-0" :class="props.miniTable === false ? 'text-lg' : ''">
          <b>{{ e.topic || e.lesson_name }}</b>
        </p>

        <template v-if="!schoolStore.isAiSchoolDomain">
          <roleProvider :roles="[1, 2, 3, 4]">
            <p class="mb-0">
              {{ $t("pages.lessons.lesson_type") }}:
              <b>{{ e.lesson_type_name }}</b>
            </p>
            <p class="mb-0">
              {{ $t("pages.groups.group") }}: <b>{{ e.group_name }}</b>
            </p>
            <p class="mb-0">
              {{ $t("pages.courses.course") }}: <b>{{ e.course_name }}</b>
            </p>
            <p class="mb-0">
              {{ $t("pages.groups.group_category") }}: <b>{{ e.level_name }}</b>
            </p>
          </roleProvider>
        </template>
        <template v-else>
          <p class="mb-0" v-if="props.miniTable === false">
            {{ $t("pages.courses.title") }}:
            <span class="text-list text-nowrap font-medium">
              <span v-for="(level, lIndex) in e.levels" :key="lIndex">
                {{ level.level_name }}
              </span>
            </span>
          </p>
        </template>

        <div class="flex gap-x-1 items-center">
          {{ $t("mentor") }}:

          <userTag
            :user="{
              last_name: e.mentor_last_name || e.moderator_last_name || '',
              first_name: e.mentor_first_name || e.moderator_first_name || '',
              avatar: e.mentor_avatar || e.moderator_avatar || '',
            }"
            :closable="false"
          />
        </div>

        <div class="flex flex-wrap gap-2">
          <div
            class="px-2 py-1 bg-inactive border-inactive w-fit rounded-md flex gap-1 items-center text-xs font-medium"
          >
            <i class="pi pi-calendar-clock"></i>
            {{ e.start_time_formatted }}
          </div>

          <div
            v-if="schoolStore.isAiSchoolDomain"
            class="px-2 py-1 w-fit rounded-md flex gap-1 items-center text-xs font-medium border"
            :class="
              e.is_free
                ? 'text-success border-success'
                : 'text-danger border-danger'
            "
          >
            <i class="pi" :class="e.is_free ? 'pi-gift' : 'pi-crown'"></i>
            {{ e.is_free ? "Free" : "Premium" }}
          </div>

          <div
            v-if="e.is_member"
            class="px-2 py-1 text-success border border-success w-fit rounded-md flex gap-1 items-center text-xs font-medium"
          >
            <i class="pi pi-check"></i>
            {{ $t("pages.conference.accept.already_exists_alt") }}
          </div>
        </div>

        <div class="btn-wrap">
          <button
            class="btn btn-primary btn-sm"
            @click="openEventModal(e.uuid)"
          >
            <i class="pi pi-arrow-up-right"></i>
            {{ $t("more") }}
          </button>

          <button
            v-if="
              schoolStore.isAiSchoolDomain &&
              e.is_active === false &&
              e.is_learner === true &&
              e.is_member === false
            "
            @click="acceptConference(e.uuid)"
            class="btn btn-success btn-sm"
          >
            <i class="pi pi-check"></i>
            {{ $t("pages.conference.accept.title") }}
          </button>
        </div>
      </div>
    </div>
  </template>
</template>
<script setup>
import roleProvider from "../ui/roleProvider.vue";
import userAvatar from "../ui/userAvatar.vue";
import userTag from "../ui/userTag.vue";
const schoolStore = useSchoolStore();

const props = defineProps({
  schedule: {
    type: Object,
    required: true,
  },

  miniTable: {
    type: Boolean,
    default: false,
    required: false,
  },

  mode: {
    type: String,
    default: "table",
    required: false,
  },

  openEventModal: {
    type: Function,
    default: null,
  },

  acceptConference: {
    type: Function,
    default: null,
  },
});

const { schedule } = toRefs(props);
</script>
