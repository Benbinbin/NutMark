<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useCheckBookmarkState } from '@/composables/checkBookmarkState'
import { useGetFaviconURL } from '@/composables/getFaviconURL'
import { Icon as Iconify, loadIcon } from '@iconify/vue'
import FolderGrid from './components/FolderGrid.vue'

const bookmarkState = ref(false)
const bookmarkTitle = ref('')
const bookmarkURL = ref('')
const iconURL = ref('')
// an object stand for node tree (with children property)
const nodesTree = ref(null)
// an object stand for the folder node
const folderNodeId = computed(() => {
  if(nodesTree.value) {
    return nodesTree.value.id
  } else {
    return '0'
  }
})

// folder nav path
const folderPath = ref([])
const getFolderPath = async (id) => {
  console.log(id);
  const resultForFolderNode = await chrome.bookmarks.get(id)
  const folderNode = resultForFolderNode[0]
  folderPath.value.unshift(folderNode)
  if (folderNode.parentId) {
    getFolderPath(folderNode.parentId)
  }
}

onMounted(() => {
  watch(folderNodeId, () => {
    console.log(folderNodeId.value);
    folderPath.value = []
    getFolderPath(folderNodeId.value)
  }, { immediate: true })
})

const sortedNodes = computed(() => {
  if(nodesTree.value) {
    nodesTree.value.children.sort((nodeA, nodeB) => {
      if (nodeA.children && !nodeB.children) {
        return -1
      } else if (!nodeA.children && nodeB.children) {
        return 1
      } else {
        return 0
      }
    })
    return nodesTree.value.children
  } else {
    return []
  }
})

// an object stand for the select folder
// without children property
const selectFolderNode = ref(null)

onMounted(async () => {
  const rootTree = await chrome.bookmarks.getTree()
  console.log('root tree', rootTree);
  /**
   * current tab information and bookmark state
   */
  // get current tab
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  // console.log(tab);

  bookmarkTitle.value = tab.title
  bookmarkURL.value = tab.url || tab.pendingUrl;
  iconURL.value = useGetFaviconURL(bookmarkURL.value)

  bookmarkState.value = await useCheckBookmarkState(bookmarkURL.value);

  /**
   * recent bookmark, folder and node tree
   */
  // get recently created bookmarks
  const recentBookmarkArr = await chrome.bookmarks.getRecent(1)
  console.log('get recent bookmarks', recentBookmarkArr);

  if(recentBookmarkArr.length > 0) {
    // if there is a bookmark created recently
    const recentBookmark = recentBookmarkArr[0]

    // get the folder node which the recently created bookmark belongs to
    const resultForSelectFolderNode = await chrome.bookmarks.get(recentBookmark.parentId)
    selectFolderNode.value = resultForSelectFolderNode[0]
    // console.log(selectFolderNode.value);
    // get the node tree which the folder node belongs to
    if(selectFolderNode.value.parentId) {
      console.log('get node tree');
      const resultForNodeTree = (await chrome.bookmarks.getSubTree(selectFolderNode.value.parentId))
      nodesTree.value = resultForNodeTree[0]
    } else {
      const resultForNodeTree = await chrome.bookmarks.getSubTree(recentBookmark.parentId)
      nodesTree.value = resultForNodeTree[0]
    }

  } else {
    // if there isn't any bookmarks created recently (for a new browser)
    // get the node tree from root node
    const resultForNodeTree = await chrome.bookmarks.getSubTree('0')
    nodesTree.value = resultForNodeTree[0]
    // and set the first children node as the select folder node
    const resultForSelectFolderNode = await chrome.bookmarks.get(nodesTree.value.children[0].id)
    selectFolderNode.value = resultForSelectFolderNode[0]
  }

  console.log('select folder node', selectFolderNode.value);
  console.log('node tree', nodesTree.value);
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
        <!-- <img v-if="iconURL" :src="iconURL" alt="bookmark icon" class="w-6 h-6"> -->
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
        <p class="section-title text-gray-600">
          <Iconify icon="ph:text-aa-fill" class="section-title-icon"></Iconify>
          <span class="text-lg font-semibold">名称</span>
        </p>
        <div class="textarea-container border-gray-200 focus-within:border-gray-400">
          <textarea name="bookmark name" id="bookmark-name" class="text-gray-700 placeholder:text-gray-300" placeholder="请输入书签的名称" v-model="bookmarkTitle" @input="changeHeightHandler"></textarea>
          </div>
      </section>
      <section class="focus-within:bg-blue-50/50">
        <p class="section-title text-blue-500">
          <Iconify icon="ph:link-fill" class="section-title-icon"></Iconify>
          <span class="text-lg font-semibold">链接</span>
        </p>
        <div class="textarea-container border-blue-200 focus-within:border-blue-400">
          <textarea name="bookmark url" id="bookmark-url" class="text-blue-600 placeholder:text-blue-200" placeholder="请输入书签的链接地址" v-model="bookmarkURL" @input="changeHeightHandler"></textarea>
        </div>
      </section>
      <section>
        <div class="flex justify-between items-center">
          <div class="flex justify-start items-center gap-4">
            <p class="section-title text-amber-400">
              <Iconify icon="ph:folder-notch-fill" class="section-title-icon"></Iconify>
              <span class="text-lg font-semibold">文件夹</span>
            </p>
            <button class="group px-2 py-1 rounded transition-colors duration-300" :class="selectFolderNode ? 'hover:bg-amber-400' : ''" :disabled="!selectFolderNode">
              <span v-if="selectFolderNode" class="text-amber-400 font-bold group-hover:text-white underline decoration-2 decoration-amber-400 underline-offset-4">{{ selectFolderNode.title }}</span>
              <span v-else class="text-xs font-bold text-amber-300 underline decoration-2 decoration-amber-300 underline-offset-4">请选择文件夹 👇</span>
            </button>
          </div>
          <button class="p-1.5 text-amber-400 hover:text-white hover:bg-amber-400 rounded transition-colors duration-300">
            <Iconify icon="ph:magnifying-glass" class="w-4 h-4"></Iconify>
          </button>
        </div>
        <div class="w-full max-h-[500px] bg-amber-50/25 rounded-md">
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
