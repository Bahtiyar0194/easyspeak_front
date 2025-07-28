<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <div class="form-group-border active">
        <i class="bi bi-alphabet"></i>
        <input name="category_slug" type="text" placeholder=" " />
        <label :class="{ 'label-error': errors.category_slug }">
          {{
            errors.category_slug
              ? errors.category_slug[0]
              : $t("pages.dictionary.category_slug")
          }}
        </label>
      </div>
    </div>
    <div class="col-span-12">
      <div class="form-group-border active">
        <i class="bi bi-alphabet"></i>
        <input name="category_name_kk" type="text" placeholder=" " />
        <label :class="{ 'label-error': errors.category_name_kk }">
          {{
            errors.category_name_kk
              ? errors.category_name_kk[0]
              : $t("pages.dictionary.translate.category_kk")
          }}
        </label>
      </div>
    </div>
    <div class="col-span-12">
      <div class="form-group-border active">
        <i class="bi bi-alphabet"></i>
        <input name="category_name_ru" type="text" placeholder=" " />
        <label :class="{ 'label-error': errors.category_name_ru }">
          {{
            errors.category_name_ru
              ? errors.category_name_ru[0]
              : $t("pages.dictionary.translate.category_ru")
          }}
        </label>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },
});

const { errors } = toRefs(props);
</script>
