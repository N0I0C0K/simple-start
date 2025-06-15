import type { ICommandReslover } from './protocol'

export const tabSearchReslover: ICommandReslover = {
  name: 'tabs',
  settings: {
    priority: 0,
    active: true,
  },
  properties: {
    label: 'Tabs',
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
