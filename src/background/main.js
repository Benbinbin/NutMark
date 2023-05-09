import { useCheckBookmarkState } from '@/composables/checkBookmarkState'
import { useChangeActionIcon } from '@/composables/changeActionIcon'


/**
 * show page after install extension
 */
// open the introduction page when the extension is installed
chrome.runtime.onInstalled.addListener(({reason}) => {
  if (reason === 'install') {
    chrome.tabs.create({
      url: 'https://nutmark.benbinbin.com'
    })
  }
});

/**
 * change action icon
 */
const checkActiveWindowTabState = async () => {
  // get the active tab of current focus window
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
}

// watching the active tab change
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await checkActiveWindowTabState();
});

// watching the window focus change
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await checkActiveWindowTabState();
});

// watching tab (url) update
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;

  await checkActiveWindowTabState();
});

// watching bookmark create
chrome.bookmarks.onCreated.addListener(async (id, bookmarkNode) => {
  await checkActiveWindowTabState();
});

// watching bookmark delete
chrome.bookmarks.onRemoved.addListener(async (id, bookmarkNode) => {
  await checkActiveWindowTabState();
});
