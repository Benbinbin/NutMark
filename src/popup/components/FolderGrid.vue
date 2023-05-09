<script setup>
import { ref, inject, watch, nextTick, provide } from 'vue';
import { Icon as Iconify } from '@iconify/vue';
import { useGetFaviconURL } from '@/composables/getFaviconURL';
import { useGetTranslation } from '@/composables/getTranslation';
import FolderGridItem from './FolderGridItem.vue';

const props = defineProps(['nodeTreeFolder', 'folderPath', 'nodes', ]);

const showBookmark = ref(true)
provide('showBookmark', showBookmark)

const nodeTreeId = inject('nodeTreeId')
const setNodeTreeId = inject('setNodeTreeId')

const selectFolderType = inject('selectFolderType')
const bookmarkFolderId = inject('bookmarkFolderId')
const setBookmarkFolderId = inject('setBookmarkFolderId')

// new folder
const newFolder = inject('newFolder')
const newFolderTitle = ref('')
const newFolderTitleEdit = ref(false)

// input
const inputDOM = ref(null)
watch(newFolderTitleEdit, () => {
  if (newFolderTitleEdit.value) {
    newFolderTitle.value = newFolder.value.title
    nextTick(() => {
      if(inputDOM.value) inputDOM.value.focus()
    })
  }
})

const setNewFolder = inject('setNewFolder')
// set the new folder
const addNewFolder = () => {
  // the default title is "New folder" or 「新建文件夹」
  newFolderTitle.value = useGetTranslation('bookmark_new_folder_default_title')
  setNewFolder({
    index: 0,
    parentId: nodeTreeId.value,
    title: newFolderTitle.value
  })
  newFolderTitleEdit.value = true
}
const setNewFolderHandler = () => {
  newFolderTitleEdit.value = false
  setNewFolder({
    index: 0,
    parentId: nodeTreeId.value,
    title: newFolderTitle.value
  })
}
</script>

<template>
  <div class="rounded-md shadow shadow-orange-100">
    <!-- grid header -->
    <div class="px-2 py-1.5 flex justify-between items-start gap-4 bg-orange-50/50 border-b border-orange-200 rounded-t-md shadow shadow-orange-50">
      <div class="grow flex justify-start items-start gap-1">
        <button :title="useGetTranslation('popup_main_bookmark_folder_section_toggle_bookmark_btn_title')" @click="showBookmark = !showBookmark" class="shrink-0 p-1 rounded transition-colors duration-300" :class="showBookmark ? 'hover:bg-orange-100' : 'hover:bg-orange-200'">
          <img src="@/assets/nut-mark.svg" alt="nut mark icon" class="w-4 h-4" :class="showBookmark ? 'opacity-100' : 'opacity-30'">
        </button>
        <!-- folder path -->
        <div class="flex flex-wrap justify-start items-center gap-0.5">
          <template v-for="folder in props.folderPath" :key="folder.id">
            <span class="text-orange-500 text-xs select-none">/</span>
            <button :title="useGetTranslation('popup_main_bookmark_folder_section_folder_path_nav_btn_title')" class="px-1.5 py-1 text-xs font-bold rounded transition-colors duration-300"
            :class="selectFolderType === 'old' && bookmarkFolderId === folder.id ? 'text-green-500 hover:bg-green-100' : 'text-orange-500 hover:bg-orange-100'"
            @click="setNodeTreeId(folder.id)">{{ folder.id === '0' ? useGetTranslation('popup_main_bookmark_folder_section_folder_path_nav_root_btn_content') : (folder.title || useGetTranslation('bookmark_folder_default_name')) }}</button>
          </template>
          <span class="text-orange-500 text-xs select-none">/</span>
          <button v-if="props.nodeTreeFolder && props.nodeTreeFolder.id !== '0'" class="px-1.5 py-1 text-xs font-bold hover:text-green-500 hover:bg-green-100 rounded transition-colors duration-300"
              :class="props.nodeTreeFolder && selectFolderType === 'old' && bookmarkFolderId === props.nodeTreeFolder.id ? 'text-green-500' : 'text-orange-500'"
              @click="setBookmarkFolderId(props.nodeTreeFolder.id)">
            {{ props.nodeTreeFolder.title || useGetTranslation('bookmark_folder_default_name') }}
          </button>
          <div v-if="props.nodeTreeFolder && props.nodeTreeFolder.id === '0'" class="px-1.5 py-1 text-xs font-bold text-orange-500 rounded select-none">
            {{ useGetTranslation('popup_main_bookmark_folder_section_folder_path_nav_root_btn_content') }}
          </div>
        </div>
      </div>
      <div>
        <button v-if="nodeTreeId !== '0'" :title="useGetTranslation('popup_main_bookmark_folder_section_add_new_folder_btn_title')"
          :disabled="nodeTreeId === '0' || (newFolder && newFolder.parentId === nodeTreeId)"
          class="p-1 flex items-center text-orange-500 hover:text-orange-600 active:text-white bg-orange-100 hover:bg-orange-200 active:bg-orange-500 rounded-full transition-colors duration-300"
          :style="nodeTreeId === '0' || (newFolder && newFolder.parentId === nodeTreeId) ? 'opacity: 0.3' : ''"
          @click="addNewFolder"
          >
          <Iconify icon="ic:round-plus" class="w-4 h-4" />
        </button>
      </div>
    </div>
    <!-- nodes grid -->
    <div class="grid-container w-full max-h-[450px] overflow-y-auto px-4 py-6 grid grid-cols-4 gap-2 grid-flow-row-dense justify-items-start rounded-b-md">
      <!-- new folder -->
      <div v-if="selectFolderType === 'new' && newFolder && newFolder.parentId === nodeTreeId" class="w-full h-fit px-1.5 py-1 flex justify-center items-center gap-1 text-white bg-purple-500 hover:bg-purple-600 rounded" >
        <Iconify icon="ph:folder-dashed" class="shrink-0 w-5 h-5"></Iconify>
        <div v-show="newFolderTitleEdit" class="grow flex justify-between items-center gap-2">
          <input ref="inputDOM" type="text" :placeholder="useGetTranslation('popup_main_bookmark_folder_section_new_folder_name_input_placeholder')" v-model="newFolderTitle" class="w-full px-1.5 text-xs text-purple-500 placeholder:text-purple-300 focus:text-purple-600 outline outline-1 outline-purple-400 focus:outline-purple-500 rounded-md" @keyup.enter="setNewFolderHandler" @blur="setNewFolderHandler">
          <button :title="useGetTranslation('popup_main_bookmark_folder_section_confirm_new_folder_name_btn_title')" class="shrink-0 p-1 text-green-800 hover:text-white bg-green-200 hover:bg-green-400 rounded transition-colors duration-300" @click="setNewFolderHandler">
            <Iconify icon="ph:check-bold" class="w-2 h-2"></Iconify>
          </button>
        </div>
        <div v-show="!newFolderTitleEdit" class="grow flex justify-between items-center gap-2">
          <span class="grow text-xs text-white" @dblclick="newFolderTitleEdit = true">{{ newFolder.title || useGetTranslation('bookmark_folder_default_name') }}</span>
          <button :title="useGetTranslation('popup_main_bookmark_folder_section_edit_new_folder_name_btn_title')" class="shrink-0 p-0.5 text-purple-600 hover:text-white bg-purple-50 hover:bg-purple-400 rounded transition-colors duration-300" @click="newFolderTitleEdit = true">
            <Iconify icon="ph:cursor-text" class="w-3 h-3"></Iconify>
          </button>
        </div>
      </div>
      <template v-for="node in props.nodes">
        <!-- the folder node -->
        <FolderGridItem v-if="node.children" :key="node.id" :root-id="node.id" :root-name="node.title" :root-tree="node.children"></FolderGridItem>
        <!-- the bookmark node -->
        <div v-if="!node.children" v-show="showBookmark" :key="node.id" class="px-1 py-2 flex justify-center items-start gap-1 text-blue-400 select-none">
          <img v-if="node.url" :src="useGetFaviconURL(node.url)" alt="bookmark icon" class="shrink-0 w-4 h-4">
          <Iconify v-else icon="ph:planet-fill" class="shrink-0 w-4 h-4"></Iconify>
          <span class="line-camp-1 text-xs">{{ node.title || useGetTranslation('bookmark_folder_default_name') }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.grid-container {
  grid-auto-rows: 36px;

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
</style>