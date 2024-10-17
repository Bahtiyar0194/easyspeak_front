<template>
    <div class="custom-grid">
        <div class="col-span-12">
            <div class="btn-wrap">
                <button @click="showHideRequestSearchFilter" class="btn btn-light">
                    <i class="pi pi-search"></i>
                    <span>{{ searchFilter === true ? $t("hide_search_filter") : $t("show_search_filter") }}</span>
                </button>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-3" :class="searchFilter ? 'block' : 'hidden'">
            <stickyBox>
                <div class="card p-4">
                    <h5>{{ $t("pages.requests.search_filter") }}</h5>
                    <form @submit.prevent="debounceReset" ref="searchFormRef">
                        <div class="custom-grid">
                            <div class="col-span-12">
                                <div class="form-group-border select active label-active">
                                    <i class="pi pi-file"></i>
                                    <select name="request_type_id" @change="debounceRequests">
                                        <option selected value="">{{ $t("not_specified") }}</option>
                                        <option v-for="request_type in attributes.request_types"
                                            :key="request_type.request_type_id"
                                            :value="request_type.request_type_id">
                                            {{ request_type.request_type_name }}</option>
                                    </select>
                                    <label>{{ $t("pages.requests.request_type") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-user"></i>
                                    <input type="text" name="operator" placeholder=" " @input="debounceRequests" />
                                    <label>{{ $t("operator") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-pencil"></i>
                                    <textarea name="description" placeholder=" " @input="debounceRequests"></textarea>
                                    <label>{{ $t("pages.requests.description") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-calendar"></i>
                                    <input type="date" name="created_at_from" @input="debounceRequests"
                                        placeholder=" " />
                                    <label>{{ $t("created_at_from") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-calendar"></i>
                                    <input type="date" name="created_at_to" @input="debounceRequests"
                                        placeholder=" " />
                                    <label>{{ $t("created_at_to") }}</label>
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
            <template v-if="requests.data?.length > 0">
                <div class="table table-sm selectable">
                    <loader v-if="pending" class="overlay" />
                    <table ref="tableRef">
                        <thead>
                            <tr>
                                <th>{{ $t("pages.requests.request_type") }}</th>
                                <th>{{ $t("operator") }}</th>
                                <th>{{ $t("created_at") }}</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="(request, index) in requests.data" :key="index"
                                @click="getRequest(request.user_request_id)">
                                <td>{{ request.request_type_name }}</td>
                                <td>
                                    <div class="flex gap-x-2 items-center">
                                        <userAvatar :padding="0.5" :className="'w-6 h-6'" :user="{
                                            last_name: request.operator_last_name,
                                            first_name: request.operator_first_name,
                                            avatar: request.operator_avatar
                                        }" />
                                        {{ request.operator_last_name }} {{ request.operator_first_name }}
                                    </div>
                                </td>
                                <td>{{ new Date(request.created_at).toLocaleString() }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="btn-wrap mt-6">
                    <pagination :items="requests" :setItems="getRequests" :onSelect="(count) => perPage = count" />
                    <client-only>
                        <tableToExcelButton :table="tableRef"
                            :fileName="$t('pages.requests.title') + ' - ' + new Date().toLocaleString()"
                            :className="'btn-sm'" />
                    </client-only>
                </div>
            </template>

            <alert v-else :className="'light'">
                <loader v-if="pending" class="overlay" />
                <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
            </alert>
        </div>

        <modal :show="requestModalIsVisible" :onClose="() => requestModalIsVisible = false" :className="'modal-lg'"
            :showLoader="pendingRequest" :closeOnClickSelf="true">
            <template v-slot:header_content>
                <h4>{{ currentRequest?.request_type_name }}</h4>
            </template>
            <template v-if="currentRequest" v-slot:body_content>
                <div class="flex flex-col gap-y-3">

                    <div class="flex gap-x-2 items-center">
                        <p class="mb-0"><span class="text-inactive">{{ $t("operator") }}</span>:</p>
                        <userTag :user="{
                            last_name: currentRequest.operator_last_name,
                            first_name: currentRequest.operator_first_name,
                            avatar: currentRequest.operator_avatar
                        }" />
                    </div>
                    <p class="mb-0"><span class="text-inactive">{{ $t("created_at") }}</span>: <b>{{
                        new Date(currentRequest.created_at).toLocaleString() }}</b></p>
                    <div class="list-data" v-html="currentRequest.description"></div>
                </div>
            </template>
        </modal>
    </div>
</template>
<script setup>
import { useRouter } from 'nuxt/app';
import modal from '../../ui/modal.vue';
import loader from '../../ui/loader.vue';
import alert from '../../ui/alert.vue';
import userAvatar from '../../ui/userAvatar.vue';
import userTag from '../../ui/userTag.vue';
import stickyBox from '../../ui/stickyBox.vue';
import pagination from '../../ui/pagination.vue';
import tableToExcelButton from '../../ui/tableToExcelButton.vue';
import { debounceHandler } from '../../utils/debounceHandler';

const router = useRouter();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const pending = ref(true);
const pendingRequest = ref(false);
const tableRef = ref(null);
const searchFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(10);
const requests = ref([]);
const currentRequest = ref(null);
const attributes = ref([]);

const requestModalIsVisible = ref(false);

const getRequests = async (url) => {
    pending.value = true;

    const formData = new FormData(searchFormRef.value);
    formData.append('per_page', perPage.value);

    if (!url) {
        url = 'requests/get';
    }

    await $axiosPlugin.post(url, formData)
        .then(response => {
            requests.value = response.data;
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

const getRequest = async (user_request_id) => {
    pendingRequest.value = true;
    requestModalIsVisible.value = true;
    await $axiosPlugin.get('requests/get/' + user_request_id)
        .then(response => {
            errors.value = [];
            currentRequest.value = response.data;
            pendingRequest.value = false
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

const getRequestAttributes = async () => {
    pending.value = true;
    await $axiosPlugin.get('requests/get_request_attributes')
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

const showHideRequestSearchFilter = () => {
    if (searchFilter.value === true) {
        searchFilter.value = false;
        resetRequestSearchFilter();
    }
    else {
        searchFilter.value = true;
    }
}

const resetRequestSearchFilter = () => {
    searchFormRef.value.reset();
    getRequests();
}

const debounceRequests = debounceHandler(() => getRequests(), 1000);
const debounceReset = debounceHandler(() => resetRequestSearchFilter(), 500);

onMounted(() => {
    // getRequestAttributes();
    // getRequests();
});
</script>