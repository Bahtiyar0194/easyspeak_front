<template>
    <dropdownMenu :dropdown-arrow="true">
        <template v-slot:btn_content>
            {{ localeProperties.short_name }}
        </template>

        <template v-slot:menu_content>
            <li v-for="l in locales" :key="l.code">
                <button @click="changeLocale(l.code)">
                    {{ l.name }}
                </button>
            </li>
        </template>
    </dropdownMenu>
</template>
<script setup>
import { useNuxtApp } from 'nuxt/app';
import dropdownMenu from './dropdownMenu';
import { useRouter } from 'nuxt/app';


const { localeProperties, locales, setLocale, } = useI18n();
const authUser = useSanctumUser();
const router = useRouter();
//const { refreshIdentity } = useSanctumAuth();
const { $axiosPlugin } = useNuxtApp();

const changeLocale = async (value) => {
    setLocale(value);

    if (authUser.value) {
        await $axiosPlugin.post('auth/change_language/' + value)
            .then(response => {
                window.location.reload();
                console.log(123)
                //refreshIdentity();
            }).catch(err => {
                if (err.response) {
                    router.push({
                        path: '/error',
                        query: {
                            status: err.response.status,
                            message: err.response.data.message,
                            url: err.request.responseURL,
                        }
                    });
                }
                else {
                    router.push('/error');
                }
            });
    }
}
</script>