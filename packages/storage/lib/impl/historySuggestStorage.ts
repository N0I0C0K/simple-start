import { StorageEnum } from '../base/enums.js'
import { createStorage } from '../base/base.js'
import type { BaseStorage, QuickUrlItem } from '../base/types.js'
import type { QuickUrlItemsStorage, BasicUrlItemsStorageFunc } from './quickUrlStorage.js'
import { generateBasicUrlItemStorage, quickUrlItemsStorage } from './quickUrlStorage.js'
import moment from 'moment'

type HistoryItem = QuickUrlItem & {
  lastVisitTime?: number
  visitCount?: number
}

type HistorySuggestStorage = BaseStorage<HistoryItem[]> &
  BasicUrlItemsStorageFunc<HistoryItem> & {
    refresh(): Promise<void>
  }

const storage = createStorage<HistoryItem[]>('history-suggest-url-item-storage-key', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
})

const basicStorage: QuickUrlItemsStorage & BasicUrlItemsStorageFunc<HistoryItem> = {
  ...storage,
  ...generateBasicUrlItemStorage(storage),
}

export const historySuggestStorage: HistorySuggestStorage = {
  ...basicStorage,
  refresh: async () => {
    const userStorageItems = await quickUrlItemsStorage.get()
    const knownHost = new Set(userStorageItems.map(val => new URL(val.url).host))
    const last30DaysMoment = moment().add(-30, 'd')
    const last30DaysHistory = (
      await chrome.history.search({
        text: '',
        maxResults: 1000,
        startTime: last30DaysMoment.valueOf(),
      })
    ).filter(val => !knownHost.has(new URL(val.url ?? '').host))
    last30DaysHistory.sort((lv, rv) => (rv.visitCount ?? 0) - (lv.visitCount ?? 0))
    const returnHistoryItems: chrome.history.HistoryItem[] = []
    for (const element of last30DaysHistory) {
      const url = new URL(element.url ?? '')
      if (!knownHost.has(url.host)) {
        knownHost.add(url.host)
        returnHistoryItems.push(element)
        if (returnHistoryItems.length >= 50) {
          break
        }
      }
    }

    await basicStorage.set(returnHistoryItems.map(val => convertHistoyItemToUrlItem(val)))
  },
}

function convertHistoyItemToUrlItem(histortyItem: chrome.history.HistoryItem): HistoryItem {
  return {
    id: histortyItem.id,
    title: histortyItem.title ?? 'missing',
    url: histortyItem.url ?? 'missing',
    lastVisitTime: histortyItem.lastVisitTime,
    visitCount: histortyItem.visitCount,
  }
}
