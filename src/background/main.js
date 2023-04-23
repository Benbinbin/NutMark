import { useCheckBookmarkState } from '@/composables/checkBookmarkState'
import { useChangeActionIcon } from '@/composables/changeActionIcon'

// let activeTabID = NaN;

// watching the active tab change
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const activeTabID = activeInfo.tabId;
  const tab = await chrome.tabs.get(activeTabID);
  // console.log(tab);
  const url = tab.url || tab.pendingUrl;

  let bookmarkState = false;
  if (url) {
    const result = await useCheckBookmarkState(url);
    if(result) bookmarkState = true
  }

  // set tab bookmark state
  // await chrome.storage.local.set({ bookmarkState });

  // change action icon
  await useChangeActionIcon(bookmarkState);
});

// watching the window focus change
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab) return;

  // console.log(tab);

  const url = tab.url || tab.pendingUrl;

  let bookmarkState = false;
  if (url) {
    const result = await useCheckBookmarkState(url);
    if(result) bookmarkState = true
  }

  // set tab bookmark state
  // await chrome.storage.local.set({ bookmarkState });

  // change action icon
  await useChangeActionIcon(bookmarkState);
});

// watching tab update
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // if (tabId !== activeTabID || !changeInfo.url) return;
  if (!changeInfo.url) return;

  // console.log(tab);

  // when tab update url check the bookmark state
  const { url } = changeInfo;

  let bookmarkState = false
  const result = await useCheckBookmarkState(url);
  if(result) bookmarkState = true

  // set tab bookmark state
  // await chrome.storage.local.set({
  //   bookmarkState,
  // });

  // change action icon
  await useChangeActionIcon(bookmarkState);
});

// watching bookmark create
chrome.bookmarks.onCreated.addListener(async (id, bookmarkNode) => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab) return;

  // console.log(tab);

  const url = tab.url || tab.pendingUrl;

  let bookmarkState = false
  const result = await useCheckBookmarkState(url);
  if(result) bookmarkState = true

  // set tab bookmark state
  // await chrome.storage.local.set({ bookmarkState });

  // change action icon
  await useChangeActionIcon(bookmarkState);
});

// watching bookmark delete
chrome.bookmarks.onRemoved.addListener(async (id, bookmarkNode) => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  // console.log(tab);

  const url = tab.url || tab.pendingUrl;

  let bookmarkState = false
  const result = await useCheckBookmarkState(url);
  if (result) bookmarkState = true

  // set tab bookmark state
  // await chrome.storage.local.set({ bookmarkState });

  // change action icon
  await useChangeActionIcon(bookmarkState);
});
