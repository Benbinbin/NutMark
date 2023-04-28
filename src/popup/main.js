import { createApp } from 'vue';
// eslint-disable-next-line import/no-unresolved
import '@/style.css';
import { useGetTabInfo } from '@/composables/getTabInfo';
import { useCheckBookmarkState } from '@/composables/checkBookmarkState';
import App from './App.vue';

// the tab info
let tabTitle = '';
let tabUrl = '';

// the bookmark origin info (if the tab has bookmarked)
let bookmarkState = false;
let bookmarkId = null;
let bookmarkTitleOrigin = '';
let bookmarkUrlOrigin = '';
let bookmarkFolderIdOrigin = '';

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
    bookmarkState = true;

    bookmarkId = resultForBookmark.id;
    bookmarkTitleOrigin = resultForBookmark.title;
    bookmarkUrlOrigin = resultForBookmark.url;
    bookmarkFolderIdOrigin = resultForBookmark.parentId;
  }
  // get the similar bookmarks
  const targetUrl = bookmarkUrlOrigin || tabUrl;
  if(targetUrl) {
    try {
      const urlObj = new URL(targetUrl);
      const urlHostname = urlObj.hostname;
      if(urlHostname) {
        const nodesArr = await chrome.bookmarks.search(urlHostname)
        similarBookmarks = nodesArr.filter(node => {
          return node.url && (node.url !== targetUrl)
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
    bookmarkState,
    bookmarkId,
    bookmarkTitleOrigin,
    bookmarkUrlOrigin,
    bookmarkFolderIdOrigin,
    similarBookmarks
  }).mount('#app');
})
