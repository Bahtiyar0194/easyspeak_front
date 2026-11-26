<template>
  <div class="col-span-12">
    <canvas id="confetti-canvas"></canvas>
    <div class="flex flex-col gap-5">
      <!-- Сводка: сколько изучено / на повтор -->
      <div v-if="total > 0" class="result-summary">
        <circleProgressBar
          :progress="percent"
          :className="'w-20 h-20'"
          :textClass="'text-lg'"
        />
        <div class="result-stats">
          <div
            v-for="section in props.sections"
            :key="section.title"
            class="result-stat"
            :class="section.tone"
          >
            <b>{{ section.items.length }}</b>
            <span>{{ section.title }}</span>
          </div>
        </div>
      </div>

      <section
        v-for="section in visibleSections"
        :key="section.title"
        class="result-section"
      >
        <p class="result-head" :class="section.tone">
          <span class="result-head-dot" aria-hidden="true"></span>
          {{ section.title }}
          <span class="result-head-count">{{ section.items.length }}</span>
        </p>

        <ul class="result-list">
          <li
            v-for="(item, index) in section.items"
            :key="index"
            class="result-item"
            :class="section.tone"
          >
            <div class="flex-1 min-w-0">
              <p class="mb-0 font-medium break-words">{{ item.title }}</p>
              <p v-if="item.subtitle" class="mb-0 text-inactive text-sm break-words">
                {{ item.subtitle }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <audioButtonMini
                v-if="item.audio"
                :src="config.public.apiBase + '/media/get/' + item.audio"
              />
              <span class="result-status" :class="section.tone" aria-hidden="true">
                <i class="pi" :class="section.icon"></i>
              </span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
// Общий итог тренировки: «изучено» / «на переизучение».
// sections: [{ title, tone: 'ok' | 'bad', icon, items: [{ title, subtitle, audio }] }]
import circleProgressBar from "../../../../ui/circleProgressBar.vue";
import audioButtonMini from "../../../../ui/audioButtonMini.vue";

const config = useRuntimeConfig();

const props = defineProps({
  sections: {
    type: Array,
    required: true,
  },
});

const visibleSections = computed(() =>
  props.sections.filter((s) => s.items && s.items.length > 0),
);

const total = computed(() =>
  props.sections.reduce((sum, s) => sum + (s.items?.length || 0), 0),
);

// Доля изученного (первая секция — «изучено»)
const percent = computed(() =>
  total.value ? Math.round(((props.sections[0]?.items?.length || 0) / total.value) * 100) : 0,
);
</script>
