<template>
  <div class="alert light empty-state" :aria-busy="props.pending || undefined">
    <loader
      v-if="props.pending"
      :className="'overlay'"
      :showPendingText="true"
    />
    <!-- Иллюстрация или иконка на мягком круглом фоне -->
    <div v-if="props.image || props.icon" class="empty-state-visual" aria-hidden="true">
      <img v-if="props.image" class="empty-state-image" :src="props.image" alt="" />
      <i v-else class="empty-state-icon" :class="props.icon"></i>
    </div>
    <p class="empty-state-text">{{ props.text }}</p>
    <p v-if="props.hint" class="empty-state-hint">{{ props.hint }}</p>
    <div v-if="$slots.default" class="empty-state-actions">
      <slot />
    </div>
  </div>
</template>

<script setup>
// Единый блок «пусто / ничего не найдено».
// <emptyState v-else :pending="pending" :text="$t('nothing_was_found_for_your_query')">
//   <button class="btn btn-primary" @click="...">Добавить</button>   ← необязательно
// </emptyState>
import loader from "./loader.vue";

const props = defineProps({
  text: { type: String, required: true },
  hint: { type: String, default: "" },
  icon: { type: String, default: "bi bi-inbox" },
  image: { type: String, default: "" },
  pending: { type: Boolean, default: false },
});
</script>
