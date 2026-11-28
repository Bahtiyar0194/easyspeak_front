<template>
  <div>
    <div class="db__header">
      <div>
        <nuxt-link :to="localePath('/dashboard')" aria-label="EasySpeak">
          <div class="logo">
            <img class="w-28 logo-light" src="~/public/images/logo-light.svg" alt="EasySpeak" />
            <img class="w-28 logo-dark" src="~/public/images/logo-dark.svg" alt="EasySpeak" />
          </div>
        </nuxt-link>
      </div>

      <div class="db__header__actions">
        <!-- Тема, язык, уведомления — одной «капсулой» одинаковых кнопок -->
        <div class="db__header__tools">
          <themeSwitcher />
          <selectLocale />
          <notifications />
        </div>
        <authUserMenu />
      </div>
    </div>
    <div class="flex">
      <client-only>
        <nav
          ref="menuWrapper"
          class="db__sidebar__menu"
          :class="{ expanded: showMenu === true }"
          :aria-label="$t('pages.dashboard.title')"
          @mouseenter="showMenu = true"
          @mouseleave="showMenu = false"
          @click="showMenu = true"
        >
          <roleProvider
            v-for="(item, index) in dashboardMenu.filter(
              (i) => i.is_show === true,
            )"
            :key="index"
            :roles="item.roles"
          >
            <nuxt-link
              :to="localePath(item.link)"
              :class="{ active: isActive(item) }"
              :aria-current="isActive(item) ? 'page' : undefined"
              :title="
                showMenu
                  ? undefined
                  : isLive(item)
                    ? $t(item.title) + ' — ' + $t('pages.conference.live_now')
                    : $t(item.title)
              "
            >
              <i :class="item.icon" aria-hidden="true"></i>
              <!-- Идёт видеоконференция. <b>, а не <span>/<i>: на них в меню
                   действуют правила для подписей и иконок -->
              <b
                v-if="isLive(item)"
                class="live-dot menu-live-dot"
                aria-hidden="true"
              ></b>
              <span class="font-medium" :class="{ show: showMenu === true }">{{
                $t(item.title)
              }}</span>
              <b v-if="isLive(item)" class="sr-only">{{
                $t("pages.conference.live_now")
              }}</b>
            </nuxt-link>
          </roleProvider>
        </nav>

        <!-- Пока меню не отрисовано на клиенте — скелетон той же ширины,
             чтобы контент не «прыгал» и было видно, что меню грузится -->
        <template #fallback>
          <div class="db__sidebar__menu" aria-hidden="true">
            <!-- div, а не span: span в меню скрываются правилом для подписей -->
            <div v-for="n in 7" :key="n" class="sidebar-skeleton-item">
              <div class="skeleton w-6 h-6 !rounded-lg"></div>
            </div>
          </div>
        </template>
      </client-only>
      <div class="db__content">
        <div v-if="hasAccess" class="custom-grid">
          <div class="col-span-12">
            <breadcrumb />
          </div>
          <NuxtPage />
        </div>

        <div v-else class="custom-grid">
          <div class="col-span-12">
            <div class="content-center">
              <div class="card conf-state">
                <div class="conf-state-icon"><i class="pi pi-lock"></i></div>
                <h4 class="mb-0">{{ $t("errors.page_is_not_available") }}</h4>
                <nuxt-link class="btn btn-primary" :to="localePath('/dashboard')">
                  <i class="pi pi-home" aria-hidden="true"></i>
                  {{ $t("pages.dashboard.go_to_dashboard") }}
                </nuxt-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <client-only>
      <confirmDialog />
    </client-only>
  </div>
</template>

<script setup>
import breadcrumb from "../components/ui/breadcrumb.vue";
import themeSwitcher from "../components/ui/themeSwitcher.vue";
import selectLocale from "../components/ui/selectLocale.vue";
import notifications from "../components/ui/notifications.vue";
import authUserMenu from "../components/auth/authUserMenu.vue";
import roleProvider from "../components/ui/roleProvider.vue";
import confirmDialog from "../components/ui/confirmDialog.vue";
import { useRoute } from "nuxt/app";
import { watch } from "vue";
import {
  useConferenceLive,
  useConferenceLiveCheck,
} from "~/composables/useConferenceLive";

const authUser = useSanctumUser();
const schoolStore = useSchoolStore();
const menuWrapper = ref(null);
const showMenu = ref(false);
const route = useRoute();

const dashboardMenu = ref([]);

// Пункт меню активен и на вложенных страницах: «Курсы» горит внутри курса,
// уровня и урока. Главная (/dashboard) — только при точном совпадении.
const isActive = (item) => {
  const path = route.path.replace(/\/+$/, "") || "/";
  if (item.link === "/dashboard") return path === "/dashboard";
  return path === item.link || path.startsWith(item.link + "/");
};

// ===== Индикатор «идёт видеоконференция» на пункте меню =====
// Тот же ответ используют дашборд и страница конференций (useConferenceLive):
// по изменению набора текущих конференций они обновляют списки без перезагрузки
const { $axiosPlugin } = useNuxtApp();
const conferenceLive = useConferenceLive();
const conferenceIsLive = computed(() => conferenceLive.value.live);
const LIVE_STATUS_INTERVAL = 30 * 1000;
// При переходах между страницами проверяем не чаще, чем раз в 15 секунд
const LIVE_STATUS_MIN_GAP = 15 * 1000;
let liveStatusTimer = null;
let liveStatusCheckedAt = 0;

const fetchLiveStatus = async (force = true) => {
  // Во вкладке в фоне не опрашиваем: проверим, когда пользователь вернётся
  if (!authUser.value || document.hidden) return;
  if (!force && Date.now() - liveStatusCheckedAt < LIVE_STATUS_MIN_GAP) return;

  liveStatusCheckedAt = Date.now();

  try {
    const response = await $axiosPlugin.get("conferences/live_status");
    const current = Array.isArray(response.data?.current)
      ? response.data.current
      : [];
    conferenceLive.value = {
      live: response.data?.live === true,
      key: current.join(","),
      notificationsUnread: Number(response.data?.notifications_unread) || 0,
    };
  } catch (e) {
    // Индикатор вспомогательный: при ошибке просто не показываем точку,
    // а ключ не трогаем — чтобы сбой сети не вызывал перезагрузку списков
    conferenceLive.value = { ...conferenceLive.value, live: false };
  }
};

// Страница сообщила, что конференции изменились (создали, удалили, перенесли)
watch(useConferenceLiveCheck(), () => fetchLiveStatus(true));

const onVisibilityChange = () => {
  if (!document.hidden) fetchLiveStatus();
};

const isLive = (item) =>
  item.link === "/dashboard/conference" && conferenceIsLive.value;

// После перехода на другую страницу меню на телефоне сворачивается
watch(
  () => route.fullPath,
  () => {
    if (window.innerWidth < 768) showMenu.value = false;
    // Конференция могла начаться или закончиться (например, вышли из неё)
    fetchLiveStatus(false);
  },
);

const hasAccess = computed(() => {
  const currentMenuItem = dashboardMenu.value.find(
    (item) => item.link === route.fullPath,
  );
  if (currentMenuItem) {
    if (
      currentMenuItem.roles.includes(authUser.value?.current_role_id) &&
      currentMenuItem.is_show === true
    ) {
      return true;
    } else {
      return false;
    }
  }
  return true;
});

const handleClickOutside = (event) => {
  // если есть элемент меню и клик был вне его — скрываем меню
  if (menuWrapper.value && !menuWrapper.value.contains(event.target)) {
    showMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("visibilitychange", onVisibilityChange);
  fetchLiveStatus();
  liveStatusTimer = setInterval(fetchLiveStatus, LIVE_STATUS_INTERVAL);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("visibilitychange", onVisibilityChange);
  clearInterval(liveStatusTimer);
  dashboardMenu.value = [];
});

watch(
  () => schoolStore.isAiSchoolDomain,
  (newVal) => {
    dashboardMenu.value = [
      {
        title: "pages.dashboard.title",
        icon: "pi pi-home",
        link: "/dashboard",
        is_show: true,
        roles: [1, 2, 3, 4, 5, 7],
      },
      {
        title: schoolStore.isAiSchoolDomain
          ? "pages.users.title"
          : "pages.users-groups.title",
        icon: "pi pi-users",
        link: "/dashboard/users-groups",
        is_show: true,
        roles: [1, 2, 3, 4],
      },
      {
        title: "pages.schedule.title",
        icon: "pi pi-calendar-clock",
        link: "/dashboard/schedule",
        is_show: true,
        roles: [1, 2, 3, 4, 5, 6],
      },
      {
        title: "pages.conference.title",
        icon: "pi pi-video",
        link: "/dashboard/conference",
        is_show: true,
        roles: [1, 2, 3, 4, 5, 6],
      },
      // {
      //     title: 'pages.operations-requests.title',
      //     icon: 'pi pi-file',
      //     link: '/dashboard/operations-requests',
      //     roles: [1, 2]
      // },
      {
        title: "pages.courses.title",
        icon: "pi pi-book",
        link: "/dashboard/courses",
        is_show: true,
        roles: [1, 2, 3, 4, 5, 7],
      },
      {
        title: "pages.education-program.title",
        icon: "pi pi-book",
        link: "/dashboard/education-program",
        is_show: schoolStore.isAiSchoolDomain === false,
        roles: [1],
      },
      {
        title: "pages.checking-tasks.title",
        icon: "pi pi-list-check",
        link: "/dashboard/checking-tasks",
        is_show: schoolStore.isAiSchoolDomain === false,
        roles: [1, 2, 3, 4],
      },
      {
        title: "pages.files.title",
        icon: "pi pi-file",
        link: "/dashboard/files",
        is_show: schoolStore.isAiSchoolDomain === false,
        roles: [1],
      },
      {
        title: "pages.school.title",
        icon: "pi pi-building-columns",
        link: "/dashboard/school",
        is_show: schoolStore.isAiSchoolDomain === false,
        roles: [1, 2, 3],
      },

      {
        title: "pages.invoices.title",
        icon: "pi pi-receipt",
        link: "/dashboard/invoices",
        is_show: schoolStore.isAiSchoolDomain === false,
        roles: [1],
      },
    ];
  },
  { immediate: true }, // сразу при монтировании если данные уже есть
);
</script>
