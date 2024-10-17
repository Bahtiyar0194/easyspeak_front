<template>
    <alert :className="'primary'">
        <div class="flex flex-col items-center">
            <p>{{ $t("subscription_plan.expired") }}</p>
        </div>
    </alert>
</template>
<script setup>
import alert from './alert.vue';
</script>