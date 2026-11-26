<template>
  <button
    type="button"
    class="answer-option"
    :class="[stateClass, props.className]"
    :disabled="props.state === 'locked' || props.state === 'correct'"
    :aria-pressed="props.state === 'correct' || undefined"
  >
    <!-- Номер = клавиша на клавиатуре -->
    <kbd v-if="props.number" class="answer-option-key">{{ props.number }}</kbd>
    <span class="answer-option-text">{{ props.text }}</span>
    <i
      v-if="props.state === 'correct' || props.state === 'wrong'"
      class="pi answer-option-mark"
      :class="props.state === 'correct' ? 'pi-check' : 'pi-times'"
      aria-hidden="true"
    ></i>
  </button>
</template>
<script setup>
const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  number: {
    type: Number,
    required: false,
  },
  // idle | correct | wrong | locked
  state: {
    type: String,
    default: "idle",
  },
  // Дополнительные классы (обратная совместимость)
  className: {
    type: String,
    required: false,
    default: "",
  },
});

const stateClass = computed(() => `is-${props.state}`);
</script>
