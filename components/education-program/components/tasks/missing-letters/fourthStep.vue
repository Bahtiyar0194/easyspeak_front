<template>
    <div class="custom-grid">
        <div class="col-span-12">
            <div class="form-group-border active">
                <i class="pi pi-clock"></i>
                <input name="task_slug" type="text" placeholder=" " />
                <label :class="{ 'label-error': errors.task_slug }">
                    {{ errors.task_slug ? errors.task_slug[0] : $t("pages.tasks.task_slug") }}
                </label>
            </div>
        </div>
        <div class="col-span-12">
            <div class="form-group-border active">
                <i class="pi pi-clock"></i>
                <input name="task_name_kk" type="text" placeholder=" " />
                <label :class="{ 'label-error': errors.task_name_kk }">
                    {{ errors.task_name_kk ? errors.task_name_kk[0] : $t("pages.tasks.translate.kk") }}
                </label>
            </div>
        </div>
        <div class="col-span-12">
            <div class="form-group-border active">
                <i class="pi pi-clock"></i>
                <input name="task_name_ru" type="text" placeholder=" " />
                <label :class="{ 'label-error': errors.task_name_ru }">
                    {{ errors.task_name_ru ? errors.task_name_ru[0] : $t("pages.tasks.translate.ru") }}
                </label>
            </div>
        </div>
        <div class="col-span-12">
            <div class="form-group-border select active label-active">
                <i class="pi pi-volume-up"></i>
                <select name="show_audio_button">
                    <option selected disabled value="">{{ $t("choose_your_option") }}</option>
                    <option value="1">{{ $t('yes') }}</option>
                    <option value="0">{{ $t('no') }}</option>
                </select>
                <label :class="{ 'label-error': errors.show_audio_button }">
                    {{ $t("pages.tasks.task_options.show_audio_button") }}
                </label>
            </div>
        </div>
        <div class="col-span-12">
            <div class="form-group-border select active label-active">
                <i class="pi pi-image"></i>
                <select name="show_image">
                    <option selected disabled value="">{{ $t("choose_your_option") }}</option>
                    <option value="1">{{ $t('yes') }}</option>
                    <option value="0">{{ $t('no') }}</option>
                </select>
                <label :class="{ 'label-error': errors.show_image }">
                    {{ $t("pages.tasks.task_options.show_image") }}
                </label>
            </div>
        </div>
        <div class="col-span-12">
            <div class="form-group-border select active label-active">
                <i class="bi bi-braces"></i>
                <select name="show_transcription">
                    <option selected disabled value="">{{ $t("choose_your_option") }}</option>
                    <option value="1">{{ $t('yes') }}</option>
                    <option value="0">{{ $t('no') }}</option>
                </select>
                <label :class="{ 'label-error': errors.show_transcription }">
                    {{ $t("pages.tasks.task_options.show_transcription") }}
                </label>
            </div>
        </div>
        <div class="col-span-12">
            <div class="form-group-border select active label-active">
                <i class="pi pi-language"></i>
                <select name="show_translate">
                    <option selected disabled value="">{{ $t("choose_your_option") }}</option>
                    <option value="1">{{ $t('yes') }}</option>
                    <option value="0">{{ $t('no') }}</option>
                </select>
                <label :class="{ 'label-error': errors.show_translate }">
                    {{ $t("pages.tasks.task_options.show_translate") }}
                </label>
            </div>
        </div>
        <div class="col-span-12">
            <div class="form-group-border select active label-active">
                <i class="pi pi-eye"></i>
                <select name="impression_limit">
                    <option selected value="">{{ $t("pagination.unlimit") }}</option>
                    <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
                </select>
                <label :class="{ 'label-error': errors.impression_limit }">
                    {{ $t("pages.tasks.task_options.impression_limit") }}
                </label>
            </div>
        </div>
    </div>
</template>
<script setup>
const props = defineProps({
    errors: {
        type: Object,
        required: true,
    }
});

const { errors } = toRefs(props);
</script>