import { getDefaultIconUrl } from '@/lib/url'
import type { ICommandResolver, ICommandResult } from './protocol'
import { Link } from 'lucide-react'
import { quickUrlItemsStorage } from '@extension/storage'
import type { QuickUrlItem } from '@extension/storage'

function convertQuickLinkToCommandResult(item: QuickUrlItem): ICommandResult {
  return {
    id: item.id,
    title: item.title,
    description: item.url,
    iconUrl: item.iconUrl || getDefaultIconUrl(item.url),
    IconType: item.iconUrl ? undefined : Link,
    onSelect: () => {
      chrome.tabs.update({ url: item.url })
    },
  }
}

function searchQuickLinks(items: QuickUrlItem[], query: string): QuickUrlItem[] {
  const lowerQuery = query.toLowerCase()

  return items.filter(
    item => item.title.toLowerCase().includes(lowerQuery) || item.url.toLowerCase().includes(lowerQuery),
  )
}

const ACTIVE_KEY = 'q'

export const quickLinksResolver: ICommandResolver = {
  name: 'quickLinks',
  settings: {
    active: true,
    activeKey: ACTIVE_KEY,
    priority: 3,
    includeInGlobal: true,
  },
  properties: {
    label: 'Quick Links',
  },
  resolve: async params => {
    const allQuickLinks = await quickUrlItemsStorage.get()

    // Strip the activeKey prefix if present
    let query = params.query
    const activeKeyPrefix = `${ACTIVE_KEY} `
    if (query.startsWith(activeKeyPrefix)) {
      query = query.slice(activeKeyPrefix.length)
    }

    // Return first 10 quick links when no query
    if (query.length === 0) {
      return allQuickLinks.slice(0, 10).map(convertQuickLinkToCommandResult)
    }

    const result = searchQuickLinks(allQuickLinks, query)
    if (result.length === 0) return null
    return result.slice(0, 10).map(convertQuickLinkToCommandResult)
  },
}
