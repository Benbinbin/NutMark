/**
 * i18n
 */
export function useGetTranslation(title) {
  return chrome.i18n.getMessage(title)
}