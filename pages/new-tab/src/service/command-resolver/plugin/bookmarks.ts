import { getDefaultIconUrl } from '@/lib/url'
import { flattenBookmarks } from '@/lib/bookmarks'
import type { ICommandResolver, ICommandResult } from '../protocol'
import { Star } from 'lucide-react'
import { t } from '@extension/i18n'

function convertBookmarkToCommandResult(item: chrome.bookmarks.BookmarkTreeNode): ICommandResult {
  return {
    id: item.id,
    title: item.title,
    description: item.url,
    iconUrl: item.url ? getDefaultIconUrl(item.url) : undefined,
    IconType: item.url ? undefined : Star,
    onSelect: () => {
      if (item.url) {
        chrome.tabs.update({ url: item.url })
      }
    },
  }
}

function searchBookmarks(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  query: string,
): chrome.bookmarks.BookmarkTreeNode[] {
  const allBookmarks = flattenBookmarks(nodes)
  const lowerQuery = query.toLowerCase()

  return allBookmarks.filter(
    bookmark => bookmark.title.toLowerCase().includes(lowerQuery) || bookmark.url?.toLowerCase().includes(lowerQuery),
  )
}

const ACTIVE_KEY = 'b'

export const bookmarksResolver: ICommandResolver = {
  settings: {
    active: true,
    activeKey: ACTIVE_KEY,
    priority: 5,
    includeInGlobal: true,
  },
  properties: {
    name: 'bookmarks',
    displayName: t('commandPluginBookmarks'),
    description: t('commandPluginBookmarksDescription'),
    icon: Star,
  },
  resolve: async params => {
    const tree = await chrome.bookmarks.getTree()

    // Return first 10 bookmarks when no query (tree order, not chronological)
    if (params.query.length === 0) {
      const allBookmarks = flattenBookmarks(tree)
      return allBookmarks.slice(0, 10).map(convertBookmarkToCommandResult)
    }

    const result = searchBookmarks(tree, params.query)
    if (result.length === 0) return null
    return result.slice(0, 10).map(convertBookmarkToCommandResult)
  },
}
