<template>
    <authCard :pending="pending">
        <template v-slot:header_content>
            <h2>{{ $t("pages.login.title") }}</h2>
        </template>
        <template v-slot:body_content>
            <p v-if="errors.auth_failed" class="text-danger mb-6">{{ errors.auth_failed }}</p>
            <div class="form-group-border active mb-5">
                <i class="pi pi-at"></i>
                <input autoComplete="login-email" v-model="email" type="text" placeholder=" " />
                <label :class="{ 'label-error': errors.email }">
                    {{ errors.email ? errors.email[0] : $t("form.email") }}
                </label>
            </div>

            <div class="form-group-border active mb-5">
                <i class="pi pi-lock"></i>
                <input autoComplete="login-password" v-model="password" :type="showPassword ? 'text' : 'password'"
                    placeholder=" " />
                <label :class="{ 'label-error': errors.password }">
                    {{ errors.password ? errors.password[0] : $t("form.password") }}
                </label>
                <button @click="showPassword = !showPassword" class="show-password">
                    <i class="pi pi-eye" v-if="showPassword"></i>
                    <i class="pi pi-eye-slash" v-else></i>
                </button>
            </div>

            <p>{{ $t("pages.login.forgot_password") }}
                <nuxt-link :to="localePath('/auth/login')">
                    {{ $t('pages.login.password_recovery') }}
                </nuxt-link>
            </p>
            <p>{{ $t("pages.login.dont_have_an_account") }} 
                <nuxt-link :to="localePath('/auth/register')">
                    {{ $t('pages.register.title') }}
                </nuxt-link>
            </p>

            <button class="btn btn-primary" @click="signIn">
                <i class="pi pi-arrow-right"></i>
                {{ $t("continue") }}
            </button>
        </template>
    </authCard>
</template>

<script setup>
import authCard from "../../components/authCard.vue";
const { t, localeProperties } = useI18n();
const { login } = useSanctumAuth();

const pending = ref(false);
const errors = ref([]);
const showPassword = ref(false);

const email = ref("");
const password = ref("");

useHead({
    title: t("pages.login.title"),
    meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
    layout: "auth",
    middleware: ["sanctum:guest"],
});

onMounted(() => { });

async function signIn() {
    pending.value = true;
    try {
        await login({
            lang: localeProperties.value.code,
            email: email.value,
            password: password.value,
        });
    } catch (err) {
        if (err.response.status) {
            errors.value = err.response._data;
            pending.value = false;
            return;
        }
    }
}
</script>