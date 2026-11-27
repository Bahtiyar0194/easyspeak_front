<template>
  <div v-if="schedule.length" class="col-span-12">
    <div class="custom-grid">
      <div v-if="editIsAvailable === false" class="col-span-12">
        <alert :className="'outline-danger'">
          <p class="mb-0">
            <b>{{ $t("pages.payment.forms.message_1") }}</b>
          </p>
        </alert>
      </div>

      <!-- Ведомость: ученики по строкам, уроки по колонкам. Имена закреплены
           слева, уроки прокручиваются по горизонтали -->
      <div class="col-span-12">
        <div class="payments-matrix-wrap">
          <table class="payments-matrix">
            <thead>
              <tr>
                <th class="pm-name" scope="col">{{ $t("learner") }}</th>
                <th
                  v-for="lesson in schedule"
                  :key="lessonKey(lesson)"
                  scope="col"
                  class="pm-lesson"
                  :class="{ gone: lesson.is_gone === true }"
                  :title="lessonTitle(lesson)"
                >
                  <span class="pm-date">{{ shortDate(lesson) }}</span>
                  <span class="pm-lesson-name">{{ lesson.lesson_name }}</span>
                  <!-- Массово по уроку -->
                  <button
                    v-if="editIsAvailable && editableMembers(lesson).length"
                    type="button"
                    class="pm-bulk"
                    :aria-label="bulkLabel(lessonAllPaid(lesson))"
                    :title="bulkLabel(lessonAllPaid(lesson))"
                    @click="toggleLesson(lesson)"
                  >
                    <i
                      class="pi"
                      :class="lessonAllPaid(lesson) ? 'pi-minus' : 'pi-check-square'"
                      aria-hidden="true"
                    ></i>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="learner in learners" :key="learner.user_id">
                <th class="pm-name" scope="row">
                  <span class="flex items-center justify-between gap-2">
                    <span class="min-w-0 flex flex-col">
                      <span class="font-medium truncate"
                        >{{ learner.last_name }} {{ learner.first_name }}</span
                      >
                      <span class="text-xs text-inactive">
                        {{ $t("pages.groups.paid_of", paidCount(learner.user_id)) }}
                      </span>
                    </span>
                    <!-- Массово по ученику: все уроки вкладки -->
                    <button
                      v-if="editIsAvailable"
                      type="button"
                      class="pm-bulk"
                      :aria-label="bulkLabel(learnerAllPaid(learner.user_id))"
                      :title="bulkLabel(learnerAllPaid(learner.user_id))"
                      @click="toggleLearner(learner.user_id)"
                    >
                      <i
                        class="pi"
                        :class="learnerAllPaid(learner.user_id) ? 'pi-minus' : 'pi-check-square'"
                        aria-hidden="true"
                      ></i>
                    </button>
                  </span>
                </th>
                <td v-for="lesson in schedule" :key="lessonKey(lesson)">
                  <button
                    v-if="memberOf(lesson, learner.user_id)"
                    type="button"
                    class="pm-cell"
                    :class="[
                      statusOf(memberOf(lesson, learner.user_id)).key,
                      { changed: isChanged(memberOf(lesson, learner.user_id), lesson) },
                    ]"
                    :disabled="isLocked(memberOf(lesson, learner.user_id))"
                    :aria-pressed="memberOf(lesson, learner.user_id).is_bought === true"
                    :aria-label="cellLabel(lesson, learner)"
                    :title="statusOf(memberOf(lesson, learner.user_id)).label"
                    @click="toggleCell(lesson, learner.user_id)"
                  >
                    <i
                      class="pi"
                      :class="statusOf(memberOf(lesson, learner.user_id)).icon"
                      aria-hidden="true"
                    ></i>
                  </button>
                  <span v-else class="pm-empty" aria-hidden="true">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Что значат значки -->
        <ul class="pm-legend">
          <li>
            <span class="pm-cell paid static"><i class="pi pi-check"></i></span>
            {{ $t("pages.payment-result.success_alt") }}
          </li>
          <li>
            <span class="pm-cell learner static"><i class="pi pi-user"></i></span>
            {{ $t("pages.lessons.bought_by_learner") }}
          </li>
          <li>
            <span class="pm-cell free static"><i class="pi pi-gift"></i></span>
            {{ $t("pages.lessons.free_lesson") }}
          </li>
          <li>
            <span class="pm-cell unpaid static"><i class="pi pi-times"></i></span>
            {{ $t("pages.payment-result.fail_alt_2") }}
          </li>
          <li v-if="newPayments.length">
            <span class="pm-cell paid changed static"></span>
            {{ $t("changed") }}
          </li>
        </ul>
      </div>
    </div>
  </div>
  <div v-else class="col-span-12">
    <emptyState
      :text="props.emptyMessage"
      image="/images/calendar-search.svg"
    />
  </div>
</template>

<script setup>
import alert from "../../../ui/alert.vue";
import emptyState from "~/components/ui/emptyState.vue";

const { t, locale } = useI18n();
const intlLocale = computed(() => String(locale.value || "ru").split("-")[0]);

const props = defineProps({
  schedule: {
    type: Object,
    required: true,
  },
  newPayments: {
    type: Object,
    required: true,
  },
  changePaymentStatus: {
    type: Function,
    required: true,
  },

  emptyMessage: {
    type: String,
    required: true,
  },

  editIsAvailable: {
    type: Boolean,
    required: true,
    default: true,
  },
});

const { schedule, newPayments, changePaymentStatus, editIsAvailable } =
  toRefs(props);

const lessonKey = (lesson) => `${lesson.lesson_id}-${lesson.start_time}`;

const lessonTitle = (lesson) =>
  [lesson.start_time_formatted, lesson.section_name, lesson.lesson_name]
    .filter(Boolean)
    .join(" · ");

// «24.11, 14:00» — коротко для заголовка колонки
const shortDate = (lesson) => {
  if (lesson.date) {
    const d = new Date(`${lesson.date}T00:00:00`).toLocaleDateString(intlLocale.value, {
      day: "2-digit",
      month: "2-digit",
    });
    return lesson.time ? `${d}, ${String(lesson.time).slice(0, 5)}` : d;
  }
  return lesson.start_time_formatted || "";
};

const bulkLabel = (allPaid) =>
  allPaid ? t("pages.groups.unmark_all") : t("pages.groups.mark_all");

const memberOf = (lesson, userId) =>
  (lesson.members || []).find((m) => m.user_id === userId) || null;

// Оплату, которую ученик внёс сам, отменить нельзя
const boughtByLearner = (member) =>
  member.is_bought === true &&
  member.bought_lesson &&
  member.user_id === member.bought_lesson.iniciator_id;

const isLocked = (member) => editIsAvailable.value === false || boughtByLearner(member);

// Каждое реальное переключение — один вызов changePaymentStatus: он хранит
// разницу с исходным состоянием (повторное переключение убирает запись)
const setMember = (lesson, member, value) => {
  if (isLocked(member) || member.is_bought === value) return;
  member.is_bought = value;
  changePaymentStatus.value(member.user_id, lesson.lesson_id, value);
};

const toggleCell = (lesson, userId) => {
  const member = memberOf(lesson, userId);
  if (member) setMember(lesson, member, member.is_bought !== true);
};

const editableMembers = (lesson) => (lesson.members || []).filter((m) => !isLocked(m));

const lessonAllPaid = (lesson) =>
  editableMembers(lesson).every((m) => m.is_bought === true);

const toggleLesson = (lesson) => {
  const value = !lessonAllPaid(lesson);
  for (const member of editableMembers(lesson)) setMember(lesson, member, value);
};

// Ученики вкладки — строки ведомости
const learners = computed(() => {
  const seen = new Map();
  for (const lesson of schedule.value || []) {
    for (const m of lesson.members || []) {
      if (!seen.has(m.user_id)) seen.set(m.user_id, m);
    }
  }
  return [...seen.values()];
});

const learnerAllPaid = (userId) =>
  (schedule.value || []).every((lesson) => {
    const m = memberOf(lesson, userId);
    return !m || isLocked(m) || m.is_bought === true;
  });

const toggleLearner = (userId) => {
  const value = !learnerAllPaid(userId);
  for (const lesson of schedule.value || []) {
    const member = memberOf(lesson, userId);
    if (member) setMember(lesson, member, value);
  }
};

// Оплачено N из M по ученику в этой вкладке
const paidCount = (userId) => {
  let done = 0;
  let total = 0;
  for (const lesson of schedule.value || []) {
    const m = memberOf(lesson, userId);
    if (!m) continue;
    total++;
    if (m.is_bought === true) done++;
  }
  return { done, total };
};

const isChanged = (member, lesson) =>
  newPayments.value.some(
    (p) => p.user_id === member.user_id && p.lesson_id === lesson.lesson_id,
  );

// Статус оплаты: кто и как оплатил
const statusOf = (member) => {
  if (member.is_bought !== true) {
    return { key: "unpaid", icon: "pi-times", label: t("pages.payment-result.fail_alt_2") };
  }
  if (boughtByLearner(member)) {
    return { key: "learner", icon: "pi-user", label: t("pages.lessons.bought_by_learner") };
  }
  if (member.bought_lesson?.is_free === 1) {
    return { key: "free", icon: "pi-gift", label: t("pages.lessons.free_lesson") };
  }
  return { key: "paid", icon: "pi-check", label: t("pages.payment-result.success_alt") };
};

const cellLabel = (lesson, learner) =>
  `${learner.last_name} ${learner.first_name}, ${shortDate(lesson)}: ${
    statusOf(memberOf(lesson, learner.user_id)).label
  }`;
</script>
