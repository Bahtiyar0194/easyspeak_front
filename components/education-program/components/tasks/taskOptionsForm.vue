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
        <div v-if="props.showAudioButton" class="col-span-12 lg:col-span-6">
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
        <div v-if="props.showImage" class="col-span-12 lg:col-span-6">
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
        <div v-if="props.showWord" class="col-span-12 lg:col-span-6">
            <div class="form-group-border select active label-active">
                <i class="pi pi-file-word"></i>
                <select name="show_word">
                    <option selected disabled value="">{{ $t("choose_your_option") }}</option>
                    <option value="1">{{ $t('yes') }}</option>
                    <option value="0">{{ $t('no') }}</option>
                </select>
                <label :class="{ 'label-error': errors.show_word }">
                    {{ $t("pages.tasks.task_options.show_word") }}
                </label>
            </div>
        </div>
        <div v-if="props.showTranscription" class="col-span-12 lg:col-span-6">
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
        <div v-if="props.showTranslate" class="col-span-12">
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
        <div v-if="props.showImpressionLimit" class="col-span-12">
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

        <div v-if="props.showOptionsNum" class="col-span-12">
            <div class="form-group-border select active label-active">
                <i class="pi pi-th-large"></i>
                <select name="options_num">
                    <option selected disabled value="">{{ $t("choose_your_option") }}</option>
                    <option v-for="item in optionsNum" :key="item" :value="item">{{ item }}</option>
                </select>
                <label :class="{ 'label-error': errors.options_num }">
                    {{ $t("number_of_options") }}
                </label>
            </div>
        </div>

        <div v-if="props.showSecondsPerWord" class="col-span-12">
            <div class="form-group-border active">
                <i class="pi pi-stopwatch"></i>
                <input name="seconds_per_word" type="number" placeholder=" " />
                <label :class="{ 'label-error': errors.seconds_per_word }">
                    {{ errors.seconds_per_word ? errors.seconds_per_word[0] : $t("pages.dictionary.seconds_per_word") }}
                </label>
            </div>
        </div>

        <div v-if="props.showSecondsPerSentence" class="col-span-12">
            <div class="form-group-border active">
                <i class="pi pi-stopwatch"></i>
                <input name="seconds_per_sentence" type="number" placeholder=" " />
                <label :class="{ 'label-error': errors.seconds_per_sentence }">
                    {{ errors.seconds_per_sentence ? errors.seconds_per_sentence[0] :
                        $t("pages.sentences.seconds_per_sentence") }}
                </label>
            </div>
        </div>

        <div v-if="props.showSelectMainLang" class="col-span-12">
            <label class="custom-radio">
                <input type="radio" :checked="true" value="1" name="in_the_main_lang" />
                <span>{{ $t('pages.tasks.translate.from_the_main_lang_to_the_current_lang') }}</span>
            </label>

            <label class="custom-radio mt-1.5">
                <input type="radio" value="0" name="in_the_main_lang" />
                <span>{{ $t('pages.tasks.translate.from_the_current_lang_to_the_main_lang') }}</span>
            </label>
        </div>
    </div>
</template>
<script setup>
const props = defineProps({
    errors: {
        type: Object,
        required: true,
    },
    showAudioButton: {
        default: true,
        type: Boolean,
        required: false
    },
    showImage: {
        default: true,
        type: Boolean,
        required: false
    },
    showTranscription: {
        default: false,
        type: Boolean,
        required: false
    },
    showWord: {
        default: false,
        type: Boolean,
        required: false
    },
    showTranslate: {
        default: true,
        type: Boolean,
        required: false
    },
    showImpressionLimit: {
        default: true,
        type: Boolean,
        required: false
    },
    showOptionsNum: {
        default: false,
        type: Boolean,
        required: false
    },
    items: {
        type: Array,
        required: false,
        default: () => []
    },
    showSecondsPerWord: {
        default: false,
        type: Boolean,
        required: false
    },
    showSecondsPerSentence: {
        default: false,
        type: Boolean,
        required: false
    },
    showSelectMainLang: {
        default: false,
        type: Boolean,
        required: false
    }
});

const optionsNum = ref([2, 3, 4]);

const { errors } = toRefs(props);
</script>