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

        <gridMode v-if="confMode === 'grid'" :streams="streams" />
        <sliderMode v-else-if="confMode === 'slider'" :streams="streams" />
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
                <i v-if="volume > 50" class="bi bi-mic-fill text-success"></i>
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
              <div class="flex flex-col gap-4">
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
                          class="w-20 h-12 rounded-lg bg-cover bg-center flex justify-center items-center cursor-pointer relative overflow-hidden"
                          :class="
                            image === currentBgImage
                              ? 'border-corp border'
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
                        v-if="conference.mentor_id === authUser.user_id"
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
            </div>
            <template v-if="!schoolStore.isAiSchoolDomain">
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
        :onClose="() => closeSelectTasksModal()"
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
                          class="w-full flex items-center justify-between gap-4"
                        >
                          <div class="flex gap-2 items-center w-full">
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

                          <button
                            class="btn btn-sm text-nowrap"
                            @click="showTaskForLearners(taskItem.task_id)"
                            :class="
                              tasks.find((t) => t.task_id === taskItem.task_id)
                                ? 'btn-outline-success disabled'
                                : 'btn-success'
                            "
                          >
                            <i class="pi pi-play"></i>
                            {{
                              tasks.find((t) => t.task_id === taskItem.task_id)
                                ? $t("pages.tasks.launched")
                                : $t("pages.tasks.run")
                            }}
                          </button>
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
  onUnmounted,
  onBeforeUnmount,
  provide,
  shallowRef,
} from "vue";
import { debounceHandler } from "../../../utils/debounceHandler.js";
import { monitorNetworkAndAdjustQuality } from "../../../utils/networkQuality";
import { useToast } from "vue-toastification";
import Peer from "peerjs";
import { useRuntimeConfig } from "nuxt/app";
import SelfieSegmentationPkg from "@mediapipe/selfie_segmentation";
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
import dropdownMenu from "../../../components/ui/dropdownMenu.vue";
import alert from "../../../components/ui/alert.vue";
import levelCard from "../../../components/levels/levelCard.vue";

const router = useRouter();
const route = useRoute();
const pendingRoute = ref(null);
const conference_id = route.params.id;
const pageTitle = ref("");

const { t } = useI18n();
const config = useRuntimeConfig();
const toast = useToast();
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

let selfieSegmentation = null;
let animationFrameId = null;
let canvasStream = null;

const microphones = ref([]);
const dynamics = ref([]);
const cameras = ref([]);
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
const volume = ref(0);
const isStream = ref(false);
const isScreenSharing = ref(false);

const message = ref("");
const messages = ref([]);
const unReadMessages = ref(0);

//Modals
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

// SPA-переходы
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

const openSelectTasksModal = () => {
  tasksModalIsVisible.value = false;
  selectTasksModalIsVisible.value = true;
};

const closeSelectTasksModal = () => {
  tasksModalIsVisible.value = true;
  selectTasksModalIsVisible.value = false;
};

provide("onPending", onPending);
provide("onStartTask", onStartTask);
provide("onCompleteTask", onCompleteTask);
provide("changeModalSize", changeModalSize);

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
    tasksSelectionModalClass.value = "modal-2xl";
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
    tasksSelectionModalClass.value = "modal-2xl";
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

// Возвращает поток с актуальным треком (Canvas или сырая камера)
const getActiveStream = () => {
  if (isScreenSharing.value && screenStream.value) {
    return screenStream.value;
  }

  if (!localStream.value) return null;

  let activeVideoTrack = null;

  // Проверяем, что canvasStream существует и его видеодорожка активна (live)
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
        // Используем ideal вместо жестких рамок
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { max: 15 },
        facingMode: "user",
      },
      audio: selectedMicrophoneId.value
        ? { deviceId: { exact: selectedMicrophoneId.value } }
        : true,
    });

    rawStream.value = stream;
    localStream.value = stream;

    setTimeout(() => {
      rawVideoRef.value.srcObject = stream;
      switchBackgroundMode(authUser.value.conf_bg_mode);

      setTimeout(() => {
        initMediaPipe();
      }, 1000);
    }, 1000);

    loadMicrophones();

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
      //monitorNetworkAndAdjustQuality(myPeer);

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
      // Вызываем функцию для получения актуального потока с фоном/без
      const streamToSend = getActiveStream();

      call.answer(streamToSend);

      call.on("stream", (remoteStream) => {
        addStream(
          true,
          remoteStream,
          call.peer,
          call.metadata.userId,
          call.metadata.userInfo,
          call.metadata.isStream,
          call.metadata.isMuted,
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
          (m) => m.lesson_material_id === data.materialId,
        );

        if (selectedMaterial && taskInProgress.value === false) {
          openMaterial(selectedMaterial);
        }
      }
    });

    $socketPlugin.on("open_task", async (data) => {
      if (authUser.value.user_id !== conference.value.mentor_id) {
        if (conference.value.is_member) {
          await getConferenceTasks();

          const selectedTask = tasks.value.find(
            (t) => t.task_id === data.taskId,
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
                },
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

        toast(
          t("pages.tasks.completed_the_task", {
            name: data.userInfo.last_name + " " + data.userInfo.first_name,
            taskName: data.taskName,
          }),
          {
            toastClassName: ["custom-toast", "success"],
            timeout: 10000,
          },
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

// Функция-хелпер, которая гарантированно найдёт именно функцию-конструктор
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

const initMediaPipe = () => {
  // Получаем сам конструктор
  const SelfieSegmentationClass = getSelfieSegmentationConstructor();

  if (!SelfieSegmentationClass) {
    console.error(
      "Не удалось найти конструктор SelfieSegmentation в модуле:",
      SelfieSegmentationPkg,
    );
  } else {
    const selfieSegmentation = new SelfieSegmentationClass({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });

    selfieSegmentation.setOptions({ modelSelection: 1 });

    selfieSegmentation.onResults((results) => {
      if (!canvasRef.value) return;

      const canvas = canvasRef.value;
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      if (bgMode.value === "none") {
        // Без фона
        ctx.drawImage(results.image, 0, 0, w, h);
      } else if (bgMode.value === "blur" || bgMode.value === "image") {
        // 1. Рисуем маску человека (белый силуэт)
        ctx.drawImage(results.segmentationMask, 0, 0, w, h);

        // 2. Оставляем ТОЛЬКО человека внутри маски
        ctx.globalCompositeOperation = "source-in";
        ctx.drawImage(results.image, 0, 0, w, h);

        // 3. Рисуем фон ПОД человеком
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
          // Заполняем весь Canvas фоновой картинкой (cover)
          drawImageCover(ctx, bgImageRef.value, w, h);
        }
      }

      ctx.restore();
    });

    const renderFrame = async () => {
      if (rawVideoRef.value && rawVideoRef.value.readyState >= 2) {
        const video = rawVideoRef.value;
        const canvas = canvasRef.value;

        // Автоматически подгоняем Canvas под реальное разрешение камеры (например, 720x1280 на телефоне или 1280x720 на ноутбуке)
        if (video.videoWidth && video.videoHeight) {
          if (
            canvas.width !== video.videoWidth ||
            canvas.height !== video.videoHeight
          ) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
        }

        if (bgMode.value !== "none" && selfieSegmentation) {
          await selfieSegmentation.send({ image: video });
        } else if (bgMode.value === "none" && canvas) {
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
  }
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

// Возвращает координаты для вписывания видео по центру Canvas с сохранением пропорций (Contain)
const getCenteredVideoRect = (
  videoWidth,
  videoHeight,
  canvasWidth,
  canvasHeight,
) => {
  const videoRatio = videoWidth / videoHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let renderWidth, renderHeight, offsetX, offsetY;

  if (videoRatio < canvasRatio) {
    // Вертикальное видео (например, со смартфона)
    renderHeight = canvasHeight;
    renderWidth = canvasHeight * videoRatio;
    offsetX = (canvasWidth - renderWidth) / 2;
    offsetY = 0;
  } else {
    // Горизонтальное видео
    renderWidth = canvasWidth;
    renderHeight = canvasWidth / videoRatio;
    offsetX = 0;
    offsetY = (canvasHeight - renderHeight) / 2;
  }

  return { x: offsetX, y: offsetY, w: renderWidth, h: renderHeight };
};

const adjustCanvasSize = () => {
  if (!rawVideoRef.value || !canvasRef.value) return;

  const video = rawVideoRef.value;
  const canvas = canvasRef.value;

  // Берем РЕАЛЬНОЕ разрешение видеопотока с камеры устройства
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  // Если размеры определились и они отличаются от текущего Canvas
  if (
    videoWidth &&
    videoHeight &&
    (canvas.width !== videoWidth || canvas.height !== videoHeight)
  ) {
    canvas.width = videoWidth;
    canvas.height = videoHeight;
  }
};

const setConferenceMode = (mode) => {
  confMode.value = mode;
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
    })
    .then((response) => {
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
              const streamToSend = getActiveStream();

              const outgoingCall = myPeer.call(user.peerId, streamToSend, {
                metadata: {
                  userId: authUser.value.user_id,
                  userInfo: authUserInfo,
                  isStream: isStream.value,
                  isMuted: isMuted.value,
                },
              });

              outgoingCall.on("stream", (remoteStream) => {
                addStream(
                  true,
                  remoteStream,
                  outgoingCall.peer,
                  user.userId,
                  user.userInfo,
                  user.isStream,
                  user.isMuted,
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
    },
  );
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

  if (rawStream.value !== null) {
    rawStream.value.getTracks().forEach((track) => track.stop());
  }

  localStream.value = null;
  screenStream.value = null;
  rawStream.value = null;
  streams.value = [];
  $socketPlugin.disconnect();

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (selfieSegmentation) selfieSegmentation.close();
};

const removeStream = (peerId) => {
  const streamToRemove = streams.value.find((s) => s.peer_id === peerId);

  if (streamToRemove) {
    streams.value = streams.value.filter((s) => s.peer_id !== peerId);

    if (authUser.value.user_id === conference.value.mentor_id) {
      busyLearners.value = busyLearners.value.filter(
        (l) => l.userId !== streamToRemove.user_id,
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

    $socketPlugin.emit("toggle-video", {
      peerId: myPeer.id,
      isStream: isStream.value,
    });
  } else {
    toast(t("errors.media.camera_error"), {
      toastClassName: ["custom-toast", "danger"],
      timeout: 10000,
    });
  }
};

const toggleMute = () => {
  if (!localStream.value) {
    toast(t("errors.media.camera_error"), {
      toastClassName: ["custom-toast", "danger"],
      timeout: 10000,
    });
    return;
  }

  // 1. Инвертируем состояние
  const newMutedState = !isMuted.value;
  isMuted.value = newMutedState;

  // 2. Управляем enabled у основного потока
  const mainAudioTrack = localStream.value.getAudioTracks()[0];
  if (mainAudioTrack) {
    mainAudioTrack.enabled = !newMutedState;
  }

  // 3. Также отключаем/включаем аудиотрек во всех установленных PeerJS соединениях
  Object.values(peers).forEach((call) => {
    // Получаем отправщик медиаданных (RTCRtpSender)
    const peerConnection = call.peerConnection;
    if (peerConnection) {
      peerConnection.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === "audio") {
          sender.track.enabled = !newMutedState;
        }
      });
    }
  });

  // 4. Обновляем локальное состояние и отправляем событие на сокет
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

        // Проверяем, что соединение существует и не закрыто
        if (pc && pc.connectionState !== "closed") {
          // Ищем сендер нужного типа (видео или аудио)
          const sender = pc.getSenders().find((s) => {
            if (s.track) {
              return s.track.kind === kind;
            }
            // Если трек у сендера временно null, пытаемся определить по видео-каналу
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

const loadMicrophones = async () => {
  await navigator.mediaDevices.getUserMedia({ audio: true });

  const devices = await navigator.mediaDevices.enumerateDevices();

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

const switchMicrophone = async (micDeviceId) => {
  selectedMicrophoneId.value = micDeviceId;
  localStorage.setItem("micdeviceid", micDeviceId);

  const audioStream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: { exact: micDeviceId } },
    video: false,
  });

  const newAudioTrack = audioStream.getAudioTracks()[0];

  newAudioTrack.enabled = !isMuted.value;

  Object.values(peers).forEach((call) => {
    const sender = call.peerConnection
      .getSenders()
      .find((s) => s.track?.kind === "audio");

    if (sender) {
      sender.replaceTrack(newAudioTrack);
    }
  });

  const oldTrack = localStream.value.getAudioTracks()[0];
  if (oldTrack) {
    oldTrack.stop();
    localStream.value.removeTrack(oldTrack);
  }

  localStream.value.addTrack(newAudioTrack);
};

const trackMicrophone = async (stream) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  await audioContext.audioWorklet.addModule("/scripts/volume-processor.js");

  const microphone = audioContext.createMediaStreamSource(stream);
  const volumeProcessor = new AudioWorkletNode(
    audioContext,
    "volume-processor",
  );

  microphone.connect(volumeProcessor);
  volumeProcessor.connect(audioContext.destination);

  volumeProcessor.port.onmessage = (event) => {
    volume.value = Math.ceil(event.data);

    myStream.value.volume = volume.value;

    // if (!isMuted.value && streams.value.length > 1 && volume.value >= 50) {
    //   $socketPlugin.emit("microphone-volume", {
    //     peerId: myPeer.id,
    //     volume: volume.value,
    //   });
    // }
  };
};

const updateVolume = (() => {
  let timeoutId = null;
  return (data) => {
    const findStream = streams.value.find((s) => s.peer_id === data.peerId);
    if (findStream) {
      findStream.volume = data.volume;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        findStream.volume = 0;
      }, 100);
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

const debounceConferenceSettings = debounceHandler(
  () => setUserConferenceSettings(),
  1000,
);

const reloadPage = () => {
  window.location.reload();
};

onMounted(() => {
  navigator.mediaDevices.addEventListener("devicechange", (event) => {
    loadMicrophones();
  });

  getConference();

  const handleBeforeUnload = (event) => {
    event.preventDefault();
    event.returnValue = "";
    return "";
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  onUnmounted(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  });
});

onBeforeUnmount(() => {
  navigator.mediaDevices.removeEventListener("devicechange", (event) => {
    loadMicrophones();
  });

  if (localStream) {
    stopLocalStream();
  }
});
</script>
