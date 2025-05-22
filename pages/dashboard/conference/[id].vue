<template>
  <div v-if="pendingConference" class="col-span-12">
    <div class="card p-6 flex flex-col justify-center items-center">
      <h4 class="mb-2">{{ pendingConference.message }}</h4>
      <p class="mb-0">
        {{ $t("pages.conference.until_the_start_of_the_conference") }}
        <b class="text-danger">
          <countdownTimer
            :endDate="conference.start_time"
            :onComplete="() => timeIsUp()"
          />
        </b>
      </p>
    </div>
  </div>
  <div v-else-if="errorMessage" class="col-span-12">
    <div class="card p-6 flex flex-col justify-center items-center">
      <h5 class="text-danger mb-0">{{ t("an_error_occurred") }}</h5>
      <p class="text-center">{{ errorMessage.message }}</p>
      <button class="btn btn-sm btn-outline-primary" @click="reloadPage">
        {{ $t("restart") }}
      </button>
    </div>
  </div>
  <div v-else-if="localStream" class="col-span-12">
    <div class="custom-grid">
      <div class="col-span-12">
        <gridMode v-if="confMode === 'grid'" :streams="streams" />
        <sliderMode v-else-if="confMode === 'slider'" :streams="streams" />
      </div>

      <div class="db__footer__menu">
        <button
          @click="toggleMute"
          :title="
            isMuted
              ? $t('pages.conference.mic_turn_on')
              : $t('pages.conference.mic_turn_off')
          "
        >
          <i v-if="isMuted" class="bi bi-mic-mute text-danger"></i>
          <div v-else>
            <i v-if="volume > 50" class="bi bi-mic-fill text-success"></i>
            <i v-else class="bi bi-mic text-success"></i>
          </div>

          <span :class="isMuted ? 'text-danger' : 'text-success'">{{
            $t("pages.conference.mic")
          }}</span>
        </button>

        <button
          @click="toggleStream"
          :title="
            isStream
              ? $t('pages.conference.video_turn_off')
              : $t('pages.conference.video_turn_on')
          "
        >
          <i
            class="bi"
            :class="
              isStream
                ? 'bi-camera-video text-success'
                : 'bi-camera-video-off-fill text-danger'
            "
          ></i>

          <span :class="isStream ? 'text-success' : 'text-danger'">{{
            $t("pages.conference.video")
          }}</span>
        </button>

        <button @click="participantsModalIsVisible = true">
          <i class="bi bi-people-fill"></i>
          <countBadge
            :count="streams.length"
            :class="'badge-sm badge-light right-3 top-0'"
          />
          <span>{{ $t("pages.conference.participants") }}</span>
        </button>

        <button
          @click="toggleScreenSharing"
          :title="
            isScreenSharing
              ? $t('pages.conference.demo_turn_off')
              : $t('pages.conference.demo_turn_on')
          "
        >
          <i
            class="bi"
            :class="
              isScreenSharing ? 'bi-display-fill text-success' : 'bi-display'
            "
          ></i>

          <span>{{ $t("pages.conference.demo") }}</span>
        </button>

        <button @click="messagesModalIsVisible = true">
          <i class="bi bi-chat"></i>
          <span>{{ $t("pages.conference.chat") }}</span>
        </button>

        <button @click="drawingBoardModalIsVisible = true">
          <i class="bi bi-easel2"></i>
          <span>{{ $t("pages.conference.board") }}</span>
        </button>

        <button @click="tasksModalIsVisible = true">
          <i class="bi bi-pen"></i>
          <span>{{ $t("pages.tasks.title") }}</span>
        </button>
      </div>
    </div>

    <modal
      :show="participantsModalIsVisible"
      :onClose="() => (participantsModalIsVisible = false)"
      :className="'modal-lg'"
      :closeOnClickSelf="true"
    >
      <template v-slot:header_content>
        <h4>{{ $t("pages.conference.participants") }}</h4>
      </template>
      <template v-slot:body_content>
        <div class="flex flex-col gap-y-4">
          <div>
            <p>
              {{ $t("pages.conference.participants_count") }}:
              <b>{{ streams.length }}</b>
            </p>
            <ul class="list-group nowrap">
              <li v-for="stream in streams" :key="stream.peer_id">
                <div class="flex flex-wrap items-center justify-between gap-1">
                  <div class="flex items-center gap-1">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-6 h-6 text-sm'"
                      :user="stream.userInfo"
                    />
                    <span class="font-medium"
                      >{{ stream.userInfo.last_name }}
                      {{ stream.userInfo.first_name }}
                      <i v-if="!stream.remote">({{ $t("you") }})</i></span
                    >
                  </div>
                  <div class="flex gap-2">
                    <i
                      class="bi"
                      :class="
                        !stream.isMuted
                          ? 'bi-mic text-success'
                          : 'bi-mic-mute text-danger'
                      "
                    ></i>
                    <i
                      class="bi"
                      :class="
                        stream.isStream
                          ? 'bi-camera-video text-success'
                          : 'bi-camera-video-off text-danger'
                      "
                    ></i>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </modal>

    <modal
      :show="drawingBoardModalIsVisible"
      :onClose="() => (drawingBoardModalIsVisible = false)"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4>{{ $t("pages.conference.board") }}</h4>
      </template>
      <template v-slot:body_content>
        <drawingBoard :streams_length="streams.length" />
      </template>
    </modal>

    <modal
      :show="messagesModalIsVisible"
      :onClose="() => (messagesModalIsVisible = false)"
      :className="'modal-2xl'"
      :closeOnClickSelf="true"
    >
      <template v-slot:header_content>
        <h4>{{ $t("pages.conference.chat") }}</h4>
      </template>
      <template v-slot:body_content>
        <ul
          v-if="messages.length > 0"
          class="list-group mb-5 min-h-full overflow-y-scroll"
        >
          <li v-for="(item, index) in messages" :key="index">
            <p class="font-medium mb-2">{{ item.user_name }}</p>
            <p class="mb-0">{{ item.message }}</p>
          </li>
        </ul>
        <div class="flex gap-2">
          <div class="form-group-border active w-full">
            <i class="pi pi-envelope"></i>
            <input v-model="message" type="text" placeholder=" " />
            <label></label>
          </div>
          <button
            @click="sendMessage"
            class="btn btn-square btn-outline-primary"
          >
            <i class="pi pi-arrow-right"></i>
          </button>
        </div>
      </template>
    </modal>

    <modal
      :show="tasksModalIsVisible"
      :showLoader="pendingTasks"
      :onClose="() => (tasksModalIsVisible = false)"
      :className="'modal-2xl'"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4>{{ $t("pages.tasks.title") }}</h4>
      </template>
      <template v-slot:body_content v-if="conference">
        <ul class="list-group nowrap lg overflow-hidden">
          <li v-for="taskItem in tasks" :key="taskItem.task_id">
            <div class="flex items-center justify-between gap-4">
              <div
                class="flex gap-2 items-center cursor-pointer w-full"
                @click="
                  conference.mentor_id === authUser.user_id
                    ? openLearnersTasksModal(taskItem)
                    : taskItem.task_result.answers
                    ? openTaskResult(taskItem)
                    : taskItem.launched && openTask(taskItem)
                "
              >
                <i class="text-4xl" :class="taskItem.icon"></i>
                <div class="flex flex-col gap-y-0.5">
                  <span class="font-medium">{{ taskItem.task_slug }}</span>
                  <span class="text-inactive text-xs">{{
                    taskItem.task_type_name
                  }}</span>

                  <span
                    class="italic text-xs"
                    :class="taskItem.launched ? 'text-success' : 'text-danger'"
                  >
                    {{
                      taskItem.launched
                        ? conference.mentor_id === authUser.user_id
                          ? $t("pages.tasks.launched")
                          : $t("pages.tasks.is_available")
                        : conference.mentor_id === authUser.user_id
                        ? $t("pages.tasks.not_launched")
                        : $t("pages.tasks.is_unavailable")
                    }}</span
                  >
                </div>
              </div>

              <circleProgressBar
                v-if="
                  conference.mentor_id !== authUser.user_id &&
                  taskItem.task_result
                "
                :progress="taskItem.task_result.percentage"
              />
              <div
                class="pr-2"
                v-if="conference.mentor_id === authUser.user_id"
              >
                <span
                  class="text-nowrap font-medium"
                  :class="
                    taskItem.completed_learners_tasks ===
                    taskItem.learners.length
                      ? 'text-success'
                      : ''
                  "
                >
                  <span
                    :class="
                      taskItem.completed_learners_tasks > 0 && 'text-success'
                    "
                    >{{ taskItem.completed_learners_tasks }}</span
                  >
                  / {{ taskItem.learners.length }}</span
                >
              </div>
            </div>
          </li>
        </ul>
      </template>
    </modal>

    <modal
      :show="taskModalIsVisible"
      :onClose="() => closeModalByUser()"
      :className="taskModalClass + ' min-h-0'"
      :showLoader="pendingTaskModal"
      :showPendingText="true"
      :loaderOpacityFull="true"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h3>{{ task ? task.task_slug : $t("pages.tasks.adding_a_task") }}</h3>
      </template>
      <template v-slot:body_content>
        <component :is="currentTaskModal" v-bind="taskModalProps" />
      </template>
    </modal>

    <modal
      :show="taskResultModalIsVisible"
      :onClose="() => closeTaskResultModal()"
      :className="'modal-xl'"
      :showLoader="false"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content v-if="task">
        <h4>{{ task.task_slug }}</h4>
      </template>
      <template
        v-slot:body_content
        v-if="task && task.task_result && task.task_result.answers"
      >
        <taskResultChart :taskResult="task.task_result" />
      </template>
    </modal>

    <modal
      :show="learnersTasksModalIsVisible"
      :onClose="() => closeLearnersTasksModal()"
      :className="'modal-xl'"
      :showLoader="pendingLearnersTasksResult"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content v-if="task">
        <h4>{{ task.task_slug }}</h4>
      </template>
      <template v-slot:body_content v-if="task">
        <div class="custom-grid">
          <div class="col-span-12">
            <ul class="list-group nowrap">
              <li v-for="learner in task.learners" :key="learner.user_id">
                <div
                  class="flex items-center justify-between gap-4"
                  :class="
                    learner.task_result.completed === true
                      ? 'cursor-pointer'
                      : ''
                  "
                  @click="
                    learner.task_result.completed === true &&
                      openLearnerTaskResultModal(learner)
                  "
                >
                  <div class="flex items-center gap-1.5">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-9 h-9 text-sm'"
                      :user="learner"
                    />
                    <div class="flex flex-col">
                      <span class="font-medium"
                        >{{ learner.last_name }}
                        {{ learner.first_name }}
                      </span>
                      <span
                        :class="
                          learner.task_result.completed === true
                            ? 'text-success'
                            : 'text-danger'
                        "
                        class="text-xs"
                        >{{
                          learner.task_result.completed === true
                            ? $t("pages.tasks.is_completed")
                            : $t("pages.tasks.not_been_completed_yet")
                        }}</span
                      >
                    </div>
                  </div>

                  <circleProgressBar
                    v-if="learner.task_result.completed === true"
                    :progress="learner.task_result.percentage"
                  />
                </div>
              </li>
            </ul>
          </div>
          <div class="col-span-12">
            <button
              class="btn btn-outline-success"
              :class="task.launched ? 'disabled' : ''"
              @click="showTaskForLearners()"
            >
              <i class="pi pi-play"></i>
              {{
                task.launched
                  ? $t("pages.tasks.launched")
                  : $t("pages.tasks.run")
              }}
            </button>
          </div>
        </div>
      </template>
    </modal>

    <modal
      :show="learnerTaskResultModalIsVisible"
      :onClose="() => closeLearnerTaskResultModal()"
      :className="'modal-xl'"
      :showLoader="false"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content v-if="currentLearner && task">
        <h4>{{ task.task_slug }}</h4>
      </template>
      <template
        v-slot:body_content
        v-if="
          currentLearner &&
          currentLearner.task_result &&
          currentLearner.task_result.answers
        "
      >
        <taskResultChart :taskResult="currentLearner.task_result">
          <template v-slot:header_content>
            <div class="col-span-12">
              <div class="flex gap-x-2 items-center mb-3">
                <userAvatar
                  :padding="0.5"
                  :className="'w-9 h-9'"
                  :user="{
                    last_name: currentLearner.last_name,
                    first_name: currentLearner.first_name,
                    avatar: currentLearner.avatar,
                  }"
                />
                <div>
                  <p class="text-inactive text-xs mb-0">{{ $t("learner") }}:</p>
                  <p class="font-medium mb-0">
                    {{ currentLearner.last_name }}
                    {{ currentLearner.first_name }}
                  </p>
                </div>
              </div>
              <hr />
            </div>
          </template>
        </taskResultChart>
      </template>
    </modal>
  </div>
  <div v-else class="col-span-12">
    <div class="card p-6 flex flex-col justify-center items-center">
      <p class="text-center">
        {{ $t("pages.conference.messages.requesting_access") }}
      </p>
      <div class="overlay-loading-circle sm"></div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from "nuxt/app";
import { ref, onMounted, onBeforeUnmount, provide, shallowRef } from "vue";
import { monitorNetworkAndAdjustQuality } from "../../../utils/networkQuality";
import { useToast } from "vue-toastification";
import Peer from "peerjs";
import { useRuntimeConfig } from "nuxt/app";
import gridMode from "../../../components/conference/modes/gridMode.vue";
import sliderMode from "../../../components/conference/modes/sliderMode.vue";
import drawingBoard from "../../../components/conference/drawingBoard.vue";
import countBadge from "../../../components/ui/countBadge.vue";
import modal from "../../../components/ui/modal.vue";
import userAvatar from "../../../components/ui/userAvatar.vue";
import countdownTimer from "../../../components/ui/countdownTimer.vue";
import taskResultChart from "../../../components/lesson/components/tasks/taskResultChart.vue";
import circleProgressBar from "../../../components/ui/circleProgressBar.vue";

const router = useRouter();
const route = useRoute();
const conference_id = route.params.id;
const pageTitle = ref("");

const { t } = useI18n();
const config = useRuntimeConfig();
const toast = useToast();
const { $axiosPlugin, $socketPlugin } = useNuxtApp();
const authUser = useSanctumUser();

const authUserInfo = {
  first_name: authUser.value.first_name,
  last_name: authUser.value.last_name,
  avatar: authUser.avatar,
};

let myPeer;
const peers = {};

const conference = ref(null);

// grid or slider
const confMode = ref("grid");

const localStream = ref(null);
const myStream = ref(null);
const screenStream = ref(null); // Поток экрана
const streams = ref([]);
const errorMessage = ref(null);
const pendingConference = ref(null);
const isMuted = ref(false); // Состояние микрофона
const volume = ref(0);
const isStream = ref(false); // Состояние видео
const isScreenSharing = ref(false); // Состояние демонстрации экрана

const message = ref("");
const messages = ref([]);

//Modals
const participantsModalIsVisible = ref(false);
const drawingBoardModalIsVisible = ref(false);
const messagesModalIsVisible = ref(false);

const task = ref(null);
const tasks = ref([]);
const taskModalIsVisible = ref(false);
const tasksModalIsVisible = ref(false);
const taskResultModalIsVisible = ref(false);
const learnersTasksModalIsVisible = ref(false);
const learnerTaskResultModalIsVisible = ref(false);

const taskModalClass = ref("modal-lg");
const taskModalProps = ref({});
const currentTaskModal = shallowRef(null);

const pendingTasks = ref(false);
const pendingTaskModal = ref(false);
const pendingLearnersTasksResult = ref(false);
const currentLearner = ref(null);

useHead({
  title: pageTitle,
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const onPending = (state) => {
  pendingTaskModal.value = state;
};

const onCompleteTask = () => {
  $socketPlugin.emit("complete_task", {
    userInfo: authUserInfo,
    taskName: task.value.task_slug,
  });
};

const changeModalSize = (size) => {
  taskModalClass.value = size;
};

const closeModal = () => {
  taskModalIsVisible.value = false;
  pendingTaskModal.value = false;
  task.value = null;
  getConferenceTasks();
};

const closeModalByUser = () => {
  taskModalIsVisible.value = false;
  pendingTaskModal.value = false;
  currentTaskModal.value = null;
  task.value = null;
  getConferenceTasks();
};

provide("onPending", onPending);
provide("onCompleteTask", onCompleteTask);
provide("changeModalSize", changeModalSize);
provide("closeModal", closeModal);

const openTask = (currentTask) => {
  currentTaskModal.value = null;
  taskModalProps.value = null;
  tasksModalIsVisible.value = false;
  taskResultModalIsVisible.value = false;
  learnersTasksModalIsVisible.value = false;
  learnerTaskResultModalIsVisible.value = false;

  participantsModalIsVisible.value = false;
  drawingBoardModalIsVisible.value = false;
  messagesModalIsVisible.value = false;

  task.value = currentTask;
  taskModalIsVisible.value = true;

  currentTaskModal.value = defineAsyncComponent(() =>
    import(
      `../../../components/lesson/components/tasks/actions/execution/${task.value.task_type_component}.vue`
    )
  );

  taskModalProps.value = {
    task: currentTask,
  };
};

const openTaskResult = (currentTask) => {
  task.value = currentTask;
  currentTaskModal.value = null;
  tasksModalIsVisible.value = false;
  taskResultModalIsVisible.value = true;
};

const closeTaskResultModal = () => {
  task.value = null;
  taskResultModalIsVisible.value = false;
  tasksModalIsVisible.value = true;
};

const openLearnersTasksModal = async (currentTask) => {
  task.value = currentTask;
  tasksModalIsVisible.value = false;
  learnersTasksModalIsVisible.value = true;
};

const closeLearnersTasksModal = () => {
  learnersTasksModalIsVisible.value = false;
  tasksModalIsVisible.value = true;
};

const openLearnerTaskResultModal = (learner) => {
  currentLearner.value = learner;
  learnersTasksModalIsVisible.value = false;
  learnerTaskResultModalIsVisible.value = true;
};

const closeLearnerTaskResultModal = () => {
  learnerTaskResultModalIsVisible.value = false;
  learnersTasksModalIsVisible.value = true;
  currentLearner.value = null;
};

const showTaskForLearners = async () => {
  pendingLearnersTasksResult.value = true;
  await $axiosPlugin
    .post(
      "conferences/run_task/" + conference.value.uuid + "/" + task.value.task_id
    )
    .then((response) => {
      getConferenceTasks();
      $socketPlugin.emit("show_task", {
        taskId: task.value.task_id,
      });
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

const getConference = async () => {
  await $axiosPlugin
    .get("conferences/get_conference/" + conference_id)
    .then((response) => {
      conference.value = response.data.conference;

      if (response.data.type === "error") {
        errorMessage.value = response.data;
      } else if (response.data.type === "pending") {
        pendingConference.value = response.data;
      } else {
        startStream();
        getConferenceTasks();
      }

      const confCrumbItem = document.querySelector('span[data-crumb="[id]"]');

      // Проверить, найден ли элемент
      if (confCrumbItem) {
        // Изменить текст внутри элемента
        confCrumbItem.textContent =
          response.data.conference.group_name +
          " (" +
          response.data.conference.lesson_name +
          ")";
      }

      pageTitle.value =
        t("pages.conference.title") +
        " - " +
        response.data.conference.group_name +
        " (" +
        response.data.conference.lesson_name +
        ")";
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

const getConferenceTasks = async () => {
  pendingTasks.value = true;
  pendingLearnersTasksResult.value = true;
  await $axiosPlugin
    .get("conferences/get_conference_tasks/" + conference.value.uuid)
    .then((response) => {
      tasks.value = response.data;

      if (task.value !== null) {
        task.value = tasks.value.find((t) => t.task_id === task.value.task_id);
      }
      pendingTasks.value = false;
      pendingLearnersTasksResult.value = false;
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

const timeIsUp = () => {
  setTimeout(() => {
    getConference();
    pendingConference.value = null;
  }, 1000);
};

const startStream = async () => {
  try {
    localStream.value = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 1280,
        height: 720,
        facingMode: "user",
      },
      audio: true,
    });

    myPeer = new Peer(undefined, {
      host: config.public.peerBase,
      port: process.env.NODE_ENV === "development" ? 3002 : "",
      path: "/peerjs/myapp",
      secure: process.env.NODE_ENV === "development" ? false : true,
    });

    myPeer.on("open", (id) => {
      monitorNetworkAndAdjustQuality(myPeer);

      addStream(
        false,
        localStream.value,
        myPeer.id,
        authUser.value.user_id,
        authUserInfo,
        isStream.value,
        isMuted.value
      );
      myStream.value = streams.value.find((s) => s.peer_id === id);

      if (isStream.value === false) {
        toggleStream();
      }

      trackMicrophone(localStream.value);
      joinToRoom();
    });

    myPeer.on("error", () => {
      toast(t("errors.server.peer_error"), {
        toastClassName: ["custom-toast", "danger"],
        timeout: 10000,
      });
    });

    myPeer.on("call", (call) => {
      call.answer(
        isScreenSharing.value ? screenStream.value : localStream.value
      );

      call.on("stream", (remoteStream) => {
        addStream(
          true,
          remoteStream,
          call.peer,
          call.metadata.userId,
          call.metadata.userInfo,
          call.metadata.isStream,
          call.metadata.isMuted
        );
      });

      call.on("error", (error) => {
        errorMessage.value = {
          message: error.message,
          pending: false,
        };
      });

      peers[call.peer] = call;
    });

    $socketPlugin.off("user-connected");

    $socketPlugin.on("user-connected", (connectedUserInfo) => {
      toast(connectedUserInfo.first_name + " " + t("on_air").toLowerCase(), {
        toastClassName: ["custom-toast", "info"],
        timeout: 10000,
      });
    });

    $socketPlugin.on("user-disconnected", (peerId) => {
      removeStream(peerId);
    });

    $socketPlugin.on("new-message", (data) => {
      messages.value.push(data);
    });

    $socketPlugin.on("toggle-video", (data) => {
      const findStream = streams.value.find((s) => s.peer_id === data.peerId);
      if (findStream) {
        findStream.isStream = data.isStream;
      }
    });

    $socketPlugin.on("toggle-audio", (data) => {
      const findStream = streams.value.find((s) => s.peer_id === data.peerId);
      if (findStream) {
        findStream.isMuted = data.isMuted;
      }
    });

    $socketPlugin.on("update-volume", (data) => {
      updateVolume(data);
    });

    $socketPlugin.on("connect_error", () => {
      if (!errorMessage.value) {
        errorMessage.value = {
          message: t("errors.server.error"),
          pending: true,
        };

        streams.value = streams.value.filter((stream) => !stream.remote);

        toast(t("errors.server.error"), {
          toastClassName: ["custom-toast", "danger"],
          timeout: 5000,
        });
      }
    });

    $socketPlugin.on("show_task", (data) => {
      if (authUser.value.user_id !== conference.value.mentor_id) {
        getConferenceTasks();
        openTask(tasks.value.find((t) => t.task_id === data.taskId));
      }
    });

    $socketPlugin.on("complete_task", (data) => {
      if (authUser.value.user_id === conference.value.mentor_id) {
        getConferenceTasks();

        toast(
          t("pages.tasks.completed_the_task", {
            name: data.userInfo.last_name + " " + data.userInfo.first_name,
            taskName: data.taskName,
          }),
          {
            toastClassName: ["custom-toast", "info"],
            timeout: 10000,
          }
        );
      }
    });
  } catch (error) {
    toast(t("errors.media.camera_error"), {
      toastClassName: ["custom-toast", "danger"],
      timeout: 10000,
    });
  }
};

const joinToRoom = async () => {
  await $socketPlugin.connect();
  $socketPlugin.emit(
    "join-room",
    "room_" + conference.value.uuid,
    myPeer.id,
    authUser.value.user_id,
    authUserInfo,
    isStream.value,
    isMuted.value,
    (response) => {
      if (response.success) {
        errorMessage.value = null;
        $socketPlugin.emit("get-room-info", (roomInfo) => {
          roomInfo.forEach((user) => {
            if (user.peerId !== myPeer.id) {
              const outgoingCall = myPeer.call(
                user.peerId,
                isScreenSharing.value ? screenStream.value : localStream.value,
                {
                  metadata: {
                    userId: authUser.value.user_id,
                    userInfo: authUserInfo,
                    isStream: isStream.value,
                    isMuted: isMuted.value,
                  },
                }
              );

              outgoingCall.on("stream", (remoteStream) => {
                addStream(
                  true,
                  remoteStream,
                  outgoingCall.peer,
                  user.userId,
                  user.userInfo,
                  user.isStream,
                  user.isMuted
                );
              });

              outgoingCall.on("error", (error) => {
                errorMessage.value = {
                  message: error.message,
                  pending: false,
                };
              });

              peers[user.peerId] = outgoingCall;
            }
          });
        });
      } else {
        if (response.message === "peer_is_null") {
          toast(t("errors.server.peer_error"), {
            toastClassName: ["custom-toast", "danger"],
            timeout: 10000,
          });
        } else {
          toast(t("errors.server.room_error"), {
            toastClassName: ["custom-toast", "danger"],
            timeout: 10000,
          });
        }
      }
    }
  );
};

const addStream = (
  remote,
  stream,
  peer_id,
  user_id,
  userInfo,
  isStream,
  isMuted
) => {
  if (!streams.value.some((stream) => stream.peer_id === peer_id)) {
    streams.value.push({
      remote,
      stream,
      peer_id,
      user_id,
      userInfo,
      isStream,
      isMuted,
    });
  }
};

const stopLocalStream = () => {
  $socketPlugin.off("user-connected");
  $socketPlugin.off("user-disconnected");
  $socketPlugin.off("new-message");
  $socketPlugin.off("toggle-video");
  $socketPlugin.off("toggle-audio");
  $socketPlugin.off("update-volume");
  $socketPlugin.off("connect_error");
  $socketPlugin.off("show_task");
  $socketPlugin.off("complete_task");
  if (myPeer) {
    myPeer.destroy();
    myPeer = null;
  }

  if (localStream.value !== null) {
    localStream.value.getTracks().forEach((track) => track.stop());
  }

  if (screenStream.value !== null) {
    screenStream.value.getTracks().forEach((track) => track.stop());
  }
  localStream.value = null;
  screenStream.value = null;
  streams.value = [];
  $socketPlugin.disconnect();
};

const removeStream = (peerId) => {
  const streamToRemove = streams.value.find((s) => s.peer_id === peerId);

  if (streamToRemove) {
    streams.value = streams.value.filter((s) => s.peer_id !== peerId);

    if (peers[peerId]) {
      peers[peerId].close();
    }
  }

  if (peerId === myPeer.id) {
    stopLocalStream();
  }
};

const toggleStream = () => {
  if (localStream.value) {
    const videoTrack = localStream.value.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    isStream.value = videoTrack.enabled;

    myStream.value.isStream = isStream.value;

    if (streams.value.length > 1) {
      $socketPlugin.emit("toggle-video", {
        peerId: myPeer.id,
        isStream: isStream.value,
      });
    }
  } else {
    toast(t("errors.media.camera_error"), {
      toastClassName: ["custom-toast", "danger"],
      timeout: 10000,
    });
  }
};

const toggleMute = () => {
  if (localStream.value) {
    const audioTrack = localStream.value.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    isMuted.value = !audioTrack.enabled;

    myStream.value.isMuted = isMuted.value;

    if (streams.value.length > 1) {
      $socketPlugin.emit("toggle-audio", {
        peerId: myPeer.id,
        isMuted: isMuted.value,
      });
    }
  } else {
    toast(t("errors.media.camera_error"), {
      toastClassName: ["custom-toast", "danger"],
      timeout: 10000,
    });
  }
};

const replaceTrackInConnections = (newTrack, kind = "video") => {
  const activeConnections = Object.keys(myPeer.connections);
  if (activeConnections.length > 0) {
    const sender = myPeer.connections[activeConnections[0]][0].peerConnection
      .getSenders()
      .find((s) => s.track.kind === kind);
    if (sender) {
      sender.replaceTrack(newTrack);
    }
  }
};

const toggleScreenSharing = async () => {
  if (!isScreenSharing.value) {
    try {
      screenStream.value = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      isScreenSharing.value = true;
      replaceTrackInConnections(
        screenStream.value.getVideoTracks()[0],
        "video"
      );

      screenStream.value.getVideoTracks()[0].onended = stopScreenSharing;
    } catch (error) {
      toast(t("errors.media.screen_sharing_error"), {
        toastClassName: ["custom-toast", "danger"],
        timeout: 10000,
      });
    }
  } else {
    stopScreenSharing();
  }
};

const stopScreenSharing = () => {
  isScreenSharing.value = false;
  replaceTrackInConnections(localStream.value.getVideoTracks()[0], "video");

  screenStream.value.getTracks().forEach((track) => track.stop());
  screenStream.value = null;
};

const trackMicrophone = async (stream) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Загрузка аудиоработника
  await audioContext.audioWorklet.addModule("/scripts/volume-processor.js");

  const microphone = audioContext.createMediaStreamSource(stream);
  const volumeProcessor = new AudioWorkletNode(
    audioContext,
    "volume-processor"
  );

  microphone.connect(volumeProcessor);
  volumeProcessor.connect(audioContext.destination);

  volumeProcessor.port.onmessage = (event) => {
    volume.value = Math.ceil(event.data);

    myStream.value.volume = volume.value;

    if (!isMuted.value && streams.value.length > 1 && volume.value >= 50) {
      $socketPlugin.emit("microphone-volume", {
        peerId: myPeer.id,
        volume: volume.value,
      });
    }
  };
};

const updateVolume = (() => {
  let timeoutId = null;
  return (data) => {
    const findStream = streams.value.find((s) => s.peer_id === data.peerId);
    if (findStream) {
      findStream.volume = data.volume;

      // Сбрасываем предыдущий таймаут, если он есть
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Устанавливаем новый таймаут для снижения громкости до нуля
      timeoutId = setTimeout(() => {
        findStream.volume = 0; // Снижение громкости до нуля
      }, 100); // Задержка перед началом снижения громкости
    }
  };
})();

const sendMessage = () => {
  if (message.value !== "") {
    const messageData = {
      user_name: authUser.value.first_name,
      message: message.value,
    };

    messages.value.push(messageData);
    $socketPlugin.emit("message", messageData);
    message.value = "";
  }
};

const reloadPage = () => {
  window.location.reload();
};

onMounted(() => {
  getConference();
});

onBeforeUnmount(() => {
  if (localStream) {
    stopLocalStream();
  }
});
</script>
