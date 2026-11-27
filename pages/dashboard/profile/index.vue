<template>
  <template v-if="authUser">
    <!-- Шапка: аватар, ФИО, роли, школа -->
    <div class="col-span-12">
      <div class="profile-head">
        <div class="profile-avatar">
          <userAvatar
            :user="authUser"
            :padding="1"
            :className="'w-24 h-24 text-3xl'"
          />
          <div class="flex flex-col gap-1.5">
            <button
              type="button"
              class="btn btn-sm btn-light"
              :disabled="pendingAvatar"
              @click="pickAvatar"
            >
              <i class="pi pi-camera" aria-hidden="true"></i>
              {{
                authUser.avatar
                  ? $t("pages.profile.avatar.change")
                  : $t("pages.profile.avatar.upload")
              }}
            </button>
            <button
              v-if="authUser.avatar"
              type="button"
              class="btn btn-sm btn-light text-danger"
              :disabled="pendingAvatar"
              @click="deleteAvatar"
            >
              <i class="pi pi-trash" aria-hidden="true"></i>
              {{ $t("pages.profile.avatar.delete") }}
            </button>
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="onAvatarPicked"
            />
          </div>
        </div>

        <div class="min-w-0 flex flex-col gap-2">
          <h2 class="mb-0 leading-tight break-words">
            {{ authUser.last_name }} {{ authUser.first_name }}
          </h2>
          <div v-if="authUser.roles?.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="role in authUser.roles"
              :key="role.role_type_id"
              class="role-chip"
              :class="{ active: authUser.current_role_id == role.role_type_id }"
            >
              {{ role.user_role_type_name }}
            </span>
          </div>
          <p
            v-if="schoolName"
            class="mb-0 text-sm text-inactive"
          >
            <i class="pi pi-building-columns text-xs" aria-hidden="true"></i>
            {{ schoolName }}
          </p>
        </div>
      </div>
    </div>

    <!-- Личные данные -->
    <div class="col-span-12 lg:col-span-7">
      <section class="profile-section">
        <h4 class="profile-section-title">
          <i class="pi pi-user" aria-hidden="true"></i>
          {{ $t("pages.profile.personal.title") }}
        </h4>
        <form ref="profileFormRef" @submit.prevent="saveProfile">
          <div class="custom-grid">
            <div class="col-span-12 sm:col-span-6">
              <div class="form-group-border active">
                <i class="pi pi-user"></i>
                <input
                  v-model="profileForm.last_name"
                  name="last_name"
                  type="text"
                  autocomplete="family-name"
                  placeholder=" "
                />
                <label :class="{ 'label-error': profileErrors.last_name }">
                  {{ fieldError(profileErrors, "last_name") || $t("form.last_name") }}
                </label>
              </div>
            </div>
            <div class="col-span-12 sm:col-span-6">
              <div class="form-group-border active">
                <i class="pi pi-user"></i>
                <input
                  v-model="profileForm.first_name"
                  name="first_name"
                  type="text"
                  autocomplete="given-name"
                  placeholder=" "
                />
                <label :class="{ 'label-error': profileErrors.first_name }">
                  {{ fieldError(profileErrors, "first_name") || $t("form.first_name") }}
                </label>
              </div>
            </div>
            <div class="col-span-12 sm:col-span-6">
              <div class="form-group-border active">
                <i class="pi pi-mobile"></i>
                <input
                  v-model="profileForm.phone"
                  v-mask="'+7 (###) ###-####'"
                  name="phone"
                  type="tel"
                  inputmode="tel"
                  autocomplete="tel"
                  placeholder=" "
                />
                <label :class="{ 'label-error': profileErrors.phone }">
                  {{ fieldError(profileErrors, "phone") || $t("form.phone") }}
                </label>
              </div>
            </div>
            <div class="col-span-12 sm:col-span-6">
              <!-- Почта — логин и адрес восстановления пароля: только просмотр -->
              <div class="form-group-border active opacity-80">
                <i class="pi pi-at"></i>
                <input
                  :value="authUser.email || ''"
                  type="email"
                  readonly
                  tabindex="-1"
                  :placeholder="$t('pages.profile.not_specified')"
                />
                <label>{{ $t("form.email") }}</label>
              </div>
              <p class="mb-0 mt-1 text-xs text-inactive">
                <i class="pi pi-lock text-[10px]" aria-hidden="true"></i>
                {{ $t("pages.profile.personal.email_readonly") }}
              </p>
            </div>
          </div>

          <div class="btn-wrap mt-4">
            <button
              type="submit"
              class="btn btn-primary"
              :class="{ loading: pendingProfile }"
              :disabled="pendingProfile || !profileChanged"
            >
              <i class="pi pi-check" aria-hidden="true"></i>
              {{ $t("save") }}
            </button>
            <button
              v-if="profileChanged"
              type="button"
              class="btn btn-light"
              :disabled="pendingProfile"
              @click="resetProfileForm"
            >
              {{ $t("telegram.cancel") }}
            </button>
          </div>
        </form>
      </section>
    </div>

    <div class="col-span-12 lg:col-span-5 flex flex-col gap-4">
      <!-- Безопасность -->
      <section class="profile-section">
        <h4 class="profile-section-title">
          <i class="pi pi-shield" aria-hidden="true"></i>
          {{ $t("pages.profile.security.title") }}
        </h4>

        <form @submit.prevent="savePassword" autocomplete="on">
          <p v-if="!authUser.has_password" class="text-sm text-inactive">
            {{ $t("pages.profile.security.no_password_hint") }}
          </p>
          <div class="custom-grid">
            <div v-if="authUser.has_password" class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-key"></i>
                <input
                  v-model="passwordForm.current_password"
                  :type="showPasswords ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder=" "
                />
                <label :class="{ 'label-error': passwordErrors.current_password }">
                  {{
                    fieldError(passwordErrors, "current_password") ||
                    $t("pages.profile.security.current_password")
                  }}
                </label>
              </div>
            </div>
            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-lock"></i>
                <input
                  v-model="passwordForm.password"
                  :type="showPasswords ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder=" "
                />
                <label :class="{ 'label-error': passwordErrors.password }">
                  {{
                    fieldError(passwordErrors, "password") ||
                    $t("pages.profile.security.new_password")
                  }}
                </label>
              </div>
            </div>
            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-lock"></i>
                <input
                  v-model="passwordForm.password_confirmation"
                  :type="showPasswords ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder=" "
                />
                <label :class="{ 'label-error': passwordErrors.password_confirmation }">
                  {{
                    fieldError(passwordErrors, "password_confirmation") ||
                    $t("pages.profile.security.confirm_password")
                  }}
                </label>
              </div>
            </div>
            <div class="col-span-12">
              <label class="custom-radio-checkbox">
                <input v-model="showPasswords" type="checkbox" />
                <span>{{ $t("pages.profile.security.show_passwords") }}</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary mt-4"
            :class="{ loading: pendingPassword }"
            :disabled="pendingPassword || !passwordForm.password"
          >
            <i class="pi pi-check" aria-hidden="true"></i>
            {{
              authUser.has_password
                ? $t("pages.profile.security.change_password")
                : $t("pages.profile.security.set_password")
            }}
          </button>
        </form>
      </section>

      <!-- Telegram -->
      <section class="profile-section">
        <h4 class="profile-section-title">
          <i class="pi pi-telegram" aria-hidden="true"></i>
          Telegram
        </h4>

        <template v-if="authUser.telegram">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="mb-0">
              <span class="status-pill text-success mr-2">
                <i class="pi pi-check text-[10px] mr-1" aria-hidden="true"></i>
                {{ $t("pages.profile.telegram.connected") }}
              </span>
              <b v-if="authUser.telegram.user_name">{{ tgName(authUser.telegram.user_name) }}</b>
            </p>
            <button
              type="button"
              class="btn btn-sm btn-light text-danger"
              :disabled="pendingBot"
              @click="disconnectTelegramBot"
            >
              <i class="pi pi-sign-out" aria-hidden="true"></i>
              {{ $t("telegram.disconnect.disconnect") }}
            </button>
          </div>
        </template>
        <template v-else>
          <p class="text-sm text-inactive">
            {{ $t("pages.profile.telegram.why") }}
          </p>
          <a
            class="btn btn-primary"
            target="_blank"
            rel="noopener"
            :href="`https://t.me/${config.public.telegramBotName}?start=${localeProperties.code}`"
          >
            <i class="pi pi-telegram" aria-hidden="true"></i>
            {{ $t("telegram.connect.connect") }}
          </a>
        </template>
      </section>
    </div>

    <!-- Обрезка аватара -->
    <modal
      :show="cropModalIsVisible"
      :onClose="() => closeCropModal()"
      :className="'modal-md'"
      :showLoader="pendingAvatar"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4 class="mb-0">{{ $t("pages.profile.avatar.crop_title") }}</h4>
      </template>
      <template v-slot:body_content>
        <avatarCropper v-if="cropFile" ref="cropperRef" :file="cropFile" />
        <div class="btn-wrap justify-end mt-4">
          <button type="button" class="btn btn-light" @click="closeCropModal()">
            {{ $t("telegram.cancel") }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :class="{ loading: pendingAvatar }"
            :disabled="pendingAvatar"
            @click="uploadAvatar"
          >
            <i class="pi pi-check" aria-hidden="true"></i>
            {{ $t("save") }}
          </button>
        </div>
      </template>
    </modal>

    <!-- Подключение Telegram по ссылке из бота (?tg_token=…) -->
    <modal
      :show="connectBotModalIsVisible"
      :onClose="() => closeConnectModal()"
      :className="'modal-md'"
      :showLoader="pendingBot"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4 class="mb-0">{{ $t("telegram.connect.title") }}</h4>
      </template>
      <template v-if="telegramAccount" v-slot:body_content>
        <p>
          {{
            authUser.telegram
              ? $t("telegram.message_2", {
                  auth_user_name: accountLabel,
                  old_tg_user_name: tgName(authUser.telegram.user_name),
                  new_tg_user_name: tgName(telegramAccount.user_name),
                })
              : $t("telegram.message_1", {
                  auth_user_name: accountLabel,
                  tg_user_name: tgName(telegramAccount.user_name),
                })
          }}
        </p>
        <div class="btn-wrap justify-end">
          <button type="button" class="btn btn-light" @click="closeConnectModal()">
            {{ $t("telegram.cancel") }}
          </button>
          <button type="button" class="btn btn-primary" @click="connectToTelegramBot()">
            <i class="pi pi-telegram" aria-hidden="true"></i>
            {{ $t("telegram.connect.connect") }}
          </button>
        </div>
      </template>
    </modal>
  </template>
</template>

<script setup>
import { useRoute, useRouter } from "nuxt/app";
import modal from "../../../components/ui/modal.vue";
import userAvatar from "../../../components/ui/userAvatar.vue";
import avatarCropper from "../../../components/ui/avatarCropper.vue";
import { decodeEntities } from "../../../utils/decodeEntities";
import { useNotify } from "~/composables/useNotify";
import { useConfirm } from "~/composables/useConfirm";

const route = useRoute();
const router = useRouter();
const authUser = useSanctumUser();
const { refreshIdentity } = useSanctumAuth();
const { t, localeProperties } = useI18n();
const { $axiosPlugin } = useNuxtApp();
const config = useRuntimeConfig();
const schoolStore = useSchoolStore();
const notify = useNotify();
const confirm = useConfirm();

useHead({
  title: t("pages.profile.title"),
  meta: [{ name: "description", content: t("pages.home.description") }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const schoolName = computed(() =>
  schoolStore.isAiSchoolDomain ? "" : decodeEntities(schoolStore.schoolData?.full_school_name),
);

// «Иванов Иван (ivan@mail.ru)» — для текстов о подключении Telegram
const accountLabel = computed(() => {
  const name = `${authUser.value?.last_name || ""} ${authUser.value?.first_name || ""}`.trim();
  const contact = authUser.value?.email || authUser.value?.phone;
  return contact ? `${name} (${contact})` : name;
});

const tgName = (name) => (name ? (String(name).startsWith("@") ? name : "@" + name) : "");

// Ошибка поля: сервер присылает массив строк
const fieldError = (errors, name) => {
  const value = errors?.[name];
  if (!value) return "";
  return Array.isArray(value) ? value[0] : String(value);
};

const goToError = (err) => {
  if (err.response) {
    router.push({
      path: "/error",
      query: {
        status: err.response.status,
        message: err.response.data?.message,
        url: err.request?.responseURL,
      },
    });
  } else {
    router.push("/error");
  }
};

/* ---------- Личные данные ---------- */
const profileFormRef = ref(null);
const pendingProfile = ref(false);
const profileErrors = ref({});
const profileForm = reactive({ first_name: "", last_name: "", phone: "" });

const resetProfileForm = () => {
  profileForm.first_name = authUser.value?.first_name || "";
  profileForm.last_name = authUser.value?.last_name || "";
  profileForm.phone = authUser.value?.phone || "";
  profileErrors.value = {};
};

const profileChanged = computed(
  () =>
    profileForm.first_name !== (authUser.value?.first_name || "") ||
    profileForm.last_name !== (authUser.value?.last_name || "") ||
    profileForm.phone !== (authUser.value?.phone || ""),
);

const saveProfile = async () => {
  if (pendingProfile.value || !profileChanged.value) return;
  pendingProfile.value = true;
  profileErrors.value = {};

  await $axiosPlugin
    .post("auth/update", { ...profileForm })
    .then(async () => {
      await refreshIdentity();
      resetProfileForm();
      notify("success", t("pages.profile.personal.saved"));
    })
    .catch((err) => {
      if (err.response?.status === 422) profileErrors.value = err.response.data;
      else goToError(err);
    })
    .finally(() => {
      pendingProfile.value = false;
    });
};

/* ---------- Аватар ---------- */
const AVATAR_MAX_MB = 5;
const avatarInputRef = ref(null);
const cropperRef = ref(null);
const cropFile = ref(null);
const cropModalIsVisible = ref(false);
const pendingAvatar = ref(false);

const pickAvatar = () => avatarInputRef.value?.click();

const onAvatarPicked = (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    notify("danger", t("pages.profile.avatar.bad_type"));
    return;
  }
  if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
    notify("danger", t("pages.profile.avatar.too_big", { size: AVATAR_MAX_MB }));
    return;
  }
  cropFile.value = file;
  cropModalIsVisible.value = true;
};

const closeCropModal = () => {
  if (pendingAvatar.value) return;
  cropModalIsVisible.value = false;
  cropFile.value = null;
};

const uploadAvatar = async () => {
  if (pendingAvatar.value || !cropperRef.value) return;
  pendingAvatar.value = true;

  try {
    const blob = await cropperRef.value.getBlob();
    const formData = new FormData();
    formData.append("avatar", blob, "avatar.jpg");
    await $axiosPlugin.post("auth/upload_avatar", formData);
    await refreshIdentity();
    pendingAvatar.value = false;
    closeCropModal();
    notify("success", t("pages.profile.avatar.saved"));
  } catch (err) {
    pendingAvatar.value = false;
    if (err.response?.status === 422) {
      notify("danger", fieldError(err.response.data, "avatar") || t("pages.profile.avatar.bad_type"));
    } else if (err.response) {
      goToError(err);
    } else {
      notify("danger", t("pages.profile.avatar.bad_type"));
    }
  }
};

const deleteAvatar = async () => {
  const ok = await confirm({
    message: t("pages.profile.avatar.delete_confirm"),
    confirmText: t("pages.profile.avatar.delete"),
    danger: true,
  });
  if (!ok) return;

  pendingAvatar.value = true;
  await $axiosPlugin
    .post("auth/delete_avatar")
    .then(async () => {
      await refreshIdentity();
      notify("success", t("pages.profile.avatar.deleted"));
    })
    .catch(goToError)
    .finally(() => {
      pendingAvatar.value = false;
    });
};

/* ---------- Пароль ---------- */
const pendingPassword = ref(false);
const passwordErrors = ref({});
const showPasswords = ref(false);
const passwordForm = reactive({ current_password: "", password: "", password_confirmation: "" });

const savePassword = async () => {
  if (pendingPassword.value) return;
  pendingPassword.value = true;
  passwordErrors.value = {};
  const firstTime = !authUser.value?.has_password;

  await $axiosPlugin
    .post("auth/change_password", { ...passwordForm })
    .then(async () => {
      passwordForm.current_password = "";
      passwordForm.password = "";
      passwordForm.password_confirmation = "";
      showPasswords.value = false;
      if (firstTime) await refreshIdentity();
      notify(
        "success",
        firstTime ? t("pages.profile.security.password_set") : t("pages.profile.security.password_changed"),
      );
    })
    .catch((err) => {
      if (err.response?.status === 422) passwordErrors.value = err.response.data;
      else if (err.response?.status === 429) notify("danger", t("pages.profile.security.too_many"));
      else goToError(err);
    })
    .finally(() => {
      pendingPassword.value = false;
    });
};

/* ---------- Telegram ---------- */
const connectBotModalIsVisible = ref(false);
const pendingBot = ref(false);
const telegramAccount = ref(null);

// Ссылка из бота одноразовая — убираем её из адреса, чтобы обновление
// страницы не открывало окно подключения снова
const clearTgToken = () => {
  if (!route.query.tg_token) return;
  const { tg_token, ...query } = route.query;
  router.replace({ query });
};

const closeConnectModal = () => {
  connectBotModalIsVisible.value = false;
  telegramAccount.value = null;
  clearTgToken();
};

const getTelegramAccount = async (token) => {
  try {
    const response = await $axiosPlugin.get("telegram/get/" + token);
    telegramAccount.value = response.data;
    connectBotModalIsVisible.value = true;
  } catch (err) {
    clearTgToken();
    // Ссылка устарела или уже использована — сообщение, а не страница ошибки
    if (err.response && [400, 404, 410, 422].includes(err.response.status)) {
      notify("warning", t("pages.profile.telegram.link_expired"));
    } else {
      goToError(err);
    }
  }
};

const connectToTelegramBot = async () => {
  const token = route.query.tg_token;
  if (!token || pendingBot.value) return;
  pendingBot.value = true;
  try {
    await $axiosPlugin.post("telegram/connect/" + token);
    await refreshIdentity();
    pendingBot.value = false;
    closeConnectModal();
    notify("success", t("pages.profile.telegram.connected_done"));
  } catch (err) {
    pendingBot.value = false;
    closeConnectModal();
    if (err.response && [400, 404, 410, 422].includes(err.response.status)) {
      notify("warning", t("pages.profile.telegram.link_expired"));
    } else {
      goToError(err);
    }
  }
};

const disconnectTelegramBot = async () => {
  const ok = await confirm({
    title: t("telegram.disconnect.title"),
    message: t("telegram.disconnect.confirm", {
      auth_user_name: accountLabel.value,
      tg_user_name: tgName(authUser.value?.telegram?.user_name),
    }),
    confirmText: t("telegram.disconnect.disconnect"),
    danger: true,
  });
  if (!ok) return;

  pendingBot.value = true;
  try {
    await $axiosPlugin.post("telegram/disconnect");
    await refreshIdentity();
    notify("success", t("pages.profile.telegram.disconnected_done"));
  } catch (err) {
    goToError(err);
  } finally {
    pendingBot.value = false;
  }
};

onMounted(() => {
  resetProfileForm();
  // Данные уже есть — показываем сразу, обновляем тихо
  refreshIdentity()
    .then(() => {
      if (!profileChanged.value) resetProfileForm();
    })
    .catch(() => {});
  if (route.query.tg_token) getTelegramAccount(route.query.tg_token);
});
</script>
