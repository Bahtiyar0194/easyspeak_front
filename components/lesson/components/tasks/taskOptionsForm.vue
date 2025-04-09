<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <div class="form-group-border active">
        <i class="pi pi-clock"></i>
        <input name="task_slug" type="text" placeholder=" " />
        <label :class="{ 'label-error': errors.task_slug }">
          {{
            errors.task_slug ? errors.task_slug[0] : $t("pages.tasks.task_slug")
          }}
        </label>
      </div>
    </div>
    <div class="col-span-12 lg:col-span-6">
      <div class="form-group-border active">
        <i class="pi pi-clock"></i>
        <input name="task_name_kk" type="text" placeholder=" " />
        <label :class="{ 'label-error': errors.task_name_kk }">
          {{
            errors.task_name_kk
              ? errors.task_name_kk[0]
              : $t("pages.tasks.translate.kk")
          }}
        </label>
      </div>
    </div>
    <div class="col-span-12 lg:col-span-6">
      <div class="form-group-border active">
        <i class="pi pi-clock"></i>
        <input name="task_name_ru" type="text" placeholder=" " />
        <label :class="{ 'label-error': errors.task_name_ru }">
          {{
            errors.task_name_ru
              ? errors.task_name_ru[0]
              : $t("pages.tasks.translate.ru")
          }}
        </label>
      </div>
    </div>

    <div class="col-span-12">
      <label class="custom-radio-checkbox text-nowrap">
        <input
          type="checkbox"
          v-model="showTaskExample"
          @click="showTaskExample = !showTaskExample"
        />
        <span>{{ $t("pages.tasks.task_options.show_task_example") }}</span>
      </label>
    </div>

    <div v-if="showTaskExample" class="col-span-12">
      <div class="custom-grid">
        <textEditor
          :inputName="'task_example'"
          :errors="errors"
          :content="
            '<p>' +
            $t('pages.tasks.task_options.task_example_message') +
            '🚀</p>'
          "
        />
      </div>
    </div>

    <div v-if="props.showAudioButton" class="col-span-12 lg:col-span-6">
      <div class="form-group-border select active label-active">
        <i class="pi pi-volume-up"></i>
        <select name="show_audio_button">
          <option selected disabled value="">
            {{ $t("choose_your_option") }}
          </option>
          <option value="1">{{ $t("yes") }}</option>
          <option value="0">{{ $t("no") }}</option>
        </select>
        <label :class="{ 'label-error': errors.show_audio_button }">
          {{ $t("pages.tasks.task_options.show_audio_button") }}
        </label>
      </div>
    </div>
    <div v-if="props.showPlayAudioAtTheBegin" class="col-span-12 lg:col-span-6">
      <div class="form-group-border select active label-active">
        <i class="pi pi-volume-up"></i>
        <select name="play_audio_at_the_begin">
          <option selected disabled value="">
            {{ $t("choose_your_option") }}
          </option>
          <option value="1">{{ $t("yes") }}</option>
          <option value="0">{{ $t("no") }}</option>
        </select>
        <label :class="{ 'label-error': errors.play_audio_at_the_begin }">
          {{ $t("pages.tasks.task_options.play_audio_at_the_begin") }}
        </label>
      </div>
    </div>
    <div
      v-if="props.showPlayAudioWithTheCorrectAnswer"
      class="col-span-12 lg:col-span-6"
    >
      <div class="form-group-border select active label-active">
        <i class="pi pi-check-circle"></i>
        <select name="play_audio_with_the_correct_answer">
          <option selected disabled value="">
            {{ $t("choose_your_option") }}
          </option>
          <option value="1">{{ $t("yes") }}</option>
          <option value="0">{{ $t("no") }}</option>
        </select>
        <label
          :class="{ 'label-error': errors.play_audio_with_the_correct_answer }"
        >
          {{
            $t("pages.tasks.task_options.play_audio_with_the_correct_answer")
          }}
        </label>
      </div>
    </div>
    <div
      v-if="props.showPlayErrorSoundWithTheInCorrectAnswer"
      class="col-span-12 lg:col-span-6"
    >
      <div class="form-group-border select active label-active">
        <i class="pi pi-exclamation-circle"></i>
        <select name="play_error_sound_with_the_incorrect_answer">
          <option selected disabled value="">
            {{ $t("choose_your_option") }}
          </option>
          <option value="1">{{ $t("yes") }}</option>
          <option value="0">{{ $t("no") }}</option>
        </select>
        <label
          :class="{
            'label-error': errors.play_error_sound_with_the_incorrect_answer,
          }"
        >
          {{
            $t(
              "pages.tasks.task_options.play_error_sound_with_the_incorrect_answer"
            )
          }}
        </label>
      </div>
    </div>
    <div v-if="props.showImage" class="col-span-12">
      <div class="form-group-border select active label-active">
        <i class="pi pi-image"></i>
        <select name="show_image">
          <option selected disabled value="">
            {{ $t("choose_your_option") }}
          </option>
          <option value="1">{{ $t("yes") }}</option>
          <option value="0">{{ $t("no") }}</option>
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
          <option selected disabled value="">
            {{ $t("choose_your_option") }}
          </option>
          <option value="1">{{ $t("yes") }}</option>
          <option value="0">{{ $t("no") }}</option>
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
          <option selected disabled value="">
            {{ $t("choose_your_option") }}
          </option>
          <option value="1">{{ $t("yes") }}</option>
          <option value="0">{{ $t("no") }}</option>
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
          <option selected disabled value="">
            {{ $t("choose_your_option") }}
          </option>
          <option value="1">{{ $t("yes") }}</option>
          <option value="0">{{ $t("no") }}</option>
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
          <option selected disabled value="">
            {{ $t("choose_your_option") }}
          </option>
          <option v-for="item in impressionLimits" :key="item" :value="item">
            {{ item }}
          </option>
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
          <option selected disabled value="">
            {{ $t("choose_your_option") }}
          </option>
          <option v-for="item in optionsNum" :key="item" :value="item">
            {{ item }}
          </option>
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
          {{
            errors.seconds_per_word
              ? errors.seconds_per_word[0]
              : $t("pages.dictionary.seconds_per_word")
          }}
        </label>
      </div>
    </div>
    <div v-if="props.showSecondsPerSentence" class="col-span-12">
      <div class="form-group-border active">
        <i class="pi pi-stopwatch"></i>
        <input name="seconds_per_sentence" type="number" placeholder=" " />
        <label :class="{ 'label-error': errors.seconds_per_sentence }">
          {{
            errors.seconds_per_sentence
              ? errors.seconds_per_sentence[0]
              : $t("pages.sentences.seconds_per_sentence")
          }}
        </label>
      </div>
    </div>
    <div v-if="props.showSecondsPerSection" class="col-span-12">
      <div class="form-group-border active">
        <i class="pi pi-stopwatch"></i>
        <input name="seconds_per_section" type="number" placeholder=" " />
        <label :class="{ 'label-error': errors.seconds_per_section }">
          {{
            errors.seconds_per_section
              ? errors.seconds_per_section[0]
              : $t("pages.sections.seconds_per_section")
          }}
        </label>
      </div>
    </div>
    <div v-if="props.showSecondsPerQuestion" class="col-span-12">
      <div class="form-group-border active">
        <i class="pi pi-stopwatch"></i>
        <input name="seconds_per_question" type="number" placeholder=" " />
        <label :class="{ 'label-error': errors.seconds_per_question }">
          {{
            errors.seconds_per_question
              ? errors.seconds_per_question[0]
              : $t("pages.questions.seconds_per_question")
          }}
        </label>
      </div>
    </div>
    <div v-if="props.showSelectMainLang" class="col-span-12">
      <div class="flex flex-col gap-y-2">
        <label class="custom-radio">
          <input
            type="radio"
            :checked="true"
            value="1"
            name="in_the_main_lang"
          />
          <span>{{
            $t("pages.tasks.translate.from_the_main_lang_to_the_current_lang")
          }}</span>
        </label>

        <label class="custom-radio">
          <input type="radio" value="0" name="in_the_main_lang" />
          <span>{{
            $t("pages.tasks.translate.from_the_current_lang_to_the_main_lang")
          }}</span>
        </label>
      </div>
    </div>
    <div v-if="props.showMissingWordsOptions" class="col-span-12">
      <div class="flex flex-col gap-y-2">
        <label
          v-for="(option, optionIndex) in missingWordOptions"
          :key="optionIndex"
          class="custom-radio"
        >
          <input
            type="radio"
            :checked="findWordOption === option"
            name="word_options"
            @change="findWordOption = option"
          />
          <span>{{
            $t("pages.tasks.missing_words.options.option_" + (optionIndex + 1))
          }}</span>
        </label>
      </div>
    </div>
    <div v-if="props.showAnswerTheQuestionsOptions" class="col-span-12">
      <div class="flex flex-col gap-y-2">
        <p class="mb-0">
          {{ $t("pages.tasks.answer_the_questions.answer_type") }}
        </p>
        <label
          v-for="(option, optionIndex) in answerTheQuestionsOptions"
          :key="optionIndex"
          class="custom-radio"
        >
          <input
            type="radio"
            :checked="answerTheQuestionsOption === option"
            name="answer_option"
            @change="answerTheQuestionsOption = option"
          />
          <span>{{
            $t(
              "pages.tasks.answer_the_questions.options.option_" +
                (optionIndex + 1)
            )
          }}</span>
        </label>
      </div>
    </div>
    <div
      v-if="
        props.showMatchByTyping ||
        props.showMatchByClicking ||
        props.showMatchByDragAndDrop
      "
      class="col-span-12"
    >
      <div class="flex flex-col gap-y-2.5">
        <p
          class="mb-0"
          :class="
            errors.choose_one_of_the_methods ? 'text-danger' : 'text-inactive'
          "
        >
          {{
            $t(
              "pages.tasks.task_options.choose_one_of_the_methods_for_matching_words"
            )
          }}
        </p>
        <label
          v-if="props.showMatchByTyping"
          class="custom-radio-checkbox text-nowrap"
        >
          <input type="checkbox" :checked="false" name="match_by_typing" />
          <span>{{ $t("pages.tasks.task_options.match_by_typing") }}</span>
        </label>

        <label
          v-if="props.showMatchByClicking"
          class="custom-radio-checkbox text-nowrap"
        >
          <input type="checkbox" :checked="false" name="match_by_clicking" />
          <span>{{ $t("pages.tasks.task_options.match_by_clicking") }}</span>
        </label>

        <label
          v-if="props.showMatchByDragAndDrop"
          class="custom-radio-checkbox text-nowrap"
        >
          <input
            type="checkbox"
            :checked="false"
            name="match_by_drag_and_drop"
          />
          <span>{{
            $t("pages.tasks.task_options.match_by_drag_and_drop")
          }}</span>
        </label>
      </div>
    </div>

    <div
      v-if="props.showMatchPicturesOptions"
      class="col-span-12"
    >
      <div class="flex flex-col gap-y-2.5">
        <p
          class="mb-0 text-inactive"
        >
          {{
            $t(
              "pages.tasks.task_options.choose_one_of_the_methods_for_matching_words_by_pictures"
            )
          }}
        </p>
        <label class="custom-radio">
          <input
            type="radio"
            :checked="true"
            value="match_by_typing"
            name="match_words_by_pictures_option"
          />
          <span>{{
            $t("pages.tasks.match_words_by_pictures.option_1")
          }}</span>
        </label>
        <label class="custom-radio">
          <input
            type="radio"
            :checked="false"
            value="match_by_number"
            name="match_words_by_pictures_option"
          />
          <span>{{
            $t("pages.tasks.match_words_by_pictures.option_2")
          }}</span>
        </label>
      </div>
    </div>

    <div v-if="props.sentenceMaterialTypes" class="col-span-12">
      <div class="form-group-border select active">
        <i class="pi pi-file"></i>
        <select v-model="sentenceMaterialTypeSlug">
          <option selected disabled value="">
            {{ $t("file.choose_a_file_type") }}
          </option>
          <option
            v-for="(fileType, fileTypeIndex) in sentenceMaterialTypes"
            :key="fileTypeIndex"
            :value="fileType.material_type_slug"
          >
            {{ fileType.material_type_name }}
          </option>
        </select>
        <label :class="{ 'label-error': errors.sentence_file_type_slug }">
          {{
            errors.material_type_id
              ? $t("file.specify_the_file_type")
              : $t("file.type")
          }}
        </label>
      </div>
    </div>
    
    <div v-if="props.showMaxAttempts === true" class="col-span-12">
      <div class="form-group-border select active label-active">
        <i class="pi pi-replay"></i>
        <select name="max_attempts">
          <option selected disabled value="">
            {{ $t("choose_your_option") }}
          </option>
          <option v-for="item in maxAttempts" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
        <label :class="{ 'label-error': errors.max_attempts }">
          {{ $t("number_of_attempts") }}
        </label>
      </div>
    </div>
    <div class="col-span-12">
      <label class="custom-radio-checkbox text-nowrap">
        <input type="checkbox" checked="true" name="random_order" />
        <span>{{ $t("random_order") }}</span>
      </label>
    </div>
  </div>
</template>
<script setup>
import textEditor from "../../../ui/textEditor.vue";
const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },

  showAudioButton: {
    default: false,
    type: Boolean,
    required: false,
  },

  showPlayAudioAtTheBegin: {
    default: false,
    type: Boolean,
    required: false,
  },

  showPlayAudioWithTheCorrectAnswer: {
    default: false,
    type: Boolean,
    required: false,
  },

  showPlayErrorSoundWithTheInCorrectAnswer: {
    default: false,
    type: Boolean,
    required: false,
  },

  showImage: {
    default: false,
    type: Boolean,
    required: false,
  },

  showTranscription: {
    default: false,
    type: Boolean,
    required: false,
  },

  showWord: {
    default: false,
    type: Boolean,
    required: false,
  },

  showTranslate: {
    default: false,
    type: Boolean,
    required: false,
  },

  showImpressionLimit: {
    default: false,
    type: Boolean,
    required: false,
  },

  showOptionsNum: {
    default: false,
    type: Boolean,
    required: false,
  },

  items: {
    type: Array,
    required: false,
    default: () => [],
  },

  showSecondsPerWord: {
    default: false,
    type: Boolean,
    required: false,
  },

  showSecondsPerSentence: {
    default: false,
    type: Boolean,
    required: false,
  },

  showSecondsPerSection: {
    default: false,
    type: Boolean,
    required: false,
  },

  showSecondsPerQuestion: {
    default: false,
    type: Boolean,
    required: false,
  },

  showSelectMainLang: {
    default: false,
    type: Boolean,
    required: false,
  },

  showMissingWordsOptions: {
    default: false,
    type: Boolean,
    required: false,
  },

  findWordOption: {
    type: Object,
    required: false,
  },

  showMatchPicturesOptions: {
    default: false,
    type: Boolean,
    required: false,
  },

  showAnswerTheQuestionsOptions: {
    default: false,
    type: Boolean,
    required: false,
  },

  answerTheQuestionsOption: {
    type: Object,
    required: false,
  },

  showMatchByTyping: {
    default: false,
    type: Boolean,
    required: false,
  },

  showMatchByClicking: {
    default: false,
    type: Boolean,
    required: false,
  },

  showMatchByDragAndDrop: {
    default: false,
    type: Boolean,
    required: false,
  },

  sentenceMaterialTypes: {
    type: Object,
    required: false,
  },

  sentenceMaterialTypeSlug: {
    type: Object,
    required: false,
  },

  showMaxAttempts: {
    default: true,
    type: Boolean,
    required: false,
  },
});

const showTaskExample = ref(false);
const impressionLimits = ref([2, 4]);
const optionsNum = ref([2, 3, 4]);
const maxAttempts = ref([0, 1, 2, 3, 4, 5]);

const missingWordOptions = [
  "with_hints",
  "without_hints",
  "with_first_letter",
  "with_options",
];

const answerTheQuestionsOptions = ["text", "video", "audio"];

const {
  errors,
  findWordOption,
  answerTheQuestionsOption,
  sentenceMaterialTypes,
  sentenceMaterialTypeSlug,
} = toRefs(props);
</script>
