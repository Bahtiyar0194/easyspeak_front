<template>
  <resultList :sections="sections" />
</template>

<script setup>
import resultList from "../resultList.vue";

const { t } = useI18n();

const props = defineProps({
  studiedQuestions: {
    type: Object,
    required: true,
  },
  reStudyQuestions: {
    type: Object,
    required: true,
  },
});

const toItem = (question) => ({
  title: question.question,
  subtitle: "",
  audio: null,
});

const sections = computed(() => [
  {
    title: t("pages.questions.studied_questions"),
    tone: "ok",
    icon: "pi-check",
    items: (props.studiedQuestions || []).map(toItem),
  },
  {
    title: t("pages.questions.unstudied_questions"),
    tone: "bad",
    icon: "pi-replay",
    items: (props.reStudyQuestions || []).map(toItem),
  },
]);
</script>
