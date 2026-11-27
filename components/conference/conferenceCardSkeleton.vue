<template>
  <!-- Скелетон карточки текущей конференции (currentConferenceCard):
       статус, название, метки, время с полосой, участники и кнопки -->
  <div class="live-card !border-[var(--surface-border)]" aria-busy="true">
    <span class="sr-only">{{ $t("loading") }}</span>
    <div class="live-card-body" aria-hidden="true">
      <div class="flex flex-col gap-2.5">
        <div class="skeleton h-6 w-28 !rounded-full"></div>
        <div class="skeleton h-7 w-2/3 max-w-sm"></div>
      </div>

      <div class="flex flex-wrap gap-x-5 gap-y-2">
        <div class="skeleton h-4 w-40"></div>
        <div class="skeleton h-4 w-24"></div>
        <div class="flex items-center gap-2">
          <div class="skeleton w-5 h-5 !rounded-full"></div>
          <div class="skeleton h-4 w-32"></div>
        </div>
      </div>

      <div class="live-progress">
        <div class="flex items-center justify-between gap-3">
          <div class="skeleton h-4 w-28"></div>
          <div class="skeleton h-4 w-36"></div>
        </div>
        <div class="skeleton h-2 w-full !rounded-full"></div>
      </div>

      <div class="live-card-foot">
        <div class="flex items-center gap-2">
          <div class="flex -space-x-2">
            <div v-for="n in 3" :key="n" class="skeleton w-7 h-7 !rounded-full ring-2 ring-white dark:ring-slate-800"></div>
          </div>
          <div class="skeleton h-4 w-24"></div>
        </div>
        <div class="flex gap-2 max-sm:w-full">
          <div class="skeleton h-10 w-28 !rounded-xl max-sm:flex-1"></div>
          <div class="skeleton h-10 w-44 !rounded-xl max-sm:flex-1"></div>
        </div>
      </div>
    </div>
  </div>
</template>
