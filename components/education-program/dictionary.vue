<template>
  <div class="custom-grid">
    <!-- Панель: фильтр и счётчик слева, главное действие справа -->
    <div class="col-span-12">
      <div class="list-toolbar">
        <button
          type="button"
          @click="showHideWordSearchFilter"
          class="btn"
          :class="searchFilter ? 'btn-outline-primary' : 'btn-light'"
          :aria-pressed="searchFilter"
          :title="searchFilter ? $t('hide_search_filter') : $t('show_search_filter')"
        >
          <i class="pi pi-filter" aria-hidden="true"></i>
          {{ $t("filter") }}
        </button>
        <span v-if="words.total" class="text-sm text-inactive">
          {{ $t("found") }}: <b class="text-active">{{ words.total }}</b>
        </span>

        <roleProvider :roles="[1]">
          <button
            type="button"
            class="btn btn-primary ml-auto"
            @click="addModalIsVisible = true"
          >
            <i class="pi pi-plus" aria-hidden="true"></i>
            {{ $t("pages.dictionary.add_word") }}
          </button>
        </roleProvider>
      </div>
    </div>

    <div
      class="col-span-12 lg:col-span-3"
      :class="searchFilter ? 'block' : 'hidden'"
    >
      <stickyBox>
        <div class="card p-4">
          <h5>{{ $t("pages.dictionary.search_filter") }}</h5>
          <form @submit.prevent="debounceReset" ref="searchFormRef">
            <div class="custom-grid">
              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-align-left"></i>
                  <input
                    type="text"
                    name="word"
                    placeholder=" "
                    autocomplete="off"
                    @input="debounceWords"
                  />
                  <label>{{ $t("pages.dictionary.word") }}</label>
                </div>
              </div>

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="bi bi-braces"></i>
                  <input
                    type="text"
                    name="transcription"
                    placeholder=" "
                    autocomplete="off"
                    @input="debounceWords"
                  />
                  <label>{{ $t("pages.dictionary.transcription") }}</label>
                </div>
              </div>

              <div class="col-span-12">
                <multipleSelect
                  :className="'form-group-border select active label-active'"
                  :icon="'pi pi-book'"
                  :label="$t('pages.courses.course')"
                  :items="attributes.courses"
                  :optionName="'courses[]'"
                  :optionValue="'course_id'"
                  :optionLabel="'course_name'"
                  :onChange="debounceWords"
                />
              </div>

              <div class="col-span-12">
                <multipleSelect
                  :className="'form-group-border select active label-active'"
                  :icon="'pi pi-user'"
                  :label="$t('operator')"
                  :items="attributes.operators"
                  :optionName="'operators[]'"
                  :optionValue="'user_id'"
                  :optionLabel="'full_name'"
                  :avatar="true"
                  :onChange="debounceWords"
                />
              </div>

              <div class="col-span-12">
                <multipleSelect
                  :className="'form-group-border select active label-active'"
                  :icon="'pi pi-hourglass'"
                  :label="$t('status')"
                  :items="attributes.statuses"
                  :optionName="'statuses[]'"
                  :optionValue="'status_type_id'"
                  :optionLabel="'status_type_name'"
                  :onChange="debounceWords"
                />
              </div>

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-calendar"></i>
                  <input
                    type="date"
                    name="created_at_from"
                    @input="debounceWords"
                    placeholder=" "
                  />
                  <label>{{ $t("created_at_from") }}</label>
                </div>
              </div>

              <div class="col-span-12">
                <div class="form-group-border active">
                  <i class="pi pi-calendar"></i>
                  <input
                    type="date"
                    name="created_at_to"
                    @input="debounceWords"
                    placeholder=" "
                  />
                  <label>{{ $t("created_at_to") }}</label>
                </div>
              </div>

              <div class="col-span-12">
                <button type="submit" class="btn btn-light full">
                  <i class="pi pi-filter-slash" aria-hidden="true"></i>
                  {{ $t("reset_search_filter") }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </stickyBox>
    </div>

    <div
      ref="listTopRef"
      class="col-span-12 relative scroll-mt-24"
      :class="searchFilter && 'lg:col-span-9'"
    >
      <!-- Скелетон: первая загрузка или переход на другую страницу -->
      <listSkeleton
        v-if="pending && (paging || !words.data?.length)"
        :columns="wordTableHeads.length + 1"
        :avatar="false"
        :statusColumn="false"
        :rows="paging ? skeletonRows : 8"
      />

      <!-- Фильтр / сортировка / сохранение: список на месте, по нему перелив -->
      <div
        v-else-if="words.data?.length"
        :class="{ 'list-refreshing': pending }"
        :aria-busy="pending || undefined"
      >
        <span v-if="pending" class="sr-only">{{ $t("loading") }}</span>

        <!-- Компьютер: таблица -->
        <div class="table table-striped table-sm selectable max-md:!hidden">
          <table ref="tableRef">
            <thead>
              <tr>
                <sortTableHead
                  v-for="(head, index) in wordTableHeads"
                  :key="index"
                  :title="head.title"
                  :keyName="head.keyName"
                  :sortKey="sortKey"
                  :sortDirection="sortDirection"
                  :sortType="head.sortType"
                  :sortHandler="debounceWords"
                  @update:sortKey="sortKey = $event"
                  @update:sortDirection="sortDirection = $event"
                />
                <th></th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in words.data"
                :key="item.word_id"
                @click="getWord(item.word_id)"
              >
                <td class="font-medium">{{ item.word }}</td>
                <td class="text-inactive">
                  <template v-if="item.transcription"
                    >[{{ item.transcription }}]</template
                  >
                </td>
                <td>{{ item.course_name }}</td>
                <td>
                  <div class="flex gap-x-2 items-center">
                    <userAvatar
                      :padding="0.5"
                      :className="'w-6 h-6'"
                      :user="{
                        last_name: item.operator_last_name,
                        first_name: item.operator_first_name,
                        avatar: item.operator_avatar,
                      }"
                    />
                    {{ item.operator_last_name }} {{ item.operator_first_name }}
                  </div>
                </td>
                <td class="whitespace-nowrap">{{ formatDate(item.created_at) }}</td>
                <td>
                  <span class="status-pill" :class="item.status_color">
                    {{ item.status_type_name }}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-x-3">
                    <audioButton
                      v-if="item.audio_file"
                      :src="mediaUrl(item.audio_file)"
                      @click.stop
                    />
                    <img
                      v-if="item.image_file"
                      v-skeleton="'1/1'"
                      :src="mediaUrl(item.image_file)"
                      class="media-thumb"
                      loading="lazy"
                      alt=""
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Телефон: карточки вместо широкой таблицы -->
        <ul class="entity-list md:hidden">
          <li v-for="item in words.data" :key="item.word_id">
            <div
              class="entity-card cursor-pointer"
              role="button"
              tabindex="0"
              @click="getWord(item.word_id)"
              @keydown.enter.self="getWord(item.word_id)"
            >
              <img
                v-if="item.image_file"
                v-skeleton="'1/1'"
                :src="mediaUrl(item.image_file)"
                class="media-thumb !w-11 !h-11"
                loading="lazy"
                alt=""
              />
              <span v-else class="task-icon !w-11 !h-11 !text-lg" aria-hidden="true">
                <i class="bi bi-alphabet"></i>
              </span>
              <span class="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                <span class="font-semibold truncate">{{ item.word }}</span>
                <span v-if="item.transcription" class="text-xs text-inactive truncate"
                  >[{{ item.transcription }}]</span
                >
                <span class="text-xs text-inactive truncate">{{
                  item.course_name
                }}</span>
                <span class="status-pill wrap mt-1" :class="item.status_color">
                  {{ item.status_type_name }}
                </span>
              </span>
              <audioButton
                v-if="item.audio_file"
                :src="mediaUrl(item.audio_file)"
                @click.stop
              />
            </div>
          </li>
        </ul>
      </div>

      <!-- Ничего не нашлось по фильтру -->
      <emptyState
        v-else-if="filtered"
        :text="$t('nothing_was_found_for_your_query')"
        icon="bi bi-search"
      >
        <button type="button" class="btn btn-light" @click="resetWordSearchFilter">
          <i class="pi pi-filter-slash" aria-hidden="true"></i>
          {{ $t("reset_search_filter") }}
        </button>
      </emptyState>

      <!-- Словарь пуст -->
      <emptyState
        v-else
        :text="$t('pages.dictionary.empty_title')"
        :hint="$t('pages.dictionary.empty_hint')"
        icon="bi bi-alphabet"
      >
        <roleProvider :roles="[1]">
          <button
            type="button"
            class="btn btn-primary"
            @click="addModalIsVisible = true"
          >
            <i class="pi pi-plus" aria-hidden="true"></i>
            {{ $t("pages.dictionary.add_word") }}
          </button>
        </roleProvider>
      </emptyState>

      <!-- Вне блока списка: при переходе по страницам остаётся на месте -->
      <div
        v-if="words.data?.length"
        class="btn-wrap mt-4"
        :class="{ 'pointer-events-none opacity-60': pending }"
      >
        <pagination
          :items="words"
          :setItems="getWords"
          :onSelect="(count) => (perPage = count)"
        />
        <client-only>
          <tableToExcelButton
            :table="tableRef"
            :fileName="
              $t('pages.dictionary.title') + ' - ' + new Date().toLocaleString()
            "
            :className="'btn-sm'"
          />
        </client-only>
      </div>
    </div>
  </div>

  <modal
    :show="addModalIsVisible"
    :onClose="() => closeAddModal()"
    :className="'modal-4xl'"
    :showLoader="pendingAdd"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <div class="pr-2">
        <h4>{{ $t("pages.dictionary.add_word_title") }}</h4>
      </div>
    </template>
    <template v-slot:body_content>
      <div class="mt-2">
        <form @submit.prevent="addWordSubmit" ref="addFormRef">
          <div class="custom-grid">
            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  autoComplete="new-word"
                  v-model="newWord.word"
                  name="word"
                  type="text"
                  placeholder=" "
                  @change="translateNew()"
                />
                <label :class="{ 'label-error': errors.word }">
                  {{
                    errors.word ? errors.word[0] : $t("pages.dictionary.word")
                  }}
                </label>
              </div>

              <!-- Автоперевод: что происходит и «Перевести заново» -->
              <div class="auto-translate-hint" aria-live="polite">
                <span v-if="auto.translating" class="text-corp">
                  <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
                  {{ $t("auto_translate.translating") }}
                </span>
                <template v-else-if="newWord.word.trim()">
                  <span v-if="auto.manual.size" class="text-inactive">{{
                    $t("auto_translate.manual_kept")
                  }}</span>
                  <button
                    type="button"
                    class="auto-translate-btn"
                    @click="translateNew(true)"
                  >
                    <i class="bi bi-stars" aria-hidden="true"></i>
                    {{ $t("auto_translate.retranslate") }}
                  </button>
                </template>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="bi bi-braces"></i>
                <input
                  autoComplete="new-word-transcription"
                  v-model="newWord.transcription"
                  name="transcription"
                  type="text"
                  placeholder=" "
                  @input="auto.markManual('transcription')"
                />
                <label :class="{ 'label-error': errors.transcription }">
                  {{
                    errors.transcription
                      ? errors.transcription[0]
                      : $t("pages.dictionary.transcription")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  autoComplete="new-word-kk-translate"
                  v-model="newWord.kk"
                  name="word_kk"
                  type="text"
                  placeholder=" "
                  @input="auto.markManual('kk')"
                />
                <label :class="{ 'label-error': errors.word_kk }">
                  {{
                    errors.word_kk
                      ? errors.word_kk[0]
                      : $t("pages.dictionary.translate.kk")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  autoComplete="new-word-ru-translate"
                  v-model="newWord.ru"
                  name="word_ru"
                  type="text"
                  placeholder=" "
                  @input="auto.markManual('ru')"
                />
                <label :class="{ 'label-error': errors.word_ru }">
                  {{
                    errors.word_ru
                      ? errors.word_ru[0]
                      : $t("pages.dictionary.translate.ru")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border select active label-active">
                <i class="pi pi-book"></i>
                <select name="course_id">
                  <option selected disabled value="">
                    {{ $t("pages.courses.choose_a_course") }}
                  </option>
                  <option
                    v-for="course in attributes.all_courses"
                    :key="course.course_id"
                    :value="course.course_id"
                  >
                    {{ course.course_name }}
                  </option>
                </select>
                <label :class="{ 'label-error': errors.course_id }">
                  {{
                    errors.course_id
                      ? errors.course_id[0]
                      : $t("pages.courses.course")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12 lg:col-span-6">
              <div class="card p-4">
                <p class="mb-2 font-medium">{{ $t("file.image.select") }}</p>
                <div class="custom-grid">
                  <uploadOrSelectFile
                    :radioName="'upload_new_word_image_file'"
                    :fileInputName="'new_word_image_file_name'"
                    :showFileInputName="false"
                    :uploadingFileName="'new_word_image_file'"
                    :libraryFileName="'new_word_image_file_id'"
                    :accept="'image'"
                    :icon="'pi pi-image'"
                    :errors="errors"
                  />
                </div>
              </div>
            </div>

            <div class="col-span-12 lg:col-span-6">
              <div class="card p-4">
                <p class="mb-2 font-medium">{{ $t("file.audio.select") }}</p>
                <div class="custom-grid">
                  <uploadOrSelectFile
                    :allowGenerate="true"
                    :generateText="newWord.word"
                    :generateFileInputName="'generate_new_word_audio_file'"
                    :generateFileError="$t('pages.dictionary.required')"
                    :radioName="'upload_new_word_audio_file'"
                    :fileInputName="'new_word_audio_file_name'"
                    :showFileInputName="false"
                    :uploadingFileName="'new_word_audio_file'"
                    :libraryFileName="'new_word_audio_file_id'"
                    :accept="'audio'"
                    :icon="'pi pi-volume-up'"
                    :errors="errors"
                  />
                </div>
              </div>
            </div>

            <div class="col-span-12">
              <!-- Пока ИИ заполняет поля — не отправляем полуготовую форму -->
              <button
                class="btn btn-primary"
                type="submit"
                :disabled="auto.translating"
              >
                <i class="pi pi-check"></i>
                {{ $t("add") }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </template>
  </modal>

  <modal
    :show="wordModalIsVisible"
    :onClose="() => (wordModalIsVisible = false)"
    :className="word?.image_file ? 'modal-3xl' : 'modal-lg'"
    :showLoader="pendingWord"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <h3>{{ word?.word }}</h3>
    </template>
    <template v-if="word" v-slot:body_content>
      <div class="custom-grid">
        <div v-if="word.image_file" class="col-span-3 lg:col-span-4">
          <img
            v-skeleton="'1/1'"
            class="w-full h-auto rounded-xl"
            :src="mediaUrl(word.image_file)"
            alt=""
          />
        </div>
        <div
          :class="word.image_file ? 'col-span-9 lg:col-span-8' : 'col-span-12'"
        >
          <div class="flex flex-col gap-y-3">
            <!-- Плеер — только если у слова есть озвучка -->
            <audioPlayerWithWave
              v-if="word.audio_file"
              :src="mediaUrl(word.audio_file)"
            />
            <p v-if="word.transcription" class="mb-0">
              <span class="text-inactive"
                >{{ $t("pages.dictionary.transcription") }}:
              </span>
              <b>[{{ word.transcription }}]</b>
            </p>
            <p class="mb-0">
              <span class="text-inactive"
                >{{ $t("pages.courses.course") }}:
              </span>
              <b>{{ word.course_name }}</b>
            </p>

            <p
              v-for="(translate, index) in word.translates"
              :key="index"
              class="mb-0"
            >
              <span class="text-inactive"
                >{{ $t("pages.dictionary.translate." + translate.lang_tag) }}:
              </span>
              <b>{{ translate.word_translate }}</b>
            </p>

            <div class="flex gap-x-2 items-center">
              <p class="mb-0">
                <span class="text-inactive">{{ $t("operator") }}: </span>
              </p>
              <userTag v-if="word.operator" :user="word.operator" />
            </div>
          </div>
        </div>
      </div>

      <roleProvider :roles="[1]">
        <div class="btn-wrap mt-4">
          <button type="button" @click="getEditWord" class="btn btn-outline-primary">
            <i class="pi pi-pencil"></i>
            {{ $t("edit") }}
          </button>
        </div>
      </roleProvider>
    </template>
  </modal>

  <modal
    :show="editModalIsVisible"
    :onClose="() => closeEditModal()"
    :className="'modal-4xl'"
    :showLoader="pendingEdit"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <div class="pr-2">
        <h4>{{ $t("pages.dictionary.edit_word_title") }}</h4>
      </div>
    </template>
    <template v-if="word" v-slot:body_content>
      <div class="mt-2">
        <form @submit.prevent="editWordSubmit" ref="editFormRef">
          <div class="custom-grid">
            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  autoComplete="edit-word"
                  v-model="word.word"
                  name="word"
                  type="text"
                  placeholder=" "
                />
                <label :class="{ 'label-error': errors.word }">
                  {{
                    errors.word ? errors.word[0] : $t("pages.dictionary.word")
                  }}
                </label>
              </div>

              <!-- При редактировании переводы не перезаписываются молча:
                   слово изменилось — предлагаем обновить -->
              <div class="auto-translate-hint" aria-live="polite">
                <span v-if="editAuto.translating" class="text-corp">
                  <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
                  {{ $t("auto_translate.translating") }}
                </span>
                <template v-else-if="editWordChanged">
                  <span class="text-amber-600 dark:text-amber-400">{{
                    $t("auto_translate.changed")
                  }}</span>
                  <button
                    type="button"
                    class="auto-translate-btn"
                    @click="translateEdit()"
                  >
                    <i class="bi bi-stars" aria-hidden="true"></i>
                    {{ $t("auto_translate.update") }}
                  </button>
                </template>
                <button
                  v-else-if="word.word?.trim()"
                  type="button"
                  class="auto-translate-btn"
                  @click="translateEdit()"
                >
                  <i class="bi bi-stars" aria-hidden="true"></i>
                  {{ $t("auto_translate.retranslate") }}
                </button>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active">
                <i class="bi bi-braces"></i>
                <input
                  autoComplete="edit-word-transcription"
                  v-model="word.transcription"
                  name="transcription"
                  type="text"
                  placeholder=" "
                />
                <label :class="{ 'label-error': errors.transcription }">
                  {{
                    errors.transcription
                      ? errors.transcription[0]
                      : $t("pages.dictionary.transcription")
                  }}
                </label>
              </div>
            </div>

            <div
              v-for="(translate, index) in word.translates"
              :key="index"
              class="col-span-12"
            >
              <div class="form-group-border active">
                <i class="pi pi-align-left"></i>
                <input
                  :autocomplete="'edit-word-kk-translate-' + translate.lang_tag"
                  v-model="translate.word_translate"
                  :name="'word_' + translate.lang_tag"
                  type="text"
                  placeholder=" "
                />
                <label
                  :class="{
                    'label-error': errors['word_' + translate.lang_tag],
                  }"
                >
                  {{
                    errors["word_" + translate.lang_tag]
                      ? errors["word_" + translate.lang_tag][0]
                      : $t("pages.dictionary.translate." + translate.lang_tag)
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border select active label-active">
                <i class="pi pi-book"></i>
                <select name="course_id">
                  <option
                    v-for="course in attributes.all_courses"
                    :key="course.course_id"
                    :value="course.course_id"
                    :selected="word.course_id === course.course_id"
                  >
                    {{ course.course_name }}
                  </option>
                </select>
                <label :class="{ 'label-error': errors.course_id }">
                  {{
                    errors.course_id
                      ? errors.course_id[0]
                      : $t("pages.courses.course")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12 lg:col-span-6">
              <previewFileInput
                v-if="current_word_image"
                :fileType="'image'"
                :previewUrl="mediaUrl(word.image_file)"
                :onChange="() => (current_word_image = false)"
              />
              <div v-else class="card p-4">
                <p class="mb-2 font-medium">{{ $t("file.image.select") }}</p>
                <div class="custom-grid">
                  <uploadOrSelectFile
                    :radioName="'upload_edit_word_image_file'"
                    :fileInputName="'edit_word_image_file_name'"
                    :showFileInputName="false"
                    :uploadingFileName="'edit_word_image_file'"
                    :libraryFileName="'edit_word_image_file_id'"
                    :accept="'image'"
                    :icon="'pi pi-image'"
                    :errors="errors"
                  />
                </div>
              </div>
            </div>

            <div class="col-span-12 lg:col-span-6">
              <previewFileInput
                v-if="current_word_audio"
                :fileType="'audio'"
                :previewUrl="mediaUrl(word.audio_file)"
                :onChange="() => (current_word_audio = false)"
              />
              <div v-else class="card p-4">
                <p class="mb-2 font-medium">{{ $t("file.audio.select") }}</p>
                <div class="custom-grid">
                  <uploadOrSelectFile
                    :allowGenerate="true"
                    :generateText="word.word"
                    :generateFileInputName="'generate_edit_word_audio_file'"
                    :generateFileError="$t('pages.dictionary.required')"
                    :radioName="'upload_edit_word_audio_file'"
                    :fileInputName="'edit_word_audio_file_name'"
                    :showFileInputName="false"
                    :uploadingFileName="'edit_word_audio_file'"
                    :libraryFileName="'edit_word_audio_file_id'"
                    :accept="'audio'"
                    :icon="'pi pi-volume-up'"
                    :errors="errors"
                  />
                </div>
              </div>
            </div>

            <div class="col-span-12">
              <button
                class="btn btn-primary"
                type="submit"
                :disabled="editAuto.translating"
              >
                <i class="pi pi-check"></i>
                {{ $t("save") }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import uploadOrSelectFile from "../ui/uploadOrSelectFile.vue";
import previewFileInput from "../ui/previewFileInput.vue";
import audioButton from "../ui/audioButton.vue";
import audioPlayerWithWave from "../ui/audioPlayerWithWave.vue";
import userAvatar from "../ui/userAvatar.vue";
import userTag from "../ui/userTag.vue";
import modal from "../ui/modal.vue";
import emptyState from "~/components/ui/emptyState.vue";
import listSkeleton from "../ui/listSkeleton.vue";
import stickyBox from "../ui/stickyBox.vue";
import pagination from "../ui/pagination.vue";
import tableToExcelButton from "../ui/tableToExcelButton.vue";
import { debounceHandler } from "../../utils/debounceHandler";
import roleProvider from "../ui/roleProvider.vue";
import multipleSelect from "../ui/multipleSelect.vue";
import sortTableHead from "../ui/sortTableHead.vue";
import { useAutoTranslate } from "~/composables/useAutoTranslate";

const router = useRouter();
const config = useRuntimeConfig();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const { t } = useI18n();
const pending = ref(true);
const pendingAdd = ref(false);
const pendingWord = ref(false);
const pendingEdit = ref(false);
const tableRef = ref(null);
const searchFormRef = ref(null);
const addFormRef = ref(null);
const editFormRef = ref(null);
const searchFilter = ref(false);
const perPage = ref(10);
const words = ref([]);
const word = ref(null);
const attributes = ref([]);

const current_word_image = ref(false);
const current_word_audio = ref(false);

const addModalIsVisible = ref(false);
const wordModalIsVisible = ref(false);
const editModalIsVisible = ref(false);

// Новые слова — сверху
const sortKey = ref("dictionary.created_at"); // Ключ сортировки
const sortDirection = ref("desc"); // Направление сортировки: asc или desc

const mediaUrl = (file) => config.public.apiBase + "/media/get/" + file;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const wordTableHeads = [
  {
    title: t("pages.dictionary.word"),
    keyName: "dictionary.word",
    sortType: "alpha",
  },
  {
    title: t("pages.dictionary.transcription"),
    keyName: "dictionary.transcription",
    sortType: "alpha",
  },
  {
    title: t("pages.courses.course"),
    keyName: "courses_lang.course_name",
    sortType: "alpha",
  },
  {
    title: t("operator"),
    keyName: "operator.last_name",
    sortType: "alpha",
  },
  {
    title: t("created_at"),
    keyName: "dictionary.created_at",
    sortType: "numeric",
  },
  {
    title: t("status"),
    keyName: "types_of_status_lang.status_type_name",
    sortType: "alpha",
  },
];

const goToError = (err) => {
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
};

// ===== Список =====
// Переход по страницам (пагинация передаёт url) — скелетон; фильтр,
// сортировка, сохранение — перелив по текущему списку
const paging = ref(false);
const skeletonRows = ref(8);
const listTopRef = ref(null);
// Заполнен ли фильтр — чтобы отличать «ничего не найдено» от «словарь пуст»
const filtered = ref(false);

const getWords = async (url) => {
  pending.value = true;
  paging.value = Boolean(url);

  if (paging.value) {
    skeletonRows.value = words.value.data?.length || 8;
    const top = listTopRef.value?.getBoundingClientRect().top;
    if (top !== undefined && top < 0) {
      listTopRef.value.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const formData = new FormData(searchFormRef.value || undefined);
  filtered.value = [...formData.values()].some((v) => String(v).trim() !== "");
  formData.append("per_page", perPage.value);
  formData.append("sort_key", sortKey.value); // Добавляем ключ сортировки
  formData.append("sort_direction", sortDirection.value); // Добавляем направление сортировки

  if (!url) {
    url = "dictionary/get";
  }

  await $axiosPlugin
    .post(url, formData)
    .then((response) => {
      words.value = response.data;
      pending.value = false;
      paging.value = false;
    })
    .catch(goToError);
};

const getWord = async (word_id) => {
  word.value = null;
  pendingWord.value = true;
  editModalIsVisible.value = false;
  wordModalIsVisible.value = true;
  await $axiosPlugin
    .get("dictionary/get/" + word_id)
    .then((response) => {
      errors.value = [];
      word.value = response.data;

      current_word_image.value = Boolean(word.value.image_file);
      current_word_audio.value = Boolean(word.value.audio_file);

      pendingWord.value = false;
    })
    .catch(goToError);
};

// ===== Автоперевод =====
const auto = reactive(useAutoTranslate({ transcription: true }));
const editAuto = reactive(useAutoTranslate({ transcription: true }));

// Добавление: поля формы — реактивные, name остаются для FormData
const newWord = reactive({ word: "", transcription: "", kk: "", ru: "" });

// Слово ввели — ИИ заполняет транскрипцию и переводы, кроме полей,
// которые уже поправили вручную. force — «Перевести заново»: все поля
const translateNew = (force = false) =>
  auto.translate(
    newWord.word,
    (result) => {
      if (result.transcription != null) newWord.transcription = result.transcription;
      if (result.kk != null) newWord.kk = result.kk;
      if (result.ru != null) newWord.ru = result.ru;
    },
    { force },
  );

// Редактирование: переводы молча не перезаписываем. Если слово изменили —
// предлагаем обновить, по кнопке
const editOriginalWord = ref("");

const editWordChanged = computed(
  () =>
    Boolean(word.value) &&
    (word.value.word || "").trim() !== editOriginalWord.value.trim(),
);

const translateEdit = () =>
  editAuto.translate(
    word.value.word,
    (result) => {
      if (result.transcription != null) word.value.transcription = result.transcription;
      word.value.translates.forEach((translate) => {
        if (result[translate.lang_tag] != null) {
          translate.word_translate = result[translate.lang_tag];
        }
      });
      editOriginalWord.value = word.value.word;
    },
    { force: true },
  );

const getEditWord = async () => {
  editAuto.reset();
  editOriginalWord.value = word.value?.word || "";
  wordModalIsVisible.value = false;
  editModalIsVisible.value = true;
};

const getDictionaryAttributes = async () => {
  await $axiosPlugin
    .get("dictionary/get_dictionary_attributes")
    .then((response) => {
      attributes.value = response.data;
    })
    .catch(goToError);
};

const addWordSubmit = async () => {
  pendingAdd.value = true;
  const formData = new FormData(addFormRef.value);

  formData.append("operation_type_id", 9);

  await $axiosPlugin
    .post("dictionary/add", formData)
    .then(() => {
      getWords();
      closeAddModal();
    })
    .catch((err) => {
      if (err.response?.status == 422) {
        errors.value = err.response.data;
        pendingAdd.value = false;
      } else {
        goToError(err);
      }
    });
};

const editWordSubmit = async () => {
  pendingEdit.value = true;

  const formData = new FormData(editFormRef.value);

  formData.append("current_word_image", current_word_image.value);
  formData.append("current_word_audio", current_word_audio.value);
  formData.append("operation_type_id", 10);

  await $axiosPlugin
    .post("dictionary/update/" + word.value.word_id, formData)
    .then((response) => {
      errors.value = [];
      getWord(response.data.word_id);
      // Список не очищаем: обновится на месте (перелив)
      getWords();
      pendingEdit.value = false;
    })
    .catch((err) => {
      if (err.response?.status == 422) {
        errors.value = err.response.data;
        pendingEdit.value = false;
      } else {
        goToError(err);
      }
    });
};

const closeAddModal = () => {
  addModalIsVisible.value = false;
  pendingAdd.value = false;
  addFormRef.value?.reset();
  Object.assign(newWord, { word: "", transcription: "", kk: "", ru: "" });
  auto.reset();
  errors.value = [];
};

const closeEditModal = () => {
  editAuto.reset();
  editModalIsVisible.value = false;
  wordModalIsVisible.value = true;
};

const showHideWordSearchFilter = () => {
  if (searchFilter.value === true) {
    searchFilter.value = false;
    resetWordSearchFilter();
  } else {
    searchFilter.value = true;
  }
};

const resetWordSearchFilter = () => {
  searchFormRef.value?.reset();
  getWords();
};

const debounceWords = debounceHandler(() => getWords(), 1000);
const debounceReset = debounceHandler(() => resetWordSearchFilter(), 500);

onMounted(() => {
  getDictionaryAttributes();
  getWords();
});
</script>
