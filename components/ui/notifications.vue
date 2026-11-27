<template>
  <div ref="rootRef" class="notif">
    <button
      type="button"
      class="header-icon-btn notif-bell"
      :class="{ ring: ringing, active: open }"
      :aria-expanded="open"
      :aria-label="
        $t('pages.notifications.title') +
        (unread ? ', ' + $t('pages.notifications.unread_count', { n: unread }) : '')
      "
      :title="$t('pages.notifications.title')"
      @click="toggle"
    >
      <i :class="unread ? 'bi bi-bell-fill' : 'bi bi-bell'" aria-hidden="true"></i>
      <span v-if="unread" class="notif-badge">{{ unread > 99 ? "99+" : unread }}</span>
    </button>

    <div v-if="open" class="notif-panel" role="dialog" :aria-label="$t('pages.notifications.title')">
      <div class="notif-head">
        <b>{{ $t("pages.notifications.title") }}</b>
        <button
          v-if="unread"
          type="button"
          class="auto-translate-btn ml-auto"
          @click="readAll"
        >
          <i class="pi pi-check" aria-hidden="true"></i>
          {{ $t("pages.notifications.read_all") }}
        </button>
      </div>

      <div class="notif-body">
        <!-- Первая загрузка -->
        <div v-if="loading && !items.length" aria-busy="true">
          <span class="sr-only">{{ $t("loading") }}</span>
          <div v-for="n in 4" :key="n" class="notif-item pointer-events-none" aria-hidden="true">
            <div class="skeleton w-9 h-9 !rounded-xl shrink-0"></div>
            <div class="flex-1 flex flex-col gap-1.5">
              <div class="skeleton h-3.5 w-1/2"></div>
              <div class="skeleton h-3 w-11/12"></div>
              <div class="skeleton h-2.5 w-16"></div>
            </div>
          </div>
        </div>

        <div v-else-if="failed && !items.length" class="notif-empty">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
          <span>{{ $t("pages.notifications.failed") }}</span>
          <button type="button" class="btn btn-sm btn-light" @click="load(true)">
            {{ $t("pages.notifications.retry") }}
          </button>
        </div>

        <div v-else-if="!items.length" class="notif-empty">
          <i class="bi bi-bell-slash" aria-hidden="true"></i>
          <b>{{ $t("pages.notifications.empty") }}</b>
          <span class="text-xs">{{ $t("pages.notifications.empty_hint") }}</span>
        </div>

        <ul v-else class="notif-list">
          <li v-for="item in items" :key="item.id">
            <button
              type="button"
              class="notif-item"
              :class="{ unread: !item.read, clickable: item.link }"
              @click="openItem(item)"
            >
              <span class="notif-icon" :class="'tone-' + view(item).tone" aria-hidden="true">
                <i :class="view(item).icon"></i>
              </span>
              <span class="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                <span class="text-sm font-semibold leading-snug">{{ view(item).title }}</span>
                <span class="text-sm text-inactive leading-snug break-words">{{ view(item).text }}</span>
                <span class="text-[11px] text-inactive">{{ timeAgo(item.created_at) }}</span>
              </span>
              <span v-if="!item.read" class="notif-dot" aria-hidden="true"></span>
            </button>
          </li>
        </ul>

        <div v-if="hasMore && items.length" class="flex justify-center p-2">
          <button type="button" class="btn btn-sm btn-light" :disabled="loading" @click="load(false)">
            <i v-if="loading" class="pi pi-spin pi-spinner" aria-hidden="true"></i>
            {{ $t("pages.notifications.load_more") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Колокольчик в шапке кабинета. Счётчик непрочитанных приходит тем же
// 30-секундным опросом conferences/live_status (layouts/dashboard.vue),
// список — при открытии. Текст собирается здесь по виду события (type)
// и подстановкам (params) — на языке пользователя, даты — в его часовом поясе.
import { useRouter, useRoute } from "nuxt/app";
import { useConferenceLive } from "~/composables/useConferenceLive";

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const localePath = useLocalePath();
const { $axiosPlugin } = useNuxtApp();
const live = useConferenceLive();

const rootRef = ref(null);
const open = ref(false);
const loading = ref(false);
const failed = ref(false);
const items = ref([]);
const hasMore = ref(false);
const ringing = ref(false);

const unread = computed(() => live.value.notificationsUnread || 0);
const setUnread = (n) => {
  live.value = { ...live.value, notificationsUnread: Math.max(0, Number(n) || 0) };
};

// Пришло новое, пока панель закрыта, — колокольчик «качнётся» один раз
watch(unread, (now, before) => {
  if (now > (before || 0) && !open.value) {
    ringing.value = true;
    setTimeout(() => (ringing.value = false), 1000);
  }
});

// ===== Вид уведомления: иконка, цвет, заголовок, текст =====
const LOOK = {
  lesson_reminder: { icon: "pi pi-bell", tone: "blue" },
  lesson_moved: { icon: "pi pi-calendar-clock", tone: "amber" },
  lessons_shifted: { icon: "pi pi-calendar-clock", tone: "amber" },
  lesson_cancelled: { icon: "pi pi-calendar-times", tone: "red" },
  task_submitted: { icon: "pi pi-inbox", tone: "violet" },
  task_checked: { icon: "pi pi-check-circle", tone: "green" },
  subscription_expiring: { icon: "pi pi-exclamation-triangle", tone: "amber" },
  subscription_expired: { icon: "pi pi-times-circle", tone: "red" },
  payment_confirmed: { icon: "pi pi-wallet", tone: "green" },
  group_added: { icon: "pi pi-users", tone: "blue" },
  group_mentor_assigned: { icon: "pi pi-users", tone: "blue" },
  group_members_added: { icon: "pi pi-user-plus", tone: "blue" },
};

const intlLocale = computed(() => String(locale.value || "ru").split("-")[0]);

const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString(intlLocale.value, {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString(intlLocale.value, { hour: "2-digit", minute: "2-digit" }) : "";

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(intlLocale.value, { day: "numeric", month: "long", year: "numeric" }) : "";

const textOf = (item) => {
  const p = item.params || {};
  const key = (k, values) => t("pages.notifications.texts." + k, values);
  switch (item.type) {
    case "lesson_reminder":
      return key("lesson_reminder_" + (p.when || "now"), {
        lesson: p.lesson || "",
        start: p.when === "day" ? formatDateTime(p.start) : formatTime(p.start),
      });
    case "lesson_moved":
    case "lessons_shifted":
      return key(item.type, { lesson: p.lesson || "", from: formatDateTime(p.from), to: formatDateTime(p.to) });
    case "lesson_cancelled":
      return key(item.type, { lesson: p.lesson || "", start: formatDateTime(p.start) });
    case "task_submitted":
      return key(item.type, { task: p.task || "", lesson: p.lesson || "", learner: p.learner || "" });
    case "task_checked":
      return key(item.type, { task: p.task || "", lesson: p.lesson || "", percentage: p.percentage ?? 0 });
    case "subscription_expiring":
      return Number(p.days) > 0
        ? key(item.type, { date: formatDate(p.expires_at), days: p.days })
        : key("subscription_expiring_today");
    case "subscription_expired":
    case "payment_confirmed":
      return key(item.type, { date: formatDate(p.expires_at) });
    case "group_added":
    case "group_mentor_assigned":
    case "group_members_added":
      return key(item.type, {
        group: p.group || "",
        level: p.level || "",
        mentor: p.mentor || "",
        members: p.members ?? 0,
        count: p.count ?? 0,
      });
    default:
      return "";
  }
};

const view = (item) => {
  const look = LOOK[item.type] || { icon: "pi pi-info-circle", tone: "blue" };
  const titleKey = LOOK[item.type] ? item.type : "unknown";
  return {
    ...look,
    title: t("pages.notifications.titles." + titleKey),
    text: textOf(item),
  };
};

// «5 минут назад», «вчера»; старше недели — дата
const timeAgo = (iso) => {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return t("pages.notifications.just_now");
  const rtf = new Intl.RelativeTimeFormat(intlLocale.value, { numeric: "auto" });
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 7 * 86400) return rtf.format(Math.round(diff / 86400), "day");
  return formatDateTime(iso);
};

// ===== Загрузка и действия =====
const load = async (reset = true) => {
  if (loading.value) return;
  loading.value = true;
  failed.value = false;
  try {
    const params = {};
    if (!reset && items.value.length) params.before = items.value[items.value.length - 1].created_at;
    const { data } = await $axiosPlugin.get("notifications/get", { params });
    items.value = reset ? data.items || [] : [...items.value, ...(data.items || [])];
    hasMore.value = Boolean(data.has_more);
    setUnread(data.unread);
  } catch (e) {
    failed.value = true;
  } finally {
    loading.value = false;
  }
};

const toggle = () => {
  open.value = !open.value;
  if (open.value) load(true);
};

const close = () => {
  open.value = false;
};

const markRead = async (item) => {
  if (item.read) return;
  item.read = true;
  setUnread(unread.value - 1);
  try {
    const { data } = await $axiosPlugin.post("notifications/read/" + item.id);
    setUnread(data.unread);
  } catch (e) {
    /* не критично: при следующем опросе счётчик выровняется */
  }
};

const openItem = (item) => {
  markRead(item);
  if (item.link) {
    close();
    router.push(localePath(item.link));
  }
};

const readAll = async () => {
  items.value.forEach((item) => (item.read = true));
  setUnread(0);
  try {
    await $axiosPlugin.post("notifications/read_all");
  } catch (e) {
    /* счётчик выровняется при следующем опросе */
  }
};

// Закрытие: клик вне, Esc, переход на другую страницу
const onPointerDown = (event) => {
  if (open.value && rootRef.value && !rootRef.value.contains(event.target)) close();
};
const onKeyDown = (event) => {
  if (event.key === "Escape" && open.value) close();
};
watch(() => route.fullPath, close);

onMounted(() => {
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerDown);
  document.removeEventListener("keydown", onKeyDown);
});
</script>
