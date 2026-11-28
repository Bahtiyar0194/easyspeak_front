<template>
  <!-- Первая загрузка — скелетон раскладки, повторные — лоадер поверх -->
  <loader v-if="pending && loaded" :className="'full-overlay'" :showPendingText="true" />
  <template v-if="!loaded">
    <div class="col-span-12">
      <div class="skeleton h-9 w-80 max-w-full mb-2"></div>
      <div class="skeleton h-4 w-44"></div>
    </div>
    <div class="col-span-12 lg:col-span-7 flex flex-col gap-3">
      <div class="skeleton h-7 w-56"></div>
      <div v-for="i in 3" :key="i" class="skeleton h-28 w-full !rounded-xl"></div>
    </div>
    <div class="col-span-12 lg:col-span-5">
      <div class="skeleton h-96 w-full !rounded-xl"></div>
    </div>
  </template>
  <client-only v-if="loaded">
    <template v-if="showQuiz && dashboard.quiz">
      <div class="col-span-12 relative">
        <div class="custom-grid">
          <div class="col-span-12 md:col-span-4 md:col-start-5">
            <div
              class="bg-active border-inactive rounded-2xl py-8 px-6 relative overflow-hidden flex flex-col justify-center items-center gap-4 text-center min-h-[480px] duration-300"
            >
              <loader
                v-if="pendingQuiz"
                :className="'overlay'"
                :showPendingText="true"
              />
              <canvas id="confetti-canvas"></canvas>
              <template v-if="currentStep === 1">
                <h3
                  class="mb-0 duration-300 select-none"
                  :class="
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 -translate-y-6'
                  "
                >
                  {{ authUser.first_name }}, {{ $t("welcome") }} 👋
                </h3>

                <p
                  class="mb-0 text-lg delay-[200ms] duration-300 select-none"
                  :class="
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 -translate-y-6'
                  "
                >
                  {{ $t("pages.quiz.do_you_want_to_know_your_level") }}
                </p>
              </template>

              <template v-else-if="currentStep === 2">
                <h3
                  class="duration-300 select-none"
                  :class="
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 -translate-y-6'
                  "
                >
                  {{ $t("pages.quiz.what_is_your_level") }}
                </h3>

                <div
                  v-for="(l, lessonIndex) in dashboard.quiz.lessons"
                  :key="lessonIndex"
                  class="w-full duration-300"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                  :style="{ transitionDelay: `${300 + lessonIndex * 200}ms` }"
                >
                  <button type="button"
                    @click="selectLevel(l.lesson_id)"
                    class="!w-full !py-5 !rounded-2xl duration-300 hover:scale-[1.03]"
                    :class="
                      selectedLevel === l.lesson_id
                        ? 'btn-primary pointer-events-none'
                        : 'btn-light'
                    "
                  >
                    <div class="flex flex-col">
                      <b class="text-lg">{{ l.lesson_name }}</b>
                      <span class="text-xs">({{ l.quiz_level_name }})</span>
                    </div>
                  </button>
                </div>

                <div
                  class="w-full duration-300"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                  :style="{
                    transitionDelay: `${400 + dashboard.quiz.lessons.length * 200}ms`,
                  }"
                >
                  <button type="button"
                    @click="selectLevel(0)"
                    class="!w-full !py-5 !rounded-2xl duration-300 hover:scale-[1.03]"
                    :class="
                      selectedLevel === 0
                        ? 'btn-primary pointer-events-none'
                        : 'btn-light'
                    "
                  >
                    <div class="flex flex-col">
                      <b class="text-lg">{{ $t("i_dont_know") }}</b>
                    </div>
                  </button>
                </div>
              </template>

              <template v-else-if="currentStep === 3">
                <div
                  class="w-full duration-300"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                >
                  <p class="select-none mb-0">
                    <b>{{ $t("pages.tasks.language_proficiency_test") }}</b>
                  </p>
                </div>

                <div
                  class="w-full duration-300 delay-[300ms]"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                >
                  <p class="text-2xl select-none mb-0">
                    <b
                      >{{ $t("your_choice") }}:
                      <span class="text-success">{{
                        selectedLevel === 0
                          ? $t("i_dont_know")
                          : dashboard.quiz.lessons.find(
                              (l) => l.lesson_id === selectedLevel,
                            ).quiz_level_name
                      }}</span></b
                    >
                  </p>
                </div>

                <div
                  class="w-full duration-300 delay-[500ms]"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                >
                  <p class="select-none mb-0">
                    {{ $t("pages.tasks.count") }}: <b>{{ tasks.length }}</b>
                  </p>
                </div>

                <div
                  class="w-full duration-300 delay-[700ms]"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                >
                  <p class="select-none mb-0">
                    {{ $t("pages.tasks.completed_tasks") }}:
                    <b>{{ completedTasksCount }}</b>
                  </p>
                </div>

                <div
                  class="w-full duration-300 delay-[800ms]"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                >
                  <progressBar
                    v-if="tasks.length > 0 && completedTasksCount > 0"
                    :progressPercentage="
                      (completedTasksCount / tasks.length) * 100
                    "
                    :wrapClass="'!my-4'"
                    :showPercentage="true"
                    :className="'sm success'"
                  />
                </div>
              </template>

              <template v-if="currentStep === 4">
                <div
                  class="w-full duration-300"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                >
                  <p class="font-medium text-xl select-none mb-0">
                    {{ $t("pages.tasks.your_result") }}:
                  </p>
                </div>
                <div
                  class="w-full flex justify-center duration-300 delay-[300ms]"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                >
                  <circleProgressBar
                    :progress="totalCompletedTasksPercent"
                    :className="'w-24 h-24'"
                    :textClass="'text-normal text-xl'"
                    :duration="3000"
                  />
                </div>

                <!-- <div
                  class="w-full duration-300 delay-[500ms]"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                >
                  <p class="text-xl mb-0">
                    {{
                      totalCompletedTasksPercent >=
                      currentLevel.next_level_threshold
                        ? $t("pages.courses.next_recommend_level")
                        : $t("pages.courses.recommend_level")
                    }}
                    <b class="text-success">{{
                      recommendRoute.target.lesson_name
                    }}</b>
                  </p>
                </div> -->

                <div
                  class="w-full duration-300 delay-[500ms]"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                >
                  <p
                    v-html="
                      sanitize(
                        totalCompletedTasksPercent >=
                          currentLevel.next_level_threshold
                          ? currentLevel.next_level_recommendation
                          : currentLevel.current_level_recommendation,
                      )
                    "
                    class="mb-0"
                  ></p>
                </div>

                <div
                  class="w-full duration-300 delay-[700ms]"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                >
                  <div class="flex flex-col gap-2">
                    <p class="mb-0 font-medium">
                      {{ $t("pages.quiz.recommend_route") }}:
                    </p>

                    <div
                      class="flex items-center justify-center gap-4 flex-wrap select-none"
                    >
                      <!-- 1. Пройденные уровни -->
                      <span
                        v-for="passedItem in recommendRoute.passed"
                        :key="passedItem.lesson_id"
                        class="text-success font-medium"
                      >
                        <span class="line-through">{{
                          passedItem.lesson_name
                        }}</span>
                        ✓
                        <span>→</span>
                      </span>

                      <!-- 2. Целевой (Рекомендуемый) уровень -->
                      <span
                        class="rounded-2xl px-4 py-0.5 bg-success text-white font-medium"
                      >
                        <template v-if="recommendRoute.target === 'ielts'"
                          >IELTS</template
                        >
                        <template v-else>{{
                          recommendRoute.target.lesson_name
                        }}</template>
                      </span>

                      <!-- 3. Следующий уровень (если есть) -->
                      <template v-if="recommendRoute.next">
                        <span>→</span>
                        <span class="text-inactive font-medium">
                          <template v-if="recommendRoute.next === 'ielts'"
                            >IELTS</template
                          >
                          <template v-else>{{
                            recommendRoute.next.lesson_name
                          }}</template>
                        </span>
                      </template>
                    </div>
                  </div>
                </div>
              </template>

              <template v-if="currentStep === 5">
                <h3
                  class="duration-300 select-none mb-0"
                  :class="
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 -translate-y-6'
                  "
                >
                  🎁 {{ $t("pages.quiz.marketing.you_have_gift") }}
                </h3>

                <div
                  class="w-full duration-300 delay-[200ms]"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                >
                  <p
                    v-html="
                      $t('pages.quiz.marketing.available_gift', {
                        count: dashboard.quiz.free_club_lessons_count,
                      })
                    "
                    class="select-none"
                  ></p>
                </div>

                <div
                  class="w-full duration-300 delay-[400ms]"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                >
                  <p class="mb-0 font-medium select-none">
                    {{ $t("pages.quiz.marketing.choose_the_days") }}
                  </p>
                </div>

                <div
                  class="w-full duration-300 delay-[600ms]"
                  :class="[
                    animated
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 !-translate-y-6',
                  ]"
                >
                  <scrollFadeContainer :maxHeight="300" :fadeSize="60">
                    <scheduleTable
                      :schedule="upcomingLessons"
                      :miniTable="true"
                      :openEventModal="openEventModal"
                      :acceptConference="acceptConference"
                      :showPoster="false"
                      :mode="'stack'"
                    />
                    <button type="button"
                      class="btn btn-primary btn-sm mt-4"
                      @click="goToDashboard(false)"
                    >
                      🚀 {{ $t("pages.dashboard.go_to_dashboard") }}
                    </button>
                  </scrollFadeContainer>
                </div>
              </template>

              <div
                class="duration-300"
                :class="
                  animated
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 !-translate-y-6'
                "
                :style="{
                  transitionDelay: `${currentStep === 2 ? 400 + dashboard.quiz.lessons.length * 200 : 800}ms`,
                }"
              >
                <button type="button"
                  v-if="currentStep < 5"
                  class="btn !rounded-3xl !px-6"
                  :class="[
                    currentStep === 4 && freeLessons > 0
                      ? 'bg-yellow-300 !text-yellow-700'
                      : 'btn-primary',
                    {
                      disabled:
                        (currentStep === 2 && selectedLevel === null) ||
                        disabledButton === true,
                    },
                  ]"
                  @click="
                    currentStep === 3
                      ? completedTasksCount === tasks.length
                        ? nextStep()
                        : startTheTest()
                      : currentStep === 4 && freeLessons === 0
                        ? goToDashboard(true)
                        : nextStep()
                  "
                >
                  <template v-if="currentStep === 4 && freeLessons > 0"
                    >🎁</template
                  >
                  <i
                    v-else-if="currentStep === 4 && freeLessons === 0"
                    class="pi pi-flag"
                  ></i>
                  <i v-else class="pi pi-arrow-right"></i>
                  {{
                    currentStep === 3
                      ? completedTasksCount === tasks.length
                        ? $t("pages.tasks.find_out_the_result")
                        : completedTasksCount > 0
                          ? $t("pages.tasks.continue_the_test")
                          : $t("pages.tasks.start_the_test")
                      : currentStep === 4
                        ? freeLessons > 0
                          ? $t("pages.quiz.marketing.get_gift")
                          : $t("pages.tasks.finish_the_test")
                        : $t("continue")
                  }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- <div class="col-span-12">
      <h2 class="mb-0">
        🚀 {{ authUser?.first_name }},
        <span class="lowercase">{{ $t("welcome") }}</span>
      </h2>
    </div> -->

      <!-- <roleProvider :roles="[1, 2, 3]">
      <div
        v-if="schoolStore.schoolData && schoolStore.schoolData.all_users_count"
        class="col-span-12 md:col-span-6 lg:col-span-3"
      >
        <div class="card p-6">
          <h4 class="mb-2">{{ $t("pages.users.title") }}</h4>
          <div class="flex gap-6 flex-wrap">
            <div class="flex flex-col gap-1">
              <span class="text-inactive">{{ $t("all") }}:</span>

              <span class="font-bold text-4xl text-corp">
                <animatedNumber
                  :number="schoolStore.schoolData.all_users_count"
                />
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-inactive">{{ $t("active") }}:</span>

              <span class="font-bold text-4xl text-success">
                <animatedNumber
                  :number="schoolStore.schoolData.active_users_count"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </roleProvider> -->

      <!-- 1. Приветствие + дата + быстрый переход к расписанию -->
      <div class="col-span-12">
        <div class="db-hello">
          <div class="min-w-0">
            <h2 class="db-hello-title">
              {{ authUser?.first_name }},
              <span class="lowercase">{{ $t("welcome") }}</span>
            </h2>
            <p class="db-hello-date">{{ todayLabel }}</p>
          </div>
          <nuxt-link
            v-if="!schoolStore.isAiSchoolDomain"
            class="btn btn-light"
            :to="localePath('/dashboard/schedule')"
          >
            <i class="pi pi-calendar-clock" aria-hidden="true"></i>
            {{ $t("pages.schedule.show_entire_schedule") }}
          </nuxt-link>
        </div>
      </div>

      <!-- 2. Занятия, которые идут прямо сейчас — самое важное действие -->
      <div
        v-if="dashboard.current_lessons && dashboard.current_lessons.length"
        class="col-span-12"
      >
        <div class="db-section-head">
          <h3 class="db-section-title">
            <span class="live-dot" aria-hidden="true"></span>
            {{ $t("pages.dashboard.live_now") }}
          </h3>
        </div>
        <div class="flex flex-col gap-4">
          <currentConferenceCard
            v-for="conference in dashboard.current_lessons"
            :key="conference.uuid"
            :conference="conference"
            :timeIsUp="timeIsUp"
          />
        </div>
      </div>

      <!-- 3. Неоплаченные занятия — заметно, но компактно -->
      <div v-if="paymentLessons.length > 0" class="col-span-12">
        <div class="db-notice">
          <div class="db-notice-icon" aria-hidden="true">
            <i class="pi pi-credit-card"></i>
          </div>
          <p class="mb-0 flex-1 font-medium">
            {{
              $t("pages.dashboard.unpaid_lessons", {
                count: paymentLessons.length,
              })
            }}
          </p>
          <button
            type="button"
            class="btn btn-primary"
            @click="openPaymentModal()"
          >
            {{ $t("pages.lessons.pay_for_lessons") }}
          </button>
        </div>
      </div>

      <!-- 4. Баннер Telegram — компактный, его можно скрыть -->
      <div v-if="showTelegramBanner" class="col-span-12">
        <div class="db-telegram">
          <!-- Декоративный самолётик Telegram -->
          <svg
            class="db-telegram-plane"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M21.9 4.3 18.7 19.4c-.2 1.1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.2 13l-4.8-1.5c-1-.3-1.1-1 .2-1.5l18.8-7.3c.9-.3 1.7.2 1.5 1.6Z"
            />
          </svg>

          <span class="db-telegram-logo" aria-hidden="true">
            <i class="pi pi-telegram"></i>
          </span>

          <div class="flex-1 min-w-0 flex flex-col gap-2.5">
            <div>
              <h4 class="text-white mb-1">{{ $t("telegram.banner.title") }}</h4>
              <p class="text-white/85 text-sm mb-0">
                {{ $t("telegram.banner.subtitle") }}
              </p>
            </div>
            <ul class="db-telegram-perks">
              <li>
                <i class="pi pi-bell" aria-hidden="true"></i>
                {{ $t("telegram.banner.perk_lessons") }}
              </li>
              <li>
                <i class="pi pi-check-circle" aria-hidden="true"></i>
                {{ $t("telegram.banner.perk_results") }}
              </li>
              <li>
                <i class="pi pi-calendar" aria-hidden="true"></i>
                {{ $t("telegram.banner.perk_schedule") }}
              </li>
            </ul>
          </div>

          <a
            class="db-telegram-cta"
            target="_blank"
            rel="noopener"
            :href="`https://t.me/${config.public.telegramBotName}?start=${localeProperties.code}`"
          >
            <i class="pi pi-telegram" aria-hidden="true"></i>
            {{ $t("telegram.connect.connect") }}
            <i class="pi pi-arrow-right text-xs" aria-hidden="true"></i>
          </a>
          <button
            type="button"
            class="db-telegram-close"
            :title="$t('close')"
            :aria-label="$t('close')"
            @click="hideTelegramBanner()"
          >
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <!-- 5. Ближайшие занятия (слева, шире) + AI-ассистент (справа) -->
      <div class="col-span-12 lg:col-span-7">
        <div class="db-section-head">
          <h3 class="db-section-title">
            <i class="pi pi-calendar text-corp" aria-hidden="true"></i>
            {{ $t("pages.lessons.upcoming_lessons") }}
            <span
              v-if="upcomingLessons.length"
              class="db-count"
              >{{ upcomingLessons.length }}</span
            >
          </h3>
        </div>

        <scrollFadeContainer
          v-if="upcomingLessons.length"
          :maxHeight="560"
          :fadeSize="120"
        >
          <scheduleTable
            :schedule="upcomingLessons"
            :openEventModal="openEventModal"
            :acceptConference="acceptConference"
            :showPoster="true"
            :mode="'stack'"
          />
        </scrollFadeContainer>

        <emptyState
          v-else
          :text="$t('pages.lessons.no_upcoming_lessons')"
          image="/images/calendar-search.svg"
        />
      </div>

      <div class="col-span-12 lg:col-span-5">
        <aiExplainer :explainMode="'speaking'" />
      </div>
    </template>

    <modal
      :show="eventModalIsVisible"
      :onClose="() => closeEventModal()"
      :className="'modal-xl'"
      :showLoader="pendingEvent"
      :showPendingText="true"
      :closeOnClickSelf="true"
    >
      <template v-slot:header_content>
        <h3>{{ currentEvent?.lesson_name || currentEvent?.topic }}</h3>
      </template>
      <template v-if="currentEvent" v-slot:body_content>
        <canvas id="confetti-canvas"></canvas>
        <div class="custom-grid">
          <template v-if="acceptedConference">
            <div class="col-span-12">
              <h5>{{ $t("pages.conference.accept.success.title") }}</h5>
              <p>
                {{
                  $t("pages.conference.accept.success.description", {
                    conf_name: currentEvent?.topic || "",
                  })
                }}
              </p>
            </div>

            <div class="col-span-12">
              <b>{{ $t("add_to_calendar") }}:</b>
            </div>

            <div class="col-span-12">
              <add-to-calendar-button
                :name="currentEvent?.topic"
                :startDate="currentEvent.date"
                :endDate="currentEvent.date_end"
                :startTime="currentEvent.time"
                :endTime="currentEvent.time_end"
                timeZone="Asia/Almaty"
                :location="conferenceUrl"
                :description="`${$t('pages.conference.accept.success.url_desc_1')} [url]${conferenceUrl}|${$t('pages.conference.accept.success.url_desc_2')}![/url]`"
                options="'Apple','Google','iCal','Outlook.com'"
                buttonsList
                buttonStyle="round"
              ></add-to-calendar-button>
            </div>

            <div class="col-span-12"></div>
          </template>
          <template v-else>
            <div
              class="col-span-12"
              v-if="schoolStore.isAiSchoolDomain && currentEvent.poster_file"
            >
              <img v-skeleton
                class="w-full rounded-xl"
                :src="
                  currentEvent.poster_file
                    ? config.public.apiBase +
                      '/media/get/' +
                      currentEvent.poster_file
                    : null
                "
              />
            </div>
            <div class="col-span-12">
              <template v-if="!schoolStore.isAiSchoolDomain">
                <p class="text-inactive">
                  <i class="pi pi-book"></i> {{ $t("pages.courses.course") }}:
                  <b class="text-active"
                    >{{ currentEvent.course_name }} -
                    {{ currentEvent.level_name }}</b
                  >
                </p>
                <p class="text-inactive">
                  <i class="pi pi-users"></i> {{ $t("pages.groups.group") }}:
                  <b class="text-active">{{ currentEvent.group_name }}</b>
                </p>
              </template>
              <template v-else>
                <p class="text-inactive">
                  <i class="pi pi-book"></i> {{ $t("pages.courses.title") }}:
                  <b class="text-active">
                    <span class="text-list">
                      <span
                        v-for="(level, lIndex) in currentEvent.levels"
                        :key="lIndex"
                      >
                        {{ level.level_name }}
                      </span>
                    </span>
                  </b>
                </p>
              </template>

              <div class="flex gap-x-1 items-center mb-2">
                <span class="text-inactive"
                  ><i class="pi pi-user"></i> {{ $t("mentor") }}:</span
                >

                <userTag
                  :user="{
                    last_name:
                      currentEvent.mentor_last_name ||
                      currentEvent.moderator_last_name ||
                      '',
                    first_name:
                      currentEvent.mentor_first_name ||
                      currentEvent.moderator_first_name ||
                      '',
                    avatar:
                      currentEvent.mentor_avatar ||
                      currentEvent.moderator_avatar ||
                      '',
                  }"
                  :closable="false"
                />
              </div>
              <p class="text-inactive">
                <i class="pi pi-clock"></i> {{ $t("start_time") }}:
                <b class="text-active">{{
                  currentEvent.start_time_formatted
                }}</b>
              </p>
              <p class="text-inactive mb-0">
                <i class="pi pi-clock"></i> {{ $t("end_time") }}:
                <b class="text-active">{{ currentEvent.end_time_formatted }}</b>
              </p>
            </div>
            <div v-if="currentEvent.members.length" class="col-span-12">
              <p>
                {{ $t("pages.conference.participants") }}:
                <b>{{ currentEvent.members.length }}</b>
              </p>

              <div v-if="currentEvent.members.length > 0" class="btn-wrap">
                <userTag
                  v-for="(member, index) in currentEvent.members"
                  :key="index"
                  :user="member"
                  :closable="false"
                />
              </div>
            </div>

            <div
              v-if="
                schoolStore.isAiSchoolDomain &&
                currentEvent.is_active === false &&
                currentEvent.is_learner === true
              "
              class="col-span-12"
            >
              <button type="button"
                @click="acceptConference(currentEvent.uuid)"
                class="btn btn-success"
                :class="currentEvent.is_member === true ? 'disabled' : ''"
              >
                <i class="pi pi-check"></i>
                {{
                  currentEvent.is_member === true
                    ? $t("pages.conference.accept.already_exists_alt")
                    : $t("pages.conference.accept.title")
                }}
              </button>
            </div>

            <div
              class="col-span-12"
              v-if="
                (currentEvent.is_free === 1 || currentEvent.is_member) &&
                currentEvent.is_active === true
              "
            >
              <nuxt-link
                class="btn btn-success"
                :to="localePath('/dashboard/conference/' + currentEvent.uuid)"
              >
                <i class="pi pi-video"></i>
                {{ $t("pages.conference.join") }}
              </nuxt-link>
            </div>
          </template>
        </div>
      </template>
    </modal>

    <modal
      :show="paymentModalIsVisible"
      :onClose="() => closePaymentModal()"
      :className="paymentModalSize"
      :showLoader="pendingPayment"
      :showPendingText="true"
      :pendingText="
        currentStep === paymentSteps.length
          ? $t('pages.payment.please_wait')
          : $t('loading')
      "
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4>{{ $t("pages.lessons.pay_for_lessons_alt") }}</h4>
      </template>
      <template v-slot:body_content>
        <form
          @submit.prevent="
            currentStep === paymentSteps.length
              ? createCryptogram()
              : handlePayment()
          "
          ref="paymentFormRef"
        >
          <steps :currentStep="currentStep" :steps="paymentSteps">
            <div
              v-for="(step, index) in paymentSteps"
              :key="index"
              :class="currentStep === index + 1 ? 'block' : 'hidden'"
            >
              <component
                v-if="step.component"
                :is="step.component"
                v-bind="step.props"
              ></component>
            </div>
          </steps>

          <div class="btn-wrap justify-end mt-4">
            <button
              v-if="currentStep > 1"
              class="btn btn-light"
              @click="backToStep(currentStep - 1)"
              type="button"
            >
              <i class="pi pi-arrow-left"></i>
              {{ $t("back") }}
            </button>

            <button class="btn btn-primary" type="submit">
              <template v-if="currentStep !== paymentSteps.length">
                <i class="pi pi-arrow-right"></i>
                {{ $t("continue") }}
              </template>
              <template v-else>
                <i class="pi pi-credit-card"></i>
                {{ $t("pages.payment.to_pay") }}
              </template>
            </button>
          </div>
        </form>
      </template>
    </modal>

    <modal
      :show="taskModalIsVisible"
      :onClose="() => closeModalByUser()"
      :className="taskModalClass + ' min-h-60 select-none'"
      :showLoader="pendingTaskModal"
      :showPendingText="true"
      :loaderOpacityFull="true"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h5>{{ task ? task.task_slug : "" }}</h5>
      </template>
      <template v-slot:body_content>
        <taskSkeleton v-if="taskBooting" />
        <component
          :is="currentTaskModal"
          v-bind="taskModalProps"
          @vue:mounted="handleTaskMounted"
        />
      </template>
    </modal>
  </client-only>
</template>

<script setup>
import { useNotify } from "~/composables/useNotify";
import { useRouter } from "nuxt/app";
import { sanitize } from "../../utils/sanitize";
import steps from "../../components/ui/steps.vue";
import firstStep from "../../components/payment/lesson/firstStep.vue";
import secondStep from "../../components/payment/lesson/secondStep.vue";
import modal from "../../components/ui/modal.vue";
import progressBar from "../../components/ui/progressBar.vue";
import circleProgressBar from "../../components/ui/circleProgressBar.vue";
import userTag from "../../components/ui/userTag.vue";
import animatedNumber from "../../components/ui/animatedNumber.vue";
import currentConferenceCard from "../../components/conference/currentConferenceCard.vue";
import {
  onConferencesChanged,
  checkConferenceLiveNow,
} from "~/composables/useConferenceLive";
import userAvatar from "../../components/ui/userAvatar.vue";
import roleProvider from "../../components/ui/roleProvider.vue";
import loader from "../../components/ui/loader.vue";
import emptyState from "../../components/ui/emptyState.vue";
import scrollFadeContainer from "../../components/ui/scrollFadeContainer.vue";
import aiExplainer from "../../components/lesson/components/ai/aiExplainer.vue";
import scheduleTable from "../../components/schedule/scheduleTable.vue";
import { startConfetti, stopConfetti } from "../../utils/confetti.js";

const config = useRuntimeConfig();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const schoolStore = useSchoolStore();
const pending = ref(true);
const notify = useNotify();
const { t, localeProperties } = useI18n();
const authUser = useSanctumUser();
const dashboard = ref([]);
// true после первой успешной загрузки: до этого показываем скелетон раскладки.
const loaded = ref(false);

// «Понедельник, 24 ноября» на языке интерфейса.
const todayLabel = computed(() => {
  const label = new Intl.DateTimeFormat(
    localeProperties.value.code === "kk" ? "kk-KZ" : "ru-RU",
    { weekday: "long", day: "numeric", month: "long" },
  ).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
});

// Баннер Telegram можно скрыть — он вернётся через 14 дней.
const TG_BANNER_KEY = "tgBannerHiddenUntil";
const TG_BANNER_HIDE_DAYS = 14;
const telegramBannerHidden = ref(true); // до onMounted не мигаем баннером

const showTelegramBanner = computed(
  () =>
    !telegramBannerHidden.value &&
    authUser.value &&
    !authUser.value.telegram &&
    !schoolStore.isAiSchoolDomain,
);

const hideTelegramBanner = () => {
  telegramBannerHidden.value = true;
  try {
    localStorage.setItem(
      TG_BANNER_KEY,
      String(Date.now() + TG_BANNER_HIDE_DAYS * 24 * 60 * 60 * 1000),
    );
  } catch {}
};
const paymentLessons = ref([]);

const currentEvent = ref(null);
const pendingEvent = ref(false);
const eventModalIsVisible = ref(false);

const paymentModalIsVisible = ref(false);
const paymentModalSize = ref("modal-4xl");

const checkout = ref(null);
const pendingPayment = ref(false);
const paymentFormRef = ref(null);
const cryptogram = ref("");
const acceptedConference = ref(false);
const errors = ref([]);

const animated = ref(false);
const selectedLevel = ref(null);
const disabledButton = ref(false);

const firstEntry = ref(true);
const showQuiz = ref(false);
const pendingQuiz = ref(false);

const currentLevel = computed(() => {
  if (selectedLevel.value === null || !dashboard.value?.quiz?.lessons?.length) {
    return null;
  }

  // Если выбран 0, берем первый уровень массива, иначе ищем по lesson_id
  return selectedLevel.value === 0
    ? dashboard.value.quiz.lessons[0]
    : (dashboard.value.quiz.lessons.find(
        (l) => l.lesson_id === selectedLevel.value,
      ) ?? null);
});

const recommendLevel = computed(() => {
  const level = currentLevel.value;
  const quiz = dashboard.value?.quiz;

  if (!level || !quiz) return null;

  // Если порог набран — ищем следующий уровень
  if (totalCompletedTasksPercent.value >= level.next_level_threshold) {
    const currentIndex = quiz.findIndex((l) => l.lesson_id === level.lesson_id);
    const nextLevel = quiz[currentIndex + 1];

    // Если следующий уровень существует — предлагаем его, иначе — 'ielts'
    return nextLevel ?? "ielts";
  }

  // Если порог НЕ набран — остаемся на текущем уровне
  return level;
});

const recommendRoute = computed(() => {
  const level = currentLevel.value;
  const quiz = dashboard.value?.quiz?.lessons;

  if (!level || !quiz) return null;

  const currentIndex = quiz.findIndex((l) => l.lesson_id === level.lesson_id);
  const isPassed =
    totalCompletedTasksPercent.value >= level.next_level_threshold;

  // 1. Определяем индекс рекомендуемого уровня
  // Если порог сдан — рекомендуем следующий, иначе — текущий
  const targetIndex = isPassed ? currentIndex + 1 : currentIndex;

  // 2. Ищем рекомендуемый уровень в массиве (или назначаем IELTS, если вышли за пределы)
  const targetLevel =
    quiz[targetIndex] ?? (targetIndex >= quiz.length ? "ielts" : null);

  // 3. Формируем массив пройденных уровней (все, что строго до targetIndex)
  const passedLevels = quiz.slice(0, targetIndex);

  // 4. Формируем следующий уровень после рекомендуемого (для перспективы)
  const nextLevel =
    quiz[targetIndex + 1] ?? (targetIndex + 1 === quiz.length ? "ielts" : null);

  return {
    passed: passedLevels, // Список пройденных уровней (массив)
    target: targetLevel, // Текущий рекомендуемый уровень (объект или 'ielts')
    next: nextLevel, // Следующий уровень после рекомендуемого (объект, 'ielts' или null)
    isPassedCurrent: isPassed, // Флаг: набрал ли порог на текущем тесте
  };
});

// ===== Ближайшие уроки: закончившийся урок исчезает без перезагрузки =====
// Бэкенд отдаёт ends_in_seconds — сколько осталось до конца урока на момент
// ответа. Отсчитываем от времени загрузки, поэтому часовой пояс и часы
// устройства ученика не влияют.
const dashboardLoadedAt = ref(0);
const clockNow = ref(0);
const CLOCK_TICK = 30 * 1000;
let clockTimer = null;

const upcomingLessons = computed(() =>
  (dashboard.value?.upcoming_lessons || []).filter(
    (lesson) =>
      lesson.ends_in_seconds == null ||
      dashboardLoadedAt.value + lesson.ends_in_seconds * 1000 > clockNow.value,
  ),
);

onMounted(() => {
  clockTimer = setInterval(() => {
    clockNow.value = Date.now();
  }, CLOCK_TICK);
});

// ===== Начался / закончился урок — обновляем без перезагрузки страницы =====
// Меню (layouts/dashboard.vue) раз в 30 секунд проверяет набор текущих
// конференций. Если он изменился — тихо подтягиваем только уроки: без
// лоадера и не трогая тест и оплату, которые ученик может проходить.
let refreshingLessons = false;

const refreshLessons = async () => {
  // Пока идёт полная загрузка — она и так принесёт свежие уроки
  if (refreshingLessons || pending.value || !loaded.value) return;
  refreshingLessons = true;

  try {
    const response = await $axiosPlugin.get("dashboard/get");
    dashboard.value.current_lessons = response.data.current_lessons;
    dashboard.value.upcoming_lessons = response.data.upcoming_lessons;
    dashboardLoadedAt.value = Date.now();
    clockNow.value = Date.now();

    // Список к оплате не меняем, пока открыто окно оплаты
    if (!paymentModalIsVisible.value) {
      paymentLessons.value = (response.data.upcoming_lessons || []).filter(
        (l) =>
          l.is_active === false &&
          l.is_bought_status != null &&
          l.is_bought_status.is_bought === false,
      );
    }
  } catch (e) {
    // Фоновое обновление: при ошибке оставляем то, что уже показано
  } finally {
    refreshingLessons = false;
  }
};

onConferencesChanged(refreshLessons);

onBeforeUnmount(() => {
  clearInterval(clockTimer);
});

const freeLessons = computed(() => {
  const lessons = dashboard.value?.upcoming_lessons;

  if (lessons && lessons.length) {
    // filter создает новый массив из подходящих элементов, у которого берем length
    return lessons.filter((l) => Boolean(l.is_free)).length;
  }

  return 0; // или null, в зависимости от логики вашего UI
});

const tasks = ref([]);
const task = ref(null);

const completedTasksCount = ref(0);
const completedTasksPercent = ref(0);

const totalCompletedTasksPercent = computed(() => {
  if (completedTasksCount.value > 0 && tasks.value.length > 0) {
    return completedTasksPercent.value / tasks.value.length;
  }

  return 0;
});

const pendingTaskModal = ref(false);
const taskModalClass = ref("modal-lg");
const taskModalProps = ref({});
const taskModalIsVisible = ref(false);
const currentTaskModal = shallowRef(null);

import taskSkeleton from "../../components/lesson/components/tasks/taskSkeleton.vue";
import {
  loadTaskComponent,
  prefetchTaskComponents,
  useTaskBooting,
} from "~/composables/useTaskComponents";

// Скелетон, пока открывается задание (компонент + данные)
const {
  booting: taskBooting,
  start: startTaskBooting,
  handlePending: handleTaskPending,
  handleMounted: handleTaskMounted,
  stop: stopTaskBooting,
} = useTaskBooting();

const onPending = (state) => {
  // Первая загрузка задания — скелетон вместо общего лоадера
  if (handleTaskPending(state)) return;
  pendingTaskModal.value = state;
};

const onStartTask = () => {
  console.log("task is started");
};

const onCompleteTask = () => {
  getDashboard();
  saveQuizResult(false);
};

const changeModalSize = (size) => {
  taskModalClass.value = size;
};

const closeModal = () => {
  taskModalIsVisible.value = false;
  pendingTaskModal.value = false;
  stopTaskBooting();
  task.value = null;
};

const closeModalByUser = () => {
  taskModalIsVisible.value = false;
  pendingTaskModal.value = false;
  stopTaskBooting();
  currentTaskModal.value = null;
  task.value = null;
};

const openTask = (currentTask) => {
  task.value = currentTask;
  //taskResultModalIsVisible.value = false;
  openTaskModal(task.value.task_type_component, "execution", {
    task: currentTask,
    lessonType: currentLevel.value.lesson_type_slug,
  });
};

const openTaskModal = (component, action, props = {}) => {
  taskModalIsVisible.value = true;
  pendingTaskModal.value = false;
  startTaskBooting();
  currentTaskModal.value = loadTaskComponent(action, component);
  taskModalProps.value = props;
};

const startTheTest = () => {
  for (let index = 0; index < tasks.value.length; index++) {
    const task = tasks.value[index];
    if (task.task_result && !task.task_result.answers) {
      openTask(task);
      break;
    }
  }
};

provide("onPending", onPending);
provide("onStartTask", onStartTask);
provide("onCompleteTask", onCompleteTask);
provide("changeModalSize", changeModalSize);
provide("closeModal", closeModal);

provide("tasks", tasks);
provide("completedTasksCount", completedTasksCount);
provide("openTask", openTask);

const today = new Date().toISOString().slice(0, 10);

useHead({
  title: t("pages.dashboard.title"),
  meta: [{ name: "description", content: t("pages.home.description") }],
  script: [
    {
      key: "tiptoppay-checkout",
      src: `${config.public.tiptopPayCheckoutURL}?v=${today}`,
      defer: true,
    },
  ],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const paymentSteps = [
  {
    title: t("pages.lessons.lessons_list"),
    component: firstStep,
    modalSize: "4xl",
    props: { paymentLessons },
  },
  {
    title: t("pages.payment.accept_payment"),
    component: secondStep,
    modalSize: "xl",
    props: {
      paymentLessons,
      errors,
    },
  },
];

const currentStep = ref(1);

const backToStep = (step) => {
  currentStep.value = step;
  paymentModalSize.value = "modal-" + paymentSteps[step - 1].modalSize;
};

const getDashboard = async () => {
  pending.value = true;
  pendingQuiz.value = true;

  await $axiosPlugin
    .get("dashboard/get")
    .then((response) => {
      dashboard.value = response.data;
      dashboardLoadedAt.value = Date.now();
      clockNow.value = Date.now();
      createPaymentScript();

      paymentLessons.value = dashboard.value.upcoming_lessons.filter(
        (l) =>
          l.is_active === false &&
          l.is_bought_status != null &&
          l.is_bought_status.is_bought === false,
      );

      if (dashboard.value.quiz && dashboard.value.quiz.lessons.length) {
        if (dashboard.value.quiz) {
          selectLevel(selectedLevel.value);

          if (firstEntry.value === true) {
            showQuiz.value = true;
            firstEntry.value = false;

            if (
              dashboard.value.quiz.result &&
              dashboard.value.quiz.result.is_completed === 0
            ) {
              selectLevel(dashboard.value.quiz.result.lesson_id);
              currentStep.value = 3;
            }
          }
        }
      }

      pending.value = false;
      pendingQuiz.value = false;
      loaded.value = true;
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

const goToDashboard = (forced) => {
  if (forced === true) {
    saveQuizResult(true);
    showQuiz.value = false;
  } else {
    if (
      dashboard.value?.upcoming_lessons?.some(
        (l) => l.is_free === 1 && l.is_member,
      )
    ) {
      showQuiz.value = false;
    } else {
      notify("danger", t("pages.quiz.marketing.choose_the_one"));
    }
  }
};

const saveQuizResult = async (completed) => {
  pendingQuiz.value = true;

  await $axiosPlugin
    .post("/dashboard/save_quiz_result", {
      lesson_id: currentLevel.value.lesson_id,
      is_completed: completed,
    })
    .then((response) => {
      pendingQuiz.value = false;
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

const createPaymentScript = async () => {
  if (schoolStore.schoolData.tiptoppay.public_id_marketplace) {
    // Теперь объект tiptop гарантированно доступен
    checkout.value = new tiptop.Checkout({
      publicId: schoolStore.schoolData.tiptoppay.public_id_marketplace,
      container: paymentFormRef.value,
    });
  }
};

const createCryptogram = async () => {
  pendingPayment.value = true;
  await checkout.value
    .createPaymentCryptogram()
    .then((c) => {
      cryptogram.value = c;
      setTimeout(() => {
        if (cryptogram.value) {
          handlePayment();
        }
      }, 200);
    })
    .catch((err) => {
      errors.value = err;
      pendingPayment.value = false;
    });
};

const openEventModal = (uuid) => {
  eventModalIsVisible.value = true;
  currentEvent.value = {
    ...dashboard.value.upcoming_lessons.find((e) => e.uuid === uuid),
  };
};

const closeEventModal = () => {
  eventModalIsVisible.value = false;
  currentEvent.value = null;
  acceptedConference.value = false;
};

const openPaymentModal = () => {
  paymentModalSize.value = "modal-" + paymentSteps[0].modalSize;
  paymentModalIsVisible.value = true;
  currentStep.value = 1;
};

const closePaymentModal = () => {
  paymentModalIsVisible.value = false;
  currentEvent.value = null;
  currentStep.value = 1;
  errors.value = [];
  pendingPayment.value = false;
  cryptogram.value = "";
};

const handlePayment = async () => {
  pendingPayment.value = true;
  const formData = new FormData(paymentFormRef.value);
  formData.append("lang", localeProperties.value.code);
  formData.append("lessons", JSON.stringify(paymentLessons.value));
  formData.append("cryptogram", cryptogram.value);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("payment/lesson/handle", formData)
    .then((response) => {
      errors.value = [];
      if (response.data.step) {
        currentStep.value = response.data.step + 1;
        paymentModalSize.value =
          "modal-" + paymentSteps[response.data.step].modalSize;
        pendingPayment.value = false;
      } else {
        if (response.data.Success === true) {
          //   getSchool().then(() => {
          router.push({
            path: "/dashboard/payment-result",
            query: {
              success: true,
            },
          });
          //   });
        } else {
          if (response.data.Model.AcsUrl) {
            router.push({
              path: "/dashboard/payment-result/3ds",
              query: {
                AcsUrl: response.data.Model.AcsUrl,
                PaReq: response.data.Model.PaReq,
                MD: response.data.Model.TransactionId,
                TermUrl:
                  config.public.apiBase + "/payment/tiptop/handle3ds/learner",
              },
            });
          } else {
            router.push({
              path: "/dashboard/payment-result",
              query: {
                success: false,
                reason: response.data.Model.ReasonCode,
                message: response.data.Model.CardHolderMessage,
              },
            });
          }
        }
      }
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingPayment.value = false;
        } else {
          router.push({
            path: "/error",
            query: {
              status: err.response.status,
              message: err.response.data.message || err.response.data.Message,
              url: err.request.responseURL,
            },
          });
        }
      } else {
        router.push("/error");
      }
    });
};

const acceptConference = async (uuid) => {
  pendingEvent.value = true;

  if (!currentEvent.value) {
    openEventModal(uuid);
  }

  await $axiosPlugin
    .post("conferences/accept/" + uuid)
    .then((response) => {
      pendingEvent.value = false;
      acceptedConference.value = true;
      startConfetti("confetti-canvas");
      getDashboard();
      // Ученик записался — урок мог стать для него текущим
      checkConferenceLiveNow();

      if (currentLevel.value) {
        saveQuizResult(true);
      }
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 400) {
          pendingEvent.value = false;

          if (err.response.data.message) {
            notify("danger", err.response.data.message === "not_bought"
                ? t("pages.conference.not_bought", {
                    courses: currentEvent.value.levels
                      .map((l) => l.level_name)
                      .join(", "),
                  })
                : t("pages.conference.accept." + err.response.data.message));
          }
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

const requestUrl = useRequestURL();

const conferenceUrl = computed(() => {
  if (currentEvent.value) {
    return `${requestUrl.origin}/dashboard/conference/${currentEvent.value.uuid}`;
  }

  return null;
});

const timeIsUp = () => {
  setTimeout(() => {
    getDashboard();
  }, 1000);
};

const nextStep = () => {
  animated.value = false;
  disabledButton.value = true;

  setTimeout(() => {
    disabledButton.value = false;
    currentStep.value++;
    setTimeout(() => {
      animated.value = true;

      if (currentStep.value === 4) {
        const threshold = currentLevel.value.next_level_threshold;

        if (totalCompletedTasksPercent.value >= threshold) {
          setTimeout(() => {
            startConfetti("confetti-canvas");
          }, 300);
        }
      }
    }, 200);
  }, 1200);
};

const selectLevel = (lesson_id) => {
  if (lesson_id !== null) {
    selectedLevel.value = lesson_id;

    completedTasksCount.value = 0;
    completedTasksPercent.value = 0;

    if (lesson_id === 0) {
      tasks.value = dashboard.value.quiz.lessons[0].tasks;
    } else {
      tasks.value = dashboard.value.quiz.lessons.find(
        (l) => l.lesson_id === lesson_id,
      ).tasks;
    }

    if (tasks.value.length > 0) {
      // Компоненты заданий теста — заранее, до «Начать тест»
      prefetchTaskComponents(
        "execution",
        tasks.value.map((item) => item.task_type_component),
      );

      for (let taskIndex = 0; taskIndex < tasks.value.length; taskIndex++) {
        const task = tasks.value[taskIndex];
        task.taskIndex = taskIndex;
        if (task.task_result && task.task_result.completed === true) {
          completedTasksCount.value++;
          completedTasksPercent.value += task.task_result.percentage;
        }
      }
    }
  }
};

onMounted(async () => {
  getDashboard();

  try {
    const hiddenUntil = Number(localStorage.getItem(TG_BANNER_KEY) || 0);
    telegramBannerHidden.value = hiddenUntil > Date.now();
  } catch {
    telegramBannerHidden.value = false;
  }

  // Импортируем библиотеку только на стороне клиента (в браузере)
  await import("add-to-calendar-button");

  setTimeout(() => {
    animated.value = true;
  }, 1000);
});

onBeforeUnmount(() => {
  stopConfetti();
});
</script>
