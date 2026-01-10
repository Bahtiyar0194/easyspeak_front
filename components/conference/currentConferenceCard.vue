<template>
  <div class="card p-4">
    <div class="custom-grid">
      <div class="col-span-12">
        <h3>
          {{ props.conference.lesson_name }}
        </h3>

        <p class="text-inactive">
          <i class="pi pi-book"></i> {{ $t("pages.courses.course") }}:
          <b class="text-active"
            >{{ props.conference.course_name }} -
            {{ props.conference.level_name }}</b
          >
        </p>
        <p class="text-inactive">
          <i class="pi pi-users"></i> {{ $t("pages.groups.group") }}:
          <b class="text-active">{{ props.conference.group_name }}</b>
        </p>
        <p class="text-inactive">
          <i class="pi pi-user"></i> {{ $t("mentor") }}:
          <b class="text-active"
            >{{ props.conference.mentor_last_name }}
            {{ props.conference.mentor_first_name }}</b
          >
        </p>
        <p class="text-inactive">
          <i class="pi pi-clock"></i> {{ $t("start_time") }}:
          <b class="text-active">{{ props.conference.start_time_formatted }}</b>
        </p>
        <p class="text-inactive">
          <i class="pi pi-clock"></i> {{ $t("end_time") }}:
          <b class="text-active">{{ props.conference.end_time_formatted }}</b>
        </p>

        <p class="text-inactive mb-0">
          <i class="pi pi-clock"></i> {{ $t("remaining_time") }}:
          <b class="text-danger">
            <countdownTimer
              :endDate="props.conference.end_time"
              :onComplete="() => props.timeIsUp()"
            />
          </b>
        </p>
      </div>
      <div class="col-span-12">
        <p>
          {{ $t("pages.groups.members") }}:
          <b>{{ props.conference.members.length }}</b>
        </p>

        <div v-if="props.conference.members.length > 0" class="btn-wrap">
          <userTag
            v-for="(member, index) in props.conference.members"
            :key="index"
            :user="member"
            :closable="false"
          />
        </div>
      </div>
      <div class="col-span-12">
        <div class="btn-wrap">
          <nuxt-link
            class="btn btn-success animate-pulse-glow"
            :to="localePath('/dashboard/conference/' + props.conference.uuid)"
          >
            <i class="pi pi-video"></i>
            {{ $t("pages.conference.join") }}
          </nuxt-link>

          <button
            v-if="
              authUser.user_id === props.conference.operator_id &&
              props.conference.forced === 1 &&
              props.openDeleteModal
            "
            class="btn btn-outline-danger"
            @click="props.openDeleteModal(conference)"
          >
            <i class="pi pi-trash"></i>
            {{ $t("delete") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import countdownTimer from "../ui/countdownTimer.vue";
import userTag from "../ui/userTag.vue";

const authUser = useSanctumUser();

const props = defineProps({
  conference: {
    type: Object,
    required: true,
  },

  openDeleteModal: {
    type: Function,
    default: null,
  },

  timeIsUp: {
    type: Function,
    required: true,
  },
});
</script>
