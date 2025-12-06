import { getDefaultIconUrl } from '@/lib/url'
import type { ICommandResolver, ICommandResult } from './protocol'
import { Star } from 'lucide-react'

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

function flattenBookmarks(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  results: chrome.bookmarks.BookmarkTreeNode[] = [],
): chrome.bookmarks.BookmarkTreeNode[] {
  for (const node of nodes) {
    // Only include bookmarks with URLs (not folders)
    if (node.url) {
      results.push(node)
    }
    if (node.children) {
      flattenBookmarks(node.children, results)
    }
  }
  return results
}

function searchBookmarks(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  query: string,
): chrome.bookmarks.BookmarkTreeNode[] {
  const allBookmarks = flattenBookmarks(nodes)
  const lowerQuery = query.toLowerCase()

  return allBookmarks.filter(
    bookmark =>
      bookmark.title.toLowerCase().includes(lowerQuery) || bookmark.url?.toLowerCase().includes(lowerQuery),
  )
}

const ACTIVE_KEY = 'b'

export const bookmarksResolver: ICommandResolver = {
  name: 'bookmarks',
  settings: {
    active: true,
    activeKey: ACTIVE_KEY,
    priority: 5,
    includeInGlobal: true,
  },
  properties: {
    label: 'Bookmarks',
  },
  resolve: async params => {
    const tree = await chrome.bookmarks.getTree()

    // Strip the activeKey prefix if present
    let query = params.query
    const activeKeyPrefix = `${ACTIVE_KEY} `
    if (query.startsWith(activeKeyPrefix)) {
      query = query.slice(activeKeyPrefix.length)
    }

    // Return first 10 bookmarks when no query (tree order, not chronological)
    if (query.length === 0) {
      const allBookmarks = flattenBookmarks(tree)
      return allBookmarks.slice(0, 10).map(convertBookmarkToCommandResult)
    }

    const result = searchBookmarks(tree, query)
    if (result.length === 0) return null
    return result.slice(0, 10).map(convertBookmarkToCommandResult)
  },
}
