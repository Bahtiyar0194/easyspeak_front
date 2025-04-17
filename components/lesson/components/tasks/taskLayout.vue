<template>
  <countdownTaskTimer v-if="props.showTaskTimer" />
  <div v-if="props.showMaterialsBeforeTask" class="custom-grid">
    <materialsList :materials="props.materials" />
    <div class="col-span-12">
      <div class="btn-wrap justify-end">
        <button class="btn btn-light" @click="props.startTask()">
          <i class="pi pi-arrow-right"></i>
          {{ $t("pages.tasks.start_the_task") }}
        </button>
      </div>
    </div>
  </div>
  <div v-else class="custom-grid">
    <div v-if="props.isFinished === false" class="col-span-12">
      <div class="custom-grid">
        <div class="col-span-12">
          <p class="mb-0 text-corp font-medium">{{ props.task.task_name }}</p>
        </div>

        <textViewer
          v-if="props.task.task_example"
          :htmlData="props.task.task_example"
          :title="$t('pages.tasks.task_options.task_example')"
          :className="'bg-inactive border-inactive px-3 py-2 rounded-lg card p-4'"
        />

        <div class="col-span-12">
          <div class="custom-grid">
            <div
              v-if="
                props.materials.length > 0 &&
                (props.showMaterialsOption == 'during_a_task' ||
                  props.showMaterialsOption == 'use_both')
              "
              class="col-span-12 lg:col-span-6"
            >
              <materialsList :materials="props.materials" />
            </div>
            <div
              :class="
                props.materials.length > 0 &&
                (props.showMaterialsOption == 'during_a_task' ||
                  props.showMaterialsOption == 'use_both')
                  ? 'col-span-12 lg:col-span-6'
                  : 'col-span-12'
              "
            >
              <div class="custom-grid">
                <div class="col-span-12">
                  <progressBar :progressPercentage="props.progressPercentage" />
                </div>

                <!--Слот для задания-->
                <slot name="task_content" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!--Слот для результата задания-->
    <div v-else class="col-span-12">
      <div v-if="showTaskResult && props.taskResult" class="custom-grid">
        <div class="col-span-12">
          <taskResultChart :taskResult="props.taskResult"/>
        </div>
      </div>
      <div v-else class="custom-grid">
        <slot name="task_result_content" />
        <div class="col-span-12">
          <div class="btn-wrap justify-end">
            <button class="btn btn-outline-primary" @click="showTaskResult = true">
              <i class="pi pi-chart-bar"></i>
              {{ $t('pages.tasks.show_task_result') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { inject } from "vue";
import { startConfetti, stopConfetti } from "../../../../utils/confetti";
import textViewer from "../../../ui/textViewer.vue";
import countdownTaskTimer from "../../../ui/countdownTaskTimer.vue";
import materialsList from "../materialsList.vue";
import progressBar from "../../../ui/progressBar.vue";
import taskResultChart from "./taskResultChart.vue";

const changeModalSize = inject("changeModalSize");
const showTaskResult = ref(false);

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
  showTaskTimer: {
    type: Boolean,
    required: true,
  },
  showMaterialsOption: {
    required: false,
  },
  showMaterialsBeforeTask: {
    type: Boolean,
    required: true,
  },
  materials: {
    type: Object,
    required: false,
  },
  startTask: {
    type: Function,
    required: true,
  },
  isFinished: {
    type: Boolean,
    required: true,
    default: false,
  },
  progressPercentage: {
    type: Number,
    required: true,
  },
  reStudyItems: {
    type: Object,
    required: false,
  },

  taskResult: {
    type: Object,
    required: false
  }
});

const showConfetti = (items) => {
  if (items && items.length === 0) {
    startConfetti("confetti-canvas");
  }
};

watch(
  () => props.isFinished,
  (value) => {
    if (value === true) {
      changeModalSize("modal-2xl");
      showConfetti(props.reStudyItems);
    }
  }
);

onBeforeUnmount(() => {
  stopConfetti();
});
</script>
