<script setup>
import { onMounted, ref } from 'vue';
import { useCheckBookmarkState } from '@/composable/checkBookmarkState'
import { useGetFaviconURL } from '@/composable/getFaviconURL'
import { Icon as Iconify, loadIcon } from '@iconify/vue'

const bookmarkState = ref(false)
const bookmarkTitle = ref('')
const bookmarkURL = ref('')
const iconURL = ref('')
onMounted(async () => {
  // get current tab
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  // console.log(tab);

  bookmarkTitle.value = tab.title
  bookmarkURL.value = tab.url || tab.pendingUrl;
  iconURL.value = useGetFaviconURL(bookmarkURL.value)

  bookmarkState.value = await useCheckBookmarkState(bookmarkURL.value);
})

const changeHeightHandler = (event) => {
  event.target.style.height = 'auto'
  event.target.style.height = `${event.target.scrollHeight}px`

}
</script>

<template>
  <div>
    <header class="px-4 py-3 flex justify-between sticky top-0 inset-x-0 bg-gray-50 border-b shadow">
      <div class="flex justify-center items-center gap-2">
        <!-- <img v-if="iconURL" :src="iconURL" alt="bookmark icon" class="w-6 h-6"> -->
        <Iconify icon="emojione:bookmark" class="inline-block w-6 h-6"></Iconify>
        <span class="px-2 py-1 text-xs font-thin text-white rounded" :class="bookmarkState ? 'bg-amber-500' : 'bg-emerald-500'">{{ bookmarkState ? '已保存' : '未保存' }}</span>
      </div>
    </header>
    <main class="p-4 space-y-2">
      <section class=" focus-within:bg-gray-50">
        <p class="section-title text-gray-600">
          <Iconify icon="ph:text-aa-fill" class="section-title-icon"></Iconify>
          <span class="text-base font-semibold">名称</span>
        </p>
        <div class="textarea-container border-gray-200 focus-within:border-gray-400">
          <textarea name="bookmark name" id="bookmark-name" class="text-gray-700 placeholder:text-gray-300" placeholder="请输入书签的名称" v-model="bookmarkTitle" @input="changeHeightHandler"></textarea>
          </div>
      </section>
      <section class="focus-within:bg-blue-50/50">
        <p class="section-title text-blue-500">
          <Iconify icon="ph:link-fill" class="section-title-icon"></Iconify>
          <span class="text-base font-semibold">链接</span>
        </p>
        <div class="textarea-container border-blue-200 focus-within:border-blue-400">
          <textarea name="bookmark url" id="bookmark-url" class="text-blue-600 placeholder:text-blue-200" placeholder="请输入书签的链接地址" v-model="bookmarkURL" @input="changeHeightHandler"></textarea>
        </div>
      </section>
        <section class="">
          <p class="section-title text-amber-400">
            <Iconify icon="ph:folder-notch-fill" class="section-title-icon"></Iconify>
            <span class="text-base font-semibold">文件夹</span>
          </p>
          <div class="w-full max-h-[500px] border border-amber-200 rounded-md">
            folder
          </div>
        </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
section {
  @apply w-full p-4 space-y-3 rounded transition-colors duration-300;
  .section-title {
    @apply flex justify-start items-center gap-2;
    .section-title-icon {
      @apply w-7 h-7;
    }
  }
  .textarea-container {
    @apply p-2 border rounded-md transition-colors duration-300;
    textarea {
      @apply w-full min-h-[1.25rem] max-h-[300px] text-sm bg-transparent resize-none overflow-y-auto focus:outline-none overscroll-y-none;
      // overflow-y: overlay;
      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        border-radius: 3px;
      }
    }
    #bookmark-name {
      &::-webkit-scrollbar-thumb {
        background-color: #d1d5db;
      }
      &::-webkit-scrollbar-thumb:hover {
        background-color: #9ca3af;
      }
    }

    #bookmark-url {
      &::-webkit-scrollbar-thumb {
        background-color: #bfdbfe;
      }
      &::-webkit-scrollbar-thumb:hover {
        background-color: #60a5fa;
      }
    }
  }
}
</style>
