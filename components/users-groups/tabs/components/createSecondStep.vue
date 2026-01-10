<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <div class="form-group-border active">
        <i class="pi pi-calendar"></i>
        <input type="date" name="start_date" />
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
      <div class="form-group-border active">
        <i class="pi pi-clock"></i>
        <input type="time" name="start_time" />
        <label :class="{ 'label-error': errors.start_time }">
          {{
            errors.start_time
              ? errors.start_time[0]
              : $t("pages.schedule.start_time")
          }}
        </label>
      </div>
    </div>

    <div class="col-span-12">
      <p class="mb-0" :class="errors.selected_days ? 'text-danger' : ''">
        {{
          errors.selected_days
            ? $t("pages.schedule.select_lesson_days")
            : $t("pages.schedule.lesson_days")
        }}:
      </p>
    </div>

    <div class="col-span-12">
      <div class="flex flex-col gap-y-0.5">
        <div v-for="day in daysOfWeek" :key="day.id">
          <label class="custom-radio-checkbox text-nowrap">
            <input type="checkbox" :value="day.id" v-model="selectedDays" />
            <span>{{ day.name }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },
  daysOfWeek: {
    type: Array,
    required: true,
  },
  selectedDays: {
    type: Object,
    required: true,
  },
});

const { errors, daysOfWeek, selectedDays } = toRefs(props);
</script>
