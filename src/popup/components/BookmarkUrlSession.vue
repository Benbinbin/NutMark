<script setup>
import { ref, onMounted, watch, inject, nextTick } from 'vue';
import { Icon as Iconify } from '@iconify/vue';
import { useCheckBookmarkState } from '@/composables/checkBookmarkState';

const props = defineProps(['bookmarkId', 'bookmarkUrl']);
const emit = defineEmits(['update:bookmarkUrl']);

const urlObj = ref(null);

/**
 * setting textarea height
 */
const bookmarkUrlDOM = ref(null);
const changeHeightHandler = (dom) => {
  dom.style.height = 'auto';
  dom.style.height = `${dom.scrollHeight}px`;
}

onMounted(() => {
  nextTick(() => {
    if(bookmarkUrlDOM.value) {
      changeHeightHandler(bookmarkUrlDOM.value);
    }
  })

  watch(showURLBtn, () => {
    if (!showURLBtn.value && bookmarkUrlDOM.value) {
      nextTick(() => {
        changeHeightHandler(bookmarkUrlDOM.value);
      })
    }
  })
})

const urlInputHandler = (event) => {
  emit('update:bookmarkUrl', event.target.value);
  changeHeightHandler(event.target);
}

/**
 * check url validation and bookmark state
 */
const urlValidation = inject('urlValidation');
const setUrlValidation = inject('setUrlValidation');

const validateURL = (url) => {
  try {
    if (url) {
      const result = new URL(url);
      return result;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}

const urlBookmarkNode = ref(null);
const setBookmarkInfo = inject('setBookmarkInfo')

const setBookmarkInfoHandler = () => {
  if(urlBookmarkNode.value) {
    setBookmarkInfo(urlBookmarkNode.value)
  }
}

const checkUrlBookmarkState = async (url) => {
  const resultForUrlBookmarkState = await useCheckBookmarkState(url);
  if (resultForUrlBookmarkState) {
    urlBookmarkNode.value = resultForUrlBookmarkState;
  } else {
    urlBookmarkNode.value = null;
  }
}

watch(() => props.bookmarkUrl, async () => {
  if (props.bookmarkUrl) {
    const result = validateURL(props.bookmarkUrl);
    if (result) {
      setUrlValidation(true);
      urlObj.value = result;
      await checkUrlBookmarkState(props.bookmarkUrl)
    } else {
      setUrlValidation(false);
      urlBookmarkNode.value = null;
    }
  }
}, { immediate: true })

/**
 * set bookmark url by one-click
 */
const showURLBtn = ref(false);

if (urlValidation.value) {
  const result = await chrome.storage.local.get(["showURLBtn"]);
  if (result.showURLBtn) {
    showURLBtn.value = result.showURLBtn;
  } else {
    await chrome.storage.local.set({ showURLBtn: false });
  }
}

const setShowURLBtnHandler = async () => {
  showURLBtn.value = !showURLBtn.value;
  await chrome.storage.local.set({ showURLBtn: showURLBtn.value });
}

const hoverTarget = ref('')

const setBookmarkURL = (target) => {
  if (!urlObj.value) return
  const protocol = `${urlObj.value.protocol}//`;
  const userInfo = (urlObj.value.username && urlObj.value.password) ? `${urlObj.value.username}:${urlObj.value.password}@` : '';
  const hostname = urlObj.value.hostname;
  const port = urlObj.value.port ? `:${urlObj.value.port}` : '';
  const path = urlObj.value.pathname ? urlObj.value.pathname : '';
  const search = urlObj.value.search ? urlObj.value.search : '';
  const hash = urlObj.value.hash ? urlObj.value.hash : '';

  let newUrl = protocol + userInfo + hostname + port + path + search + hash;
  switch (target) {
    case 'path':
      newUrl = protocol + userInfo + hostname + port;
      break;
    case 'search':
      newUrl = protocol + userInfo + hostname + port + path;
      break;
    case 'hash':
      newUrl = protocol + userInfo + hostname + port + path + search;
      break;
    default:
      break;
  }

  emit('update:bookmarkUrl', newUrl);
}

/**
 * reset bookmark url
 */
const bookmarkOriginUrl = inject('bookmarkOriginUrl');

const resetBookmarkURL = () => {
  emit('update:bookmarkUrl', bookmarkOriginUrl.value);
  const result = validateURL(props.bookmarkUrl);
  if (result) {
    urlObj.value = result;
    setUrlValidation(true);
  } else {
    setUrlValidation(false);
  }
}
</script>

<template>
  <section :class="urlValidation ? (showURLBtn ? '' : 'focus-within:bg-sky-50/50') : 'focus-within:bg-red-50/50'">
    <div class="flex justify-between items-end">
      <div class="flex justify-start items-end gap-2">
        <p class="section-title text-sky-500">
          <Iconify icon="ph:link-fill" class="section-title-icon"></Iconify>
          <span class="text-base font-semibold">链接</span>
        </p>
        <div v-if="!urlValidation"
          class="w-fit px-2 py-1 flex justify-center items-center gap-1 bg-red-100 scale-90 origin-left rounded-full">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span class="text-xs text-red-500">请输入格式正确的链接</span>
        </div>
        <button v-if="urlBookmarkNode && urlBookmarkNode.id !== props.bookmarkId" class="w-fit pl-2 pr-2.5 py-1 flex justify-center items-center gap-1 text-amber-600 hover:text-amber-700 bg-amber-100 hover:bg-amber-200 scale-90 origin-left rounded-full transition-colors duration-300"
        @click="setBookmarkInfoHandler">
          <img src="@/assets/nut-mark.svg" alt="nut mark icon" class="w-4 h-4">
          <span class="text-xs">存在书签与该 URL 相匹配</span>
        </button>
      </div>
      <div class="flex justify-center items-center gap-1">
        <button v-show="urlValidation"
          class="p-1.5 flex justify-center items-center gap-1 rounded-full transition-colors duration-300"
          :class="showURLBtn ? 'text-white bg-sky-500 hover:bg-sky-400' : 'text-sky-200 hover:text-sky-500 active:text-white hover:bg-sky-100 active:bg-sky-500'"
          @click="setShowURLBtnHandler">
          <Iconify icon="ph:cursor-click" class="w-4 h-4"></Iconify>
        </button>
        <button v-show="bookmarkOriginUrl !== props.bookmarkUrl"
          class="p-1.5 text-sky-200 hover:text-sky-500 active:text-white hover:bg-sky-100 active:bg-sky-500 rounded-full transition-colors duration-300"
          @click="resetBookmarkURL">
          <Iconify icon="ph:arrow-counter-clockwise" class="w-4 h-4"></Iconify>
        </button>
      </div>
    </div>
    <div class="space-y-2">
      <div v-show="!showURLBtn || !urlValidation || !props.bookmarkUrl" class="textarea-container shadow"
        :class="urlValidation ? 'border-sky-300 focus-within:border-sky-400 shadow-sky-50' : 'border-red-300 focus-within:border-red-400 shadow-red-50'">
        <textarea ref="bookmarkUrlDOM" name="bookmark url" id="bookmark-url-textarea" placeholder="请输入书签的链接地址"
          :class="urlValidation ? 'text-sky-600 placeholder:text-sky-200' : 'text-red-600'" :value="bookmarkUrl"
          @input="urlInputHandler"></textarea>
      </div>

      <div v-if="showURLBtn && urlValidation && urlObj" class="rounded-md shadow shadow-sky-200">
        <div
          class="url-btn-container p-2 flex justify-center items-center gap-3 text-xs bg-sky-50/50 border-b border-sky-200 rounded-t-md shadow shadow-sky-100">
          <button class="text-sky-600 hover:text-white bg-sky-200/60 hover:bg-sky-500" @mouseover="hoverTarget = 'host'"
            @mouseout="hoverTarget = ''">
            <Iconify icon="ph:house" class="w-4 h-4"></Iconify>
            <span>Host</span>
          </button>

          <button v-if="urlObj.pathname" class="group text-red-500 hover:text-white bg-red-100 hover:bg-red-500"
            @mouseover="hoverTarget = 'path'" @mouseout="hoverTarget = ''" @click="setBookmarkURL('path')">
            <Iconify icon="ph:broom" class="hidden group-hover:inline-block w-4 h-4"></Iconify>
            <Iconify icon="ph:path" class="group-hover:hidden w-4 h-4"></Iconify>
            <span>Path</span>
          </button>

          <button v-if="urlObj.search" class="group text-red-500 hover:text-white bg-red-100 hover:bg-red-500"
            @mouseover="hoverTarget = 'search'" @mouseout="hoverTarget = ''" @click="setBookmarkURL('search')">
            <Iconify icon="ph:broom" class="hidden group-hover:inline-block w-4 h-4"></Iconify>
            <Iconify icon="ph:magnifying-glass" class="group-hover:hidden w-4 h-4"></Iconify>
            <span>Search</span>
          </button>

          <button v-if="urlObj.hash" class="group text-red-500 hover:text-white bg-red-100 hover:bg-red-500"
            @mouseover="hoverTarget = 'hash'" @mouseout="hoverTarget = ''" @click="setBookmarkURL('hash')">
            <Iconify icon="ph:broom" class="hidden group-hover:inline-block w-4 h-4"></Iconify>
            <Iconify icon="ph:hash" class="group-hover:hidden w-4 h-4"></Iconify>
            <span>Hash</span>
          </button>
        </div>
        <div class="url-content-container w-full max-h-[450px] overflow-y-auto px-4 py-6 flex justify-start items-start rounded-b-md">
          <code class="max-w-full px-1 py-0.5 flex flex-wrap justify-start items-center gap-1 text-xs font-mono">
            <!-- Host -->
            <span class="url-snippet flex flex-wrap justify-center items-center text-sky-600 border-sky-300" :class="hoverTarget === 'host' ? 'bg-sky-100' : ''">
              <span>{{ `${urlObj.protocol}//` }}</span>
              <span v-if="urlObj.username && urlObj.password">{{ `${urlObj.username}:${urlObj.password}@` }}</span>
              <span>{{ urlObj.hostname }}</span>
              <span v-if="urlObj.port">{{ `:${urlObj.port}` }}</span>
            </span>

            <!-- Path -->
            <span v-if="urlObj.pathname" class="url-snippet" :class="hoverTarget === 'path' ? 'text-red-600 line-through bg-red-100 border-red-300' : 'text-sky-600 border-sky-300'">{{ urlObj.pathname }}</span>

            <!-- Search -->
            <span v-if="urlObj.search" class="url-snippet" :class="(hoverTarget === 'path' || hoverTarget === 'search') ? 'text-red-600 line-through bg-red-100 border-red-300' : 'text-sky-600 border-sky-300'">{{ urlObj.search }}</span>

            <!-- Hash -->
            <span v-if="urlObj.hash" class="url-snippet" :class="(hoverTarget === 'path' || hoverTarget === 'search' || hoverTarget === 'hash') ? 'text-red-600 line-through bg-red-100 border-red-300' : 'text-sky-600 border-sky-300'">{{ `${urlObj.hash}` }}</span>
          </code>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
#bookmark-url-textarea {
  &::-webkit-scrollbar-thumb {
    background-color: #bfdbfe;
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: #60a5fa;
  }
}

.url-btn-container {
  button {
    @apply px-2.5 py-1.5 flex justify-center items-center gap-1 rounded-md transition-colors duration-300;
  }
}

.url-content-container {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #bfdbfe;
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: #60a5fa;
  }
}

.url-snippet {
  @apply max-w-full px-1 py-0.5 text-sm font-mono break-words border rounded transition-colors duration-300;
}
</style>