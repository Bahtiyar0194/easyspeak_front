<template>
  <div v-if="pendingConference" class="col-span-12">
    <div class="card p-6 flex flex-col justify-center items-center">
      <h5 class="mb-2">{{ pendingConference.message }}</h5>
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
  <div v-else-if="endedConference" class="col-span-12">
    <div class="card p-6 flex flex-col justify-center items-center">
      <h5 class="mb-3">{{ endedConference.message }}</h5>
      <nuxt-link
        class="btn btn-sm btn-outline-primary"
        :to="localePath('/dashboard')"
      >
        <i class="pi pi-sign-in"></i>
        {{ $t("pages.dashboard.go_to_dashboard") }}
      </nuxt-link>
    </div>
  </div>
  <div v-else-if="errorMessage" class="col-span-12">
    <div class="card p-6 flex flex-col justify-center items-center">
      <h5 class="text-danger mb-0">{{ t("an_error_occurred") }}</h5>
      <p class="text-center">{{ errorMessage.message }}</p>
      <button class="btn btn-sm btn-outline-primary" @click="reloadPage">
        <i class="pi pi-refresh"></i>
        {{ $t("restart") }}
      </button>
    </div>
  </div>
  <div v-else-if="localStream" class="col-span-12">
    <div class="custom-grid">
      <div class="col-span-12">
        <div class="btn-wrap justify-end">
          <button
            type="button"
            class="btn btn-square"
            :class="confMode === 'grid' ? 'btn-outline-primary' : 'btn-light'"
            @click="confMode = 'grid'"
          >
            <i class="bi bi-grid-3x2"></i>
          </button>
          <button
            type="button"
            class="btn btn-square"
            :class="confMode === 'slider' ? 'btn-outline-primary' : 'btn-light'"
            @click="confMode = 'slider'"
          >
            <i class="bi bi-diagram-3"></i>
          </button>
        </div>
      </div>
      <div class="col-span-12">
        <gridMode v-if="confMode === 'grid'" :streams="streams" />
        <sliderMode v-else-if="confMode === 'slider'" :streams="streams" />
      </div>

      <div v-if="authUser" class="db__footer__menu">
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
            :class="'badge-sm badge-light right-1 top-0'"
          />
          <span>{{ $t("pages.conference.participants") }}</span>
        </button>

        <button
          v-if="authUser.user_id === conference.mentor_id"
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
          <countBadge
            v-if="unReadMessages > 0"
            :count="unReadMessages"
            :class="'badge-sm badge-primary right-1 top-0'"
          />
          <span>{{ $t("pages.conference.chat") }}</span>
        </button>

        <button @click="drawingBoardModalIsVisible = true">
          <i class="bi bi-easel2"></i>
          <span>{{ $t("pages.conference.board") }}</span>
        </button>

        <button
          v-if="conference.materials && conference.materials.length > 0"
          @click="materialsModalIsVisible = true"
        >
          <i class="bi bi-book"></i>
          <span>{{ $t("materials.title") }}</span>
        </button>

        <button v-if="tasks.length > 0" @click="tasksModalIsVisible = true">
          <i class="bi bi-pen"></i>
          <countBadge
            v-if="tasksToComplete > 0"
            :count="tasksToComplete"
            :class="'badge-sm badge-primary right-1 top-0'"
          />
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
        <h5>{{ $t("pages.conference.participants") }}</h5>
      </template>
      <template v-slot:body_content>
        <div class="flex flex-col gap-y-4">
          <div class="flex flex-col gap-y-2">
            <p class="text-success mb-0">
              {{ $t("online") }}: <b>{{ streams.length }}</b>
            </p>
            <ul class="list-group nowrap">
              <li v-for="stream in streams" :key="stream.peer_id">
                <div class="flex flex-wrap items-center justify-between gap-1">
                  <div class="flex items-center gap-1">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-7 h-7 text-sm'"
                      :user="stream.userInfo"
                    />
                    <div class="flex flex-col">
                      <span class="font-medium"
                        >{{ stream.userInfo.last_name }}
                        {{ stream.userInfo.first_name }}
                        <i v-if="!stream.remote">({{ $t("you") }})</i>
                        <i
                          class="text-success"
                          v-if="
                            stream.remote &&
                            stream.user_id === conference.mentor_id
                          "
                          >({{ $t("mentor") }})</i
                        >
                      </span>
                      <span
                        v-if="
                          busyLearners.length > 0 &&
                          busyLearners.some((l) => l.userId === stream.user_id)
                        "
                        class="text-xs text-warning"
                        >{{ $t("pages.tasks.in_process") }}</span
                      >
                    </div>
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

            <template v-if="offlineMembers.length > 0">
              <p class="text-danger mb-0 text-inactive">
                {{ $t("offline") }}: <b>{{ offlineMembers.length }}</b>
              </p>
              <ul class="list-group nowrap">
                <li v-for="member in offlineMembers" :key="member.user_id">
                  <div
                    class="flex flex-wrap items-center justify-between gap-1"
                  >
                    <div class="flex items-center gap-1 text-inactive">
                      <userAvatar
                        :padding="0.5"
                        :className="'w-7 h-7 text-sm'"
                        :user="{
                          avatar: member.avatar,
                          first_name: member.first_name,
                          last_name: member.last_name,
                        }"
                      />
                      <div class="flex flex-col">
                        <span class="font-medium"
                          >{{ member.last_name }}
                          {{ member.first_name }}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </template>
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
        <h5>{{ $t("pages.conference.board") }}</h5>
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
        <h5>{{ $t("pages.conference.chat") }}</h5>
      </template>
      <template v-slot:body_content>
        <div v-if="messages.length > 0" class="max-h-[300px] overflow-y-scroll">
          <div class="flex flex-col gap-y-1.5">
            <div
              v-for="(item, index) in messages"
              :key="index"
              class="flex"
              :class="
                item.user_id === authUser.user_id
                  ? 'justify-end'
                  : 'justify-start'
              "
            >
              <div class="flex gap-x-2">
                <userAvatar
                  v-if="item.user_id !== authUser.user_id"
                  :padding="0.5"
                  :className="'w-8 h-8'"
                  :user="{
                    last_name: item.userInfo.last_name,
                    first_name: item.userInfo.first_name,
                    avatar: item.userInfo.avatar,
                  }"
                />
                <div
                  class="chat"
                  :class="
                    item.user_id === authUser.user_id ? 'my_mess' : 'user_mess'
                  "
                >
                  <p
                    v-if="item.user_id !== authUser.user_id"
                    class="font-medium mb-0.5 text-corp"
                  >
                    {{ item.userInfo.first_name }}
                  </p>
                  <p class="mb-0.5">{{ item.message }}</p>
                  <div class="flex justify-end">
                    <span class="mb-0 text-xs">{{ item.time }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex mt-5">
          <div
            class="form-group-border active w-full !border-r-0 !rounded-tr-none !rounded-br-none"
          >
            <i class="pi pi-envelope"></i>
            <input v-model="message" type="text" placeholder=" " />
            <label>{{ $t("message") }}</label>
          </div>
          <button
            @click="sendMessage"
            class="btn btn-square btn-success !h-auto !w-12 !rounded-tl-none !rounded-bl-none"
          >
            <i class="pi pi-send"></i>
          </button>
        </div>
      </template>
    </modal>

    <modal
      :show="materialsModalIsVisible"
      :showLoader="false"
      :onClose="() => (materialsModalIsVisible = false)"
      :className="'modal-2xl'"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h5>{{ $t("materials.title") }}</h5>
      </template>
      <template
        v-slot:body_content
        v-if="
          conference && conference.materials && conference.materials.length > 0
        "
      >
        <ul class="list-group nowrap lg overflow-hidden">
          <li
            v-for="material in conference.materials"
            :key="material.lesson_material_id"
          >
            <div class="flex items-center justify-between gap-4">
              <div
                class="flex gap-2 items-center link w-full"
                @click="openMaterial(material)"
              >
                <i
                  class="text-3xl text-active"
                  :class="material.file_icon || material.block_icon"
                ></i>
                <div class="flex flex-col gap-y-0.5">
                  <span class="font-bold text-active">{{ material.annotation }}</span>
                  <span class="text-inactive text-xs">{{
                    material.file_material_type_name ||
                    material.block_material_type_name
                  }}</span>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </template>
    </modal>

    <modal
      :show="materialModalIsVisible"
      :onClose="() => closeMaterialModal(true)"
      :className="
        currentMaterial && currentMaterial.block_material_type_slug
          ? 'modal-4xl'
          : 'modal-lg'
      "
      :showLoader="false"
      :closeOnClickSelf="false"
    >
      <template v-if="currentMaterial" v-slot:header_content>
        <h5>{{ currentMaterial?.annotation }}</h5>
      </template>
      <template v-if="currentMaterial" v-slot:body_content>
        <div
          class="custom-grid"
          v-if="currentMaterial && currentMaterial?.lesson_material_id"
        >
          <div
            v-if="conference.mentor_id === authUser.user_id"
            class="col-span-12"
          >
            <div class="btn-wrap">
              <button
                class="btn btn-outline-success"
                :class="currentMaterial.is_show === true ? 'disabled' : ''"
                @click="showMaterialForLearners()"
                :title="
                  currentMaterial.is_show === true
                    ? $t('materials.displayed_title')
                    : $t('materials.display_title')
                "
              >
                <i class="pi pi-eye"></i>
                {{
                  currentMaterial.is_show === true
                    ? $t("materials.displayed")
                    : $t("materials.display")
                }}
              </button>
            </div>
          </div>
          <div class="col-span-12">
            <materialViewer :material="currentMaterial" />
          </div>
        </div>
      </template>
    </modal>

    <modal
      :show="tasksModalIsVisible"
      :showLoader="pendingTasks"
      :onClose="() => (tasksModalIsVisible = false)"
      :className="
        conference.mentor_id !== authUser.user_id && conference.is_member
          ? 'modal-6xl'
          : 'modal-xl'
      "
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h5>{{ $t("pages.tasks.title") }}</h5>
      </template>
      <template v-slot:body_content v-if="conference">
        <div class="custom-grid">
          <div
            class="col-span-12 lg:col-span-4"
            v-if="
              conference.mentor_id !== authUser.user_id && conference.is_member
            "
          >
            <stickyBox>
              <div class="card p-3">
                <div class="flex justify-between items-center gap-x-2 mb-4">
                  <h2 class="mb-2">{{ conference.lesson_name }}</h2>
                  <circleProgressBar
                    :progress="completedTasksPercent / tasks.length"
                  />
                </div>
                <div class="flex flex-wrap justify-between mb-1">
                  <span> {{ $t("pages.tasks.count") }}: </span>
                  <b>{{ tasks.length }}</b>
                </div>

                <div class="flex flex-wrap justify-between">
                  <span> {{ $t("passed") }}: </span>
                  <b>{{ completedTasksCount }}</b>
                </div>

                <div class="btn-wrap justify-end">
                  <button
                    v-if="
                      conference.lesson_type_slug === 'file_test' &&
                      completedTasksCount < tasks.length
                    "
                    class="btn btn-outline-primary mt-4"
                    @click="startTheTest()"
                  >
                    <i class="pi pi-arrow-right"></i>
                    {{
                      completedTasksCount > 0
                        ? $t("pages.tasks.continue_the_test")
                        : $t("pages.tasks.start_the_test")
                    }}
                  </button>
                </div>
              </div>
            </stickyBox>
          </div>

          <div
            class="col-span-12"
            :class="
              conference.mentor_id !== authUser.user_id && conference.is_member
                ? 'lg:col-span-8'
                : ''
            "
          >
            <button
              v-if="
                conference.mentor_id === authUser.user_id &&
                conference.lesson_type_slug === 'file_test'
              "
              class="btn full mb-4"
              :class="
                testIsStarted
                  ? 'disabled btn-outline-success'
                  : 'btn-outline-primary'
              "
              @click="startTheTest()"
            >
              <i
                class="pi"
                :class="testIsStarted === true ? 'pi-arrow-right' : 'pi-check'"
              ></i>
              {{
                testIsStarted === true
                  ? $t("pages.tasks.test_is_started")
                  : $t("pages.tasks.start_the_test")
              }}
            </button>

            <ul class="list-group nowrap lg overflow-hidden">
              <li v-for="taskItem in tasks" :key="taskItem.task_id">
                <div class="flex items-center justify-between gap-4">
                  <div
                    class="flex gap-2 items-center w-full"
                    :class="(!taskItem.launched && conference.mentor_id !== authUser.user_id) ? 'cursor-not-allowed' : 'cursor-pointer'"
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
                        v-if="conference.lesson_type_slug !== 'file_test'"
                        class="italic text-xs"
                        :class="
                          taskItem.launched ||
                          (taskItem.task_result &&
                            taskItem.task_result.completed)
                            ? 'text-success'
                            : 'text-danger'
                        "
                      >
                        {{
                          taskItem.launched
                            ? conference.mentor_id === authUser.user_id
                              ? $t("pages.tasks.launched")
                              : taskItem.task_result.completed === false
                              ? $t("pages.tasks.is_available")
                              : $t("pages.tasks.is_completed")
                            : conference.mentor_id === authUser.user_id
                            ? $t("pages.tasks.not_launched")
                            : taskItem.task_result.completed === false
                            ? $t("pages.tasks.is_unavailable")
                            : $t("pages.tasks.is_completed")
                        }}</span
                      >
                    </div>
                  </div>

                  <circleProgressBar
                    v-if="
                      conference.mentor_id !== authUser.user_id &&
                      taskItem.task_result &&
                      taskItem.task_result.completed === true
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
                          taskItem.completed_learners_tasks > 0 &&
                          'text-success'
                        "
                        >{{ taskItem.completed_learners_tasks }}</span
                      >
                      / {{ taskItem.learners.length }}</span
                    >
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </modal>

    <modal
      :show="taskModalIsVisible"
      :onClose="() => closeTaskModal()"
      :className="taskModalClass + ' min-h-0'"
      :showLoader="pendingTaskModal"
      :showPendingText="true"
      :loaderOpacityFull="true"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h5>{{ task ? task.task_slug : $t("pages.tasks.adding_a_task") }}</h5>
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
        <h5>{{ task.task_slug }}</h5>
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
        <h5>{{ task.task_slug }}</h5>
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
                  :title="
                    learner.task_result.completed === true
                      ? $t('pages.tasks.show_learner_task_result')
                      : $t('pages.tasks.you_can_see_the_result')
                  "
                >
                  <div class="flex items-center gap-1.5">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-9 h-9 text-sm'"
                      :user="learner"
                    />
                    <div class="flex flex-col">
                      <div>
                        <span class="font-medium"
                          >{{ learner.last_name }}
                          {{ learner.first_name }}
                        </span>
                        <span
                          :class="
                            streams.find((u) => u.user_id === learner.user_id)
                              ? 'text-success'
                              : 'text-danger'
                          "
                        >
                          ({{
                            streams.find((u) => u.user_id === learner.user_id)
                              ? $t("online")
                              : $t("offline")
                          }})
                        </span>
                      </div>
                      <span
                        :class="
                          learner.task_result.completed === true
                            ? 'text-success'
                            : busyLearners.some(
                                (t) =>
                                  t.taskId === task.task_id &&
                                  t.userId === learner.user_id
                              )
                            ? 'text-warning'
                            : 'text-danger'
                        "
                        class="text-xs"
                        >{{
                          learner.task_result.completed === true
                            ? $t("pages.tasks.is_completed")
                            : busyLearners.some(
                                (t) =>
                                  t.taskId === task.task_id &&
                                  t.userId === learner.user_id
                              )
                            ? $t("pages.tasks.in_process_this")
                            : $t("pages.tasks.not_been_completed_yet")
                        }}</span
                      >
                    </div>
                  </div>

                  <circleProgressBar
                    v-if="
                      learner.task_result &&
                      learner.task_result.completed === true
                    "
                    :progress="learner.task_result.percentage"
                  />
                </div>
              </li>
            </ul>
          </div>
          <div
            v-if="conference.lesson_type_slug !== 'file_test'"
            class="col-span-12"
          >
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
        <h5>{{ task.task_slug }}</h5>
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
import materialViewer from "../../../components/lesson/components/materialViewer.vue";
import stickyBox from "../../../components/ui/stickyBox.vue";

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

const offlineMembers = computed(() => {
  if (!conference.value) return []; // пока members не загружен — возвращаем пустой массив
  const onlineIds = new Set(streams.value.map((s) => s.user_id));
  return conference.value.members.filter((m) => !onlineIds.has(m.user_id));
});

const errorMessage = ref(null);
const pendingConference = ref(null);
const endedConference = ref(null);
const isMuted = ref(false); // Состояние микрофона
const volume = ref(0);
const isStream = ref(false); // Состояние видео
const isScreenSharing = ref(false); // Состояние демонстрации экрана

const message = ref("");
const messages = ref([]);
const unReadMessages = ref(0);

//Modals
const participantsModalIsVisible = ref(false);
const drawingBoardModalIsVisible = ref(false);
const messagesModalIsVisible = ref(false);
const materialsModalIsVisible = ref(false);
const materialModalIsVisible = ref(false);

const currentMaterial = ref(null);

const task = ref(null);
const tasks = ref([]);
const completedTasksCount = ref(0);
const completedTasksPercent = ref(0);
const taskInProgress = ref(false);
const tasksToComplete = ref(0);
const taskModalIsVisible = ref(false);
const tasksModalIsVisible = ref(false);
const taskResultModalIsVisible = ref(false);
const learnersTasksModalIsVisible = ref(false);
const learnerTaskResultModalIsVisible = ref(false);

const busyLearners = ref([]);

const taskModalClass = ref("modal-lg");
const taskModalProps = ref({});
const currentTaskModal = shallowRef(null);

const pendingTasks = ref(false);
const pendingTaskModal = ref(false);
const pendingLearnersTasksResult = ref(false);
const currentLearner = ref(null);

const testIsStarted = ref(false);

useHead({
  title: pageTitle,
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const openMaterial = (material) => {
  closeAllModals();
  currentMaterial.value = null;
  setTimeout(() => {
    currentMaterial.value = material;
    materialsModalIsVisible.value = false;
    materialModalIsVisible.value = true;
  }, 200);
};

const closeMaterialModal = (showMaterialsModal) => {
  if (currentMaterial.value) {
    currentMaterial.value.is_show = false;
    currentMaterial.value = null;
    setTimeout(() => {
      materialModalIsVisible.value = false;
      materialsModalIsVisible.value = showMaterialsModal;
    }, 100);
  }
};

const showMaterialForLearners = () => {
  if (busyLearners.value.length > 0) {
    toast(t("pages.tasks.warning_1"), {
      toastClassName: ["custom-toast", "danger"],
      timeout: 10000,
    });
  } else {
    if (currentMaterial.value.is_show === false) {
      currentMaterial.value.is_show = true;
      $socketPlugin.emit("open_material", {
        materialId: currentMaterial.value.lesson_material_id,
      });
    }
  }
};

const onPending = (state) => {
  pendingTaskModal.value = state;
};

const changeModalSize = (size) => {
  taskModalClass.value = size;
};

const onStartTask = () => {
  taskInProgress.value = true;

  $socketPlugin.emit("start_task", {
    userId: authUser.value.user_id,
    userInfo: authUserInfo,
    taskId: task.value.task_id,
    taskName: task.value.task_slug,
  });
};

const onCompleteTask = () => {
  taskInProgress.value = false;
  $socketPlugin.emit("complete_task", {
    userId: authUser.value.user_id,
    userInfo: authUserInfo,
    taskId: task.value.task_id,
    taskName: task.value.task_slug,
  });
  getConferenceTasks();
};

const openTask = (currentTask) => {
  closeAllModals();

  task.value = currentTask;
  taskModalIsVisible.value = true;

  currentTaskModal.value = defineAsyncComponent(() =>
    import(
      `../../../components/lesson/components/tasks/actions/execution/${task.value.task_type_component}.vue`
    )
  );

  taskModalProps.value = {
    task: currentTask,
    lessonType: conference.value.lesson_type_slug,
  };
};

const startTheTest = () => {
  if (conference.value.mentor_id === authUser.value.user_id) {
    $socketPlugin.emit("start_test");
    testIsStarted.value = true;

    toast(t("pages.tasks.test_is_started_for_learners"), {
      toastClassName: ["custom-toast", "success"],
      timeout: 10000,
    });
  } else {
    for (let index = 0; index < tasks.value.length; index++) {
      const task = tasks.value[index];
      if (task.task_result && !task.task_result.answers) {
        openTask(task);
        break;
      }
    }
  }
};

const closeAllModals = () => {
  closeMaterialModal(false);

  tasksModalIsVisible.value = false;
  taskResultModalIsVisible.value = false;

  learnersTasksModalIsVisible.value = false;
  learnerTaskResultModalIsVisible.value = false;
  materialsModalIsVisible.value = false;

  participantsModalIsVisible.value = false;
  drawingBoardModalIsVisible.value = false;
  messagesModalIsVisible.value = false;
};

const closeTaskModal = async () => {
  if (task.value) {
    await $socketPlugin.emit("close_task", {
      userId: authUser.value.user_id,
      userInfo: authUserInfo,
      taskId: task.value.task_id,
      taskName: task.value.task_slug,
    });
  }

  taskInProgress.value = false;
  taskModalIsVisible.value = false;
  tasksModalIsVisible.value = true;
  pendingTaskModal.value = false;
  currentTaskModal.value = null;
  taskModalProps.value = null;
  task.value = null;
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

provide("onPending", onPending);
provide("onStartTask", onStartTask);
provide("onCompleteTask", onCompleteTask);
provide("changeModalSize", changeModalSize);

provide("tasks", tasks);
provide("completedTasksCount", completedTasksCount);
provide("openTask", openTask);

const showTaskForLearners = async () => {
  pendingLearnersTasksResult.value = true;
  await $axiosPlugin
    .post(
      "conferences/run_task/" + conference.value.uuid + "/" + task.value.task_id
    )
    .then((response) => {
      getConferenceTasks();
      $socketPlugin.emit("open_task", {
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
      } else if (response.data.type === "ended") {
        endedConference.value = response.data;
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
  tasksToComplete.value = 0;
  completedTasksCount.value = 0;
  completedTasksPercent.value = 0;

  try {
    const response = await $axiosPlugin.get(
      "conferences/get_conference_tasks/" + conference.value.uuid
    );
    tasks.value = response.data;

    if (task.value !== null) {
      task.value = tasks.value.find((t) => t.task_id === task.value.task_id);
    }

    for (let taskIndex = 0; taskIndex < tasks.value.length; taskIndex++) {
      const task = tasks.value[taskIndex];
      task.taskIndex = taskIndex;

      if (task.to_complete) {
        tasksToComplete.value++;
      }

      if (task.task_result && task.task_result.completed === true) {
        completedTasksCount.value++;
        completedTasksPercent.value += task.task_result.percentage;
      }
    }

    pendingTasks.value = false;
    pendingLearnersTasksResult.value = false;
  } catch (err) {
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
  }
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
      config: {
        iceServers: [
          { urls: config.public.stunURL },
          {
            urls: config.public.turnURL,
            username: config.public.turnUSERNAME,
            credential: config.public.turnPASSWORD,
          },
        ],
      },
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

      //trackMicrophone(localStream.value);
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

      call.on("close", () => {
        delete peers[call.peer];
      });

      call.on("error", (error) => {
        errorMessage.value = {
          message: error.message,
          pending: false,
        };

        delete peers[call.peer];
      });

      peers[call.peer] = call;
    });

    $socketPlugin.off("user-connected");

    $socketPlugin.on("user-connected", (connectedUserInfo) => {
      toast(connectedUserInfo.first_name + " " + t("online").toLowerCase(), {
        toastClassName: ["custom-toast", "info"],
        timeout: 10000,
      });
    });

    $socketPlugin.on("user-disconnected", (peerId) => {
      removeStream(peerId);
    });

    $socketPlugin.on("new-message", (data) => {
      messages.value.push(data);
      if (messagesModalIsVisible.value === false) {
        unReadMessages.value++;
      }
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

    $socketPlugin.on("open_material", (data) => {
      if (authUser.value.user_id !== conference.value.mentor_id) {
        const selectedMaterial = conference.value.materials.find(
          (m) => m.lesson_material_id === data.materialId
        );

        if (selectedMaterial && taskInProgress.value === false) {
          openMaterial(selectedMaterial);
        }
      }
    });

    $socketPlugin.on("open_task", async (data) => {
      if (authUser.value.user_id !== conference.value.mentor_id) {
        if (conference.value.is_member) {
          await getConferenceTasks(); // теперь это точно будет дожидаться полной загрузки

          const selectedTask = tasks.value.find(
            (t) => t.task_id === data.taskId
          );

          if (selectedTask && !selectedTask?.task_result?.answers) {
            if (taskInProgress.value === true) {
              toast(
                t("pages.tasks.new_task_is_available", {
                  taskName: selectedTask.task_slug,
                }),
                {
                  toastClassName: ["custom-toast", "info"],
                  timeout: 10000,
                }
              );
            } else {
              openTask(selectedTask);
            }
          }
        } else {
          toast(t("pages.tasks.allowed_only_participants"), {
            toastClassName: ["custom-toast", "danger"],
            timeout: 10000,
          });
        }
      }
    });

    $socketPlugin.on("close_task", (data) => {
      if (authUser.value.user_id === conference.value.mentor_id) {
        busyLearners.value = busyLearners.value.filter(
          (l) => l.userId !== data.userId
        );
      }
    });

    $socketPlugin.on("start_task", (data) => {
      if (authUser.value.user_id === conference.value.mentor_id) {
        busyLearners.value.push(data);
      }
    });

    $socketPlugin.on("complete_task", (data) => {
      if (authUser.value.user_id === conference.value.mentor_id) {
        getConferenceTasks();

        busyLearners.value = busyLearners.value.filter(
          (l) => l.userId !== data.userId
        );

        toast(
          t("pages.tasks.completed_the_task", {
            name: data.userInfo.last_name + " " + data.userInfo.first_name,
            taskName: data.taskName,
          }),
          {
            toastClassName: ["custom-toast", "success"],
            timeout: 10000,
          }
        );
      }
    });

    $socketPlugin.on("start_test", () => {
      if (authUser.value.user_id !== conference.value.mentor_id) {
        if (conference.value.is_member) {
          startTheTest();
        } else {
          toast(t("pages.tasks.allowed_only_participants"), {
            toastClassName: ["custom-toast", "danger"],
            timeout: 10000,
          });
        }
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

              outgoingCall.on("close", () => {
                delete peers[outgoingCall.peer];
              });

              outgoingCall.on("error", (error) => {
                errorMessage.value = {
                  message: error.message,
                  pending: false,
                };

                delete peers[outgoingCall.peer];
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

    if (
      taskInProgress.value === true &&
      conference.value.mentor_id === user_id
    ) {
      $socketPlugin.emit("start_task", {
        userId: authUser.value.user_id,
        userInfo: authUserInfo,
        taskId: task.value.task_id,
        taskName: task.value.task_slug,
      });
    }
  }
};

const stopLocalStream = async () => {
  $socketPlugin.off("user-connected");
  $socketPlugin.off("user-disconnected");
  $socketPlugin.off("new-message");
  $socketPlugin.off("toggle-video");
  $socketPlugin.off("toggle-audio");
  $socketPlugin.off("update-volume");
  $socketPlugin.off("connect_error");
  $socketPlugin.off("open_material");
  $socketPlugin.off("open_task");
  $socketPlugin.off("close_task");
  $socketPlugin.off("start_task");
  $socketPlugin.off("complete_task");
  $socketPlugin.off("show_material");
  $socketPlugin.off("start_test");

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

    if (authUser.value.user_id === conference.value.mentor_id) {
      busyLearners.value = busyLearners.value.filter(
        (l) => l.userId !== streamToRemove.user_id
      );
    }

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
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    const messageData = {
      user_id: authUser.value.user_id,
      userInfo: authUserInfo,
      message: message.value,
      time: `${hours}:${minutes}`,
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
