<script setup>
import { onMounted, ref } from 'vue';
import { useCheckBookmarkState } from '@/composable/checkBookmarkState'
import { useGetFaviconURL } from '@/composable/getFaviconURL'
import { Icon as Iconify, loadIcon } from '@iconify/vue'

const bookmarkState = ref(false)
const title = ref('')
const url = ref('')
const iconURL = ref('')
onMounted(async () => {
  // get current tab
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  // console.log(tab);

  title.value = tab.title
  url.value = tab.url || tab.pendingUrl;
  iconURL.value = useGetFaviconURL(url.value)

  bookmarkState.value = await useCheckBookmarkState(url.value);
})

</script>

<template>
  <div>
    <header class="border-b shadow">
      <div class="py-3 flex justify-center items-center gap-2">
        <img v-if="iconURL" :src="iconURL" alt="bookmark icon" class="w-6 h-6">
        <Iconify v-else icon="emojione:bookmark" class="inline-block w-6 h-6"></Iconify>
        <span class="text-lg font-semibold">{{ title || '书签' }}</span>
        <sup class="px-2 py-0.5 text-xs font-thin text-white rounded" :class="bookmarkState ? 'bg-green-500' : 'bg-gray-500'">{{ bookmarkState ? '已保存' : '未保存' }}</sup>
      </div>
    </header>
  </div>
</template>

<style scoped>

</style>
