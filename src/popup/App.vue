<script setup>
import { onMounted, ref, watch, provide, nextTick } from 'vue';
import { useCheckBookmarkState } from '@/composables/checkBookmarkState';
import { useGetFaviconURL } from '@/composables/getFaviconURL';
import { Icon as Iconify } from '@iconify/vue';
import BookmarkUrlSession from './components/BookmarkUrlSession.vue';
import BookmarkFolderSession from './components/BookmarkFolderSession.vue';


const props = defineProps(['tabTitle', 'tabUrl', 'bookmarkState', 'bookmarkId', 'bookmarkTitleOrigin', 'bookmarkUrlOrigin', 'bookmarkFolderIdOrigin']);

/**
 * similar bookmarks
 */
const urlHostname = ref('');
const similarBookmarks = ref([]);
const showSimilarBookmarksModal = ref(false);

/**
 * bookmark title
 */
const bookmarkTitleDOM = ref(null);
const bookmarkTitle = ref('');
if(props.bookmarkTitleOrigin) {
  bookmarkTitle.value = props.bookmarkTitleOrigin;
} else {
  bookmarkTitle.value = props.tabTitle;
}

// change textarea input box height
const changeHeightHandler = (dom) => {
  dom.style.height = 'auto';
  dom.style.height = `${dom.scrollHeight}px`;
}

// reset the bookmark title based on tab
const resetBookmarkTitle = () => {
  bookmarkTitle.value = props.tabTitle
}

/**
 * bookmark url
 */
const bookmarkUrl = ref('');

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
if (props.bookmarkFolderIdOrigin) {
  setBookmarkFolderId(props.bookmarkFolderIdOrigin);
}

provide('selectFolderType', selectFolderType)
provide('bookmarkFolderId', bookmarkFolderId)
provide('setBookmarkFolderId', setBookmarkFolderId)
provide('newFolder', newFolder)
provide('setNewFolder', setNewFolder)

// get the node tree id of the folder
// with fallback solution to the root node and 「书签栏」
// const getTreeId = async (folderId) => {
//   // get the folder for this bookmark node
//   const resultForFolderNode = await chrome.bookmarks.get(folderId)
//   const folderNode = resultForFolderNode[0]

//   // get the node tree
//   let targetId;
//   if (folderNode.parentId) {
//     // if the folder node has parent folder
//     targetId = folderNode.parentId
//   } else {
//     // if the folder node doesn't have parent folder
//     // (when the folder is the root folder)
//     // then set the node tree id as this folder
//     targetId = folderNode.id
//   }

//   return targetId
// }

// /**
//  * set the parameters about bookmark
//  * get from tab or recent created bookmark information
//  */
// const setBookmarkParameters = async () => {
//   await getTabInfo()

//   // check the url bookmark state
//   const result = await useCheckBookmarkState(tabUrl.value);

//   if (result) {
//     // if the tab has already bookmarked
//     bookmarkState.value = true

//     bookmarkId.value = result.id

//     bookmarkTitle.value = result.title
//     bookmarkTitleOrigin.value = result.title

//     bookmarkUrl.value = result.url
//     bookmarkUrlOrigin.value = result.url

//     bookmarkFolderId.value = result.parentId
//     bookmarkFolderIdOrigin.value = result.parentId

//     // set the node tree id
//     nodeTreeId.value = await getTreeId(result.parentId)
//   } else {
//     // if the tab doesn't bookmark
//     bookmarkState.value = false
//     bookmarkTitle.value = tabTitle.value;
//     bookmarkUrl.value = tabUrl.value;

//     // get recent bookmark to build node tree
//     const recentBookmarkArr = await chrome.bookmarks.getRecent(1)

//     if (recentBookmarkArr.length > 0) {
//       // if there is a bookmark created recently
//       const recentBookmark = recentBookmarkArr[0]
//       bookmarkFolderId.value = recentBookmark.parentId
//       nodeTreeId.value = await getTreeId(recentBookmark.parentId)
//     } else {
//       // if there isn't any bookmarks created recently
//       // (when this is a brand new browser)
//       // set the node tree based on the root node
//       nodeTreeId.value = '0'
//       // and set the selected folder as the first children node
//       // 根目录下的第一个子文件夹一般就是「书签栏」
//       bookmarkFolderId.value = '1'
//     }
//   }
// }

/**
 * get init information
 */
// onMounted(async () => {
  // await setBookmarkParameters()
  // console.log(bookmarkUrl.value);
  // nextTick(() => {
    // if(bookmarkUrlDOM.value) {
    //   changeHeightHandler(bookmarkUrlDOM.value)
    // }
    // if(bookmarkTitleDOM.value) {
    //   changeHeightHandler(bookmarkTitleDOM.value)
    // }
  // })
  // validateURL(bookmarkUrl.value)
  // find the similar bookmarks based on current tab or bookmark url (hostname)
  // if(urlObj.value) {
  //   urlHostname.value = urlObj.value.hostname
  //   if(urlHostname.value) {
  //     // console.log('hostname', urlHostname.value);
  //     const resultArr = await chrome.bookmarks.search(urlHostname.value)

  //     resultArr.forEach(node => {
  //       if(node.url && node.url !== bookmarkUrl.value) {
  //         // filter out the folder nodes and the same bookmark node
  //         similarBookmarks.value.push(node)
  //       }
  //     })
  //     console.log(similarBookmarks.value);
  //   }
  // }
// })

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
  // if change the folder
  // first move the bookmark to the folder
  if(bookmarkFolderIdOrigin.value !== bookmarkFolderId.value || selectFolderType.value === 'new') {
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
  if(bookmarkTitleOrigin.value !== bookmarkTitle.value || bookmarkUrlOrigin.value !== bookmarkUrl.value) {
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
    bookmarkState.value = false
    bookmarkId.value = null
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
        <button v-if="bookmarkState && (bookmarkTitleOrigin !== bookmarkTitle || bookmarkUrlOrigin !== bookmarkUrl || bookmarkFolderIdOrigin !== bookmarkFolderId || selectFolderType === 'new')"
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
          <textarea ref="bookmarkTitleDOM" name="bookmark name" id="bookmark-name" class="text-gray-700 placeholder:text-gray-300" placeholder="请输入书签的名称" v-model="bookmarkTitle" @input="changeHeightHandler"></textarea>
        </div>
      </section>
      <!-- bookmark url section -->
      <BookmarkUrlSession :url-validation="urlValidation" :tab-url="tabUrl" v-model:bookmarkUrl="bookmarkUrl"></BookmarkUrlSession>
      <!-- bookmark folder section -->
      <Suspense>
        <BookmarkFolderSession></BookmarkFolderSession>
      </Suspense>
    </main>

    <Teleport to="body">
      <div v-show="showDeleteBookmarkPrompt" class="fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm" @wheel="$event.preventDefault()">
        <div class="px-10 py-6 flex flex-col justify-center items-center gap-8 bg-white rounded-md">
          <h2 class="text-xl font-bold text-gray-600">删除当前书签</h2>
          <div class="flex justify-center items-center gap-4">
            <button class="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded transition-colors duration-300" @click="deleteBookmark">确认</button>
            <button class="px-4 py-2 text-white bg-gray-400 hover:bg-gray-500 rounded transition-colors duration-300" @click="showDeleteBookmarkPrompt=false">取消</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-show="showSimilarBookmarksModal" class="fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm" @wheel="$event.preventDefault()">
        <div class="px-4 py-6 flex flex-col justify-center items-center gap-8 bg-white rounded-md">
          <h2 class="p-4 text-lg font-bold border-b border-gray-600">相似书签</h2>
          <div class="w-full flex justify-center items-center">
            <ul class="w-full flex flex-col justify-center items-start">
              <li v-for="node in similarBookmarks">{{ node.title }}</li>
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
    #bookmark-name {
      &::-webkit-scrollbar-thumb {
        background-color: #d1d5db;
      }
      &::-webkit-scrollbar-thumb:hover {
        background-color: #9ca3af;
      }
    }

    #bookmark-url-textarea {
      &::-webkit-scrollbar-thumb {
        background-color: #bfdbfe;
      }
      &::-webkit-scrollbar-thumb:hover {
        background-color: #60a5fa;
      }
    }
  }
}
</style>
