<template>
  <div>
    <div class="db__header">
      <div class="w-32 lg:w-56">
        <!-- <img class="w-full" src="~/public/logo.svg"> -->
        <span class="font-medium text-corp text-2xl">EasySpeak</span>
      </div>

      <div class="btn-wrap items-center">
        <themeSwitcher />
        <selectLocale />
        <notifications />
        <authUserMenu />
      </div>
    </div>
    <div class="flex">
      <div class="db__sidebar__menu">
        <roleProvider
          v-for="(item, index) in dashboardMenu"
          :key="index"
          :roles="item.roles"
        >
          <nuxt-link :to="localePath(item.link)">
            <i :class="item.icon"></i>
            <span>{{ $t(item.title) }}</span>
          </nuxt-link>
        </roleProvider>
      </div>
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
              <i class="pi pi-lock text-6xl mb-2 text-corp"></i>
              <div class="text-center">
                <h4 class="mb-2">{{ $t("errors.page_is_not_available") }}</h4>
                <nuxt-link class="text-corp" :to="localePath('/dashboard')"
                  >{{ $t("pages.dashboard.go_to_dashboard") }}
                </nuxt-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import breadcrumb from "../components/ui/breadcrumb.vue";
import themeSwitcher from "../components/ui/themeSwitcher.vue";
import selectLocale from "../components/ui/selectLocale.vue";
import notifications from "../components/ui/notifications.vue";
import authUserMenu from "../components/authUserMenu.vue";
import roleProvider from "../components/ui/roleProvider.vue";
import { useRoute } from "nuxt/app";

const authUser = useSanctumUser();

const dashboardMenu = [
  {
    title: "pages.dashboard.title",
    icon: "pi pi-home",
    link: "/dashboard",
    roles: [1, 2, 3, 4, 5],
  },
  {
    title: "pages.users-groups.title",
    icon: "pi pi-users",
    link: "/dashboard/users-groups",
    roles: [1, 2, 3, 4],
  },
  {
    title: "pages.conference.title",
    icon: "pi pi-video",
    link: "/dashboard/conference",
    roles: [1, 2, 3, 4, 5],
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
    roles: [1, 2, 3, 4, 5],
  },
  {
    title: "pages.education-program.title",
    icon: "pi pi-book",
    link: "/dashboard/education-program",
    roles: [1],
  },
  {
    title: "pages.checking-tasks.title",
    icon: "pi pi-list-check",
    link: "/dashboard/checking-tasks",
    roles: [1, 2, 3, 4],
  },
  {
    title: "pages.files.title",
    icon: "pi pi-file",
    link: "/dashboard/files",
    roles: [1],
  },
];

const route = useRoute();

const hasAccess = computed(() => {
  const currentMenuItem = dashboardMenu.find(
    (item) => item.link === route.fullPath
  );
  if (currentMenuItem) {
    if (currentMenuItem.roles.includes(authUser.value?.current_role_id)) {
      return true;
    } else {
      return false;
    }
  }
  return true;
});
</script>
