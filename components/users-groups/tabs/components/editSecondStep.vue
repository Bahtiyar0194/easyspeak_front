<template>
  <div v-if="currentGroup" class="custom-grid">
    <div class="col-span-12">
      <div class="form-group-border active">
        <i class="pi pi-calendar"></i>
        <input
          type="date"
          name="start_date"
          v-model="currentGroup.start_date"
        />
        <label :class="{ 'label-error': errors.start_date }">
          {{
            errors.start_date
              ? errors.start_date[0]
              : $t("pages.schedule.start_date")
          }}
        </label>
      </div>
    </div>

    <div class="col-span-12">
      <p
        class="mb-0 font-medium select-none"
        :class="errors.selected_days ? 'text-danger' : ''"
      >
        {{
          errors.selected_days
            ? $t("pages.schedule.select_lesson_days")
            : $t("pages.schedule.lesson_days")
        }}:
      </p>
    </div>

    <div class="col-span-12" v-if="selectedDays && selectedDays.length">
      <div class="flex flex-col gap-y-5">
        <div
          v-for="day in selectedDays"
          :key="day.id"
          class="flex flex-wrap gap-x-2 gap-y-4"
        >
          <label
            class="custom-radio-checkbox text-nowrap bg-inactive border-inactive py-2 px-3 rounded-xl"
          >
            <input type="checkbox" v-model="day.selected" />
            <span>{{ day.name }}</span>
          </label>

          <div class="form-group-border active flex-1">
            <i class="pi pi-clock"></i>
            <input
              type="time"
              :disabled="!day.selected"
              v-model="day.start_time"
            />
            <label
              :class="{
                'label-error':
                  day.selected === true && errors.start_time && !day.start_time,
              }"
            >
              {{
                day.selected === true && errors.start_time && !day.start_time
                  ? errors.start_time[0]
                  : $t("pages.schedule.start_time")
              }}
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="col-span-12">
      <div class="flex flex-col gap-y-2">
        <p class="font-medium mb-0 select-none">
          {{ $t("pages.schedule.options") }}:
        </p>
        <label
          class="custom-radio !w-fit"
          :title="$t('pages.schedule.only_future.description')"
        >
          <input
            type="radio"
            value="only_future"
            checked
            name="schedule_option"
          />
          <span>{{ $t("pages.schedule.only_future.title") }}</span>
        </label>

        <label
          class="custom-radio !w-fit"
          :title="$t('pages.schedule.new_schedule.description')"
        >
          <input type="radio" value="new_schedule" name="schedule_option" />
          <span>{{ $t("pages.schedule.new_schedule.title") }}</span>
        </label>
      </div>
    </div>

    <div class="col-span-12">
      <label class="custom-radio-checkbox text-nowrap mt-2">
        <input
          type="checkbox"
          name="all_lessons_is_conference"
          :checked="currentGroup.all_lessons_is_conference === 1"
        />
        <span>{{ $t("pages.lessons.all_lessons_is_conference") }}</span>
      </label>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },

  currentGroup: {
    type: Object,
    required: false,
  },

  selectedDays: {
    type: Object,
    required: true,
  },
});

const { errors, currentGroup, selectedDays } = toRefs(props);
</script>
