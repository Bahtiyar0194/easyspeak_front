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
      <div class="col-span-12 relative z-10">
        <div class="btn-wrap justify-end">
          <button
            v-for="(mode, modeIndex) in confModes"
            :key="modeIndex"
            type="button"
            class="btn btn-square"
            :class="
              confMode === mode.name ? 'btn-outline-primary' : 'btn-light'
            "
            @click="setConferenceMode(mode.name)"
          >
            <i :class="mode.icon"></i>
          </button>
        </div>
      </div>
      <div class="col-span-12">
        <video
          ref="rawVideoRef"
          class="hidden"
          autoplay
          muted
          playsinline
        ></video>
        <canvas
          ref="canvasRef"
          class="fixed -top-[9999px] -left-[9999px] pointer-events-none"
        ></canvas>
        <img
          ref="bgImageRef"
          :src="`/images/conference/${currentBgImage}.png`"
          class="hidden"
          alt="Virtual Background"
          @load="onBgImageLoad"
        />

        <gridMode
          v-if="confMode === 'grid'"
          :streams="streams"
          :peersStats="peersStats"
          :reflected="isVideoReflected"
        />
        <sliderMode
          v-else-if="confMode === 'slider'"
          :streams="streams"
          :peersStats="peersStats"
          :reflected="isVideoReflected"
          :mentorId="conference.mentor_id"
        />
      </div>

      <div v-if="authUser" class="db__footer__menu">
        <dropdownMenu
          :dropdownArrow="false"
          :dropdownUp="true"
          :position="'left'"
        >
          <template v-slot:btn_content>
            <button
              :title="
                isMuted
                  ? $t('pages.conference.mic_turn_on')
                  : $t('pages.conference.mic_turn_off')
              "
            >
              <i v-if="isMuted" class="bi bi-mic-mute text-danger"></i>
              <div v-else>
                <i v-if="myStream?.speaking" class="bi bi-mic-fill text-success"></i>
                <i v-else class="bi bi-mic text-success"></i>
              </div>

              <span :class="isMuted ? 'text-danger' : 'text-success'">{{
                $t("pages.conference.mic")
              }}</span>
            </button>
          </template>

          <template v-slot:menu_content>
            <li>
              <div class="flex gap-x-2 items-center my-1">
                <label class="ios-switch">
                  <input
                    type="checkbox"
                    :checked="!isMuted"
                    @change="toggleMute()"
                  />
                  <span class="slider"></span>
                </label>

                <p class="mb-0">
                  {{
                    isMuted
                      ? $t("pages.conference.mic_turned_off")
                      : $t("pages.conference.mic_turned_on")
                  }}
                </p>
              </div>
            </li>
            <li v-if="microphones.length > 1">
              <div class="flex flex-col gap-y-2">
                <p class="text-inactive text-xs mb-0">
                  {{ $t("pages.conference.mic") }}:
                </p>
                <label
                  v-for="mic in microphones"
                  :key="mic.deviceId"
                  class="custom-radio"
                >
                  <input
                    type="radio"
                    :value="mic.deviceId"
                    :checked="selectedMicrophoneId === mic.deviceId"
                    @change="switchMicrophone(mic.deviceId)"
                    name="microphone"
                  />
                  <span> {{ mic.label }}</span>
                </label>
              </div>
            </li>
          </template>
        </dropdownMenu>

        <dropdownMenu
          :dropdownArrow="false"
          :dropdownUp="true"
          :position="'left'"
        >
          <template v-slot:btn_content>
            <button
              :title="
                isStream
                  ? $t('pages.conference.video_turned_on')
                  : $t('pages.conference.video_turned_off')
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
          </template>

          <template v-slot:menu_content>
            <li>
              <div class="flex flex-col gap-2">
                <template v-if="isStream && effects.length">
                  <div class="flex flex-col gap-3">
                    <p class="mb-0">
                      {{ $t("pages.conference.effects.title") }}:
                    </p>
                    <div class="btn-group">
                      <button
                        v-for="(effect, effectIndex) in effects"
                        :key="effectIndex"
                        @click="switchBackgroundMode(effect.name)"
                        class="btn btn-sm"
                        :class="
                          bgMode === effect.name
                            ? 'btn-primary pointer-events-none !text-white'
                            : 'btn-light'
                        "
                      >
                        <i :class="effect.icon"></i>
                        {{
                          $t("pages.conference.effects.items." + effect.name)
                        }}
                      </button>
                    </div>

                    <template v-if="bgMode === 'image'">
                      <p class="mb-0">
                        {{ $t("pages.conference.effects.images.title") }}:
                      </p>

                      <div class="custom-grid !grid-cols-3">
                        <div
                          v-for="(image, imageIndex) in effects[2].images"
                          :key="imageIndex"
                          @click="selectConferenceBackgroundImage(image)"
                          class="w-20 h-12 rounded-lg bg-cover bg-center flex justify-center items-center cursor-pointer relative overflow-hidden !border-2"
                          :class="
                            image === currentBgImage
                              ? 'border-success'
                              : 'border-inactive'
                          "
                          :style="{
                            backgroundImage: `url('/images/conference/${image}.png')`,
                          }"
                        >
                          <div
                            class="absolute py-1 px-1.5 bg-black bg-opacity-50 z-10 text-white text-center text-xs left-0 right-0 bottom-0 top-0 flex items-center justify-center"
                          >
                            <b>{{
                              $t(
                                "pages.conference.effects.images.items." +
                                  image,
                              )
                            }}</b>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </template>
                <div v-if="isStream" class="flex gap-x-2 items-center my-1">
                  <label class="ios-switch">
                    <input
                      type="checkbox"
                      :checked="isVideoReflected"
                      @change="reflectVideo()"
                    />
                    <span class="slider"></span>
                  </label>

                  <p class="mb-0">
                    {{
                      isVideoReflected
                        ? $t("pages.conference.video_reflected")
                        : $t("pages.conference.reflect_video")
                    }}
                  </p>
                </div>
                <div class="flex gap-x-2 items-center my-1">
                  <label class="ios-switch">
                    <input
                      type="checkbox"
                      :checked="isStream"
                      @change="toggleStream()"
                    />
                    <span class="slider"></span>
                  </label>

                  <p class="mb-0">
                    {{
                      isStream
                        ? $t("pages.conference.video_turned_on")
                        : $t("pages.conference.video_turned_off")
                    }}
                  </p>
                </div>
              </div>
            </li>
          </template>
        </dropdownMenu>

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

        <button
          v-if="tasks.length > 0 || schoolStore.isAiSchoolDomain"
          @click="tasksModalIsVisible = true"
        >
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

    <template v-if="authUser">
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
                  <div
                    class="flex flex-wrap items-center justify-between gap-1"
                  >
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
                            busyLearners.some(
                              (l) => l.userId === stream.user_id,
                            )
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
          <div
            v-if="messages.length > 0"
            class="max-h-[300px] overflow-y-scroll"
          >
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
                      item.user_id === authUser.user_id
                        ? 'my_mess'
                        : 'user_mess'
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
            conference &&
            conference.materials &&
            conference.materials.length > 0
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
                    <span class="font-bold text-active">{{
                      material.annotation
                    }}</span>
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
            ? 'modal-full'
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
              <materialViewer
                :material="currentMaterial"
                :showChat="
                  currentMaterial && currentMaterial.block_material_type_slug
                    ? true
                    : false
                "
              />
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
            <template v-if="tasks.length">
              <div
                class="col-span-12 lg:col-span-4"
                v-if="
                  conference.mentor_id !== authUser.user_id &&
                  conference.is_member
                "
              >
                <stickyBox>
                  <div class="card p-3">
                    <div class="flex justify-between items-center gap-x-2 mb-4">
                      <h2 class="mb-2">
                        {{ conference.lesson_name || conference.topic }}
                      </h2>
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

                    <div v-if="tasks.length" class="btn-wrap justify-end">
                      <button
                        v-if="
                          conference.lesson_type_slug === 'file_test' &&
                          completedTasksCount < tasks.length
                        "
                        class="btn btn-primary mt-4"
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
                  conference.mentor_id !== authUser.user_id &&
                  conference.is_member
                    ? 'lg:col-span-8'
                    : ''
                "
              >
                <div class="custom-grid">
                  <div class="col-span-12">
                    <ul
                      class="list-group sm overflow-hidden"
                      :class="
                        conference.mentor_id === authUser.user_id
                          ? 'nowrap'
                          : ''
                      "
                    >
                      <li v-for="taskItem in tasks" :key="taskItem.task_id">
                        <div class="flex items-center justify-between gap-4">
                          <div
                            class="flex gap-2 items-center w-full"
                            :class="
                              !taskItem.launched &&
                              conference.mentor_id !== authUser.user_id
                                ? 'cursor-not-allowed'
                                : 'cursor-pointer'
                            "
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
                              <span class="font-medium">{{
                                taskItem.task_slug
                              }}</span>
                              <span class="text-inactive text-xs">{{
                                taskItem.task_type_name
                              }}</span>

                              <span
                                v-if="
                                  conference.lesson_type_slug !== 'file_test'
                                "
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
                                      ? $t("pages.tasks.launched.title")
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
                  <div class="col-span-12">
                    <div class="btn-wrap justify-end">
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
                          :class="
                            testIsStarted === true
                              ? 'pi-arrow-right'
                              : 'pi-check'
                          "
                        ></i>
                        {{
                          testIsStarted === true
                            ? $t("pages.tasks.test_is_started")
                            : $t("pages.tasks.start_the_test")
                        }}
                      </button>

                      <button
                        @click="openSelectTasksModal()"
                        v-if="
                          schoolStore.isAiSchoolDomain &&
                          conference.mentor_id === authUser.user_id
                        "
                        class="btn btn-success"
                      >
                        <i class="pi pi-play"></i>
                        {{ $t("pages.tasks.start_an_other_task") }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <div v-else class="col-span-12">
              <div class="flex flex-col gap-4 justify-center items-center">
                <p class="mb-0 text-center">
                  {{
                    conference.mentor_id === authUser.user_id
                      ? $t("pages.tasks.not_started.mentor")
                      : $t("pages.tasks.not_started.learner")
                  }}
                </p>
                <button
                  @click="openSelectTasksModal()"
                  v-if="conference.mentor_id === authUser.user_id"
                  class="btn btn-success"
                >
                  <i class="pi pi-play"></i>
                  {{ $t("pages.tasks.select_a_task") }}
                </button>
              </div>
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
              <ul
                v-if="task && task.learners && task.learners.length"
                class="list-group nowrap"
              >
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
                                      t.userId === learner.user_id,
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
                                      t.userId === learner.user_id,
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

              <p class="mb-0 font-medium" v-else>
                {{ $t("pages.tasks.not_completed.learner") }}
              </p>
            </div>
            <template v-if="!schoolStore.isAiSchoolDomain">
              <div
                v-if="conference.lesson_type_slug !== 'file_test'"
                class="col-span-12"
              >
                <div class="btn-wrap">
                  <button
                    class="btn btn-success"
                    :class="task.launched ? 'disabled' : ''"
                    @click="showTaskForLearners()"
                  >
                    <i class="pi pi-play"></i>
                    {{
                      task.launched
                        ? $t("pages.tasks.launched.learner")
                        : $t("pages.tasks.run.learner")
                    }}
                  </button>

                  <button
                    v-if="authUser.user_id === conference.mentor_id"
                    class="btn btn-success"
                    @click="openTask(task)"
                  >
                    <i class="pi pi-play"></i>
                    {{ $t("pages.tasks.run.self") }}
                  </button>
                </div>
              </div>
            </template>
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
                    <p class="text-inactive text-xs mb-0">
                      {{ $t("learner") }}:
                    </p>
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

      <modal
        :show="leaveModalIsVisible"
        :onClose="() => cancelLeave()"
        :className="'modal-lg'"
        :showLoader="false"
        :closeOnClickSelf="true"
      >
        <template v-slot:header_content>
          <h5>{{ $t("pages.conference.leave.title") }}</h5>
        </template>
        <template v-slot:body_content>
          <p>{{ $t("pages.conference.leave.confirm") }}</p>
          <div class="btn-wrap justify-end mt-8">
            <button @click="proceedLeave()" class="btn btn-danger">
              <i class="pi pi-sign-out"></i>
              {{ $t("pages.conference.leave.yes") }}
            </button>
            <button @click="cancelLeave()" class="btn btn-light">
              <i class="pi pi-sign-in"></i>
              {{ $t("pages.conference.leave.no") }}
            </button>
          </div>
        </template>
      </modal>

      <modal
        :show="selectTasksModalIsVisible"
        :onClose="() => closeSelectTasksModal(true)"
        :className="tasksSelectionModalClass"
        :showLoader="pendingTasksSelection"
        :closeOnClickSelf="false"
      >
        <template v-slot:header_content>
          <h5>{{ $t("pages.tasks.select_a_task_alt") }}</h5>
        </template>
        <template v-slot:body_content>
          <div v-if="levels.length" class="custom-grid">
            <div class="col-span-12">
              <ul class="breadcrumb">
                <li>
                  <button
                    @click="goToLevels()"
                    :class="
                      activeLevel || activeSection || activeLesson
                        ? ''
                        : 'inactive'
                    "
                  >
                    <span>{{ $t("pages.courses.title") }}</span>
                  </button>
                </li>
                <li v-if="activeLevel">
                  <button
                    @click="goToSections()"
                    :class="!activeSection ? 'inactive' : ''"
                  >
                    <span>{{ activeLevel.level_name }}</span>
                  </button>
                </li>
                <li v-if="activeSection">
                  <button
                    @click="goToLessons()"
                    :class="!activeLesson ? 'inactive' : ''"
                  >
                    <span>{{ activeSection.section_name }}</span>
                  </button>
                </li>
                <li v-if="activeLesson">
                  <span>{{ activeLesson.lesson_name }}</span>
                </li>
              </ul>
            </div>
            <div class="col-span-12">
              <div class="custom-grid">
                <template v-if="activeLesson">
                  <div class="col-span-12">
                    <button class="btn btn-light" @click="goToLessons()">
                      <i class="pi pi-arrow-left"></i>
                      {{ $t("back") }}
                    </button>
                  </div>

                  <div class="col-span-12">
                    <h3 class="mb-2">{{ activeLesson.lesson_name }}</h3>
                    <div class="flex flex-wrap gap-1 mb-1">
                      <span> {{ $t("pages.tasks.count") }}: </span>
                      <b>{{ activeLesson.tasks.length }}</b>
                    </div>
                  </div>

                  <div class="col-span-12">
                    <ul class="list-group nowrap">
                      <li
                        v-for="taskItem in activeLesson.tasks"
                        :key="taskItem.task_id"
                      >
                        <div
                          class="w-full flex flex-wrap justify-between items-center gap-4"
                        >
                          <div class="flex gap-2 items-center">
                            <i class="text-4xl" :class="taskItem.icon"></i>
                            <div class="flex flex-col gap-y-0.5">
                              <span class="font-medium text-left">{{
                                taskItem.task_slug
                              }}</span>
                              <span class="text-inactive text-xs text-left">{{
                                taskItem.task_type_name
                              }}</span>
                            </div>
                          </div>

                          <div class="btn-wrap">
                            <button
                              class="btn btn-sm text-nowrap"
                              @click="showTaskForLearners(taskItem.task_id)"
                              :class="
                                tasks.find(
                                  (t) => t.task_id === taskItem.task_id,
                                )
                                  ? 'btn-outline-success disabled'
                                  : 'btn-success'
                              "
                            >
                              <i class="pi pi-play"></i>
                              {{
                                tasks.find(
                                  (t) => t.task_id === taskItem.task_id,
                                )
                                  ? $t("pages.tasks.launched.learner")
                                  : $t("pages.tasks.run.learner")
                              }}
                            </button>

                            <button
                              v-if="authUser.user_id === conference.mentor_id"
                              class="btn btn-sm btn-success text-nowrap"
                              @click="openTask(taskItem)"
                            >
                              <i class="pi pi-play"></i>
                              {{ $t("pages.tasks.run.self") }}
                            </button>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </template>
                <template v-else-if="activeSection">
                  <div class="col-span-12">
                    <button class="btn btn-light" @click="goToSections()">
                      <i class="pi pi-arrow-left"></i>
                      {{ $t("back") }}
                    </button>
                  </div>
                  <div class="col-span-12">
                    <ul class="list-group nowrap">
                      <li
                        v-for="(lesson, lessonIndex) in activeSection.lessons"
                        :key="lessonIndex"
                      >
                        <button class="w-full" @click="selectLesson(lesson)">
                          <div class="flex gap-2 justify-between items-center">
                            <div class="flex flex-col gap-y-1.5">
                              <p class="mb-0 leading-none font-bold text-left">
                                {{ lessonIndex + 1 }}. {{ lesson.lesson_name }}
                                <span class="text-inactive font-normal"
                                  >({{ lesson.lesson_type_name }})</span
                                >
                              </p>
                              <span class="text-xs text-left"
                                >{{ $t("pages.tasks.count") }}:
                                <b>{{ lesson.tasks.length }}</b></span
                              >
                            </div>
                          </div>
                        </button>
                      </li>
                    </ul>
                  </div>
                </template>
                <template v-else-if="activeLevel">
                  <div class="col-span-12">
                    <button class="btn btn-light" @click="goToLevels()">
                      <i class="pi pi-arrow-left"></i>
                      {{ $t("back") }}
                    </button>
                  </div>
                  <div class="col-span-12">
                    <ul class="list-group nowrap">
                      <li
                        v-for="(section, sectionIndex) in activeLevel.sections"
                        :key="sectionIndex"
                      >
                        <button class="w-full" @click="selectSection(section)">
                          <div class="flex gap-2 justify-between items-center">
                            <div class="flex flex-col gap-y-1.5">
                              <p class="mb-0 leading-none font-bold text-left">
                                {{ section.section_name }}
                              </p>
                              <span class="text-xs"
                                >{{ $t("pages.lessons.lessons_count") }}:
                                <b>{{ section.lessons.length }}</b></span
                              >
                            </div>
                          </div>
                        </button>
                      </li>
                    </ul>
                  </div>
                </template>
                <template v-else>
                  <div
                    v-for="(level, levelIndex) in levels"
                    :key="levelIndex"
                    class="col-span-12 md:col-span-4"
                  >
                    <button @click="selectLevel(level)">
                      <levelCard :level="level" :showProgressBar="false" />
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </template>
      </modal>
    </template>
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
import { useRoute, useRouter, onBeforeRouteLeave } from "nuxt/app";
import {
  ref,
  onMounted,
  onBeforeUnmount,
  provide,
  shallowRef,
} from "vue";
import { debounceHandler } from "~/utils/debounceHandler.js";
import { startNetworkMonitoring } from "~/composables/usePeerStats.js";
import { useToast } from "vue-toastification";
import Peer from "peerjs";
import { useRuntimeConfig } from "nuxt/app";
import SelfieSegmentationPkg from "@mediapipe/selfie_segmentation";
import gridMode from "~/components/conference/modes/gridMode.vue";
import sliderMode from "~/components/conference/modes/sliderMode.vue";
import drawingBoard from "~/components/conference/drawingBoard.vue";
import countBadge from "~/components/ui/countBadge.vue";
import modal from "~/components/ui/modal.vue";
import userAvatar from "~/components/ui/userAvatar.vue";
import countdownTimer from "~/components/ui/countdownTimer.vue";
import taskResultChart from "~/components/lesson/components/tasks/taskResultChart.vue";
import circleProgressBar from "~/components/ui/circleProgressBar.vue";
import materialViewer from "~/components/lesson/components/materialViewer.vue";
import stickyBox from "~/components/ui/stickyBox.vue";
import dropdownMenu from "~/components/ui/dropdownMenu.vue";
import alert from "~/components/ui/alert.vue";
import levelCard from "~/components/levels/levelCard.vue";

const router = useRouter();
const route = useRoute();
const pendingRoute = ref(null);
const conference_id = route.params.id;
const pageTitle = ref("");

const { t } = useI18n();
const config = useRuntimeConfig();
const toast = useToast();

// Тост в стиле приложения. type: "success" | "info" | "warning" | "danger"
const notify = (type, message, timeout = 10000) =>
  toast(message, { toastClassName: ["custom-toast", type], timeout });

// --- Тосты о проблемах со связью без спама ---
const TOAST_COOLDOWN_MS = 30000; // один и тот же тост — не чаще раза в 30 сек.
const ICE_TOAST_DELAY_MS = 3000; // короткие "disconnected" обычно проходят сами
const toastShownAt = {}; // ключ тоста -> время последнего показа

// Один и тот же тост (по ключу) — не чаще раза в cooldown мс
const showToastOnce = (
  key,
  type,
  message,
  timeout,
  cooldown = TOAST_COOLDOWN_MS,
) => {
  const now = Date.now();
  if (toastShownAt[key] && now - toastShownAt[key] < cooldown) return;
  toastShownAt[key] = now;
  notify(type, message, timeout);
};

// Кому показывать тосты о связи с собеседником: учитель видит проблемы любого
// ученика, ученики — только проблемы учителя (про других учеников им знать не нужно).
const shouldNotifyAboutPeer = (peerUserId) => {
  const mentorId = conference.value?.mentor_id;
  return authUser.value.user_id === mentorId || peerUserId === mentorId;
};

// Проблемы со связью у собеседника: показываем, только если соединение
// не восстановилось за ICE_TOAST_DELAY_MS. Во время нашего собственного
// переподключения молчим — уже показан тост "у вас проблемы со связью".
const notifyPeerConnectionIssue = (pc, peerId, name, peerUserId) => {
  if (!shouldNotifyAboutPeer(peerUserId)) return;

  setTimeout(() => {
    if (isReconnecting || isExplicitlyClosed) return;
    const state = pc.iceConnectionState;
    if (state !== "disconnected" && state !== "failed") return; // восстановилось

    if (state === "disconnected") {
      showToastOnce(
        `peer-network:${peerId}`,
        "warning",
        t("errors.server.other_user_network_error", { name }),
        5000,
      );
    }
  }, ICE_TOAST_DELAY_MS);
};

const notifyPeerDisconnected = (peerId, name, peerUserId) => {
  if (!shouldNotifyAboutPeer(peerUserId)) return;
  if (isReconnecting || isExplicitlyClosed) return;
  showToastOnce(
    `peer-disconnect:${peerId}`,
    "danger",
    t("errors.server.other_user_disconnect", { name }),
    10000,
  );
};
const { $axiosPlugin, $socketPlugin } = useNuxtApp();
const schoolStore = useSchoolStore();
const authUser = useSanctumUser();
const { refreshIdentity } = useSanctumAuth();
const { SelfieSegmentation } = SelfieSegmentationPkg;

const authUserInfo = {
  first_name: authUser.value.first_name,
  last_name: authUser.value.last_name,
  avatar: authUser.avatar,
};

let myPeer;
const peers = {};
let pingIntervalId = null;

let peerOpenedOnce = false;
let pendingRejoin = false;
let isRejoining = false;
const recallTimers = {};
const recallAttempts = {};
const MAX_RECALL_ATTEMPTS = 5;
let peerReconnectTimer = null;
let peerReconnectAttempts = 0;
let isReconnecting = false;
let hasJoinedRoom = false;
let lastPeerOpenAt = 0;
let healthCheckInProgress = false;
let healthCheckDebounce = null;

const conference = ref(null);

const confModes = [
  {
    name: "grid",
    icon: "bi bi-grid-3x2",
  },
  {
    name: "slider",
    icon: "bi bi-diagram-3",
  },
];

const confMode = ref(authUser.value.conf_mode);
const bgMode = ref(authUser.value.conf_bg_mode);
const isBgImageLoaded = ref(false);
const isVideoReflected = ref(authUser.value.video_reflected);

const effects = [
  {
    name: "none",
    icon: "bi bi-ban",
  },
  {
    name: "blur",
    icon: "bi bi-person-lines-fill",
  },
  {
    name: "image",
    icon: "bi bi-image",
    images: [
      "bubbles",
      "cafe",
      "city",
      "clouds",
      "night",
      "office",
      "palms",
      "retro",
      "sakura",
      "library",
      "cabinet",
      "flat",
    ],
  },
];

const currentBgImage = ref(authUser.value.conf_bg_image);

const onBgImageLoad = () => {
  isBgImageLoaded.value = true;
};

const rawVideoRef = ref(null);
const canvasRef = ref(null);
const bgImageRef = ref(null);

const localStream = ref(null);
const myStream = ref(null);
const rawStream = ref(null);
const screenStream = ref(null);
const streams = ref([]);

let isExplicitlyClosed = false;
let selfieSegmentation = null;
let animationFrameId = null;
let canvasStream = null;

const microphones = ref([]);
const selectedMicrophoneId = ref(null);

const offlineMembers = computed(() => {
  if (!conference.value) return [];
  const onlineIds = new Set(streams.value.map((s) => s.user_id));
  return conference.value.members.filter((m) => !onlineIds.has(m.user_id));
});

const errorMessage = ref(null);
const pendingConference = ref(null);
const endedConference = ref(null);
const isMuted = ref(false);
const isStream = ref(false);
const isScreenSharing = ref(false);
const peersStats = reactive({});
const activeMonitors = new Map();

const message = ref("");
const messages = ref([]);
const unReadMessages = ref(0);


const leaveModalIsVisible = ref(false);
const participantsModalIsVisible = ref(false);
const drawingBoardModalIsVisible = ref(false);
const messagesModalIsVisible = ref(false);
const materialsModalIsVisible = ref(false);
const materialModalIsVisible = ref(false);

const currentMaterial = ref(null);

const task = ref(null);
const tasks = ref([]);
const levels = ref([]);
const completedTasksCount = ref(0);
const completedTasksPercent = ref(0);
const taskInProgress = ref(false);
const tasksToComplete = ref(0);
const taskModalIsVisible = ref(false);
const tasksModalIsVisible = ref(false);
const taskResultModalIsVisible = ref(false);
const learnersTasksModalIsVisible = ref(false);
const learnerTaskResultModalIsVisible = ref(false);
const selectTasksModalIsVisible = ref(false);

const busyLearners = ref([]);

const taskModalClass = ref("modal-lg");
const taskModalProps = ref({});
const currentTaskModal = shallowRef(null);

const tasksSelectionModalDefaultClass = "modal-4xl";
const tasksSelectionModalClass = ref(tasksSelectionModalDefaultClass);

const pendingTasks = ref(false);
const pendingTaskModal = ref(false);
const pendingLearnersTasksResult = ref(false);
const pendingTasksSelection = ref(true);
const currentLearner = ref(null);

const testIsStarted = ref(false);

const activeLevel = ref(null);
const activeSection = ref(null);
const activeLesson = ref(null);

useHead({
  title: pageTitle,
  meta: [{ name: "description", content: t("pages.home.description") }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});


onBeforeRouteLeave((to, from, next) => {
  if (localStream.value) {
    if (pendingRoute.value) {
      next(true);
    } else {
      leaveModalIsVisible.value = true;
      pendingRoute.value = to;
    }
  } else {
    next(true);
  }
});

const proceedLeave = () => {
  router.push(pendingRoute.value);
};

const cancelLeave = () => {
  leaveModalIsVisible.value = false;
  pendingRoute.value = null;
};

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
    notify("danger", t("pages.tasks.warning_1"), 10000);
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

  currentTaskModal.value = defineAsyncComponent(
    () =>
      import(
        `../../../components/lesson/components/tasks/actions/execution/${task.value.task_type_component}.vue`
      ),
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

    notify("success", t("pages.tasks.test_is_started_for_learners"), 10000);
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

  closeSelectTasksModal(false);
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

const openSelectTasksModal = () => {
  tasksModalIsVisible.value = false;
  selectTasksModalIsVisible.value = true;
};

const closeSelectTasksModal = (state) => {
  tasksModalIsVisible.value = state;
  selectTasksModalIsVisible.value = false;
};

provide("onPending", onPending);
provide("onStartTask", onStartTask);
provide("onCompleteTask", onCompleteTask);
provide("changeModalSize", changeModalSize);
provide("closeModal", closeTaskModal);

provide("tasks", tasks);
provide("completedTasksCount", completedTasksCount);
provide("openTask", openTask);

const showTaskForLearners = async (task_id) => {
  pendingLearnersTasksResult.value = true;
  await $axiosPlugin
    .post(
      "conferences/run_task/" +
        conference.value.uuid +
        "/" +
        (task_id || task.value.task_id),
    )
    .then((response) => {
      getConferenceTasks();
      $socketPlugin.emit("open_task", {
        taskId: task_id || task.value.task_id,
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
      }
      // else if (
      //   conference.value.is_only_learner === true &&
      //   conference.value.is_bought_status &&
      //   conference.value.is_bought_status.is_bought === false
      // ) {
      //   errorMessage.value = {
      //     message: t("pages.conference.messages.no_paid"),
      //     pending: false,
      //   };
      // }
      else {
        startStream();
        getConferenceTasks();
      }

      const confCrumbItem = document.querySelector('span[data-crumb="[id]"]');

      if (confCrumbItem) {
        confCrumbItem.textContent = schoolStore.isAiSchoolDomain
          ? response.data.conference.topic
          : response.data.conference.group_name +
            " (" +
            response.data.conference.lesson_name +
            ")";
      }

      pageTitle.value =
        t("pages.conference.title") + " - " + schoolStore.isAiSchoolDomain
          ? response.data.conference.topic
          : response.data.conference.group_name +
            " (" +
            response.data.conference.lesson_name +
            ")";
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 403) {
          errorMessage.value = {
            message: t("pages.conference.messages.access_denied"),
            pending: false,
          };
        } else {
          router.push({
            path: "/error",
            query: {
              status: err.response.status,
              message: err.response.data.message,
              url: err.request.responseURL,
            },
          });
        }
      } else {
        router.push("/error");
      }
    });
};

const getConferenceTasks = async () => {
  pendingTasks.value = true;
  pendingTasksSelection.value = true;
  pendingLearnersTasksResult.value = true;
  tasksToComplete.value = 0;
  completedTasksCount.value = 0;
  completedTasksPercent.value = 0;

  try {
    const response = await $axiosPlugin.get(
      "conferences/get_conference_tasks/" + conference.value.uuid,
    );

    if (response.data.levels) {
      levels.value = response.data.levels;
    }

    tasks.value = response.data.tasks;

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
    pendingTasksSelection.value = false;
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

const selectLevel = (level) => {
  pendingTasksSelection.value = true;

  setTimeout(() => {
    tasksSelectionModalClass.value = tasksSelectionModalDefaultClass;
    activeLevel.value = level;
    pendingTasksSelection.value = false;
  }, 200);
};

const goToLevels = () => {
  tasksSelectionModalClass.value = "modal-4xl";
  activeLevel.value = null;
  activeSection.value = null;
  activeLesson.value = null;
};

const selectSection = (section) => {
  pendingTasksSelection.value = true;

  setTimeout(() => {
    tasksSelectionModalClass.value = "modal-4xl";
    activeSection.value = section;
    pendingTasksSelection.value = false;
  }, 200);
};

const goToSections = () => {
  tasksSelectionModalClass.value = tasksSelectionModalDefaultClass;
  activeSection.value = null;
  activeLesson.value = null;
};

const selectLesson = async (lesson) => {
  pendingTasksSelection.value = true;

  setTimeout(() => {
    tasksSelectionModalClass.value = "modal-4xl";
    activeLesson.value = lesson;
    pendingTasksSelection.value = false;
  }, 200);
};

const goToLessons = () => {
  tasksSelectionModalClass.value = tasksSelectionModalDefaultClass;
  activeLesson.value = null;
};

const timeIsUp = () => {
  setTimeout(() => {
    getConference();
    pendingConference.value = null;
  }, 1000);
};

const getActiveStream = () => {
  if (isScreenSharing.value && screenStream.value) {
    return screenStream.value;
  }

  if (!localStream.value) return null;

  let activeVideoTrack = null;

  if (bgMode.value !== "none" && canvasStream) {
    const canvasTrack = canvasStream.getVideoTracks()[0];
    if (canvasTrack && canvasTrack.readyState === "live") {
      activeVideoTrack = canvasTrack;
    }
  }

  // Если canvasTrack не нашелся или не активен, берем чистый трек с камеры
  if (!activeVideoTrack) {
    activeVideoTrack = localStream.value.getVideoTracks()[0];
  }

  const audioTrack = localStream.value.getAudioTracks()[0];

  const streamToSend = new MediaStream();
  if (activeVideoTrack) streamToSend.addTrack(activeVideoTrack);
  if (audioTrack) streamToSend.addTrack(audioTrack);

  return streamToSend;
};

const startStream = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 320, max: 640 },
        height: { ideal: 240, max: 480 },
        frameRate: { ideal: 12, max: 15 },
        facingMode: "user",
      },
      audio: selectedMicrophoneId.value
        ? {
            deviceId: { exact: selectedMicrophoneId.value },
            echoCancellation: true,
            noiseSuppression: true,
          }
        : true,
    });

    rawStream.value = stream;
    localStream.value = stream;
    micRestartAttempts = 0;
    watchAudioTrack(stream.getAudioTracks()[0]);
    startSilenceWatchdog();
    startSpeakingMonitor();

    setTimeout(() => {
      rawVideoRef.value.srcObject = stream;
    }, 1000);

    loadMicrophones();

    const turnDomain = (config.public.turnURL || "turn.easyspeak.kz")
      .replace(/^https?:\/\//, "")
      .split(":")[0]
      .trim();

    const username = (config.public.turnUSERNAME || "").trim();
    const credential = (config.public.turnPASSWORD || "").trim();

    const clientPeerId = `user_${authUser.value.user_id}_${Date.now()}`;
    isExplicitlyClosed = false; // новый вход в конференцию
    myPeer = new Peer(clientPeerId, {
      host: config.public.peerBase,
      port: process.env.NODE_ENV === "development" ? 3002 : "",
      path: "/peerjs/myapp",
      secure: process.env.NODE_ENV === "development" ? false : true,
      config: {
        iceCandidatePoolSize: 10,
        iceServers: [
          {
            urls: (
              config.public.stunURL || "stun:stun.l.google.com:19302"
            ).trim(),
          },
          {
            urls: [
              `turn:${turnDomain}:3478?transport=udp`,
              `turn:${turnDomain}:3478?transport=tcp`,
              `turns:${turnDomain}:443?transport=tcp`,
            ],
            username: username,
            credential: credential,
          },
        ],
      },
    });

    myPeer.on("open", (id) => {
      lastPeerOpenAt = Date.now();

      if (peerOpenedOnce) {
        resetPeerReconnect();
        const hasBrokenCalls = Object.values(peers).some(
          (call) => call?.peerConnection?.connectionState !== "connected",
        );
        if (pendingRejoin || hasBrokenCalls) {
          rejoinRoom();
        } else {
          finishReconnecting();
        }
        return;
      }
      peerOpenedOnce = true;

      addStream(
        false,
        localStream.value,
        myPeer.id,
        authUser.value.user_id,
        authUserInfo,
        isStream.value,
        isMuted.value,
      );

      myStream.value = streams.value.find((s) => s.peer_id === id);

      if (isStream.value === false) {
        toggleStream();
      }

      joinToRoom();
    });

    myPeer.on("error", (err) => {
      if (isExplicitlyClosed) return;

      if (err?.type === "peer-unavailable") {
        console.warn("[PeerJS]", err?.message);
        return;
      }

      if (peerOpenedOnce && err?.type !== "browser-incompatible") {
        console.warn("[PeerJS] Error, reconnecting:", err?.type, err?.message);
        startReconnecting();
        return;
      }

      notify("danger", t("errors.server.peer_error"), 10000);

      errorMessage.value = {
        message: err?.message,
        pending: false,
      };
    });

    myPeer.on("disconnected", () => {
      if (isExplicitlyClosed || !myPeer || myPeer.destroyed) return;
      startReconnecting();
      schedulePeerReconnect();
    });

    myPeer.on("call", (incomingCall) => {
      const streamToSend = getActiveStream();

      incomingCall.answer(streamToSend);

      const pc = incomingCall.peerConnection;

      if (pc) {
        pc.addEventListener("iceconnectionstatechange", () => {
          const name = incomingCall.metadata?.userInfo?.first_name;
          if (pc.iceConnectionState === "disconnected") {
            scheduleHealthCheck();
            notifyPeerConnectionIssue(
              pc,
              incomingCall.peer,
              name,
              incomingCall.metadata?.userId,
            );
          } else if (pc.iceConnectionState === "failed") {
            notifyPeerDisconnected(
              incomingCall.peer,
              name,
              incomingCall.metadata?.userId,
            );
          }
        });
      }
      // ============================================

      startPeerHeartbeat(myPeer);

      const previousCall = peers[incomingCall.peer];
      peers[incomingCall.peer] = incomingCall;
      if (previousCall && previousCall !== incomingCall) {
        try {
          previousCall.close();
        } catch (e) {
          console.error("Error on close old call:", e);
        }
      }

      attachCallListeners(incomingCall);
      applyBitrateLimit(incomingCall, 400);
    });

    $socketPlugin.off("user-connected");

    $socketPlugin.on(
      "user-connected",
      ({ userInfo }) => {
        if (userInfo?.first_name) {
          notify(
            "info",
            `${userInfo.first_name} ${t("online").toLowerCase()}`,
            10000,
          );
        }
      },
    );

    $socketPlugin.on("user-disconnected", (peerId) => {
      removeStream(peerId);
    });

    $socketPlugin.on("force-disconnect", handleForceDisconnect);

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


    $socketPlugin.on("connect_error", () => {
      if (peerOpenedOnce) {
        startReconnecting();
        return;
      }

      if (!errorMessage.value) {
        errorMessage.value = {
          message: t("errors.server.error"),
          pending: true,
        };

        streams.value = streams.value.filter((stream) => !stream.remote);

        notify("danger", t("errors.server.error"), 5000);
      }
    });

    $socketPlugin.on("open_material", (data) => {
      if (authUser.value.user_id !== conference.value.mentor_id) {
        const selectedMaterial = conference.value.materials.find(
          (m) => m.lesson_material_id === data.materialId,
        );

        if (selectedMaterial && taskInProgress.value === false) {
          openMaterial(selectedMaterial);
        }
      }
    });

    $socketPlugin.on("open_task", async (data) => {
      if (authUser.value.user_id !== conference.value.mentor_id) {
        await getConferenceTasks();
        if (conference.value.is_member) {
          const selectedTask = tasks.value.find(
            (t) => t.task_id === data.taskId,
          );

          if (selectedTask && !selectedTask?.task_result?.answers) {
            if (taskInProgress.value === true) {
              notify(
                "info",
                t("pages.tasks.new_task_is_available", {
                  taskName: selectedTask.task_slug,
                }),
                10000,
              );
            } else {
              openTask(selectedTask);
            }
          }
        } else {
          notify("danger", t("pages.tasks.allowed_only_participants"), 10000);
        }
      }
    });

    $socketPlugin.on("close_task", (data) => {
      if (authUser.value.user_id === conference.value.mentor_id) {
        busyLearners.value = busyLearners.value.filter(
          (l) => l.userId !== data.userId,
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
          (l) => l.userId !== data.userId,
        );

        notify(
          "success",
          t("pages.tasks.completed_the_task", {
            name: data.userInfo.last_name + " " + data.userInfo.first_name,
            taskName: data.taskName,
          }),
          10000,
        );
      }
    });

    $socketPlugin.on("start_test", () => {
      if (authUser.value.user_id !== conference.value.mentor_id) {
        if (conference.value.is_member) {
          startTheTest();
        } else {
          notify("danger", t("pages.tasks.allowed_only_participants"), 10000);
        }
      }
    });

    $socketPlugin.off("connect", handleSocketReconnect);
    $socketPlugin.on("connect", handleSocketReconnect);

    window.removeEventListener("online", handleBrowserOnline);
    window.removeEventListener("offline", handleBrowserOffline);
    window.addEventListener("online", handleBrowserOnline);
    window.addEventListener("offline", handleBrowserOffline);

    navigator.connection?.removeEventListener?.("change", handleNetworkChange);
    navigator.connection?.addEventListener?.("change", handleNetworkChange);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
  } catch (error) {
    notify("danger", t("errors.media.camera_error"), 10000);
  }
};

const startPeerHeartbeat = (myPeer) => {
  if (pingIntervalId) clearInterval(pingIntervalId);

  pingIntervalId = setInterval(() => {
    if (
      myPeer &&
      !myPeer.destroyed &&
      myPeer.socket?.ws?.readyState === WebSocket.OPEN
    ) {
      myPeer.socket.send({ type: "PING" });
    }
  }, 20000);
};

const getSelfieSegmentationConstructor = () => {
  if (typeof SelfieSegmentationPkg === "function") {
    return SelfieSegmentationPkg;
  }
  if (typeof SelfieSegmentationPkg?.SelfieSegmentation === "function") {
    return SelfieSegmentationPkg.SelfieSegmentation;
  }
  if (
    typeof SelfieSegmentationPkg?.default?.SelfieSegmentation === "function"
  ) {
    return SelfieSegmentationPkg.default.SelfieSegmentation;
  }
  if (typeof SelfieSegmentationPkg?.default === "function") {
    return SelfieSegmentationPkg.default;
  }
  if (
    typeof window !== "undefined" &&
    typeof window.SelfieSegmentation === "function"
  ) {
    return window.SelfieSegmentation;
  }
  return null;
};

// Обработка видео (фон) не чаще частоты камеры: requestAnimationFrame идёт
// 60 раз в секунду, а камера даёт ~12 кадров — без ограничения нейросеть
// гоняла бы один и тот же кадр по 5 раз
const VIDEO_PROCESSING_FPS = 15;
let renderGeneration = 0; // смена поколения останавливает старый цикл
let lastFrameProcessedAt = 0;

const stopVideoProcessing = () => {
  renderGeneration++;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

const destroyMediaPipe = () => {
  stopVideoProcessing();
  if (selfieSegmentation) {
    try {
      selfieSegmentation.close();
    } catch {}
    selfieSegmentation = null;
  }
};

// Модель (WASM + WebGL) создаётся один раз и переиспользуется при
// включении/выключении камеры. Раньше при каждом включении камеры
// создавался новый экземпляр, который никогда не закрывался, а цикл
// отрисовки после выключения камеры мог продолжать работать — за урок
// они накапливались, нагружали процессор, и звук начинал искажаться.
const initMediaPipe = () => {
  stopVideoProcessing();

  const SelfieSegmentationClass = getSelfieSegmentationConstructor();

  if (!SelfieSegmentationClass) {
    console.error("Error on SelfieSegmentation:", SelfieSegmentationPkg);
  } else {
    if (!selfieSegmentation) {
      selfieSegmentation = new SelfieSegmentationClass({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
      });
      selfieSegmentation.setOptions({ modelSelection: 1 });
      selfieSegmentation.onResults(drawSegmentationResults);
    }

    const generation = renderGeneration;

    const renderFrame = async () => {
      if (generation !== renderGeneration) return; // цикл остановлен

      const now = performance.now();
      const frameDue =
        now - lastFrameProcessedAt >= 1000 / VIDEO_PROCESSING_FPS;

      // При bgMode "none" отправляется исходный трек камеры, canvas не нужен
      if (
        frameDue &&
        bgMode.value !== "none" &&
        rawVideoRef.value &&
        rawVideoRef.value.readyState >= 2 &&
        canvasRef.value
      ) {
        lastFrameProcessedAt = now;
        const video = rawVideoRef.value;
        const canvas = canvasRef.value;

        if (
          video.videoWidth &&
          video.videoHeight &&
          (canvas.width !== video.videoWidth ||
            canvas.height !== video.videoHeight)
        ) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        try {
          await selfieSegmentation?.send({ image: video });
        } catch (err) {
          console.error("SelfieSegmentation error:", err);
        }
      }

      if (generation !== renderGeneration) return; // остановили во время send
      animationFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
  }
};

const drawSegmentationResults = (results) => {
      if (!canvasRef.value) return;

      const canvas = canvasRef.value;
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      if (bgMode.value === "none") {
        ctx.drawImage(results.image, 0, 0, w, h);
      } else if (bgMode.value === "blur" || bgMode.value === "image") {
        ctx.drawImage(results.segmentationMask, 0, 0, w, h);
        ctx.globalCompositeOperation = "source-in";
        ctx.drawImage(results.image, 0, 0, w, h);
        ctx.globalCompositeOperation = "destination-over";

        if (bgMode.value === "blur") {
          ctx.filter = "blur(16px)";
          ctx.drawImage(results.image, 0, 0, w, h);
        } else if (
          bgMode.value === "image" &&
          isBgImageLoaded.value &&
          bgImageRef.value
        ) {
          ctx.filter = "none";
          drawImageCover(ctx, bgImageRef.value, w, h);
        }
      }

      ctx.restore();
};

const drawImageCover = (ctx, img, canvasWidth, canvasHeight) => {
  const imgWidth = img.naturalWidth || img.videoWidth || img.width;
  const imgHeight = img.naturalHeight || img.videoHeight || img.height;

  if (!imgWidth || !imgHeight) return;

  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let renderWidth, renderHeight, offsetX, offsetY;

  if (canvasRatio > imgRatio) {
    renderWidth = canvasWidth;
    renderHeight = canvasWidth / imgRatio;
    offsetX = 0;
    offsetY = (canvasHeight - renderHeight) / 2;
  } else {
    renderWidth = canvasHeight * imgRatio;
    renderHeight = canvasHeight;
    offsetX = (canvasWidth - renderWidth) / 2;
    offsetY = 0;
  }

  ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
};

const setConferenceMode = (mode) => {
  confMode.value = mode;
  debounceConferenceSettings();
};

const reflectVideo = () => {
  isVideoReflected.value = !isVideoReflected.value;
  debounceConferenceSettings();
};

const switchBackgroundMode = async (mode) => {
  if (mode === "image" && !isBgImageLoaded.value) {
    console.warn("Background image not loaded yet.");
    return;
  }

  bgMode.value = mode;

  let newVideoTrack = null;

  if (mode === "blur" || mode === "image") {
    if (!canvasStream) {
      canvasStream = canvasRef.value.captureStream(15);
    }
    newVideoTrack = canvasStream.getVideoTracks()[0];
  } else {
    newVideoTrack = rawStream.value.getVideoTracks()[0];
  }

  if (!newVideoTrack) return;

  const localIndex = streams.value.findIndex((s) => !s.remote);
  if (localIndex !== -1) {
    const currentAudioTracks = rawStream.value.getAudioTracks();

    const updatedStream = new MediaStream([
      newVideoTrack,
      ...currentAudioTracks,
    ]);

    streams.value[localIndex].stream = updatedStream;
  }

  replaceTrackInConnections(newVideoTrack, "video");

  debounceConferenceSettings();
};

const selectConferenceBackgroundImage = (url) => {
  currentBgImage.value = url;
  debounceConferenceSettings();
};

const setUserConferenceSettings = async () => {
  await $axiosPlugin
    .post("conferences/save_settings", {
      mode: confMode.value,
      bg_mode: bgMode.value,
      bg_image: currentBgImage.value,
      video_reflected: isVideoReflected.value,
    })
    .then(() => {
      refreshIdentity();
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

const joinToRoom = () =>
  new Promise((resolve) => {
    $socketPlugin.connect();

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
          hasJoinedRoom = true;
          finishReconnecting();

          $socketPlugin.emit("get-room-info", (roomInfo) => {
            roomInfo.forEach((user) => {
              if (user.peerId !== myPeer?.id) callUser(user);
            });
            resolve();
          });
        } else {
          if (response.message === "peer_is_null") {
            notify("danger", t("errors.server.peer_error"), 10000);
          } else {
            notify("danger", t("errors.server.room_error"), 10000);
          }
          resolve();
        }
      },
    );
  });

const callUser = (user) => {
  if (!myPeer || myPeer.destroyed || myPeer.disconnected) return;

  const outgoingCall = myPeer.call(user.peerId, getActiveStream(), {
    metadata: {
      userId: authUser.value.user_id,
      userInfo: authUserInfo,
      isStream: isStream.value,
      isMuted: isMuted.value,
    },
  });

  if (!outgoingCall) return;

  const pc = outgoingCall.peerConnection;

  if (pc) {
    pc.addEventListener("iceconnectionstatechange", () => {
      // Проблема в соединении с собеседником не обязательно наша —
      // поэтому тост с его именем, как и для входящих звонков.
      // Про нашу собственную сеть сообщает startReconnecting().
      const name = user.userInfo?.first_name;
      if (pc.iceConnectionState === "disconnected") {
        scheduleHealthCheck();
        notifyPeerConnectionIssue(pc, user.peerId, name, user.userId);
      } else if (pc.iceConnectionState === "failed") {
        console.warn("[WebRTC] Outgoing call error, recall...");
        notifyPeerDisconnected(user.peerId, name, user.userId);
      }
    });
  }

  const previousCall = peers[user.peerId];
  peers[user.peerId] = outgoingCall;
  if (previousCall && previousCall !== outgoingCall) {
    try {
      previousCall.close();
    } catch (e) {
      console.error("Error on close old call:", e);
    }
  }

  attachCallListeners(outgoingCall, user);
  applyBitrateLimit(outgoingCall, 400);
};

const scheduleRecall = (user) => {
  const peerId = user.peerId;
  if (recallTimers[peerId]) return;

  const attempt = (recallAttempts[peerId] || 0) + 1;
  if (attempt > MAX_RECALL_ATTEMPTS) {
    console.warn(`[WebRTC] Error on connect with peer ${peerId}`);
    return;
  }
  recallAttempts[peerId] = attempt;

  recallTimers[peerId] = setTimeout(() => {
    delete recallTimers[peerId];
    if (isExplicitlyClosed || peers[peerId] || !$socketPlugin.connected) return;

    $socketPlugin.emit("get-room-info", (roomInfo) => {
      const freshUser = roomInfo.find((u) => u.peerId === peerId);
      if (freshUser && !peers[peerId] && !isExplicitlyClosed) {
        callUser(freshUser);
      }
    });
  }, 1500 * attempt);
};

const clearRecall = (peerId) => {
  if (recallTimers[peerId]) {
    clearTimeout(recallTimers[peerId]);
    delete recallTimers[peerId];
  }
  delete recallAttempts[peerId];
};

const rejoinRoom = async () => {
  if (isExplicitlyClosed || !myPeer || myPeer.destroyed) return;

  if (myPeer.disconnected || !myPeer.open) {
    pendingRejoin = true;
    return;
  }
  if (!$socketPlugin.connected) return;

  if (isRejoining) return;

  pendingRejoin = false;
  isRejoining = true;

  try {
    Object.keys(recallTimers).forEach(clearRecall);

    Object.keys(peers).forEach((peerId) => {
      const call = peers[peerId];
      delete peers[peerId];
      try {
        call.close();
      } catch (e) {
        console.error("Error on close call:", e);
      }
    });
    streams.value = streams.value.filter((s) => !s.remote);

    await joinToRoom();
  } finally {
    isRejoining = false;
  }
};

const handleSocketReconnect = () => {
  if (!hasJoinedRoom || isExplicitlyClosed) return;
  if (
    myPeer &&
    !myPeer.destroyed &&
    !myPeer.disconnected &&
    Date.now() - lastPeerOpenAt > 10000
  ) {
    restartPeerSignaling();
    return;
  }

  rejoinRoom();
};

const restartPeerSignaling = () => {
  if (!myPeer || myPeer.destroyed) return;

  pendingRejoin = true;
  if (!myPeer.disconnected) myPeer.disconnect();
  resetPeerReconnect();
  schedulePeerReconnect(300);
};

const forceReconnectAll = () => {
  if (isExplicitlyClosed || !myPeer || myPeer.destroyed) return;
  startReconnecting();
  restartPeerSignaling();

  $socketPlugin.disconnect();
  $socketPlugin.connect();
};


const checkConnectionHealth = () => {
  if (healthCheckInProgress || isExplicitlyClosed || !hasJoinedRoom) return;
  if (!myPeer || myPeer.destroyed) return;

  if (!$socketPlugin.connected) return;

  healthCheckInProgress = true;
  $socketPlugin.timeout(4000).emit("get-room-info", (err) => {
    healthCheckInProgress = false;
    if (err) {
      forceReconnectAll();
    }
  });
};

const scheduleHealthCheck = () => {
  if (healthCheckDebounce) clearTimeout(healthCheckDebounce);
  healthCheckDebounce = setTimeout(() => {
    healthCheckDebounce = null;
    checkConnectionHealth();
  }, 1000);
};

const handleNetworkChange = () => {
  if (isExplicitlyClosed) return;
  scheduleHealthCheck();
};

let hiddenAt = null;
const isMobileDevice =
  typeof navigator !== "undefined" &&
  (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    // iPadOS представляется как Mac
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const handleVisibilityChange = () => {
  if (document.visibilityState !== "visible") {
    hiddenAt = Date.now();
    return;
  }

  const wasHiddenFor = hiddenAt ? Date.now() - hiddenAt : 0;
  hiddenAt = null;

  scheduleHealthCheck();
  resumeRemoteMedia();

  // На телефоне уход из браузера дольше пары секунд — это, скорее всего,
  // звонок или другое приложение, которое могло «тихо» забрать микрофон
  // (WhatsApp не помечает трек как ended/muted). Перезахват через
  // replaceTrack незаметен для собеседников, поэтому делаем его всегда.
  if (isMobileDevice && wasHiddenFor > 2000) {
    micRestartAttempts = 0;
    setTimeout(() => {
      if (!document.hidden) restartMicrophone();
    }, 500);
  } else {
    scheduleMicrophoneCheck();
  }
};

const startReconnecting = () => {
  if (isReconnecting || isExplicitlyClosed) return;
  isReconnecting = true;
  showToastOnce(
    "self-network",
    "warning",
    t("errors.server.user_network_error"),
    5000,
  );
};

const finishReconnecting = () => {
  if (!isReconnecting) return;
  isReconnecting = false;
  showToastOnce(
    "self-reconnected",
    "success",
    t("errors.server.reconnected"),
    5000,
  );
};

const schedulePeerReconnect = (delay = null) => {
  if (peerReconnectTimer) return;

  const wait = delay ?? Math.min(1000 * 2 ** peerReconnectAttempts, 10000);
  peerReconnectAttempts++;

  peerReconnectTimer = setTimeout(() => {
    peerReconnectTimer = null;
    if (
      isExplicitlyClosed ||
      !myPeer ||
      myPeer.destroyed ||
      !myPeer.disconnected
    ) {
      return;
    }
    try {
      myPeer.reconnect();
    } catch (e) {
      schedulePeerReconnect();
    }
  }, wait);
};

const resetPeerReconnect = () => {
  if (peerReconnectTimer) {
    clearTimeout(peerReconnectTimer);
    peerReconnectTimer = null;
  }
  peerReconnectAttempts = 0;
};

const handleBrowserOnline = () => {
  if (isExplicitlyClosed || !myPeer || myPeer.destroyed) return;

  if (myPeer.disconnected) {
    resetPeerReconnect();
    schedulePeerReconnect(300);
  }
  if (!$socketPlugin.connected) {
    $socketPlugin.disconnect();
    $socketPlugin.connect();
  }
};

const handleBrowserOffline = () => {
  if (isExplicitlyClosed) return;
  startReconnecting();
};

const addStream = (
  remote,
  stream,
  peer_id,
  user_id,
  userInfo,
  isStream,
  isMuted,
) => {
  const index = streams.value.findIndex((item) => item.peer_id === peer_id);

  if (index === -1) {

    streams.value.push({
      remote,
      stream,
      peer_id,
      user_id,
      userInfo,
      isStream,
      isMuted,
      speaking: false,
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
  } else {
    streams.value[index].stream = stream;
    streams.value[index].isStream = isStream;
    streams.value[index].isMuted = isMuted;
    streams.value[index].remote = remote;
    if (userInfo) streams.value[index].userInfo = userInfo;
  }
};

const leaveConference = async () => {
  $socketPlugin.off("user-connected");
  $socketPlugin.off("user-disconnected");
  $socketPlugin.off("force-disconnect");
  $socketPlugin.off("new-message");
  $socketPlugin.off("toggle-video");
  $socketPlugin.off("toggle-audio");
  $socketPlugin.off("connect_error");
  $socketPlugin.off("open_material");
  $socketPlugin.off("open_task");
  $socketPlugin.off("close_task");
  $socketPlugin.off("start_task");
  $socketPlugin.off("complete_task");
  $socketPlugin.off("start_test");
  $socketPlugin.off("connect", handleSocketReconnect);
  window.removeEventListener("online", handleBrowserOnline);
  window.removeEventListener("offline", handleBrowserOffline);
  navigator.connection?.removeEventListener?.("change", handleNetworkChange);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  if (healthCheckDebounce) {
    clearTimeout(healthCheckDebounce);
    healthCheckDebounce = null;
  }
  healthCheckInProgress = false;
  unwatchAudioTrack();
  stopSilenceWatchdog();
  stopSpeakingMonitor();
  hideMicLostToast();
  micRestartAttempts = 0;
  hiddenAt = null;

  isExplicitlyClosed = true;
  peerOpenedOnce = false;
  pendingRejoin = false;
  isReconnecting = false;
  hasJoinedRoom = false;
  resetPeerReconnect();
  Object.keys(recallTimers).forEach(clearRecall);

  if (pingIntervalId) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
  }

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

  if (rawStream.value !== null) {
    rawStream.value.getTracks().forEach((track) => track.stop());
  }

  isExplicitlyClosed = true;
  localStream.value = null;
  screenStream.value = null;
  rawStream.value = null;
  streams.value = [];
  $socketPlugin.disconnect();

  destroyMediaPipe();
};

const removeStream = (peerId, call = null) => {
  if (!peerId) return;

  if (call && peers[peerId] && peers[peerId] !== call) return;

  if (!call) clearRecall(peerId);

  const streamToRemove = streams.value.find((s) => s.peer_id === peerId);

  if (streamToRemove) {
    streams.value = streams.value.filter((s) => s.peer_id !== peerId);

    if (authUser.value.user_id === conference.value.mentor_id) {
      busyLearners.value = busyLearners.value.filter(
        (l) => l.userId !== streamToRemove.user_id,
      );
    }
  }

  if (peers[peerId]) {
    const call = peers[peerId];
    delete peers[peerId];
    try {
      call.close();
    } catch (e) {
      console.error("Error on close call:", e);
    }
  }

  if (activeMonitors?.has(peerId)) {
    const stopMonitor = activeMonitors.get(peerId);
    stopMonitor();
    activeMonitors.delete(peerId);
  }
  if (peersStats[peerId]) {
    delete peersStats[peerId];
  }

  // Пришёл "user-disconnected" с нашим же peerId: сервер выкинул эту вкладку,
  // потому что тот же пользователь зашёл с другой вкладки/устройства
  if (peerId === myPeer?.id) {
    leaveConference();
  }
};

const toggleStream = () => {
  if (localStream.value) {
    const videoTrack = localStream.value.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    isStream.value = videoTrack.enabled;

    myStream.value.isStream = isStream.value;
    if (isStream.value === true) {
      switchBackgroundMode(authUser.value.conf_bg_mode);
      setTimeout(() => {
        initMediaPipe();
      }, 500);
    } else {
      // Модель не закрываем — переиспользуем при следующем включении камеры
      stopVideoProcessing();
    }

    $socketPlugin.emit("toggle-video", {
      peerId: myPeer.id,
      isStream: isStream.value,
    });
  } else {
    notify("danger", t("errors.media.camera_error"), 10000);
  }
};

const toggleMute = () => {
  if (!localStream.value) {
    notify("danger", t("errors.media.camera_error"), 10000);
    return;
  }

  const newMutedState = !isMuted.value;
  isMuted.value = newMutedState;

  const mainAudioTrack = localStream.value.getAudioTracks()[0];
  if (mainAudioTrack) {
    mainAudioTrack.enabled = !newMutedState;
  }

  Object.values(peers).forEach((call) => {
    const peerConnection = call.peerConnection;
    if (peerConnection) {
      peerConnection.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === "audio") {
          sender.track.enabled = !newMutedState;
        }
      });
    }
  });

  if (myStream.value) {
    myStream.value.isMuted = newMutedState;
  }

  $socketPlugin.emit("toggle-audio", {
    peerId: myPeer.id,
    isMuted: newMutedState,
  });
};

const replaceTrackInConnections = (newTrack, kind = "video") => {
  if (!newTrack || !myPeer?.connections) return;

  Object.keys(myPeer.connections).forEach((peerId) => {
    const peerConnectionArray = myPeer.connections[peerId];

    if (Array.isArray(peerConnectionArray)) {
      peerConnectionArray.forEach((mediaConnection) => {
        const pc = mediaConnection?.peerConnection;

        if (pc && pc.connectionState !== "closed") {
          const sender = pc.getSenders().find((s) => {
            if (s.track) {
              return s.track.kind === kind;
            }
            return kind === "video";
          });

          if (sender) {
            sender.replaceTrack(newTrack).catch((err) => {
              console.error(`Ошибка замены трека для peer ${peerId}:`, err);
            });
          }
        }
      });
    }
  });
};

const attachCallListeners = (call, userData = null) => {
  call.on("stream", (remoteStream) => {
    const pushOrUpdate = () => {
      const userId = userData?.userId || call.metadata?.userId;
      const userInfo = userData?.userInfo || call.metadata?.userInfo;
      const isStream = userData?.isStream ?? call.metadata?.isStream;
      const isMuted = userData?.isMuted ?? call.metadata?.isMuted;

      addStream(
        true,
        remoteStream,
        call.peer,
        userId,
        userInfo,
        isStream,
        isMuted,
      );
    };

    pushOrUpdate();
    remoteStream.onaddtrack = () => pushOrUpdate();
    delete recallAttempts[call.peer];
  });

  let ended = false;

  const handleCallEnded = () => {
    if (ended) return;
    ended = true;
    const droppedUnexpectedly = peers[call.peer] === call;

    removeStream(call.peer, call);

    if (droppedUnexpectedly && userData && !isExplicitlyClosed) {
      scheduleRecall(userData);
    }
  };

  call.on("close", handleCallEnded);

  call.on("error", (error) => {
    handleCallEnded();
  });

  attachNetworkMonitoring(call);
};

const attachNetworkMonitoring = (mediaConnection) => {
  const peerId = mediaConnection.peer;

  if (activeMonitors.has(peerId)) {
    activeMonitors.get(peerId)();
  }

  const stop = startNetworkMonitoring(mediaConnection, (stats) => {
    peersStats[peerId] = stats;
  });

  activeMonitors.set(peerId, stop);

  mediaConnection.on("close", () => {
    stop();
    if (activeMonitors.get(peerId) === stop) {
      activeMonitors.delete(peerId);
      delete peersStats[peerId];
    }
  });
};

const applyBitrateLimit = (call, maxBitrateKbps = 400) => {
  const pc = call.peerConnection;

  if (pc) {
    limitVideoBitrate(pc, maxBitrateKbps);

    pc.addEventListener("connectionstatechange", () => {
      if (pc.connectionState === "connected") {
        limitVideoBitrate(pc, maxBitrateKbps);
      }
    });
  }
};

const limitVideoBitrate = (peerConnection, maxBitrateKbps = 400) => {
  const senders = peerConnection.getSenders();
  const videoSender = senders.find((s) => s.track && s.track.kind === "video");

  if (videoSender) {
    const parameters = videoSender.getParameters();
    if (!parameters.encodings) parameters.encodings = [{}];

    parameters.encodings[0].maxBitrate = maxBitrateKbps * 1000;

    videoSender.setParameters(parameters).catch((err) => {
      console.error("Ошибка установки лимита битрейта:", err);
    });
  }
};

const toggleScreenSharing = async () => {
  if (!isScreenSharing.value) {
    try {
      screenStream.value = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { max: 640 },
          height: { max: 360 },
          frameRate: { max: 10 },
        },
        audio: false,
      });
      isScreenSharing.value = true;

      replaceTrackInConnections(
        screenStream.value.getVideoTracks()[0],
        "video",
      );

      screenStream.value.getVideoTracks()[0].onended = stopScreenSharing;
    } catch (error) {
      notify("danger", t("errors.media.screen_sharing_error"), 10000);
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

const loadMicrophones = async () => {
  let devices = await navigator.mediaDevices.enumerateDevices();

  // Без разрешения на микрофон названия устройств пустые — тогда один раз
  // запрашиваем доступ и СРАЗУ освобождаем микрофон. Раньше захват здесь
  // никогда не останавливался: при каждом devicechange (наушники, Bluetooth)
  // открывался ещё один параллельный захват того же микрофона.
  if (devices.some((d) => d.kind === "audioinput" && !d.label)) {
    const permissionStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    permissionStream.getTracks().forEach((track) => track.stop());
    devices = await navigator.mediaDevices.enumerateDevices();
  }

  microphones.value = [];

  devices.forEach((d) => {
    if (d.kind !== "audioinput") return;
    if (d.deviceId === "default" || d.deviceId === "communications") return;

    if (!microphones.value.some((m) => m.groupId === d.groupId)) {
      microphones.value.push(d);
    }
  });

  const savedId = localStorage.getItem("micdeviceid");

  if (savedId && microphones.value.some((m) => m.deviceId === savedId)) {
    selectedMicrophoneId.value = savedId;
  } else if (microphones.value.length > 0) {
    selectedMicrophoneId.value = microphones.value[0].deviceId;
    localStorage.setItem("micdeviceid", selectedMicrophoneId.value);
  } else {
    selectedMicrophoneId.value = null;
  }
};

// --- Восстановление микрофона ---
// Входящий звонок или другое приложение (WhatsApp и т.п.) забирает микрофон:
// на iOS аудиотрек становится "ended", на Android — muted и часто так и
// остаётся. Видео при этом продолжает идти, а собеседники слышат тишину.
// Следим за треком и при необходимости захватываем микрофон заново,
// подменяя трек во всех соединениях через replaceTrack (без перезвона).
const MIC_CHECK_DELAY_MS = 1500; // короткий mute (iOS при возврате во вкладку) проходит сам
const MAX_MIC_RESTART_ATTEMPTS = 3;
let watchedAudioTrack = null;
let micCheckTimer = null;
let micRestartInProgress = false;
let micRestartAttempts = 0;
let micLostToastId = null;

const isAudioTrackBroken = () => {
  const track = localStream.value?.getAudioTracks()[0];
  return !track || track.readyState === "ended" || track.muted;
};

const clearMicCheck = () => {
  if (micCheckTimer) {
    clearTimeout(micCheckTimer);
    micCheckTimer = null;
  }
};

const scheduleMicrophoneCheck = () => {
  clearMicCheck();
  micCheckTimer = setTimeout(() => {
    micCheckTimer = null;
    if (!document.hidden && isAudioTrackBroken()) restartMicrophone();
  }, MIC_CHECK_DELAY_MS);
};

const hideMicLostToast = () => {
  if (micLostToastId !== null) {
    toast.dismiss(micLostToastId);
    micLostToastId = null;
  }
};

// Автоматически вернуть микрофон не получилось (например, iOS требует
// действия пользователя) — просим нажать на тост
const showMicLostToast = () => {
  if (micLostToastId !== null || isExplicitlyClosed) return;
  micLostToastId = toast(t("errors.media.microphone_lost"), {
    toastClassName: ["custom-toast", "danger"],
    timeout: false,
    closeOnClick: true,
    onClick: () => {
      micLostToastId = null;
      micRestartAttempts = 0;
      restartMicrophone();
    },
    onClose: () => {
      micLostToastId = null;
    },
  });
};

const onAudioTrackEnded = () => {
  // В фоне (идёт звонок) захватить микрофон всё равно не получится —
  // проверим при возврате во вкладку
  if (document.hidden) return;
  restartMicrophone();
};

const onAudioTrackMute = () => {
  if (document.hidden) return;
  scheduleMicrophoneCheck();
};

const onAudioTrackUnmute = () => {
  clearMicCheck();
  micRestartAttempts = 0;
  hideMicLostToast();
};

const unwatchAudioTrack = () => {
  if (watchedAudioTrack) {
    watchedAudioTrack.removeEventListener("ended", onAudioTrackEnded);
    watchedAudioTrack.removeEventListener("mute", onAudioTrackMute);
    watchedAudioTrack.removeEventListener("unmute", onAudioTrackUnmute);
    watchedAudioTrack = null;
  }
  clearMicCheck();
};

const watchAudioTrack = (track) => {
  unwatchAudioTrack();
  if (!track) return;
  watchedAudioTrack = track;
  track.addEventListener("ended", onAudioTrackEnded);
  track.addEventListener("mute", onAudioTrackMute);
  track.addEventListener("unmute", onAudioTrackUnmute);
};

// Новый аудиотрек с выбранного микрофона; если он недоступен — с любого
const acquireAudioTrack = async (deviceId) => {
  const base = { echoCancellation: true, noiseSuppression: true };

  if (deviceId) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { ...base, deviceId: { exact: deviceId } },
        video: false,
      });
      return stream.getAudioTracks()[0];
    } catch (err) {
      console.warn("Выбранный микрофон недоступен, берём любой:", err);
    }
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: base,
    video: false,
  });
  return stream.getAudioTracks()[0];
};

// Подменить аудиотрек в локальном потоке и во всех соединениях
const applyAudioTrack = (newTrack) => {
  newTrack.enabled = !isMuted.value; // сохраняем ручной mute пользователя

  replaceTrackInConnections(newTrack, "audio");

  const stream = localStream.value;
  stream.getAudioTracks().forEach((oldTrack) => {
    if (oldTrack === newTrack) return;
    oldTrack.stop();
    stream.removeTrack(oldTrack);
  });
  stream.addTrack(newTrack);

  watchAudioTrack(newTrack);
};

const restartMicrophone = async () => {
  if (micRestartInProgress || isExplicitlyClosed || !localStream.value) return;

  if (micRestartAttempts >= MAX_MIC_RESTART_ATTEMPTS) {
    showMicLostToast();
    return;
  }

  micRestartInProgress = true;
  micRestartAttempts++;
  clearMicCheck();

  try {
    const newTrack = await acquireAudioTrack(selectedMicrophoneId.value);

    if (isExplicitlyClosed || !localStream.value) {
      newTrack.stop();
      return;
    }

    applyAudioTrack(newTrack);
    console.warn("Микрофон перезахвачен");

    if (newTrack.muted) {
      // Микрофон всё ещё занят (звонок не закончился) — попробуем ещё раз
      scheduleMicrophoneCheck();
    } else {
      micRestartAttempts = 0;
      hideMicLostToast();
    }
  } catch (err) {
    console.error("Не удалось перезахватить микрофон:", err);
    showMicLostToast();
  } finally {
    micRestartInProgress = false;
  }
};

// --- Детектор «цифровой тишины» ---
// VoIP-звонки (WhatsApp, Telegram) часто не помечают наш трек как ended/muted:
// он остаётся «живым», но после звонка отдаёт ровно нули. Живой микрофон
// даже в тихой комнате даёт шум, поэтому totalAudioEnergy исходящего аудио
// всегда растёт. Если она не меняется несколько проверок подряд — микрофон
// мёртвый, перезахватываем.
const SILENCE_CHECK_INTERVAL_MS = 2000;
const SILENCE_CHECKS_BEFORE_RESTART = 3; // ~6 сек. полной тишины
const SILENCE_RESTART_COOLDOWN_MS = 20000;
let silenceWatchdogId = null;
let lastAudioEnergy = null;
let silentChecks = 0;
let lastSilenceRestartAt = 0;

const resetSilenceState = () => {
  lastAudioEnergy = null;
  silentChecks = 0;
};

// Статистика "media-source" нашего аудиотрека (audioLevel, totalAudioEnergy)
// из любого активного соединения. null — не с кем соединены или браузер
// такую статистику не отдаёт.
const getOutgoingAudioStats = async () => {
  const track = localStream.value?.getAudioTracks()[0];
  if (!track || !myPeer?.connections) return null;

  for (const connections of Object.values(myPeer.connections)) {
    for (const connection of connections || []) {
      const pc = connection?.peerConnection;
      if (!pc || pc.connectionState !== "connected") continue;

      const sender = pc.getSenders().find((s) => s.track === track);
      if (!sender) continue;

      const report = await sender.getStats();
      for (const stat of report.values()) {
        if (stat.type === "media-source" && stat.kind === "audio") {
          return stat;
        }
      }
      return null;
    }
  }
  return null;
};

const getOutgoingAudioEnergy = async () => {
  const stat = await getOutgoingAudioStats();
  return typeof stat?.totalAudioEnergy === "number"
    ? stat.totalAudioEnergy
    : null;
};

const checkMicrophoneSilence = async () => {
  // Выключенный пользователем микрофон (enabled = false) тоже даёт нули
  if (
    document.hidden ||
    isMuted.value ||
    micRestartInProgress ||
    isExplicitlyClosed
  ) {
    resetSilenceState();
    return;
  }

  let energy = null;
  try {
    energy = await getOutgoingAudioEnergy();
  } catch {
    energy = null;
  }

  if (energy === null) {
    resetSilenceState();
    return;
  }

  silentChecks =
    lastAudioEnergy !== null && energy === lastAudioEnergy
      ? silentChecks + 1
      : 0;
  lastAudioEnergy = energy;

  if (
    silentChecks >= SILENCE_CHECKS_BEFORE_RESTART &&
    Date.now() - lastSilenceRestartAt > SILENCE_RESTART_COOLDOWN_MS
  ) {
    console.warn("Микрофон отдаёт полную тишину — перезахватываем");
    lastSilenceRestartAt = Date.now();
    resetSilenceState();
    micRestartAttempts = 0;
    restartMicrophone();
  }
};

const startSilenceWatchdog = () => {
  stopSilenceWatchdog();
  silenceWatchdogId = setInterval(
    checkMicrophoneSilence,
    SILENCE_CHECK_INTERVAL_MS,
  );
};

const stopSilenceWatchdog = () => {
  if (silenceWatchdogId) {
    clearInterval(silenceWatchdogId);
    silenceWatchdogId = null;
  }
  resetSilenceState();
};

// После прерывания (звонок, другое приложение) iOS может поставить
// воспроизведение удалённых видео на паузу — тогда уже мы не слышим других
const resumeRemoteMedia = () => {
  document.querySelectorAll("video").forEach((video) => {
    if (video.srcObject && video.paused) video.play().catch(() => {});
  });
};

const switchMicrophone = async (micDeviceId) => {
  selectedMicrophoneId.value = micDeviceId;
  localStorage.setItem("micdeviceid", micDeviceId);

  if (!localStream.value) return;

  try {
    const newTrack = await acquireAudioTrack(micDeviceId);
    applyAudioTrack(newTrack);
    micRestartAttempts = 0;
    hideMicLostToast();
  } catch (err) {
    console.error("Не удалось переключить микрофон:", err);
    notify("danger", t("errors.media.camera_error"), 10000);
  }
};

// --- Индикатор «говорит сейчас» ---
// Громкость каждого аудиопотока браузер уже считает внутри WebRTC, поэтому
// не нужны ни AudioContext/AudioWorklet (сотни сообщений в секунду и
// перерисовок), ни пересылка громкости через сокет-сервер:
//  - удалённые: receiver.getSynchronizationSources()[0].audioLevel;
//  - свой микрофон: audioLevel из статистики отправителя.
// Опрашиваем несколько раз в секунду и меняем реактивный флаг speaking
// только при его переключении — Vue перерисовывает плитку пару раз за фразу.
const SPEAKING_CHECK_INTERVAL_MS = 300;
const SPEAKING_THRESHOLD = 0.05; // audioLevel 0…1; фоновый шум после шумоподавления ниже
const SPEAKING_HOLD_MS = 700; // не гасим рамку в паузах между словами
let speakingMonitorId = null;
let speakingCheckInProgress = false;
const lastLoudAt = {}; // peer_id -> время последнего громкого замера

const getRemoteAudioLevel = (peerId) => {
  const pc = peers[peerId]?.peerConnection;
  if (!pc || pc.connectionState === "closed") return 0;

  const receiver = pc
    .getReceivers()
    .find((r) => r.track?.kind === "audio");
  const source = receiver?.getSynchronizationSources?.()[0];
  return source?.audioLevel ?? 0;
};

const getLocalAudioLevel = async () => {
  if (isMuted.value) return 0;
  try {
    const stat = await getOutgoingAudioStats();
    return stat?.audioLevel ?? 0;
  } catch {
    return 0;
  }
};

const applySpeaking = (stream, level, now) => {
  if (level >= SPEAKING_THRESHOLD) lastLoudAt[stream.peer_id] = now;

  const speaking =
    !stream.isMuted && now - (lastLoudAt[stream.peer_id] || 0) < SPEAKING_HOLD_MS;

  if (stream.speaking !== speaking) stream.speaking = speaking;
};

const checkSpeaking = async () => {
  if (document.hidden || speakingCheckInProgress) return;
  speakingCheckInProgress = true;

  try {
    const localLevel = await getLocalAudioLevel();
    const now = Date.now();

    for (const stream of streams.value) {
      const level = stream.remote
        ? getRemoteAudioLevel(stream.peer_id)
        : localLevel;
      applySpeaking(stream, level, now);
    }
  } finally {
    speakingCheckInProgress = false;
  }
};

const startSpeakingMonitor = () => {
  stopSpeakingMonitor();
  speakingMonitorId = setInterval(checkSpeaking, SPEAKING_CHECK_INTERVAL_MS);
};

const stopSpeakingMonitor = () => {
  if (speakingMonitorId) {
    clearInterval(speakingMonitorId);
    speakingMonitorId = null;
  }
  speakingCheckInProgress = false;
  Object.keys(lastLoudAt).forEach((key) => delete lastLoudAt[key]);
};

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

const debounceConferenceSettings = debounceHandler(
  () => setUserConferenceSettings(),
  1000,
);

const reloadPage = () => {
  window.location.reload();
};

const handleForceDisconnect = () => {
  notify("warning", t("errors.server.force_disconnect"), 10000);

  errorMessage.value = {
    message: t("errors.server.force_disconnect"),
    pending: false,
  };

  leaveConference();
};

// Именованные функции, чтобы removeEventListener снимал именно их
const handleDeviceChange = () => {
  loadMicrophones();
};

const handleBeforeUnload = (event) => {
  event.preventDefault();
  event.returnValue = "";
  return "";
};

onMounted(() => {
  navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
  window.addEventListener("beforeunload", handleBeforeUnload);

  getConference();
});

onBeforeUnmount(() => {
  navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
  window.removeEventListener("beforeunload", handleBeforeUnload);

  if (localStream.value) {
    leaveConference();
  }

  activeMonitors.forEach((stop) => stop());
  activeMonitors.clear();
});
</script>