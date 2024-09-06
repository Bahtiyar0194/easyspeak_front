<template>
    <dropdownMenu :dropdown-arrow="true">
        <template v-slot:btn_content>
            <div class="flex items-center gap-1">
                <userAvatar :padding="0.5" :className="'w-8 h-8'" />
                <span class="font-medium hidden sm:block">{{ user?.first_name }}</span>
            </div>
        </template>

        <template v-slot:menu_content>
            <li>
                <button @click="logout()">
                    <i class="pi pi-user"></i>
                    <span>{{ $t('pages.profile.title') }}</span>
                </button>
            </li>
            <li>
                <button @click="logout()">
                    <i class="pi pi-sign-out"></i>
                    {{ $t('pages.login.sign_out') }}
                </button>
            </li>
        </template>
    </dropdownMenu>
</template>
<script setup>
import dropdownMenu from "./ui/dropdownMenu.vue";
import userAvatar from "./ui/userAvatar.vue";

const user = useSanctumUser();
const { logout, refreshIdentity } = useSanctumAuth();
const { t } = useI18n();

</script>