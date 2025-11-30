import type { ICommandResolver } from './protocol'
import { Search } from 'lucide-react'

export const webSearchResolver: ICommandResolver = {
  name: 'web-search',
  settings: {
    priority: 100,
    active: true,
    includeInGlobal: true,
    activeKey: 'g',
  },
  properties: {
    label: 'Search',
  },
  resolve: async params => {
    if (params.query.length === 0) return null
    const query = params.query.startsWith('g ') ? params.query.slice(2) : params.query
    return [
      {
        id: `search-unique-key`,
        title: `Search for "${query}"`,
        description: 'use browser default search engine',
        IconType: Search,
        onSelect: () => {
          chrome.search.query({ text: query, disposition: 'NEW_TAB' })
        },
      },
    ]
  },
}
