<template>
    <div class="custom-grid">
        <div class="col-span-12">
            <div class="btn-wrap">
                <roleProvider :roles="[1, 2, 3]">
                    <button class="btn btn-outline-primary" @click="inviteModalIsVisible = true">
                        <i class="pi pi-user-plus"></i>
                        {{ $t("invite") }}
                    </button>
                </roleProvider>
                <button @click="showHideUserSearchFilter" class="btn btn-light">
                    <i class="pi pi-search"></i>
                    {{ searchFilter === true ? $t("hide_search_filter") : $t("show_search_filter") }}
                </button>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-3" :class="searchFilter ? 'block' : 'hidden'">
            <stickyBox>
                <div class="card p-4">
                    <h5>{{ $t("pages.users.search_filter") }}</h5>
                    <form @submit.prevent="debounceReset" ref="searchFormRef">
                        <div class="custom-grid">
                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-user"></i>
                                    <input type="text" name="user" placeholder=" " @input="debounceUsers" />
                                    <label>{{ $t("form.last_name") }}, {{ $t("form.first_name") }}</label>
                                </div>
                            </div>
                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-at"></i>
                                    <input type="text" name="email" placeholder=" " @input="debounceUsers" />
                                    <label>{{ $t("form.email") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-mobile"></i>
                                    <input v-mask="'+7 (###) ###-####'" name="phone" placeholder=" "
                                        @input="debounceUsers" />
                                    <label>{{ $t("form.phone") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <multipleSelect :className="'form-group-border select active label-active'"
                                    :icon="'pi pi-hourglass'" :label="$t('pages.users.user_status')"
                                    :items="attributes.user_statuses" :optionName="'statuses[]'"
                                    :optionValue="'status_type_id'" :optionLabel="'status_type_name'"
                                    :onChange="debounceUsers" />
                            </div>

                            <div class="col-span-12">
                                <multipleSelect :className="'form-group-border select active label-active'"
                                    :icon="'pi pi-id-card'" :label="$t('pages.users.user_role')"
                                    :items="attributes.user_roles" :optionName="'roles[]'" :optionValue="'role_type_id'"
                                    :optionLabel="'user_role_type_name'" :onChange="debounceUsers" />
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-calendar"></i>
                                    <input type="date" name="created_at_from" @input="debounceUsers" placeholder=" " />
                                    <label>{{ $t("registered_at_from") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-calendar"></i>
                                    <input type="date" name="created_at_to" @input="debounceUsers" placeholder=" " />
                                    <label>{{ $t("registered_at_to") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <div class="btn-wrap">
                                    <button type="submit" class="btn btn-sm btn-outline-primary">
                                        <i class="pi pi-undo"></i>
                                        {{ $t("reset_search_filter") }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </stickyBox>
        </div>

        <div class="col-span-12" :class="searchFilter && 'lg:col-span-9'">
            <template v-if="users.data?.length > 0">
                <div class="table table-striped table-sm selectable">
                    <loader v-if="pending" :className="'overlay'" />
                    <table ref="tableRef">
                        <thead>
                            <tr>
                                <sortTableHead v-for="(head, index) in userTableHeads" :key="index" :title="head.title"
                                    :keyName="head.keyName" :sortKey="sortKey" :sortDirection="sortDirection"
                                    :sortType="head.sortType" :sortHandler="debounceUsers"
                                    @update:sortKey="sortKey = $event" @update:sortDirection="sortDirection = $event" />
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="user in users.data" :key="user.user_id" @click="getUser(user.user_id)">
                                <td>
                                    <div class="flex gap-x-2 items-center">
                                        <userAvatar :padding="0.5" :className="'w-6 h-6'" :user="user" />
                                        {{ user.last_name }} {{ user.first_name }}
                                    </div>
                                </td>
                                <td>{{ user.email }}</td>
                                <td>{{ user.phone }}</td>
                                <td>{{ new Date(user.created_at).toLocaleString() }}</td>
                                <td :class="user.status_color">{{ user.status_type_name }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="btn-wrap mt-4">
                    <pagination :items="users" :setItems="getUsers" :onSelect="(count) => perPage = count" />
                    <!-- <client-only>
                        <tableToExcelButton :table="tableRef"
                            :fileName="$t('pages.users.title') + ' - ' + new Date().toLocaleString()"
                            :className="'btn-sm'" />
                    </client-only> -->
                </div>
            </template>

            <alert v-else :className="'light'">
                <loader v-if="pending" :className="'overlay'" />
                <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
            </alert>
        </div>
    </div>

    <modal :show="inviteModalIsVisible" :onClose="() => closeInviteModal()" :className="'modal-lg'"
        :showLoader="pendingInvite" :closeOnClickSelf="false">
        <template v-slot:header_content>
            <h4>{{ $t('pages.users.invite_user_title') }}</h4>
        </template>
        <template v-slot:body_content>
            <subscription v-if="school?.subscription_expired" />
            <form class="mt-2" v-else @submit.prevent="inviteUserSubmit" ref="inviteFormRef">
                <div class="custom-grid">
                    <div class="col-span-12">
                        <div class="form-group-border active">
                            <i class="pi pi-user"></i>
                            <input autoComplete="new-first-name" name="first_name" type="text" placeholder=" " />
                            <label :class="{ 'label-error': errors.first_name }">
                                {{ errors.first_name ? errors.first_name[0] : $t("form.first_name") }}
                            </label>
                        </div>
                    </div>
                    <div class="col-span-12">
                        <div class="form-group-border active">
                            <i class="pi pi-user"></i>
                            <input autoComplete="new-last-name" name="last_name" type="text" placeholder=" " />
                            <label :class="{ 'label-error': errors.last_name }">
                                {{ errors.last_name ? errors.last_name[0] : $t("form.last_name") }}
                            </label>
                        </div>
                    </div>
                    <div class="col-span-12">
                        <div class="form-group-border active">
                            <i class="pi pi-at"></i>
                            <input autoComplete="new-email" name="email" type="text" placeholder=" " />
                            <label :class="{ 'label-error': errors.email }">
                                {{ errors.email ? errors.email[0] : $t("form.email") }}
                            </label>
                        </div>
                    </div>
                    <div class="col-span-12">
                        <div class="form-group-border active">
                            <i class="pi pi-mobile"></i>
                            <input autoComplete="new-phone" name="phone" v-mask="'+7 (###) ###-####'" placeholder=" " />
                            <label :class="{ 'label-error': errors.phone }">
                                {{ errors.phone ? errors.phone[0] : $t("form.phone") }}
                            </label>
                        </div>
                    </div>
                </div>

                <div class="mt-2">
                    <label class="label-focus" :class="errors.roles_count && 'danger'">{{ errors.roles_count ?
                        errors.roles_count[0] : $t("pages.users.select_user_roles") }}</label>

                    <div class="btn-wrap mt-2">
                        <label v-for="role in attributes.user_roles" :key="role.role_type_id"
                            class="custom-radio-checkbox">
                            <input class="invite_role_input" name="roles[]" :value="role.role_type_id" type="checkbox"
                                :checked="false" />
                            <span>{{ role.user_role_type_name }}</span>
                        </label>
                    </div>
                </div>

                <button class="btn btn-primary mt-4" type="submit">
                    <i class="pi pi-check"></i>
                    {{ $t("continue") }}
                </button>
            </form>
        </template>
    </modal>

    <modal :show="userModalIsVisible" :onClose="() => userModalIsVisible = false" :className="'modal-lg'"
        :showLoader="pendingUser" :closeOnClickSelf="true">
        <template v-slot:header_content>
            <h4>{{ $t('pages.users.user_info') }}</h4>
        </template>
        <template v-if="user" v-slot:body_content>
            <div class="flex flex-wrap gap-x-6 gap-y-4 whitespace-nowrap">
                <userAvatar :user="user" :className="'w-12 h-12 text-2xl'" />
                <div class="flex flex-col gap-y-4">
                    <h4 class="mb-0">{{ user.last_name }} {{ user.first_name }}</h4>
                    <span><span class="text-inactive">{{ $t("form.email") }}:</span> {{ user.email }}</span>
                    <span><span class="text-inactive">{{ $t("form.phone") }}:</span> {{ user.phone }}</span>
                </div>
                <div class="flex flex-col gap-y-4">
                    <div v-if="user.roles?.length > 1">
                        <p class="text-inactive mb-2">{{ $t("pages.users.user_role") }}:</p>
                        <div class="flex flex-wrap gap-2">
                            <div v-for="role in user.available_roles" :key="role.role_type_id"
                                class="badge badge-light">
                                <i class="pi pi-user mr-0.5 -mt-1"></i>
                                {{ role.user_role_type_name }}
                            </div>
                        </div>
                    </div>

                    <roleProvider :roles="[1, 2, 3]">
                        <button @click="getEditUser" class="btn btn-outline-primary">
                            <i class="pi pi-user-edit"></i>
                            {{ $t("edit") }}
                        </button>
                    </roleProvider>
                </div>
            </div>
        </template>
    </modal>

    <modal :show="editModalIsVisible" :onClose="() => editModalIsVisible = false" :className="'modal-lg'"
        :showLoader="pendingEdit" :closeOnClickSelf="false">
        <template v-slot:header_content>
            <h4>{{ $t('pages.users.edit_user_title') }}</h4>
        </template>
        <template v-if="user" v-slot:body_content>
            <form class="mt-2" @submit.prevent="editUserSubmit(user.user_id)" ref="editFormRef">
                <div class="custom-grid">
                    <div class="col-span-12">
                        <div class="form-group-border active">
                            <i class="pi pi-user"></i>
                            <input autoComplete="edit-first-name" name="first_name" v-model="user.first_name"
                                type="text" placeholder=" " />
                            <label :class="{ 'label-error': errors.first_name }">
                                {{ errors.first_name ? errors.first_name[0] : $t("form.first_name") }}
                            </label>
                        </div>
                    </div>
                    <div class="col-span-12">
                        <div class="form-group-border active">
                            <i class="pi pi-user"></i>
                            <input autoComplete="edit-last-name" name="last_name" v-model="user.last_name" type="text"
                                placeholder=" " />
                            <label :class="{ 'label-error': errors.last_name }">
                                {{ errors.last_name ? errors.last_name[0] : $t("form.last_name") }}
                            </label>
                        </div>
                    </div>
                    <div class="col-span-12">
                        <div class="form-group-border active">
                            <i class="pi pi-at"></i>
                            <input autoComplete="new-email" name="email" v-model="user.email" type="text"
                                placeholder=" " />
                            <label :class="{ 'label-error': errors.email }">
                                {{ errors.email ? errors.email[0] : $t("form.email") }}
                            </label>
                        </div>
                    </div>
                    <div class="col-span-12">
                        <div class="form-group-border active">
                            <i class="pi pi-mobile"></i>
                            <input autoComplete="new-phone" name="phone" v-model="user.phone"
                                v-mask="'+7 (###) ###-####'" placeholder=" " />
                            <label :class="{ 'label-error': errors.phone }">
                                {{ errors.phone ? errors.phone[0] : $t("form.phone") }}
                            </label>
                        </div>
                    </div>
                </div>

                <div class="mt-2">
                    <label class="label-focus" :class="errors.roles_count && 'danger'">{{ errors.roles_count ?
                        errors.roles_count[0] : $t("pages.users.user_role") }}</label>

                    <div class="btn-wrap mt-2">
                        <label v-for="role in user.roles" :key="role.role_type_id" class="custom-radio-checkbox">
                            <input class="edit_role_input" name="roles[]" :value="role.role_type_id" type="checkbox"
                                :checked="role.selected" />
                            <span>{{ role.user_role_type_name }}</span>
                        </label>
                    </div>
                </div>

                <button class="btn btn-primary mt-4" type="submit">
                    <i class="pi pi-check"></i>
                    {{ $t("continue") }}
                </button>
            </form>
        </template>
    </modal>
</template>

<script setup>
import { useRouter } from 'nuxt/app';
import modal from '../../ui/modal.vue';
import subscription from '../../ui/subscription.vue';
import loader from '../../ui/loader.vue';
import alert from '../../ui/alert.vue';
import userAvatar from '../../ui/userAvatar.vue';
import stickyBox from '../../ui/stickyBox.vue';
import pagination from '../../ui/pagination.vue';
import tableToExcelButton from '../../ui/tableToExcelButton.vue';
import { debounceHandler } from '../../../utils/debounceHandler';
import roleProvider from '../../ui/roleProvider.vue';
import multipleSelect from '../../ui/multipleSelect.vue';
import sortTableHead from '../../ui/sortTableHead.vue';

const router = useRouter();
const errors = ref([]);
const { $axiosPlugin, $schoolPlugin } = useNuxtApp();
const { t } = useI18n();
const pending = ref(true);
const pendingInvite = ref(false);
const pendingUser = ref(false);
const pendingEdit = ref(false);
const tableRef = ref(null);
const searchFormRef = ref(null);
const inviteFormRef = ref(null);
const editFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(10);
const authUser = useSanctumUser();
const { refreshIdentity } = useSanctumAuth();
const users = ref([]);
const user = ref(null);
const school = $schoolPlugin;
const attributes = ref([]);

const inviteModalIsVisible = ref(false);
const userModalIsVisible = ref(false);
const editModalIsVisible = ref(false);

const sortKey = ref('users.created_at'); // Ключ сортировки
const sortDirection = ref('asc'); // Направление сортировки: asc или desc

const userTableHeads = [
    {
        title: t('form.last_name') + ' ' + t('form.first_name'),
        keyName: 'users.last_name',
        sortType: 'alpha'
    },
    {
        title: t('form.email'),
        keyName: 'users.email',
        sortType: 'alpha'
    },
    {
        title: t('form.phone'),
        keyName: 'users.phone',
        sortType: 'numeric'
    },
    {
        title: t('registered_at'),
        keyName: 'users.created_at',
        sortType: 'numeric'
    },
    {
        title: t('status'),
        keyName: 'types_of_status_lang.status_type_name',
        sortType: 'alpha'
    }
];

const getUsers = async (url) => {
    pending.value = true;

    const formData = new FormData(searchFormRef.value);
    formData.append('per_page', perPage.value);
    formData.append('sort_key', sortKey.value);  // Добавляем ключ сортировки
    formData.append('sort_direction', sortDirection.value);  // Добавляем направление сортировки

    if (!url) {
        url = 'users/get';
    }

    await $axiosPlugin.post(url, formData)
        .then(response => {
            users.value = response.data;
            pending.value = false;
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

const getUser = async (user_id) => {
    pendingUser.value = true;
    userModalIsVisible.value = true;
    await $axiosPlugin.get('users/get/' + user_id)
        .then(response => {
            errors.value = [];
            user.value = response.data;

            if (authUser.value.user_id === user_id) {
                refreshIdentity();
            }
            pendingUser.value = false
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

const getEditUser = async () => {
    userModalIsVisible.value = false;
    editModalIsVisible.value = true;
}

const getUserAttributes = async () => {
    pending.value = true;
    await $axiosPlugin.get('users/get_user_attributes')
        .then(response => {
            attributes.value = response.data;
            pending.value = false;
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


const inviteUserSubmit = async () => {
    pendingInvite.value = true;
    const formData = new FormData(inviteFormRef.value);

    formData.append('roles_count', roles.length);
    formData.append('operation_type_id', 1);

    await $axiosPlugin.post('users/invite', formData)
        .then(response => {
            getUsers();
            closeInviteModal();
        }).catch(err => {
            if (err.response) {
                if (err.response.status == 422) {
                    errors.value = err.response.data;
                    pendingInvite.value = false;
                }
                else {
                    router.push({
                        path: '/error',
                        query: {
                            status: err.response.status,
                            message: err.response.data.message,
                            url: err.request.responseURL,
                        }
                    });
                }
            }
            else {
                router.push('/error');
            }
        });
}

const editUserSubmit = async (user_id) => {
    pendingEdit.value = true;

    const formData = new FormData(editFormRef.value);
    let roles = [];
    document.querySelectorAll('.edit_role_input:checked').forEach(role => {
        roles.push(parseInt(role.value));
    });

    formData.append('roles_count', roles.length);
    formData.append('operation_type_id', 2);
    formData.append('user_id', user_id);

    await $axiosPlugin.post('users/update', formData)
        .then(response => {
            errors.value = false;
            getUser(user_id);
            getUsers();
            pendingEdit.value = false;
            editModalIsVisible.value = false;
            userModalIsVisible.value = true;
        }).catch(err => {
            if (err.response) {
                if (err.response.status == 422) {
                    errors.value = err.response.data;
                    pendingEdit.value = false;
                }
                else {
                    router.push({
                        path: '/error',
                        query: {
                            status: err.response.status,
                            message: err.response.data.message,
                            url: err.request.responseURL,
                        }
                    });
                }
            }
            else {
                router.push('/error');
            }
        });
}

const closeInviteModal = () => {
    inviteModalIsVisible.value = false;
    pendingInvite.value = false;
    inviteFormRef.value.reset();
    errors.value = [];
}

const showHideUserSearchFilter = () => {
    if (searchFilter.value === true) {
        searchFilter.value = false;
        resetUserSearchFilter();
    }
    else {
        searchFilter.value = true;
    }
}

const resetUserSearchFilter = () => {
    searchFormRef.value.reset();
    getUsers();
}

const debounceUsers = debounceHandler(() => getUsers(), 1000);
const debounceReset = debounceHandler(() => resetUserSearchFilter(), 500);

onMounted(() => {
    getUserAttributes();
    getUsers();
});
</script>