<script setup>
import { onMounted, ref, provide, nextTick, watch } from 'vue';
import { Icon as Iconify } from '@iconify/vue';
import { useGetFaviconURL } from '@/composables/getFaviconURL';
import { useGetTranslation } from '@/composables/getTranslation';
import BookmarkUrlSession from './components/BookmarkUrlSession.vue';
import BookmarkFolderSession from './components/BookmarkFolderSession.vue';

const props = defineProps([
  'tabTitle',
  'tabUrl',
  'bookmarkId',
  'bookmarkTitle',
  'bookmarkUrl',
  'bookmarkFolderId',
  'nodeTreeId',
  'similarBookmarks'
]);

/**
 * bookmark id
 */
const bookmarkId = ref(props.bookmarkId);

/**
 * bookmark title
 */
const bookmarkOriginTitle = ref('');
const bookmarkTitle = ref('');

// init value of bookmark title
if(bookmarkId.value) {
  bookmarkTitle.value = props.bookmarkTitle;
  bookmarkOriginTitle.value = props.bookmarkTitle;
} else {
  bookmarkTitle.value = props.tabTitle;
  bookmarkOriginTitle.value = props.tabTitle;
}

// change textarea input box height
const bookmarkTitleDOM = ref(null);

const changeHeightHandler = (dom) => {
  dom.style.height = 'auto';
  dom.style.height = `${dom.scrollHeight}px`;
}

// setting textarea height
onMounted(async () => {
  nextTick(() => {
    if (bookmarkTitleDOM.value) {
      changeHeightHandler(bookmarkTitleDOM.value);
    }
  })
})

// reset the bookmark title based on tab
// const resetBookmarkTitle = () => {
//   bookmarkTitle.value = bookmarkOriginTitle.value;
// }

/**
 * bookmark url
 */
const bookmarkOriginUrl = ref('');
provide('bookmarkOriginUrl', bookmarkOriginUrl)
const bookmarkUrl = ref('');

// init value of bookmark url
bookmarkOriginUrl.value = props.tabUrl;
if(bookmarkId.value) {
  bookmarkUrl.value = props.bookmarkUrl;
} else {
  bookmarkUrl.value = props.tabUrl;
}

// url validation state
const urlValidation = ref(true);
const setUrlValidation = (state) => {
  urlValidation.value = state;
}
provide('urlValidation', urlValidation);
provide('setUrlValidation', setUrlValidation);

/**
 * bookmark folder
 */
// the type is "old" or "new"
const selectFolderType = ref('old');

// old folder id
const bookmarkOriginFolderId = ref(props.bookmarkFolderId)
const setBookmarkOriginFolderId = (id) => {
  bookmarkOriginFolderId.value = id;
}

const bookmarkFolderId = ref(props.bookmarkFolderId);
const setBookmarkFolderId = (id) => {
  selectFolderType.value = 'old'
  bookmarkFolderId.value = id;
  newFolder.value = null // clean cache for the new folder
}

// new folder object
const newFolder = ref(null)
const setNewFolder = (newFolderObj) => {
  selectFolderType.value = 'new'
  newFolder.value = newFolderObj
}

// init the bookmarkFolderId if the tab has already bookmarked
// if (bookmarkId.value) {
//   setBookmarkOriginFolderId(props.bookmarkFolderId)
//   setBookmarkFolderId(props.bookmarkFolderId);
// }

provide('bookmarkOriginFolderId', bookmarkOriginFolderId)
provide('setBookmarkOriginFolderId', setBookmarkOriginFolderId)
provide('selectFolderType', selectFolderType)
provide('bookmarkFolderId', bookmarkFolderId)
provide('setBookmarkFolderId', setBookmarkFolderId)
provide('newFolder', newFolder)
provide('setNewFolder', setNewFolder)

/**
 * similar bookmarks
 */
const similarBookmarks = ref(props.similarBookmarks);
const showSimilarBookmarksModal = ref(false);

// stop body scroll when modal show up
const similarBookmarksContainerDOM = ref(null);

const scrollHandler = (event) => {
  event.stopPropagation()
  if (similarBookmarksContainerDOM.value) {
    if (similarBookmarksContainerDOM.value.scrollTop === 0 && event.deltaY < 0) {
      event.preventDefault();
    } else if (Math.ceil(similarBookmarksContainerDOM.value.scrollTop + similarBookmarksContainerDOM.value.clientHeight) >= similarBookmarksContainerDOM.value.scrollHeight && event.deltaY > 0) {
      event.preventDefault();
    }
  }
}

const setBookmarkInfo = (bookmarkNode) => {
  // set bookmark id
  bookmarkId.value = bookmarkNode.id;

  // set bookmark title
  bookmarkTitle.value = bookmarkNode.title;
  bookmarkOriginTitle.value = bookmarkNode.title;

  // set bookmark url
  bookmarkUrl.value = bookmarkNode.url;
  bookmarkOriginUrl.value = bookmarkNode.url;

  // set bookmark folder
  setBookmarkFolderId(bookmarkNode.parentId);
  setBookmarkOriginFolderId(bookmarkNode.parentId);

  showSimilarBookmarksModal.value = false;
}

provide('setBookmarkInfo', setBookmarkInfo)

/**
 * create bookmark
 */
const createBookmark = async () => {
  let folderNodeId;
  if (selectFolderType.value === 'new') {
    const folderNode = await chrome.bookmarks.create(newFolder.value)
    folderNodeId = folderNode.id
  } else{
    folderNodeId = bookmarkFolderId.value
  }

  await chrome.bookmarks.create({
    parentId: folderNodeId,
    title: bookmarkTitle.value,
    url: bookmarkUrl.value
  })

  // close the popup page when finish
  window.close()
}

/**
 * update bookmark
 */
const updateBook = async () => {
  if(!bookmarkId.value) return
  // if change the folder
  // first move the bookmark to the folder
  if(bookmarkFolderId.value !== bookmarkOriginFolderId.value || selectFolderType.value === 'new') {
    let folderNodeId;
    if(selectFolderType.value === 'new') {
      // create the new folder first
      const folderNode = await chrome.bookmarks.create(newFolder.value)
      folderNodeId = folderNode.id
    } else {
      folderNodeId = bookmarkFolderId.value
    }
    // then move the bookmark to the folder
    await chrome.bookmarks.move(
      bookmarkId.value,
      {
        parentId: folderNodeId
      }
    )
  }

  // then update the bookmark content
  if(bookmarkTitle.value !== bookmarkOriginTitle.value || bookmarkUrl.value !== bookmarkOriginUrl.value) {
    await chrome.bookmarks.update(
      bookmarkId.value,
      {
        title: bookmarkTitle.value,
        url: bookmarkUrl.value
      }
    )
  }

  // close the popup page when finish
  window.close()
}

/**
 * delete bookmark
 */
const showDeleteBookmarkPrompt = ref(false)

const deleteBookmark = async () => {
  if(bookmarkId.value) {
    await chrome.bookmarks.remove(bookmarkId.value)
    bookmarkId.value = null
  }
  showDeleteBookmarkPrompt.value = false

  // close the popup page when finish
  window.close()
}

/**
 * open introduction page
 */
const openIntroductionPageHandler = () => {
  chrome.tabs.create({
    url: 'https://nutmark.benbinbin.com'
  })
}
</script>

<template>
  <div>
    <header class="px-2 py-2 grid grid-cols-3 gap-2 sticky top-0 inset-x-0 bg-gray-50 border-b shadow">
      <div class="flex justify-start items-center">
        <button :title="useGetTranslation('popup_header_info_btn_title')" class="p-1 text-gray-500 hover:text-white bg-gray-100 hover:bg-gray-400 rounded-full transition-colors duration-300"
        @click="openIntroductionPageHandler">
          <Iconify icon="ph:info-fill" class="w-5 h-5"></Iconify>
        </button>
      </div>
      <div class="flex justify-center items-center">
        <button :disabled="similarBookmarks.length===0" :title="useGetTranslation('popup_header_show_similar_bookmarks_btn_title')" class="px-3 py-1 flex justify-center items-center gap-1 border rounded-full transition-colors duration-300"
        :class="bookmarkId ? 'bg-amber-100/60 hover:bg-amber-200 border-amber-200 text-amber-500 hover:text-amber-600' : 'bg-emerald-100/60 hover:bg-emerald-200 text-emerald-500 border-emerald-200 hover:text-emerald-600'"
        @click="showSimilarBookmarksModal=true">
          <img v-if="bookmarkUrl" :src="useGetFaviconURL(bookmarkUrl)" :alt="useGetTranslation('bookmark_favicon_img_alt')" class="w-4 h-4">
          <Iconify v-else icon="ph:planet-fill" class="w-4 h-4 text-purple-500"></Iconify>
          <span class="text-xs font-bold">{{ bookmarkId ? useGetTranslation('popup_header_bookmark_state_saved') : useGetTranslation('popup_header_bookmark_state_unsaved') }}</span>
          <Iconify v-if="similarBookmarks.length > 0" icon="fluent:more-circle-32-filled" class="w-4 h-4"></Iconify>
        </button>
      </div>
      <div class="flex justify-end items-center gap-2">
        <button v-if="bookmarkId" :title="useGetTranslation('popup_header_delete_bookmarks_btn_title')" class="px-2 py-1.5 flex justify-center items-center gap-1 text-white bg-red-500 hover:bg-red-600 rounded transition-colors duration-300" @click="showDeleteBookmarkPrompt=true">
          <Iconify icon="ic:round-delete" class="w-4 h-4"></Iconify>
          <span class="text-xs font-bold">{{ useGetTranslation('popup_header_delete_bookmarks_btn_content') }}</span>
        </button>
        <button v-if="bookmarkId && (bookmarkTitle !== bookmarkOriginTitle || bookmarkUrl !== bookmarkOriginUrl || bookmarkOriginFolderId !== bookmarkFolderId || selectFolderType === 'new')"
        :title="useGetTranslation('popup_header_update_bookmarks_btn_title')"
        :disabled="!bookmarkUrl || !urlValidation"
        class="group px-2 py-1.5 flex justify-center items-center gap-1 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded transition-all duration-300"
        :class="(!bookmarkUrl || !urlValidation) ? 'opacity-10' : ''"
        @click="updateBook">
          <Iconify icon="ic:round-save" class="w-4 h-4"></Iconify>
          <span class="group-hover:hidden">{{ useGetTranslation('popup_header_update_bookmarks_btn_content') }}</span>
          <span class="w-[36px] hidden group-hover:inline-block">{{ useGetTranslation('popup_header_update_bookmarks_btn_content_hover') }}</span>
        </button>
        <button v-if="!bookmarkId" :disabled="!bookmarkUrl || !urlValidation"
        :title="useGetTranslation('popup_header_create_bookmarks_btn_title')" class="px-2 py-1.5 flex justify-center items-center gap-1 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded transition-all duration-300"
        :class="(!bookmarkUrl || !urlValidation) ? 'opacity-10' : ''"
        @click="createBookmark">
            <Iconify icon="ic:round-save" class="w-4 h-4"></Iconify>
            <span class="">{{ useGetTranslation('popup_header_create_bookmarks_btn_content') }}</span>
        </button>
      </div>
    </header>
    <main class="px-4 pt-2 space-y-2">
      <!-- bookmark title section -->
      <section class="focus-within:bg-gray-50">
        <div class="flex justify-between items-end">
          <div class="flex justify-start items-end gap-2">
            <p class="section-title text-gray-500">
              <Iconify icon="ph:text-aa-fill" class="section-title-icon"></Iconify>
              <span class="text-base font-semibold">{{ useGetTranslation('popup_main_bookmark_title_section_name') }}</span>
            </p>
          </div>
          <div class="flex justify-center items-center gap-1">
            <button v-if="bookmarkOriginTitle !== props.tabTitle" :title="useGetTranslation('popup_main_bookmark_title_section_set_tab_name_btn_title')"
              class="p-1.5 text-gray-300 hover:text-gray-500 active:text-white hover:bg-gray-200 active:bg-gray-500 rounded-full transition-colors duration-300"
              @click="bookmarkTitle = tabTitle">
              <Iconify icon="ph:text-t" class="w-4 h-4"></Iconify>
            </button>
            <button v-show="bookmarkTitle !== bookmarkOriginTitle"
            :title="useGetTranslation('popup_main_bookmark_title_section_reset_btn_title')"
            class="p-1.5 text-gray-300 hover:text-gray-500 active:text-white hover:bg-gray-200 active:bg-gray-500 rounded-full transition-colors duration-300" @click="bookmarkTitle = bookmarkOriginTitle">
              <Iconify icon="ph:arrow-counter-clockwise" class="w-4 h-4"></Iconify>
            </button>
          </div>
        </div>
        <div class="textarea-container border-gray-300 focus-within:border-gray-400 shadow-sm shadow-gray-100">
          <textarea ref="bookmarkTitleDOM" name="bookmark title" id="bookmark-title-textarea" class="text-gray-700 placeholder:text-gray-300" :placeholder="useGetTranslation('popup_main_bookmark_title_section_textarea_placeholder')" v-model="bookmarkTitle" @input="changeHeightHandler($event.target)"></textarea>
        </div>
      </section>
      <!-- bookmark url section -->
      <Suspense>
        <BookmarkUrlSession :bookmark-id="bookmarkId" v-model:bookmarkUrl="bookmarkUrl"></BookmarkUrlSession>
      </Suspense>
      <!-- bookmark folder section -->
      <Suspense>
        <BookmarkFolderSession :node-tree-id="props.nodeTreeId"></BookmarkFolderSession>
      </Suspense>
    </main>

    <!-- delete prompt modal -->
    <Teleport to="body">
      <div v-if="showDeleteBookmarkPrompt" class="fixed inset-0 z-50 flex justify-center items-center" @wheel="$event.preventDefault()" >
        <div class="absolute inset-0 -z-10 bg-black/50 backdrop-blur-sm" @click="showDeleteBookmarkPrompt = false"></div>
        <div class="px-10 py-6 flex flex-col justify-center items-center gap-8 bg-white rounded-md">
          <h2 class="text-xl font-bold text-gray-600 select-none">{{ useGetTranslation('popup_modal_delete_bookmark_prompt_title') }}</h2>
          <div class="flex justify-center items-center gap-4">
            <button :title="useGetTranslation('popup_modal_delete_bookmark_prompt_confirm_btn_title')" class="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded transition-colors duration-300" @click="deleteBookmark">{{ useGetTranslation('popup_modal_delete_bookmark_prompt_confirm_btn_content') }}</button>
            <button :title="useGetTranslation('popup_modal_delete_bookmark_prompt_cancel_btn_title')" class="px-4 py-2 text-white bg-gray-400 hover:bg-gray-500 rounded transition-colors duration-300" @click="showDeleteBookmarkPrompt=false">{{ useGetTranslation('popup_modal_delete_bookmark_prompt_cancel_btn_content') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- similar bookmark modal -->
    <Teleport to="body">
      <div v-if="showSimilarBookmarksModal" class="fixed inset-0 z-50 flex justify-center items-center" @wheel="$event.preventDefault()">
        <div class="absolute inset-0 -z-10 bg-black/50 backdrop-blur-sm" @click="showSimilarBookmarksModal = false"></div>
        <div class="max-w-[600px] px-2 py-4 flex flex-col justify-center items-center gap-6 bg-white rounded-md">
          <h2 class="pb-2 text-lg text-gray-600 font-bold border-b border-gray-600 select-none" >{{ useGetTranslation('popup_modal_similar_bookmarks_list_title') }}</h2>
          <div ref="similarBookmarksContainerDOM" class="similar-bookmarks-container w-full max-h-[400px] overflow-y-auto px-2 flex justify-center items-center"  @wheel="scrollHandler">
            <ul class="w-full flex flex-col justify-center items-start gap-4">
              <li v-for="node in similarBookmarks" :key="node.id" class="w-full">
                <button
                :title="useGetTranslation('popup_modal_similar_bookmarks_list_btn_title')"
                class="group w-full px-3 py-2 flex flex-col items-start gap-1 text-gray-500 hover:bg-orange-100 rounded transition-colors duration-300"
                @click="setBookmarkInfo(node)">
                  <div class="flex justify-center items-center gap-2">
                    <img v-if="node.url" :src="useGetFaviconURL(node.url)" alt="bookmark favicon" class="shrink-0 w-4 h-4">
                    <Iconify v-else icon="ph:planet-fill" class="shrink-0 w-4 h-4 text-purple-500"></Iconify>
                    <span class="line-camp-1 text-base text-start group-hover:text-orange-400 font-bold transition-colors duration-300">{{ node.title }}</span>
                  </div>
                  <span class="max-w-full pl-6 text-sm text-start text-blue-400 group-hover:text-orange-300 break-words transition-colors duration-300">{{ node.url }}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss">
section {
  @apply w-full p-4 space-y-3 rounded transition-colors duration-300;
  .section-title {
    @apply flex justify-start items-center gap-2;
    .section-title-icon {
      @apply w-7 h-7;
    }
  }
  .textarea-container {
    @apply p-2 border rounded-md transition-colors duration-300;
    textarea {
      @apply w-full min-h-[1.25rem] max-h-[300px] text-sm bg-transparent resize-none overflow-y-auto focus:outline-none overscroll-y-none;
      // overflow-y: overlay;
      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        border-radius: 3px;
      }
    }
  }
}

#bookmark-title-textarea {
  &::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: #9ca3af;
  }
}

.line-camp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.similar-bookmarks-container {
  &::-webkit-scrollbar {
    width: 7px;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 3.5px;
    background-color: #d1d5db;
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: #9ca3af;
  }
}
</style>
