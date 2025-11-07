<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <div class="btn-wrap">
        <button
          type="button"
          @click="showHideUserSearchFilter"
          class="btn btn-light"
        >
          <i class="pi pi-search"></i>
          {{
            searchFilter === true
              ? $t("hide_search_filter")
              : $t("show_search_filter")
          }}
        </button>
      </div>
    </div>
    <div
      class="col-span-12 lg:col-span-3"
      :class="searchFilter ? 'block' : 'hidden'"
    >
      <stickyBox>
        <div class="card p-4">
          <h5>{{ $t("pages.users.search_filter") }}</h5>
          <div class="custom-grid">
            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-user"></i>
                <input
                  type="text"
                  v-model="userInput"
                  placeholder=" "
                  @input="debounceUsers"
                />
                <label
                  >{{ $t("form.last_name") }},
                  {{ $t("form.first_name") }}</label
                >
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-at"></i>
                <input
                  type="text"
                  v-model="emailInput"
                  placeholder=" "
                  @input="debounceUsers"
                />
                <label>{{ $t("form.email") }}</label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-mobile"></i>
                <input
                  v-model="phoneInput"
                  v-mask="'+7 (###) ###-####'"
                  placeholder=" "
                  @input="debounceUsers"
                />
                <label>{{ $t("form.phone") }}</label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-calendar"></i>
                <input
                  type="date"
                  v-model="createdAtFromInput"
                  @input="debounceUsers"
                  placeholder=" "
                />
                <label>{{ $t("registered_at_from") }}</label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-calendar"></i>
                <input
                  type="date"
                  v-model="createdAtToInput"
                  @input="debounceUsers"
                  placeholder=" "
                />
                <label>{{ $t("registered_at_to") }}</label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="btn-wrap">
                <button
                  type="button"
                  @click="debounceReset"
                  class="btn btn-sm btn-outline-primary"
                >
                  <i class="pi pi-undo"></i>
                  {{ $t("reset_search_filter") }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </stickyBox>
    </div>

    <div class="col-span-12" :class="searchFilter && 'lg:col-span-9'">
      <div class="custom-grid">
        <div class="col-span-12">
          <template v-if="users.data?.length > 0">
            <note
              :message="$t('pages.groups.note_1')"
              :className="'outline-primary mb-4'"
            />
            <div class="table table-striped table-sm selectable primary">
              <loader v-if="pending" :className="'overlay'" />
              <table>
                <thead>
                  <tr>
                    <th>
                      {{ $t("form.last_name") }} {{ $t("form.first_name") }}
                    </th>
                    <th>{{ $t("pages.groups.title") }}</th>
                    <th>{{ $t("form.email") }}</th>
                    <th>{{ $t("form.phone") }}</th>
                    <th>{{ $t("registered_at") }}</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="user in users.data"
                    :key="user.user_id"
                    @click="addToGroup(user)"
                  >
                    <td>
                      <div class="flex gap-x-2 items-center">
                        <userAvatar
                          :padding="0.5"
                          :className="'w-6 h-6 bg-corp text-[10px]'"
                          :user="user"
                          :isChecked="
                            groupMembers.some(
                              (member) => member.user_id === user.user_id
                            )
                          "
                        />
                        <span class="text-nowrap"
                          >{{ user.last_name }} {{ user.first_name }}</span
                        >
                        <span
                          v-if="
                            groupMembers.some(
                              (member) => member.user_id === user.user_id
                            )
                          "
                          class="text-corp text-nowrap"
                          >{{ $t("user_added") }}</span
                        >
                        <span v-else class="text-inactive text-nowrap">{{
                          $t("user_not_added")
                        }}</span>
                      </div>
                    </td>
                    <td>
                      <template v-if="user.groups.length > 0">
                        <span
                          class="text-corp"
                          v-for="(group, groupIndex) in user.groups"
                          :key="group.group_id"
                        >
                          {{ groupIndex >= user.groups.length - 1 ? " " : ""
                          }}{{ group.group_name
                          }}{{
                            groupIndex >= user.groups.length - 1 ? "" : ","
                          }}
                        </span>
                      </template>
                      <span v-else>{{ $t("pages.groups.not_member") }}</span>
                    </td>
                    <td>{{ user.email }}</td>
                    <td>{{ user.phone }}</td>
                    <td>{{ new Date(user.created_at).toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="btn-wrap mt-6">
              <pagination
                :items="users"
                :setItems="getUsers"
                :onSelect="(count) => (perPage = count)"
                :bgClassName="'bg_active'"
                :defaultPerPage="5"
              />
            </div>
          </template>

          <alert v-else :className="'light'">
            <loader v-if="pending" :className="'overlay'" />
            <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
          </alert>
        </div>
        <div class="col-span-12">
          <p
            :class="{
              'text-danger': errors.members_count && !groupMembers.length,
            }"
          >
            <span v-if="errors.members_count && !groupMembers.length">{{
              errors.members_count[0]
            }}</span>
            <span v-else>
              {{ $t("pages.groups.added_members_count") }}:
              <b>{{ groupMembers.length }}</b></span
            >
          </p>

          <div v-if="groupMembers.length > 0" class="btn-wrap">
            <userTag
              v-for="(member, index) in groupMembers"
              :key="index"
              :user="member"
              :onDelete="(user_id) => deleteFromGroup(user_id)"
              :closable="true"
              v-motion="{
                initial: {
                  y: -100,
                  opacity: 0,
                },
                enter: {
                  y: 0,
                  opacity: 1,
                },
              }"
            />
          </div>

          <ul v-if="errors && errors.members" class="list-group nowrap mt-4">
            <li class="text-danger font-bold">
              {{ $t("pages.groups.already_members_of_a_similar_group") }}
            </li>
            <li v-for="member in errors.members" :key="member.user_id">
              {{ $t("learner") }}:
              <b>{{ member.last_name }} {{ member.first_name }}</b>
              <br>
              {{ $t("pages.groups.group") }}:
              <b>{{ member.group_name }}</b>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import pagination from "../../../ui/pagination.vue";
import alert from "../../../ui/alert.vue";
import loader from "../../../ui/loader.vue";
import userAvatar from "../../../ui/userAvatar.vue";
import stickyBox from "../../../ui/stickyBox.vue";
import note from "../../../ui/note.vue";
import userTag from "../../../ui/userTag.vue";
import { useToast } from "vue-toastification";
import { watch } from "vue";

const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const userInput = ref("");
const emailInput = ref("");
const phoneInput = ref("");
const createdAtFromInput = ref("");
const createdAtToInput = ref("");
const toast = useToast();
const { t } = useI18n();

const pending = ref(false);
const searchFilter = ref(false);
const perPage = ref(10);
const users = ref([]);

const getUsers = async (url) => {
  pending.value = true;

  const formData = {
    user: userInput.value,
    email: emailInput.value,
    phone: phoneInput.value,
    created_at_from: createdAtFromInput.value,
    created_at_to: createdAtToInput.value,
    per_page: perPage.value,
    is_a_member: true,
  };

  if (!url) {
    url = "users/get";
  }

  await $axiosPlugin
    .post(url, formData)
    .then((response) => {
      users.value = response.data;
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

const addToGroup = (user) => {
  if (!groupMembers.value.some((member) => member.user_id === user.user_id)) {
    let newArr = JSON.parse(JSON.stringify(groupMembers.value));
    newArr.push(user);
    groupMembers.value = newArr;
  } else {
    //var 1
    //groupMembers.value = groupMembers.value.filter((member) => member.user_id !== user.user_id);
    //var 2
    toast(t("pages.groups.warning_1"), {
      toastClassName: ["custom-toast", "success"],
      timeout: 5000,
    });
  }
};

const deleteFromGroup = (member_id) => {
  const memberToRemove = groupMembers.value.find(
    (member) => member.user_id === member_id
  );

  if (memberToRemove) {
    groupMembers.value = groupMembers.value.filter(
      (member) => member.user_id !== member_id
    );
  }
};

const showHideUserSearchFilter = () => {
  if (searchFilter.value === true) {
    searchFilter.value = false;
    resetUserSearchFilter();
  } else {
    searchFilter.value = true;
  }
};

const resetUserSearchFilter = () => {
  userInput.value = "";
  emailInput.value = "";
  phoneInput.value = "";
  createdAtFromInput.value = "";
  createdAtToInput.value = "";
  getUsers();
};

const debounceUsers = debounceHandler(() => getUsers(), 1000);
const debounceReset = debounceHandler(() => resetUserSearchFilter(), 500);

const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },

  groupMembers: {
    type: Object,
    required: true,
  },

  modalIsVisible: {
    type: Object,
    required: true,
  },
});

const { errors, groupMembers, modalIsVisible } = toRefs(props);

watch(
  () => modalIsVisible.value,
  (newVal) => {
    if (newVal === true) {
      getUsers();
    }
  }
);
</script>
