<template>
    <div v-if="groupData" class="flex flex-col gap-y-3">
        <p class="mb-0"><span class="text-inactive">{{ $t("pages.groups.group_name") }}:</span> <b>{{
            groupData.group_name }}</b></p>
        <p class="mb-0"><span class="text-inactive">{{ $t("pages.groups.group_description") }}:</span> <b>{{
            groupData.group_description }}</b></p>
        <p class="mb-0"><span class="text-inactive">{{ $t("pages.groups.group_category") }}:</span> <b>{{
            groupData.level_name }}</b></p>

        <div class="flex gap-x-2 items-center">
            <p class="mb-0"><span class="text-inactive">{{ $t("mentor") }}:</span></p>
            <userTag v-if="groupData.mentor" :user="groupData.mentor" />
        </div>
        <p class="mb-0" v-if="groupData.members"><span class="text-inactive">{{ $t("pages.groups.added_members_count") }}:</span> <b>{{
            JSON.parse(groupData.members).length }}</b></p>
        <p class="mb-0"><span class="text-inactive">{{ $t("pages.groups.members") }}:</span></p>

        <div v-if="groupData.members" class="btn-wrap">
            <userTag v-for="(member, index) in JSON.parse(groupData.members)" :key="index" :user="member" />
        </div>
    </div>
</template>
<script setup>
import userTag from '../../../ui/userTag.vue';


const props = defineProps({
    groupData: {
        type: Object,
        required: true
    },
});

const { groupData } = toRefs(props);
</script>