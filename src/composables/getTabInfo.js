export async function useGetTabInfo() {
  // get current tab
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  return {
    tabTitle: tab.title,
    tabUrl: tab.url || tab.pendingUrl
  }
}