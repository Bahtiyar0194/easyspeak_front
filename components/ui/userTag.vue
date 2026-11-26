<template>
  <div
    ref="root"
    class="user-tag"
    :class="{ selectable: props.selectable, closable: props.closable }"
    :role="props.selectable ? 'button' : undefined"
    :tabindex="props.selectable ? 0 : undefined"
    :title="fullName"
    @keydown.enter.prevent="props.selectable && root?.click()"
    @keydown.space.prevent="props.selectable && root?.click()"
  >
    <userAvatar
      :padding="0.5"
      :className="'w-6 h-6 text-[9px]'"
      :user="props.user"
    />
    <span class="user-tag-name">{{ fullName }}</span>
    <button
      v-if="props.closable"
      class="user-tag-remove"
      type="button"
      :title="$t('delete')"
      :aria-label="$t('delete') + ': ' + fullName"
      @click.stop="deleteUser(props.user.user_id)"
    >
      <i class="pi pi-times" aria-hidden="true"></i>
    </button>
  </div>
</template>
<script setup>
import userAvatar from "./userAvatar.vue";

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  onDelete: {
    type: Function,
    required: false,
  },
  closable: {
    type: Boolean,
    required: false,
  },
  selectable: {
    type: Boolean,
    default: false,
    required: false,
  },
});

const root = ref(null);

const fullName = computed(() =>
  `${props.user?.last_name || ""} ${props.user?.first_name || ""}`.trim(),
);

const deleteUser = (user_id) => {
  if (props.onDelete) {
    props.onDelete(user_id);
  }
};
</script>
