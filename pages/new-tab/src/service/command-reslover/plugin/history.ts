import { getDefaultIconUrl } from '@/lib/url'
import type { ICommandReslover, ICommandResult } from './protocol'
import moment from 'moment'

import { historySuggestStorage } from '@extension/storage'

function convertHistoryItemToCommandResult(item: chrome.history.HistoryItem): ICommandResult {
  const formatLastDate = moment(item.lastVisitTime).format('MM/DD HH:mm')
  return {
    id: item.id,
    title: `${item.title!}`,
    description: `${formatLastDate} ${item.url!}`,
    iconUrl: getDefaultIconUrl(item.url!),
    onSelect: () => {
      chrome.tabs.update({ url: item.url })
    },
  }
}

export const historyReslover: ICommandReslover = {
  name: 'history',
  settings: {
    active: true,
    activeKey: 'h',
  },
  properties: {
    label: 'History',
  },
  resolve: async params => {
    if (params.query.length === 0)
      return (await historySuggestStorage.get()).slice(0, 10).map(convertHistoryItemToCommandResult)
    const result = await chrome.history.search({
      text: params.query,
      maxResults: 10,
      startTime: moment().add(-2, 'week').valueOf(),
    })
    if (result.length === 0) return null
    return result.map(convertHistoryItemToCommandResult)
  },
}
