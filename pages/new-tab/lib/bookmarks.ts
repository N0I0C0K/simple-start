/**
 * Shared bookmark utilities
 */

/**
 * Extract domain from URL
 */
export function getDomainFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return null
  }
}

/**
 * Flatten bookmarks tree into a list
 */
export function flattenBookmarks(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  results: chrome.bookmarks.BookmarkTreeNode[] = [],
): chrome.bookmarks.BookmarkTreeNode[] {
  for (const node of nodes) {
    if (node.url) {
      results.push(node)
    }
    if (node.children) {
      flattenBookmarks(node.children, results)
    }
  }
  return results
}

/**
 * Find bookmarks matching a domain using chrome.bookmarks.search API
 * This is more efficient than fetching the entire tree and filtering
 */
export async function findBookmarksByDomain(domain: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  try {
    // Use chrome.bookmarks.search() to find bookmarks containing the domain
    // This is more efficient than getTree() for large bookmark collections
    const results = await chrome.bookmarks.search({ url: domain })
    
    // Filter to exact domain matches
    return results.filter(bookmark => {
      if (!bookmark.url) return false
      const bookmarkDomain = getDomainFromUrl(bookmark.url)
      return bookmarkDomain === domain
    })
  } catch (error) {
    console.error('Failed to search bookmarks:', error)
    return []
  }
}
