<script setup>
import { countdownTimer } from "../../utils/countdownTimer";

const props = defineProps({
  endDate: {
    type: String,
    required: true,
  },
  onComplete: {
    type: Function,
    default: () => {},
  },
});

const { timeLeft } = countdownTimer(props.endDate, props.onComplete);
</script>

<template>
  {{ timeLeft }}
</template>
