<script setup>
import { ref, computed, nextTick, inject, onMounted, watch } from 'vue'
import { Icon as Iconify } from '@iconify/vue'
import { useGetFaviconURL } from '@/composables/getFaviconURL'

const props = defineProps(['rootId', 'rootName', 'rootTree'])
// const emits = defineEmits(['set-tree'])

// the folder has expanded or not
const expand = ref(false)
// const expand = ref(props.rootTree.length>0)

// the current folder after drive down
const currentTree = ref([])
// the default/begin value
currentTree.value = props.rootTree
const sortedTree = computed(() => {
  currentTree.value.sort((nodeA, nodeB) => {
    if (nodeA.children && !nodeB.children) {
      return -1
    } else if (!nodeA.children && nodeB.children) {
      return 1
    } else {
      return 0
    }
  })
  return currentTree.value
})

/**
 * folder nav
 */
// #region folderNav
const folderNavArr = ref([
  {
    id: props.rootId,
    title: props.rootName,
    path: []
  }
])

// the folder nav path of current folder
// folder nav path is a number array
// which indicate the path from the root folder to this folder
let folderNavPath = []

// click the nav bar to set the currentTree
// based on the folder path bind to the nav item
const setFolderNavPath = (path) => {
  // path is a number array, which folder at nav been clicked
  folderNavPath = path // need to change the folder nav to this path
  // rebuild the folderNavArr
  // set the root folder (NavItem) as start
  let treeTemp = props.rootTree

  // the start folderNavArr just contain the root folder
  const folderNavArrTemp = [{
    id: props.rootId,
    title: props.rootName,
    path: []
  }]

  let folderNavPathTemp = []

  // loop the path to rebuild the folderNavArr
  if (path.length > 0) {
    path.forEach((index) => {
      folderNavPathTemp = folderNavPathTemp.concat(index)
      folderNavArrTemp.unshift({
        id: treeTemp[index].id,
        title: treeTemp[index].title,
        path: folderNavPathTemp
      })
      treeTemp = treeTemp[index].children
    })
  }

  currentTree.value = treeTemp
  folderNavArr.value = folderNavArrTemp

  nextTick(() => {
    rejudgeShowScrollBtn()
  })
}

// click the children folder
// set the folder nav items of the nav bar
const addFolderNav = (id, title, index) => {
  folderNavPath = folderNavPath.concat(index)

  folderNavArr.value.unshift({
    id,
    title,
    path: folderNavPath
  })

  currentTree.value = currentTree.value[index].children

  nextTick(() => {
    rejudgeShowScrollBtn()
  })
}

// const setTreeHandler = () => {
//   const path = [...folderNavPath]
//   emits('set-tree', path, 'drill-down')
// }
// #endregion

/**
 * scroll the folder nav
 */
// #region scroll
const showScrollBtn = ref(false)

const scrollPos = ref('start')

const folderNavContainerDOM = ref(null) // get the folderNav container DOM

const rejudgeShowScrollBtn = () => {
  // show of hide the scroll button
  if (folderNavContainerDOM.value) {
    if (folderNavContainerDOM.value.scrollWidth <= folderNavContainerDOM.value.clientWidth) {
      showScrollBtn.value = false
    } else {
      showScrollBtn.value = true
    }

    if (Math.ceil(folderNavContainerDOM.value.scrollLeft + folderNavContainerDOM.value.clientWidth) >= folderNavContainerDOM.value.scrollWidth) {
      scrollPos.value = 'end'
    } else if (folderNavContainerDOM.value.scrollLeft === 0) {
      scrollPos.value = 'start'
    } else {
      scrollPos.value = 'middle'
    }
  }
}

const scrollFolderNavHandler = (direction) => {
  if (!folderNavContainerDOM.value) { return }
  const containerWidth = folderNavContainerDOM.value.clientWidth

  if (direction === 'left') {
    folderNavContainerDOM.value.scrollLeft -= containerWidth
  } else if (direction === 'right') {
    folderNavContainerDOM.value.scrollLeft += containerWidth
  }
}

const folderNavScrollingHandler = () => {
  if (folderNavContainerDOM.value) {
    if (Math.ceil(folderNavContainerDOM.value.scrollLeft + folderNavContainerDOM.value.clientWidth) >= folderNavContainerDOM.value.scrollWidth) {
      scrollPos.value = 'end'
    } else if (folderNavContainerDOM.value.scrollLeft === 0) {
      scrollPos.value = 'start'
    } else {
      scrollPos.value = 'middle'
    }
  }
}
// #endregion

/**
 * node tree
 */
const setNodeTreeId = inject('setNodeTreeId')

/**
 * select folder node
 */
const selectFolderType = inject('selectFolderType')
const selectFolderNodeId = inject('selectFolderNodeId')
const setSelectFolderId = inject('setSelectFolderId')

// new folder
const newFolder = inject('newFolder')
const newFolderTitle = ref('')
const newFolderTitleEdit = ref(false)

// input
const inputDOM = ref(null)
watch(newFolderTitleEdit, () => {
  if(newFolderTitleEdit.value ) {
    newFolderTitle.value = newFolder.value.title
    nextTick(() => {
      if(inputDOM.value) inputDOM.value.focus()
    })
  }
})

const setNewFolder = inject('setNewFolder')
// set the new folder
const addNewFolder = () => {
  // the default title is 「新建文件夹」
  newFolderTitle.value = '新建文件夹'
  setNewFolder({
    index: 0,
    parentId: folderNavArr.value[0].id,
    title: newFolderTitle.value
  })
  newFolderTitleEdit.value = true
}
const setNewFolderHandler = () => {
  newFolderTitleEdit.value = false
  setNewFolder({
    index: 0,
    parentId: folderNavArr.value[0].id,
    title: newFolderTitle.value
  })
}
</script>
<template>
  <div class="self-stretch w-full max-h-full"
    :class="expand ? (currentTree.length <= 2 ? 'col-span-2 row-span-2' : (currentTree.length <= 4 ? 'col-span-2 row-span-2' : (currentTree.length <= 12 ? 'col-span-2 row-span-3' : 'col-span-2 row-span-4'))) : 'col-span-1 row-span-1'">
    <!-- collapse the folder -->
    <div v-show="!expand" :title="props.rootName"
      class="flex justify-start items-start">
      <button class="shrink-0 pl-1 pr-0.5 py-1 transition-colors duration-300"
      :class="(selectFolderType === 'old' && selectFolderNodeId === props.rootId) ? 'text-white bg-green-500 hover:bg-green-600 rounded-l' : 'text-orange-300 hover:text-orange-400 hover:bg-orange-50 rounded'"
      @click="expand = true">
        <Iconify :icon="props.rootTree.length > 0 ? 'ph:folder-fill' : 'ph:folder'" class="w-5 h-5" />
      </button>
      <button class="pl-0.5 pr-1 py-1 text-sm break-all transition-colors duration-300"
      :class="(selectFolderType === 'old' && selectFolderNodeId === props.rootId) ? 'text-white bg-green-500 rounded-r' : 'text-gray-700 hover:text-green-600 hover:bg-green-100 rounded'"
      @click="setSelectFolderId(props.rootId)">{{ props.rootName }}</button>
    </div>
    <!-- expand the folder -->
    <div v-show="expand" class="w-full h-full flex flex-col">
      <!-- a nav bar -->
      <div class="shrink-0 w-full flex justify-between items-center">
        <!-- current folder node, the first item of folder nav -->
        <div
          :key="folderNavArr[0].id"
          class="shrink-0 group w-fit p-1 flex justify-center items-center gap-1 relative z-10 text-xs font-bold bg-gradient-to-b from-10% to-white border-t border-x rounded-t translate-y-px"
          :class="(selectFolderType === 'old' && selectFolderNodeId===folderNavArr[0].id) ? 'text-green-400 from-green-50 border-green-300' : 'text-orange-400 from-orange-50 border-orange-300'"
          >
          <div class="flex justify-center items-center">
            <button class="shrink-0 pl-1 pr-0.5 py-1 hover:text-red-500 hover:bg-red-200 rounded transition-colors duration-300" @click="expand = false">
              <Iconify :icon="currentTree.length ? 'ph:folder-open-fill' : 'ph:folder-open'" class="w-4 h-4" />
            </button>
            <button class="pl-0.5 pr-1 py-1 hover:text-green-500 hover:bg-green-100 rounded transition-colors duration-300" @click="setSelectFolderId(folderNavArr[0].id)">{{ folderNavArr[0].title || '未命名文件夹' }}</button>
          </div>
          <button class="shrink-0 p-1 rounded transition-colors duration-300" :class="(selectFolderType === 'old' && selectFolderNodeId === folderNavArr[0].id) ? 'text-green-500 hover:text-green-600 hover:bg-green-200' : 'text-orange-500 hover:text-orange-600 hover:bg-orange-200'" @click="setNodeTreeId(folderNavArr[0].id)"
          >
            <Iconify icon="ph:arrow-square-out" class="w-4 h-4" />
          </button>
        </div>
        <!-- folder nav items -->
        <div v-show="folderNavArr.length > 1" ref="folderNavContainerDOM"
          class="folder-nav-container grow flex justify-start items-center overflow-x-auto -translate-x-1 translate-y-px scroll-smooth"
          @scroll.passive="folderNavScrollingHandler">
          <button v-for="(folder, index) in folderNavArr.slice(1)"
            :key="folder.id"
            class="shrink-0 p-2 relative text-xs font-bold border-t border-r rounded-tr transition-colors duration-300"
            :class="(selectFolderType === 'old' && selectFolderNodeId === folder.id) ? 'hover:text-green-500 hover:bg-green-100 border-green-300 text-green-400' : 'hover:text-orange-500 hover:bg-orange-100 border-orange-300 text-orange-400'"
            :style="`transform: translateX(-${(index * 2)}px)`" @click="setFolderNavPath(folder.path)">
            {{ folder.title || '未命名文件夹' }}
          </button>
        </div>
        <!-- scroll control buttons -->
        <div class="shrink-0 pl-2 flex items-center gap-0.5">
          <button v-show="showScrollBtn" :disabled="scrollPos === 'start'"
            class="p-1 hidden sm:flex items-center text-gray-500 active:text-white bg-gray-100 hover:bg-gray-200 active:bg-gray-500 rounded-full transition-colors duration-300"
            :class="scrollPos === 'start' ? 'opacity-30' : ''" @click="scrollFolderNavHandler('left')">
            <Iconify icon="ic:round-keyboard-arrow-left" class="w-4 h-4" />
          </button>
          <button v-show="showScrollBtn" :disabled="scrollPos === 'end'"
            class="p-1 hidden sm:flex items-center text-gray-500 active:text-white bg-gray-100 hover:bg-gray-200 active:bg-gray-500 rounded-full transition-colors duration-300"
            :class="scrollPos === 'end' ? 'opacity-30' : ''" @click="scrollFolderNavHandler('right')">
            <Iconify icon="ic:round-keyboard-arrow-right" class="w-4 h-4" />
          </button>
          <button title="add new sub folder"
            :disabled="newFolder && newFolder.parentId === folderNavArr[0].id"
            class="p-1 flex items-center rounded-full transition-colors duration-300"
            :class="(selectFolderType === 'old' && selectFolderNodeId === folderNavArr[0].id) ? 'text-green-500 hover:text-green-600 active:text-white bg-green-100 hover:bg-green-200 active:bg-green-500' : 'text-orange-400 hover:text-orange-500 active:text-white bg-orange-100 hover:bg-orange-200 active:bg-orange-500'"
            :style="newFolder && newFolder.parentId === folderNavArr[0].id ? 'opacity: 0.3' : ''"
            @click="addNewFolder"
            >
            <Iconify icon="ic:round-plus" class="w-4 h-4" />
          </button>
        </div>
      </div>
      <div
      class="nodes-container grow p-2 overflow-y-auto bg-white border rounded-b rounded-tr"
      :class="(selectFolderType === 'old' && selectFolderNodeId === folderNavArr[0].id) ? 'border-green-300 ' : 'border-orange-300'">
        <div class="flex flex-wrap justify-start items-start gap-1">
          <!-- new folder -->
          <div v-if="selectFolderType === 'new' && newFolder && newFolder.parentId === folderNavArr[0].id" class="p-1.5 flex justify-center items-center gap-1 text-white bg-purple-500 hover:bg-purple-600 rounded transition-colors duration-300">
            <Iconify icon="ph:folder-dashed" class="shrink-0 w-4 h-4" ></Iconify>
            <div v-show="newFolderTitleEdit" class="flex justify-center items-center gap-2">
              <input ref="inputDOM" type="text" placeholder="请输入目录名称" v-model="newFolderTitle" class="px-1.5 text-xs text-purple-500 placeholder:text-purple-300 focus:text-purple-600 outline outline-1 outline-purple-400 focus:outline-purple-500 rounded-md" @keyup.enter="setNewFolderHandler">
              <button class="shrink-0 p-0.5 text-green-600 hover:text-white bg-green-300 hover:bg-green-400 rounded transition-colors duration-300" @click="setNewFolderHandler">
                <Iconify icon="ph:check-bold" class="w-3 h-3"></Iconify>
              </button>
            </div>
            <div v-show="!newFolderTitleEdit" class="flex justify-center items-center gap-2">
              <span class="text-xs text-white" @dblclick="newFolderTitleEdit=true">{{ newFolder.title || '未命名文件夹' }}</span>
              <button class="shrink-0 p-0.5 text-purple-600 hover:text-white bg-purple-50 hover:bg-purple-400 rounded transition-colors duration-300" @click="newFolderTitleEdit=true">
                <Iconify icon="ph:cursor-text" class="w-3 h-3"></Iconify>
              </button>
            </div>
          </div>
          <!-- children item of the folder -->
          <template v-for="(item, index) in sortedTree">
            <!-- bookmark item -->
            <div v-if="!item.children" :key="item.id" class="p-1.5 flex justify-center items-center gap-1 text-blue-400 select-none">
              <img v-if="item.url" :src="useGetFaviconURL(item.url)" alt="bookmark icon" class="shrink-0 w-4 h-4">
              <Iconify v-else icon="ph:planet-fill" class="shrink-0 w-4 h-4"></Iconify>
              <span class="line-camp-1 text-xs">{{ item.title || '未命名书签' }}</span>
            </div>
            <!-- sub-folder item -->
            <div v-if="item.children" :key="item.id"
              class="flex justify-center items-start">
              <button class="pl-1.5 pr-0.5 py-1.5  transition-colors duration-300"
              :class="(selectFolderType === 'old' && selectFolderNodeId === item.id) ? 'text-white bg-green-500 hover:bg-green-600 rounded-l' : 'text-orange-300 hover:text-orange-400 hover:bg-orange-50 rounded'"
              @click="addFolderNav(item.id, item.title, index)">
                <Iconify :icon="item.children.length > 0 ? 'ph:folder-fill' : 'ph:folder'" class="shrink-0 w-4 h-4" />
              </button>
              <button class="pl-0.5 pr-1.5 py-1.5 text-xs break-all transition-colors duration-300"
              :class="(selectFolderType === 'old' && selectFolderNodeId === item.id) ? 'text-white bg-green-500 rounded-r' : 'text-gray-500 hover:text-green-600 hover:bg-green-100 rounded'"
              @click="setSelectFolderId(item.id)">
                {{ item.title || '未命名文件夹' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.folder-nav-container {
  &::-webkit-scrollbar {
    display: none;
  }
}

.nodes-container {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 2px;
  }

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

.line-camp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
