<template>
    <authCard :pending="pending">
        <template v-slot:header_content>
            <h2>{{ $t("pages.register.title") }}</h2>
        </template>
        <template v-slot:body_content>
            <form @submit.prevent="register" ref="formRef">
                <client-only>
                    <div v-if="school && !school.school_domain">
                        <div class="form-group-border active mb-5">
                            <i class="pi pi-graduation-cap"></i>
                            <input type="text" name="school_name" placeholder=" " />
                            <label :class="{ 'label-error': errors.school_name }">
                                {{ errors.school_name ? errors.school_name[0] : $t("form.school_name") }}
                            </label>
                        </div>
                        <div class="form-group-border active mb-5">
                            <i class="pi pi-globe"></i>
                            <input type="text" name="school_domain" placeholder=" " />
                            <label :class="{ 'label-error': errors.school_domain }">
                                {{ errors.school_domain ? errors.school_domain[0] : $t("form.school_domain") }}
                            </label>
                        </div>
                    </div>
                </client-only>
                <div class="form-group-border active mb-5">
                    <i class="pi pi-user"></i>
                    <input autoComplete="user-first-name" name="first_name" type="text" placeholder=" " />
                    <label :class="{ 'label-error': errors.first_name }">
                        {{ errors.first_name ? errors.first_name[0] : $t("form.first_name") }}
                    </label>
                </div>

                <div class="form-group-border active mb-5">
                    <i class="pi pi-user"></i>
                    <input autoComplete="user-last-name" name="last_name" type="text" placeholder=" " />
                    <label :class="{ 'label-error': errors.last_name }">
                        {{ errors.last_name ? errors.last_name[0] : $t("form.last_name") }}
                    </label>
                </div>

                <div class="form-group-border active mb-5">
                    <i class="pi pi-mobile"></i>
                    <input autoComplete="register-phone" name="phone" v-mask="'+7 (###) ###-####'" placeholder=" " />
                    <label :class="{ 'label-error': errors.phone }">
                        {{ errors.phone ? errors.phone[0] : $t("form.phone") }}
                    </label>
                </div>

                <div class="form-group-border active mb-5">
                    <i class="pi pi-at"></i>
                    <input autoComplete="register-email" name="email" type="text" placeholder=" " />
                    <label :class="{ 'label-error': errors.email }">
                        {{ errors.email ? errors.email[0] : $t("form.email") }}
                    </label>
                </div>

                <div class="form-group-border active mb-5">
                    <i class="pi pi-lock"></i>
                    <input autoComplete="register-password" name="password" :type="showPassword ? 'text' : 'password'"
                        placeholder=" " />
                    <label :class="{ 'label-error': errors.password }">
                        {{ errors.password ? errors.password[0] : $t("form.password") }}
                    </label>
                    <button type="button" @click="showPassword = !showPassword" class="show-password">
                        <i class="pi pi-eye" v-if="showPassword"></i>
                        <i class="pi pi-eye-slash" v-else></i>
                    </button>
                </div>

                <div class="form-group-border active mb-5">
                    <i class="pi pi-lock"></i>
                    <input autoComplete="register-password-confirmation" name="password_confirmation"
                        :type="showPassword ? 'text' : 'password'" placeholder=" " />
                    <label :class="{ 'label-error': errors.password_confirmation }">
                        {{ errors.password_confirmation ? errors.password_confirmation[0] :
                            $t("form.password_confirmation") }}
                    </label>
                </div>

                <p>{{ $t("pages.register.have_an_account") }}
                    <nuxt-link :to="localePath('/auth/login')">
                        {{ $t('pages.login.sign_in') }}
                    </nuxt-link>
                </p>

                <button class="btn btn-primary" type="submit">
                    <i class="pi pi-arrow-right"></i>
                    {{ $t("continue") }}
                </button>
            </form>
        </template>
    </authCard>
</template>

<script setup>
import authCard from "../../components/authCard.vue";
import { useRouter } from 'vue-router';
import { useCookie } from "nuxt/app";

const { t, localeProperties } = useI18n();
const { $axiosPlugin, $schoolPlugin } = useNuxtApp();
const router = useRouter();

const pending = ref(true);
const errors = ref([]);
const showPassword = ref(false);
const school = $schoolPlugin;

const formRef = ref(null);

useHead({
    title: t("pages.register.title"),
    meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
    layout: "auth",
    middleware: ["sanctum:guest"],
});

onMounted(() => {
    pending.value = false;
});

async function register() {
    pending.value = true;
    const formData = new FormData(formRef.value);
    formData.append('lang', localeProperties.value.code);

    if (school.value.school_domain) {
        formData.append('first_registration', false);
        formData.append('school_domain', school.value.school_domain);
    }
    else {
        formData.append('first_registration', true);
    }

    formData.append('first_registration', (school.value.school_domain ? false : true));

    await $axiosPlugin.post('/auth/register', formData).then((res) => {
        const subDomainCookie = useCookie('subdomain');
        subDomainCookie.value = res.data.school_domain;

        router.push('/auth/login');
    }).catch((err) => {
        errors.value = err.response.data;
        pending.value = false;
        return;
    });
}
</script>