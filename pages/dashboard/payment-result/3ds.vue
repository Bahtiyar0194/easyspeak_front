<template>
  <form ref="form3ds" :action="route.query.AcsUrl" method="POST">
    <input type="hidden" name="PaReq" :value="route.query.PaReq" />
    <input type="hidden" name="TransactionId" :value="route.query.TransactionId" />
    <input type="hidden" name="TermUrl" :value="route.query.TermUrl" />
  </form>

  <loader
    :className="'full-overlay'"
    :showPendingText="true"
    :pendingText="$t('pages.3ds.please_wait')"
  />
</template>

<script setup>
import loader from "../../../components/ui/loader.vue";
import { onMounted } from "vue";

const route = useRoute();
const form3ds = ref(null);

useHead({
  title: "3D Secure authentication",
  meta: [{ name: "description", content: "3D Secure authentication page" }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

onMounted(() => {
  form3ds.value.submit();
});
</script>
