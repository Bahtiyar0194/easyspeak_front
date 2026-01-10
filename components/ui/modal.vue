<template>
  <div
    class="modal-backdrop"
    :class="isVisible && 'show'"
    @click.self="props.closeOnClickSelf && closeModal()"
  >
    <div class="modal" :class="props.className">
      <loader
        v-if="props.showLoader"
        :className="
          props.loaderOpacityFull === true ? 'overlay opacity-full' : 'overlay'
        "
        :showPendingText="props.showPendingText"
        :pendingText="props.pendingText"
        :progress="props.progress"
      />
      <div class="modal-header">
        <slot name="header_content" />
        <span
          :title="$t('close')"
          @click="closeModal"
          class="modal-close-button"
        >
          <i class="bi bi-x"></i>
        </span>
      </div>
      <div class="modal-body">
        <slot name="body_content" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, ref } from "vue";
import loader from "./loader.vue";

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  className: {
    type: String,
    required: false,
  },
  showLoader: {
    type: Boolean,
    required: false,
  },
  progress: {
    type: Number,
    required: false,
    default: 0,
  },
  loaderOpacityFull: {
    type: Boolean,
    required: false,
  },
  onClose: {
    type: Function,
    required: true,
  },
  closeOnClickSelf: {
    type: Boolean,
    required: true,
  },
  showPendingText: {
    type: Boolean,
    required: false,
    default: false,
  },
  pendingText: {
    type: String,
    required: false,
    default: ''
  },
});

const isVisible = ref(props.show);
const loaderIsVisible = ref(props.showLoader);

watch(
  () => props.show,
  (newVal) => {
    isVisible.value = newVal;
  }
);

watch(
  () => props.showLoader,
  (newVal) => {
    loaderIsVisible.value = newVal;
  }
);

const closeModal = () => {
  isVisible.value = false;
  if (props.onClose) {
    props.onClose();
  }
};
</script>
