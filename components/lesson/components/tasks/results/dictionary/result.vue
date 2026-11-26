<template>
  <resultList :sections="sections" />
</template>

<script setup>
import resultList from "../resultList.vue";

const { t } = useI18n();

const props = defineProps({
  studiedWords: {
    type: Object,
    required: true,
  },
  reStudyWords: {
    type: Object,
    required: true,
  },
});

const toItem = (word) => ({
  title: word.word,
  subtitle: word.word_translate,
  audio: word.audio_file,
});

const sections = computed(() => [
  {
    title: t("pages.dictionary.studied_words"),
    tone: "ok",
    icon: "pi-check",
    items: (props.studiedWords || []).map(toItem),
  },
  {
    title: t("pages.dictionary.unstudied_words"),
    tone: "bad",
    icon: "pi-replay",
    items: (props.reStudyWords || []).map(toItem),
  },
]);
</script>
