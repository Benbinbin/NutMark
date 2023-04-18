// refer to https://developer.chrome.com/docs/extensions/mv3/favicon/
export function useGetFaviconURL(link) {
  console.log(link);
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set("pageUrl", link);
  url.searchParams.set("size", "32");
  return url.toString();
}
