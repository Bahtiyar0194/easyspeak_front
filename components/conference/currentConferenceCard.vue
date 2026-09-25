<template>
  <div class="card">
    <div class="flex max-md:flex-col">
      <div
        v-if="schoolStore.isAiSchoolDomain && props.conference.poster_file"
        class="relative w-full h-72 md:w-1/2 md:h-auto min-h-[320px] overflow-hidden rounded-2xl bg-gray-950 flex items-center justify-center p-4 group"
      >
        <!-- 1. Размытый фоновый слой с плавной анимацией -->
        <img
          :src="`${config.public.apiBase}/media/get/${props.conference.poster_file}`"
          class="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50 transition-transform duration-700 group-hover:scale-125"
          alt=""
        />

        <!-- 2. Темный градиент для виньетирования -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-gray-950/40"
        ></div>

        <!-- 3. Основной постер с тенью и аккуратными рамками -->
        <img
          :src="`${config.public.apiBase}/media/get/${props.conference.poster_file}`"
          class="relative z-10 max-w-full max-h-full object-contain rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:scale-[1.02]"
          alt="Conference Poster"
        />
      </div>
      <div class="p-4">
        <div class="custom-grid">
          <div class="col-span-12">
            <h3 class="mb-3">
              {{
                schoolStore.isAiSchoolDomain
                  ? props.conference.topic
                  : props.conference.lesson_name
              }}
            </h3>

            <template v-if="!schoolStore.isAiSchoolDomain">
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
            </template>

            <template v-else>
              <p class="text-inactive">
                <b class="text-active">{{
                  props.conference.topic_description
                }}</b>
              </p>
              <p class="text-inactive">
                <i class="pi pi-user"></i> {{ $t("mentor") }}:
                <b class="text-active"
                  >{{ props.conference.moderator_last_name }}
                  {{ props.conference.moderator_first_name }}</b
                >
              </p>

              <p class="text-inactive">
                <i class="pi pi-book"></i> {{ $t("pages.courses.title") }}:
                <b class="text-active text-list">
                  <span
                    v-for="(level, lIndex) in props.conference.levels"
                    :key="lIndex"
                  >
                    {{ level.level_name }}
                  </span>
                </b>
              </p>
            </template>

            <p class="text-inactive">
              <i class="pi pi-clock"></i> {{ $t("start_time") }}:
              <b class="text-active">{{
                props.conference.start_time_formatted
              }}</b>
            </p>
            <p class="text-inactive">
              <i class="pi pi-clock"></i> {{ $t("end_time") }}:
              <b class="text-active">{{
                props.conference.end_time_formatted
              }}</b>
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
                :to="
                  localePath('/dashboard/conference/' + props.conference.uuid)
                "
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
    </div>
  </div>
</template>

<script setup>
import { useRuntimeConfig } from "nuxt/app";
import countdownTimer from "../ui/countdownTimer.vue";
import userTag from "../ui/userTag.vue";

const schoolStore = useSchoolStore();
const config = useRuntimeConfig();

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
