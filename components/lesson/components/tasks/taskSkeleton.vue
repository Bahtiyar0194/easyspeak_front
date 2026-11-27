<template>
  <!-- Заглушка окна задания: пока грузится компонент и данные задания -->
  <div class="flex flex-col gap-4" aria-hidden="true">
    <div class="flex items-center justify-between gap-3">
      <div class="skeleton h-5 w-40"></div>
      <div class="skeleton h-10 w-10 !rounded-full"></div>
    </div>
    <div class="skeleton h-2 w-full !rounded-full"></div>
    <div class="skeleton h-28 w-full !rounded-2xl"></div>
    <div class="grid grid-cols-2 gap-3">
      <div v-for="i in 4" :key="i" class="skeleton h-12 w-full !rounded-xl"></div>
    </div>
    <div class="flex justify-end">
      <div class="skeleton h-10 w-32 !rounded-xl"></div>
    </div>
  </div>
  <span class="sr-only">{{ $t("loading") }}</span>
</template>
