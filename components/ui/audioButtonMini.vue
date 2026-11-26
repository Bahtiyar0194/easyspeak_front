<template>
  <button
    type="button"
    class="btn btn-square btn-xs audio-btn"
    :class="[
      props.className,
      hasError ? 'btn-danger' : isPlaying ? 'btn-outline-primary playing' : 'btn-primary',
    ]"
    @click="toggle"
    :title="label"
    :aria-label="label"
    :aria-pressed="isPlaying"
  >
    <i
      class="pi"
      :class="
        isLoading
          ? 'pi-spinner btn-loading-circle'
          : hasError
            ? 'pi-exclamation-triangle'
            : isPlaying
              ? 'pi-pause'
              : 'pi-volume-up'
      "
      aria-hidden="true"
    ></i>
  </button>
</template>

<script setup>
import { useAudioToggle } from "~/composables/useAudioToggle";

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  className: {
    type: String,
    required: false,
  },
});

const { t } = useI18n();
const { isPlaying, isLoading, hasError, toggle } = useAudioToggle(
  toRef(props, "src"),
);

const label = computed(() =>
  hasError.value
    ? t("file.audio.load_error")
    : t(
        isPlaying.value
          ? "file.audio.click_to_stop_to_the_audio"
          : "file.audio.click_to_listen_to_the_audio",
      ),
);
</script>
