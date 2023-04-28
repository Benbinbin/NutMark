<script setup>
import { ref, watch, provide, inject } from 'vue';
import { Icon as Iconify } from '@iconify/vue';
import FolderGrid from './FolderGrid.vue';
import SearchFolder from './SearchFolder.vue';

/**
 * select folder
 */
const selectFolderType = inject('selectFolderType');

const bookmarkFolderId = inject('bookmarkFolderId');
const setBookmarkFolderId = inject('setBookmarkFolderId');

const newFolder = inject('newFolder');
const setNewFolder = inject('setNewFolder');

// the folder node selected (an object without children property)
const selectFolderNode = ref(null) // an object

// get the node tree object
watch(bookmarkFolderId, async () => {
  if(bookmarkFolderId.value) {
    const result = await chrome.bookmarks.get(bookmarkFolderId.value)
    selectFolderNode.value = result[0]
  }
}, { immediate: true })

/**
 * node tree
 */
// node tree (with children property)
// nodeTreeId is folder id of node tree start point
const nodeTreeId = ref('0')
const nodeTree = ref(null) // an object (data structure is a tree)

// set the node tree id manually or automatically
const setNodeTreeId = (id) => {
  nodeTreeId.value = id
  showFolderSearch.value = false
}
provide('nodeTreeId', nodeTreeId)
provide('setNodeTreeId', setNodeTreeId)

const getTreeId = async (folderId) => {
  // get the folder id for the node tree based on a given folder id
  const resultForFolderNode = await chrome.bookmarks.get(folderId);
  const folderNode = resultForFolderNode[0];

  let targetId;
  if (folderNode.parentId) {
    // if the folder node has parent folder
    targetId = folderNode.parentId;
  } else {
    // if the folder node doesn't have parent folder
    // (when the folder is the root folder)
    // then set the node tree id as this folder
    targetId = folderNode.id;
  }
  return targetId;
}

// set node tree id (and bookmark folder id) init value
if (bookmarkFolderId.value) {
  // if the tab has already bookmarked
  nodeTreeId.value = await getTreeId(resultForBookmark.parentId);
} else {
  // if the tab doesn't bookmark
  // get recent bookmark to set folder
  const recentBookmarkArr = await chrome.bookmarks.getRecent(1);

  if (recentBookmarkArr.length > 0) {
    // if there is a bookmark created recently
    const recentBookmark = recentBookmarkArr[0];
    setBookmarkFolderId(recentBookmark.parentId);
    nodeTreeId.value = await getTreeId(recentBookmark.parentId);
  } else {
    // if there isn't any bookmarks created recently
    // (when this is a brand new browser)
    // set the node tree based on the root node
    nodeTreeId.value = '0';
    // and set the selected folder as the first children node
    // 根目录下的第一个子文件夹一般就是「书签栏」
    setBookmarkFolderId('1');
  }
}

// watch the nodeTreeId change and get the node tree object
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
}, { immediate: true })

/**
 * folder path in component header navbar
 */
const folderPath = ref([])

const getFolderPath = async (id) => {
  const resultForFolderNode = await chrome.bookmarks.get(id)
  const folderNode = resultForFolderNode[0]
  folderPath.value.unshift(folderNode)
  if (folderNode.parentId) {
    // recursion get the folder path
    // from the node tree top folder to the root folder
    getFolderPath(folderNode.parentId)
  }
}

// update the folder path when the nodeTree change
watch(nodeTreeId, () => {
  // reset folder path
  folderPath.value = []
  getFolderPath(nodeTreeId.value)
}, { immediate: true })

/**
 * search folder
 */
const showFolderSearch = ref(false)
</script>

<template>
  <section>
    <div class="flex justify-between items-center">
      <div class="flex justify-start items-center gap-4">
        <p class="section-title text-orange-300">
          <Iconify icon="ph:folder-notch-fill" class="section-title-icon"></Iconify>
          <span class="text-base font-semibold">文件夹</span>
        </p>
        <!-- the selected folder to hold the bookmark -->
        <button v-if="selectFolderType !== 'new'" class="px-2 py-1.5 text-xs font-bold rounded transition-colors duration-300" :class="selectFolderNode ? 'text-green-500 hover:text-white bg-green-200/60 hover:bg-green-500' : 'text-green-300'" :disabled="!selectFolderNode"
        @click="setNodeTreeId(selectFolderNode.parentId)">
          <span v-if="selectFolderNode">{{ selectFolderNode.title }}</span>
          <span v-else class="underline decoration-wavy decoration-2 decoration-green-300 underline-offset-2">请选择文件夹 👇</span>
        </button>
        <div v-if="newFolder && selectFolderType === 'new'" class="relative">
          <button class="px-2 py-1.5 text-xs font-bold text-purple-500 hover:text-white bg-purple-200/60 hover:bg-purple-500 rounded transition-colors duration-300" @click="setNodeTreeId(newFolder.parentId)">{{ newFolder.title || '未命名文件夹' }}</button>
          <sup class="px-2 py-0.5 flex justify-center absolute -top-2 -right-4 text-xs text-white bg-red-400 rounded-full scale-[0.8] rotate-45 select-none">new</sup>
        </div>
      </div>
      <button class="p-1.5 rounded transition-colors duration-300"
      :class="showFolderSearch ? 'text-white bg-orange-400 hover:bg-orange-300' : 'text-orange-400 hover:text-orange-500 hover:bg-orange-100'"
      @click="showFolderSearch = !showFolderSearch">
        <Iconify icon="ph:magnifying-glass" class="w-4 h-4"></Iconify>
      </button>
    </div>
    <div class="w-full">
      <FolderGrid v-if="nodeTree" v-show="!showFolderSearch" :folder-path="folderPath" :nodes="nodeTree.children"></FolderGrid>
      <SearchFolder v-show="showFolderSearch" :show-state="showFolderSearch" @hide="showFolderSearch = false"></SearchFolder>
    </div>
  </section>
</template>

<style lang="scss" scoped>

</style>