<script setup>
import { ref, computed, nextTick, inject } from 'vue'
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
const selectFolderNodeId = inject('selectFolderNodeId')
const setSelectFolderId = inject('setSelectFolderId')
</script>
<template>
  <div class="self-stretch w-full max-h-full"
    :class="expand ? (currentTree.length <= 2 ? 'col-span-2 row-span-2' : (currentTree.length <= 4 ? 'col-span-2 row-span-2' : (currentTree.length <= 12 ? 'col-span-2 row-span-3' : 'col-span-2 row-span-4'))) : 'col-span-1 row-span-1'">
    <!-- collapse the folder -->
    <div v-show="!expand" :title="props.rootName"
      class="flex justify-start items-start"
      :class="selectFolderNodeId === props.rootId ? 'text-green-400' : 'text-amber-400'">
      <button class="shrink-0 pl-1 pr-0.5 py-1 hover:text-amber-400 hover:bg-amber-50 rounded transition-colors duration-300" @click="expand = true">
        <Iconify :icon="props.rootTree.length > 0 ? 'ph:folder-fill' : 'ph:folder'" class="w-5 h-5" />
      </button>
      <button class="pl-0.5 pr-1 py-1 text-sm font-bold hover:text-green-400 hover:bg-green-50 break-all rounded transition-colors duration-300" @click="setSelectFolderId(props.rootId)">{{ props.rootName }}</button>
    </div>
    <!-- expand the folder -->
    <div v-show="expand" class="w-full h-full flex flex-col">
      <!-- a nav bar -->
      <div class="shrink-0 w-full flex justify-between items-center">
        <!-- current folder node, the first item of folder nav -->
        <button
          :key="folderNavArr[0].id"
          class="shrink-0 group w-fit p-2 flex justify-center items-center gap-1 relative z-10 text-xs font-bold active:text-white bg-gradient-to-b from-10% to-white border-t border-x rounded-t transition-colors duration-300 translate-y-px"
          :class="selectFolderNodeId===folderNavArr[0].id ? 'text-green-400 hover:text-green-500 from-green-50 active:bg-green-500 border-green-300 ' : 'text-amber-400 hover:text-amber-500 from-amber-50 active:bg-amber-500 border-amber-300 '"
          @click="setNodeTreeId(folderNavArr[0].id)">
          <Iconify :icon="currentTree.length ? 'ph:folder-open-fill' : 'ph:folder-open'" class="shrink-0 w-4 h-4 group-active:text-white" />
          <span>{{ folderNavArr[0].title }}</span>
        </button>
        <!-- folder nav items -->
        <div v-show="folderNavArr.length > 1" ref="folderNavContainerDOM"
          class="folder-nav-container grow flex justify-start items-center overflow-x-auto -translate-x-1 translate-y-px scroll-smooth"
          @scroll.passive="folderNavScrollingHandler">
          <button v-for="(folder, index) in folderNavArr.slice(1)"
            :key="folder.id"
            class="shrink-0 p-2 relative text-xs font-bold border-t border-r rounded-tr transition-colors duration-300"
            :class="selectFolderNodeId === folder.id ? 'hover:text-green-500 hover:bg-green-100 border-green-300 text-green-400' : 'hover:text-amber-500 hover:bg-amber-100 border-amber-300 text-amber-400'"
            :style="`transform: translateX(-${(index * 2)}px)`" @click="setFolderNavPath(folder.path)">
            {{ folder.title }}
          </button>
        </div>
        <!-- scroll control buttons -->
        <div class="shrink-0 pl-2 flex items-center gap-0.5">
          <button v-show="showScrollBtn" :disabled="scrollPos === 'start'"
            class="p-1 hidden sm:flex items-center text-gray-500 active:text-white bg-gray-100 hover:bg-gray-200 active:bg-gray-500 rounded-full transition-colors duration-300"
            :class="scrollPos === 'start' ? 'opacity-30' : ''" @click="scrollFolderNavHandler('left')">
            <Iconify icon="ic:round-keyboard-arrow-left" class="w-3.5 h-3.5" />
          </button>
          <button v-show="showScrollBtn" :disabled="scrollPos === 'end'"
            class="p-1 hidden sm:flex items-center text-gray-500 active:text-white bg-gray-100 hover:bg-gray-200 active:bg-gray-500 rounded-full transition-colors duration-300"
            :class="scrollPos === 'end' ? 'opacity-30' : ''" @click="scrollFolderNavHandler('right')">
            <Iconify icon="ic:round-keyboard-arrow-right" class="w-3.5 h-3.5" />
          </button>
          <button
            class="p-1 flex items-center text-red-400 active:text-white bg-red-50 hover:bg-red-100 active:bg-red-500 rounded-full transition-colors duration-300"
            @click="expand = false">
            <Iconify icon="ion:close" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div
      class="nodes-container grow p-2 overflow-y-auto bg-white border rounded-b rounded-tr"
      :class="selectFolderNodeId === folderNavArr[0].id ? 'border-green-300 ' : 'border-amber-300 '">
        <div class="flex flex-wrap justify-start items-start gap-1">
          <!-- children item of the folder -->
          <template v-for="(item, index) in sortedTree">
            <!-- bookmark item -->
            <div v-if="!item.children" :key="item.id" class="p-1.5 flex justify-center items-start gap-1 text-blue-400 opacity-70 select-none">
              <!-- <img v-if="item.url" :src="useGetFaviconURL(item.url)" alt="bookmark icon" class="shrink-0 w-4 h-4"> -->
              <Iconify icon="ph:planet-fill" class="shrink-0 w-4 h-4"></Iconify>
              <span class="text-xs line-camp-1">{{ item.title }}</span>
            </div>
            <!-- sub-folder item -->
            <div v-if="item.children" :key="item.id"
              class="flex justify-center items-start"
              :class="selectFolderNodeId === item.id ? 'text-green-400' : 'text-amber-400'">
              <button class="pl-2 pr-0.5 py-1.5 hover:text-amber-400 hover:bg-amber-5 rounded transition-colors duration-300"
              @click="addFolderNav(item.id, item.title, index)">
                <Iconify :icon="item.children.length > 0 ? 'ph:folder-fill' : 'ph:folder'" class="shrink-0 w-4 h-4" />
              </button>
              <button class="pl-0.5 pr-2 py-1.5 text-xs font-bold hover:text-green-400 hover:bg-green-50 break-all rounded transition-colors duration-300"
              @click="setSelectFolderId(item.id)">
                {{ item.title }}
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
    background-color: #fef3c7;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #fde68a;
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
