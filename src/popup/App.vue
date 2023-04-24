<script setup>
import { onMounted, ref, watch, provide, nextTick } from 'vue';
import { useCheckBookmarkState } from '@/composables/checkBookmarkState'
import { useGetFaviconURL } from '@/composables/getFaviconURL'
import { Icon as Iconify } from '@iconify/vue'
import FolderGrid from './components/FolderGrid.vue'

/**
 * tab information
 */
const tabTitle = ref('')
const tabURL = ref('')
const getTabInfo = async () => {
  // get current tab
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  tabTitle.value = tab.title
  tabURL.value = tab.url || tab.pendingUrl
}

/**
 * bookmark information
 */
const bookmarkState = ref(false)
const bookmarkId = ref(null)
const bookmarkTitleOrigin = ref('')
const bookmarkURLOrigin = ref('')
const bookmarkFolderIdOrigin = ref('')
const bookmarkTitle = ref('')
const bookmarkURL = ref('')

/**
 * textarea
 */
// change textarea input box height
const changeHeightHandler = (event) => {
  event.target.style.height = 'auto'
  event.target.style.height = `${event.target.scrollHeight}px`
}

/**
 * node tree
 */
// node tree (with children property)
// root node is the default start point of node tree
const nodeTreeId = ref('0')
const setNodeTreeId = (id) => {
  nodeTreeId.value = id
}
provide('nodeTreeId', nodeTreeId)
provide('setNodeTreeId', setNodeTreeId)

const nodeTree = ref(null) // an object
onMounted(() => {
  // get the node tree object
  watch(nodeTreeId, async () => {
    const result = await chrome.bookmarks.getSubTree(nodeTreeId.value)
    const targetNodeTree = result[0]
    // sort the nodeTree children nodes
    // move the folder node to top
    targetNodeTree.children.sort((nodeA, nodeB) => {
      if (nodeA.children && !nodeB.children) {
        return -1
      } else if (!nodeA.children && nodeB.children) {
        return 1
      } else {
        return 0
      }
    })
    nodeTree.value = targetNodeTree
  }, {immediate: true})
})

// folder path
const folderPath = ref([])
const getFolderPath = async (id) => {
  const resultForFolderNode = await chrome.bookmarks.get(id)
  const folderNode = resultForFolderNode[0]
  folderPath.value.unshift(folderNode)
  if (folderNode.parentId) {
    getFolderPath(folderNode.parentId)
  }
}
onMounted(() => {
  // update the folder path when the nodeTree change
  watch(nodeTreeId, () => {
    // reset folder path
    folderPath.value = []
      getFolderPath(nodeTreeId.value)
  }, { immediate: true })
})

/**
 * select folder
 */
const selectFolderType = ref('old')

// select the "old" (existed) folder
// 「书签栏」 is the default selected folder id
const selectFolderNodeId = ref('1')
const setSelectFolderId = (id) => {
  selectFolderNodeId.value = id
  selectFolderType.value = 'old'
  newFolder.value = null // clean cache for the new folder
}
provide('selectFolderType', selectFolderType)
provide('selectFolderNodeId', selectFolderNodeId)
provide('setSelectFolderId', setSelectFolderId)

// the folder node selected (an object without children property)
const selectFolderNode = ref(null) // an object
onMounted(() => {
  // get the node tree object
  watch(selectFolderNodeId, async () => {
    const result = await chrome.bookmarks.get(selectFolderNodeId.value)
    selectFolderNode.value = result[0]

  }, { immediate: true })
})

// select the new folder
const newFolder = ref(null)
const setNewFolder = (newFolderObj) => {
  newFolder.value = newFolderObj
  selectFolderType.value = 'new'
}
provide('newFolder', newFolder)
provide('setNewFolder', setNewFolder)


// get the node tree id of the folder
// with fallback solution to the root node and 「书签栏」
const getTreeId = async (folderId) => {
  // get the folder for this bookmark node
  const resultForFolderNode = await chrome.bookmarks.get(folderId)
  const folderNode = resultForFolderNode[0]

  // get the node tree
  let targetId;
  if (folderNode.parentId) {
    // if the folder node has parent folder
    targetId = folderNode.parentId
  } else {
    // if the folder node doesn't have parent folder
    // (when the folder is the root folder)
    // then set the node tree id as this folder
    targetId = folderNode.id
  }

  return targetId
}

/**
 * set the parameters about bookmark
 * get from tab or recent created bookmark information
 */
const setBookmarkParameters = async () => {
  await getTabInfo()

  // check the url bookmark state
  const result = await useCheckBookmarkState(tabURL.value);
  // console.log(result);

  if (result) {
    // if the tab has already bookmarked
    bookmarkState.value = true

    bookmarkId.value = result.id

    bookmarkTitle.value = result.title
    bookmarkTitleOrigin.value = result.title

    bookmarkURL.value = result.url
    bookmarkURLOrigin.value = result.url

    selectFolderNodeId.value = result.parentId
    bookmarkFolderIdOrigin.value = result.parentId

    // set the node tree id
    nodeTreeId.value = await getTreeId(result.parentId)
  } else {
    // if the tab doesn't bookmark
    bookmarkState.value = false
    bookmarkTitle.value = tabTitle.value;
    bookmarkURL.value = tabURL.value;

    // get recent bookmark to build node tree
    const recentBookmarkArr = await chrome.bookmarks.getRecent(1)
    // console.log('get recent bookmarks', recentBookmarkArr);

    if (recentBookmarkArr.length > 0) {
      // if there is a bookmark created recently
      const recentBookmark = recentBookmarkArr[0]
      selectFolderNodeId.value = recentBookmark.parentId
      nodeTreeId.value = await getTreeId(recentBookmark.parentId)
    } else {
      // if there isn't any bookmarks created recently
      // (when this is a brand new browser)
      // set the node tree based on the root node
      nodeTreeId.value = '0'
      // and set the selected folder as the first children node
      // 根目录下的第一个子文件夹一般就是「书签栏」
      selectFolderNodeId.value = '1'
    }
  }

  // console.log('select folder node', selectFolderNode.value);
  // console.log('node tree', nodeTree.value);
}

/**
 * get init information
 */
onMounted(async () => {
  // const rootTree = await chrome.bookmarks.getTree()
  // console.log('root tree', rootTree);
  await setBookmarkParameters()

  // console.log('bookmarkTitleOrigin', bookmarkTitleOrigin.value);
  // console.log('bookmarkTitle', bookmarkTitle.value);
  // console.log('bookmarkURLOrigin', bookmarkURLOrigin.value);
  // console.log('bookmarkURL', bookmarkURL.value);
  // console.log('bookmarkFolderIdOrigin', bookmarkFolderIdOrigin.value);
  // console.log(selectFolderType.value);
  // console.log('selectFolderNodeId', selectFolderNodeId.value);
})

/**
 * reset the bookmark title or url based on tab
 */
const resetBookmarkTitle = () => {
  bookmarkTitle.value = tabTitle.value
}

const resetBookmarkURL = () => {
  bookmarkURL.value = tabURL.value
}

/**
 * create bookmark
 */
const createBookmark = async () => {
  let folderNodeId;
  if (selectFolderType.value === 'new') {
    // console.log(newFolder.value);
    const folderNode = await chrome.bookmarks.create(newFolder.value)
    folderNodeId = folderNode.id
  } else{
    folderNodeId = selectFolderNodeId.value
  }

  await chrome.bookmarks.create({
    parentId: folderNodeId,
    title: bookmarkTitle.value,
    url: bookmarkURL.value
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
  if(bookmarkFolderIdOrigin.value !== selectFolderNodeId.value || selectFolderType.value === 'new') {
    let folderNodeId;
    if(selectFolderType.value === 'new') {
      // create the new folder first
      const folderNode = await chrome.bookmarks.create(newFolder.value)
      folderNodeId = folderNode.id
    } else {
      fonderNodeId = selectFolderNodeId.value
    }
    // then move the bookmark to the folder
    const bookmarkNode = await chrome.bookmarks.move(
      bookmarkId.value,
      {
        parentId: folderNodeId
      }
    )

    console.log(bookmarkNode);
    console.log(bookmarkId.value);
  }

  // then update the bookmark content
  if(bookmarkTitleOrigin.value !== bookmarkTitle.value || bookmarkURLOrigin.value !== bookmarkURL.value) {
    await chrome.bookmarks.update(
      bookmarkId.value,
      {
        title: bookmarkTitle.value,
        url: bookmarkURL.value
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
      <div class="px-3 py-1 flex justify-center items-center gap-1 border rounded-full transition-colors duration-300"
      :class="bookmarkState ? 'bg-amber-100/60 hover:bg-amber-200 border-amber-200 text-amber-500 hover:text-amber-600' : 'bg-emerald-100/60 hover:bg-emerald-200 text-emerald-500 border-emerald-200 hover:text-emerald-600'">
        <!-- <img v-if="bookmarkURL" :src="useGetFaviconURL(bookmarkURL)" alt="bookmark icon" class="w-6 h-6"> -->
        <Iconify icon="ph:planet-fill" class="w-4 h-4 text-purple-500"></Iconify>
        <span class="text-xs font-bold">{{ bookmarkState ? '已收藏' : '未收藏' }}</span>
      </div>
      <div class="flex justify-center items-center gap-2">
        <button v-if="bookmarkState" class="px-2 py-1.5 flex justify-center items-center gap-1 text-white bg-red-500 hover:bg-red-600 rounded transition-colors duration-300" @click="showDeleteBookmarkPrompt=true">
          <Iconify icon="ic:round-delete" class="w-4 h-4"></Iconify>
          <span class="text-xs font-bold">删除</span>
        </button>
        <button v-if="bookmarkState && (bookmarkTitleOrigin !== bookmarkTitle || bookmarkURLOrigin !== bookmarkURL || bookmarkFolderIdOrigin !== selectFolderNodeId || selectFolderType === 'new')"
        :disabled="!bookmarkURL"
        class="group px-2 py-1.5 flex justify-center items-center gap-1 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded transition-all duration-300"
        :class="!bookmarkURL ? 'opacity-10' : ''"
        @click="updateBook">
          <Iconify icon="ic:round-save" class="w-4 h-4"></Iconify>
          <span class="group-hover:hidden">有更新</span>
          <span class="w-[36px] hidden group-hover:inline-block">保存</span>
        </button>
        <button v-if="!bookmarkState" :disabled="!bookmarkURL" class="px-2 py-1.5 flex justify-center items-center gap-1 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded transition-all duration-300"
        :class="!bookmarkURL ? 'opacity-10' : ''"
        @click="createBookmark">
            <Iconify icon="ic:round-save" class="w-4 h-4"></Iconify>
            <span class="">保存</span>
        </button>
      </div>
    </header>
    <main class="px-4 pt-2 space-y-2">
      <section class="focus-within:bg-gray-50">
        <div class="flex justify-start items-end gap-2">
          <p class="section-title text-gray-500">
            <Iconify icon="ph:text-aa-fill" class="section-title-icon"></Iconify>
            <span class="text-base font-semibold">名称</span>
          </p>
          <button class="p-1 rounded text-gray-300 hover:text-gray-500 active:text-white hover:bg-gray-200 active:bg-gray-500 transition-colors duration-300" @click="resetBookmarkTitle">
            <Iconify icon="ic:round-settings-backup-restore" class="w-4 h-4"></Iconify>
          </button>
        </div>
        <div class="textarea-container border-gray-300 focus-within:border-gray-400 shadow-sm shadow-gray-100">
          <textarea name="bookmark name" id="bookmark-name" class="text-gray-700 placeholder:text-gray-300" placeholder="请输入书签的名称" v-model="bookmarkTitle" @input="changeHeightHandler"></textarea>
        </div>
      </section>
      <section class="focus-within:bg-sky-50/50">
        <div class="flex justify-start items-end gap-2">
          <p class="section-title text-sky-500">
            <Iconify icon="ph:link-fill" class="section-title-icon"></Iconify>
            <span class="text-base font-semibold">链接</span>
          </p>
          <button class="p-1 rounded text-sky-300 hover:text-sky-500 active:text-white hover:bg-sky-200 active:bg-sky-500 transition-colors duration-300" @click="resetBookmarkURL">
            <Iconify icon="ic:round-settings-backup-restore" class="w-4 h-4"></Iconify>
          </button>
        </div>
        <div class="textarea-container border-sky-300 focus-within:border-sky-400 shadow shadow-sky-50">
          <textarea name="bookmark url" id="bookmark-url" class="text-sky-600 placeholder:text-sky-200" placeholder="请输入书签的链接地址" v-model="bookmarkURL" @input="changeHeightHandler"></textarea>
        </div>
      </section>
      <section>
        <div class="flex justify-between items-center">
          <div class="flex justify-start items-center gap-4">
            <p class="section-title text-orange-300">
              <Iconify icon="ph:folder-notch-fill" class="section-title-icon"></Iconify>
              <span class="text-base font-semibold">文件夹</span>
            </p>
            <button v-if="selectFolderType !== 'new'" class="px-2 py-1.5 text-xs font-bold rounded transition-colors duration-300" :class="selectFolderNode ? 'text-green-500 hover:text-white bg-green-200/60 hover:bg-green-500' : 'text-green-300'" :disabled="!selectFolderNode"
            @click="setNodeTreeId(selectFolderNode.parentId)">
              <span v-if="selectFolderNode">{{ selectFolderNode.title }}</span>
              <span v-else class="underline decoration-wavy decoration-2 decoration-green-300 underline-offset-2">请选择文件夹 👇</span>
            </button>
            <div v-if="newFolder && selectFolderType==='new'" class="relative">
              <button class="px-2 py-1.5 text-xs font-bold text-purple-500 hover:text-white bg-purple-200/60 hover:bg-purple-500 rounded transition-colors duration-300" @click="setNodeTreeId(newFolder.parentId)">{{ newFolder.title || '未命名文件夹' }}</button>
              <sup class="px-2 py-0.5 flex justify-center absolute -top-2 -right-4 text-xs text-white bg-red-400 rounded-full scale-[0.8] rotate-45 select-none">new</sup>
            </div>
          </div>
          <button class="p-1.5 text-orange-400 hover:text-white hover:bg-orange-400 rounded transition-colors duration-300">
            <Iconify icon="ph:magnifying-glass" class="w-4 h-4"></Iconify>
          </button>
        </div>
        <div class="w-full rounded-md shadow shadow-orange-100">
          <FolderGrid v-if="nodeTree" :folder-path="folderPath" :nodes="nodeTree.children"></FolderGrid>
        </div>
      </section>
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
  </div>
</template>

<style scoped lang="scss">
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

    #bookmark-url {
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
