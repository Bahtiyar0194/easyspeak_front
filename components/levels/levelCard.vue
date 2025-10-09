<template>
  <div
    class="card relative overflow-hidden group"
    :class="level.is_available === false ? 'grayscale' : ''"
  >
    <img
      :src="
        config.public.apiBase + '/media/get/' + level.course_name_slug + '.png'
      "
    />

    <div
      class="absolute left-0 bottom-0 w-full group-hover:h-full transition-all duration-200 bg-black bg-opacity-80 flex justify-center items-center group-hover:items-center px-4"
      :class="level.is_available === false ? 'h-full' : 'h-14'"
    >
      <div class="flex flex-col gap-y-2 w-full">
        <div
          class="flex gap-x-2 flex-wrap w-full"
          :class="
            level.is_available === false ? 'justify-center' : 'justify-between'
          "
        >
          <p class="mb-0 text-white leading-none font-bold text-lg">
            {{ level.level_name }}
          </p>

          <p
            v-if="level.is_available === true"
            class="mb-0 text-white leading-none text-lg"
          >
            {{ level.completed_percent.toFixed(2) }}%
          </p>
        </div>

        <p
          v-if="level.is_available === false"
          class="mb-0 text-white text-center text-sm"
        >
          {{ $t(props.message) }}
        </p>
        <template v-if="level.is_available === true">
          <progressBar
            :progressPercentage="level.completed_percent"
            :wrapClass="'!my-0 !bg-white'"
            :showPercentage="false"
            :className="'sm success'"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import progressBar from "../ui/progressBar.vue";
const config = useRuntimeConfig();
const { t } = useI18n();
const props = defineProps({
  level: {
    type: Object,
    required: true,
  },

  message: {
    type: String,
    required: false,
    default: "pages.courses.course_is_not_available",
  },
});
</script>
