<template>
    <div class="custom-grid">
        <div class="col-span-12">
            <div class="form-group-border active">
                <i class="pi pi-users"></i>
                <input autoComplete="new-group-name" name="group_name" type="text" placeholder=" " />
                <label :class="{ 'label-error': errors.group_name }">
                    {{ errors.group_name ? errors.group_name[0] : $t("pages.groups.group_name")
                    }}
                </label>
            </div>
        </div>

        <div class="col-span-12">
            <div class="form-group-border active">
                <i class="pi pi-users"></i>
                <textarea autoComplete="new-group-description-name" name="group_description" placeholder=" "></textarea>
                <label :class="{ 'label-error': errors.group_description }">
                    {{ errors.group_description ? errors.group_description[0] :
                        $t("pages.groups.group_description") }}
                </label>
            </div>
        </div>

        <div class="col-span-12">
            <div class="form-group-border select active label-active">
                <i class="pi pi-book"></i>
                <select name="course_id" v-model="selectedCourseId" @change="onCourseChange">
                    <option selected disabled value="">{{ $t("pages.courses.choose_a_course") }}</option>
                    <option v-for="(course, courseIndex) in attributes.courses" :key="courseIndex"
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
                <select name="level_id">
                    <option value="">{{ $t("choose_a_category") }}</option>
                    <option v-for="(level, levelIndex) in selectedCourse?.levels" :key="levelIndex"
                        :value="level.level_id">
                        {{ level.level_name }}</option>
                </select>
                <label :class="{ 'label-error': errors.level_id }">
                    {{ errors.level_id ? errors.level_id[0] :
                        $t("pages.groups.group_category") }}
                </label>
            </div>
        </div>

        <div class="col-span-12">
            <div class="form-group-border select active">
                <i class="pi pi-user"></i>
                <select name="mentor_id">
                    <option selected disabled value="">{{ $t("choose_a_mentor") }}</option>
                    <option v-for="mentor in attributes.all_mentors" :key="mentor.user_id" :value="mentor.user_id">{{
                        mentor.last_name }} {{ mentor.first_name }}
                    </option>
                </select>
                <label :class="{ 'label-error': errors.mentor_id }">{{ errors.mentor_id ?
                    errors.mentor_id[0] : $t("mentor") }}</label>
            </div>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    errors: {
        type: Object,
        required: true
    },

    attributes: {
        type: Object,
        required: true
    }
});

// Реактивные свойства для отслеживания выбранных значений
const selectedCourseId = ref("");

// Вычисляемые свойства для получения выбранных данных
const selectedCourse = computed(() =>
    props.attributes.value.courses.find((course) => course.course_id === Number(selectedCourseId.value))
);

// Сброс значений при изменении выбора
const onCourseChange = () => {
    errors.value = [];
};

const { errors, attributes } = toRefs(props);
</script>
