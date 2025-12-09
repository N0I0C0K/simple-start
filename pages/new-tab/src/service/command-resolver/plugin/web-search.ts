import type { ICommandResolver } from './protocol'
import { Search } from 'lucide-react'
import { t } from '@extension/i18n'

export const webSearchResolver: ICommandResolver = {
  settings: {
    priority: 100,
    active: true,
    includeInGlobal: true,
    activeKey: 'g',
  },
  properties: {
    name: t('commandPluginWebSearch'),
    label: t('commandPluginWebSearch'),
    description: t('commandPluginWebSearchDescription'),
  },
  resolve: async params => {
    if (params.query.length === 0) return null
    const query = params.query.startsWith('g ') ? params.query.slice(2) : params.query
    return [
      {
        id: `search-unique-key`,
        title: t('commandPluginWebSearchTitle').replace('{query}', query),
        description: t('commandPluginWebSearchDescription'),
        IconType: Search,
        onSelect: () => {
          chrome.search.query({ text: query, disposition: 'NEW_TAB' })
        },
      },
    ]
  },
}
