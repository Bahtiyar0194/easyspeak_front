<template>
    <div class="custom-grid">
        <div class="col-span-12">
            <div class="btn-wrap">
                <button @click="showHideOperationSearchFilter" class="btn btn-light">
                    <i class="pi pi-search"></i>
                    <span>{{ searchFilter === true ? $t("hide_search_filter") : $t("show_search_filter") }}</span>
                </button>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-3" :class="searchFilter ? 'block' : 'hidden'">
            <stickyBox>
                <div class="card p-4">
                    <h5>{{ $t("pages.operations.search_filter") }}</h5>
                    <form @submit.prevent="debounceReset" ref="searchFormRef">
                        <div class="custom-grid">
                            <div class="col-span-12">
                                <multipleSelect :className="'form-group-border select active label-active'"
                                    :icon="'pi pi-file'" :label="$t('pages.operations.operation_type')"
                                    :items="attributes.operation_types" :optionName="'operations[]'"
                                    :optionValue="'operation_type_id'" :optionLabel="'operation_type_name'"
                                    :onChange="debounceOperations" />
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-user"></i>
                                    <input type="text" name="operator" placeholder=" " @input="debounceOperations" />
                                    <label>{{ $t("operator") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-pencil"></i>
                                    <textarea name="description" placeholder=" " @input="debounceOperations"></textarea>
                                    <label>{{ $t("pages.operations.description") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-calendar"></i>
                                    <input type="date" name="created_at_from" @input="debounceOperations"
                                        placeholder=" " />
                                    <label>{{ $t("created_at_from") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-calendar"></i>
                                    <input type="date" name="created_at_to" @input="debounceOperations"
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
            <template v-if="operations.data?.length > 0">
                <div class="table table-sm selectable">
                    <loader v-if="pending" class="overlay" />
                    <table ref="tableRef">
                        <thead>
                            <tr>
                                <sortTableHead v-for="(head, index) in operationsTableHeads" :key="index"
                                    :title="head.title" :keyName="head.keyName" :sortKey="sortKey"
                                    :sortDirection="sortDirection" :sortHandler="debounceOperations"
                                    @update:sortKey="sortKey = $event" @update:sortDirection="sortDirection = $event" />
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="(operation, index) in operations.data" :key="index"
                                @click="getOperation(operation.user_operation_id)">
                                <td>{{ operation.operation_type_name }}</td>
                                <td>
                                    <div class="flex gap-x-2 items-center">
                                        <userAvatar :padding="0.5" :className="'w-6 h-6'" :user="{
                                            last_name: operation.operator_last_name,
                                            first_name: operation.operator_first_name,
                                            avatar: operation.operator_avatar
                                        }" />
                                        {{ operation.operator_last_name }} {{ operation.operator_first_name }}
                                    </div>
                                </td>
                                <td>{{ new Date(operation.created_at).toLocaleString() }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="btn-wrap mt-6">
                    <pagination :items="operations" :setItems="getOperations" :onSelect="(count) => perPage = count" />
                    <client-only>
                        <tableToExcelButton :table="tableRef"
                            :fileName="$t('pages.operations.title') + ' - ' + new Date().toLocaleString()"
                            :className="'btn-sm'" />
                    </client-only>
                </div>
            </template>

            <alert v-else :className="'light'">
                <loader v-if="pending" class="overlay" />
                <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
            </alert>
        </div>

        <modal :show="operationModalIsVisible" :onClose="() => operationModalIsVisible = false" :className="'modal-lg'"
            :showLoader="pendingOperation" :closeOnClickSelf="true">
            <template v-slot:header_content>
                <h4>{{ currentOperation?.operation_type_name }}</h4>
            </template>
            <template v-if="currentOperation" v-slot:body_content>
                <div class="flex flex-col gap-y-3">

                    <div class="flex gap-x-2 items-center">
                        <p class="mb-0"><span class="text-inactive">{{ $t("operator") }}</span>:</p>
                        <userTag :user="{
                            last_name: currentOperation.operator_last_name,
                            first_name: currentOperation.operator_first_name,
                            avatar: currentOperation.operator_avatar
                        }" />
                    </div>
                    <p class="mb-0"><span class="text-inactive">{{ $t("created_at") }}</span>: <b>{{
                        new Date(currentOperation.created_at).toLocaleString() }}</b></p>
                    <div class="list-data" v-html="currentOperation.description"></div>
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
import multipleSelect from '../../ui/multipleSelect.vue';
import sortTableHead from '../../ui/sortTableHead.vue';

const router = useRouter();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const { t } = useI18n();
const pending = ref(true);
const pendingOperation = ref(false);
const tableRef = ref(null);
const searchFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(10);
const operations = ref([]);
const currentOperation = ref(null);
const attributes = ref([]);

const operationModalIsVisible = ref(false);

const sortKey = ref('user_operations.created_at'); // Ключ сортировки
const sortDirection = ref('asc'); // Направление сортировки: asc или desc

const operationsTableHeads = [
    {
        title: t('pages.operations.operation_type'),
        keyName: 'types_of_operations_lang.operation_type_name'
    },
    {
        title: t('operator'),
        keyName: 'operator.last_name'
    },
    {
        title: t('created_at'),
        keyName: 'user_operations.created_at'
    }
];

const getOperations = async (url) => {
    pending.value = true;

    const formData = new FormData(searchFormRef.value);
    formData.append('per_page', perPage.value);
    formData.append('sort_key', sortKey.value);  // Добавляем ключ сортировки
    formData.append('sort_direction', sortDirection.value);  // Добавляем направление сортировки

    if (!url) {
        url = 'operations/get';
    }

    await $axiosPlugin.post(url, formData)
        .then(response => {
            operations.value = response.data;
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

const getOperation = async (user_operation_id) => {
    pendingOperation.value = true;
    operationModalIsVisible.value = true;
    await $axiosPlugin.get('operations/get/' + user_operation_id)
        .then(response => {
            errors.value = [];
            currentOperation.value = response.data;
            pendingOperation.value = false
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

const getOperationAttributes = async () => {
    pending.value = true;
    await $axiosPlugin.get('operations/get_operation_attributes')
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

const showHideOperationSearchFilter = () => {
    if (searchFilter.value === true) {
        searchFilter.value = false;
        resetOperationSearchFilter();
    }
    else {
        searchFilter.value = true;
    }
}

const resetOperationSearchFilter = () => {
    searchFormRef.value.reset();
    getOperations();
}

const debounceOperations = debounceHandler(() => getOperations(), 1000);
const debounceReset = debounceHandler(() => resetOperationSearchFilter(), 500);

onMounted(() => {
    getOperationAttributes();
    getOperations();
});
</script>