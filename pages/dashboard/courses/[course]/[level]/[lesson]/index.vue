<template>
    <div class="col-span-12">
      <div class="custom-grid">

      </div>
    </div>
  </template>
  
  <!-- <script setup>
  import { useRouter } from "nuxt/app";
  import { useRoute } from "vue-router";
  
  const config = useRuntimeConfig();
  const router = useRouter();
  const route = useRoute();
  const course_slug = route.params.course;
  const level_slug = route.params.level;
  
  const errors = ref([]);
  const { $axiosPlugin } = useNuxtApp();
  const { t } = useI18n();
  const pending = ref(true);
  const lessonData = ref([]);
  const pageTitle = ref("");
  
  useHead(() => ({
    title: pageTitle.value,
    meta: [{ name: "description", content: "Courses" }],
  }));
  
  definePageMeta({
    layout: "dashboard",
    middleware: ["sanctum:auth"],
  });
  
  const getLessons = async () => {
    pending.value = true;
  
    await $axiosPlugin
      .get("courses/" + course_slug + "/" + level_slug + "/get_lessons")
      .then((response) => {
        const courseCrumbItem = document.querySelector(
          'span[data-crumb="[course]"]'
        );
  
        // Проверить, найден ли элемент
        if (courseCrumbItem) {
          // Изменить текст внутри элемента
          courseCrumbItem.textContent = response.data.course.course_name;
        }
  
        const levelCrumbItem = document.querySelector(
          'span[data-crumb="[level]"]'
        );
  
        // Проверить, найден ли элемент
        if (levelCrumbItem) {
          // Изменить текст внутри элемента
          levelCrumbItem.textContent = response.data.level.level_name;
        }
  
        pageTitle.value = response.data.level.level_name;
  
        lessonsData.value = response.data.sections;
        pending.value = false;
      })
      .catch((err) => {
        if (err.response) {
          router.push({
            path: "/error",
            query: {
              status: err.response.status,
              message: err.response.data.message,
              url: err.request.responseURL,
            },
          });
        } else {
          router.push("/error");
        }
      });
  };
  
  onMounted(() => {
    //getLessons();
  });
  </script>   -->