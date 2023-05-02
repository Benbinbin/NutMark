import { useCheckBookmarkState } from '@/composables/checkBookmarkState'
import { useChangeActionIcon } from '@/composables/changeActionIcon'

// open the introduction page when the extension is installed
chrome.runtime.onInstalled.addListener(({reason}) => {
  if (reason === 'install') {
    chrome.tabs.create({
      url: 'src/introduction/index.html'
    })
  }
});

// watching the active tab change
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const activeTabID = activeInfo.tabId;
  const tab = await chrome.tabs.get(activeTabID);

  const url = tab.url || tab.pendingUrl;

  let bookmarkState = false;
  if (url) {
    const result = await useCheckBookmarkState(url);
    if(result) bookmarkState = true
  }

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

  const url = tab.url || tab.pendingUrl;

  let bookmarkState = false;
  if (url) {
    const result = await useCheckBookmarkState(url);
    if(result) bookmarkState = true
  }

  // change action icon
  await useChangeActionIcon(bookmarkState);
});

// watching tab update
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;

  // when tab update url check the bookmark state
  const { url } = changeInfo;

  let bookmarkState = false
  const result = await useCheckBookmarkState(url);
  if(result) bookmarkState = true

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

  const url = tab.url || tab.pendingUrl;

  let bookmarkState = false
  const result = await useCheckBookmarkState(url);
  if(result) bookmarkState = true

  // change action icon
  await useChangeActionIcon(bookmarkState);
});

// watching bookmark delete
chrome.bookmarks.onRemoved.addListener(async (id, bookmarkNode) => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  const url = tab.url || tab.pendingUrl;

  let bookmarkState = false
  const result = await useCheckBookmarkState(url);
  if (result) bookmarkState = true


  // change action icon
  await useChangeActionIcon(bookmarkState);
});
