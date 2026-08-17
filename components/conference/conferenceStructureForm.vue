<template>
  <template v-if="schoolStore.isAiSchoolDomain">
    <div class="custom-grid">
      <div class="col-span-12">
        <div class="form-group-border select active">
          <i class="pi pi-book"></i>
          <select name="course_id" v-model="selectedCourseId">
            <option selected disabled value="">
              {{ $t("pages.courses.choose_a_course") }}
            </option>
            <option
              v-for="(course, courseIndex) in props.attributes.courses"
              :key="courseIndex"
              :value="course.course_id"
            >
              {{ course.course_name }}
            </option>
          </select>
          <label :class="{ 'label-error': errors.course_id }">
            {{
              errors.course_id
                ? errors.course_id[0]
                : $t("pages.courses.course")
            }}
          </label>
        </div>
      </div>

      <div v-if="selectedCourseId" class="col-span-12">
        <div class="custom-grid">
          <div class="col-span-12">
            <label class="label-focus" :class="errors.levels && 'danger'">{{
              errors.levels
                ? errors.levels[0]
                : $t("pages.courses.choose_a_course_levels")
            }}</label>

            <div class="btn-wrap my-2">
              <label
                v-for="(level, levelIndex) in selectedCourse?.levels"
                :key="levelIndex"
                class="custom-radio-checkbox"
              >
                <input
                  name="levels[]"
                  :value="level.level_id"
                  type="checkbox"
                  :checked="false"
                />
                <span>{{ level.level_name }}</span>
              </label>
            </div>
          </div>

          <div class="col-span-12" v-if="props.mode === 'plan'">
            <div class="form-group-border active">
              <i class="pi pi-calendar"></i>
              <input type="datetime-local" name="start_time" />
              <label :class="{ 'label-error': errors.start_time }">
                {{
                  errors.start_time
                    ? errors.start_time[0]
                    : $t("pages.conference.start_time")
                }}
              </label>
            </div>
          </div>

          <div class="col-span-12">
            <div class="form-group-border active">
              <i class="pi pi-pencil"></i>
              <input type="text" name="conf_topic" placeholder=" " />
              <label :class="{ 'label-error': errors.conf_topic }">
                {{
                  errors.conf_topic
                    ? errors.conf_topic[0]
                    : $t("pages.conference.topic.title")
                }}
              </label>
            </div>
          </div>

          <div class="col-span-12">
            <div class="form-group-border active">
              <i class="pi pi-pencil"></i>
              <textarea
                name="conf_topic_description"
                placeholder=" "
              ></textarea>
              <label>{{ $t("pages.conference.topic.description") }}</label>
            </div>
          </div>

          <div class="col-span-12">
            <fileUploadButton
              :id="'upload_poster_file_create'"
              :name="'upload_poster_file_create'"
              :accept="'image/*'"
              :error="errors.upload_poster"
              :icon="'pi pi-image'"
              :label="$t('pages.conference.poster.required')"
            />
          </div>

          <div class="col-span-12">
            <label class="custom-radio-checkbox">
              <input name="is_free" type="checkbox" />
              <span>{{ $t("pages.conference.free_conference") }}</span>
            </label>
          </div>

          <div class="col-span-12">
            <button class="btn btn-primary" type="submit">
              <i class="pi pi-arrow-right"></i>
              {{ $t("save") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  <template v-else>
    <p
      class="mb-0"
      v-if="props.attributes.groups && props.attributes.groups.length === 0"
    >
      {{ $t("pages.conference.not_appointed") }}
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

      <div class="col-span-12" v-if="props.mode === 'plan' && selectedLessonId">
        <div class="form-group-border active">
          <i class="pi pi-calendar"></i>
          <input type="datetime-local" name="start_time" />
          <label :class="{ 'label-error': errors.start_time }">
            {{
              errors.start_time
                ? errors.start_time[0]
                : $t("pages.conference.start_time")
            }}
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
</template>

<script setup>
import { defineExpose } from "vue";
import userTag from "../ui/userTag.vue";
import fileUploadButton from "../ui/fileUploadButton.vue";

const schoolStore = useSchoolStore();

// Реактивные свойства для отслеживания выбранных значений B2C
const selectedCourseId = ref("");

// Реактивные свойства для отслеживания выбранных значений B2B
const selectedGroupId = ref("");
const selectedSectionId = ref("");
const selectedLessonId = ref("");

const props = defineProps({
  mode: {
    type: String,
    required: true,
  },
  attributes: {
    type: Object,
    required: true,
  },
  errors: {
    type: Object,
    required: true,
  },
});

// Вычисляемые свойства для получения выбранных данных B2B
const selectedGroup = computed(() =>
  props.attributes.groups.find(
    (group) => group.group_id === Number(selectedGroupId.value),
  ),
);

const selectedSection = computed(() =>
  selectedGroup.value?.sections.find(
    (section) => section.section_id === Number(selectedSectionId.value),
  ),
);

const selectedLesson = computed(() =>
  selectedSection.value?.lessons.find(
    (lesson) => lesson.lesson_id === Number(selectedLessonId.value),
  ),
);

// Вычисляемые свойства для получения выбранных данных B2C
const selectedCourse = computed(() =>
  props.attributes.courses.find(
    (course) => course.course_id === Number(selectedCourseId.value),
  ),
);

// Сброс значений при изменении выбора B2B
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
  selectedCourseId.value = "";
  selectedGroupId.value = "";
  selectedSectionId.value = "";
  selectedLessonId.value = "";
};

defineExpose({
  resetForm,
});

const { errors } = toRefs(props);
</script>
