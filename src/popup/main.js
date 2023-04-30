import { createApp } from 'vue';
// eslint-disable-next-line import/no-unresolved
import '@/style.css';
import { useGetTabInfo } from '@/composables/getTabInfo';
import { useCheckBookmarkState } from '@/composables/checkBookmarkState';
import App from './App.vue';

// the tab info
let tabTitle = '';
let tabUrl = '';

// the bookmark info (if the tab has bookmarked)
// let bookmarkState = false;
let bookmarkId = null;
let bookmarkTitle = '';
let bookmarkUrl = '';
let bookmarkFolderId = null;

// the similar bookmarks
let similarBookmarks = [];

// get information from tab or recent created bookmark
const setBookmarkParameters = async () => {
  const resultForTab = await useGetTabInfo();
  tabTitle = resultForTab.tabTitle;
  tabUrl = resultForTab.tabUrl;

  // check the tab url bookmark state
  const resultForBookmark = await useCheckBookmarkState(tabUrl);

  if (resultForBookmark) {
    // if the tab has already bookmarked
    // bookmarkState = true;

    bookmarkId = resultForBookmark.id;
    bookmarkTitle = resultForBookmark.title;
    bookmarkUrl = resultForBookmark.url;
    bookmarkFolderId = resultForBookmark.parentId;
  }
  // get the similar bookmarks
  const targetUrl = bookmarkUrl || tabUrl;
  if(targetUrl) {
    try {
      const urlObj = new URL(targetUrl);
      const urlHostname = urlObj.hostname;
      if(urlHostname) {
        const nodesArr = await chrome.bookmarks.search(urlHostname)
        similarBookmarks = nodesArr.filter(node => {
          // only get the bookmark node (with url)
          // and not the current bookmark (if the tab has bookmarked already)
          return node.url && node.id !== bookmarkId;
        })
        similarBookmarks.sort((a, b) => {
          if(a.url.length < b.url.length) {
            return -1
          } else if(a.url.length > b.url.length) {
            return 1
          } else {
            return 0
          }
        })
      }
    } catch (error) {
      console.log(error);
    }
  }
}

setBookmarkParameters().then(() => {
  createApp(App, {
    tabTitle,
    tabUrl,
    // bookmarkState,
    bookmarkId,
    bookmarkTitle,
    bookmarkUrl,
    bookmarkFolderId,
    similarBookmarks
  }).mount('#app');
})
