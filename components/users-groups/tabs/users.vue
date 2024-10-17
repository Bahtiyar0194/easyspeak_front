<template>
    <div class="custom-grid">
        <div class="col-span-12">
            <div class="btn-wrap">
                <roleProvider :roles="[1, 2, 3]">
                    <button class="btn btn-outline-primary" @click="inviteModalIsVisible = true">
                        <i class="pi pi-user-plus"></i>
                        <span>{{ $t("invite") }}</span>
                    </button>
                </roleProvider>
                <button @click="showHideUserSearchFilter" class="btn btn-light">
                    <i class="pi pi-search"></i>
                    <span>{{ searchFilter === true ? $t("hide_search_filter") : $t("show_search_filter") }}</span>
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
                                <div class="form-group-border select active label-active">
                                    <i class="pi pi-hourglass"></i>
                                    <select name="status_type_id" @change="debounceUsers">
                                        <option selected value="">{{ $t("not_specified") }}</option>
                                        <option v-for="status in attributes.user_statuses" :key="status.status_type_id"
                                            :value="status.status_type_id">
                                            {{ status.status_type_name }}</option>
                                    </select>
                                    <label>{{ $t("pages.users.user_status") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <multipleSelect :className="'form-group-border select active label-active'"
                                    :icon="'pi pi-id-card'" :label="$t('pages.users.user_role')">
                                    <li v-for="(role, index) in attributes.user_roles" :key="index">
                                        <label class="custom-radio-checkbox">
                                            <input class="search_role_input" name="roles[]" :value="role.role_type_id"
                                                type="checkbox" :checked="false" @change="debounceUsers" />
                                            <span>{{ role.user_role_type_name }}</span>
                                        </label>
                                    </li>
                                </multipleSelect>
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
                                        <span>{{ $t("reset_search_filter") }}</span>
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
                <div class="table table-sm selectable">
                    <loader v-if="pending" class="overlay" />
                    <table ref="tableRef">
                        <thead>
                            <tr>
                                <th>{{ $t("form.last_name") }} {{ $t("form.first_name") }}</th>
                                <th>{{ $t("form.email") }}</th>
                                <th>{{ $t("form.phone") }}</th>
                                <th>{{ $t("registered_at") }}</th>
                                <th>{{ $t("status") }}</th>
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
                <div class="btn-wrap mt-6">
                    <pagination :items="users" :setItems="getUsers" :onSelect="(count) => perPage = count" />
                    <client-only>
                        <tableToExcelButton :table="tableRef"
                            :fileName="$t('pages.users.title') + ' - ' + new Date().toLocaleString()"
                            :className="'btn-sm'" />
                    </client-only>
                </div>
            </template>

            <alert v-else :className="'light'">
                <loader v-if="pending" class="overlay" />
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
                    <span>{{ $t("continue") }}</span>
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
                    <span><span class="text-inactive">{{ $t("form.email") }}</span> : {{ user.email }}</span>
                    <span><span class="text-inactive">{{ $t("form.phone") }}</span> : {{ user.phone }}</span>
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
                            <span>{{ $t("edit") }}</span>
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
                    <span>{{ $t("continue") }}</span>
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

const router = useRouter();
const errors = ref([]);
const { $axiosPlugin, $schoolPlugin } = useNuxtApp();
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

const getUsers = async (url) => {
    pending.value = true;

    const formData = new FormData(searchFormRef.value);
    formData.append('per_page', perPage.value);

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
    let roles = [];
    document.querySelectorAll('.invite_role_input:checked').forEach(role => {
        roles.push(parseInt(role.value));
    });

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