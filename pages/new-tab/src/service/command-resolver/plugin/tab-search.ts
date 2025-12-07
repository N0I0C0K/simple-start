import type { ICommandResolver } from './protocol'
import { t } from '@extension/i18n'

export const tabSearchResolver: ICommandResolver = {
  name: t('commandPluginTabs'),
  settings: {
    priority: 0,
    active: true,
  },
  properties: {
    label: t('commandPluginTabs'),
  },
  resolve: async params => {
    if (params.query.length === 0) return null
    const result = await chrome.tabs.query({
      title: `*${params.query}*`,
    })
    if (result.length === 0) return null
    return result.map(it => {
      return {
        id: it.id!.toString(),
        title: it.title!,
        description: it.url!,
        iconUrl: it.favIconUrl!,
        onSelect: () => {
          chrome.windows.update(it.windowId, {
            focused: true,
          })
          chrome.tabs.update(it.id!, {
            active: true,
          })
        },
      }
    })
  },
}
