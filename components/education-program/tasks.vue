<template>
    <div class="custom-grid">
        <div class="col-span-12">
            <div class="btn-wrap">
                <client-only>
                    <roleProvider :roles="[1]">
                        <dropdownMenu :dropdownArrow="false" :position="'left'">
                            <template v-slot:btn_content>
                                <button class="btn btn-outline-primary">
                                    <i class="pi pi-plus"></i>
                                    <span>{{ $t("pages.tasks.add_a_task") }}</span>
                                </button>
                            </template>

                            <template v-slot:menu_content>
                                <li v-for="(task_type, index) in taskAttributes.all_task_types" :key="index">
                                    <button @click="openTaskModal(task_type.task_type_component, 'create', null)">
                                        <i :class="task_type.icon"></i>
                                        {{ task_type.task_type_name }}
                                    </button>
                                </li>
                            </template>
                        </dropdownMenu>
                    </roleProvider>
                </client-only>
                <button @click="showHideTaskSearchFilter" class="btn btn-light">
                    <i class="pi pi-search"></i>
                    <span>{{ searchFilter === true ? $t("hide_search_filter") : $t("show_search_filter") }}</span>
                </button>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-3" :class="searchFilter ? 'block' : 'hidden'">
            <stickyBox>
                <div class="card p-4">
                    <h5>{{ $t("pages.tasks.search_filter") }}</h5>
                    <form @submit.prevent="debounceReset" ref="searchFormRef">
                        <div class="custom-grid">
                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-book"></i>
                                    <input type="text" name="task_name" placeholder=" " @input="debounceTasks" />
                                    <label>{{ $t("pages.tasks.task_name") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-book"></i>
                                    <input type="text" name="task_slug" placeholder=" " @input="debounceTasks" />
                                    <label>{{ $t("pages.tasks.task_slug") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border select active label-active">
                                    <i class="pi pi-book"></i>
                                    <select name="course_id" v-model="selectedCourseId" @change="onCourseChange">
                                        <option selected disabled value="">{{ $t("pages.courses.choose_a_course") }}
                                        </option>
                                        <option v-for="(course, courseIndex) in taskAttributes.courses"
                                            :key="courseIndex" :value="course.course_id">
                                            {{ course.course_name }}</option>
                                    </select>
                                    <label>
                                        {{ $t("pages.courses.course") }}
                                    </label>
                                </div>
                            </div>

                            <div v-if="selectedCourseId" class="col-span-12">
                                <div class="form-group-border select active label-active">
                                    <i class="pi pi-book"></i>
                                    <select name="level_id" v-model="selectedLevelId" @change="onLevelChange">
                                        <option selected disabled value="">{{ $t("pages.courses.choose_a_course_level")
                                            }}
                                        </option>
                                        <option v-for="(level, levelIndex) in selectedCourse?.levels" :key="levelIndex"
                                            :value="level.level_id">
                                            {{ level.level_name }}</option>
                                    </select>
                                    <label>
                                        {{ $t("pages.courses.course_level") }}
                                    </label>
                                </div>
                            </div>

                            <div v-if="selectedLevelId" class="col-span-12">
                                <div class="form-group-border select active label-active">
                                    <i class="pi pi-book"></i>
                                    <select name="section_id" v-model="selectedSectionId" @change="onSectionChange">
                                        <option selected disabled value="">{{
                                            $t("pages.courses.choose_a_course_section") }}
                                        </option>
                                        <option v-for="(section, sectionIndex) in selectedLevel?.sections"
                                            :key="sectionIndex" :value="section.section_id">
                                            {{ section.section_name }}</option>
                                    </select>
                                    <label>
                                        {{ $t("pages.courses.course_section") }}
                                    </label>
                                </div>
                            </div>

                            <div v-if="selectedSectionId" class="col-span-12">
                                <div class="form-group-border select active label-active">
                                    <i class="pi pi-book"></i>
                                    <select name="lesson_id" v-model="selectedLessonId" @change="onLessonChange">
                                        <option selected disabled value="">{{ $t("pages.lessons.choose_a_lesson") }}
                                        </option>
                                        <option v-for="(lesson, lessonIndex) in selectedSection?.lessons"
                                            :key="lessonIndex" :value="lesson.lesson_id">
                                            {{ lesson.lesson_name }} ({{ lesson.lesson_type_name }})</option>
                                    </select>
                                    <label>
                                        {{ $t("pages.lessons.lesson") }}
                                    </label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <multipleSelect :className="'form-group-border select active label-active'"
                                    :icon="'pi pi-clock'" :label="$t('pages.tasks.task_type')"
                                    :items="taskAttributes.task_types" :optionName="'task_types[]'"
                                    :optionValue="'task_type_id'" :optionLabel="'task_type_name'"
                                    :onChange="debounceTasks" />
                            </div>

                            <div class="col-span-12">
                                <multipleSelect :className="'form-group-border select active label-active'"
                                    :icon="'pi pi-user'" :label="$t('operator')" :items="taskAttributes.operators"
                                    :optionName="'operators[]'" :optionValue="'user_id'" :optionLabel="'full_name'"
                                    :avatar="true" :onChange="debounceTasks" />
                            </div>

                            <div class="col-span-12">
                                <multipleSelect :className="'form-group-border select active label-active'"
                                    :icon="'pi pi-hourglass'" :label="$t('status')" :items="taskAttributes.statuses"
                                    :optionName="'statuses[]'" :optionValue="'status_type_id'"
                                    :optionLabel="'status_type_name'" :onChange="debounceTasks" />
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-calendar"></i>
                                    <input type="date" name="created_at_from" @input="debounceTasks" placeholder=" " />
                                    <label>{{ $t("created_at_from") }}</label>
                                </div>
                            </div>

                            <div class="col-span-12">
                                <div class="form-group-border active">
                                    <i class="pi pi-calendar"></i>
                                    <input type="date" name="created_at_to" @input="debounceTasks" placeholder=" " />
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
            <template v-if="tasks.data?.length > 0">
                <div class="table table-sm selectable">
                    <loader v-if="pendingTasks" :className="'overlay'" />
                    <table ref="tableRef">
                        <thead>
                            <tr>
                                <sortTableHead v-for="(head, index) in taskTableHeads" :key="index" :title="head.title"
                                    :keyName="head.keyName" :sortKey="sortKey" :sortDirection="sortDirection"
                                    :sortType="head.sortType" :sortHandler="debounceTasks"
                                    @update:sortKey="sortKey = $event" @update:sortDirection="sortDirection = $event" />
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="task in tasks.data" :key="task.task_id" @click="changeCurrentTask(task)">
                                <td>{{ task.task_name }}</td>
                                <td>{{ task.task_slug }}</td>
                                <td>{{ task.task_type_name }}</td>
                                <td>{{ task.lesson_name }}</td>
                                <td>{{ task.section_name }}</td>
                                <td>{{ task.level_name }}</td>
                                <td>{{ task.course_name }}</td>
                                <td>
                                    <div class="flex gap-x-2 items-center">
                                        <userAvatar :padding="0.5" :className="'w-6 h-6'" :user="{
                                            last_name: task.operator_last_name,
                                            first_name: task.operator_first_name,
                                            avatar: task.operator_avatar
                                        }" />
                                        {{ task.operator_last_name }} {{ task.operator_first_name }}
                                    </div>
                                </td>
                                <td>{{ new Date(task.created_at).toLocaleString() }}</td>
                                <td :class="task.status_color">{{ task.status_type_name }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="btn-wrap mt-4">
                    <pagination :items="tasks" :setItems="getTasks" :onSelect="(count) => perPage = count" />
                    <client-only>
                        <tableToExcelButton :table="tableRef"
                            :fileName="$t('pages.tasks.title') + ' - ' + new Date().toLocaleString()"
                            :className="'btn-sm'" />
                    </client-only>
                </div>
            </template>

            <alert v-else :className="'light'">
                <loader v-if="pendingTasks" :className="'overlay'" />
                <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
            </alert>
        </div>
    </div>

    <modal :show="modalIsVisible" :onClose="() => closeModal()" :className="modalClass" :showLoader="pendingModal"
        :closeOnClickSelf="false">
        <template v-slot:header_content>
            <h3>{{ task ? task.task_slug : $t('pages.tasks.adding_a_task') }}</h3>
        </template>
        <template v-slot:body_content>
            <component :is="currentModal" v-bind="modalProps" />
        </template>
    </modal>
</template>
<script setup>
import modal from '../ui/modal.vue';
import { useRouter } from 'nuxt/app';
import dropdownMenu from '../ui/dropdownMenu.vue';
import roleProvider from '../ui/roleProvider.vue';
import { provide, shallowRef } from 'vue';
import userAvatar from '../ui/userAvatar.vue';
import loader from '../ui/loader.vue';
import alert from '../ui/alert.vue';
import stickyBox from '../ui/stickyBox.vue';
import pagination from '../ui/pagination.vue';
import tableToExcelButton from '../ui/tableToExcelButton.vue';
import { debounceHandler } from '../../utils/debounceHandler';
import multipleSelect from '../ui/multipleSelect.vue';
import sortTableHead from '../ui/sortTableHead.vue';

const router = useRouter();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const { t } = useI18n();
const pendingTasks = ref(false);
const pendingModal = ref(false);

const tableRef = ref(null);
const searchFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(10);
const tasks = ref([]);
const task = ref(null);
const taskAttributes = ref([]);
const modalClass = ref('modal-lg');
const modalProps = ref({});
const modalIsVisible = ref(false);
const currentModal = shallowRef(null);

const sortKey = ref('tasks.created_at'); // Ключ сортировки
const sortDirection = ref('asc'); // Направление сортировки: asc или desc

// Реактивные свойства для отслеживания выбранных значений
const selectedCourseId = ref("");
const selectedLevelId = ref("");
const selectedSectionId = ref("");
const selectedLessonId = ref("");

const onPending = (state) => {
    pendingModal.value = state;
};

const changeModalSize = (size) => {
    modalClass.value = size;
};

const closeModal = () => {
    modalIsVisible.value = false;
    pendingModal.value = false;
    errors.value = [];
    task.value = null;
    getTaskAttributes();
    getTasks();
}

provide('onPending', onPending);
provide('changeModalSize', changeModalSize);
provide('closeModal', closeModal);

const changeCurrentTask = (currentTask) => {
    task.value = currentTask;
    openTaskModal(task.value.task_type_component, 'execution', {
        task: currentTask
    })
}

const taskTableHeads = [
    {
        title: t('pages.tasks.task_name'),
        keyName: 'tasks_lang.task_name',
        sortType: 'alpha'
    },
    {
        title: t('pages.tasks.task_slug'),
        keyName: 'tasks.task_slug',
        sortType: 'alpha'
    },
    {
        title: t('pages.tasks.task_type'),
        keyName: 'types_of_tasks_lang.task_type_name',
        sortType: 'alpha'
    },
    {
        title: t('pages.lessons.lesson'),
        keyName: 'lessons_lang.lesson_name',
        sortType: 'alpha'
    },
    {
        title: t('pages.courses.course_section'),
        keyName: 'course_sections.section_name',
        sortType: 'alpha'
    },
    {
        title: t('pages.courses.course_level'),
        keyName: 'course_levels_lang.level_name',
        sortType: 'alpha'
    },
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
        keyName: 'tasks.created_at',
        sortType: 'numeric'
    },
    {
        title: t('status'),
        keyName: 'types_of_status_lang.status_type_name',
        sortType: 'alpha'
    }
];

const getTasks = async (url) => {
    pendingTasks.value = true;

    const formData = new FormData(searchFormRef.value);
    formData.append('per_page', perPage.value);
    formData.append('sort_key', sortKey.value);  // Добавляем ключ сортировки
    formData.append('sort_direction', sortDirection.value);  // Добавляем направление сортировки

    if (!url) {
        url = 'tasks/get';
    }

    await $axiosPlugin.post(url, formData)
        .then(response => {
            tasks.value = response.data;
            pendingTasks.value = false;
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

const getTaskAttributes = async () => {
    await $axiosPlugin.get('tasks/get_task_attributes')
        .then(response => {
            taskAttributes.value = response.data;
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

const openTaskModal = (component, action, props = {}) => {
    modalIsVisible.value = true;
    currentModal.value = defineAsyncComponent(() =>
        import(`./components/tasks/actions/${action}/${component}.vue`)
    );
    modalProps.value = props;
}

const showHideTaskSearchFilter = () => {
    if (searchFilter.value === true) {
        searchFilter.value = false;
        resetTaskSearchFilter();
    }
    else {
        searchFilter.value = true;
    }
}

const resetTaskSearchFilter = () => {
    searchFormRef.value.reset();
    selectedCourseId.value = "";
    selectedLevelId.value = "";
    selectedSectionId.value = "";
    selectedLessonId.value = "";
    setTimeout(() => {
        getTasks();
    }, 500);
}

// Вычисляемые свойства для получения выбранных данных
const selectedCourse = computed(() =>
    taskAttributes.value.courses.find((course) => course.course_id === Number(selectedCourseId.value))
);

const selectedLevel = computed(() =>
    selectedCourse.value?.levels.find((level) => level.level_id === Number(selectedLevelId.value))
);

const selectedSection = computed(() =>
    selectedLevel.value?.sections.find((section) => section.section_id === Number(selectedSectionId.value))
);

// Сброс значений при изменении выбора
const onCourseChange = () => {
    if (selectedLevelId.value || selectedSectionId.value || selectedLessonId.value) {
        selectedLevelId.value = "";
        selectedSectionId.value = "";
        selectedLessonId.value = "";
    }
    debounceTasks();
};

const onLevelChange = () => {
    if (selectedSectionId.value || selectedLessonId.value) {
        selectedSectionId.value = "";
        selectedLessonId.value = "";
    }
    debounceTasks();
};

const onSectionChange = () => {
    if (selectedLessonId.value) {
        selectedLessonId.value = "";
    }
    debounceTasks();
};

const onLessonChange = () => {
    debounceTasks();
};

const debounceTasks = debounceHandler(() => getTasks(), 1000);
const debounceReset = debounceHandler(() => resetTaskSearchFilter(), 500);

onMounted(() => {
    getTaskAttributes();
    getTasks();
});
</script>