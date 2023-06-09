export async function useCheckBookmarkState(url) {
  const nodes = await chrome.bookmarks.search({
    url,
  });
  if (nodes.length === 0) {
    return false;
  }
  const bookmark = nodes[0];
  return bookmark;
};