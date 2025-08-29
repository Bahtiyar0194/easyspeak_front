<template>
  <form ref="form3ds" :action="route.query.AcsUrl" method="POST">
    <input type="hidden" name="PaReq" :value="route.query.PaReq" />
    <input type="hidden" name="MD" :value="route.query.MD" />
    <input type="hidden" name="TermUrl" :value="route.query.TermUrl" />
  </form>
</template>

<script setup>
const route = useRoute();
const form3ds = ref(null);

useHead({
  title: "3D Secure authentication",
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});
</script>
