<template>
    <div class="custom-grid">
        <div class="col-span-12">
            <div class="form-group-border active">
                <i class="pi pi-users"></i>
                <input autoComplete="new-group-name" name="group_name" type="text" placeholder=" " />
                <label :class="{ 'label-error': errors.group_name }">
                    {{ errors.group_name ? errors.group_name[0] : $t("pages.groups.group_name")
                    }}
                </label>
            </div>
        </div>
        <div class="col-span-12">
            <div class="form-group-border active">
                <i class="pi pi-users"></i>
                <textarea autoComplete="new-group-description-name" name="group_description" placeholder=" "></textarea>
                <label :class="{ 'label-error': errors.group_description }">
                    {{ errors.group_description ? errors.group_description[0] :
                        $t("pages.groups.group_description") }}
                </label>
            </div>
        </div>

        <div class="col-span-12 md:col-span-6">
            <div class="form-group-border select active label-active">
                <i class="pi pi-users"></i>
                <select name="group_category_id">
                    <option selected disabled value="">{{ $t("choose_a_category") }}</option>
                    <option v-for="category in attributes.all_categories" :key="category.category_id"
                        :value="category.category_id">
                        {{ category.category_name }}</option>
                </select>
                <label :class="{ 'label-error': errors.group_category_id }">
                    {{ errors.group_category_id ? errors.group_category_id[0] :
                        $t("pages.groups.group_category") }}
                </label>
            </div>
        </div>

        <div class="col-span-12 md:col-span-6">
            <div class="form-group-border active">
                <i class="pi pi-user"></i>
                <select name="mentor_id">
                    <option selected disabled value="">{{ $t("choose_a_mentor") }}</option>
                    <option v-for="mentor in attributes.all_mentors" :key="mentor.user_id" :value="mentor.user_id">{{
                        mentor.last_name }} {{ mentor.first_name }}
                    </option>
                </select>
                <label :class="{ 'label-error': errors.mentor_id }">{{ errors.mentor_id ?
                    errors.mentor_id[0] : $t("mentor") }}</label>
            </div>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    errors: {
        type: Object,
        required: true
    },

    attributes: {
        type: Object,
        required: true
    }
});

const { errors, attributes } = toRefs(props);
</script>
