import { StorageEnum } from '../base/enums'
import { createStorage } from '../base/base'
import type { BaseStorage, QuickUrlItem } from '../base/types'
import { getIconUrlFromWebsit } from '../utils'

export type QuickUrlItemsStorage = BaseStorage<QuickUrlItem[]>

export interface BasicUrlItemsStorageFunc<T extends QuickUrlItem> {
  add: (item: T) => Promise<void>
  removeAt: (index: number) => Promise<void>
  removeById: (id: string) => Promise<void>
  sortItemsByIds: (ids: string[]) => Promise<void>
  putById: (id: string, val: T) => Promise<void>
  updatePart: (startIndex: number, vals: T[]) => Promise<void>
}

const storage = createStorage<QuickUrlItem[]>('quick-url-item-storage-key', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
})

async function maybeFillIconUrl(val: QuickUrlItem) {
  if (!val.iconUrl) {
    val.iconUrl = await getIconUrlFromWebsit(val.url)
  }
}

export function generateBasicUrlItemStorage<T extends QuickUrlItem>(
  targetStorage: BaseStorage<T[]>,
): BasicUrlItemsStorageFunc<T> {
  return {
    add: async (item: T) => {
      //await maybeFillIconUrl(item)
      targetStorage.set(value => [...value, item])
    },
    removeAt: async (index: number) => {
      targetStorage.set(value => value.filter((val, idx) => idx !== index))
    },
    removeById: async (id: string) => {
      targetStorage.set(value => value.filter(val => val.id !== id))
    },
    sortItemsByIds: async (ids: string[]) => {
      const idAndPriorityMapping = new Map(ids.map((val, idx) => [val, idx]))
      targetStorage.set(values =>
        values.sort(
          (lv, rv) => (idAndPriorityMapping.get(lv.id) ?? 10000) - (idAndPriorityMapping.get(rv.id) ?? 10000),
        ),
      )
    },
    putById: async (id, val) => {
      //await maybeFillIconUrl(val)
      targetStorage.set(items => items.map(it => (it.id === id ? val : it)))
    },
    updatePart: async (startIndex, vals) => {
      const items = await targetStorage.get()
      items.splice(startIndex, vals.length, ...vals)
      targetStorage.set(items)
    },
  }
}

export const quickUrlItemsStorage: QuickUrlItemsStorage & BasicUrlItemsStorageFunc<QuickUrlItem> = {
  ...storage,
  ...generateBasicUrlItemStorage(storage),
}
