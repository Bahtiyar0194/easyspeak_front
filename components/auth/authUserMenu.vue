<template>
  <template v-if="authUser">
    <!-- Плашка пользователя: аватар, имя, роль и стрелка — одним элементом -->
    <dropdownMenu :dropdown-arrow="false">
      <template v-slot:btn_content>
        <div
          class="user-menu-btn"
          :title="authUser.last_name + ' ' + authUser.first_name"
        >
          <userAvatar
            v-if="authUser"
            :padding="0"
            :className="'w-8 h-8 text-xs'"
            :user="authUser"
          />
          <div class="hidden sm:flex flex-col text-left leading-tight min-w-0">
            <span class="font-semibold text-sm truncate max-w-[9rem]">{{ authUser.first_name }}</span>
            <span
              v-if="props.showAuthMenu === true"
              class="text-inactive text-[11px] truncate max-w-[9rem]"
            >
              {{ authUser.current_role_name }}
            </span>
          </div>
          <i class="pi pi-chevron-down user-menu-chevron" aria-hidden="true"></i>
        </div>
      </template>

      <template v-slot:menu_content>
        <div class="user-menu">
          <template v-if="props.showAuthMenu === true">
            <!-- Кто вошёл -->
            <div class="user-menu-head">
              <userAvatar
                v-if="authUser"
                :user="authUser"
                :className="'w-11 h-11 text-base'"
              />
              <div class="min-w-0">
                <p class="mb-0 font-semibold text-active truncate">
                  {{ authUser.last_name }} {{ authUser.first_name }}
                </p>
                <p
                  v-if="authUser.email || authUser.telegram_username"
                  class="mb-0 text-xs text-inactive truncate"
                >
                  {{ authUser.email || authUser.telegram_username }}
                </p>
              </div>
            </div>

            <!-- Школа и подписка -->
            <client-only>
              <template
                v-if="schoolStore.schoolData && !schoolStore.isAiSchoolDomain"
              >
                <roleProvider :roles="[1, 2, 3]">
                  <nuxt-link to="/dashboard/school" class="user-menu-school">
                    <span class="user-menu-school-icon" aria-hidden="true">
                      <i class="pi pi-building-columns"></i>
                    </span>
                    <span class="min-w-0 flex flex-col">
                      <span
                        class="font-semibold text-sm truncate"
                        v-html="schoolStore.schoolData.full_school_name"
                      ></span>
                      <span class="text-xs text-inactive">
                        {{ $t("pages.subscription.expired_at") }}:
                        <b class="text-active">{{
                          new Date(
                            schoolStore.schoolData.subscription_expiration_at,
                          ).toLocaleDateString()
                        }}</b>
                      </span>
                    </span>
                  </nuxt-link>
                </roleProvider>
              </template>
            </client-only>

            <!-- Переключение роли -->
            <div
              v-if="authUser && authUser.roles?.length > 1"
              class="user-menu-section"
            >
              <p class="user-menu-label">{{ $t("pages.users.user_mode") }}</p>
              <div class="flex flex-col gap-0.5" role="radiogroup">
                <button
                  v-for="role in authUser.roles"
                  :key="role.role_type_id"
                  type="button"
                  role="radio"
                  class="user-menu-role"
                  :class="{
                    active: authUser.current_role_id == role.role_type_id,
                  }"
                  :aria-checked="authUser.current_role_id == role.role_type_id"
                  :disabled="pendingRole"
                  @click="changeUserMode(role.role_type_id)"
                >
                  <span>{{ role.user_role_type_name }}</span>
                  <i
                    v-if="pendingRole && pendingRoleId === role.role_type_id"
                    class="pi pi-spinner btn-loading-circle"
                    aria-hidden="true"
                  ></i>
                  <i
                    v-else-if="authUser.current_role_id == role.role_type_id"
                    class="pi pi-check"
                    aria-hidden="true"
                  ></i>
                </button>
              </div>
            </div>

            <nuxt-link
              :to="localePath('/dashboard/profile')"
              class="user-menu-link"
            >
              <i class="pi pi-user" aria-hidden="true"></i>
              {{ $t("pages.profile.title") }}
            </nuxt-link>
          </template>
          <template v-else>
            <nuxt-link :to="localePath('/dashboard')" class="user-menu-link">
              <i class="pi pi-home" aria-hidden="true"></i>
              {{ $t("pages.dashboard.title") }}
            </nuxt-link>
          </template>

          <nuxt-link
            :to="localePath('/auth/logout')"
            class="user-menu-link danger"
          >
            <i class="pi pi-sign-out" aria-hidden="true"></i>
            {{ $t("pages.login.sign_out") }}
          </nuxt-link>
        </div>
      </template>
    </dropdownMenu>
  </template>
  <template v-else>
    <nuxt-link class="btn btn-primary !px-3" :to="localePath('/auth/login')">
      <i class="pi pi-sign-in" aria-hidden="true"></i>
      {{ $t("pages.login.sign_in") }}
    </nuxt-link>
  </template>
</template>
<script setup>
import { useRouter } from "nuxt/app";
import dropdownMenu from "../ui/dropdownMenu.vue";
import userAvatar from "../ui/userAvatar.vue";
import roleProvider from "../ui/roleProvider.vue";

const { $axiosPlugin } = useNuxtApp();
const { refreshIdentity } = useSanctumAuth();
const authUser = useSanctumUser();
const router = useRouter();
const schoolStore = useSchoolStore();

const props = defineProps({
  showAuthMenu: {
    type: Boolean,
    required: false,
    default: true,
  },
});

// Смена роли: пока запрос идёт, кнопки ролей неактивны, у выбранной — спиннер.
const pendingRole = ref(false);
const pendingRoleId = ref(null);

const changeUserMode = async (role_type_id) => {
  if (pendingRole.value || authUser.value?.current_role_id == role_type_id) {
    return;
  }
  pendingRole.value = true;
  pendingRoleId.value = role_type_id;

  await $axiosPlugin
    .post("auth/change_mode/" + role_type_id)
    .then(async () => {
      await refreshIdentity();
    })
    .finally(() => {
      pendingRole.value = false;
      pendingRoleId.value = null;
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
</script>
