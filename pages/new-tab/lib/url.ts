// export function getDefaultIconUrl(srcUrl: string): string {
//   const url = new URL(srcUrl)
//   return `${url.origin}/favicon.ico`
// }
export function getDefaultIconUrl(u: string): string {
  const url = new URL(chrome.runtime.getURL('/_favicon/'))
  url.searchParams.set('pageUrl', u)
  url.searchParams.set('size', '128')
  return url.toString()
}
