<script setup>
import { Icon as Iconify } from '@iconify/vue'
import { useGetFaviconURL } from '@/composables/getFaviconURL'
import FolderGridItem from './FolderGridItem.vue'
import { watch } from 'vue';
const props = defineProps(['folder-path', 'nodes'])

// watch(() => props.folderPath, () => {
//   console.log(props.folderPath);
// }, {immediate: true})
</script>

<template>
  <div>
    <div class="px-4 py-3 mb-3 flex flex-wrap justify-start items-center gap-1 border-b border-amber-200">
      <div v-for="(folder, index) in folderPath" :key="folder.id" class="flex justify-center items-center gap-1 text-amber-500">
        <button class="px-2 py-1 text-xs font-bold text-amber-500 hover:bg-amber-100 rounded transition-colors duration-300">{{ folder.id === '0' ? 'root' : (folder.title || '未命名') }}</button>
        <span v-if="index < folderPath.length -1">/</span>
      </div>

    </div>
    <div class="nodes-container w-full px-4 pb-3 grid grid-cols-4 gap-2 grid-flow-row-dense justify-items-start">
      <template v-for="node in nodes">
        <div v-if="!node.children" :key="node.id" class="px-2 py-1 flex justify-center items-start gap-1 text-blue-400 opacity-[.75] select-none">
          <!-- <img v-if="node.url" :src="useGetFaviconURL(node.url)" alt="bookmark icon" class="shrink-0 w-4 h-4"> -->
          <Iconify icon="ph:planet-fill" class="shrink-0 w-5 h-5"></Iconify>
          <span class="line-camp-1 text-sm">{{ node.title }}</span>
        </div>
        <FolderGridItem v-if="node.children" :key="node.id" :root-name="node.title" :root-tree="node.children"></FolderGridItem>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.nodes-container {
  grid-auto-rows: 28px
}
.line-camp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}
</style>