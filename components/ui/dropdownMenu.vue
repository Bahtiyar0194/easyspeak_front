<template>
  <div class="dropdown" ref="dropdownWrapper">
    <ul
      v-if="props.dropdownUp === true"
      class="dropdown-menu up"
      ref="dropdownMenu"
      :class="{
        show: dropdownMenuOpen === true,
        right: props.position === 'right',
        'no-absolute': props.noAbsolute === true,
      }"
    >
      <slot name="menu_content" />
    </ul>
    <div @click="showDropdown" class="cursor-pointer">
      <div class="flex items-center gap-0.5">
        <slot name="btn_content" />
        <svg
          v-if="props.dropdownArrow === true"
          class="duration-200"
          :style="dropdownMenuOpen === true ? 'transform: rotate(180deg);' : ''"
          width="16"
          height="16"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
            fill="currentColor"
            fill-rule="evenodd"
            clip-rule="evenodd"
          ></path>
        </svg>
      </div>
    </div>
    <ul
      v-if="props.dropdownUp === false"
      class="dropdown-menu"
      ref="dropdownMenu"
      :class="{
        show: dropdownMenuOpen === true,
        right: props.position === 'right',
        'no-absolute': props.noAbsolute === true,
      }"
    >
      <slot name="menu_content" />
    </ul>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
const dropdownWrapper = ref(null);
const dropdownMenu = ref(null);
const dropdownMenuOpen = ref(false);

const props = defineProps({
  dropdownArrow: {
    type: Boolean,
    required: true,
  },
  position: {
    //Left or right
    type: String,
    default: "right",
    required: false,
  },
  noAbsolute: {
    type: Boolean,
    default: false,
    required: false,
  },

  dropdownUp: {
    type: Boolean,
    default: false,
    required: false,
  },
});

const handleClickOutside = (event) => {
  if (dropdownWrapper.value && !dropdownWrapper.value.contains(event.target)) {
    dropdownMenuOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", handleClickOutside);
});

const showDropdown = () => {
  dropdownMenuOpen.value = true;

  // const dropdownRect = dropdownMenu.value.getBoundingClientRect();
  // const wrapperRect = dropdownWrapper.value.getBoundingClientRect();
  // const viewportHeight = window.innerHeight;
  // const viewportWidth = window.innerWidth;

  // let top = wrapperRect.bottom;
  // let left = wrapperRect.left;

  // if (top + dropdownRect.height > viewportHeight) {
  //     top = wrapperRect.top - dropdownRect.height;
  // }

  // if (left + dropdownRect.width > viewportWidth) {
  //     left = viewportWidth - dropdownRect.width;
  // }

  // dropdownMenu.value.style.top = `${top}px`;
  // dropdownMenu.value.style.left = `${left}px`;
};

const hideDropdown = () => {
  dropdownMenuOpen.value = false;
};
</script>
