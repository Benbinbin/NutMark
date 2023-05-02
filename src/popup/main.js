import { createApp } from 'vue';
// eslint-disable-next-line import/no-unresolved
import '@/style.css';
import { useGetTabInfo } from '@/composables/getTabInfo';
import { useCheckBookmarkState } from '@/composables/checkBookmarkState';
import { useGetTreeId } from '@/composables/getTreeId'
import App from './App.vue';

// the tab info
let tabTitle = '';
let tabUrl = '';

// the bookmark info (if the tab has bookmarked)
// let bookmarkState = false;
let bookmarkId = null;
let bookmarkTitle = '';
let bookmarkUrl = '';
// init value is "1"
// this id stand for the "Bookmarks bar"/「书签栏」 directory
let bookmarkFolderId = '1';
// init value is "0"
// this id stand for the root folder
let nodeTreeId = '0';

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
    bookmarkId = resultForBookmark.id;
    bookmarkTitle = resultForBookmark.title;
    bookmarkUrl = resultForBookmark.url;
    bookmarkFolderId = resultForBookmark.parentId;
  } else {
    // if the tab doesn't bookmark
    // get recent bookmark to set folder
    const recentBookmarkArr = await chrome.bookmarks.getRecent(1);

    if (recentBookmarkArr.length > 0) {
      // if there is a bookmark created recently
      const recentBookmark = recentBookmarkArr[0];
      bookmarkFolderId = recentBookmark.parentId;
    } else {
      // if there isn't any bookmarks created recently
      // (when this is a brand new browser)
      // set the selected folder as the first children node
      // 根目录下的第一个子文件夹一般就是「书签栏」
      bookmarkFolderId = '1';
      // and the node tree will be start at the root node
    }
  }

  nodeTreeId = await useGetTreeId(bookmarkFolderId)

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
    bookmarkId,
    bookmarkTitle,
    bookmarkUrl,
    bookmarkFolderId,
    nodeTreeId,
    similarBookmarks
  }).mount('#app');
})
