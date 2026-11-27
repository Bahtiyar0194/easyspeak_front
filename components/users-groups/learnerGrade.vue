<template>
  <!-- Успеваемость ученика: курсы → уровень → разделы → уроки → задание.
       Одна разметка для вкладок «Пользователи» (с курсов) и «Группы»
       (сразу с уровня группы) -->
  <div class="custom-grid">
    <div class="col-span-12">
      <ul class="breadcrumb">
        <li v-if="props.mode === 'courses'">
          <button
            type="button"
            @click="goToCourses()"
            :class="!activeCourse ? 'inactive' : ''"
          >
            <span>{{ $t("pages.courses.title") }}</span>
          </button>
        </li>
        <li v-if="props.mode === 'courses' && activeCourse">
          <button
            type="button"
            @click="goToLevels()"
            :class="!activeLevel ? 'inactive' : ''"
          >
            <span>{{ activeCourse.course_name }}</span>
          </button>
        </li>
        <li v-if="activeLevel">
          <button
            type="button"
            @click="goToSections()"
            :class="!activeSection ? 'inactive' : ''"
          >
            <span>{{ activeLevel.level_name }}</span>
          </button>
        </li>
        <li v-if="activeSection">
          <button
            type="button"
            @click="goToLessons()"
            :class="!activeLesson ? 'inactive' : ''"
          >
            <span>{{ activeSection.section_name }}</span>
          </button>
        </li>
        <li v-if="activeLesson">
          <button
            type="button"
            @click="goToTasks()"
            :class="!activeTask ? 'inactive' : ''"
          >
            <span>{{ activeLesson.lesson_name }}</span>
          </button>
        </li>
        <li v-if="activeTask">
          <span>{{ activeTask.task_slug }}</span>
        </li>
      </ul>
    </div>

    <div class="col-span-12">
      <div class="custom-grid">
        <!-- Задание -->
        <template v-if="activeTask">
          <div class="col-span-12">
            <button type="button" class="btn btn-light" @click="goToTasks()">
              <i class="pi pi-arrow-left"></i>
              {{ $t("back") }}
            </button>
          </div>
          <div class="col-span-12">
            <taskResultChart :taskResult="activeTask.task_result" />
          </div>
        </template>

        <!-- Урок: задания -->
        <template v-else-if="activeLesson">
          <div class="col-span-12">
            <button type="button" class="btn btn-light" @click="goToLessons()">
              <i class="pi pi-arrow-left"></i>
              {{ $t("back") }}
            </button>
          </div>

          <div class="col-span-12">
            <div class="grade-summary">
              <circleProgressBar
                :progress="activeLesson.completed_tasks_percent"
                :className="'w-14 h-14 shrink-0'"
                :textClass="'text-sm'"
              />
              <div class="flex flex-col gap-0.5 min-w-0">
                <b class="leading-snug">{{ activeLesson.lesson_name }}</b>
                <span class="text-sm text-inactive">{{
                  $t("pages.tasks.completed_of", {
                    done: activeLesson.completed_tasks_count,
                    total: activeLesson.tasks.length,
                  })
                }}</span>
              </div>
            </div>
          </div>

          <div class="col-span-12">
            <ul v-if="activeLesson.tasks.length" class="task-list">
              <li v-for="taskItem in activeLesson.tasks" :key="taskItem.task_id">
                <div
                  class="task-row"
                  :class="{ done: taskState(taskItem) === 'done' }"
                >
                  <button
                    type="button"
                    class="task-row-main"
                    :disabled="taskState(taskItem) !== 'done'"
                    :title="
                      taskState(taskItem) === 'done'
                        ? $t('pages.tasks.show_task_result')
                        : ''
                    "
                    @click="selectTask(taskItem)"
                  >
                    <span class="task-icon" aria-hidden="true">
                      <i :class="taskItem.icon"></i>
                    </span>

                    <span class="flex-1 min-w-0 flex flex-col gap-1 text-left">
                      <span class="font-semibold leading-snug">{{
                        taskItem.task_slug
                      }}</span>
                      <span class="text-xs text-inactive">{{
                        taskItem.task_type_name
                      }}</span>
                      <span class="lesson-badges">
                        <span
                          v-if="taskState(taskItem) === 'done'"
                          class="lesson-badge success"
                        >
                          <i class="pi pi-check" aria-hidden="true"></i>
                          {{ $t("pages.tasks.status.completed") }}
                        </span>
                        <span
                          v-else-if="taskState(taskItem) === 'review'"
                          class="lesson-badge warning"
                        >
                          <i class="pi pi-clock" aria-hidden="true"></i>
                          {{ $t("pages.tasks.status.reviewing") }}
                        </span>
                        <span v-else class="lesson-badge text-inactive">
                          {{ $t("pages.tasks.status.not_completed") }}
                        </span>
                      </span>
                    </span>

                    <circleProgressBar
                      v-if="taskState(taskItem) === 'done'"
                      :progress="taskItem.task_result.percentage"
                      :className="'w-11 h-11 shrink-0'"
                      :textClass="'text-[10px]'"
                    />
                  </button>
                </div>
              </li>
            </ul>

            <emptyState
              v-else
              :text="$t('pages.tasks.there_are_no_tasks')"
              icon="bi bi-inbox"
            />
          </div>
        </template>

        <!-- Раздел: уроки -->
        <template v-else-if="activeSection">
          <div class="col-span-12">
            <button type="button" class="btn btn-light" @click="goToSections()">
              <i class="pi pi-arrow-left"></i>
              {{ $t("back") }}
            </button>
          </div>

          <div class="col-span-12">
            <div class="grade-summary">
              <circleProgressBar
                :progress="activeSection.completed_percent"
                :className="'w-14 h-14 shrink-0'"
                :textClass="'text-sm'"
              />
              <div class="flex flex-col gap-0.5 min-w-0">
                <b class="leading-snug">{{ activeSection.section_name }}</b>
                <span class="text-sm text-inactive">{{
                  $t("pages.tasks.average_result")
                }}</span>
              </div>
            </div>
          </div>

          <div class="col-span-12">
            <ol v-if="activeSection.lessons.length" class="lesson-path">
              <li
                v-for="(lesson, lessonIndex) in activeSection.lessons"
                :key="lessonIndex"
              >
                <button
                  type="button"
                  class="lesson-row"
                  :class="{ done: lesson.completed_tasks_percent >= 100 }"
                  @click="selectLesson(lesson)"
                >
                  <span class="unit-num" aria-hidden="true">
                    <i
                      v-if="lesson.completed_tasks_percent >= 100"
                      class="pi pi-check"
                    ></i>
                    <template v-else>{{ lessonIndex + 1 }}</template>
                  </span>

                  <div class="flex-1 min-w-0 flex flex-col gap-1 text-left">
                    <span class="font-semibold leading-snug">{{
                      lesson.lesson_name
                    }}</span>
                    <span class="lesson-meta !gap-x-3">
                      <span v-if="lesson.lesson_type_name">
                        <i class="pi pi-tag" aria-hidden="true"></i>
                        {{ lesson.lesson_type_name }}
                      </span>
                      <span>
                        <i class="pi pi-pencil" aria-hidden="true"></i>
                        {{ $t("pages.tasks.tasks_count") }}:
                        {{ lesson.tasks_count }}
                      </span>
                    </span>
                  </div>

                  <circleProgressBar
                    v-if="lesson.completed_tasks_percent > 0"
                    :progress="lesson.completed_tasks_percent"
                  />
                  <i
                    v-else
                    class="pi pi-chevron-right text-inactive"
                    aria-hidden="true"
                  ></i>
                </button>
              </li>
            </ol>

            <emptyState
              v-else
              :text="$t('pages.lessons.there_is_no_lessons_alt')"
              icon="bi bi-inbox"
            />
          </div>
        </template>

        <!-- Уровень: разделы -->
        <template v-else-if="activeLevel">
          <div v-if="props.mode === 'courses'" class="col-span-12">
            <button type="button" class="btn btn-light" @click="goToLevels()">
              <i class="pi pi-arrow-left"></i>
              {{ $t("back") }}
            </button>
          </div>

          <div class="col-span-12">
            <div class="grade-summary">
              <circleProgressBar
                :progress="activeLevel.completed_percent"
                :className="'w-14 h-14 shrink-0'"
                :textClass="'text-sm'"
              />
              <div class="flex flex-col gap-0.5 min-w-0">
                <b class="leading-snug">{{ activeLevel.level_name }}</b>
                <span class="text-sm text-inactive">{{
                  $t("pages.tasks.average_result")
                }}</span>
              </div>
            </div>
          </div>

          <div class="col-span-12">
            <div
              v-if="activeLevel.sections?.length"
              class="grid lg:grid-cols-2 gap-3"
            >
              <button
                v-for="(section, sectionIndex) in activeLevel.sections"
                :key="sectionIndex"
                type="button"
                class="unit-card text-left"
                :class="{
                  done: section.completed_percent >= 100,
                  empty: !section.lessons.length,
                }"
                @click="selectSection(section)"
              >
                <span class="unit-num" aria-hidden="true">
                  <i
                    v-if="section.completed_percent >= 100"
                    class="pi pi-check"
                  ></i>
                  <template v-else>{{ sectionIndex + 1 }}</template>
                </span>

                <div class="flex-1 min-w-0 flex flex-col gap-1.5">
                  <h5 class="mb-0 leading-snug">{{ section.section_name }}</h5>
                  <span class="text-sm text-inactive">
                    <i class="pi pi-book text-xs" aria-hidden="true"></i>
                    {{ $t("pages.lessons.lessons_count") }}:
                    <b class="text-active">{{ section.lessons.length }}</b>
                  </span>
                  <div
                    v-if="
                      section.completed_percent > 0 &&
                      section.completed_percent < 100
                    "
                    class="unit-progress"
                  >
                    <div :style="{ width: section.completed_percent + '%' }"></div>
                  </div>
                </div>

                <span
                  v-if="section.completed_percent > 0"
                  class="unit-percent"
                  :class="{ 'text-success': section.completed_percent >= 100 }"
                  >{{ Math.round(section.completed_percent) }}%</span
                >
                <i
                  v-else
                  class="pi pi-chevron-right text-inactive"
                  aria-hidden="true"
                ></i>
              </button>
            </div>

            <emptyState
              v-else
              :text="$t('pages.courses.not_sections')"
              icon="bi bi-inbox"
            />
          </div>
        </template>

        <!-- Курс: уровни -->
        <template v-else-if="activeCourse">
          <div class="col-span-12">
            <button type="button" class="btn btn-light" @click="goToCourses()">
              <i class="pi pi-arrow-left"></i>
              {{ $t("back") }}
            </button>
          </div>
          <div
            v-for="(level, levelIndex) in activeCourse.levels"
            :key="levelIndex"
            class="col-span-12 md:col-span-4"
          >
            <button
              type="button"
              class="block w-full text-left"
              @click="
                level.available_status.is_available === true
                  ? selectLevel(level)
                  : null
              "
              :class="
                level.available_status.is_available === true
                  ? 'cursor-pointer'
                  : 'cursor-not-allowed'
              "
            >
              <levelCard
                :level="level"
                :showProgressBar="true"
                :message="'pages.courses.course_is_not_available_for_learner'"
              />
            </button>
          </div>
        </template>

        <!-- Курсы -->
        <template v-else>
          <div
            v-for="(course, courseIndex) in props.courses"
            :key="courseIndex"
            class="col-span-12"
          >
            <button
              type="button"
              class="block w-full text-left"
              @click="selectCourse(course)"
            >
              <courseCard :course="course" />
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import emptyState from "~/components/ui/emptyState.vue";
import courseCard from "../courses/courseCard.vue";
import levelCard from "../levels/levelCard.vue";
import circleProgressBar from "../ui/circleProgressBar.vue";
import taskResultChart from "../lesson/components/tasks/taskResultChart.vue";

const props = defineProps({
  // courses — начинать со списка курсов (вкладка «Пользователи»),
  // level — сразу с уровня группы (вкладка «Группы»)
  mode: { type: String, default: "courses" },
  courses: { type: Array, default: () => [] },
  level: { type: Object, default: null },
  userId: { type: [Number, String], required: true },
});

// size — класс ширины окна для текущего шага, pending — показать загрузку
const emit = defineEmits(["size", "pending"]);

const router = useRouter();
const { $axiosPlugin } = useNuxtApp();

const activeCourse = ref(null);
const activeLevel = ref(props.mode === "level" ? props.level : null);
const activeSection = ref(null);
const activeLesson = ref(null);
const activeTask = ref(null);

const WIDE = "modal-4xl";
const MEDIUM = "modal-2xl";

// Ширина по умолчанию для стартового шага
const defaultSize = () => (props.mode === "level" ? "modal-lg" : MEDIUM);

watch(
  () => props.level,
  (level) => {
    if (props.mode === "level") activeLevel.value = level;
  },
);

// Короткая пауза с загрузкой — как раньше, чтобы смена шага не «прыгала»
const step = (apply, size) => {
  emit("pending", true);
  setTimeout(() => {
    emit("size", size);
    apply();
    emit("pending", false);
  }, 200);
};

const selectCourse = (course) => step(() => (activeCourse.value = course), WIDE);

const goToCourses = () => {
  emit("size", defaultSize());
  activeCourse.value = null;
  activeLevel.value = null;
  activeSection.value = null;
  activeLesson.value = null;
  activeTask.value = null;
};

const selectLevel = (level) => step(() => (activeLevel.value = level), MEDIUM);

const goToLevels = () => {
  emit("size", WIDE);
  activeLevel.value = null;
  activeSection.value = null;
  activeLesson.value = null;
  activeTask.value = null;
};

const selectSection = (section) => step(() => (activeSection.value = section), WIDE);

const goToSections = () => {
  emit("size", props.mode === "level" ? defaultSize() : MEDIUM);
  activeSection.value = null;
  activeLesson.value = null;
  activeTask.value = null;
};

const selectLesson = async (lesson) => {
  emit("pending", true);

  await $axiosPlugin
    .post("courses/get_lesson_grade", {
      lesson_id: lesson.lesson_id,
      user_id: props.userId,
    })
    .then((response) => {
      emit("size", WIDE);
      activeLesson.value = response.data;
      emit("pending", false);
    })
    .catch((err) => {
      if (err.response) {
        router.push({
          path: "/error",
          query: {
            status: err.response.status,
            message: err.response.data?.message,
            url: err.request?.responseURL,
          },
        });
      } else {
        router.push("/error");
      }
    });
};

const goToLessons = () => {
  emit("size", WIDE);
  activeLesson.value = null;
  activeTask.value = null;
};

const selectTask = (task) => step(() => (activeTask.value = task), MEDIUM);

const goToTasks = () => {
  emit("size", WIDE);
  activeTask.value = null;
};

// Состояние задания: done | review (ждёт проверки учителя) | not_completed
const taskState = (taskItem) => {
  const result = taskItem.task_result;
  if (result?.completed === true) return "done";
  if (result?.answers) return "review";
  return "not_completed";
};
</script>
