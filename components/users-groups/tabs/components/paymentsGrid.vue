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
      <div class="col-span-12">
        <scrollFadeContainer :maxHeight="500" :fadeSize="60">
          <div class="custom-grid">
            <div
              v-for="(lesson, lessonIndex) in schedule"
              :key="lessonIndex"
              class="col-span-12 lg:col-span-6"
            >
              <div class="card">
                <div
                  class="border-b-inactive p-3"
                  :class="lesson.is_gone === true ? '' : 'bg-inactive'"
                >
                  <p
                    class="mb-0"
                    :class="lesson.is_gone === true ? 'text-inactive' : ''"
                  >
                    <b>{{ lesson.start_time_formatted }}</b> -
                    {{ lesson.lesson_name }}
                  </p>
                  <p
                    class="text-xs mb-0"
                    :class="lesson.is_gone === true ? 'text-inactive' : ''"
                  >
                    {{ lesson.lesson_type_name }}
                  </p>
                </div>

                <div class="flex flex-col gap-y-1 p-3">
                  <div
                    v-for="(member, memberIndex) in lesson.members"
                    :key="memberIndex"
                    class="flex flex-wrap gap-y-1 gap-x-2 items-center justify-between"
                  >
                    <span
                      class="font-medium"
                      :class="lesson.is_gone === true ? 'text-inactive' : ''"
                      >{{ member.last_name }} {{ member.first_name }}</span
                    >
                    <div class="flex gap-x-2 items-center my-1">
                      <label
                        class="ios-switch"
                        :title="
                          editIsAvailable === false
                            ? $t('pages.payment.forms.message_1')
                            : ''
                        "
                      >
                        <input
                          type="checkbox"
                          :disabled="
                            editIsAvailable === false ||
                            (member.is_bought === true &&
                              member.bought_lesson &&
                              member.user_id ===
                                member.bought_lesson.iniciator_id)
                          "
                          :checked="member.is_bought === true"
                          v-model="member.is_bought"
                          @change="
                            changePaymentStatus(
                              member.user_id,
                              lesson.lesson_id,
                              $event.target.checked
                            )
                          "
                        />
                        <span class="slider"></span>
                      </label>

                      <p class="mb-0">
                        {{
                          member.is_bought === true
                            ? member.bought_lesson
                              ? member.user_id ===
                                member.bought_lesson.iniciator_id
                                ? $t("pages.lessons.bought_by_learner")
                                : (member.bought_lesson.is_free === 1 &&
                                    $t("pages.lessons.free_lesson")) ||
                                  (member.bought_lesson.is_free === 0 &&
                                    $t("pages.payment-result.success_alt"))
                              : $t("pages.payment-result.success_alt")
                            : $t("pages.payment-result.fail_alt_2")
                        }}

                        <span
                          class="text-inactive"
                          v-if="
                            newPayments.length &&
                            newPayments.find(
                              (p) =>
                                p.user_id === member.user_id &&
                                p.lesson_id === lesson.lesson_id
                            )
                          "
                          >({{ $t("changed") }})</span
                        >
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </scrollFadeContainer>
      </div>
    </div>
  </div>
  <div v-else class="col-span-12">
    <alert :className="'light'">
      <img
        class="w-24 mx-auto mb-2"
        src="~/public/images/calendar-search.svg"
      />
      <p class="mb-0">
        <b>{{ props.emptyMessage }}</b>
      </p>
    </alert>
  </div>
</template>

<script setup>
import alert from "../../../ui/alert.vue";
import scrollFadeContainer from "../../../ui/scrollFadeContainer.vue";

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
</script>
