<script setup>
import { inject } from 'vue';
import { Icon as Iconify } from '@iconify/vue'
import { useGetFaviconURL } from '@/composables/getFaviconURL'
import FolderGridItem from './FolderGridItem.vue'
const props = defineProps(['folder-path', 'nodes'])

const setNodeTreeId = inject('setNodeTreeId')
const selectFolderNodeId = inject('selectFolderNodeId')
</script>

<template>
  <div>
    <div class="px-2 py-1.5 flex flex-wrap justify-start items-center gap-1 bg-orange-50/50 border-b border-orange-200 rounded-t-md shadow shadow-orange-50">
      <!-- folder path -->
      <div v-for="(folder, index) in folderPath" :key="folder.id" class="flex justify-center items-center gap-1 text-orange-500">
        <button class="px-2 py-1 text-xs font-bold rounded transition-colors duration-300"
        :class="selectFolderNodeId === folder.id ? 'text-green-500 hover:bg-green-100 ' : 'text-orange-500 hover:bg-orange-100 '"
        @click="setNodeTreeId(folder.id)">{{ folder.id === '0' ? '根目录' : (folder.title || '未命名文件夹') }}</button>
        <span v-if="index < folderPath.length -1">/</span>
      </div>
    </div>
    <!-- nodes grid -->
    <div class="grid-container w-full max-h-[500px] overflow-y-auto  px-4 py-6 grid grid-cols-4 gap-2 grid-flow-row-dense justify-items-start">
      <template v-for="node in nodes">
        <!-- the bookmark node -->
        <div v-if="!node.children" :key="node.id" class="p-1 flex justify-center items-center gap-1 text-blue-400 select-none">
          <img v-if="node.url" :src="useGetFaviconURL(node.url)" alt="bookmark icon" class="shrink-0 w-4 h-4">
          <Iconify v-else icon="ph:planet-fill" class="shrink-0 w-5 h-5"></Iconify>
          <span class="line-camp-1 text-xs">{{ node.title || '未命名书签' }}</span>
        </div>
        <!-- the folder node -->
        <FolderGridItem v-if="node.children" :key="node.id" :root-id="node.id" :root-name="node.title" :root-tree="node.children"></FolderGridItem>
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

.line-camp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}
</style>