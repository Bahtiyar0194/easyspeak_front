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

                <textViewer v-if="props.task.task_example" :htmlData="props.task.task_example" :title="$t('pages.tasks.task_options.task_example')" :className="'bg-inactive border-inactive px-3 py-2 rounded-lg'"/>

                <div class="col-span-12">
                    <div class="custom-grid">
                        <div v-if="props.materials.length > 0 && (props.showMaterialsOption == 'during_a_task' || props.showMaterialsOption == 'use_both')"
                            class="col-span-12 lg:col-span-6">
                            <materialsList :materials="props.materials" />
                        </div>
                        <div
                            :class="props.materials.length > 0 && (props.showMaterialsOption == 'during_a_task' || props.showMaterialsOption == 'use_both') ? 'col-span-12 lg:col-span-6' : 'col-span-12'">
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

        <!--Слот для итогового результата задания-->
        <slot v-else name="task_result_content" />
    </div>
</template>
<script setup>
import textViewer from '../../../ui/textViewer.vue';
import countdownTaskTimer from '../../../ui/countdownTaskTimer.vue';
import materialsList from '../materialsList.vue';
import progressBar from '../../../ui/progressBar.vue';

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
        type: String,
        required: true
    },
    showMaterialsBeforeTask: {
        type: Boolean,
        required: true
    },
    materials: {
        type: Object,
        required: false,
    },
    startTask: {
        type: Function,
        required: true
    },
    isFinished: {
        type: Boolean,
        required: true,
        default: false
    },
    progressPercentage: {
        type: Number,
        required: true
    }
});
</script>