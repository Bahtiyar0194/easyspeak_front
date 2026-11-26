<template>
  <div v-if="props.showTabHeader === true" class="col-span-12">
    <div class="tabs-bar-wrap">
      <div class="tabs-bar" role="tablist">
        <button
          v-for="tab in props.tabs"
          :key="tab.name"
          type="button"
          role="tab"
          :aria-selected="active_tab === tab.name"
          @click="active_tab = tab.name"
          class="tab-header-item"
          :class="[
            { active: active_tab === tab.name },
            tab.className ? tab.className : '',
          ]"
        >
          <i :class="tab.icon" aria-hidden="true"></i>
          <span>{{ tab.title }}</span>
        </button>
      </div>
    </div>
  </div>
  <div class="col-span-12">
    <div class="tab-body">
      <div
        v-for="tab in props.tabs"
        :key="tab.name"
        class="tab-body-item"
        :class="active_tab === tab.name && 'active'"
        role="tabpanel"
      >
        <!-- Здесь рендерится компонент выбранной вкладки -->
        <component
          :key="tab.name"
          v-if="tab.component"
          :is="tab.component"
          v-bind="tab.props"
        ></component>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  tabs: {
    type: Array,
    required: true,
  },
  activeTabIndex: {
    type: Number,
    required: false,
    default: 0,
  },
  showTabHeader: {
    type: Boolean,
    required: false,
    default: true,
  },
});

const active_tab = ref(props.tabs[props.activeTabIndex].name);
</script>
