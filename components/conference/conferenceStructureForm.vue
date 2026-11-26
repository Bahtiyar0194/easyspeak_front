<template>
  <!-- ===== AI-школа: курс → уровни → тема, постер, время ===== -->
  <template v-if="schoolStore.isAiSchoolDomain">
    <div class="form-steps">
      <section class="form-step">
        <p class="form-step-title"><span>1</span>{{ $t("pages.courses.course") }}</p>
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
              errors.course_id ? errors.course_id[0] : $t("pages.courses.course")
            }}
          </label>
        </div>

        <div v-if="selectedCourseId" class="mt-4">
          <p
            class="mb-2 text-sm"
            :class="errors.levels ? 'text-danger' : 'text-inactive'"
          >
            {{
              errors.levels
                ? errors.levels[0]
                : $t("pages.courses.choose_a_course_levels")
            }}
          </p>
          <div class="btn-wrap">
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
      </section>

      <template v-if="selectedCourseId">
        <section class="form-step">
          <p class="form-step-title"><span>2</span>{{ $t("pages.conference.topic.title") }}</p>
          <div class="flex flex-col gap-4">
            <div class="form-group-border active">
              <i class="pi pi-pencil"></i>
              <input type="text" name="conf_topic" placeholder=" " autocomplete="off" />
              <label :class="{ 'label-error': errors.conf_topic }">
                {{
                  errors.conf_topic
                    ? errors.conf_topic[0]
                    : $t("pages.conference.topic.title")
                }}
              </label>
            </div>

            <div class="form-group-border active">
              <i class="pi pi-align-left"></i>
              <textarea name="conf_topic_description" placeholder=" " rows="3"></textarea>
              <label>{{ $t("pages.conference.topic.description") }}</label>
            </div>

            <fileUploadButton
              :id="'upload_poster_file_create'"
              :name="'upload_poster_file_create'"
              :accept="'image/*'"
              :error="errors.upload_poster"
              :icon="'pi pi-image'"
              :label="$t('pages.conference.poster.required')"
            />
          </div>
        </section>

        <section class="form-step">
          <p class="form-step-title"><span>3</span>{{ $t("pages.conference.settings") }}</p>
          <div class="flex flex-col gap-4">
            <div v-if="props.mode === 'plan'" class="form-group-border active">
              <i class="pi pi-calendar"></i>
              <input type="datetime-local" name="start_time" :min="minStartTime" />
              <label :class="{ 'label-error': errors.start_time }">
                {{
                  errors.start_time
                    ? errors.start_time[0]
                    : $t("pages.conference.start_time")
                }}
              </label>
            </div>

            <label class="custom-radio-checkbox">
              <input name="is_free" type="checkbox" />
              <span>{{ $t("pages.conference.free_conference") }}</span>
            </label>
          </div>
        </section>

        <div class="form-actions">
          <button class="btn btn-primary" type="submit">
            <i
              class="pi"
              :class="props.mode === 'plan' ? 'pi-calendar-plus' : 'pi-video'"
              aria-hidden="true"
            ></i>
            {{
              props.mode === "plan"
                ? $t("pages.conference.plan")
                : $t("pages.conference.create")
            }}
          </button>
        </div>
      </template>
    </div>
  </template>

  <!-- ===== Школа: группа → глава → урок → время ===== -->
  <template v-else>
    <div
      v-if="props.attributes.groups && props.attributes.groups.length === 0"
      class="db-notice"
    >
      <div class="db-notice-icon" aria-hidden="true">
        <i class="pi pi-info"></i>
      </div>
      <p class="mb-0 flex-1">{{ $t("pages.conference.not_appointed") }}</p>
    </div>

    <div v-else class="form-steps">
      <!-- 1. Группа -->
      <section class="form-step" :class="{ done: selectedGroupId }">
        <p class="form-step-title"><span>1</span>{{ $t("pages.groups.group") }}</p>
        <div class="form-group-border select active label-active">
          <i class="pi pi-users"></i>
          <select name="group_id" v-model="selectedGroupId" @change="onGroupChange">
            <option selected disabled value="">
              {{ $t("pages.groups.choose") }}
            </option>
            <option
              v-for="(group, groupIndex) in props.attributes.groups"
              :key="groupIndex"
              :value="group.group_id"
            >
              {{ group.group_name }} — {{ group.course_name }} ({{
                group.level_name
              }})
            </option>
          </select>
          <label :class="{ 'label-error': errors.group_id }">
            {{ errors.group_id ? errors.group_id[0] : $t("pages.groups.group") }}
          </label>
        </div>

        <!-- Ученики группы стопкой аватаров -->
        <div
          v-if="selectedGroup?.members?.length"
          class="flex items-center gap-2 mt-3"
          :title="memberNames"
        >
          <div class="avatar-stack">
            <userAvatar
              v-for="(member, index) in selectedGroup.members.slice(0, 8)"
              :key="index"
              :padding="0.5"
              :className="'w-7 h-7 text-[10px]'"
              :user="member"
            />
            <span v-if="selectedGroup.members.length > 8" class="avatar-stack-more"
              >+{{ selectedGroup.members.length - 8 }}</span
            >
          </div>
          <span class="text-sm text-inactive">
            {{ $t("pages.groups.members") }}:
            <b class="text-active">{{ selectedGroup.members.length }}</b>
          </span>
        </div>
      </section>

      <!-- 2. Глава и урок -->
      <section v-if="selectedGroupId" class="form-step" :class="{ done: selectedLessonId }">
        <p class="form-step-title"><span>2</span>{{ $t("pages.lessons.lesson") }}</p>
        <div class="flex flex-col gap-4">
          <div class="form-group-border select active label-active">
            <i class="pi pi-bookmark"></i>
            <select name="section_id" v-model="selectedSectionId" @change="onSectionChange">
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
            <label :class="{ 'label-error': errors.section_id }">
              {{
                errors.section_id
                  ? errors.section_id[0]
                  : $t("pages.courses.course_section")
              }}
            </label>
          </div>

          <div v-if="selectedSectionId" class="form-group-border select active label-active">
            <i class="pi pi-book"></i>
            <select name="lesson_id" v-model="selectedLessonId">
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
            <label :class="{ 'label-error': errors.lesson_id }">
              {{ errors.lesson_id ? errors.lesson_id[0] : $t("pages.lessons.lesson") }}
            </label>
          </div>
        </div>
      </section>

      <!-- 3. Время (только при планировании) -->
      <section
        v-if="props.mode === 'plan' && selectedLessonId"
        class="form-step"
      >
        <p class="form-step-title"><span>3</span>{{ $t("pages.conference.start_time") }}</p>
        <div class="form-group-border active">
          <i class="pi pi-calendar"></i>
          <input type="datetime-local" name="start_time" :min="minStartTime" />
          <label :class="{ 'label-error': errors.start_time }">
            {{
              errors.start_time
                ? errors.start_time[0]
                : $t("pages.conference.start_time")
            }}
          </label>
        </div>
      </section>

      <!-- Итог выбора + действие -->
      <div class="form-actions">
        <p v-if="selectedLesson" class="mb-0 text-sm text-inactive min-w-0 flex-1">
          <i class="pi pi-check-circle text-success" aria-hidden="true"></i>
          {{ selectedGroup?.group_name }} ·
          <b class="text-active">{{ selectedLesson.lesson_name }}</b>
        </p>
        <button
          class="btn btn-primary"
          :disabled="!selectedLessonId"
          type="submit"
        >
          <i
            class="pi"
            :class="props.mode === 'plan' ? 'pi-calendar-plus' : 'pi-video'"
            aria-hidden="true"
          ></i>
          {{
            props.mode === "plan"
              ? $t("pages.conference.plan")
              : $t("pages.conference.start_now")
          }}
        </button>
      </div>
    </div>
  </template>
</template>

<script setup>
import userAvatar from "../ui/userAvatar.vue";
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
  props.attributes?.groups?.find(
    (group) => group.group_id === Number(selectedGroupId.value),
  ),
);

const selectedSection = computed(() =>
  selectedGroup.value?.sections?.find(
    (section) => section.section_id === Number(selectedSectionId.value),
  ),
);

const selectedLesson = computed(() =>
  selectedSection.value?.lessons?.find(
    (lesson) => lesson.lesson_id === Number(selectedLessonId.value),
  ),
);

// Вычисляемые свойства для получения выбранных данных B2C
const selectedCourse = computed(() =>
  props.attributes?.courses?.find(
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

// Имена учеников группы — подсказка при наведении на аватары
const memberNames = computed(() =>
  (selectedGroup.value?.members || [])
    .map((m) => `${m.last_name || ""} ${m.first_name || ""}`.trim())
    .join(", "),
);

// Нельзя запланировать на прошедшее время: минимум — текущая минута
const pad = (n) => String(n).padStart(2, "0");
const minStartTime = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
});

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
