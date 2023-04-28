<script setup>
import { ref, watch, inject, nextTick, TransitionGroup } from 'vue';
import { Icon as Iconify } from '@iconify/vue'
import { useGetFaviconURL } from '@/composables/getFaviconURL'

const props = defineProps(['showState'])
const emit = defineEmits(['hide'])

/**
 * input
 */
// three state types
// * entering
// * waiting
// * solved
const searchState = ref('waiting')
const includeBookmark = ref(true)

const queryStr = ref('')
const nodesArr = ref([])

let queryStrInputTimer = null;
const inputHandler = (event) => {
  searchState.value = 'searching'
  if(queryStrInputTimer) clearTimeout(queryStrInputTimer)

  queryStrInputTimer = setTimeout(async () => {
    if(queryStr.value) {
      nodesArr.value = await chrome.bookmarks.search(queryStr.value)

      searchState.value = 'solved'
    } else {
      searchState.value = 'waiting'
    }
  }, 500)
}

// focus input box
const inputDOM = ref(null)

watch(() => props.showState, () => {
  if(props.showState) {
    nextTick(() => {
      if(inputDOM.value) {
        inputDOM.value.focus()
      }
    })
  }
})

const focusInputHandler = () => {
  if (inputDOM.value) {
    inputDOM.value.focus()
  }
}

/**
 * folder path
 */
const getParentFolder = async (node, pathArr) => {
  if(node.parentId) {
    const result = await chrome.bookmarks.get(node.parentId)
    const parentNode = result[0]
    let parentFolderTitle;
    if(parentNode.id === '0') {
      parentFolderTitle = '根目录'
    } else if(parentNode.title) {
      parentFolderTitle = parentNode.title
    } else {
      parentFolderTitle = '未命名文件夹'
    }
    pathArr.unshift(parentFolderTitle)
    // iteration get the parent
    await getParentFolder(parentNode, pathArr)
  }
}

const getFolderPath = async (node) => {
  const markTitle = node.title.replace(queryStr.value, `<mark>${queryStr.value}</mark>`)
  const folderPathArr = []
  let folderNode;
  if(node.url) {
    // if this is the bookmark node
    const result = await chrome.bookmarks.get(node.parentId)
    folderNode = result[0]
    folderPathArr.unshift(folderNode.title || '未命名文件夹')
  } else {
    // if this is the folder node
    folderNode = node
  }

  await getParentFolder(folderNode, folderPathArr)

  return {
    id: node.id,
    title: markTitle,
    node: node,
    folderId: folderNode.id,
    parentFolderId: folderNode.parentId ? folderNode.parentId : folderNode.id,
    folderPathArr: folderPathArr
  }
}

const nodesWithFolderPath = ref([])
watch(nodesArr, () => {
  const promiseArr = []
  nodesArr.value.forEach(node => {
    promiseArr.push(getFolderPath(node))
  })
  Promise.all(promiseArr).then(values => {
    nodesWithFolderPath.value = values
  })
})

/**
 * set folder
 */
const bookmarkFolderId = inject('bookmarkFolderId')
const setBookmarkFolderId = inject('setBookmarkFolderId')
const setNodeTreeId = inject('setNodeTreeId')

const setFolderHandler = (node) => {
  if(node.folderId && node.parentFolderId) {
    setBookmarkFolderId(node.folderId)
    setNodeTreeId(node.parentFolderId)
  }
  emit('hide')
}
</script>

<template>
  <div class="rounded-md shadow shadow-orange-100">
    <!-- header -->
    <div class="px-2 py-1.5 flex items-center gap-2 bg-orange-50/50 focus-within:bg-orange-50 border-b border-orange-200 focus-within:border-orange-300 rounded-t-md shadow shadow-orange-50 transition-colors duration-300">
      <button title="search entry include bookmarks or not" @click="includeBookmark = !includeBookmark" class="shrink-0 p-1 rounded transition-colors duration-300" :class="includeBookmark ? 'hover:bg-orange-100' : 'hover:bg-orange-200'">
        <img src="@/assets/nut-mark.svg" alt="nut mark icon" class="w-4 h-4" :class="includeBookmark ? 'opacity-100' : 'opacity-30'">
      </button>
      <input ref="inputDOM" type="text" name="search bookmark node" id="search-bookmark-node" placeholder="请输入搜索内容" class="grow py-0.5 text-sm text-orange-600 placeholder:text-orange-200 focus:outline-none bg-transparent" v-model="queryStr" @input="inputHandler">
    </div>
    <!-- result -->
    <div class="result-content-container w-full max-h-[450px] overflow-y-auto">
      <button v-show="searchState === 'waiting'" class="w-full px-4 py-8 flex flex-col justify-center items-center gap-2 text-orange-300 hover:text-orange-400 transition-colors duration-300"
      @click="focusInputHandler">
        <Iconify icon="fluent:text-t-28-filled" class="w-10 h-10"></Iconify>
        <span class="text-sm">Type to Search</span>
      </button>
      <div v-show="searchState === 'searching'" class="px-4 py-8 flex flex-col justify-center items-center gap-2 text-orange-400">
        <Iconify icon="fluent:slide-search-28-filled" class="w-10 h-10 animate-bounce"></Iconify>
        <span class="text-sm">Searching</span>
      </div>
      <div v-show="searchState === 'solved' && nodesArr.length === 0" class="px-4 py-8 flex flex-col justify-center items-center gap-2 text-red-400">
        <Iconify icon="fluent:mail-inbox-dismiss-28-filled" class="w-10 h-10"></Iconify>
        <span class="text-sm">Oops! Empty Entry</span>
      </div>
      <ul v-show="searchState === 'solved' && nodesWithFolderPath.length>0" class="w-full p-4 space-y-2">
        <TransitionGroup
          enter-from-class="opacity-0 -translate-x-full"
          enter-active-class="transition-all duration-300"
          enter-to-class="opacity-100 translate-x-0"
          leave-from-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-300"
          leave-to-class="opacity-0 -translate-x-full"
          >
          <template v-for="nodeObj in nodesWithFolderPath" :key="nodeObj.id">
            <li v-show="includeBookmark || !nodeObj.node.url">
              <button class="group w-full p-2  rounded transition-colors duration-300" :class="nodeObj.folderId === bookmarkFolderId ? 'bg-orange-50' : 'hover:bg-orange-50'"
              @click="setFolderHandler(nodeObj)">
                <div class="flex justify-start items-center gap-1 text-sm">
                  <Iconify icon="ph:folder-fill" class="shrink-0 w-5 h-5 text-orange-300 group-hover:text-orange-400 transition-colors duration-300" ></Iconify>
                  <span v-for="(folder, index) in nodeObj.folderPathArr" :key="index" class="flex flex-wrap justify-start items-center gap-1 text-gray-700 group-hover:text-orange-400 transition-colors duration-300">
                    <span>{{ folder }}</span>
                    <span v-if="!nodeObj.node.url || (nodeObj.node.url && index < nodeObj.folderPathArr.length - 1)">/</span>
                  </span>
                  <span v-if="!nodeObj.node.url" class="text-gray-700 group-hover:text-orange-400 transition-colors duration-300" v-html="nodeObj.title"></span>
                </div>
                <div v-if="nodeObj.node.url" class="mt-3 ml-4 flex justify-start items-center gap-1 text-blue-400 group-hover:text-orange-300 select-none">
                  <img v-if="nodeObj.node.url" :src="useGetFaviconURL(nodeObj.node.url)" alt="bookmark icon" class="shrink-0 w-4 h-4">
                  <Iconify v-else icon="ph:planet-fill" class="shrink-0 w-4 h-4"></Iconify>
                  <span class="line-camp-1 text-xs" v-html="nodeObj.title"></span>
                </div>
              </button>
            </li>
          </template>
        </TransitionGroup>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.result-content-container {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 3px;
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