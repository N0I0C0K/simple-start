const ICON_URL_REG_MATCH = /<link[^>]*rel="[^>]*?icon[^>]*?"[^>]*?href="([^> ]*?)"[^>]*?>/gm

export async function getIconUrlFromWebsit(websitUrl: string): Promise<string> {
  const url = new URL(websitUrl)
  const res = await fetch(url)
  const rawHtml = await res.text()
  const matchRes = ICON_URL_REG_MATCH.exec(rawHtml)
  console.log(matchRes)
  const iconUrl = matchRes === null ? '/favicon.ico' : matchRes[1]
  return iconUrl.startsWith('/') ? `${url.origin}${iconUrl}` : iconUrl
}
