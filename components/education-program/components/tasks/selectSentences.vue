<template>
    <div class="custom-grid">
        <div class="col-span-12">
            <button @click="showHideSentenceSearchFilter" class="btn btn-light">
                <i class="pi pi-search"></i>
                <span>{{ searchFilter === true ? $t("hide_search_filter") : $t("show_search_filter") }}</span>
            </button>
        </div>

        <div class="col-span-12 lg:col-span-3" :class="searchFilter ? 'block' : 'hidden'">
            <stickyBox>
                <div class="card p-4">
                    <h5>{{ $t("pages.sentences.search_filter") }}</h5>
                    <form @submit.prevent="debounceReset" ref="searchFormRef">
                        <div class="custom-grid">
                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-align-left"></i>
                                    <input type="text" name="sentence" placeholder=" " @input="debounceSentences" />
                                    <label>{{ $t("pages.sentences.sentence") }}</label>
                                </div>
                            </div>

                            <!-- <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="bi bi-braces"></i>
                                    <input type="text" name="transcription" placeholder=" " @input="debounceSentences" />
                                    <label>{{ $t("pages.sentences.transcription") }}</label>
                                </div>
                            </div> -->

                            <div class="col-span-12">
                                <multipleSelect :className="'form-group-border select active label-active'"
                                    :icon="'pi pi-book'" :label="$t('pages.courses.course')" :items="attributes.courses"
                                    :optionName="'courses[]'" :optionValue="'course_id'" :optionLabel="'course_name'"
                                    :onChange="debounceSentences" />
                            </div>

                            <div class="col-span-12">
                                <multipleSelect :className="'form-group-border select active label-active'"
                                    :icon="'pi pi-user'" :label="$t('operator')" :items="attributes.operators"
                                    :optionName="'operators[]'" :optionValue="'user_id'" :optionLabel="'full_name'"
                                    :avatar="true" :onChange="debounceSentences" />
                            </div>

                            <div class="col-span-12">
                                <multipleSelect :className="'form-group-border select active label-active'"
                                    :icon="'pi pi-hourglass'" :label="$t('status')" :items="attributes.statuses"
                                    :optionName="'statuses[]'" :optionValue="'status_type_id'"
                                    :optionLabel="'status_type_name'" :onChange="debounceSentences" />
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-calendar"></i>
                                    <input type="date" name="created_at_from" @input="debounceSentences"
                                        placeholder=" " />
                                    <label>{{ $t("created_at_from") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-calendar"></i>
                                    <input type="date" name="created_at_to" @input="debounceSentences"
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
            <template v-if="sentences.data?.length > 0">
                <div class="table table-sm selectable">
                    <loader v-if="pending" :className="'overlay'" />
                    <table ref="tableRef">
                        <thead>
                            <tr>
                                <sortTableHead v-for="(head, index) in sentenceTableHeads" :key="index"
                                    :title="head.title" :keyName="head.keyName" :sortKey="sortKey"
                                    :sortDirection="sortDirection" :sortType="head.sortType"
                                    :sortHandler="debounceSentences" @update:sortKey="sortKey = $event"
                                    @update:sortDirection="sortDirection = $event" />
                                <th>
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="sentence in sentences.data" :key="sentence.sentence_id"
                                @click="addToSentencesGroup(sentence)">
                                <td>{{ sentence.sentence }}</td>
                                <!-- <td>[{{ sentence.transcription }}]</td> -->
                                <td>{{ sentence.course_name }}</td>
                                <td>
                                    <div class="flex gap-x-2 items-center">
                                        <userAvatar :padding="0.5" :className="'w-6 h-6'" :user="{
                                            last_name: sentence.operator_last_name,
                                            first_name: sentence.operator_first_name,
                                            avatar: sentence.operator_avatar
                                        }" />
                                        {{ sentence.operator_last_name }} {{ sentence.operator_first_name }}
                                    </div>
                                </td>
                                <td>{{ new Date(sentence.created_at).toLocaleString() }}</td>
                                <td :class="sentence.status_color">{{ sentence.status_type_name }}</td>
                                <td>
                                    <div class="flex items-center gap-x-4">
                                        <audioButton v-if="sentence.audio_file"
                                            :src="config.public.apiBase + '/media/' + sentence.audio_file"
                                            @click.stop />
                                        <div v-if="sentence.image_file"
                                            :style="{ 'backgroundImage': 'url(' + config.public.apiBase + '/media/' + sentence.image_file + ')' }"
                                            class="h-9 w-9 bg-cover bg-no-repeat bg-center rounded-lg">
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="btn-wrap mt-4">
                    <pagination :items="sentences" :setItems="getSentences" :bgClassName="'bg_active'"
                        :defaultPerPage="5" :onSelect="(count) => perPage = count" />
                </div>
            </template>

            <alert v-else :className="'light'">
                <loader v-if="pending" :className="'overlay'" />
                <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
            </alert>
        </div>

        <div class="col-span-12">
            <p :class="{ 'text-danger': errors.sentences_count && !selectedSentences.length }">
                <span v-if="errors.sentences_count && !selectedSentences.length">{{ errors.sentences_count[0] }}</span>
                <span v-else> {{ $t("pages.sentences.added_sentences_count") }}: <b>{{ selectedSentences.length
                        }}</b></span>
            </p>

            <div v-if="selectedSentences.length > 0" class="btn-wrap">
                <tag v-for="(sentence, index) in selectedSentences" :key="index" :itemId="sentence.sentence_id"
                    :itemLabel="sentence.sentence" :onDelete="(sentence_id) => deleteFromGroup(sentence_id)"
                    :closable="true" v-motion="{
                        initial: {
                            y: -100,
                            opacity: 0
                        },
                        enter: {
                            y: 0,
                            opacity: 1
                        }
                    }" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'nuxt/app';
import previewFileInput from '../../../ui/previewFileInput.vue';
import audioButton from '../../../ui/audioButton.vue';
import userAvatar from '../../../ui/userAvatar.vue';
import loader from '../../../ui/loader.vue';
import alert from '../../../ui/alert.vue';
import stickyBox from '../../../ui/stickyBox.vue';
import pagination from '../../../ui/pagination.vue';
import { debounceHandler } from '../../../../utils/debounceHandler';
import multipleSelect from '../../../ui/multipleSelect.vue';
import sortTableHead from '../../../ui/sortTableHead.vue';
import tag from '../../../ui/tag.vue';

const router = useRouter();
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();
const { t } = useI18n();
const pending = ref(true);
const tableRef = ref(null);
const searchFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(5);
const sentences = ref([]);
const attributes = ref([]);

const sortKey = ref('sentences.created_at'); // Ключ сортировки
const sortDirection = ref('asc'); // Направление сортировки: asc или desc

const props = defineProps({
    errors: {
        type: Object,
        required: true
    },

    selectedSentences: {
        type: Object,
        required: true
    }
});

const { errors, selectedSentences } = toRefs(props);

const sentenceTableHeads = [
    {
        title: t('pages.sentences.sentence'),
        keyName: 'sentences.sentence',
        sortType: 'alpha'
    },
    // {
    //     title: t('pages.sentences.transcription'),
    //     keyName: 'sentence.transcription',
    //     sortType: 'alpha'
    // },
    {
        title: t('pages.courses.course'),
        keyName: 'courses_lang.course_name',
        sortType: 'alpha'
    },
    {
        title: t('operator'),
        keyName: 'operator.last_name',
        sortType: 'alpha'
    },
    {
        title: t('created_at'),
        keyName: 'sentences.created_at',
        sortType: 'numeric'
    },
    {
        title: t('status'),
        keyName: 'types_of_status_lang.status_type_name',
        sortType: 'alpha'
    }
];

const getSentences = async (url) => {
    pending.value = true;

    const formData = new FormData(searchFormRef.value);
    formData.append('per_page', perPage.value);
    formData.append('sort_key', sortKey.value);  // Добавляем ключ сортировки
    formData.append('sort_direction', sortDirection.value);  // Добавляем направление сортировки

    if (!url) {
        url = 'sentences/get';
    }

    await $axiosPlugin.post(url, formData)
        .then(response => {
            sentences.value = response.data;
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

const getSentenceAttributes = async () => {
    pending.value = true;
    await $axiosPlugin.get('sentences/get_sentence_attributes')
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

const addToSentencesGroup = (sentence) => {
    if (!selectedSentences.value.some((s) => s.sentence_id === sentence.sentence_id)) {
        let newArr = JSON.parse(JSON.stringify(selectedSentences.value));
        newArr.push(sentence);
        selectedSentences.value = newArr;
    }
    else {
        selectedSentences.value = selectedSentences.value.filter((s) => s.sentence_id !== sentence.sentence_id);
    }
}

const deleteFromGroup = (sentence_id) => {
    const sentenceToRemove = selectedSentences.value.find((s) => s.sentence_id === sentence_id);

    if (sentenceToRemove) {
        selectedSentences.value = selectedSentences.value.filter((s) => s.sentence_id !== sentence_id);
    }
}

const showHideSentenceSearchFilter = () => {
    if (searchFilter.value === true) {
        searchFilter.value = false;
        resetSentenceSearchFilter();
    }
    else {
        searchFilter.value = true;
    }
}

const resetSentenceSearchFilter = () => {
    searchFormRef.value.reset();
    getSentences();
}

const debounceSentences = debounceHandler(() => getSentences(), 1000);
const debounceReset = debounceHandler(() => resetSentenceSearchFilter(), 500);

onMounted(() => {
    getSentenceAttributes();
    getSentences();
});
</script>