<template>
  <modal
    :show="confirmState.show"
    :onClose="() => settleConfirm(false)"
    :className="'modal-md'"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <h4>{{ confirmState.title || $t("confirmation") }}</h4>
    </template>
    <template v-slot:body_content>
      <p class="mb-0 whitespace-pre-line">{{ confirmState.message }}</p>
      <div class="btn-wrap right mt-6">
        <button type="button" class="btn btn-light" @click="settleConfirm(false)">
          {{ confirmState.cancelText || $t("cancel") }}
        </button>
        <button
          type="button"
          class="btn"
          :class="confirmState.danger ? 'btn-danger' : 'btn-primary'"
          @click="settleConfirm(true)"
        >
          {{ confirmState.confirmText || $t("yes") }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import modal from "./modal.vue";
import { confirmState, settleConfirm } from "~/composables/useConfirm";
</script>
