<template>
  <!-- min-h-screen + вертикальные отступы: длинная форма (регистрация) на
       телефоне растягивает страницу и прокручивается целиком, а не
       обрезается сверху и не прокручивается внутри карточки. -->
  <div class="min-h-screen w-full flex items-center justify-center relative py-6 sm:py-10">
    <div class="custom-container">
      <div class="custom-grid cols-10">
        <NuxtPage />
      </div>
    </div>
  </div>
</template>
