<template>
  <p class="mb-0" v-if="props.attributes.groups && props.attributes.groups.length === 0">
    {{ $t('pages.conference.not_appointed') }}
  </p>
  <div v-else class="custom-grid">
    <div class="col-span-12">
      <div class="form-group-border select active label-active">
        <i class="pi pi-book"></i>
        <select
          name="group_id"
          v-model="selectedGroupId"
          @change="onGroupChange"
        >
          <option selected disabled value="">
            {{ $t("pages.groups.choose") }}
          </option>
          <option
            v-for="(group, groupIndex) in props.attributes.groups"
            :key="groupIndex"
            :value="group.group_id"
          >
            {{ group.group_name }} - {{ group.course_name }} ({{
              group.level_name
            }})
          </option>
        </select>
        <label>
          {{ $t("pages.groups.group") }}
        </label>
      </div>
    </div>

    <div v-if="selectedGroupId" class="col-span-12">
      <p>
        {{ $t("pages.groups.members") }}:
        <b>{{ selectedGroup?.members.length }}</b>
      </p>

      <div v-if="selectedGroup?.members.length > 0" class="btn-wrap">
        <userTag
          v-for="(member, index) in selectedGroup.members"
          :key="index"
          :user="member"
          :closable="false"
        />
      </div>
    </div>

    <div v-if="selectedGroupId" class="col-span-12">
      <div class="form-group-border select active label-active">
        <i class="pi pi-book"></i>
        <select
          name="section_id"
          v-model="selectedSectionId"
          @change="onSectionChange"
        >
          <option selected disabled value="">
            {{ $t("pages.courses.choose_a_course_section") }}
          </option>
          <option
            v-for="(section, sectionIndex) in selectedGroup?.sections"
            :key="sectionIndex"
            :value="section.section_id"
          >
            {{ section.section_name }}
          </option>
        </select>
        <label>
          {{ $t("pages.courses.course_section") }}
        </label>
      </div>
    </div>

    <div v-if="selectedSectionId" class="col-span-12">
      <div class="form-group-border select active label-active">
        <i class="pi pi-book"></i>
        <select
          name="lesson_id"
          v-model="selectedLessonId"
          @change="onLessonChange"
        >
          <option selected disabled value="">
            {{ $t("pages.lessons.choose_a_lesson") }}
          </option>
          <option
            v-for="(lesson, lessonIndex) in selectedSection?.lessons"
            :key="lessonIndex"
            :value="lesson.lesson_id"
          >
            {{ lesson.lesson_name }} ({{ lesson.lesson_type_name }})
          </option>
        </select>
        <label>
          {{ $t("pages.lessons.lesson") }}
        </label>
      </div>
    </div>

    <div class="col-span-12">
      <button
        class="btn btn-primary"
        :class="!selectedLessonId && 'disabled'"
        type="submit"
      >
        <i class="pi pi-arrow-right"></i>
        {{ $t("start") }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineExpose } from "vue";
import userTag from "../ui/userTag.vue";

// Реактивные свойства для отслеживания выбранных значений
const selectedGroupId = ref("");
const selectedSectionId = ref("");
const selectedLessonId = ref("");

const props = defineProps({
  attributes: {
    type: Object,
    required: true,
  },
});

// Вычисляемые свойства для получения выбранных данных
const selectedGroup = computed(() =>
  props.attributes.groups.find(
    (group) => group.group_id === Number(selectedGroupId.value)
  )
);

const selectedSection = computed(() =>
  selectedGroup.value?.sections.find(
    (section) => section.section_id === Number(selectedSectionId.value)
  )
);

const selectedLesson = computed(() =>
  selectedSection.value?.lessons.find(
    (lesson) => lesson.lesson_id === Number(selectedLessonId.value)
  )
);

// Сброс значений при изменении выбора
const onGroupChange = () => {
  if (selectedSectionId.value || selectedLessonId.value) {
    selectedSectionId.value = "";
    selectedLessonId.value = "";
  }
};

const onSectionChange = () => {
  if (selectedLessonId.value) {
    selectedLessonId.value = "";
  }
};

const resetForm = () => {
  selectedGroupId.value = "";
  selectedSectionId.value = "";
  selectedLessonId.value = "";
};

defineExpose({
  resetForm,
});
</script>
