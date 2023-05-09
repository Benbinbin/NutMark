<script setup>
import { ref, watch, provide, inject, onMounted, nextTick } from 'vue';
import { useGetTranslation } from '@/composables/getTranslation';
import { useGetTreeId } from '@/composables/getTreeId';
import { Icon as Iconify } from '@iconify/vue';
import FolderGrid from './FolderGrid.vue';
import SearchFolder from './SearchFolder.vue';

const props = defineProps(['nodeTreeId']);

/**
 * select folder
 */
const selectFolderType = inject('selectFolderType');

const bookmarkOriginFolderId = inject('bookmarkOriginFolderId');
const setBookmarkOriginFolderId = inject('setBookmarkOriginFolderId');

const bookmarkFolderId = inject('bookmarkFolderId');
const setBookmarkFolderId = inject('setBookmarkFolderId');

const resetBookmarkFolder = () => {
  setBookmarkFolderId(bookmarkOriginFolderId.value);
}

// the folder node selected (an object without children property)
const selectFolderNode = ref(null) // an object

// get the node tree object
watch(bookmarkFolderId, async () => {
  if(bookmarkFolderId.value) {
    const result = await chrome.bookmarks.get(bookmarkFolderId.value);
    selectFolderNode.value = result[0];
  }
}, { immediate: true })

const newFolder = inject('newFolder');
const setNewFolder = inject('setNewFolder');

/**
 * node tree
 */
// node tree (with children property)
// nodeTreeId is folder id of node tree start point
const nodeTreeId = ref(props.nodeTreeId);
const nodeTreeFolder = ref(null);
const nodeTree = ref(null); // an object (data structure is a tree)


// set the node tree id manually or automatically
const setNodeTreeId = (id) => {
  nodeTreeId.value = id;
  showFolderSearch.value = false;
}
provide('nodeTreeId', nodeTreeId);
provide('setNodeTreeId', setNodeTreeId);


watch(bookmarkOriginFolderId, async () => {
  nodeTreeId.value = await useGetTreeId(bookmarkOriginFolderId.value);
})

// watch the nodeTreeId change and get the node tree object
watch(nodeTreeId, async () => {
  const result = await chrome.bookmarks.getSubTree(nodeTreeId.value);
  const targetNodeTree = result[0];
  // sort the nodeTree children nodes
  // move the folder node to top
  targetNodeTree.children.sort((nodeA, nodeB) => {
    if (nodeA.children && !nodeB.children) {
      return -1;
    } else if (!nodeA.children && nodeB.children) {
      return 1;
    } else {
      return 0;
    }
  })
  nodeTree.value = targetNodeTree
}, { immediate: true })

/**
 * folder path in component header navbar
 */
const folderPath = ref([]);

const getFolderPath = async (id) => {
  const resultForFolderNode = await chrome.bookmarks.get(id);
  const folderNode = resultForFolderNode[0];
  folderPath.value.unshift(folderNode);
  if (folderNode.parentId) {
    // recursion get the folder path
    // from the node tree top folder to the root folder
    getFolderPath(folderNode.parentId);
  }
}

// watch the nodeTreeId change and update the folder path
watch(nodeTreeId, async () => {
  const resultForFolderNode = await chrome.bookmarks.get(nodeTreeId.value);
  nodeTreeFolder.value = resultForFolderNode[0];
  // reset folder path
  folderPath.value = [];
  if (nodeTreeFolder.value?.parentId) {
    await getFolderPath(nodeTreeFolder.value.parentId);
  }
}, { immediate: true })

/**
 * search folder
 */
const showFolderSearch = ref(false);
</script>

<template>
  <section>
    <div class="flex justify-between items-center">
      <div class="flex justify-start items-center gap-4">
        <p class="section-title text-orange-300">
          <Iconify icon="ph:folder-notch-fill" class="section-title-icon"></Iconify>
          <span class="text-base font-semibold">{{ useGetTranslation('popup_main_bookmark_folder_section_name') }}</span>
        </p>
        <!-- the selected folder to hold the bookmark -->
        <button v-if="selectFolderType !== 'new'"
        :title="useGetTranslation('popup_main_bookmark_folder_section_set_node_tree_id_btn_old_title')" class="px-2 py-1.5 text-xs font-bold rounded transition-colors duration-300" :class="selectFolderNode ? 'text-green-500 hover:text-white bg-green-200/60 hover:bg-green-500' : 'text-green-300'" :disabled="!selectFolderNode"
        @click="setNodeTreeId(selectFolderNode.parentId)">
          <span v-if="selectFolderNode">{{ selectFolderNode.title }}</span>
          <span v-else class="underline decoration-wavy decoration-2 decoration-green-300 underline-offset-2">{{ useGetTranslation('popup_main_bookmark_folder_section_set_node_tree_id_btn_prompt_content') }}</span>
        </button>
        <div v-if="newFolder && selectFolderType === 'new'" class="relative">
          <button :title="useGetTranslation('popup_main_bookmark_folder_section_set_node_tree_id_btn_new_title')" class="px-2 py-1.5 text-xs font-bold text-purple-500 hover:text-white bg-purple-200/60 hover:bg-purple-500 rounded transition-colors duration-300" @click="setNodeTreeId(newFolder.parentId)">{{ newFolder.title || useGetTranslation('bookmark_folder_default_name') }}</button>
          <sup class="px-2 py-0.5 flex justify-center absolute -top-2 -right-4 text-xs text-white bg-red-400 rounded-full scale-[0.8] rotate-45 select-none">new</sup>
        </div>
      </div>
      <div class="flex justify-center items-center gap-1">
        <button :title="useGetTranslation('popup_main_bookmark_folder_section_toggle_search_folder_btn_title')" class="p-1.5 rounded-full transition-colors duration-300"
        :class="showFolderSearch ? 'text-white bg-orange-400 hover:bg-orange-300' : 'text-orange-200 hover:text-orange-500 hover:bg-orange-100'"
        @click="showFolderSearch = !showFolderSearch">
          <Iconify icon="ph:magnifying-glass" class="w-4 h-4"></Iconify>
        </button>
        <button v-show="bookmarkFolderId !== bookmarkOriginFolderId" :title="useGetTranslation('popup_main_bookmark_folder_section_reset_folder_btn_title')"
          class="p-1.5 text-orange-200 hover:text-orange-500 active:text-white hover:bg-orange-100 active:bg-orange-500 rounded-full transition-colors duration-300"
          @click="resetBookmarkFolder">
          <Iconify icon="ph:arrow-counter-clockwise" class="w-4 h-4"></Iconify>
        </button>
      </div>
    </div>
    <div class="w-full">
      <FolderGrid v-if="nodeTree" v-show="!showFolderSearch" :node-tree-folder="nodeTreeFolder" :folder-path="folderPath" :nodes="nodeTree.children"></FolderGrid>
      <SearchFolder v-show="showFolderSearch" :show-state="showFolderSearch" @hide="showFolderSearch = false"></SearchFolder>
    </div>
  </section>
</template>

<style lang="scss" scoped>

</style>