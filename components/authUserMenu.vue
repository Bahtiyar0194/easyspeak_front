<template>
    <dropdownMenu :dropdown-arrow="true">
        <template v-slot:btn_content>
            <div class="flex items-center gap-1">
                <userAvatar :padding="0.5" :className="'w-8 h-8'" :user="authUser" />
                <span class="font-medium hidden sm:block">{{ authUser?.first_name }}</span>
            </div>
        </template>

        <template v-slot:menu_content>
            <li>
                <button>
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

const authUser = useSanctumUser();
const { logout } = useSanctumAuth();
</script>