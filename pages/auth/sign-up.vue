<template>
    <authCard :pending="pending">
        <template v-slot:header_content>
            <h2>{{ $t("pages.register.title") }}</h2>
        </template>
        <template v-slot:body_content>
            <div class="form-group-border active mb-5">
                <i class="pi pi-user"></i>
                <input autoComplete="user-first-name" v-model="first_name" type="text" placeholder=" " />
                <label :class="{ 'label-error': errors.first_name }">
                    {{ errors.first_name ? errors.first_name[0] : $t("form.first_name") }}
                </label>
            </div>

            <div class="form-group-border active mb-5">
                <i class="pi pi-user"></i>
                <input autoComplete="user-first-name" v-model="last_name" type="text" placeholder=" " />
                <label :class="{ 'label-error': errors.last_name }">
                    {{ errors.last_name ? errors.last_name[0] : $t("form.last_name") }}
                </label>
            </div>

            <div class="form-group-border active mb-5">
                <i class="pi pi-at"></i>
                <input autoComplete="register-email" v-model="email" type="text" placeholder=" " />
                <label :class="{ 'label-error': errors.email }">
                    {{ errors.email ? errors.email[0] : $t("form.email") }}
                </label>
            </div>

            <div class="form-group-border active mb-5">
                <i class="pi pi-lock"></i>
                <input autoComplete="register-password" v-model="password" :type="showPassword ? 'text' : 'password'"
                    placeholder=" " />
                <label :class="{ 'label-error': errors.password }">
                    {{ errors.password ? errors.password[0] : $t("form.password") }}
                </label>
                <button @click="showPassword = !showPassword" class="show-password">
                    <i class="pi pi-eye" v-if="showPassword"></i>
                    <i class="pi pi-eye-slash" v-else></i>
                </button>
            </div>

            <div class="form-group-border active mb-5">
                <i class="pi pi-lock"></i>
                <input autoComplete="register-password-confirmation" v-model="password_confirmation" :type="showPassword ? 'text' : 'password'"
                    placeholder=" " />
                <label :class="{ 'label-error': errors.password_confirmation }">
                    {{ errors.password_confirmation ? errors.password_confirmation[0] : $t("form.password_confirmation") }}
                </label>
            </div>

            <p>{{ $t("pages.register.have_an_account") }} 
                <nuxt-link :to="localePath('/auth/sign-in')">
                    {{ $t('pages.login.sign_in') }}
                </nuxt-link>
            </p>

            <button class="btn btn-primary" @click="signUp">
                <i class="pi pi-arrow-right"></i>
                {{ $t("continue") }}
            </button>
        </template>
    </authCard>
</template>

<script setup>
import authCard from "../../components/authCard.vue";
import { useRouter } from 'vue-router'

const { t, localeProperties } = useI18n();
const { $axiosPlugin } = useNuxtApp();
const router = useRouter();

const pending = ref(false);
const errors = ref([]);
const showPassword = ref(false);

const first_name = ref("");
const last_name = ref("");
const email = ref("");
const password = ref("");
const password_confirmation = ref("");

useHead({
    title: t("pages.register.title"),
    meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
    layout: "auth",
    middleware: ["sanctum:guest"],
});

onMounted(() => { });

async function signUp() {
    pending.value = true;
    await $axiosPlugin.post('/auth/register', {
        first_name: first_name.value, 
        last_name: last_name.value, 
        email: email.value, 
        password: password.value, 
        password_confirmation: password_confirmation.value,
        lang: localeProperties.value.code
    }).then((res) => {
        router.push('/auth/sign-in')
    }).catch((err) => {
        errors.value = err.response.data;
        pending.value = false;
        return;
    });
}
</script>