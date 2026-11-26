<template>
  <!-- Скелетон списка сущностей: таблица на компьютере, карточки на телефоне
       (та же разметка, что у настоящих списков: .table и .entity-list) -->
  <div aria-busy="true">
    <span class="sr-only">{{ $t("loading") }}</span>

    <div
      class="table table-sm max-md:!hidden pointer-events-none"
      aria-hidden="true"
    >
      <table>
        <thead>
          <tr>
            <th v-for="col in props.columns" :key="col">
              <div class="skeleton h-3" :style="{ width: headWidth(col) }"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in props.rows" :key="row">
            <td v-for="col in props.columns" :key="col">
              <div
                v-if="col === 1 && props.avatar"
                class="flex items-center gap-2"
              >
                <div class="skeleton w-7 h-7 shrink-0 !rounded-full"></div>
                <div
                  class="skeleton h-3.5"
                  :style="{ width: cellWidth(row, col) }"
                ></div>
              </div>
              <!-- Последняя колонка — статус «таблеткой» -->
              <div
                v-else-if="col === props.columns && props.statusColumn"
                class="skeleton h-5 w-20 !rounded-full"
              ></div>
              <div
                v-else
                class="skeleton h-3.5"
                :style="{ width: cellWidth(row, col) }"
              ></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ul class="entity-list md:hidden" aria-hidden="true">
      <li v-for="row in props.rows" :key="row">
        <div class="entity-card pointer-events-none">
          <div
            class="skeleton w-10 h-10 shrink-0"
            :class="props.avatar ? '!rounded-full' : '!rounded-xl'"
          ></div>
          <div class="flex-1 min-w-0 flex flex-col gap-2">
            <div
              class="skeleton h-4"
              :style="{ width: cellWidth(row, 1) }"
            ></div>
            <div class="skeleton h-3 w-1/2"></div>
            <div class="skeleton h-5 w-20 !rounded-full"></div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
// <listSkeleton :columns="5" />                     — пользователи (аватар в 1-й колонке)
// <listSkeleton :columns="9" :avatar="false" />     — группы
const props = defineProps({
  columns: { type: Number, default: 5 },
  rows: { type: Number, default: 8 },
  // Аватар в первой колонке / круглая иконка в карточке
  avatar: { type: Boolean, default: true },
  // Последняя колонка — статус «таблеткой»
  statusColumn: { type: Boolean, default: true },
});

// Разная ширина ячеек — выглядит как настоящие данные, а не «решётка»
const WIDTHS = ["70%", "55%", "85%", "60%", "75%", "50%", "65%"];
const cellWidth = (row, col) => WIDTHS[(row * 3 + col) % WIDTHS.length];
const headWidth = (col) => ["60%", "45%", "50%"][col % 3];
</script>
