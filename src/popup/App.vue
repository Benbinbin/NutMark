<script setup>
import { onMounted, ref, provide, nextTick } from 'vue';
// import { useCheckBookmarkState } from '@/composables/checkBookmarkState';
import { useGetFaviconURL } from '@/composables/getFaviconURL';
import { Icon as Iconify } from '@iconify/vue';
import BookmarkUrlSession from './components/BookmarkUrlSession.vue';
import BookmarkFolderSession from './components/BookmarkFolderSession.vue';

const props = defineProps(['tabTitle', 'tabUrl', 'bookmarkState', 'bookmarkId', 'bookmarkTitle', 'bookmarkUrl', 'bookmarkFolderId', 'similarBookmarks']);

const bookmarkState = ref(props.bookmarkState);

/**
 * bookmark id
 */
const bookmarkId = ref(props.bookmarkId);

/**
 * bookmark title
 */
const bookmarkOriginTitle = ref('');
const bookmarkTitle = ref('');

if(bookmarkState.value) {
  bookmarkOriginTitle.value = props.bookmarkTitle;
  bookmarkTitle.value = props.bookmarkTitle;
} else {
  bookmarkOriginTitle.value = props.tabTitle;
  bookmarkTitle.value = props.tabTitle;
}

const bookmarkTitleDOM = ref(null);
// change textarea input box height
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
const resetBookmarkTitle = () => {
  bookmarkTitle.value = props.tabTitle;
}

/**
 * bookmark url
 */
const bookmarkOriginUrl = ref('');
const bookmarkUrl = ref('');

// bookmark url init value
if(bookmarkState.value) {
  bookmarkOriginUrl.value = props.bookmarkUrl;
  bookmarkUrl.value = props.bookmarkUrl;
} else {
  bookmarkOriginUrl.value = props.tabUrl;
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
const bookmarkOriginFolderId = ref(null)
const setBookmarkOriginFolderId = (id) => {
  bookmarkOriginFolderId.value = id;
}

const bookmarkFolderId = ref(null);
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
if (bookmarkState.value) {
  setBookmarkOriginFolderId(props.bookmarkFolderId)
  setBookmarkFolderId(props.bookmarkFolderId);
}

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
console.log(similarBookmarks.value);
const showSimilarBookmarksModal = ref(false);

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
    const bookmarkNode = await chrome.bookmarks.move(
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
  if(bookmarkState.value && bookmarkId.value) {
    await chrome.bookmarks.remove(bookmarkId.value)
    bookmarkId.value = null
    bookmarkState.value = false
  }
  showDeleteBookmarkPrompt.value = false

  // close the popup page when finish
  window.close()
}
</script>

<template>
  <div>
    <header class="px-2 py-2 flex justify-between sticky top-0 inset-x-0 bg-gray-50 border-b shadow">
      <button :disabled="similarBookmarks.length===0" class="px-3 py-1 flex justify-center items-center gap-1 border rounded-full transition-colors duration-300"
      :class="bookmarkState ? 'bg-amber-100/60 hover:bg-amber-200 border-amber-200 text-amber-500 hover:text-amber-600' : 'bg-emerald-100/60 hover:bg-emerald-200 text-emerald-500 border-emerald-200 hover:text-emerald-600'"
      @click="showSimilarBookmarksModal=true">
        <img v-if="bookmarkUrl" :src="useGetFaviconURL(bookmarkUrl)" alt="bookmark icon" class="w-4 h-4">
        <Iconify v-else icon="ph:planet-fill" class="w-4 h-4 text-purple-500"></Iconify>
        <span class="text-xs font-bold">{{ bookmarkState ? '已收藏' : '未收藏' }}</span>
        <Iconify v-if="similarBookmarks.length > 0" icon="fluent:more-circle-32-filled" class="w-4 h-4"></Iconify>
      </button>
      <div class="flex justify-center items-center gap-2">
        <button v-if="bookmarkState" class="px-2 py-1.5 flex justify-center items-center gap-1 text-white bg-red-500 hover:bg-red-600 rounded transition-colors duration-300" @click="showDeleteBookmarkPrompt=true">
          <Iconify icon="ic:round-delete" class="w-4 h-4"></Iconify>
          <span class="text-xs font-bold">删除</span>
        </button>
        <button v-if="bookmarkState && (bookmarkTitle !== bookmarkOriginTitle || bookmarkUrl !== bookmarkOriginUrl || bookmarkOriginFolderId !== bookmarkFolderId || selectFolderType === 'new')"
        :disabled="!bookmarkUrl || !urlValidation"
        class="group px-2 py-1.5 flex justify-center items-center gap-1 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded transition-all duration-300"
        :class="(!bookmarkUrl || !urlValidation) ? 'opacity-10' : ''"
        @click="updateBook">
          <Iconify icon="ic:round-save" class="w-4 h-4"></Iconify>
          <span class="group-hover:hidden">有更新</span>
          <span class="w-[36px] hidden group-hover:inline-block">保存</span>
        </button>
        <button v-if="!bookmarkState" :disabled="!bookmarkUrl || !urlValidation" class="px-2 py-1.5 flex justify-center items-center gap-1 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded transition-all duration-300"
        :class="(!bookmarkUrl || !urlValidation) ? 'opacity-10' : ''"
        @click="createBookmark">
            <Iconify icon="ic:round-save" class="w-4 h-4"></Iconify>
            <span class="">保存</span>
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
              <span class="text-base font-semibold">名称</span>
            </p>
          </div>
          <button v-show="tabTitle !== bookmarkTitle" class="p-1.5 text-gray-300 hover:text-gray-500 active:text-white hover:bg-gray-200 active:bg-gray-500 rounded-full transition-colors duration-300" @click="resetBookmarkTitle">
            <Iconify icon="ph:arrow-counter-clockwise" class="w-4 h-4"></Iconify>
          </button>
        </div>
        <div class="textarea-container border-gray-300 focus-within:border-gray-400 shadow-sm shadow-gray-100">
          <textarea ref="bookmarkTitleDOM" name="bookmark title" id="bookmark-title-textarea" class="text-gray-700 placeholder:text-gray-300" placeholder="请输入书签的名称" v-model="bookmarkTitle" @input="changeHeightHandler($event.target)"></textarea>
        </div>
      </section>
      <!-- bookmark url section -->
      <Suspense>
        <BookmarkUrlSession :url-validation="urlValidation" :tab-url="tabUrl" v-model:bookmarkUrl="bookmarkUrl"></BookmarkUrlSession>
      </Suspense>
      <!-- bookmark folder section -->
      <Suspense>
        <BookmarkFolderSession></BookmarkFolderSession>
      </Suspense>
    </main>

    <!-- delete prompt modal -->
    <Teleport to="body">
      <div v-if="showDeleteBookmarkPrompt" class="fixed inset-0 z-50 flex justify-center items-center" @wheel="$event.preventDefault()" >
        <div class="absolute inset-0 -z-10 bg-black/50 backdrop-blur-sm" @click="showDeleteBookmarkPrompt = false"></div>
        <div class="px-10 py-6 flex flex-col justify-center items-center gap-8 bg-white rounded-md">
          <h2 class="text-xl font-bold text-gray-600 select-none">删除当前书签</h2>
          <div class="flex justify-center items-center gap-4">
            <button class="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded transition-colors duration-300" @click="deleteBookmark">确认</button>
            <button class="px-4 py-2 text-white bg-gray-400 hover:bg-gray-500 rounded transition-colors duration-300" @click="showDeleteBookmarkPrompt=false">取消</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- similar bookmark modal -->
    <Teleport to="body">
      <div v-if="showSimilarBookmarksModal" class="fixed inset-0 z-50 flex justify-center items-center" @wheel="$event.preventDefault()">
        <div class="absolute inset-0 -z-10 bg-black/50 backdrop-blur-sm" @click="showSimilarBookmarksModal = false"></div>
        <div class="max-w-[600px] p-4 flex flex-col justify-center items-center gap-6 bg-white rounded-md">
          <h2 class="pb-2 text-lg text-gray-600 font-bold border-b border-gray-600 select-none">相似书签列表</h2>
          <div class="w-full max-h-[400px] overflow-y-auto flex justify-center items-center">
            <ul class="w-full flex flex-col justify-center items-start gap-4">
              <li v-for="node in similarBookmarks" :key="node.id" class="w-full">
                <button class="group w-full px-3 py-2 flex flex-col items-start gap-1 text-gray-500 hover:bg-orange-100 rounded transition-colors duration-300">
                  <div class="flex justify-center items-center gap-2">
                    <!-- <img v-if="node.url" :src="useGetFaviconURL(node.url)" alt="bookmark favicon" class="shrink-0 w-4 h-4"> -->
                    <Iconify icon="ph:planet-fill" class="shrink-0 w-4 h-4 text-purple-500"></Iconify>
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
</style>
