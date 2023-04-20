<script setup>
import { defineProps } from 'vue';
import { Icon as Iconify } from '@iconify/vue'
import { useGetFaviconURL } from '@/composables/getFaviconURL'
const props = defineProps(['nodes'])

console.log();
</script>

<template>
  <div>
    <div>

    </div>
    <div class="nodes-container w-full px-4 grid grid-cols-4 gap-4 grid-flow-row-dense justify-items-start">
      <template v-for="node in nodes">
        <div v-if="!node.children" :key="node.id" class="flex justify-center items-center gap-1 text-blue-400 opacity-60 select-none">
          <!-- <img v-if="node.url" :src="useGetFaviconURL(node.url)" alt="bookmark icon" class="w-4 h-4"> -->
          <Iconify icon="ph:planet-fill" class="w-4 h-4"></Iconify>
          <span  class="text-sm">{{ node.title }}</span>
        </div>
        <button v-if="node.children" :key="node.id" class="flex justify-center items-center gap-1 text-amber-400">
          <Iconify :icon="node.children.length > 0 ? 'ph:folder-fill' : 'ph:folder'" class="w-5 h-5"></Iconify>
          <span class="text-sm font-bold">{{ node.title }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.nodes-container {
  grid-auto-rows: 40px
}
</style>