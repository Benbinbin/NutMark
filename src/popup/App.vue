<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useCheckBookmarkState } from '@/composables/checkBookmarkState'
import { useGetFaviconURL } from '@/composables/getFaviconURL'
import { Icon as Iconify } from '@iconify/vue'
import FolderGrid from './components/FolderGrid.vue'

/**
 * bookmark information
 */
const bookmarkState = ref(false)
const bookmarkTitle = ref('')
const bookmarkURL = ref('')

/**
 * folder
 */
// node tree (with children property)
const nodeTree = ref(null) // an object

// folder path for folder nav
const folderPath = ref([])
const getFolderPath = async (id) => {
  // console.log(id);
  const resultForFolderNode = await chrome.bookmarks.get(id)
  const folderNode = resultForFolderNode[0]
  folderPath.value.unshift(folderNode)
  if (folderNode.parentId) {
    getFolderPath(folderNode.parentId)
  }
}

onMounted(() => {
  watch(nodeTree, () => {
    // reset folder path
    folderPath.value = []
    if(nodeTree.value) {
      getFolderPath(nodeTree.value.id)
    } else {
      getFolderPath('0')
    }
  }, { immediate: true })
})

const sortedNodes = computed(() => {
  if(nodeTree.value) {
    nodeTree.value.children.sort((nodeA, nodeB) => {
      if (nodeA.children && !nodeB.children) {
        return -1
      } else if (!nodeA.children && nodeB.children) {
        return 1
      } else {
        return 0
      }
    })
    return nodeTree.value.children
  } else {
    return []
  }
})

// the folder node selected
// without children property
const selectFolderNode = ref(null) // an object

// init the state
onMounted(async () => {
  // const rootTree = await chrome.bookmarks.getTree()
  // console.log('root tree', rootTree);
  /**
   * get current tab information and bookmark state
   */
  // get current tab
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  bookmarkTitle.value = tab.title
  bookmarkURL.value = tab.url || tab.pendingUrl;
  bookmarkState.value = await useCheckBookmarkState(bookmarkURL.value);

  /**
   * get recent bookmark to build node tree
   */
  const recentBookmarkArr = await chrome.bookmarks.getRecent(1)
  // console.log('get recent bookmarks', recentBookmarkArr);

  if(recentBookmarkArr.length > 0) {
    // if there is a bookmark created recently
    const recentBookmark = recentBookmarkArr[0]
    // get the folder node of this bookmark
    const resultForSelectFolderNode = await chrome.bookmarks.get(recentBookmark.parentId)
    // set the selected folder as this folder
    selectFolderNode.value = resultForSelectFolderNode[0]
    // set the node tree
    if(selectFolderNode.value.parentId) {
      // if the selected folder has parent folder
      // get the node tree based on the parent folder
      // console.log('get node tree');
      const resultForNodeTree = (await chrome.bookmarks.getSubTree(selectFolderNode.value.parentId))
      nodeTree.value = resultForNodeTree[0]
    } else {
      // if the selected folder doesn't have parent folder
      // (when the selected folder is the root folder)
      // then set the node tree based on the selected folder
      const resultForNodeTree = await chrome.bookmarks.getSubTree(recentBookmark.parentId)
      nodeTree.value = resultForNodeTree[0]
    }
  } else {
    // if there isn't any bookmarks created recently
    // (when this is a brand new browser)
    // set the node tree based on the root node
    const resultForNodeTree = await chrome.bookmarks.getSubTree('0')
    nodeTree.value = resultForNodeTree[0]
    // and set the selected folder as the first children node
    // 根目录下的第一个子文件夹一般就是「书签栏」
    const resultForSelectFolderNode = await chrome.bookmarks.get(nodeTree.value.children[0].id)
    selectFolderNode.value = resultForSelectFolderNode[0]
  }

  // console.log('select folder node', selectFolderNode.value);
  // console.log('node tree', nodeTree.value);
})

// change textarea input box height
const changeHeightHandler = (event) => {
  event.target.style.height = 'auto'
  event.target.style.height = `${event.target.scrollHeight}px`
}
</script>

<template>
  <div>
    <header class="px-4 py-2.5 flex justify-between sticky top-0 inset-x-0 bg-gray-50 border-b shadow">
      <div class="flex justify-center items-center gap-2">
        <!-- <img v-if="bookmarkURL" :src="useGetFaviconURL(bookmarkURL)" alt="bookmark icon" class="w-6 h-6"> -->
        <Iconify icon="ph:planet-fill" class="inline-block w-6 h-6 text-purple-500"></Iconify>
      </div>
      <div class="flex justify-center items-center gap-2">
        <button class="group px-2 py-1 flex justify-center items-center gap-1 text-xs font-bold hover:text-white bg-transparent border-2 rounded transition-colors duration-300" :class="bookmarkState ? 'text-amber-500 hover:bg-red-500 border-amber-500 hover:border-red-500' : 'text-emerald-500 hover:bg-emerald-500 border-emerald-500'">
          <img v-if="bookmarkState" src="@/assets/nut-mark.svg" alt="nut mark icon" class="w-4 h-4">
          <img v-else src="@/assets/nut-unmark.svg" alt="nut unmark icon" class="w-4 h-4">
          <span class="inline-block group-hover:hidden">{{ bookmarkState ? '已收藏' : '未收藏' }}</span>
          <span v-if="bookmarkState" class="w-[36px] hidden group-hover:inline-block">删除</span>
          <span v-else class="w-[36px] hidden group-hover:inline-block">添加</span>
        </button>
      </div>
    </header>
    <main class="p-4 space-y-2">
      <section class=" focus-within:bg-gray-50">
        <p class="section-title text-gray-500">
          <Iconify icon="ph:text-aa-fill" class="section-title-icon"></Iconify>
          <span class="text-base font-semibold">名称</span>
        </p>
        <div class="textarea-container border-gray-200 focus-within:border-gray-400">
          <textarea name="bookmark name" id="bookmark-name" class="text-gray-700 placeholder:text-gray-300" placeholder="请输入书签的名称" v-model="bookmarkTitle" @input="changeHeightHandler"></textarea>
          </div>
      </section>
      <section class="focus-within:bg-sky-50/50">
        <p class="section-title text-sky-500">
          <Iconify icon="ph:link-fill" class="section-title-icon"></Iconify>
          <span class="text-base font-semibold">链接</span>
        </p>
        <div class="textarea-container border-sky-200 focus-within:border-sky-400">
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
            <button class="group px-2 py-1 rounded transition-colors duration-300" :class="selectFolderNode ? 'hover:bg-orange-400' : ''" :disabled="!selectFolderNode">
              <span v-if="selectFolderNode" class="text-orange-400 font-bold group-hover:text-white underline decoration-wavy decoration-2 decoration-orange-400 underline-offset-2">{{ selectFolderNode.title }}</span>
              <span v-else class="text-xs font-bold text-orange-300 underline decoration-2 decoration-orange-300 underline-offset-2">请选择文件夹 👇</span>
            </button>
          </div>
          <button class="p-1.5 text-orange-400 hover:text-white hover:bg-orange-400 rounded transition-colors duration-300">
            <Iconify icon="ph:magnifying-glass" class="w-4 h-4"></Iconify>
          </button>
        </div>
        <div class="w-full max-h-[500px] rounded-md shadow shadow-orange-100">
          <FolderGrid :folder-path="folderPath" :nodes="sortedNodes"></FolderGrid>
        </div>
      </section>
    </main>
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
