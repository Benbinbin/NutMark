import { createApp } from 'vue';
// eslint-disable-next-line import/no-unresolved
import '@/style.css';
import { useGetTabInfo } from '@/composables/getTabInfo';
import { useCheckBookmarkState } from '@/composables/checkBookmarkState';
import App from './App.vue';

/**
 * set the parameters about bookmark
 */
// the tab info
let tabTitle = '';
let tabUrl = '';

// the bookmark origin info (if the tab has bookmarked)
let bookmarkState = false;
let bookmarkId = null;
let bookmarkTitleOrigin = '';
let bookmarkUrlOrigin = '';
let bookmarkFolderIdOrigin = '';

// folder info
// default selected folder id
// the folder id as the node tree start point
// let bookmarkFolderId = null;
// let nodeTreeId = null;



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
  }).mount('#app');
})
