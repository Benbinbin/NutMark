
/**
 * change action icon
 */
export async function useChangeActionIcon(state = false) {
  let iconsPath = {
    "16": "src/assets/icons/nut-unmark-16x16.png",
    "32": "src/assets/icons/nut-unmark-32x32.png",
    "48": "src/assets/icons/nut-unmark-48x48.png",
    "128": "src/assets/icons/nut-unmark-128x128.png"
  }

  if (state) {
    iconsPath = {
      "16": "src/assets/icons/nut-mark-16x16.png",
      "32": "src/assets/icons/nut-mark-32x32.png",
      "48": "src/assets/icons/nut-mark-48x48.png",
      "128": "src/assets/icons/nut-mark-128x128.png"
    }
  }

  await chrome.action.setIcon({
    path: iconsPath
  });
};