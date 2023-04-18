export async function useCheckBookmarkState(url) {
  console.log(url);
  const nodes = await chrome.bookmarks.search({
    url,
  });
  // console.log(nodes);
  if (nodes.length === 0) {
    // await chrome.storage.local.set({ currentBookmarkId: '' });
    return false;
  }
  // const [node] = nodes;
  // await chrome.storage.local.set({ currentBookmarkId: node.id });
  return true;
};