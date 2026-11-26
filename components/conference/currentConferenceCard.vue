<template>
  <article class="live-card">
    <!-- Постер (AI-школа) -->
    <div
      v-if="schoolStore.isAiSchoolDomain && props.conference.poster_file"
      class="live-card-poster group"
    >
      <img
        :src="`${config.public.apiBase}/media/get/${props.conference.poster_file}`"
        class="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50 transition-transform duration-700 group-hover:scale-125"
        alt=""
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-gray-950/40"
      ></div>
      <img
        v-skeleton.parent
        :src="`${config.public.apiBase}/media/get/${props.conference.poster_file}`"
        class="relative z-10 max-w-full max-h-full object-contain rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:scale-[1.02]"
        alt=""
      />
    </div>

    <div class="live-card-body">
      <!-- Статус + название -->
      <div class="flex flex-col gap-2">
        <span class="lesson-badge live w-fit">
          <span class="live-dot !w-2 !h-2" aria-hidden="true"></span>
          {{ $t("pages.dashboard.live_now") }}
        </span>
        <h3 class="mb-0 leading-tight">{{ title }}</h3>
        <p
          v-if="schoolStore.isAiSchoolDomain && props.conference.topic_description"
          class="mb-0 text-inactive text-sm line-clamp-2"
        >
          {{ props.conference.topic_description }}
        </p>
      </div>

      <!-- Детали одной строкой меток -->
      <div class="lesson-meta">
        <template v-if="!schoolStore.isAiSchoolDomain">
          <span v-if="props.conference.course_name" :title="$t('pages.courses.course')">
            <i class="pi pi-book" aria-hidden="true"></i>
            {{ props.conference.course_name
            }}<template v-if="props.conference.level_name">
              · {{ props.conference.level_name }}</template
            >
          </span>
          <span v-if="props.conference.group_name" :title="$t('pages.groups.group')">
            <i class="pi pi-users" aria-hidden="true"></i>
            {{ props.conference.group_name }}
          </span>
        </template>
        <span
          v-else-if="props.conference.levels?.length"
          :title="$t('pages.courses.title')"
        >
          <i class="pi pi-book" aria-hidden="true"></i>
          <span class="text-list">
            <span v-for="(level, lIndex) in props.conference.levels" :key="lIndex">
              {{ level.level_name }}
            </span>
          </span>
        </span>
        <span class="lesson-mentor !text-inherit" :title="$t('mentor')">
          <userAvatar
            :padding="0.5"
            :className="'w-5 h-5 text-[9px]'"
            :user="mentor"
          />
          {{ mentor.last_name }} {{ mentor.first_name }}
        </span>
      </div>

      <!-- Ход урока: полоса прогресса + оставшееся время -->
      <div class="live-progress">
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="inline-flex items-center gap-1.5">
            <i class="pi pi-clock text-success" aria-hidden="true"></i>
            {{ timeRange }}
          </span>
          <span class="text-inactive">
            {{ $t("remaining_time") }}:
            <b class="text-active tabular-nums">
              <countdownTimer
                :endDate="props.conference.end_time"
                :onComplete="() => props.timeIsUp()"
              />
            </b>
          </span>
        </div>
        <div
          class="live-progress-track"
          role="progressbar"
          :aria-valuenow="progress"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="live-progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>

      <!-- Низ: участники стопкой аватаров + действия -->
      <div class="live-card-foot">
        <div
          v-if="members.length"
          class="flex items-center gap-2 min-w-0"
          :title="memberNames"
        >
          <div class="avatar-stack">
            <userAvatar
              v-for="(member, index) in members.slice(0, MAX_AVATARS)"
              :key="index"
              :padding="0.5"
              :className="'w-7 h-7 text-[10px]'"
              :user="member"
            />
            <span v-if="members.length > MAX_AVATARS" class="avatar-stack-more"
              >+{{ members.length - MAX_AVATARS }}</span
            >
          </div>
          <span class="text-sm text-inactive whitespace-nowrap"
            >{{ $t("pages.conference.participants") }}:
            <b class="text-active">{{ members.length }}</b></span
          >
        </div>

        <div class="btn-wrap shrink-0 max-sm:w-full">
          <button
            type="button"
            v-if="
              authUser?.user_id === props.conference.operator_id &&
              props.conference.forced === 1 &&
              props.openDeleteModal
            "
            class="btn btn-light btn-delete max-sm:flex-1"
            @click="props.openDeleteModal(props.conference)"
          >
            <i class="pi pi-trash" aria-hidden="true"></i>
            {{ $t("delete") }}
          </button>
          <nuxt-link
            class="btn btn-success animate-pulse-glow max-sm:flex-1"
            :to="localePath('/dashboard/conference/' + props.conference.uuid)"
          >
            <i class="pi pi-video" aria-hidden="true"></i>
            {{ $t("pages.conference.join") }}
          </nuxt-link>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { useRuntimeConfig } from "nuxt/app";
import countdownTimer from "../ui/countdownTimer.vue";
import userAvatar from "../ui/userAvatar.vue";

const schoolStore = useSchoolStore();
const config = useRuntimeConfig();
const authUser = useSanctumUser();

const MAX_AVATARS = 6;

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

const title = computed(() =>
  schoolStore.isAiSchoolDomain
    ? props.conference.topic
    : props.conference.lesson_name || props.conference.topic,
);

const mentor = computed(() => ({
  last_name:
    props.conference.mentor_last_name || props.conference.moderator_last_name || "",
  first_name:
    props.conference.mentor_first_name ||
    props.conference.moderator_first_name ||
    "",
  avatar: props.conference.mentor_avatar || props.conference.moderator_avatar || "",
}));

const members = computed(() => props.conference.members || []);

const memberNames = computed(() =>
  members.value.map((m) => `${m.last_name || ""} ${m.first_name || ""}`.trim()).join(", "),
);

const parseDate = (s) => (s ? new Date(String(s).replace(" ", "T")) : null);

const hhmm = (d) =>
  d && !isNaN(d)
    ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    : "";

// «18:00 – 19:00»; если дат нет — исходные отформатированные строки.
const timeRange = computed(() => {
  const start = parseDate(props.conference.start_time);
  const end = parseDate(props.conference.end_time);
  const range = [hhmm(start), hhmm(end)].filter(Boolean).join(" – ");
  return range || props.conference.start_time_formatted || "";
});

// Сколько процентов урока уже прошло (обновляется раз в 15 секунд).
const now = ref(Date.now());
let tick = null;

const progress = computed(() => {
  const start = parseDate(props.conference.start_time);
  const end = parseDate(props.conference.end_time);
  if (!start || !end || isNaN(start) || isNaN(end) || end <= start) return 0;
  const p = ((now.value - start) / (end - start)) * 100;
  return Math.round(Math.min(100, Math.max(0, p)));
});

onMounted(() => {
  tick = setInterval(() => (now.value = Date.now()), 15000);
});

onBeforeUnmount(() => clearInterval(tick));
</script>
