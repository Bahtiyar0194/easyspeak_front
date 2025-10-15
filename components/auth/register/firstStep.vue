<template>
  <div class="custom-grid">
    <div class="col-span-12 lg:col-span-6">
      <div class="form-group-border active">
        <i class="pi pi-graduation-cap"></i>
        <input type="text" name="school_name" placeholder=" " />
        <label :class="{ 'label-error': errors.school_name }">
          {{
            errors.school_name ? errors.school_name[0] : $t("form.school_name")
          }}
        </label>
      </div>
    </div>
    <div class="col-span-12 lg:col-span-6">
      <div class="form-group-border active">
        <i class="pi pi-graduation-cap"></i>
        <input type="text" name="full_school_name" placeholder=" " />
        <label :class="{ 'label-error': errors.full_school_name }">
          {{
            errors.full_school_name
              ? errors.full_school_name[0]
              : $t("form.full_school_name")
          }}
        </label>
      </div>
    </div>
    <div class="col-span-12 lg:col-span-6">
      <div class="form-group-border active">
        <i class="pi pi-id-card"></i>
        <input name="bin" v-mask="'############'" placeholder=" " />
        <label :class="{ 'label-error': errors.bin }">
          {{ errors.bin ? errors.bin[0] : $t("form.bin") }}
        </label>
      </div>
    </div>

    <div class="col-span-12 lg:col-span-6">
      <div class="form-group-border active">
        <i class="pi pi-at"></i>
        <input
          autoComplete="new-school-email"
          name="school_email"
          type="text"
          placeholder=" "
        />
        <label :class="{ 'label-error': errors.school_email }">
          {{
            errors.school_email
              ? errors.school_email[0]
              : $t("form.school_email")
          }}
        </label>
      </div>
    </div>

    <div
      v-for="(level, index) in selections"
      :key="index"
      class="col-span-12 lg:col-span-6"
    >
      <div class="form-group-border select active label-active">
        <i class="pi pi-map-marker"></i>
        <select
          v-model="level.selectedId"
          @change="onSelectLocation(index)"
          :name="index === selections.length - 1 ? 'location_id' : null"
        >
          <option disabled value="">
            {{ $t("form.select_a_point") }}
          </option>
          <option
            v-for="option in level.options"
            :key="option.location_id"
            :value="option.location_id"
          >
            {{ option.location_name }}
          </option>
        </select>
        <label
          :class="{
            'label-error':
              errors.location_id && index === selections.length - 1,
          }"
        >
          {{
            $t(
              index > 0
                ? "form.select_an_internal_point"
                : "form.select_a_point"
            )
          }}
        </label>
      </div>
    </div>

    <div class="col-span-12">
      <div class="custom-grid">
        <div class="col-span-12 lg:col-span-8">
          <div class="form-group-border active">
            <i class="pi pi-map-marker"></i>
            <input type="text" name="street" placeholder=" " />
            <label :class="{ 'label-error': errors.street }">
              {{
                errors.street
                  ? errors.street[0]
                  : $t("form.street")
              }}
            </label>
          </div>
        </div>
        <div class="col-span-12 lg:col-span-4">
          <div class="form-group-border active">
            <i class="pi pi-building"></i>
            <input type="text" name="house" placeholder=" " />
            <label :class="{ 'label-error': errors.house }">
              {{
                errors.house
                  ? errors.house[0]
                  : $t("form.house")
              }}
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="col-span-12">
      <div class="flex items-center">
        <div
          class="form-group-border !rounded-r-none !border-r-0 active !w-full"
        >
          <i class="pi pi-globe"></i>
          <input
            type="text"
            v-model="domainName"
            name="school_domain"
            placeholder=" "
          />
          <label :class="{ 'label-error': errors.school_domain }">
            {{
              errors.school_domain
                ? errors.school_domain[0]
                : $t("form.school_domain")
            }}
          </label>
        </div>
        <div class="form-group-border active !rounded-l-none">
          <input
            class="!pl-2"
            type="text"
            readonly
            :value="'.' + origin"
            placeholder=""
          />
        </div>
      </div>
    </div>

    <div v-if="domainName !== ''" class="col-span-12">
      <p>
        <i
          >*<b>{{ $t("note") }}:</b> {{ $t("form.school_domain") }} -
          <span class="text-corp">{{ domainName }}.{{ origin }}</span></i
        >
      </p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  locations: {
    type: Object,
    required: true,
  },
  errors: {
    type: Object,
    required: true,
  },
});

const origin = ref("");
const domainName = ref("");
const selections = ref([]);
const { errors, locations } = toRefs(props);

const onSelectLocation = (levelIndex) => {
  const selectedLevel = selections.value[levelIndex];
  const selectedOption = selectedLevel.options.find(
    (opt) => opt.location_id === selectedLevel.selectedId
  );

  // Удалить все уровни ниже текущего
  selections.value.splice(levelIndex + 1);

  // Если есть дети — добавить новый select
  if (selectedOption?.childs?.length) {
    selections.value.push({
      options: selectedOption.childs,
      selectedId: "",
    });
  }
};

onMounted(() => {
  const host = window.location.host; // без http/https и порта
  // убираем www.
  const cleanHost = host.replace(/^www\./, "");
  const parts = cleanHost.split(".");

  if (parts.length > 2) {
    // если есть поддомен → берём последние 2 части (например easyspeak.kz)
    origin.value = parts.slice(-2).join(".");
  } else {
    // если без поддомена → берём как есть
    origin.value = cleanHost;
  }
});

watch(
  () => locations.value,
  (newTree) => {
    if (Array.isArray(newTree) && newTree.length > 0) {
      selections.value = [
        {
          options: newTree[0].childs,
          selectedId: "",
        },
      ];
    }
  },
  { immediate: true } // сразу при монтировании если данные уже есть
);
</script>
