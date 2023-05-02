/**
 * get the folder id for the node tree based on a given folder id
 */
export async function useGetTreeId(folderId) {
  const resultForFolderNode = await chrome.bookmarks.get(folderId);
  const folderNode = resultForFolderNode[0];

  let targetId;
  if (folderNode.parentId) {
    // if the folder node has parent folder
    targetId = folderNode.parentId;
  } else {
    // if the folder node doesn't have parent folder
    // (when the folder is the root folder)
    // then set the node tree id as this folder
    targetId = folderNode.id;
  }
  return targetId;
}