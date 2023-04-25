<script setup>
import { onMounted, ref } from 'vue';
import { Icon as Iconify } from '@iconify/vue'

// three state types
// * entering
// * waiting
// * solved
const searchState = ref('waiting')

const queryStr = ref('')
const nodesArr = ref([])

let queryStrInputTimer = null;
const queryStrInputHandler = (event) => {
  console.log(event);
  searchState.value = 'searching'
  if(queryStrInputTimer) clearTimeout(queryStrInputTimer)

    queryStrInputTimer = setTimeout(async () => {
      if(queryStr.value) {
        nodesArr.value = await chrome.bookmarks.search(queryStr.value)

        // console.log(result);
        // nodesArr.value = result
        console.log(nodesArr.value);

        searchState.value = 'solved'
      } else {
        searchState.value = 'waiting'
      }
    }, 500)
}

const inputDOM = ref(null)
onMounted(() => {
  if(inputDOM.value) {
    inputDOM.value.focus()
  }
})
const focusInputHandler = () => {
  console.log(inputDOM.value);
  if(inputDOM.value) {
    inputDOM.value.focus()
  }
}
</script>

<template>
  <div class="rounded-md shadow shadow-orange-100">
    <!-- header -->
    <div class="px-4 py-1.5 bg-orange-50/50 focus-within:bg-orange-50 border-b border-orange-200 focus-within:border-orange-300 rounded-t-md shadow shadow-orange-50 transition-colors duration-300">
      <input ref="inputDOM" type="text" name="search bookmark node" id="search-bookmark-node" placeholder="请输入搜索内容" class="w-full py-0.5 text-sm text-orange-600 placeholder:text-orange-200 focus:outline-none bg-transparent" v-model="queryStr" @input="queryStrInputHandler">
    </div>
    <!-- result -->
    <div class="flex justify-center items-center">
      <button v-show="searchState === 'waiting'" class="w-full px-4 py-8 flex flex-col justify-center items-center gap-2 text-orange-300 hover:text-orange-400 transition-colors duration-300"
      @click="focusInputHandler">
        <Iconify icon="fluent:text-t-28-filled" class="w-10 h-10"></Iconify>
        <span class="text-sm">Type to Search</span>
      </button>
      <div v-show="searchState === 'searching'" class="px-4 py-8 flex flex-col justify-center items-center gap-2 text-orange-400">
        <Iconify icon="fluent:slide-search-28-filled" class="w-10 h-10 animate-bounce"></Iconify>
        <span class="text-sm">Searching</span>
      </div>
      <div v-show="searchState === 'solved' && nodesArr.length === 0" class="px-4 py-8 flex flex-col justify-center items-center gap-2 text-red-400">
        <Iconify icon="fluent:mail-inbox-dismiss-28-filled" class="w-10 h-10"></Iconify>
        <span class="text-sm">Oops! Empty Entry</span>
      </div>
      <ul v-if="nodesArr.length>0">
        <li v-for="node in nodesArr" >
          {{ node.title }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>

</style>