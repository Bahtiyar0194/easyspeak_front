<template>
    <client-only>
        <div class="col-span-12">
            <div class="card p-3" v-html="sanitize(props.htmlData)"></div>
        </div>
    </client-only>
</template>
<script setup>
import { sanitize } from "../../utils/sanitize";

const props = defineProps({
  htmlData: {
    type: String,
    required: true,
  },
});
</script>
