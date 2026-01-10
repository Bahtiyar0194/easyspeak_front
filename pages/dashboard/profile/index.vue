<template>
  <template v-if="authUser">
    <loader
      v-if="pending"
      :className="'full-overlay'"
      :showPendingText="true"
    />
    <div class="col-span-12">
      <h2 class="mb-0">{{ authUser.last_name }} {{ authUser.first_name }}</h2>
    </div>

    <div class="col-span-12 md:col-span-6 lg:col-span-4">
      <div class="card p-4 rounded-xl">
        <div class="flex gap-x-2 items-center">
          <i class="pi pi-phone text-corp text-4xl"></i>
          <div>
            <p class="mb-0 text-xs text-inactive">{{ $t("form.phone") }}:</p>
            <b>{{ authUser.phone }}</b>
          </div>
        </div>
      </div>
    </div>
    <div class="col-span-12 md:col-span-6 lg:col-span-4">
      <div class="card p-4 rounded-xl">
        <div class="flex gap-x-2 items-center">
          <i class="pi pi-at text-corp text-4xl"></i>
          <div>
            <p class="mb-0 text-xs text-inactive">{{ $t("form.email") }}:</p>
            <b>{{ authUser.email }}</b>
          </div>
        </div>
      </div>
    </div>
    <div class="col-span-12 md:col-span-6 lg:col-span-4">
      <div class="card p-4 rounded-xl">
        <div class="flex gap-x-2 items-center">
          <i class="pi pi-telegram text-corp text-4xl"></i>
          <div>
            <p class="mb-0 text-xs text-inactive">Telegram:</p>
            <button
              v-if="authUser.telegram"
              @click="disconnectBotModalIsVisible = true"
            >
              <b>{{ $t("telegram.disconnect.disconnect") }}</b>
            </button>
            <a
              v-else
              target="_blank"
              :href="`https://t.me/${config.public.telegramBotName}?start=${localeProperties.code}`"
              ><b>{{ $t("telegram.connect.connect") }}</b></a
            >
          </div>
        </div>
      </div>
    </div>

    <modal
      :show="connectBotModalIsVisible"
      :onClose="() => (connectBotModalIsVisible = false)"
      :className="'modal-xl'"
      :showLoader="pendingBotModal"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4>{{ $t("telegram.connect.title") }}</h4>
      </template>
      <template v-if="telegramAccount" v-slot:body_content>
        <div class="custom-grid">
          <div class="col-span-12">
            <p v-if="!authUser.telegram">
              {{
                $t("telegram.message_1", {
                  auth_user_name: `${authUser.last_name} ${authUser.first_name} - ${authUser.email}`,
                  tg_user_name: telegramAccount.user_name,
                })
              }}
            </p>
            <p v-else>
              {{
                $t("telegram.message_2", {
                  auth_user_name: `${authUser.last_name} ${authUser.first_name} - ${authUser.email}`,
                  old_tg_user_name: authUser.telegram.user_name,
                  new_tg_user_name: telegramAccount.user_name,
                })
              }}
            </p>
            <div class="btn-wrap justify-end">
              <button class="btn btn-primary" @click="connectToTelegramBot()">
                <i class="pi pi-telegram"></i>
                {{ $t("telegram.connect.connect") }}
              </button>
              <button
                class="btn btn-light"
                @click="connectBotModalIsVisible = false"
              >
                <i class="pi pi-ban"></i>
                {{ $t("telegram.cancel") }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </modal>

    <modal
      :show="disconnectBotModalIsVisible"
      :onClose="() => (disconnectBotModalIsVisible = false)"
      :className="'modal-xl'"
      :showLoader="pendingBotModal"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4>{{ $t("telegram.disconnect.title") }}</h4>
      </template>
      <template v-if="authUser.telegram" v-slot:body_content>
        <div class="custom-grid">
          <div class="col-span-12">
            <p>
              {{
                $t("telegram.disconnect.confirm", {
                  auth_user_name: `${authUser.last_name} ${authUser.first_name} - ${authUser.email}`,
                  tg_user_name: authUser.telegram.user_name,
                })
              }}
            </p>
            <div class="btn-wrap justify-end">
              <button
                class="btn btn-outline-danger"
                @click="disconnectTelegramBot()"
              >
                <i class="pi pi-sign-out"></i>
                {{ $t("telegram.disconnect.disconnect") }}
              </button>
              <button
                class="btn btn-light"
                @click="disconnectBotModalIsVisible = false"
              >
                <i class="pi pi-ban"></i>
                {{ $t("telegram.cancel") }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </modal>
  </template>
</template>

<script setup>
import { useRoute, useRouter } from "nuxt/app";
import modal from "../../../components/ui/modal.vue";
import loader from "../../../components/ui/loader.vue";
const route = useRoute();
const router = useRouter();
const authUser = useSanctumUser();
const { refreshIdentity } = useSanctumAuth();
const { t, localeProperties } = useI18n();
const { $axiosPlugin } = useNuxtApp();
const config = useRuntimeConfig();
const connectBotModalIsVisible = ref(false);
const disconnectBotModalIsVisible = ref(false);
const pending = ref(true);
const pendingBotModal = ref(false);
const telegramAccount = ref([]);

useHead({
  title: t("pages.profile.title"),
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const getTelegramAccount = async () => {
  try {
    const response = await $axiosPlugin.get(
      "telegram/get/" + route.query.tg_token
    );

    telegramAccount.value = response.data;
    connectBotModalIsVisible.value = true;
    pending.value = false;
  } catch (err) {
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
  }
};

const connectToTelegramBot = async () => {
  pendingBotModal.value = true;
  try {
    const response = await $axiosPlugin.post(
      "telegram/connect/" + route.query.tg_token
    );

    refreshIdentity().then(() => {
      pendingBotModal.value = false;
      connectBotModalIsVisible.value = false;
    });
  } catch (err) {
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
  }
};

const disconnectTelegramBot = async () => {
  pendingBotModal.value = true;
  try {
    const response = await $axiosPlugin.post("telegram/disconnect");

    refreshIdentity().then(() => {
      pendingBotModal.value = false;
      disconnectBotModalIsVisible.value = false;
    });
  } catch (err) {
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
  }
};

onMounted(() => {
  refreshIdentity().then(() => {
    if (route.query.tg_token) {
      getTelegramAccount();
    } else {
      pending.value = false;
    }
  });
});
</script>
