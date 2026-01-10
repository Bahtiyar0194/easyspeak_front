<template>
  <div class="custom-grid">
    <!-- <div v-for="l in paymentLessons" :key="l.uuid" class="col-span-12">
      <div class="card p-4">
        <p>
          {{ $t("pages.lessons.lesson_name") }}: <b>{{ l.lesson_name }}</b>
        </p>

        <p>
          {{ $t("pages.lessons.lesson_type") }}: <b>{{ l.lesson_type_name }}</b>
        </p>

        <p>
          {{ $t("pages.courses.course") }}: <b>{{ l.course_name }}</b>
        </p>

        <p>
          {{ $t("pages.groups.group_category") }}: <b>{{ l.level_name }}</b>
        </p>

        <p class="mb-0">
          {{ $t("pages.lessons.price_alt") }}:
          <b class="text-success">
            {{
              l.current_price.toLocaleString("ru-RU", {
                minimumFractionDigits: 2,
              })
            }}
            {{ $contacts.bank.currency.symbol }}</b
          >
        </p>
      </div>
    </div> -->
    <div class="col-span-12">
      <div class="table table-striped table-sm">
        <table>
          <thead>
            <tr>
              <th>{{ $t("pages.lessons.price_alt") }}</th>
              <th>{{ $t("start_time") }}</th>
              <th>{{ $t("pages.lessons.lesson_name") }}</th>
              <th>{{ $t("pages.lessons.lesson_type") }}</th>
              <th>{{ $t("pages.courses.course") }}</th>
              <th>{{ $t("pages.groups.group_category") }}</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="l in paymentLessons"
              :key="l.uuid"
              :class="l.is_active === true ? 'success' : ''"
            >
              <td>
                <b>
                  {{
                    l.current_price.toLocaleString("ru-RU", {
                      minimumFractionDigits: 2,
                    })
                  }}
                  {{ $contacts.bank.currency.symbol }}</b
                >
              </td>
              <td>
                {{
                  l.is_active === true
                    ? $t("already_started")
                    : l.start_time_formatted
                }}
              </td>
              <td>
                {{ l.lesson_name }}
              </td>
              <td>{{ l.lesson_type_name }}</td>
              <td>{{ l.course_name }}</td>
              <td>{{ l.level_name }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="paymentLessons.length > 0" class="col-span-12">
      <p class="text-xl mb-0 text-right">
        {{ $t("total") }}:
        <b>
          {{
            paymentLessons
              .reduce((sum, item) => sum + item.current_price, 0)
              .toLocaleString("ru-RU")
          }}
          {{ $contacts.bank.currency.symbol }}</b
        >
      </p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  paymentLessons: {
    type: Object,
    required: true,
  },
});

const { paymentLessons } = toRefs(props);
</script>
