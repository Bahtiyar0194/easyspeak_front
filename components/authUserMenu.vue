<template>
  <template v-if="authUser">
    <dropdownMenu :dropdown-arrow="true">
      <template v-slot:btn_content>
        <div class="flex items-center gap-x-1 sm:gap-x-1.5">
          <userAvatar
            v-if="authUser"
            :padding="0.5"
            :className="'w-8 h-8'"
            :user="authUser"
          />
          <div class="hidden sm:block text-left">
            <span class="font-medium">{{ authUser.first_name }}</span>
            <p
              v-if="props.showAuthMenu === true"
              class="text-inactive mb-0 -mt-0.5 text-[10px]"
            >
              {{ authUser.current_role_name }}
            </p>
          </div>
        </div>
      </template>

      <template v-slot:menu_content>
        <template v-if="props.showAuthMenu === true">
          <li>
            <div>
              <div class="flex items-center gap-x-2">
                <userAvatar
                  v-if="authUser"
                  :user="authUser"
                  :className="'w-12 h-12 text-2xl'"
                />
                <div>
                  <p class="text-active font-medium text-base mb-0">
                    {{ authUser.last_name }} {{ authUser.first_name }}
                  </p>
                  <p class="text-inactive text-xs mb-0">{{ authUser.email }}</p>
                </div>
              </div>
            </div>
          </li>
          <li v-if="authUser.roles?.length > 1">
            <div>
              <p class="mb-2.5">{{ $t("pages.users.user_mode") }}:</p>

              <div
                v-for="role in authUser.roles"
                :key="role.role_type_id"
                class="mt-1.5"
              >
                <label class="custom-radio">
                  <input
                    type="radio"
                    @change="changeUserMode(role.role_type_id)"
                    :checked="authUser.current_role_id == role.role_type_id"
                    name="user_mode"
                  />
                  <span>{{ role.user_role_type_name }}</span>
                </label>
              </div>
            </div>
          </li>
          <li>
            <button>
              <i class="pi pi-user"></i>
              {{ $t("pages.profile.title") }}
            </button>
          </li>
        </template>
        <template v-else>
          <li>
            <nuxt-link :to="localePath('/dashboard')">
              <i class="pi pi-sign-in"></i>
              {{ $t("pages.dashboard.title") }}
            </nuxt-link>
          </li>
        </template>
        <li>
          <button @click="handleLogout()">
            <i class="pi pi-sign-out"></i>
            {{ $t("pages.login.sign_out") }}
          </button>
        </li>
      </template>
    </dropdownMenu>
  </template>
  <template v-else>
    <nuxt-link class="btn btn-primary !px-3" :to="localePath('/auth/login')">
      <i class="pi pi-sign-in"></i>
      {{ $t("pages.login.sign_in") }}
    </nuxt-link>
  </template>
</template>
<script setup>
import { useRouter } from "nuxt/app";
import dropdownMenu from "./ui/dropdownMenu.vue";
import userAvatar from "./ui/userAvatar.vue";

const { $axiosPlugin } = useNuxtApp();
const { logout, refreshIdentity } = useSanctumAuth();
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

const changeUserMode = async (role_type_id) => {
  await $axiosPlugin
    .post("auth/change_mode/" + role_type_id)
    .then((response) => {
      refreshIdentity();
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

const handleLogout = () => {
  logout().then(() => {
    $axiosPlugin.defaults.headers.common["Authorization"] = null;

    schoolStore.getSchool();
  });
};
</script>
