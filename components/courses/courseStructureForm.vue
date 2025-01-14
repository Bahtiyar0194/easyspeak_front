<template>
    <loader v-if="pending" :className="'overlay'" />
    <div class="custom-grid">
        <div class="col-span-12">
            <div class="form-group-border select active label-active">
                <i class="pi pi-book"></i>
                <select name="course_id" v-model="selectedCourseId" @change="onCourseChange">
                    <option selected disabled value="">{{ $t("pages.courses.choose_a_course") }}</option>
                    <option v-for="(course, courseIndex) in courseAttributes.courses" :key="courseIndex"
                        :value="course.course_id">
                        {{ course.course_name }}</option>
                </select>
                <label :class="{ 'label-error': errors.course_id }">
                    {{ errors.course_id ? errors.course_id[0] :
                        $t("pages.courses.course") }}
                </label>
            </div>
        </div>

        <div v-if="selectedCourseId" class="col-span-12">
            <div class="form-group-border select active label-active">
                <i class="pi pi-book"></i>
                <select name="level_id" v-model="selectedLevelId" @change="onLevelChange">
                    <option selected disabled value="">{{ $t("pages.courses.choose_a_course_level") }}</option>
                    <option v-for="(level, levelIndex) in selectedCourse?.levels" :key="levelIndex"
                        :value="level.level_id">
                        {{ level.level_name }}</option>
                </select>
                <label :class="{ 'label-error': errors.level_id }">
                    {{ errors.level_id ? errors.level_id[0] :
                        $t("pages.courses.course_level") }}
                </label>
            </div>
        </div>

        <div v-if="selectedLevelId" class="col-span-12">
            <div class="form-group-border select active label-active">
                <i class="pi pi-book"></i>
                <select name="section_id" v-model="selectedSectionId" @change="onSectionChange">
                    <option selected disabled value="">{{ $t("pages.courses.choose_a_course_section") }}</option>
                    <option v-for="(section, sectionIndex) in selectedLevel?.sections" :key="sectionIndex"
                        :value="section.section_id">
                        {{ section.section_name }}</option>
                </select>
                <label :class="{ 'label-error': errors.section_id }">
                    {{ errors.section_id ? errors.section_id[0] :
                        $t("pages.courses.course_section") }}
                </label>
            </div>
        </div>

        <div v-if="selectedSectionId" class="col-span-12">
            <div class="form-group-border select active label-active">
                <i class="pi pi-book"></i>
                <select name="lesson_id" v-model="selectedLessonId" @change="onLessonChange">
                    <option selected disabled value="">{{ $t("pages.lessons.choose_a_lesson") }}</option>
                    <option v-for="(lesson, lessonIndex) in selectedSection?.lessons" :key="lessonIndex"
                        :value="lesson.lesson_id">
                        {{ lesson.lesson_name }} ({{ lesson.lesson_type_name }})</option>
                </select>
                <label :class="{ 'label-error': errors.lesson_id }">
                    {{ errors.lesson_id ? errors.lesson_id[0] :
                        $t("pages.lessons.lesson") }}
                </label>
            </div>
        </div>
    </div>
</template>

<script setup>
import loader from '../ui/loader.vue';
import { onMounted } from 'vue';
import { useRouter } from 'nuxt/app';

const router = useRouter();
const { $axiosPlugin } = useNuxtApp();

const pending = ref(false);
const courseAttributes = ref([]);

const props = defineProps({
    errors: {
        type: Object,
        required: true,
    }
});

const getCourseAttributes = async () => {
    courseAttributes.value = [];
    pending.value = true;
    await $axiosPlugin.get('courses/get_structure')
        .then(response => {
            courseAttributes.value = response.data;
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

// Реактивные свойства для отслеживания выбранных значений
const selectedCourseId = ref("");
const selectedLevelId = ref("");
const selectedSectionId = ref("");
const selectedLessonId = ref("");

// Вычисляемые свойства для получения выбранных данных
const selectedCourse = computed(() =>
    courseAttributes.value.courses.find((course) => course.course_id === Number(selectedCourseId.value))
);

const selectedLevel = computed(() =>
    selectedCourse.value?.levels.find((level) => level.level_id === Number(selectedLevelId.value))
);

const selectedSection = computed(() =>
    selectedLevel.value?.sections.find((section) => section.section_id === Number(selectedSectionId.value))
);

const selectedLesson = computed(() =>
    selectedSection.value?.lessons.find((lesson) => lesson.lesson_id === Number(selectedLessonId.value))
);

// Сброс значений при изменении выбора
const onCourseChange = () => {
    if (selectedLevelId.value || selectedSectionId.value || selectedLessonId.value) {
        selectedLevelId.value = "";
        selectedSectionId.value = "";
        selectedLessonId.value = "";
    }
    errors.value = [];
};

const onLevelChange = () => {
    if (selectedSectionId.value || selectedLessonId.value) {
        selectedSectionId.value = "";
        selectedLessonId.value = "";
    }
    errors.value = [];
};

const onSectionChange = () => {
    if (selectedLessonId.value) {
        selectedLessonId.value = "";
    }
    errors.value = [];
};

const onLessonChange = () => {
    errors.value = [];
};

const { errors } = toRefs(props);

onMounted(() => {
    getCourseAttributes();
});
</script>