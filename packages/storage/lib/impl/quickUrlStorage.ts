import { StorageEnum } from '../base/enums'
import { createStorage } from '../base/base'
import type { BaseStorage, QuickUrlItem } from '../base/types'
import { getIconUrlFromWebsit } from '../utils'

export type QuickUrlItemsStorage = BaseStorage<QuickUrlItem[]>

export interface BasicUrlItemsStorageFunc<T extends { id: string }> {
  add: (item: T) => Promise<void>
  removeAt: (index: number) => Promise<void>
  removeById: (id: string) => Promise<void>
  sortItemsByIds: (ids: string[]) => Promise<void>
  putById: (id: string, val: T) => Promise<void>
  updatePart: (startIndex: number, vals: T[]) => Promise<void>
  moveItem: (oldIndex: number, newIndex: never) => Promise<void>
  moveItemById: (id: string, overId: string) => Promise<void>
}

const storage = createStorage<QuickUrlItem[]>('quick-url-item-storage-key', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
})

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
    moveItem: async (oldIdx: number, newIdx: never) => {
      if (oldIdx === newIdx) {
        return
      }
      const items = await targetStorage.get()
      const moveItems = items.splice(oldIdx, 1)
      if (oldIdx < newIdx) {
        items.splice(newIdx + 1, 0, ...moveItems)
      } else {
        items.splice(newIdx, 0, ...moveItems)
      }
      targetStorage.set(items)
    },
    moveItemById: async (id: string, overId: string) => {
      const items = await targetStorage.get()
      const oldIdx = items.findIndex(val => val.id === id)
      const newIdx = items.findIndex(val => val.id === overId)
      if (oldIdx === newIdx) {
        return
      }
      await targetStorage.set((items)=>{
        const moveItems = items.splice(oldIdx, 1)
        if (oldIdx < newIdx) {
          items.splice(newIdx, 0, ...moveItems)
        } else {
          items.splice(newIdx, 0, ...moveItems)
        }
        return items
      })
    },
  }
}

export const quickUrlItemsStorage: QuickUrlItemsStorage & BasicUrlItemsStorageFunc<QuickUrlItem> = {
  ...storage,
  ...generateBasicUrlItemStorage(storage),
}
